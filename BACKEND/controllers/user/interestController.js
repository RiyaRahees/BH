import pool from '../../config/db.js';

const getSenderProfileId = async (req) => {
  if (req.session?.profileId) return req.session.profileId;
  if (req.user?.profile_id) return req.user.profile_id;
  if (req.user?.id) {
    const [rows] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [req.user.id]);
    if (rows.length > 0) return rows[0].profile_id;
  }
  return null;
};

// Send or Return Interest
export const sendInterest = async (req, res) => {
  try {
    const senderId = await getSenderProfileId(req);
    const { profileId: receiverId } = req.params;

    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized user session' });
    }

    if (!receiverId || senderId.toLowerCase() === receiverId.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot send interest to yourself' });
    }

    // Check if reverse interest exists (Receiver sent interest to Sender)
    const [reverseExisting] = await pool.query(
      `SELECT * FROM bm_interests WHERE LOWER(sender_id) = LOWER(?) AND LOWER(receiver_id) = LOWER(?)`,
      [receiverId, senderId]
    );

    if (reverseExisting.length > 0) {
      // Reverse interest exists! Accept it (Return Interest)
      await pool.query(
        `UPDATE bm_interests SET status = 'accepted' WHERE id = ?`,
        [reverseExisting[0].id]
      );

      return res.json({
        message: 'Return Interest Sent! You are now mutually connected.',
        status: 'accepted',
        isMutual: true,
        interestId: reverseExisting[0].id
      });
    }

    // Check if sender already sent interest to receiver
    const [existing] = await pool.query(
      `SELECT * FROM bm_interests WHERE LOWER(sender_id) = LOWER(?) AND LOWER(receiver_id) = LOWER(?)`,
      [senderId, receiverId]
    );

    if (existing.length > 0) {
      return res.json({
        message: 'Interest already sent',
        status: existing[0].status,
        interestId: existing[0].id
      });
    }

    // Insert new pending interest
    const [result] = await pool.query(
      `INSERT INTO bm_interests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')`,
      [senderId, receiverId]
    );

    return res.json({
      message: 'Express interest sent successfully!',
      status: 'pending',
      interestId: result.insertId
    });
  } catch (error) {
    console.error('Error sending interest:', error);
    return res.status(500).json({ error: 'Failed to send interest' });
  }
};

