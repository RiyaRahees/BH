import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import { sendNotificationEmail } from '../../utils/emailService.js';

export const updateUserSettings = async (req, res) => {
  const { profileId } = req.params;
  const { email, phone, country_code } = req.body;

  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    let updateFields = [];
    let updateValues = [];
    if (email) {
      updateFields.push('email_address = ?');
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push('mobile_number = ?');
      updateValues.push(phone);
    }
    if (country_code) {
      updateFields.push('country_code = ?');
      updateValues.push(country_code);
    }

    if (updateFields.length === 0) {
       return res.status(400).json({ error: 'No data to update' });
    }

    updateValues.push(profileId);
    
    const [result] = await pool.query(
      `UPDATE user_registration SET ${updateFields.join(', ')} WHERE profile_id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or phone number already in use' });
    }
    res.status(500).json({ error: 'Server error while updating settings' });
  }
};

export const resetPassword = async (req, res) => {
  const { profileId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!profileId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Profile ID, old password, and new password are required' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'New password cannot be the same as the old password' });
    }

    // Fetch user
    const [users] = await pool.query(
      'SELECT id, password FROM user_registration WHERE profile_id = ?',
      [profileId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Incorrect old password', field: 'oldPassword' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in DB
    await pool.query(
      'UPDATE user_registration SET password = ? WHERE profile_id = ?',
      [hashedNewPassword, profileId]
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
};

export const lookupPartner = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(200).json({ success: true, results: [] });
    }

    const searchTerm = `%${query.trim()}%`;
    const exactId = query.trim();

    const [rows] = await pool.query(
      `SELECT 
        profile_id, 
        full_name, 
        gender, 
        religion, 
        district, 
        photo_1, 
        photo_1_status 
       FROM user_registration 
       WHERE (profile_id LIKE ? OR full_name LIKE ?)
       ORDER BY (profile_id = ?) DESC, (full_name LIKE ?) DESC
       LIMIT 8`,
      [searchTerm, searchTerm, exactId, `${query.trim()}%`]
    );

    const results = rows.map(r => ({
      profile_id: r.profile_id,
      full_name: r.full_name,
      gender: r.gender,
      religion: r.religion,
      district: r.district,
      photo: r.photo_1_status === 'APPROVED' && r.photo_1 ? r.photo_1 : (r.photo_1 || null)
    }));

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error looking up partner:', error);
    res.status(500).json({ error: 'Server error looking up partner' });
  }
};

let deletionColumnsEnsured = false;
export const ensureAccountDeletionColumns = async () => {
  if (deletionColumnsEnsured) return;
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM user_registration`);
    const colMap = new Set(cols.map(c => c.Field.toLowerCase()));

    if (!colMap.has('delete_requested_at')) {
      await pool.query(`ALTER TABLE user_registration ADD COLUMN delete_requested_at TIMESTAMP NULL DEFAULT NULL`);
    }
    if (!colMap.has('deactivate_requested_at')) {
      await pool.query(`ALTER TABLE user_registration ADD COLUMN deactivate_requested_at TIMESTAMP NULL DEFAULT NULL`);
    }

    const statusCol = cols.find(c => c.Field.toLowerCase() === 'status');
    if (statusCol && statusCol.Type.toLowerCase().startsWith('enum') && !statusCol.Type.includes('PENDING_DELETE')) {
      await pool.query(`ALTER TABLE user_registration MODIFY COLUMN status VARCHAR(50) DEFAULT 'Active'`);
    }

    deletionColumnsEnsured = true;
  } catch (err) {
    console.warn('[AccountSettings Warning] Ensuring deletion columns:', err.message);
  }
};

