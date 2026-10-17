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
    console.log('Ensuring bm_upgrade_history table exists...');
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
    console.log('bm_upgrade_history table verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
