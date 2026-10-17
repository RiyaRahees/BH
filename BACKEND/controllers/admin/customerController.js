import pool from '../../config/db.js';
import { 
  sendReportModerationActionEmails, 
  sendReportDismissedEmails, 
  sendProfilePhotoReminderEmail,
  sendAccountDeactivatedByAdminEmail,
  sendAccountReactivatedByAdminEmail,
  sendAccountUnfrozenEmail,
  sendAccountActivatedEmail
} from '../../utils/emailService.js';

export const getCustomers = async (req, res) => {
  try {
    const { search, gender, status, page = 1, limit = 10, franchise_id } = req.query;

    let baseSelect = `
      SELECT 
        ur.profile_id, ur.full_name, ur.gender, ur.religion, ur.dob, 
        ur.photo_1, ur.photo_1_status,
        ur.photo_2, ur.photo_2_status,
        ur.photo_3, ur.photo_3_status,
        ur.photo_4, ur.photo_4_status,
        ur.photo_rejection_reason,
        (
          (ur.photo_1 IS NOT NULL AND ur.photo_1 != '' AND ur.photo_1_status = 'PENDING') OR
          (ur.photo_2 IS NOT NULL AND ur.photo_2 != '' AND ur.photo_2_status = 'PENDING') OR
          (ur.photo_3 IS NOT NULL AND ur.photo_3 != '' AND ur.photo_3_status = 'PENDING') OR
          (ur.photo_4 IS NOT NULL AND ur.photo_4 != '' AND ur.photo_4_status = 'PENDING')
        ) AS has_pending_photos,
        EXISTS (
          SELECT 1 FROM user_reports rep 
          WHERE LOWER(rep.reported_profile_id) = LOWER(ur.profile_id) AND rep.status != 'DISMISSED'
        ) AS has_reports,
        ur.verification, ur.plan, ur.status, ur.is_online, ur.last_seen,
        (ur.refresh_token IS NOT NULL AND ur.refresh_token != '') AS has_active_session,
        COALESCE(h.height, c.height, m.height, o.height) AS height,
        COALESCE(h.education, c.education, m.education, o.education) AS education,
        COALESCE(h.profession, c.profession, m.profession, o.profession) AS profession,
        COALESCE(h.place, c.place, m.place, o.place) AS place,
        COALESCE(h.district, c.district, m.district, o.district) AS district,
        COALESCE(h.state, c.state, m.state, o.state) AS state,
        ur.mobile_number,
        ur.email_address,
        ur.country_code,
        COALESCE(h.caste, c.caste, m.caste, o.caste, ur.caste) AS caste,
        h.nakshatra AS star,
        h.rasi AS rasi,
        COALESCE(h.house_name, c.house_name, m.house_name, o.house_name) AS house_name,
        COALESCE(h.street_locality, c.street_locality, m.street_locality, o.street_locality) AS street_locality,
        COALESCE(h.post_office, c.post_office, m.post_office, o.post_office) AS post_office,
        COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) AS pincode
      FROM user_registration ur
      LEFT JOIN hindus h ON ur.profile_id = h.profile_id
      LEFT JOIN christians c ON ur.profile_id = c.profile_id
      LEFT JOIN muslims m ON ur.profile_id = m.profile_id
      LEFT JOIN others o ON ur.profile_id = o.profile_id
      WHERE 1=1
    `;

    let countSelect = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN UPPER(ur.religion) = 'HINDU' THEN 1 ELSE 0 END) as hinduUsers,
        SUM(CASE WHEN UPPER(ur.religion) = 'MUSLIM' THEN 1 ELSE 0 END) as muslimUsers,
        SUM(CASE WHEN UPPER(ur.religion) = 'CHRISTIAN' THEN 1 ELSE 0 END) as christianUsers,
        SUM(CASE WHEN UPPER(ur.religion) NOT IN ('HINDU', 'MUSLIM', 'CHRISTIAN') THEN 1 ELSE 0 END) as otherUsers
      FROM user_registration ur
      LEFT JOIN hindus h ON ur.profile_id = h.profile_id
      LEFT JOIN christians c ON ur.profile_id = c.profile_id
      LEFT JOIN muslims m ON ur.profile_id = m.profile_id
      LEFT JOIN others o ON ur.profile_id = o.profile_id
      WHERE 1=1
    `;

    let filters = '';
    const queryParams = [];

    // Search filter: matches profile_id, full_name, profession, place, district, or state
    if (search) {
      filters += ` AND (
        ur.profile_id LIKE ? 
        OR ur.full_name LIKE ?
        OR COALESCE(h.profession, c.profession, m.profession, o.profession) LIKE ?
        OR COALESCE(h.place, c.place, m.place, o.place) LIKE ?
        OR COALESCE(h.district, c.district, m.district, o.district) LIKE ?
        OR COALESCE(h.state, c.state, m.state, o.state) LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      // Push the search term 6 times for the 6 placeholders
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Gender filter
    if (gender && gender !== 'All' && gender !== 'All Genders') {
      if (gender === 'Bride' || gender === 'Female' || gender.includes('Female')) {
        filters += ` AND ur.gender = 'Female'`;
      } else if (gender === 'Groom' || gender === 'Male' || gender.includes('Male')) {
        filters += ` AND ur.gender = 'Male'`;
      }
    }

    // Status filter
    if (status && status !== 'All Profiles' && status !== 'All') {
      if (status === 'Reported Accounts' || status === 'REPORTED' || status === 'Reported') {
        filters += ` AND (ur.status = 'REPORTED' OR EXISTS (SELECT 1 FROM user_reports rep WHERE LOWER(rep.reported_profile_id) = LOWER(ur.profile_id) AND rep.status != 'DISMISSED'))`;
      } else if (status === 'Pending Photo Review' || status === 'PENDING_PHOTOS' || status === 'Under Review' || status === 'UNDER_REVIEW') {
        filters += ` AND (
          (ur.photo_1 IS NOT NULL AND ur.photo_1 != '' AND ur.photo_1_status = 'PENDING') OR
          (ur.photo_2 IS NOT NULL AND ur.photo_2 != '' AND ur.photo_2_status = 'PENDING') OR
          (ur.photo_3 IS NOT NULL AND ur.photo_3 != '' AND ur.photo_3_status = 'PENDING') OR
          (ur.photo_4 IS NOT NULL AND ur.photo_4 != '' AND ur.photo_4_status = 'PENDING')
        )`;
      } else {
        filters += ` AND ur.status = ?`;
        queryParams.push(status.toUpperCase()); // ACTIVE, BLOCKED, BANNED
      }
    }

    // Franchise filter (supports both direct manual assignments and territory pincode coverage)
    if (franchise_id && franchise_id !== 'HEAD_OFFICE' && franchise_id !== 'All') {
      const [franchiseRows] = await pool.execute(
        'SELECT id, pin_codes, franchise_id FROM bm_franchise WHERE LOWER(TRIM(franchise_id)) = LOWER(TRIM(?)) OR id = ?', 
        [franchise_id, franchise_id]
      );
      if (franchiseRows.length > 0) {
        const targetF = franchiseRows[0];
        const fCode = targetF.franchise_id || '';
        const fId = String(targetF.id);
        let pinCodes = targetF.pin_codes;
        if (typeof pinCodes === 'string') {
          try { pinCodes = JSON.parse(pinCodes); } catch (e) { pinCodes = []; }
        }
        const cleanPins = Array.isArray(pinCodes) ? pinCodes.map(String).map(s => s.trim()).filter(Boolean) : [];
        if (cleanPins.length > 0) {
          const placeholders = cleanPins.map(() => '?').join(',');
          filters += ` AND (LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ? OR (ur.assigned_franchise_id IS NULL AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})))`;
          queryParams.push(fCode, fId, ...cleanPins);
        } else {
          filters += ` AND (LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ?)`;
          queryParams.push(fCode, fId);
        }
      } else {
        // If franchise not found, shouldn't see any users
        filters += ` AND 1=0`;
      }
    }

    // Pagination for the main query
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pagination = ` ORDER BY has_pending_photos DESC, ur.created_at DESC LIMIT ? OFFSET ?`;
    
    // Execute both queries
    const [customers] = await pool.execute(baseSelect + filters + pagination, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countSelect + filters, queryParams);
    const total = countResult[0].total;

    // Fetch report details for returned customers
    if (customers.length > 0) {
      const profileIds = customers.map(c => c.profile_id);
      const placeholders = profileIds.map(() => '?').join(',');
      const [reports] = await pool.execute(
        `SELECT 
           r.id, r.reporter_profile_id, r.reported_profile_id, r.reason, r.details, r.created_at, r.status,
           ur.full_name as reporter_name
         FROM user_reports r
         LEFT JOIN user_registration ur ON r.reporter_profile_id = ur.profile_id
         WHERE r.reported_profile_id IN (${placeholders})
         ORDER BY r.created_at DESC`,
        profileIds
      );

      const reportsByProfile = {};
      for (const rep of reports) {
        if (!reportsByProfile[rep.reported_profile_id]) {
          reportsByProfile[rep.reported_profile_id] = [];
        }
        reportsByProfile[rep.reported_profile_id].push(rep);
      }

      for (const cust of customers) {
        cust.reports = reportsByProfile[cust.profile_id] || [];
      }
    }

    const demographics = {
      hindu: countResult[0].hinduUsers || 0,
      muslim: countResult[0].muslimUsers || 0,
      christian: countResult[0].christianUsers || 0,
      other: countResult[0].otherUsers || 0
    };

    res.status(200).json({
      customers,
      demographics,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const forceLogout = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Invalidate the session by clearing refresh_token and setting is_online to FALSE
    const [result] = await pool.execute(
      `UPDATE user_registration SET refresh_token = NULL, is_online = FALSE WHERE profile_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User forcefully logged out successfully' });
  } catch (error) {
    console.error('Error force logging out user:', error);
    res.status(500).json({ error: 'Failed to force logout user' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification, status } = req.body;
    
    let updateQuery = 'UPDATE user_registration SET ';
    const params = [];
    
    // Get existing user to know previous status
    const [existingRows] = await pool.query(
      'SELECT profile_id, status, full_name, email_address FROM user_registration WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?))',
      [id]
    );
    const existingUser = existingRows.length > 0 ? existingRows[0] : null;
    
    if (verification !== undefined) {
      updateQuery += 'verification = ?';
      params.push(verification ? 'VERIFIED' : 'UNVERIFIED');
    }
    
    if (status !== undefined) {
      const upperStatus = status.toUpperCase();
      if (params.length > 0) updateQuery += ', ';
      updateQuery += 'status = ?';
      params.push(upperStatus);
      
      // If setting to BLOCKED, BANNED, FREEZED, or DEACTIVATED, immediately invalidate sessions & online status
      if (['BLOCKED', 'BANNED', 'FREEZED', 'DEACTIVATED'].includes(upperStatus)) {
        updateQuery += ', refresh_token = NULL, is_online = FALSE';
      }
    }
    
    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateQuery += ' WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?))';
    params.push(id);
    
    const [result] = await pool.execute(updateQuery, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle Email Notifications based on status transitions
    if (status && existingUser) {
      const upperStatus = status.toUpperCase();
      const oldStatus = (existingUser.status || '').toUpperCase();

      // 1. DEACTIVATION EMAIL
      if (upperStatus === 'DEACTIVATED' && oldStatus !== 'DEACTIVATED') {
        (async () => {
          try {
            await sendAccountDeactivatedByAdminEmail({
              user: {
                profile_id: existingUser.profile_id || id,
                full_name: existingUser.full_name,
                email_address: existingUser.email_address
              }
            });
            console.log(`[Admin Customer] Sent deactivation email to user: ${existingUser.profile_id || id} (${existingUser.email_address})`);
          } catch (deactErr) {
            console.error('[Admin Customer] Error sending deactivation email:', deactErr);
          }
        })();
      } 
      // 2. REACTIVATION EMAIL
      else if (upperStatus === 'ACTIVE' && oldStatus === 'DEACTIVATED') {
        (async () => {
          try {
            await sendAccountReactivatedByAdminEmail({
              user: {
                profile_id: existingUser.profile_id || id,
                full_name: existingUser.full_name,
                email_address: existingUser.email_address
              }
            });
            console.log(`[Admin Customer] Sent reactivation email to user: ${existingUser.profile_id || id} (${existingUser.email_address})`);
          } catch (reactErr) {
            console.error('[Admin Customer] Error sending reactivation email:', reactErr);
          }
        })();
      }
      // 3. ACCOUNT FREEZE EMAIL
      else if (upperStatus === 'FREEZED' && oldStatus !== 'FREEZED') {
        (async () => {
          try {
            const { sendNotificationEmail } = await import('../../utils/emailService.js');
            await sendNotificationEmail({
              to: existingUser.email_address,
              subject: `Account Frozen - Bharat Marriage (${existingUser.profile_id || id})`,
              text: `Hello ${existingUser.full_name},\n\nYour Bharat Marriage account has been frozen by the administration.\n\nYou will not be able to log in or use the platform until your account is unfrozen by an administrator. Please contact support for more information.\n\nBest Regards,\nBharat Marriage Team`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                  <h2 style="color: #780C28;">Bharat Marriage - Account Frozen</h2>
                  <p>Hello <strong>${existingUser.full_name}</strong>,</p>
                  <p>Your Bharat Marriage account (<strong>${existingUser.profile_id || id}</strong>) has been <strong>frozen</strong> by the administration.</p>
                  <p>You will not be able to log in or use the platform until your account is unfrozen by an administrator.</p>
                  <p>Please contact support for more information.</p>
                  <p>Best Regards,<br><strong>Bharat Marriage Team</strong></p>
                </div>
              `
            });
          } catch (err) {
            console.error('[Admin Customer] Error sending freeze email:', err);
          }
        })();
      } 
      // 4. ACCOUNT UNFREEZE EMAIL
      else if (upperStatus === 'ACTIVE' && oldStatus === 'FREEZED') {
        (async () => {
          try {
            await sendAccountUnfrozenEmail({
              user: {
                profile_id: existingUser.profile_id || id,
                full_name: existingUser.full_name,
                email_address: existingUser.email_address
              }
            });
            console.log(`[Admin Customer] Sent unfreeze email to user: ${existingUser.profile_id || id} (${existingUser.email_address})`);
          } catch (err) {
            console.error('[Admin Customer] Error sending unfreeze email:', err);
          }
        })();
      }
      // 4b. GENERAL ACCOUNT ACTIVATION EMAIL
      else if (upperStatus === 'ACTIVE' && oldStatus !== 'ACTIVE') {
        (async () => {
          try {
            await sendAccountActivatedEmail({
              user: {
                profile_id: existingUser.profile_id || id,
                full_name: existingUser.full_name,
                email_address: existingUser.email_address
              }
            });
            console.log(`[Admin Customer] Sent activation email to user: ${existingUser.profile_id || id} (${existingUser.email_address})`);
          } catch (err) {
            console.error('[Admin Customer] Error sending activation email:', err);
          }
        })();
      }
      // 5. MODERATION ACTION (BLOCKED / BANNED)
      else if (['BLOCKED', 'BANNED'].includes(upperStatus)) {
        (async () => {
          try {
            const [reportRows] = await pool.query(
              `SELECT r.reason, r.details, ur.profile_id, ur.full_name, ur.email_address
               FROM user_reports r
               LEFT JOIN user_registration ur ON LOWER(r.reporter_profile_id) = LOWER(ur.profile_id)
               WHERE LOWER(r.reported_profile_id) = LOWER(?)
               ORDER BY r.created_at DESC LIMIT 1`,
              [id]
            );

            let reporter = null;
            let reason = 'Violation of Community Guidelines';
            if (reportRows.length > 0) {
              reason = reportRows[0].reason || reason;
              if (reportRows[0].email_address) {
                reporter = {
                  profile_id: reportRows[0].profile_id,
                  full_name: reportRows[0].full_name,
                  email_address: reportRows[0].email_address
                };
              }
            }

            await sendReportModerationActionEmails({
              reporter,
              reported: existingUser,
              actionType: upperStatus,
              reason
            });
          } catch (emailErr) {
            console.error('[Admin Customer] Error sending moderation action email:', emailErr);
          }
        })();
      }
    }
    
    res.status(200).json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { franchise_id } = req.query;
    
    let baseSelect = `
      SELECT 
        r.id, 
        r.reporter_profile_id, 
        r.reported_profile_id, 
        r.reason, 
        r.details, 
        r.created_at, 
        r.status as report_status,
        r.appeal_status,
        r.appeal_message,
        r.appealed_at,
        COALESCE(ur_reporter.full_name, 'User') as reporter_name,
        COALESCE(ur_reported.full_name, 'Reported Profile') as reported_name,
        COALESCE(ur_reported.gender, 'Other') as reported_gender,
        ur_reported.photo_1 as reported_photo,
        COALESCE(ur_reported.status, 'ACTIVE') as reported_account_status,
        COALESCE(ur_reported.plan, 'FREE') as reported_plan
      FROM user_reports r
      LEFT JOIN user_registration ur_reporter ON LOWER(TRIM(r.reporter_profile_id)) = LOWER(TRIM(ur_reporter.profile_id))
      LEFT JOIN user_registration ur_reported ON LOWER(TRIM(r.reported_profile_id)) = LOWER(TRIM(ur_reported.profile_id))
      LEFT JOIN hindus h ON LOWER(TRIM(ur_reported.profile_id)) = LOWER(TRIM(h.profile_id))
      LEFT JOIN christians c ON LOWER(TRIM(ur_reported.profile_id)) = LOWER(TRIM(c.profile_id))
      LEFT JOIN muslims m ON LOWER(TRIM(ur_reported.profile_id)) = LOWER(TRIM(m.profile_id))
      LEFT JOIN others o ON LOWER(TRIM(ur_reported.profile_id)) = LOWER(TRIM(o.profile_id))
      WHERE 1=1
    `;

    let filters = '';
    const queryParams = [];

    if (franchise_id && franchise_id !== 'HEAD_OFFICE' && franchise_id !== 'All' && franchise_id !== 'ALL' && franchise_id !== 'null' && franchise_id !== 'undefined' && franchise_id !== '') {
      const [franchiseRows] = await pool.execute('SELECT pin_codes FROM bm_franchise WHERE LOWER(franchise_id) = LOWER(?)', [franchise_id]);
      if (franchiseRows.length > 0) {
        let pinCodes = franchiseRows[0].pin_codes;
        if (typeof pinCodes === 'string') {
          try { pinCodes = JSON.parse(pinCodes); } catch (e) { pinCodes = []; }
        }
        if (Array.isArray(pinCodes) && pinCodes.length > 0) {
          const placeholders = pinCodes.map(() => '?').join(',');
          filters += ` AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})`;
          queryParams.push(...pinCodes);
        }
      }
    }

    const orderBy = ` ORDER BY r.created_at DESC`;

    const [reports] = await pool.execute(baseSelect + filters + orderBy, queryParams);

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const dismissReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Fetch report info before dismissing to get reporter and reported user details
    const [reportRows] = await pool.query(
      `SELECT r.id, r.reason,
              ur_rep.profile_id as reporter_profile_id, ur_rep.full_name as reporter_name, ur_rep.email_address as reporter_email,
              ur_usr.profile_id as reported_profile_id, ur_usr.full_name as reported_name, ur_usr.email_address as reported_email
       FROM user_reports r
       LEFT JOIN user_registration ur_rep ON LOWER(r.reporter_profile_id) = LOWER(ur_rep.profile_id)
       LEFT JOIN user_registration ur_usr ON LOWER(r.reported_profile_id) = LOWER(ur_usr.profile_id)
       WHERE r.id = ?`,
      [reportId]
    );

    await pool.execute('UPDATE user_reports SET status = "DISMISSED" WHERE id = ?', [reportId]);

    if (reportRows.length > 0) {
      const rep = reportRows[0];
      const reported = {
        profile_id: rep.reported_profile_id,
        full_name: rep.reported_name,
        email_address: rep.reported_email
      };
      const reporter = {
        profile_id: rep.reporter_profile_id,
        full_name: rep.reporter_name,
        email_address: rep.reporter_email
      };

      sendReportDismissedEmails({
        reporter,
        reported,
        reason: rep.reason
      }).catch(err => console.error('Error sending report dismissed emails:', err));
    }

    res.status(200).json({ message: 'Report dismissed successfully' });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
};