// Respond to an interest (Accept / Return Interest or Decline)
export const respondInterest = async (req, res) => {
  try {
    const currentUserId = await getSenderProfileId(req);
    const { interestId, action } = req.body; // action: 'accept' | 'decline'

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized user session' });
    }

    if (!interestId || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    const [result] = await pool.query(
      `UPDATE bm_interests SET status = ? WHERE id = ? AND LOWER(receiver_id) = LOWER(?)`,
      [newStatus, interestId, currentUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Interest request not found or not authorized' });
    }

    return res.json({
      message: action === 'accept' ? 'Return interest sent successfully!' : 'Interest request declined',
      status: newStatus
    });
  } catch (error) {
    console.error('Error responding to interest:', error);
    return res.status(500).json({ error: 'Failed to respond to interest' });
  }
};

// Check Interest Status between current user and target profile
export const checkInterestStatus = async (req, res) => {
  try {
    const currentUserId = await getSenderProfileId(req);
    const { profileId } = req.params;

    if (!currentUserId) {
      return res.json({ status: 'none' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM bm_interests 
       WHERE (LOWER(sender_id) = LOWER(?) AND LOWER(receiver_id) = LOWER(?))
          OR (LOWER(sender_id) = LOWER(?) AND LOWER(receiver_id) = LOWER(?))`,
      [currentUserId, profileId, profileId, currentUserId]
    );

    if (rows.length === 0) {
      return res.json({ status: 'none', isSender: false, isReceiver: false });
    }

    const interest = rows[0];
    const isSender = interest.sender_id.toLowerCase() === currentUserId.toLowerCase();
    const isReceiver = interest.receiver_id.toLowerCase() === currentUserId.toLowerCase();

    return res.json({
      status: interest.status,
      isSender,
      isReceiver,
      interestId: interest.id
    });
  } catch (error) {
    console.error('Error checking interest status:', error);
    return res.status(500).json({ error: 'Failed to check interest status' });
  }
};

// Get list of interests (Received, Sent, Mutual/Accepted)
export const getInterests = async (req, res) => {
  try {
    const currentUserId = await getSenderProfileId(req);
    const { type = 'received' } = req.query; // 'received', 'sent', 'accepted' / 'mutual'

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized user session' });
    }

    let query = '';
    let params = [];

    if (type === 'received') {
      query = `
        SELECT i.id AS interest_id, i.status, i.created_at AS interest_date,
               u.profile_id, u.full_name AS name, u.gender, u.religion, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) AS photo_1,
               COALESCE(h.age, c.age, m.age, o.age) AS age,
               COALESCE(h.height, c.height, m.height, o.height) AS height,
               COALESCE(h.district, c.district, m.district, o.district) AS district,
               COALESCE(h.place, c.place, m.place, o.place) AS city,
               COALESCE(h.profession, c.profession, m.profession, o.profession) AS profession
        FROM bm_interests i
        JOIN user_registration u ON LOWER(u.profile_id) = LOWER(i.sender_id)
        LEFT JOIN hindus h ON LOWER(h.profile_id) = LOWER(u.profile_id)
        LEFT JOIN christians c ON LOWER(c.profile_id) = LOWER(u.profile_id)
        LEFT JOIN muslims m ON LOWER(m.profile_id) = LOWER(u.profile_id)
        LEFT JOIN others o ON LOWER(o.profile_id) = LOWER(u.profile_id)
        WHERE LOWER(i.receiver_id) = LOWER(?) AND i.status = 'pending'
        ORDER BY i.created_at DESC
      `;
      params = [currentUserId];
    } else if (type === 'sent') {
      query = `
        SELECT i.id AS interest_id, i.status, i.created_at AS interest_date,
               u.profile_id, u.full_name AS name, u.gender, u.religion, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) AS photo_1,
               COALESCE(h.age, c.age, m.age, o.age) AS age,
               COALESCE(h.height, c.height, m.height, o.height) AS height,
               COALESCE(h.district, c.district, m.district, o.district) AS district,
               COALESCE(h.place, c.place, m.place, o.place) AS city,
               COALESCE(h.profession, c.profession, m.profession, o.profession) AS profession
        FROM bm_interests i
        JOIN user_registration u ON LOWER(u.profile_id) = LOWER(i.receiver_id)
        LEFT JOIN hindus h ON LOWER(h.profile_id) = LOWER(u.profile_id)
        LEFT JOIN christians c ON LOWER(c.profile_id) = LOWER(u.profile_id)
        LEFT JOIN muslims m ON LOWER(m.profile_id) = LOWER(u.profile_id)
        LEFT JOIN others o ON LOWER(o.profile_id) = LOWER(u.profile_id)
        WHERE LOWER(i.sender_id) = LOWER(?) AND i.status = 'pending'
        ORDER BY i.created_at DESC
      `;
      params = [currentUserId];
    } else if (type === 'accepted' || type === 'mutual') {
      query = `
        SELECT i.id AS interest_id, i.status, i.updated_at AS interest_date,
               u.profile_id, u.full_name AS name, u.gender, u.religion, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) AS photo_1,
               COALESCE(h.age, c.age, m.age, o.age) AS age,
               COALESCE(h.height, c.height, m.height, o.height) AS height,
               COALESCE(h.district, c.district, m.district, o.district) AS district,
               COALESCE(h.place, c.place, m.place, o.place) AS city,
               COALESCE(h.profession, c.profession, m.profession, o.profession) AS profession,
               (LOWER(i.sender_id) = LOWER(?)) AS is_sent_by_me
        FROM bm_interests i
        JOIN user_registration u ON 
          (LOWER(i.sender_id) = LOWER(?) AND LOWER(u.profile_id) = LOWER(i.receiver_id))
          OR (LOWER(i.receiver_id) = LOWER(?) AND LOWER(u.profile_id) = LOWER(i.sender_id))
        LEFT JOIN hindus h ON LOWER(h.profile_id) = LOWER(u.profile_id)
        LEFT JOIN christians c ON LOWER(c.profile_id) = LOWER(u.profile_id)
        LEFT JOIN muslims m ON LOWER(m.profile_id) = LOWER(u.profile_id)
        LEFT JOIN others o ON LOWER(o.profile_id) = LOWER(u.profile_id)
        WHERE (LOWER(i.sender_id) = LOWER(?) OR LOWER(i.receiver_id) = LOWER(?))
          AND i.status = 'accepted'
        ORDER BY i.updated_at DESC
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId];
    }

    const [interests] = await pool.query(query, params);
    return res.json({ interests });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return res.status(500).json({ error: 'Failed to fetch interests' });
  }
};

// Delete / Cancel interest
export const deleteInterest = async (req, res) => {
  try {
    const currentUserId = await getSenderProfileId(req);
    const { interestId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized user session' });
    }

    const [result] = await pool.query(
      `DELETE FROM bm_interests 
       WHERE id = ? AND (LOWER(sender_id) = LOWER(?) OR LOWER(receiver_id) = LOWER(?))`,
      [interestId, currentUserId, currentUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Interest request not found' });
    }

    return res.json({ message: 'Interest removed successfully' });
  } catch (error) {
    console.error('Error deleting interest:', error);
    return res.status(500).json({ error: 'Failed to delete interest' });
  }
};
