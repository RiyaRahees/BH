import mysql from 'mysql2/promise';
import 'dotenv/config';

const setDiamond = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootuser',
    database: process.env.DB_NAME || 'bharat_marriage_kerala',
  });

  try {
    await pool.query('UPDATE user_registration SET plan = "DIAMOND" WHERE profile_id IN ("BKLM00000000043", "BKLM11000000038") OR full_name LIKE "%Shahal%"');
    console.log('Successfully set plan to DIAMOND for Shahal accounts!');

    const [rows] = await pool.query('SELECT id, profile_id, full_name, plan FROM user_registration WHERE full_name LIKE "%Shahal%"');
    console.log('Updated user records:', rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

setDiamond();
