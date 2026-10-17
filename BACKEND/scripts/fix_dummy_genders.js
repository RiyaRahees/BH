import pool from '../config/db.js';

async function check() {
  const [u] = await pool.query("SELECT profile_id, full_name, gender FROM user_registration WHERE full_name LIKE '%Fathima Noor%'");
  const [m] = await pool.query("SELECT profile_id, name, gender FROM muslims WHERE name LIKE '%Fathima Noor%'");
  console.log('user_reg Fathima Noor:', u[0]);
  console.log('muslims Fathima Noor:', m[0]);
  process.exit(0);
}

check();