let feedbackTableEnsured = false;
export const ensureAccountClosureFeedbackTable = async () => {
  if (feedbackTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_account_closure_feedback (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        profile_id VARCHAR(50) NOT NULL,
        action_type VARCHAR(50) DEFAULT 'DEACTIVATE',
        is_married BOOLEAN DEFAULT FALSE,
        found_via_platform BOOLEAN DEFAULT FALSE,
        partner_profile_id VARCHAR(50) DEFAULT NULL,
        partner_confirmation_status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
        partner_responded_at TIMESTAMP NULL DEFAULT NULL,
        allow_advertisement BOOLEAN DEFAULT FALSE,
        is_featured_for_ads BOOLEAN DEFAULT FALSE,
        marriage_source VARCHAR(100) DEFAULT NULL,
        reason VARCHAR(255) DEFAULT NULL,
        feedback TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        couple_photo_1 VARCHAR(255) NULL DEFAULT NULL,
        couple_photo_2 VARCHAR(255) NULL DEFAULT NULL,
        INDEX idx_profile_id (profile_id),
        INDEX idx_partner_profile_id (partner_profile_id),
        INDEX idx_action_type (action_type)
      )
    `);

    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM bm_account_closure_feedback`);
      const colMap = new Set(cols.map(c => c.Field.toLowerCase()));

      if (!colMap.has('action_type')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN action_type VARCHAR(50) DEFAULT 'DEACTIVATE' AFTER profile_id`);
      }
      if (!colMap.has('is_married')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN is_married BOOLEAN DEFAULT FALSE AFTER action_type`);
      }
      if (!colMap.has('found_via_platform')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN found_via_platform BOOLEAN DEFAULT FALSE AFTER is_married`);
      }
      if (!colMap.has('partner_profile_id')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN partner_profile_id VARCHAR(50) DEFAULT NULL AFTER found_via_platform`);
      }
      if (!colMap.has('partner_confirmation_status')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN partner_confirmation_status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING' AFTER partner_profile_id`);
      }
      if (!colMap.has('partner_responded_at')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN partner_responded_at TIMESTAMP NULL DEFAULT NULL AFTER partner_confirmation_status`);
      }
      if (!colMap.has('allow_advertisement')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN allow_advertisement BOOLEAN DEFAULT FALSE AFTER partner_profile_id`);
      }
      if (!colMap.has('is_featured_for_ads')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN is_featured_for_ads BOOLEAN DEFAULT FALSE AFTER allow_advertisement`);
      }
      if (!colMap.has('marriage_source')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN marriage_source VARCHAR(100) DEFAULT NULL AFTER is_featured_for_ads`);
      }
      if (!colMap.has('reason')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN reason VARCHAR(255) DEFAULT NULL AFTER marriage_source`);
      }
      if (!colMap.has('feedback')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN feedback TEXT DEFAULT NULL AFTER reason`);
      }
      if (!colMap.has('couple_photo_1')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN couple_photo_1 VARCHAR(255) NULL DEFAULT NULL AFTER created_at`);
      }
      if (!colMap.has('couple_photo_2')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN couple_photo_2 VARCHAR(255) NULL DEFAULT NULL AFTER couple_photo_1`);
      }
      if (!colMap.has('created_at')) {
        await pool.query(`ALTER TABLE bm_account_closure_feedback ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      }

      // Ensure profile_id & partner_profile_id collation matches user_registration
      try {
        await pool.query(`ALTER TABLE bm_account_closure_feedback CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      } catch (collErr) {
        // ignore if not permitted
      }
    } catch (colErr) {
      console.warn('[AutoMigrate Warning] Feedback table column check:', colErr.message);
    }

    feedbackTableEnsured = true;
  } catch (err) {
    console.warn('[AutoMigrate Warning] Ensuring feedback table:', err.message);
  }
};

