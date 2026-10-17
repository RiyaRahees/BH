import pool from '../../config/db.js';

export const getPaymentHistory = async (req, res) => {
  try {
    // Check if expiry_date column exists in bm_upgrade_history
    const [cols] = await pool.query(`SHOW COLUMNS FROM bm_upgrade_history LIKE 'expiry_date'`);
    const hasExpiryCol = cols.length > 0;

    const expiryExpr = hasExpiryCol
      ? `COALESCE(
          uh.expiry_date,
          ur.subscription_expiry_date,
          DATE_ADD(uh.created_at, INTERVAL (
            CASE 
              WHEN uh.new_plan LIKE '%365%' OR uh.new_plan LIKE '%Year%' THEN 365 
              WHEN uh.new_plan LIKE '%Diamond%' THEN 90 
              WHEN uh.new_plan LIKE '%Platinum%' THEN 60 
              WHEN uh.new_plan LIKE '%Gold%' THEN 30 
              ELSE 30 
            END
          ) DAY)
        )`
      : `COALESCE(
          ur.subscription_expiry_date,
          DATE_ADD(uh.created_at, INTERVAL (
            CASE 
              WHEN uh.new_plan LIKE '%365%' OR uh.new_plan LIKE '%Year%' THEN 365 
              WHEN uh.new_plan LIKE '%Diamond%' THEN 90 
              WHEN uh.new_plan LIKE '%Platinum%' THEN 60 
              WHEN uh.new_plan LIKE '%Gold%' THEN 30 
              ELSE 30 
            END
          ) DAY)
        )`;

    // Join bm_upgrade_history with user_registration to get user details
    const query = `
      SELECT 
        uh.id,
        uh.user_id,
        ur.profile_id,
        ur.full_name as user_name,
        ur.religion as user_religion,
        uh.new_plan as package_name,
        uh.payable_amount as amount,
        'Razorpay' as method,
        DATE_FORMAT(uh.created_at, '%Y-%m-%d') as date,
        DATE_FORMAT(${expiryExpr}, '%Y-%m-%d') as expire_date,
        uh.payment_id as reference,
        'Success' as status
      FROM bm_upgrade_history uh
      JOIN user_registration ur ON uh.user_id = ur.id
      ORDER BY uh.created_at DESC
    `;

    const [rows] = await pool.query(query);

    // Format the data to match the frontend expectations
    const formattedData = rows.map(row => ({
      id: `TXN-${row.id}`,
      userId: row.profile_id,
      userName: row.user_name,
      userReligion: row.user_religion,
      packageName: row.package_name,
      amount: parseFloat(row.amount),
      method: row.method,
      date: row.date,
      expireDate: row.expire_date || 'N/A',
      status: row.status,
      reference: row.reference
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Internal server error while fetching payment history.' });
  }
};