export const approveUserPhotos = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { slot } = req.body; // 'photo_1', 'photo_2', 'photo_3', 'photo_4', or 'all'

    if (slot && ['photo_1', 'photo_2', 'photo_3', 'photo_4'].includes(slot)) {
      const statusCol = `${slot}_status`;
      await pool.execute(
        `UPDATE user_registration SET ${statusCol} = 'APPROVED', photo_rejection_reason = NULL WHERE LOWER(profile_id) = LOWER(?)`,
        [profileId]
      );
    } else {
      // Approve all uploaded photos
      await pool.execute(
        `UPDATE user_registration 
         SET photo_1_status = IF(photo_1 IS NOT NULL AND photo_1 != '', 'APPROVED', photo_1_status),
             photo_2_status = IF(photo_2 IS NOT NULL AND photo_2 != '', 'APPROVED', photo_2_status),
             photo_3_status = IF(photo_3 IS NOT NULL AND photo_3 != '', 'APPROVED', photo_3_status),
             photo_4_status = IF(photo_4 IS NOT NULL AND photo_4 != '', 'APPROVED', photo_4_status),
             photo_rejection_reason = NULL
         WHERE LOWER(profile_id) = LOWER(?)`,
        [profileId]
      );
    }

    res.status(200).json({ message: 'Photo(s) approved and published successfully.' });
  } catch (error) {
    console.error('Error approving user photo:', error);
    res.status(500).json({ error: 'Failed to approve user photo' });
  }
};