export const getMarriageConfirmationRequests = async (req, res) => {
  try {
    await ensureAccountClosureFeedbackTable();

    const { tab } = req.query; // 'pending', 'accepted', 'rejected', 'all'
    let userProfileId = req.user?.profile_id;
    if (!userProfileId && req.user?.id) {
      const [u] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [req.user.id]);
      if (u.length > 0) userProfileId = u[0].profile_id;
    }

    if (!userProfileId) {
      return res.status(200).json({ success: true, requests: [] });
    }

    let statusCondition = "AND partner_confirmation_status = 'PENDING'";
    if (tab === 'accepted') {
      statusCondition = "AND partner_confirmation_status = 'ACCEPTED'";
    } else if (tab === 'rejected') {
      statusCondition = "AND partner_confirmation_status = 'REJECTED'";
    } else if (tab === 'all' || tab === 'history') {
      statusCondition = "";
    }

    let rows = [];
    try {
      // 1. Query feedback records directly without cross-table collation risks
      const [feedbackRows] = await pool.query(
        `SELECT * FROM bm_account_closure_feedback 
         WHERE TRIM(partner_profile_id) = TRIM(?)
           ${statusCondition}
         ORDER BY created_at DESC`,
        [userProfileId]
      );

      // 2. Fetch requester user profile details
      const requesterIds = Array.from(new Set((feedbackRows || []).map(r => r.profile_id?.trim()).filter(Boolean)));
      let userMap = {};
      if (requesterIds.length > 0) {
        const placeholders = requesterIds.map(() => '?').join(',');
        const [userRows] = await pool.query(
          `SELECT profile_id, full_name, gender, religion, district, photo_1 
           FROM user_registration 
           WHERE profile_id IN (${placeholders})`,
          requesterIds
        );
        (userRows || []).forEach(u => {
          if (u.profile_id) userMap[u.profile_id.trim().toLowerCase()] = u;
        });
      }

      rows = (feedbackRows || []).map(f => {
        const ur = userMap[f.profile_id?.trim()?.toLowerCase()] || {};
        return {
          request_id: f.id,
          requester_profile_id: f.profile_id,
          action_type: f.action_type || 'DEACTIVATE',
          partner_confirmation_status: f.partner_confirmation_status || 'PENDING',
          partner_responded_at: f.partner_responded_at,
          allow_advertisement: Boolean(f.allow_advertisement),
          feedback: f.feedback,
          created_at: f.created_at,
          requester_name: ur.full_name || null,
          requester_gender: ur.gender || null,
          requester_religion: ur.religion || null,
          requester_district: ur.district || null,
          requester_photo: ur.photo_1 || null
        };
      });
    } catch (queryErr) {
      console.error('Error executing marriage confirmation query:', queryErr.message);
      rows = [];
    }

    res.status(200).json({ success: true, requests: rows });
  } catch (error) {
    console.error('Error fetching marriage confirmation requests:', error);
    res.status(200).json({ success: true, requests: [] });
  }
};

export const respondToMarriageConfirmation = async (req, res) => {
  try {
    await ensureAccountClosureFeedbackTable();

    const { requestId } = req.params;
    const { action } = req.body; // 'ACCEPT' | 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(String(action).toUpperCase())) {
      return res.status(400).json({ error: 'Invalid action. Choose ACCEPT or REJECT' });
    }

    let userProfileId = req.user?.profile_id;
    if (!userProfileId && req.user?.id) {
      const [u] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [req.user.id]);
      if (u.length > 0) userProfileId = u[0].profile_id;
    }

    const targetStatus = String(action).toUpperCase() === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const [result] = await pool.query(
      `UPDATE bm_account_closure_feedback 
       SET partner_confirmation_status = ?, partner_responded_at = NOW() 
       WHERE id = ? AND LOWER(TRIM(partner_profile_id)) = LOWER(TRIM(?))`,
      [targetStatus, requestId, userProfileId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Marriage confirmation request not found or not authorized' });
    }

    res.status(200).json({ 
      success: true, 
      status: targetStatus,
      message: targetStatus === 'ACCEPTED' 
        ? 'Marriage match confirmed! Congratulations on your union! Your account will be deactivated in 3 days.' 
        : 'Marriage match request has been declined.' 
    });
  } catch (error) {
    console.error('Error responding to marriage confirmation:', error);
    res.status(500).json({ error: 'Server error responding to marriage confirmation' });
  }
};

