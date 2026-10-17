import mysql from 'mysql2/promise';
import 'dotenv/config';

const check = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootuser',
    database: process.env.DB_NAME || 'bharat_marriage_kerala',
  });

  try {
    const profileId = 'BKLM11000000038';
    const [users] = await pool.query(
      'SELECT id, profile_id, full_name, plan, country_code, mobile_number, email_address, religion, dob, gender, district, created_at, photo_1, photo_2, photo_3, photo_4 FROM user_registration WHERE profile_id = ?',
      [profileId]
    );
    console.log('User reg row:', users[0]);

    const [profileDetails] = await pool.query(
      'SELECT * FROM muslims WHERE profile_id = ?',
      [profileId]
    );
    const profile = profileDetails[0];
    profile.plan = users[0].plan || 'FREE';
    console.log('Final profile object plan:', profile.plan);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
