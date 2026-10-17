import pool from '../config/db.js';

export async function createInterestsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS bm_interests (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      sender_id VARCHAR(20) NOT NULL,
      receiver_id VARCHAR(20) NOT NULL,
      status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_interest (sender_id, receiver_id),
      INDEX idx_sender (sender_id),
      INDEX idx_receiver (receiver_id)
    );
  `;
  try {
    await pool.query(query);
    console.log("bm_interests table verified/created successfully.");
  } catch (err) {
    console.error("Error creating bm_interests table:", err.message);
  }
}

createInterestsTable();
