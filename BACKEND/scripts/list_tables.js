import pool from '../config/db.js';

async function listTables() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTables();
