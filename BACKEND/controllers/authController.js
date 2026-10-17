import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import {
  getEmailTransporter,
  sendNotificationEmail,
  sendUserRegistrationWelcomeEmail,
  sendForgotPasswordResetEmail
} from '../utils/emailService.js';
import { getEffectivePlan } from '../utils/planUtils.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email_address },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Helper to convert "18 Oct 1994" to "1994-10-18" for MySQL DATE column
const formatDateForDB = (dobString) => {
  if (!dobString) return null;
  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  const parts = String(dobString).trim().split(' ');
  if (parts.length === 3) {
    const [day, monthStr, year] = parts;
    const month = months[monthStr];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }
  // Fallback to JS Date if format is unexpected
  const d = new Date(dobString);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return dobString;
};

// Helper to calculate exact age in years from DOB string
const calculateAgeFromDob = (dobString) => {
  if (!dobString) return null;
  const formatted = formatDateForDB(dobString);
  if (!formatted) return null;
  const birthDate = new Date(formatted);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper to fetch dynamic age limits from bm_system_settings
const getSystemAgeLimits = async () => {
  try {
    const [rows] = await pool.query('SELECT min_bride_age, min_groom_age FROM bm_system_settings WHERE id = 1 LIMIT 1');
    if (rows && rows.length > 0) {
      return {
        minBrideAge: rows[0].min_bride_age !== undefined && rows[0].min_bride_age !== null ? Number(rows[0].min_bride_age) : 18,
        minGroomAge: rows[0].min_groom_age !== undefined && rows[0].min_groom_age !== null ? Number(rows[0].min_groom_age) : 21
      };
    }
  } catch (err) {
    console.error('Error reading age limits from system settings:', err);
  }
  return { minBrideAge: 18, minGroomAge: 21 };
};

import { findActiveFranchiseForPincode } from '../utils/franchiseAssignmentUtils.js';

export const register = async (req, res) => {
  let { full_name, country_code, mobile_number, email_address, religion, caste, district, pincode, dob, gender } = req.body;

  if (full_name) {
    full_name = full_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  try {
    const formattedDob = formatDateForDB(dob);

    // 0. Dynamic Age Validation check based on Admin System Settings
    if (dob) {
      const { minBrideAge, minGroomAge } = await getSystemAgeLimits();
      const isFemale = gender && gender.toLowerCase() === 'female';
      const minRequiredAge = isFemale ? minBrideAge : minGroomAge;
      const roleName = isFemale ? 'Bride' : 'Groom';
      const userAge = calculateAgeFromDob(dob);

      if (userAge !== null && userAge < minRequiredAge) {
        return res.status(400).json({
          error: `Registration requires minimum age of ${minRequiredAge} years for ${roleName}. (Entered age: ${userAge} years)`
        });
      }
    }

    // 1. Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM user_registration WHERE email_address = ? OR mobile_number = ?',
      [email_address, mobile_number]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email or mobile number already exists.' });
    }

    // Check franchise coverage for user's pincode (STRICT PINCODE ONLY - NO DISTRICT FALLBACK)
    let assignedFranchiseId = null;
    if (pincode) {
      const matchedFranchise = await findActiveFranchiseForPincode(pincode);
      if (matchedFranchise) {
        assignedFranchiseId = matchedFranchise.franchise_id;
      }
    }

    // 2. Generate and Hash password
    const namePrefix = full_name.replace(/\s+/g, '').substring(0, 4);
    const year = dob ? String(dob).trim().split(' ').pop() : '';
    const plainPassword = `${namePrefix}${year}`;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // 3. Insert new user
    const insertQuery = `
      INSERT INTO user_registration 
      (full_name, country_code, mobile_number, email_address, religion, caste, district, dob, gender, password, assigned_franchise_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [full_name, country_code || '+91', mobile_number, email_address, religion, caste || null, district, formattedDob, gender, hashedPassword, assignedFranchiseId];

    const [result] = await pool.query(insertQuery, values);
    const userId = result.insertId;

    // Generate custom profile_id (e.g., BKLH08000000001)
    const stateCode = 'KL';
    let religionInitial = religion ? religion.charAt(0).toUpperCase() : 'T';
    if (religion === 'Other') {
      religionInitial = 'T';
    }

    let districtCode = '00';
    if (district) {
      const match = district.match(/^(\d{2})/);
      if (match) {
        districtCode = match[1];
      }
    }

    const paddedId = String(userId).padStart(9, '0');
    const profileId = `B${stateCode}${religionInitial}${districtCode}${paddedId}`;

    // 4. Update profile_id and refresh token in DB
    const { accessToken, refreshToken } = generateTokens({ id: userId, email_address });

    await pool.query(
      'UPDATE user_registration SET profile_id = ?, refresh_token = ? WHERE id = ?',
      [profileId, refreshToken, userId]
    );

    // 5. Insert user into matching religion table
    let matchingTable = 'others';
    switch (religion) {
      case 'Hindu': matchingTable = 'hindus'; break;
      case 'Christian': matchingTable = 'christians'; break;
      case 'Muslim': matchingTable = 'muslims'; break;
    }

    let age = calculateAgeFromDob(formattedDob);

    await pool.query(
      `INSERT INTO ${matchingTable} (profile_id, name, gender, age, district, caste, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [profileId, full_name, gender, age, district, caste || null, pincode || null]
    );

    // 6. Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 7. Send Welcome Email with generated password & direct login URL
    try {
      await sendUserRegistrationWelcomeEmail({
        email_address,
        full_name,
        profile_id: profileId,
        plainPassword
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // 8. Send Notification Email to Admin
    const transporter = getEmailTransporter();
    if (transporter) {
      const adminLoginUrl = `${process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com'}/admin/login`;
      const adminMailOptions = {
        from: `"Bharat Marriage System" <${process.env.SMTP_USER}>`,
        to: 'help@bharathmarriage.com',
        subject: 'New User Registration Alert',
        text: `Hello Admin,\n\nA new user has just registered on Bharat Marriage.\n\nName: ${full_name}\nProfile ID: ${profileId}\nEmail: ${email_address}\nMobile: ${mobile_number}\nGender: ${gender}\nReligion: ${religion}\n\nAdmin Portal Login: ${adminLoginUrl}\n\nPlease check the admin dashboard for more details.`
      };

      try {
        await transporter.sendMail(adminMailOptions);
      } catch (adminEmailError) {
        console.error('Failed to send admin notification email:', adminEmailError);
      }
    }

    const now = new Date().toISOString();
    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: userId,
        profile_id: profileId,
        full_name,
        email_address,
        mobile_number,
        religion,
        gender,
        plan: 'DIAMOND',
        created_at: now
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const identifier = req.body.identifier || req.body.email_address || req.body.mobile_number;
  const { password } = req.body;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or Mobile number and password are required' });
    }

    // 1. Find user (check profile_id, email_address, or mobile_number)
    const [users] = await pool.query(
      'SELECT * FROM user_registration WHERE profile_id = ? OR email_address = ? OR mobile_number = ?',
      [identifier, identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid ID/email or password. Please try again.' });
    }

    const user = users[0];

    if (user.account_status === 'Banned' || user.status === 'Banned' || user.status === 'BANNED' || user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
    }

    if (user.account_status === 'Blocked' || user.status === 'Blocked' || user.status === 'BLOCKED' || user.status === 'blocked') {
      return res.status(403).json({ error: 'Admin has blocked this account. Please contact support.' });
    }

    if (user.account_status === 'Freezed' || user.status === 'Freezed' || user.status === 'FREEZED' || user.status === 'freezed') {
      return res.status(403).json({ error: 'Your account has been frozen by the administration. Please contact support.' });
    }

    if (user.status === 'DELETED') {
      return res.status(403).json({ error: 'Your account has been permanently deleted.' });
    }

    if (user.status === 'DEACTIVATED') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support to request reactivation.' });
    }

    if (user.status === 'PENDING_DELETE') {
      const deleteRequestedAt = new Date(user.delete_requested_at);
      const now = new Date();
      const diffTime = Math.abs(now - deleteRequestedAt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        await pool.query('UPDATE user_registration SET status = ? WHERE id = ?', ['DELETED', user.id]);
        return res.status(403).json({ error: 'Your account has been permanently deleted.' });
      } else {
        // Cancel the deletion
        await pool.query('UPDATE user_registration SET status = ?, delete_requested_at = NULL WHERE id = ?', ['ACTIVE', user.id]);
        user.status = 'ACTIVE';
        user.delete_requested_at = null;

        // Send recovery email
        await sendNotificationEmail({
          to: user.email_address,
          subject: 'Account Successfully Recovered',
          text: `Hello ${user.full_name},\n\nYou have successfully logged in, and your account deletion request has been cancelled.\n\nYour account is now fully active and visible again.\n\nBest Regards,\nBharat Marriage`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <h2>Account Recovered</h2>
              <p>Hello ${user.full_name},</p>
              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Welcome back!</strong><br>
                You have successfully logged in, and your account deletion request has been cancelled.
              </div>
              <p>Your account is now fully active and visible again to other users.</p>
              <p>Best Regards,<br>Bharat Marriage</p>
            </div>
          `
        });
      }
    }

    if (user.status === 'PENDING_DEACTIVATE') {
      const deactivateRequestedAt = new Date(user.deactivate_requested_at);
      const now = new Date();
      const diffTime = Math.abs(now - deactivateRequestedAt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        await pool.query('UPDATE user_registration SET status = ? WHERE id = ?', ['DEACTIVATED', user.id]);
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact support to request reactivation.' });
      } else {
        // Cancel the deactivation
        await pool.query('UPDATE user_registration SET status = ?, deactivate_requested_at = NULL WHERE id = ?', ['ACTIVE', user.id]);
        user.status = 'ACTIVE';
        user.deactivate_requested_at = null;

        // Send recovery email
        await sendNotificationEmail({
          to: user.email_address,
          subject: 'Account Deactivation Cancelled',
          text: `Hello ${user.full_name},\n\nYou have successfully logged in, and your account deactivation request has been cancelled.\n\nYour account is now fully active and visible again.\n\nBest Regards,\nBharat Marriage`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <h2>Deactivation Cancelled</h2>
              <p>Hello ${user.full_name},</p>
              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Welcome back!</strong><br>
                You have successfully logged in, and your account deactivation request has been cancelled.
              </div>
              <p>Your account is now fully active and visible again to other users.</p>
              <p>Best Regards,<br>Bharat Marriage</p>
            </div>
          `
        });
      }
    }

    // 1.1 Age validation check based on current Admin System Settings
    if (user.dob) {
      const { minBrideAge, minGroomAge } = await getSystemAgeLimits();
      const isFemale = user.gender && user.gender.toLowerCase() === 'female';
      const minRequiredAge = isFemale ? minBrideAge : minGroomAge;
      const roleName = isFemale ? 'brides' : 'grooms';
      const userAge = calculateAgeFromDob(user.dob);

      if (userAge !== null && userAge < minRequiredAge) {
        return res.status(403).json({
          error: `Access restricted: Minimum age requirement is ${minRequiredAge} years for ${roleName}. Your profile age is ${userAge} years. Please contact support.`
        });
      }
    }

    // 2. Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    // Auto-verify user on successful login (since they received the password via email)
    if (!user.verification || user.verification.toUpperCase() === 'UNVERIFIED') {
      await pool.query('UPDATE user_registration SET verification = ? WHERE id = ?', ['VERIFIED', user.id]);
      user.verification = 'VERIFIED'; // Update local object for the response
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // 4. Update refresh token in DB
    await pool.query('UPDATE user_registration SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    // 5. Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const effectivePlan = getEffectivePlan(user);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        profile_id: user.profile_id,
        full_name: user.full_name,
        email_address: user.email_address,
        mobile_number: user.mobile_number,
        religion: user.religion,
        gender: user.gender,
        plan: effectivePlan,
        status: user.status || 'Active',
        created_at: user.created_at,
        photo_1: user.photo_1
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ error: 'Refresh token not found' });

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Check if token matches the one in DB
    const [users] = await pool.query('SELECT * FROM user_registration WHERE id = ? AND refresh_token = ?', [decoded.id, token]);

    if (users.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = users[0];

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in DB
    await pool.query('UPDATE user_registration SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, profile_id, full_name, email_address, mobile_number, religion, gender, plan, is_free_trial_claimed, subscription_start_date, subscription_expiry_date, status, created_at, photo_1 FROM user_registration WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ valid: false, error: 'User not found' });
    }
    const userData = {
      ...users[0],
      plan: getEffectivePlan(users[0])
    };
    res.status(200).json({ valid: true, user: userData });
  } catch (error) {
    console.error('getMe Error:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, { ignoreExpiration: true });
      // Remove refresh token from DB
      await pool.query('UPDATE user_registration SET refresh_token = NULL WHERE id = ?', [decoded.id]);
    } catch (err) {
      console.error('Logout error clearing token from DB:', err);
    }
  }

  // Clear cookie
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  const { email_address } = req.body;

  try {
    if (!email_address) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // 1. Find user by email
    const [users] = await pool.query(
      'SELECT * FROM user_registration WHERE email_address = ?',
      [email_address]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const user = users[0];

    // 2. Generate a clean random password (easy to copy and read)
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let pass = '';
      for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pass;
    };

    const newPassword = generateRandomPassword();

    // 3. Send email with temporary password & Login URL FIRST
    try {
      const sent = await sendForgotPasswordResetEmail({
        email_address,
        full_name: user.full_name,
        plainPassword: newPassword
      });

      if (!sent) {
        return res.status(500).json({ error: 'Email service is not configured or failed to send email. Please contact support.' });
      }

      // 4. Update the DB ONLY IF email succeeds!
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await pool.query(
        'UPDATE user_registration SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );

      return res.status(200).json({ message: 'A new temporary password has been sent to your email address!' });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
};

export const superAdminLogin = async (req, res) => {
  const rawIdentifier = req.body.identifier || req.body.username || req.body.email || req.body.email_address || '';
  const identifier = rawIdentifier.trim().toLowerCase();
  const password = req.body.password;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Check environment superadmin credentials
    const envAdminId = (process.env.SUPER_ADMIN_ID || 'superadmin@gmail.com').trim().toLowerCase();
    const envAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'superadmin';

    if (identifier === envAdminId && password === envAdminPass) {
      const token = jwt.sign(
        { id: envAdminId, role: 'superadmin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        message: 'Super Admin Login successful',
        accessToken: token,
        user: { role: 'superadmin', email: envAdminId }
      });
    }

    // 2. Ensure bm_admins table exists and check database
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_admins (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'superadmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [admins] = await pool.query('SELECT * FROM bm_admins WHERE LOWER(email) = ?', [identifier]);

    if (admins.length > 0) {
      const admin = admins[0];
      const isValid = await bcrypt.compare(password, admin.password_hash);

      if (isValid) {
        const token = jwt.sign(
          { id: admin.email, role: admin.role || 'superadmin' },
          process.env.JWT_ACCESS_SECRET,
          { expiresIn: '12h' }
        );

        return res.status(200).json({
          message: 'Super Admin Login successful',
          accessToken: token,
          user: { role: admin.role || 'superadmin', email: admin.email }
        });
      }
    }

    return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
  } catch (error) {
    console.error('Super Admin Login Error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
};
