import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import { getEmailTransporter, sendFranchiseApprovalEmail } from '../../utils/emailService.js';
import { generateDistrictFranchiseCode } from '../../utils/franchiseCodeUtils.js';

const cleanupAssignedHeadFranchiseRequests = async (pinCodesArray) => {
  if (!Array.isArray(pinCodesArray) || pinCodesArray.length === 0) return;
  try {
    const cleanCodes = pinCodesArray.map(pc => String(pc).trim()).filter(Boolean);
    if (cleanCodes.length === 0) return;
    const placeholders = cleanCodes.map(() => '?').join(',');
    await pool.execute(
      `DELETE FROM bm_head_franchise_requests WHERE pincode IN (${placeholders})`,
      cleanCodes
    );
  } catch (err) {
    console.error('Error cleaning up head franchise requests:', err);
  }
};

const syncUsersAfterFranchisePincodeUpdate = async (franchiseId, pinCodesArray) => {
  if (!franchiseId) return;
  try {
    const cleanPins = Array.isArray(pinCodesArray) ? pinCodesArray.map(pc => String(pc).trim()).filter(Boolean) : [];
    if (cleanPins.length > 0) {
      const placeholders = cleanPins.map(() => '?').join(',');
      // Un-assign users from this franchise if their registered pincode is not in the updated pincodes list
      await pool.query(
        `UPDATE user_registration ur
         LEFT JOIN hindus hd ON ur.profile_id = hd.profile_id
         LEFT JOIN christians cr ON ur.profile_id = cr.profile_id
         LEFT JOIN muslims ms ON ur.profile_id = ms.profile_id
         LEFT JOIN others ot ON ur.profile_id = ot.profile_id
         SET ur.assigned_franchise_id = NULL
         WHERE (ur.assigned_franchise_id = ? OR ur.assigned_franchise_id = (SELECT franchise_id FROM bm_franchise WHERE id = ? LIMIT 1))
           AND COALESCE(hd.pincode, cr.pincode, ms.pincode, ot.pincode) NOT IN (${placeholders})`,
        [franchiseId, franchiseId, ...cleanPins]
      );
    } else {
      // All pincodes removed from franchise -> unassign users with pincodes
      await pool.query(
        `UPDATE user_registration 
         SET assigned_franchise_id = NULL 
         WHERE assigned_franchise_id = ? OR assigned_franchise_id = (SELECT franchise_id FROM bm_franchise WHERE id = ? LIMIT 1)`,
        [franchiseId, franchiseId]
      );
    }
  } catch (err) {
    console.error('Error syncing users after franchise pincode update:', err);
  }
};

