import mysql from 'mysql2/promise';
import 'dotenv/config';

const resetPlans = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootuser',
    database: process.env.DB_NAME || 'bharat_marriage_kerala',
  });

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM user_registration LIKE 'is_free_trial_claimed'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE user_registration ADD COLUMN is_free_trial_claimed TINYINT(1) DEFAULT 0 AFTER subscription_expiry_date");
      console.log('Added is_free_trial_claimed column.');
    }

    await pool.query("UPDATE user_registration SET plan = 'FREE', is_free_trial_claimed = 0, subscription_start_date = NULL, subscription_expiry_date = NULL");
    console.log('Successfully reset all users to FREE plan with unclaimed 365-day free trial!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPlans();
