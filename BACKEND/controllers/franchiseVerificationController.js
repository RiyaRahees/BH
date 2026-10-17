import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/franchise_docs folder exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'franchise_docs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Franchise KYC Documents
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeField = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `franchise-${safeField}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF documents are allowed.'), false);
  }
};

export const uploadFranchiseDocs = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per document
  }
}).any();

/**
 * Public: Validate secure verification token
 */
export const validateVerificationToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, request_id, name, phone, email, district, pincode, location, status,
              verification_token, token_expires_at, token_used, created_at
       FROM bm_franchise_partnership_requests
       WHERE verification_token = ?
       LIMIT 1`,
      [token.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Invalid verification link. Please verify your link or contact support.'
      });
    }

    const request = rows[0];

    if (request.status === 'APPROVED') {
      return res.status(400).json({
        error: 'This franchise application has already been verified and approved.'
      });
    }

    if (request.status === 'REJECTED') {
      return res.status(400).json({
        error: 'This franchise partnership request has been closed/rejected.'
      });
    }

    if (request.token_used) {
      return res.status(400).json({
        error: 'This verification link has already been submitted. Your application is currently under review by our operations team.'
      });
    }

    if (request.token_expires_at && new Date(request.token_expires_at) < new Date()) {
      return res.status(410).json({
        error: 'This verification link has expired. Please contact support or request a new verification link.'
      });
    }

    res.status(200).json({
      valid: true,
      request: {
        requestId: request.request_id,
        name: request.name,
        phone: request.phone,
        email: request.email,
        district: request.district,
        pincode: request.pincode,
        location: request.location,
        submittedAt: request.created_at
      }
    });
  } catch (error) {
    console.error('Error validating verification token:', error);
    res.status(500).json({ error: 'Server error while validating verification token.' });
  }
};

/**
 * Public: Submit Franchise Verification Form (with documents)
 */
export const submitVerificationForm = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    // 1. Verify token
    const [rows] = await pool.execute(
      `SELECT * FROM bm_franchise_partnership_requests WHERE verification_token = ? LIMIT 1`,
      [token.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid verification token.' });
    }

    const request = rows[0];

    if (request.token_used) {
      return res.status(400).json({
        error: 'This verification form has already been submitted.'
      });
    }

    if (request.token_expires_at && new Date(request.token_expires_at) < new Date()) {
      return res.status(410).json({
        error: 'This verification link has expired.'
      });
    }

    const { applicantType, formData: rawFormData } = req.body;

    let parsedFormData = {};
    if (typeof rawFormData === 'string') {
      try {
        parsedFormData = JSON.parse(rawFormData);
      } catch (e) {
        parsedFormData = req.body;
      }
    } else if (typeof rawFormData === 'object' && rawFormData !== null) {
      parsedFormData = rawFormData;
    } else {
      parsedFormData = req.body;
    }

    const activeType = applicantType || parsedFormData.applicantType || 'organization';

    // Parse uploaded files into document metadata
    const documents = {};
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        documents[file.fieldname] = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/franchise_docs/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
      }
    } else if (req.files && typeof req.files === 'object') {
      for (const [key, fileArray] of Object.entries(req.files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          documents[key] = {
            filename: file.filename,
            originalName: file.originalname,
            path: `uploads/franchise_docs/${file.filename}`,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };
        }
      }
    }

    // Extract preferred pincodes
    let preferredPincodes = [];
    if (Array.isArray(parsedFormData.preferredPincodes)) {
      preferredPincodes = parsedFormData.preferredPincodes.map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof parsedFormData.preferredPincodes === 'string') {
      try {
        const parsed = JSON.parse(parsedFormData.preferredPincodes);
        if (Array.isArray(parsed)) preferredPincodes = parsed.map(String).map(s => s.trim()).filter(Boolean);
      } catch {
        preferredPincodes = parsedFormData.preferredPincodes.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // If no preferred pincodes selected in the multi-select, fallback to single pincode if available
    if (preferredPincodes.length === 0 && parsedFormData.pincode) {
      preferredPincodes = [String(parsedFormData.pincode).trim()];
    }

    // 2. Insert or update bm_franchise_verifications record
    const [existingVer] = await pool.execute(
      `SELECT id FROM bm_franchise_verifications WHERE request_id = ? LIMIT 1`,
      [request.request_id]
    );

    if (existingVer.length > 0) {
      await pool.execute(
        `UPDATE bm_franchise_verifications 
         SET applicant_type = ?, form_data = ?, documents = ?, preferred_pincodes = ?, status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [
          activeType,
          JSON.stringify(parsedFormData),
          JSON.stringify(documents),
          JSON.stringify(preferredPincodes),
          request.request_id
        ]
      );
    } else {
      await pool.execute(
        `INSERT INTO bm_franchise_verifications 
         (request_id, applicant_type, form_data, documents, preferred_pincodes, status)
         VALUES (?, ?, ?, ?, ?, 'SUBMITTED')`,
        [
          request.request_id,
          activeType,
          JSON.stringify(parsedFormData),
          JSON.stringify(documents),
          JSON.stringify(preferredPincodes)
        ]
      );
    }

    // 3. Update original request status & mark token used
    await pool.execute(
      `UPDATE bm_franchise_partnership_requests
       SET status = 'VERIFICATION_SUBMITTED', token_used = 1
       WHERE request_id = ?`,
      [request.request_id]
    );

    // 4. Record audit log
    try {
      const clientIp = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || null;
      await pool.execute(
        `INSERT INTO bm_franchise_audit_logs (request_id, action, performed_by, details, ip_address)
         VALUES (?, 'VERIFICATION_SUBMITTED', 'APPLICANT', ?, ?)`,
        [
          request.request_id,
          `Applicant submitted verification form (${activeType}) with ${Object.keys(documents).length} uploaded documents and ${preferredPincodes.length} preferred pincodes.`,
          clientIp
        ]
      );
    } catch (auditErr) {
      console.warn('Audit log error on verification submit:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Franchise verification form submitted successfully. Our team will review your documents.',
      requestId: request.request_id
    });
  } catch (error) {
    console.error('Error submitting franchise verification:', error);
    res.status(500).json({ error: 'Failed to submit verification form. Please try again.' });
  }
};
