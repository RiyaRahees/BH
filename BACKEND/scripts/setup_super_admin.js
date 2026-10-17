import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function setupSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_ID;
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !plainPassword) {
      console.error('Super admin credentials missing from .env');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    const [existing] = await pool.query('SELECT * FROM bm_admins WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      await pool.query('UPDATE bm_admins SET password_hash = ? WHERE email = ?', [hash, email]);
      console.log('Super admin updated.');
    } else {
      await pool.query('INSERT INTO bm_admins (email, password_hash, role) VALUES (?, ?, ?)', [email, hash, 'superadmin']);
      console.log('Super admin created.');
    }
  } catch (err) {
    console.error('Error setup super admin:', err);
  } finally {
    process.exit();
  }
}

setupSuperAdmin();
