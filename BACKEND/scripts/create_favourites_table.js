import pool from '../config/db.js';

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_favourites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_profile_id VARCHAR(50) NOT NULL,
        favourite_profile_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favourite (user_profile_id, favourite_profile_id)
      )
    `);
    console.log("Table created successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTable();
