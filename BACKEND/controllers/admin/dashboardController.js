import pool from '../../config/db.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const { franchise_id } = req.query;

    let baseQuery = `
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'ACTIVE' OR ur.status IS NULL THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'BLOCKED' THEN 1 ELSE 0 END) as blockedUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'BANNED' THEN 1 ELSE 0 END) as bannedUsers,
        SUM(CASE WHEN UPPER(ur.status) = 'FREEZED' THEN 1 ELSE 0 END) as freezedUsers,
        SUM(CASE WHEN (SELECT COUNT(*) FROM user_reports r WHERE r.reported_profile_id = ur.profile_id AND r.status != 'DISMISSED') > 0 THEN 1 ELSE 0 END) as reportedUsers,
        SUM(CASE WHEN UPPER(ur.plan) != 'FREE' THEN 1 ELSE 0 END) as activeSubscribers,
        SUM(CASE WHEN UPPER(ur.religion) = 'HINDU' THEN 1 ELSE 0 END) as hinduUsers,
        SUM(CASE WHEN UPPER(ur.religion) = 'MUSLIM' THEN 1 ELSE 0 END) as muslimUsers,
        SUM(CASE WHEN UPPER(ur.religion) = 'CHRISTIAN' THEN 1 ELSE 0 END) as christianUsers,
        SUM(CASE WHEN UPPER(ur.religion) NOT IN ('HINDU', 'MUSLIM', 'CHRISTIAN') THEN 1 ELSE 0 END) as otherUsers
      FROM user_registration ur
    `;
    let queryParams = [];

    if (franchise_id && franchise_id !== 'HEAD_OFFICE' && franchise_id !== 'All' && franchise_id !== 'null' && franchise_id !== 'undefined') {
      baseQuery = `
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN UPPER(ur.status) = 'ACTIVE' OR ur.status IS NULL THEN 1 ELSE 0 END) as activeUsers,
          SUM(CASE WHEN UPPER(ur.status) = 'BLOCKED' THEN 1 ELSE 0 END) as blockedUsers,
          SUM(CASE WHEN UPPER(ur.status) = 'BANNED' THEN 1 ELSE 0 END) as bannedUsers,
          SUM(CASE WHEN UPPER(ur.status) = 'FREEZED' THEN 1 ELSE 0 END) as freezedUsers,
          SUM(CASE WHEN (SELECT COUNT(*) FROM user_reports r WHERE r.reported_profile_id = ur.profile_id AND r.status != 'DISMISSED') > 0 THEN 1 ELSE 0 END) as reportedUsers,
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
          baseQuery += ` AND (LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ? OR (ur.assigned_franchise_id IS NULL AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})))`;
          queryParams.push(fCode, fId, ...cleanPins);
        } else {
          baseQuery += ` AND (LOWER(TRIM(ur.assigned_franchise_id)) = LOWER(TRIM(?)) OR ur.assigned_franchise_id = ?)`;
          queryParams.push(fCode, fId);
        }
      } else {
        baseQuery += ` AND 1=0`;
      }
    }

    const [rows] = await pool.execute(baseQuery, queryParams);
    
    const [staffRows] = await pool.execute('SELECT COUNT(*) as totalStaffs FROM bm_staff_data');

    // Calculate dynamic Total Revenue (matching Payment Revenue logic)
    const [revenueRows] = await pool.execute(`
      SELECT SUM(payable_amount) as total 
      FROM bm_upgrade_history
    `);

    // Calculate active subscribers based on successful upgrades (matching Payment Revenue logic)
    const [subscriberRows] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM bm_upgrade_history
    `);

    // Format Revenue
    let rawRevenue = parseFloat(revenueRows[0].total) || 0;
    let formattedRevenue = `₹${rawRevenue.toLocaleString()}`;
    if (rawRevenue >= 100000) {
      formattedRevenue = `₹${(rawRevenue / 100000).toFixed(2)}L`;
    }

    // Fetch Recent Logs
    const [upgrades] = await pool.execute(`
      SELECT 'Finance' as type, CONCAT('Subscription plan pricing updated: ', new_plan) as message, created_at as date 
      FROM bm_upgrade_history 
      ORDER BY created_at DESC LIMIT 3
    `);
    
    const [staffs] = await pool.execute(`
      SELECT 'Staff' as type, CONCAT('New staff member added: ', name) as message, created_at as date 
      FROM bm_staff_data 
      ORDER BY created_at DESC LIMIT 3
    `);
    
    const [newUsers] = await pool.execute(`
      SELECT 'User' as type, CONCAT('New user registered: ', full_name) as message, created_at as date 
      FROM user_registration 
      ORDER BY created_at DESC LIMIT 3
    `);

    // Combine and sort logs by date descending, take top 4
    const allLogs = [...upgrades, ...staffs, ...newUsers]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);

    const formattedLogs = allLogs.map(log => ({
      message: log.message,
      date: log.date,
      type: log.type
    }));

    res.status(200).json({
      totalUsers: parseInt(rows[0].totalUsers) || 0,
      activeUsers: parseInt(rows[0].activeUsers) || 0,
      blockedUsers: parseInt(rows[0].blockedUsers) || 0,
      bannedUsers: parseInt(rows[0].bannedUsers) || 0,
      freezedUsers: parseInt(rows[0]?.freezedUsers) || 0,
      reportedUsers: parseInt(rows[0]?.reportedUsers) || 0,
      activeSubscribers: parseInt(subscriberRows[0]?.count) || 0,
      totalStaffs: parseInt(staffRows[0]?.totalStaffs) || 0,
      monthlyRevenue: formattedRevenue,
      hinduUsers: parseInt(rows[0]?.hinduUsers) || 0,
      muslimUsers: parseInt(rows[0]?.muslimUsers) || 0,
      christianUsers: parseInt(rows[0]?.christianUsers) || 0,
      otherUsers: parseInt(rows[0]?.otherUsers) || 0,
      recentLogs: formattedLogs
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};
