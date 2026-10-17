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
    console.log('Creating bm_chat_messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_chat_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        sender_id BIGINT NOT NULL,
        receiver_id BIGINT NOT NULL,
        message TEXT NOT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sender_receiver (sender_id, receiver_id),
        INDEX idx_receiver_sender (receiver_id, sender_id),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('bm_chat_messages table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
