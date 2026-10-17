import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const verifyUserSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // 1. Verify the JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Check if it's an admin, superadmin, staff, or franchise token
    if (decoded.role === 'superadmin' || decoded.role === 'staff' || decoded.role === 'franchise') {
      req.user = decoded;
      return next();
    }

    // 2. Check the database to see if the session was invalidated (Force Logout) or Account Banned
    const [users] = await pool.query('SELECT refresh_token, status FROM user_registration WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Session expired or forcefully logged out.' });
    }

    const userStatus = (users[0].status || '').toUpperCase();
    if (userStatus === 'BANNED') {
      return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
    }

    if (userStatus === 'BLOCKED') {
      return res.status(403).json({ error: 'Admin has blocked this account. Please contact support.' });
    }

    if (userStatus === 'DEACTIVATED') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support to request reactivation.' });
    }

    if (userStatus === 'FREEZED') {
      return res.status(403).json({ error: 'Your account has been frozen by administration. Please contact support.' });
    }

    if (!users[0].refresh_token) {
      return res.status(401).json({ error: 'Session expired or forcefully logged out.' });
    }

    // 3. User is fully authenticated and session is valid
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', isExpired: true });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

export const verifyAdminSession = async (req, res, next) => {
  try {
    // Bypass authentication for public staff endpoints (login & forgot password)
    if (req.path === '/staff/login' || req.path === '/staff/forgot-password') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    console.log('verifyAdminSession DECODED:', decoded);

    // Check if the role is superadmin or staff
    if (decoded.role !== 'superadmin' && decoded.role !== 'staff') {
      console.log('verifyAdminSession FORBIDDEN. Role is:', decoded.role);
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    // Immediately block deactivated staff members
    if (decoded.role === 'staff') {
      const [staffs] = await pool.query('SELECT account_status FROM bm_staff_data WHERE staff_id = ?', [decoded.id]);
      if (staffs.length === 0 || staffs[0].account_status !== 'active') {
        return res.status(403).json({ error: 'Your staff account has been deactivated by the admin.' });
      }
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin token expired', isExpired: true });
    }
    return res.status(401).json({ error: 'Invalid admin token.' });
  }
};
// Optional auth: sets req.user if token is valid, but never blocks the request
export const optionalUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded.role === 'superadmin' || decoded.role === 'staff' || decoded.role === 'franchise') {
        req.user = decoded;
        return next();
      }
      // Verify session is still active
      const [users] = await pool.query('SELECT refresh_token, status FROM user_registration WHERE id = ?', [decoded.id]);
      if (users.length > 0 && users[0].refresh_token && users[0].status !== 'BANNED' && users[0].status !== 'BLOCKED') {
        req.user = decoded;
      }
    }
  } catch (_) {
    // Token invalid or expired — just skip, treat as guest
  }
  next();
};

export const verifyFranchiseSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.role !== 'franchise') {
      return res.status(403).json({ error: 'Forbidden. Franchise partner access required.' });
    }

    const [rows] = await pool.query('SELECT id, franchise_id, status FROM bm_franchise WHERE id = ?', [decoded.id]);
    if (rows.length === 0 || rows[0].status?.toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Your franchise account is inactive or not found.' });
    }

    req.franchise = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.', isExpired: true });
    }
    return res.status(401).json({ error: 'Invalid authentication session.' });
  }
};