export const toggleAccountStatus = async (req, res) => {
  const { profileId } = req.params;
  const { 
    status, 
    isMarried, 
    foundViaPlatform, 
    partnerId, 
    allowAdvertisement,
    marriageSource, 
    reason, 
    feedback 
  } = req.body;

  try {
    if (!profileId || !status) {
      return res.status(400).json({ error: 'Profile ID and status are required' });
    }

    const newStatus = String(status).toUpperCase();
    if (!['ACTIVE', 'DEACTIVATED'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status. Choose ACTIVE or DEACTIVATED' });
    }

    if (newStatus === 'DEACTIVATED') {
      await ensureAccountDeletionColumns();
      // User requested deactivation
      const [users] = await pool.query('SELECT full_name, email_address FROM user_registration WHERE profile_id = ?', [profileId]);
      if (users.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = users[0];

      let updateSuccess = false;
      try {
        const [result] = await pool.query(
          'UPDATE user_registration SET status = ?, deactivate_requested_at = NOW(), refresh_token = NULL WHERE profile_id = ?',
          ['PENDING_DEACTIVATE', profileId]
        );
        if (result.affectedRows > 0) updateSuccess = true;
      } catch (upErr) {
        console.error('Update with deactivate_requested_at failed, attempting fallback update:', upErr);
        const [fallbackResult] = await pool.query(
          'UPDATE user_registration SET status = ?, refresh_token = NULL WHERE profile_id = ?',
          ['PENDING_DEACTIVATE', profileId]
        );
        if (fallbackResult.affectedRows > 0) updateSuccess = true;
      }
      
      if (!updateSuccess) return res.status(404).json({ error: 'User not found' });

      // Save exit feedback
      try {
        await ensureAccountClosureFeedbackTable();
        let photo1 = null;
        let photo2 = null;
        if (req.files && req.files.length > 0) {
          photo1 = req.files[0].filename;
          if (req.files.length > 1) {
            photo2 = req.files[1].filename;
          }
        }

        await pool.query(
          `INSERT INTO bm_account_closure_feedback 
           (profile_id, action_type, is_married, found_via_platform, partner_profile_id, allow_advertisement, marriage_source, reason, feedback, couple_photo_1, couple_photo_2) 
           VALUES (?, 'DEACTIVATE', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profileId,
            isMarried === true || isMarried === 'yes' || isMarried === 1 || isMarried === 'true',
            foundViaPlatform === true || foundViaPlatform === 'yes' || foundViaPlatform === 1 || foundViaPlatform === 'true',
            partnerId || null,
            allowAdvertisement === true || allowAdvertisement === 'yes' || allowAdvertisement === 1 || allowAdvertisement === 'true',
            marriageSource || null,
            reason || null,
            feedback || null,
            photo1,
            photo2
          ]
        );
      } catch (fbErr) {
        console.error('Error saving deactivation feedback:', fbErr);
      }

      sendNotificationEmail({
        to: user.email_address,
        subject: 'Account Deactivation Requested - 3 Day Grace Period',
        text: `Hello ${user.full_name},\n\nYou have requested to deactivate your Bharat Marriage account.\n\nYour account is now hidden from all users. It will be officially deactivated in 3 days. Once deactivated, you must contact support to reactivate it.\n\nIf you change your mind, simply log in within the next 3 days to cancel this request.\n\nBest Regards,\nBharat Marriage`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2>Account Deactivation Requested</h2>
            <p>Hello ${user.full_name},</p>
            <p>You have requested to deactivate your Bharat Marriage account. Your account is now hidden from all other users.</p>
            <p>Your account will be officially deactivated in <strong>3 days</strong>. Once officially deactivated, you will not be able to log in and must use the Contact Us page to request reactivation.</p>
            <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Changed your mind?</strong><br>
              Simply log in again within the next 3 days and your deactivation request will be automatically cancelled.
            </div>
            <p>Best Regards,<br>Bharat Marriage</p>
          </div>
        `
      }).catch(mailErr => console.error('Error sending deactivation email:', mailErr));

      return res.status(200).json({ message: `Account deactivation requested successfully.`, status: 'PENDING_DEACTIVATE' });
    } else {
      // Logic for ACTIVE (if admin activates them from somewhere else using this same API, though typically admin uses admin routes)
      const [result] = await pool.query(
        'UPDATE user_registration SET status = ?, deactivate_requested_at = NULL WHERE profile_id = ?',
        ['ACTIVE', profileId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    res.status(200).json({ message: `Profile status updated to ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Error toggling account status:', error);
    res.status(500).json({ error: error.message || 'Server error while updating profile status' });
  }
};

export const requestAccountDeletion = async (req, res) => {
  const { profileId } = req.params;
  const { 
    isMarried, 
    foundViaPlatform, 
    partnerId, 
    allowAdvertisement,
    marriageSource, 
    reason, 
    feedback 
  } = req.body || {};

  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    await ensureAccountDeletionColumns();

    // Fetch user details for email
    const [users] = await pool.query('SELECT full_name, email_address FROM user_registration WHERE profile_id = ?', [profileId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];

    let updateSuccess = false;
    try {
      const [result] = await pool.query(
        'UPDATE user_registration SET status = ?, delete_requested_at = NOW(), refresh_token = NULL WHERE profile_id = ?',
        ['PENDING_DELETE', profileId]
      );
      if (result.affectedRows > 0) updateSuccess = true;
    } catch (upErr) {
      console.error('Update with delete_requested_at failed, attempting fallback update:', upErr);
      const [fallbackResult] = await pool.query(
        'UPDATE user_registration SET status = ?, refresh_token = NULL WHERE profile_id = ?',
        ['PENDING_DELETE', profileId]
      );
      if (fallbackResult.affectedRows > 0) updateSuccess = true;
    }

    if (!updateSuccess) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save exit feedback
    try {
      await ensureAccountClosureFeedbackTable();
      let photo1 = null;
      let photo2 = null;
      if (req.files && req.files.length > 0) {
        photo1 = req.files[0].filename;
        if (req.files.length > 1) {
          photo2 = req.files[1].filename;
        }
      }

      await pool.query(
        `INSERT INTO bm_account_closure_feedback 
         (profile_id, action_type, is_married, found_via_platform, partner_profile_id, allow_advertisement, marriage_source, reason, feedback, couple_photo_1, couple_photo_2) 
         VALUES (?, 'DELETE', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          isMarried === true || isMarried === 'yes' || isMarried === 1 || isMarried === 'true',
          foundViaPlatform === true || foundViaPlatform === 'yes' || foundViaPlatform === 1 || foundViaPlatform === 'true',
          partnerId || null,
          allowAdvertisement === true || allowAdvertisement === 'yes' || allowAdvertisement === 1 || allowAdvertisement === 'true',
          marriageSource || null,
          reason || null,
          feedback || null,
          photo1,
          photo2
        ]
      );
    } catch (fbErr) {
      console.error('Error saving deletion feedback:', fbErr);
    }

    // Send email notification (non-blocking)
    sendNotificationEmail({
      to: user.email_address,
      subject: 'Account Deletion Requested - 3 Day Grace Period',
      text: `Hello ${user.full_name},\n\nWe have received your request to permanently delete your Bharat Marriage account.\n\nYour account has now been hidden from all other users and marked for deletion. It will be permanently deleted in 3 days.\n\nIf you change your mind and wish to recover your account, simply log in again within the next 3 days and your deletion request will be automatically cancelled.\n\nBest Regards,\nBharat Marriage`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>Account Deletion Requested</h2>
          <p>Hello ${user.full_name},</p>
          <p>We have received your request to permanently delete your Bharat Marriage account.</p>
          <p>Your account has now been hidden from all other users and marked for deletion. It will be permanently deleted in <strong>3 days</strong>.</p>
          <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Changed your mind?</strong><br>
            If you wish to recover your account, simply log in again within the next 3 days and your deletion request will be automatically cancelled.
          </div>
          <p>Best Regards,<br>Bharat Marriage</p>
        </div>
      `
    }).catch(mailErr => console.error('Error sending deletion email:', mailErr));

    res.status(200).json({ message: 'Account deletion requested successfully. Account will be deleted in 3 days unless you log in again.' });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    res.status(500).json({ error: error.message || 'Server error while requesting account deletion' });
  }
};
