import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getEmailTransporter as getTransporter } from '../utils/emailService.js';
import { 
  updateCustomer, 
  forceLogout, 
  approveUserPhotos, 
  rejectUserPhotos 
} from './admin/customerController.js';

// Helper: parse pin codes safely
export const parsePinCodes = (pinCodes) => {
  if (!pinCodes) return [];
  if (Array.isArray(pinCodes)) return pinCodes.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof pinCodes === 'string') {
    try {
      const parsed = JSON.parse(pinCodes);
      if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
    } catch {
      return pinCodes.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * Middleware: Verify that the target customer's pincode belongs to the requesting franchise
 */
export const verifyCustomerInFranchisePin = async (req, res, next) => {
  try {
    const franchiseId = req.franchise?.id;
    const targetId = req.params.id || req.params.profileId;

    if (!franchiseId) {
      return res.status(401).json({ error: 'Franchise authentication required.' });
    }

    if (!targetId) {
      return res.status(400).json({ error: 'Customer identifier is required.' });
    }

    // 1. Fetch franchise assigned PIN codes & franchise_id
    const [franchises] = await pool.execute('SELECT id, franchise_id, pin_codes FROM bm_franchise WHERE id = ?', [franchiseId]);
    if (franchises.length === 0) {
      return res.status(404).json({ error: 'Franchise not found.' });
    }

    const assignedPins = parsePinCodes(franchises[0].pin_codes);
    const codeFranchiseId = franchises[0].franchise_id;

    // 2. Fetch customer's actual PIN code and assigned_franchise_id
    const [customerRows] = await pool.query(
      `SELECT ur.id, ur.profile_id, ur.assigned_franchise_id, COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) AS pincode
       FROM user_registration ur
       LEFT JOIN hindus h ON ur.profile_id = h.profile_id
       LEFT JOIN christians c ON ur.profile_id = c.profile_id
       LEFT JOIN muslims m ON ur.profile_id = m.profile_id
       LEFT JOIN others o ON ur.profile_id = o.profile_id
       WHERE LOWER(TRIM(ur.profile_id)) = LOWER(TRIM(?)) OR ur.id = ?
       LIMIT 1`,
      [targetId, targetId]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const customer = customerRows[0];
    const customerPin = customer.pincode ? String(customer.pincode).trim() : '';
    const custAssignedId = customer.assigned_franchise_id ? String(customer.assigned_franchise_id).trim().toLowerCase() : '';

    const isDirectlyAssigned = custAssignedId && (
      custAssignedId === String(codeFranchiseId || '').trim().toLowerCase() || 
      custAssignedId === String(franchiseId).trim().toLowerCase()
    );
    const isPincodeCovered = (!custAssignedId) && customerPin && assignedPins.includes(customerPin);

    if (!isDirectlyAssigned && !isPincodeCovered) {
      return res.status(403).json({
        error: 'Access denied. Customer is outside your franchise territory PIN code(s) and not assigned to your franchise.'
      });
    }

    // Attach target profile_id to request
    req.targetCustomerProfileId = customer.profile_id;
    next();
  } catch (error) {
    console.error('Error verifying customer PIN territory access:', error);
    res.status(500).json({ error: 'Internal server error while verifying territory access.' });
  }
};

// Franchise Login
export const franchiseLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Franchise ID/Email and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const [rows] = await pool.execute(
      `SELECT * FROM bm_franchise 
       WHERE LOWER(franchise_id) = ? OR LOWER(email) = ? 
       LIMIT 1`,
      [cleanIdentifier, cleanIdentifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Franchise ID/Email or password.' });
    }

    const franchise = rows[0];

    // Check franchise account status = active
    if (!franchise.status || franchise.status.toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Your franchise account is currently inactive. Please contact admin support.' });
    }

    // Check associated partnership request status if exists
    if (franchise.email) {
      const [reqRows] = await pool.execute(
        `SELECT status FROM bm_franchise_partnership_requests 
         WHERE LOWER(email) = ? 
         ORDER BY id DESC LIMIT 1`,
        [franchise.email.toLowerCase()]
      );

      if (reqRows.length > 0 && reqRows[0].status && reqRows[0].status.toUpperCase() !== 'APPROVED') {
        return res.status(403).json({ error: 'Franchise partnership application has not completed final approval.' });
      }
    }

    if (!franchise.password) {
      return res.status(401).json({ error: 'Password not set. Please use "Forgot Password" to receive login credentials.' });
    }

    const isMatch = await bcrypt.compare(password, franchise.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Franchise ID/Email or password.' });
    }

    const pinCodesArray = parsePinCodes(franchise.pin_codes);

    const tokenPayload = {
      id: franchise.id,
      franchise_id: franchise.franchise_id,
      name: franchise.name,
      owner: franchise.owner,
      email: franchise.email,
      location: franchise.location,
      role: 'franchise'
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      franchise: {
        id: franchise.id,
        franchise_id: franchise.franchise_id,
        name: franchise.name,
        owner: franchise.owner,
        email: franchise.email,
        phone: franchise.mobile_number,
        location: franchise.location,
        pin_codes: pinCodesArray,
        status: franchise.status
      }
    });
  } catch (error) {
    console.error('Franchise login error:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

// Franchise Forgot Password
export const franchiseForgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Please enter your Franchise ID or Registered Email.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const [rows] = await pool.query(
      `SELECT * FROM bm_franchise 
       WHERE LOWER(TRIM(franchise_id)) = ? OR LOWER(TRIM(email)) = ? 
       LIMIT 1`,
      [cleanIdentifier, cleanIdentifier]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No franchise account found with this Franchise ID or Email. Please check your credentials.' });
    }

    const franchise = rows[0];

    if (franchise.status && franchise.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ error: 'Your franchise account is currently inactive. Please contact Super Admin.' });
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let plainPassword = '';
    for (let i = 0; i < 8; i++) {
      plainPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    await pool.query('UPDATE bm_franchise SET password = ? WHERE id = ?', [hashedPassword, franchise.id]);

    const transporter = getTransporter();
    if (transporter && franchise.email) {
      const mailOptions = {
        from: `"Bharat Marriage Franchise" <${process.env.SMTP_USER}>`,
        to: franchise.email,
        subject: 'Franchise Portal Password Reset - Bharat Marriage',
        text: `Hello ${franchise.owner || franchise.name},\n\nYour temporary login password is: ${plainPassword}\nFranchise ID: ${franchise.franchise_id}\n\nLogin URL: https://kerala.bharathmarriage.com/franchise/login\n\nBest Regards,\nBharat Marriage Team`
      };

      transporter.sendMail(mailOptions).catch(err => console.error('[Franchise Forgot Password] Email sending error:', err));
    }

    res.status(200).json({ message: `A new temporary password has been sent to ${franchise.email}.` });
  } catch (error) {
    console.error('Franchise forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request. Please try again.' });
  }
};

// Franchise Dashboard Metrics (Strictly Assigned PIN Territory Statistics Only)
export const getFranchiseDashboard = async (req, res) => {
  try {
    const franchiseId = req.franchise.id;

    const [franchises] = await pool.execute('SELECT * FROM bm_franchise WHERE id = ?', [franchiseId]);
    if (franchises.length === 0) {
      return res.status(404).json({ error: 'Franchise not found.' });
    }

    const franchise = franchises[0];
    const pinCodesArray = parsePinCodes(franchise.pin_codes);
    const fCode = franchise.franchise_id || '';
    const fId = String(franchise.id);

    // Territory + Assigned Customers Filter
    let pinFilter = '(LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ?)';
    let queryParams = [fCode, fId];

    if (pinCodesArray.length > 0) {
      const placeholders = pinCodesArray.map(() => '?').join(',');
      pinFilter = `(LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ? OR (ur.assigned_franchise_id IS NULL AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})))`;
      queryParams = [fCode, fId, ...pinCodesArray];
    }

    // Territory Users Metrics Query
    const userMetricsQuery = `
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'ACTIVE' OR ur.status IS NULL THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'BLOCKED' THEN 1 ELSE 0 END) as blockedUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'BANNED' THEN 1 ELSE 0 END) as bannedUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'FREEZED' OR UPPER(ur.status) = 'INACTIVE' THEN 1 ELSE 0 END) as inactiveUsers,
        SUM(CASE WHEN (SELECT COUNT(*) FROM user_reports r WHERE r.reported_profile_id = ur.profile_id AND r.status != 'DISMISSED') > 0 THEN 1 ELSE 0 END) as reportedUsers
      FROM user_registration ur
      LEFT JOIN hindus h ON ur.profile_id = h.profile_id
      LEFT JOIN christians c ON ur.profile_id = c.profile_id
      LEFT JOIN muslims m ON ur.profile_id = m.profile_id
      LEFT JOIN others o ON ur.profile_id = o.profile_id
      WHERE ${pinFilter}
    `;

    const [metricsResult] = await pool.query(userMetricsQuery, queryParams);
    const m = metricsResult[0] || {};

    // Calculate Territory Revenue from user upgrades strictly in these assigned pincodes
    let territoryRevenue = 0;
    try {
      const revenueQuery = `
        SELECT SUM(uh.payable_amount) as totalRevenue
        FROM bm_upgrade_history uh
        JOIN user_registration ur ON uh.user_id = ur.id
        LEFT JOIN hindus h ON ur.profile_id = h.profile_id
        LEFT JOIN christians c ON ur.profile_id = c.profile_id
        LEFT JOIN muslims m ON ur.profile_id = m.profile_id
        LEFT JOIN others o ON ur.profile_id = o.profile_id
        WHERE ${pinFilter}
      `;
      const [revResult] = await pool.query(revenueQuery, queryParams);
      territoryRevenue = parseFloat(revResult[0]?.totalRevenue) || 0;
    } catch (err) {
      console.warn('Revenue query error in franchise dashboard:', err);
    }

    let formattedRevenue = `₹${territoryRevenue.toLocaleString()}`;
    if (territoryRevenue >= 100000) {
      formattedRevenue = `₹${(territoryRevenue / 100000).toFixed(2)}L`;
    }

    // Recent Territory Activity Logs
    let recentLogs = [];
    try {
      const logsQuery = `
        SELECT 
          'User' as type,
          CONCAT('New customer registered in territory (PIN: ', COALESCE(h.pincode, c.pincode, m.pincode, o.pincode, 'N/A'), ')') as message,
          ur.created_at as date
        FROM user_registration ur
        LEFT JOIN hindus h ON ur.profile_id = h.profile_id
        LEFT JOIN christians c ON ur.profile_id = c.profile_id
        LEFT JOIN muslims m ON ur.profile_id = m.profile_id
        LEFT JOIN others o ON ur.profile_id = o.profile_id
        WHERE ${pinFilter}
        ORDER BY ur.created_at DESC
        LIMIT 5
      `;
      const [logs] = await pool.query(logsQuery, queryParams);
      recentLogs = logs;
    } catch (err) {
      console.warn('Logs query error in franchise dashboard:', err);
    }

    res.status(200).json({
      franchise: {
        id: franchise.id,
        franchise_id: franchise.franchise_id,
        name: franchise.name,
        owner: franchise.owner,
        email: franchise.email,
        phone: franchise.mobile_number,
        location: franchise.location,
        pin_codes: pinCodesArray,
        status: franchise.status
      },
      metrics: {
        totalUsers: parseInt(m.totalUsers) || 0,
        activeUsers: parseInt(m.activeUsers) || 0,
        blockedUsers: parseInt(m.blockedUsers) || 0,
        bannedUsers: parseInt(m.bannedUsers) || 0,
        inactiveUsers: parseInt(m.inactiveUsers) || 0,
        reportedUsers: parseInt(m.reportedUsers) || 0,
        monthlyRevenue: formattedRevenue,
        rawRevenue: territoryRevenue,
        recentLogs: recentLogs
      }
    });
  } catch (error) {
    console.error('Error fetching franchise dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

// Franchise Customer Management (Assigned PIN Territory Customers Only, Sanitized Data)
export const getFranchiseCustomers = async (req, res) => {
  try {
    const franchiseId = req.franchise.id;
    const { search, gender, status, page = 1, limit = 10 } = req.query;

    const [franchises] = await pool.execute('SELECT * FROM bm_franchise WHERE id = ?', [franchiseId]);
    if (franchises.length === 0) {
      return res.status(404).json({ error: 'Franchise not found.' });
    }

    const franchise = franchises[0];
    const pinCodesArray = parsePinCodes(franchise.pin_codes);

    // Exclude all sensitive fields: passwords, refresh_token, password reset hashes, otp, etc.
    let baseSelect = `
      SELECT 
        ur.id, ur.profile_id, ur.full_name, ur.gender, ur.religion, ur.dob, 
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
        ur.mobile_number, ur.email_address, ur.country_code, ur.created_at,
        COALESCE(h.caste, c.caste, m.caste, o.caste, ur.caste) AS caste,
        COALESCE(h.height, c.height, m.height, o.height) AS height,
        COALESCE(h.education, c.education, m.education, o.education) AS education,
        COALESCE(h.profession, c.profession, m.profession, o.profession) AS profession,
        COALESCE(h.place, c.place, m.place, o.place) AS place,
        COALESCE(h.district, c.district, m.district, o.district) AS district,
        COALESCE(h.state, c.state, m.state, o.state) AS state,
        COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) AS pincode,
        h.nakshatra AS star,
        h.rasi AS rasi,
        COALESCE(h.house_name, c.house_name, m.house_name, o.house_name) AS house_name,
        COALESCE(h.street_locality, c.street_locality, m.street_locality, o.street_locality) AS street_locality,
        COALESCE(h.post_office, c.post_office, m.post_office, o.post_office) AS post_office
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

    const fCode = franchise.franchise_id || '';
    const fId = String(franchise.id);

    let filters = ` AND (LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ?)`;
    let queryParams = [fCode, fId];

    if (pinCodesArray.length > 0) {
      const placeholders = pinCodesArray.map(() => '?').join(',');
      filters = ` AND (LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ? OR (ur.assigned_franchise_id IS NULL AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})))`;
      queryParams = [fCode, fId, ...pinCodesArray];
    }

    // Search filter
    if (search) {
      filters += ` AND (
        ur.profile_id LIKE ? 
        OR ur.full_name LIKE ?
        OR ur.mobile_number LIKE ?
        OR ur.email_address LIKE ?
        OR COALESCE(h.profession, c.profession, m.profession, o.profession) LIKE ?
        OR COALESCE(h.place, c.place, m.place, o.place) LIKE ?
        OR COALESCE(h.district, c.district, m.district, o.district) LIKE ?
        OR COALESCE(h.state, c.state, m.state, o.state) LIKE ?
        OR COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
    if (status && status !== 'All' && status !== 'All Profiles') {
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
        queryParams.push(status.toUpperCase());
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pagination = ` ORDER BY has_pending_photos DESC, ur.created_at DESC LIMIT ? OFFSET ?`;

    const [customers] = await pool.query(baseSelect + filters + pagination, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await pool.query(countSelect + filters, queryParams);

    const total = countResult[0]?.total || 0;

    res.status(200).json({
      customers,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      demographics: {
        hindu: countResult[0]?.hinduUsers || 0,
        muslim: countResult[0]?.muslimUsers || 0,
        christian: countResult[0]?.christianUsers || 0,
        other: countResult[0]?.otherUsers || 0
      }
    });
  } catch (error) {
    console.error('Error fetching franchise customers:', error);
    res.status(500).json({ error: 'Failed to fetch customer list.' });
  }
};

// Franchise Payments & Revenue (Strictly Assigned PIN Territory Only)
export const getFranchisePayments = async (req, res) => {
  try {
    const franchiseId = req.franchise.id;
    const { search, plan, religion, startDate, endDate, page = 1, limit = 10 } = req.query;

    const [franchises] = await pool.execute('SELECT * FROM bm_franchise WHERE id = ?', [franchiseId]);
    if (franchises.length === 0) {
      return res.status(404).json({ error: 'Franchise not found.' });
    }

    const franchise = franchises[0];
    const pinCodesArray = parsePinCodes(franchise.pin_codes);

    const fCode = franchise.franchise_id || '';
    const fId = String(franchise.id);

    let pinFilter = '(LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ?)';
    let queryParams = [fCode, fId];

    if (pinCodesArray.length > 0) {
      const placeholders = pinCodesArray.map(() => '?').join(',');
      pinFilter = `(LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ? OR (ur.assigned_franchise_id IS NULL AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})))`;
      queryParams = [fCode, fId, ...pinCodesArray];
    }

    let query = `
      SELECT 
        uh.id, uh.user_id, uh.previous_plan, uh.new_plan, uh.credit_amount, uh.payable_amount, 
        uh.payment_id, uh.order_id, uh.created_at,
        ur.profile_id, ur.full_name, ur.mobile_number, ur.email_address, ur.religion,
        COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) as pincode,
        COALESCE(h.district, c.district, m.district, o.district) as district
      FROM bm_upgrade_history uh
      JOIN user_registration ur ON uh.user_id = ur.id
      LEFT JOIN hindus h ON ur.profile_id = h.profile_id
      LEFT JOIN christians c ON ur.profile_id = c.profile_id
      LEFT JOIN muslims m ON ur.profile_id = m.profile_id
      LEFT JOIN others o ON ur.profile_id = o.profile_id
      WHERE ${pinFilter}
    `;

    if (search) {
      query += ` AND (ur.profile_id LIKE ? OR ur.full_name LIKE ? OR uh.payment_id LIKE ? OR uh.order_id LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (plan && plan !== 'All' && plan !== 'All Plans') {
      query += ` AND UPPER(uh.new_plan) = ?`;
      queryParams.push(plan.toUpperCase());
    }

    if (religion && religion !== 'All' && religion !== 'All Religions') {
      query += ` AND UPPER(ur.religion) = ?`;
      queryParams.push(religion.toUpperCase());
    }

    if (startDate) {
      query += ` AND DATE(uh.created_at) >= ?`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(uh.created_at) <= ?`;
      queryParams.push(endDate);
    }

    const [allPayments] = await pool.query(query + ` ORDER BY uh.created_at DESC`, queryParams);
    
    const totalRevenue = allPayments.reduce((acc, row) => acc + (parseFloat(row.payable_amount) || 0), 0);
    const totalTransactions = allPayments.length;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedPayments = allPayments.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      payments: paginatedPayments,
      total: totalTransactions,
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      rawTotalRevenue: totalRevenue,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalTransactions / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching franchise payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments and revenue.' });
  }
};