export const rejectUserPhotos = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { slot, reason } = req.body; // 'photo_1', 'photo_2', 'photo_3', 'photo_4', or 'all'
    const rejectionReason = reason ? reason.trim() : 'Photo does not meet Bharat Marriage community quality/safety standards.';

    if (slot && ['photo_1', 'photo_2', 'photo_3', 'photo_4'].includes(slot)) {
      const statusCol = `${slot}_status`;
      await pool.execute(
        `UPDATE user_registration SET ${statusCol} = 'REJECTED', photo_rejection_reason = ? WHERE LOWER(profile_id) = LOWER(?)`,
        [rejectionReason, profileId]
      );
    } else {
      // Reject all pending photos
      await pool.execute(
        `UPDATE user_registration 
         SET photo_1_status = IF(photo_1_status = 'PENDING', 'REJECTED', photo_1_status),
             photo_2_status = IF(photo_2_status = 'PENDING', 'REJECTED', photo_2_status),
             photo_3_status = IF(photo_3_status = 'PENDING', 'REJECTED', photo_3_status),
             photo_4_status = IF(photo_4_status = 'PENDING', 'REJECTED', photo_4_status),
             photo_rejection_reason = ?
         WHERE LOWER(profile_id) = LOWER(?)`,
        [rejectionReason, profileId]
      );
    }

    res.status(200).json({ message: 'Photo(s) rejected successfully.' });
  } catch (error) {
    console.error('Error rejecting user photo:', error);
    res.status(500).json({ error: 'Failed to reject user photo' });
  }
};

export const sendCustomerProfileReminder = async (req, res) => {
  try {
    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    const [rows] = await pool.query(
      `SELECT 
        profile_id, full_name, email_address, gender,
        photo_1, photo_2, photo_3, photo_4
       FROM user_registration 
       WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?)) OR id = ?`,
      [profileId, profileId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    if (!user.email_address) {
      return res.status(400).json({ error: 'User does not have a registered email address' });
    }

    const sent = await sendProfilePhotoReminderEmail({ user });

    if (!sent) {
      return res.status(500).json({ error: 'Failed to send reminder email. Please check mail server settings.' });
    }

    res.status(200).json({
      success: true,
      message: `Profile & photo reminder email sent successfully to ${user.email_address}`
    });
  } catch (error) {
    console.error('Error sending profile reminder email:', error);
    res.status(500).json({ error: 'Server error while sending reminder email' });
  }
};