// Create a new franchise
export const createFranchise = async (req, res) => {
  try {
    const { name, owner, location, mobile_number, email, pin_codes, status } = req.body;

    if (!name || !owner || !location || !mobile_number || !email || !pin_codes) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const firstPin = Array.isArray(pin_codes) && pin_codes.length > 0 ? pin_codes[0] : '';
    // Generate district-based franchise code: e.g. BM-KKD-001
    const franchise_id = await generateDistrictFranchiseCode(location, location, firstPin);

    // Generate random password
    const plainPassword = Math.random().toString(36).slice(-8);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const query = `
      INSERT INTO bm_franchise 
      (franchise_id, name, owner, location, mobile_number, email, pin_codes, status, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      franchise_id,
      name,
      owner,
      location,
      mobile_number,
      email,
      JSON.stringify(pin_codes),
      status || 'active',
      hashedPassword
    ];

    const [result] = await pool.execute(query, values);

    // Send Email with generated password & franchise login URL
    if (email) {
      (async () => {
        try {
          await sendFranchiseApprovalEmail({
            name: owner || name,
            email,
            franchise_id,
            plainPassword
          });
        } catch (emailError) {
          console.error('Failed to send franchise welcome email:', emailError);
        }
      })();
    }

    res.status(201).json({ message: 'Franchise created successfully', id: result.insertId, franchise_id });
  } catch (error) {
    console.error('Error creating franchise:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Franchise ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create franchise' });
  }
};

import { parsePinCodes } from '../../utils/franchiseAssignmentUtils.js';

// Get all franchises with live assigned user counts
export const getAllFranchises = async (req, res) => {
  try {
    const [franchises] = await pool.execute('SELECT * FROM bm_franchise ORDER BY franchise_id ASC');
    
    // Fetch all active users with their pincode & assigned_franchise_id to compute user counts
    const [users] = await pool.query(`
      SELECT 
        ur.profile_id, ur.assigned_franchise_id,
        COALESCE(hd.pincode, cr.pincode, ms.pincode, ot.pincode) as pincode
      FROM user_registration ur
      LEFT JOIN hindus hd ON ur.profile_id = hd.profile_id
      LEFT JOIN christians cr ON ur.profile_id = cr.profile_id
      LEFT JOIN muslims ms ON ur.profile_id = ms.profile_id
      LEFT JOIN others ot ON ur.profile_id = ot.profile_id
      WHERE (ur.account_status IS NULL OR ur.account_status != 'Banned')
    `);

    const enriched = franchises.map(f => {
      const fCode = String(f.franchise_id || '').trim().toLowerCase();
      const fId = String(f.id || '').trim().toLowerCase();
      const pins = parsePinCodes(f.pin_codes);
      const pinSet = new Set(pins);

      const count = users.filter(u => {
        const uAssigned = u.assigned_franchise_id ? String(u.assigned_franchise_id).trim().toLowerCase() : '';
        const uPin = u.pincode ? String(u.pincode).trim() : '';

        if (uAssigned) {
          return uAssigned === fCode || uAssigned === fId;
        }
        return uPin && pinSet.has(uPin);
      }).length;

      return {
        ...f,
        user_count: count
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    console.error('Error fetching franchises:', error);
    res.status(500).json({ error: 'Failed to fetch franchises' });
  }
};

// Get franchise by ID
export const getFranchiseById = async (req, res) => {
  try {
    const { franchise_id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM bm_franchise WHERE franchise_id = ?', [franchise_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Franchise not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching franchise:', error);
    res.status(500).json({ error: 'Failed to fetch franchise' });
  }
};

// Get all users/customers assigned to or belonging to a specific franchise
export const getFranchiseUsers = async (req, res) => {
  try {
    const { franchise_id } = req.params;
    const [franchises] = await pool.execute(
      `SELECT id, franchise_id, name, location, pin_codes 
       FROM bm_franchise 
       WHERE LOWER(TRIM(franchise_id)) = LOWER(TRIM(?)) OR id = ?
       LIMIT 1`,
      [franchise_id, franchise_id]
    );

    if (franchises.length === 0) {
      return res.status(404).json({ error: 'Franchise not found' });
    }

    const franchise = franchises[0];
    const pinCodesArray = parsePinCodes(franchise.pin_codes);
    const fCode = franchise.franchise_id || '';
    const fId = String(franchise.id);

    let filter = `(LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ?)`;
    let queryParams = [fCode, fId];

    if (pinCodesArray.length > 0) {
      const placeholders = pinCodesArray.map(() => '?').join(',');
      filter = `(LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ? OR (ur.assigned_franchise_id IS NULL AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})))`;
      queryParams = [fCode, fId, ...pinCodesArray];
    }

    const query = `
      SELECT 
        ur.id, ur.profile_id, ur.full_name, ur.gender, ur.mobile_number, ur.email_address,
        ur.photo_1, ur.status, ur.assigned_franchise_id,
        DATE_FORMAT(ur.created_at, '%d-%m-%Y') as registeredOn,
        COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) as pincode,
        COALESCE(h.district, c.district, m.district, o.district, ur.district) as district,
        COALESCE(h.place, c.place, m.place, o.place) as place
      FROM user_registration ur
      LEFT JOIN hindus h ON ur.profile_id = h.profile_id
      LEFT JOIN christians c ON ur.profile_id = c.profile_id
      LEFT JOIN muslims m ON ur.profile_id = m.profile_id
      LEFT JOIN others o ON ur.profile_id = o.profile_id
      WHERE ${filter} AND (ur.account_status IS NULL OR ur.account_status != 'Banned')
      ORDER BY ur.created_at DESC
    `;

    const [users] = await pool.query(query, queryParams);

    const mappedUsers = users.map(u => {
      const isManual = u.assigned_franchise_id && (
        String(u.assigned_franchise_id).trim().toLowerCase() === fCode.toLowerCase() ||
        String(u.assigned_franchise_id).trim() === fId
      );
      const defaultAvatar = u.gender === 'Female' 
        ? 'https://www.w3schools.com/howto/img_avatar2.png' 
        : 'https://www.w3schools.com/howto/img_avatar.png';

      return {
        id: u.profile_id,
        userId: u.profile_id,
        profile_id: u.profile_id,
        name: u.full_name,
        gender: u.gender,
        phone: u.mobile_number,
        email: u.email_address,
        pincode: u.pincode || 'N/A',
        district: u.district || 'Kerala',
        place: u.place || '',
        location: [u.place, u.district].filter(Boolean).join(', ') || 'Kerala',
        registeredOn: u.registeredOn,
        image: u.photo_1 || defaultAvatar,
        status: u.status || 'Active',
        assignmentType: isManual ? 'Direct Assignment' : 'Territory Pincode'
      };
    });

    res.status(200).json({
      franchise: {
        id: franchise.id,
        franchise_id: franchise.franchise_id,
        name: franchise.name,
        location: franchise.location
      },
      totalUsers: mappedUsers.length,
      users: mappedUsers
    });
  } catch (error) {
    console.error('Error fetching franchise users:', error);
    res.status(500).json({ error: 'Failed to fetch franchise users' });
  }
};

// Update franchise
export const updateFranchise = async (req, res) => {
  try {
    const { franchise_id } = req.params;
    const { name, owner, location, mobile_number, email, pin_codes, status } = req.body;

    const [existing] = await pool.execute('SELECT * FROM bm_franchise WHERE franchise_id = ?', [franchise_id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Franchise not found' });
    }

    const query = `
      UPDATE bm_franchise 
      SET name = ?, owner = ?, location = ?, mobile_number = ?, email = ?, pin_codes = ?, status = ?
      WHERE franchise_id = ?
    `;
    const values = [
      name || existing[0].name,
      owner || existing[0].owner,
      location || existing[0].location,
      mobile_number || existing[0].mobile_number,
      email || existing[0].email,
      pin_codes ? JSON.stringify(pin_codes) : existing[0].pin_codes,
      status || existing[0].status,
      franchise_id
    ];

    await pool.execute(query, values);

    if (pin_codes && Array.isArray(pin_codes)) {
      await cleanupAssignedHeadFranchiseRequests(pin_codes);
      await syncUsersAfterFranchisePincodeUpdate(franchise_id, pin_codes);
    }

    res.status(200).json({ message: 'Franchise updated successfully' });
  } catch (error) {
    console.error('Error updating franchise:', error);
    res.status(500).json({ error: 'Failed to update franchise' });
  }
};

// Update just the pin codes (PATCH)
export const updateFranchisePincodes = async (req, res) => {
  try {
    const { franchise_id } = req.params;
    const { pin_codes } = req.body;

    if (!pin_codes || !Array.isArray(pin_codes)) {
      return res.status(400).json({ error: 'pin_codes must be an array' });
    }

    const query = `UPDATE bm_franchise SET pin_codes = ? WHERE franchise_id = ?`;
    const [result] = await pool.execute(query, [JSON.stringify(pin_codes), franchise_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Franchise not found' });
    }

    await cleanupAssignedHeadFranchiseRequests(pin_codes);
    await syncUsersAfterFranchisePincodeUpdate(franchise_id, pin_codes);

    res.status(200).json({ message: 'Pin codes updated successfully' });
  } catch (error) {
    console.error('Error updating pin codes:', error);
    res.status(500).json({ error: 'Failed to update pin codes' });
  }
};

// Delete franchise
export const deleteFranchise = async (req, res) => {
  try {
    const { franchise_id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM bm_franchise WHERE franchise_id = ?', [franchise_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Franchise not found' });
    }
    
    res.status(200).json({ message: 'Franchise deleted successfully' });
  } catch (error) {
    console.error('Error deleting franchise:', error);
    res.status(500).json({ error: 'Failed to delete franchise' });
  }
};

// ==========================================
// FRANCHISE REPORTS (For Staff & Super Admin)
// ==========================================

// Get all franchise reports
export const getAllFranchiseReports = async (req, res) => {
  try {
    const { franchise_id } = req.query;
    let query = `SELECT * FROM bm_franchise_reports`;
    const params = [];

    if (franchise_id) {
      query += ` WHERE franchise_id = ?`;
      params.push(franchise_id);
    }

    query += ` ORDER BY created_at DESC`;
    const [rows] = await pool.execute(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching franchise reports:', error);
    res.status(500).json({ error: 'Failed to fetch franchise reports' });
  }
};

// Create a new franchise report (submitted by staff)
export const createFranchiseReport = async (req, res) => {
  try {
    const {
      franchise_id,
      franchise_name,
      staff_id,
      staff_name,
      report_type,
      status,
      subject,
      description,
      metrics_notes
    } = req.body;

    if (!franchise_id || !subject || !description) {
      return res.status(400).json({ error: 'Franchise, Subject, and Description are required' });
    }

    const query = `
      INSERT INTO bm_franchise_reports
      (franchise_id, franchise_name, staff_id, staff_name, report_type, status, subject, description, metrics_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      franchise_id,
      franchise_name || franchise_id,
      staff_id || null,
      staff_name || 'Franchise Staff',
      report_type || 'General Review',
      status || 'Normal',
      subject,
      description,
      metrics_notes || null
    ]);

    res.status(201).json({
      message: 'Franchise report submitted successfully',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error creating franchise report:', error);
    res.status(500).json({ error: 'Failed to submit franchise report' });
  }
};

// Delete a franchise report
export const deleteFranchiseReport = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM bm_franchise_reports WHERE id = ?', [id]);
    res.status(200).json({ message: 'Franchise report deleted successfully' });
  } catch (error) {
    console.error('Error deleting franchise report:', error);
    res.status(500).json({ error: 'Failed to delete franchise report' });
  }
};

