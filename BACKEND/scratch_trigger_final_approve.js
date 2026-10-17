import pool from './config/db.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api';
const adminToken = jwt.sign(
  { id: 1, role: 'superadmin', username: 'SUPER_ADMIN' },
  process.env.JWT_ACCESS_SECRET || 'test_secret',
  { expiresIn: '1h' }
);

async function testFinalApproveFPR0025() {
  try {
    const res = await axios.post(
      `${API_BASE}/admin/franchise-partnership-requests/48/final-approve`,
      { assignedPinCodes: ['682014', '682004', '682012'] },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Final approve response for FPR0025:', res.data);
    
    // Check bm_franchise in DB
    const [rows] = await pool.query('SELECT franchise_id, name, owner, email, status, pin_codes FROM bm_franchise WHERE email = ?', ['shahal.programmers@gmail.com']);
    console.log('bm_franchise entry:', rows);

    // Check request status in DB
    const [reqs] = await pool.query('SELECT request_id, status FROM bm_franchise_partnership_requests WHERE id = 48');
    console.log('bm_franchise_partnership_requests status:', reqs);

  } catch (err) {
    console.error('Final approve error:', err.response?.data || err.message);
  } finally {
    process.exit();
  }
}

testFinalApproveFPR0025();
