import mysql from 'mysql2/promise';
import 'dotenv/config';

const migrate = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootuser',
    database: process.env.DB_NAME || 'bharat_marriage_kerala',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Starting subscription migration...');

    // 1. Update ENUM for plan
    console.log('Updating plan ENUM...');
    await pool.query(`
      ALTER TABLE user_registration 
      MODIFY COLUMN plan ENUM('FREE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND') DEFAULT 'FREE'
    `);

    // 2. Add subscription dates
    console.log('Adding subscription dates...');
    
    // Check if columns exist to prevent errors if run multiple times
    const [columns] = await pool.query(`SHOW COLUMNS FROM user_registration LIKE 'subscription_start_date'`);
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE user_registration 
        ADD COLUMN subscription_start_date DATETIME NULL AFTER plan,
        ADD COLUMN subscription_expiry_date DATETIME NULL AFTER subscription_start_date
      `);
    } else {
      console.log('subscription dates already exist, skipping...');
    }

    // 3. Create bm_upgrade_history table
    console.log('Creating bm_upgrade_history table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_upgrade_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        previous_plan VARCHAR(50) NOT NULL,
        new_plan VARCHAR(50) NOT NULL,
        credit_amount DECIMAL(10, 2) NOT NULL,
        payable_amount DECIMAL(10, 2) NOT NULL,
        payment_id VARCHAR(100) NOT NULL,
        order_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
