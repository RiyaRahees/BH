import pool from '../../config/db.js';
import { getEffectivePlan } from '../../utils/planUtils.js';
import { isOnline } from '../../utils/onlineTracker.js';
import crypto from 'crypto';

// --- Encryption Setup ---
const ALGORITHM = 'aes-256-cbc';
const getEncryptionKey = () => {
  const secret = process.env.CHAT_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || 'default_fallback_secret_key_12345';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

const encryptMessage = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `ENC:${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback to plain text if encryption fails
  }
};

const decryptMessage = (encryptedData) => {
  try {
    if (!encryptedData || !encryptedData.startsWith('ENC:')) {
      return encryptedData; // Return as plain text if not encrypted
    }
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    
    const iv = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Message could not be decrypted';
  }
};

// Helper to resolve user ID or profile_id to user record
const resolveUser = async (idOrProfileId) => {
  if (!idOrProfileId) return null;
  const isNumeric = !isNaN(Number(idOrProfileId));
  let query = 'SELECT id, profile_id, full_name, gender, IF(photo_1_status = "APPROVED", photo_1, NULL) as photo_1, plan FROM user_registration WHERE ';
  query += isNumeric ? 'id = ? OR profile_id = ?' : 'profile_id = ?';
  const params = isNumeric ? [Number(idOrProfileId), String(idOrProfileId)] : [String(idOrProfileId)];
  
  const [users] = await pool.query(query, params);
  return users[0] || null;
};

// 1. Get all active conversations for the logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Query distinct partners who exchanged messages with current user
    const [rows] = await pool.query(`
      SELECT 
        u.id, 
        u.profile_id, 
        u.full_name AS name, 
        u.gender, 
        IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) as photo_1,
        u.is_online,
        m.message AS lastMessage,
        m.created_at AS lastTime,
        m.sender_id,
        (
          SELECT COUNT(*) 
          FROM bm_chat_messages 
          WHERE sender_id = u.id AND receiver_id = ? AND read_status = FALSE
        ) AS unread
      FROM (
        SELECT 
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id,
          MAX(id) AS max_msg_id
        FROM bm_chat_messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY partner_id
      ) latest
      JOIN bm_chat_messages m ON m.id = latest.max_msg_id
      JOIN user_registration u ON u.id = latest.partner_id
      ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId]);

    const defaultAvatarFemale = 'https://www.w3schools.com/howto/img_avatar2.png';
    const defaultAvatarMale = 'https://www.w3schools.com/howto/img_avatar.png';

    const conversations = rows.map((row) => {
      const isPhotoValid = row.photo_1 && row.photo_1.includes('/uploads/');
      const image = isPhotoValid ? row.photo_1 : (row.gender === 'Female' ? defaultAvatarFemale : defaultAvatarMale);

      // Format time string
      const msgDate = new Date(row.lastTime);
      const now = new Date();
      let timeStr = 'Now';

      if (now.toDateString() === msgDate.toDateString()) {
        timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeStr = msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      const userIsOnline = isOnline(row.profile_id) || isOnline(row.id);

      return {
        id: row.id,
        profileId: row.profile_id || String(row.id),
        name: row.name,
        gender: row.gender,
        image,
        lastMessage: decryptMessage(row.lastMessage),
        lastTime: timeStr,
        unread: Number(row.unread || 0),
        online: Boolean(userIsOnline)
      };
    });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// 2. Get message history with a specific user and mark unread as read
export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    const partner = await resolveUser(otherUserId);
    if (!partner) {
      return res.status(404).json({ error: 'User not found' });
    }

    const partnerId = partner.id;

    // Mark unread messages sent by partner to current user as read
    await pool.query(`
      UPDATE bm_chat_messages 
      SET read_status = TRUE 
      WHERE sender_id = ? AND receiver_id = ? AND read_status = FALSE
    `, [partnerId, currentUserId]);

    // Fetch messages between current user and partner
    const [rows] = await pool.query(`
      SELECT id, sender_id, receiver_id, message AS text, read_status, created_at
      FROM bm_chat_messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [currentUserId, partnerId, partnerId, currentUserId]);

    const messages = rows.map((msg) => {
      const msgDate = new Date(msg.created_at);
      const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: msg.id,
        from: msg.sender_id === currentUserId ? 'me' : 'them',
        text: decryptMessage(msg.text),
        time: timeStr,
        createdAt: msg.created_at,
        isRead: Boolean(msg.read_status)
      };
    });

    const defaultAvatar = partner.gender === 'Female' 
      ? 'https://www.w3schools.com/howto/img_avatar2.png'
      : 'https://www.w3schools.com/howto/img_avatar.png';
      
    const image = partner.photo_1 && partner.photo_1.includes('/uploads/') ? partner.photo_1 : defaultAvatar;

    res.status(200).json({
      success: true,
      partner: {
        id: partner.id,
        profileId: partner.profile_id,
        name: partner.full_name,
        gender: partner.gender,
        image
      },
      messages
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// 3. Send a message to a user
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { receiverId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const partner = await resolveUser(receiverId);
    if (!partner) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    const targetUserId = partner.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }

    // Check if conversation already exists between the two users
    const [existingMsgs] = await pool.query(`
      SELECT COUNT(*) AS count 
      FROM bm_chat_messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `, [currentUserId, targetUserId, targetUserId, currentUserId]);

    const hasExistingConversation = existingMsgs[0].count > 0;

    // Check user plan if NO conversation exists yet
    if (!hasExistingConversation) {
      // Fetch latest plan for current user
      const [currentUserRows] = await pool.query('SELECT plan, is_free_trial_claimed, subscription_start_date, subscription_expiry_date, created_at FROM user_registration WHERE id = ?', [currentUserId]);
      const userPlan = getEffectivePlan(currentUserRows[0]);

      const allowedPlans = ['GOLD', 'PLATINUM', 'DIAMOND'];
      if (!allowedPlans.includes(userPlan)) {
        return res.status(403).json({
          error: 'Upgrade to Gold plan or higher to initiate new conversations.',
          requiresUpgrade: true
        });
      }
    }

    // Encrypt message and insert into database
    const encryptedMessageText = encryptMessage(message.trim());
    const [result] = await pool.query(`
      INSERT INTO bm_chat_messages (sender_id, receiver_id, message)
      VALUES (?, ?, ?)
    `, [currentUserId, targetUserId, encryptedMessageText]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    res.status(201).json({
      success: true,
      message: {
        id: result.insertId,
        from: 'me',
        text: message.trim(),
        time: timeStr,
        createdAt: now,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// 4. Check if user is eligible to chat with target user
export const checkChatEligibility = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.params;

    const partner = await resolveUser(targetUserId);
    if (!partner) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetId = partner.id;

    // Check if prior conversation exists
    const [existingMsgs] = await pool.query(`
      SELECT COUNT(*) AS count 
      FROM bm_chat_messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `, [currentUserId, targetId, targetId, currentUserId]);

    const hasExistingConversation = existingMsgs[0].count > 0;

    if (hasExistingConversation) {
      return res.status(200).json({ canChat: true, hasExistingConversation: true, requiresUpgrade: false });
    }

    // Fetch user plan with all subscription attributes
    const [userRows] = await pool.query('SELECT plan, is_free_trial_claimed, subscription_start_date, subscription_expiry_date, created_at FROM user_registration WHERE id = ?', [currentUserId]);
    const userPlan = getEffectivePlan(userRows[0]);
    const allowedPlans = ['GOLD', 'PLATINUM', 'DIAMOND'];

    const canInitiate = allowedPlans.includes(userPlan);

    res.status(200).json({
      canChat: canInitiate,
      hasExistingConversation: false,
      requiresUpgrade: !canInitiate
    });
  } catch (error) {
    console.error('Check Eligibility Error:', error);
    res.status(500).json({ error: 'Failed to check chat eligibility' });
  }
};
