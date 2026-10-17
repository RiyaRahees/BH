import pool from '../config/db.js';
import bcrypt from 'bcrypt';

async function setupFranchise() {
  try {
    const password = 'Franchise@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Update existing BM-TSR-001 with known password
    await pool.query(
      `UPDATE bm_franchise 
       SET password = ?, status = 'active' 
       WHERE franchise_id = 'BM-TSR-001' OR email = 'shanu@gamail.com'`,
      [hashedPassword]
    );

    // 2. Also ensure a standard Ernakulam demo franchise (BM-EKM-001) exists with full active status
    const [existing] = await pool.query(
      `SELECT id, franchise_id, email FROM bm_franchise WHERE franchise_id = 'BM-EKM-001' OR email = 'franchise@bharathmarriage.com'`
    );

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO bm_franchise 
         (franchise_id, name, owner, location, mobile_number, email, pin_codes, status, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'BM-EKM-001',
          'Ernakulam Central Franchise',
          'Rahul Nair',
          'Kochi, Ernakulam',
          '+91 98470 12345',
          'franchise@bharathmarriage.com',
          JSON.stringify(['682001', '682002', '682003', '682011', '682016', '682020']),
          'active',
          hashedPassword
        ]
      );
      console.log('Created BM-EKM-001 successfully.');
    } else {
      await pool.query(
        `UPDATE bm_franchise 
         SET password = ?, status = 'active' 
         WHERE id = ?`,
        [hashedPassword, existing[0].id]
      );
      console.log('Updated BM-EKM-001 successfully.');
    }

    const [all] = await pool.query('SELECT id, franchise_id, name, email, status FROM bm_franchise');
    console.log('Current Active Franchises:', all);

    process.exit(0);
  } catch (error) {
    console.error('Error setting up franchise:', error);
    process.exit(1);
  }
}

setupFranchise();
