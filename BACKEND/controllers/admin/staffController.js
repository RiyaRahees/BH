import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getEmailTransporter, sendStaffRegisteredWelcomeEmail } from '../../utils/emailService.js';

// Helper to format names in Title Case (e.g. "azeem khan" -> "Azeem Khan")
export const formatNameToTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper to format staff object with parsed permissions
const formatStaffRecord = (staff) => {
  let permissions = [];
  if (staff.permissions) {
    try {
      permissions = typeof staff.permissions === 'string' ? JSON.parse(staff.permissions) : staff.permissions;
    } catch {
      permissions = staff.permissions.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  // Fallback defaults if no explicit permissions array set
  if (!permissions || permissions.length === 0) {
    const roleUpper = (staff.role || '').toUpperCase();
    if (roleUpper.includes('FINANCE')) {
      permissions = ['packages', 'payments'];
    } else if (roleUpper.includes('FRANCHISE')) {
      permissions = ['franchise', 'franchise-requests', 'head-franchise'];
    } else if (roleUpper.includes('FULL') || roleUpper.includes('SUPER') || roleUpper.includes('ALL')) {
      permissions = ['users', 'marriage-requests', 'reports', 'contacts', 'packages', 'payments', 'franchise', 'franchise-requests', 'head-franchise', 'castes', 'settings'];
    } else {
      permissions = ['users', 'marriage-requests', 'reports', 'contacts'];
    }
  }

  return {
    ...staff,
    name: formatNameToTitleCase(staff.name),
    permissions: Array.isArray(permissions) ? permissions : []
  };
};

// Login Staff
export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if staff exists with this email
    const [staffRows] = await pool.execute('SELECT * FROM bm_staff_data WHERE email = ?', [email]);
    
    if (staffRows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }
    
    const staff = staffRows[0];
    
    // Verify password using bcrypt
    const validPassword = await bcrypt.compare(password, staff.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }
    
    if (staff.account_status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive or suspended' });
    }

    const formattedStaff = formatStaffRecord(staff);

    const token = jwt.sign(
      { id: staff.staff_id, role: 'staff', permissions: formattedStaff.permissions },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '12h' }
    );
    
    res.status(200).json({ message: 'Login successful', staff: formattedStaff, accessToken: token });
  } catch (error) {
    console.error('Error logging in staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Forgot Password for Staff
export const forgotPasswordStaff = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // 1. Find staff by email
    const [staffRows] = await pool.execute(
      'SELECT * FROM bm_staff_data WHERE email = ?',
      [email]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ error: 'Staff account not found with this email.' });
    }

    const staff = staffRows[0];

    // 2. Generate a clean random password
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let pass = '';
      for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pass;
    };
    
    const newPassword = generateRandomPassword();

    // 3. Check SMTP config and send email FIRST
    const transporter = getEmailTransporter();
    if (!transporter) {
      return res.status(500).json({ error: 'Email service is not configured on the server.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
    const loginUrl = `${frontendUrl}/admin/login`;

    const mailOptions = {
      from: `"Bharat Marriage Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Staff Password Reset - Bharat Marriage',
      text: `Dear ${staff.name},\n\nWe received a request to reset your staff portal password for Bharat Marriage.\n\nYour new temporary password is: ${newPassword}\nStaff Login URL: ${loginUrl}\n\nPlease log in using this password at: ${loginUrl}\n\nBest regards,\nBharat Marriage Admin Team`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #780C28; margin-top: 0;">Staff Password Reset</h2>
          <p>Dear <strong>${staff.name}</strong>,</p>
          <p>We received a request to reset your staff portal password for Bharat Marriage.</p>
          <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 8px; padding: 15px; margin: 18px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Staff ID:</strong> ${staff.staff_id}</p>
            <p style="margin: 0 0 8px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #780C28;">${newPassword}</span></p>
            <p style="margin: 0;"><strong>Staff Login URL:</strong> <a href="${loginUrl}" style="color: #780C28; font-weight: bold; text-decoration: underline;">${loginUrl}</a></p>
          </div>
          <p style="margin: 20px 0;"><a href="${loginUrl}" style="display: inline-block; background-color: #780C28; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In to Staff Portal</a></p>
          <p>Best regards,<br><strong>Bharat Marriage Admin Team</strong></p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);

      // 4. Update the DB ONLY IF email succeeds!
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await pool.execute(
        'UPDATE bm_staff_data SET password = ? WHERE id = ?',
        [hashedPassword, staff.id]
      );

      res.status(200).json({ message: 'A new password has been sent to your email.' });
    } catch (emailError) {
      console.error('Failed to send staff reset password email:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send password reset email. Please contact support.' 
      });
    }

  } catch (error) {
    console.error('Error resetting staff password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new staff
export const createStaff = async (req, res) => {
  try {
    const { name, role, franchise, email, phone_number, account_status, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Staff name is required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Staff name must be at least 2 characters.' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ error: 'Role is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Phone Number validation (Strict 10-digit number)
    const cleanPhone = phone_number ? String(phone_number).replace(/\D/g, '') : '';
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
    }
    if (!/^[6-9]/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Phone number must start with 6, 7, 8, or 9.' });
    }

    const [existingStaff] = await pool.execute('SELECT id FROM bm_staff_data WHERE email = ?', [email.trim()]);
    if (existingStaff.length > 0) {
      return res.status(409).json({ error: 'A staff member with this email already exists.' });
    }

    // Generate staff_id
    let staff_id = 'STF0001';
    const [latestStaff] = await pool.execute('SELECT staff_id FROM bm_staff_data ORDER BY id DESC LIMIT 1');
    
    if (latestStaff.length > 0) {
      const lastId = latestStaff[0].staff_id; // e.g., "STF0001"
      const numPart = parseInt(lastId.replace('STF', ''), 10);
      const nextNum = numPart + 1;
      staff_id = `STF${String(nextNum).padStart(4, '0')}`;
    }

    const formattedName = formatNameToTitleCase(name);

    // Generate password: name without spaces + last 4 digits of staff_id
    const sanitizedName = formattedName.replace(/\s+/g, '');
    const plainPassword = `${sanitizedName}${staff_id.slice(-4)}`;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const permJson = Array.isArray(permissions) ? JSON.stringify(permissions) : (permissions || null);

    const query = `
      INSERT INTO bm_staff_data 
      (staff_id, name, role, permissions, franchise, email, phone_number, account_status, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      staff_id, 
      formattedName, 
      role, 
      permJson,
      franchise || null, 
      email || null, 
      phone_number || null, 
      account_status || 'active',
      hashedPassword
    ]);

    // Send Email with generated password & staff login url
    if (email) {
      (async () => {
        try {
          await sendStaffRegisteredWelcomeEmail({
            name: formattedName,
            email,
            staff_id,
            role,
            plainPassword
          });
        } catch (emailError) {
          console.error('Failed to send staff welcome email:', emailError);
        }
      })();
    }

    res.status(201).json({ message: 'Staff created successfully', staff_id });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all staff
export const getAllStaff = async (req, res) => {
  try {
    const [staffs] = await pool.execute('SELECT * FROM bm_staff_data ORDER BY id DESC');
    const formatted = staffs.map(formatStaffRecord);
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single staff by ID
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const [staff] = await pool.execute('SELECT * FROM bm_staff_data WHERE staff_id = ?', [id]);
    
    if (staff.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.status(200).json(formatStaffRecord(staff[0]));
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a staff
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, franchise, email, phone_number, account_status, permissions } = req.body;

    if (name !== undefined && (!name || name.trim().length < 2)) {
      return res.status(400).json({ error: 'Staff name must be at least 2 characters.' });
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
    }

    let cleanPhone;
    if (phone_number !== undefined) {
      cleanPhone = String(phone_number).replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
      }
      if (!/^[6-9]/.test(cleanPhone)) {
        return res.status(400).json({ error: 'Phone number must start with 6, 7, 8, or 9.' });
      }
    }

    const [existingStaff] = await pool.execute('SELECT * FROM bm_staff_data WHERE staff_id = ?', [id]);
    if (existingStaff.length > 0) {
      const permJson = Array.isArray(permissions) ? JSON.stringify(permissions) : (permissions !== undefined ? permissions : existingStaff[0].permissions);
      const formattedName = name ? formatNameToTitleCase(name) : existingStaff[0].name;

      const query = `
        UPDATE bm_staff_data 
        SET name = ?, role = ?, permissions = ?, franchise = ?, email = ?, phone_number = ?, account_status = ? 
        WHERE staff_id = ?
      `;

      await pool.execute(query, [
        formattedName,
        role || existingStaff[0].role,
        permJson,
        franchise !== undefined ? franchise : existingStaff[0].franchise,
        email !== undefined ? email.trim() : existingStaff[0].email,
        cleanPhone !== undefined ? cleanPhone : existingStaff[0].phone_number,
        account_status || existingStaff[0].account_status,
        id
      ]);

      return res.status(200).json({ message: 'Staff updated successfully' });
    }

    res.status(404).json({ error: 'Staff not found' });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a staff
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM bm_staff_data WHERE staff_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
