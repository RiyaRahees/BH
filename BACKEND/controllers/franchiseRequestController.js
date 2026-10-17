import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { 
  getEmailTransporter as getTransporter, 
  sendFranchiseApprovalEmail,
  sendFranchiseVerificationLinkEmail,
  sendFranchiseRejectionEmail
} from '../utils/emailService.js';
import { generateDistrictFranchiseCode } from '../utils/franchiseCodeUtils.js';

// Public: Submit Franchise Partnership / Registration Form
export const submitFranchiseRequest = async (req, res) => {
  try {
    let rawFormData = req.body.formData;
    let parsedFormData = {};
    if (typeof rawFormData === 'string') {
      try {
        parsedFormData = JSON.parse(rawFormData);
      } catch (e) {
        parsedFormData = {};
      }
    } else if (typeof rawFormData === 'object' && rawFormData !== null) {
      parsedFormData = rawFormData;
    }

    const applicantType = req.body.applicantType || req.body.applicant_type || parsedFormData.applicantType || 'organization';
    const isOrg = applicantType.toLowerCase() === 'organization';

    const name = (req.body.name || (isOrg ? parsedFormData.orgName : parsedFormData.fullName) || '').trim();
    const phone = (req.body.phone || (isOrg ? (parsedFormData.contactPhone || parsedFormData.officeNumber) : parsedFormData.mobileNumber) || '').trim();
    const email = (req.body.email || (isOrg ? (parsedFormData.officialEmail || parsedFormData.contactEmail) : parsedFormData.email) || '').trim().toLowerCase();
    const district = (req.body.district || (isOrg ? (parsedFormData.preferredDistrict || parsedFormData.district) : (parsedFormData.preferredDistrict || parsedFormData.district)) || '').trim();

    // Extract preferred pincodes
    const preferredPincodesRaw = parsedFormData.preferredPincodes || req.body.preferredPincodes;
    let preferredPincodes = [];
    if (Array.isArray(preferredPincodesRaw)) {
      preferredPincodes = preferredPincodesRaw.map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof preferredPincodesRaw === 'string') {
      try {
        const parsed = JSON.parse(preferredPincodesRaw);
        if (Array.isArray(parsed)) preferredPincodes = parsed.map(String).map(s => s.trim()).filter(Boolean);
      } catch {
        preferredPincodes = preferredPincodesRaw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const pincode = (req.body.pincode || (preferredPincodes.length > 0 ? preferredPincodes[0] : (parsedFormData.pincode === 'Other' ? parsedFormData.customPincode : parsedFormData.pincode)) || '').trim();
    const location = (req.body.location || (isOrg ? (parsedFormData.proposedLocation || parsedFormData.address) : (parsedFormData.proposedLocation || parsedFormData.address)) || district).trim();
    const message = req.body.message ? req.body.message.trim() : (Object.keys(parsedFormData).length > 0 ? `${isOrg ? 'Organization' : 'Individual'} Registration Form Submission` : '');

    if (!name || !phone || !email || (!district && !location)) {
      return res.status(400).json({ error: 'Name, phone, email, and district are required.' });
    }

    // Process uploaded document files if any
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

    const fullLocation = pincode ? `${district} - ${pincode}` : district;
    const hasFullDetails = Object.keys(parsedFormData).length > 0 || Object.keys(documents).length > 0;

    // CHECK FOR EXISTING REQUEST (BY EMAIL OR PHONE)
    const [existing] = await pool.execute(
      'SELECT * FROM bm_franchise_partnership_requests WHERE (LOWER(email) = ? OR phone = ?) AND status != "REJECTED" ORDER BY id DESC LIMIT 1',
      [email, phone]
    );

    if (existing.length > 0) {
      const existingReq = existing[0];
      const existingStatus = (existingReq.status || '').toUpperCase();

      if (existingStatus === 'APPROVED') {
        return res.status(409).json({
          error: `A franchise partnership request (${existingReq.request_id}) for this email address or phone number has already been approved.`
        });
      }

      // LINK TO THE SAME FRANCHISE REQUEST / APPLICATION
      const newStatus = (existingStatus === 'VERIFICATION_PENDING' || hasFullDetails)
        ? 'VERIFICATION_SUBMITTED'
        : existingStatus;

      await pool.execute(
        `UPDATE bm_franchise_partnership_requests 
         SET name = ?, phone = ?, email = ?, district = ?, pincode = ?, location = ?, status = ?, token_used = 1
         WHERE id = ?`,
        [
          name || existingReq.name,
          phone || existingReq.phone,
          email || existingReq.email,
          district || existingReq.district,
          pincode || existingReq.pincode,
          fullLocation || existingReq.location,
          newStatus,
          existingReq.id
        ]
      );

      // Check existing verification record
      const [existingVer] = await pool.execute(
        'SELECT id, documents FROM bm_franchise_verifications WHERE request_id = ? LIMIT 1',
        [existingReq.request_id]
      );

      let mergedDocs = { ...documents };
      if (existingVer.length > 0 && existingVer[0].documents) {
        try {
          const prevDocs = typeof existingVer[0].documents === 'string'
            ? JSON.parse(existingVer[0].documents)
            : existingVer[0].documents;
          mergedDocs = { ...prevDocs, ...documents };
        } catch (e) {
          // keep mergedDocs
        }
      }

      if (existingVer.length > 0) {
        await pool.execute(
          `UPDATE bm_franchise_verifications 
           SET applicant_type = ?, form_data = ?, documents = ?, preferred_pincodes = ?, status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
           WHERE request_id = ?`,
          [
            applicantType,
            JSON.stringify(parsedFormData),
            JSON.stringify(mergedDocs),
            JSON.stringify(preferredPincodes),
            existingReq.request_id
          ]
        );
      } else if (hasFullDetails) {
        await pool.execute(
          `INSERT INTO bm_franchise_verifications 
           (request_id, applicant_type, form_data, documents, preferred_pincodes, status)
           VALUES (?, ?, ?, ?, ?, 'SUBMITTED')`,
          [
            existingReq.request_id,
            applicantType,
            JSON.stringify(parsedFormData),
            JSON.stringify(mergedDocs),
            JSON.stringify(preferredPincodes)
          ]
        );
      }

      // Record audit log
      try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        await pool.execute(
          `INSERT INTO bm_franchise_audit_logs (request_id, action, performed_by, details, ip_address)
           VALUES (?, 'VERIFICATION_SUBMITTED', 'APPLICANT', ?, ?)`,
          [
            existingReq.request_id,
            `Applicant completed registration form on /franchise/register. Updated existing application (${existingReq.request_id}) to ${newStatus}.`,
            clientIp
          ]
        );
      } catch (auditErr) {
        console.warn('Audit log error on franchise form submit:', auditErr.message);
      }

      return res.status(200).json({
        success: true,
        message: newStatus === 'VERIFICATION_SUBMITTED'
          ? 'Franchise registration form submitted successfully. Your application is now ready for admin review.'
          : 'Franchise partnership details updated successfully.',
        requestId: existingReq.request_id,
        status: newStatus
      });
    }

    // Generate NEW REQ ID (e.g. FPR0001) for first-time applicant
    const [latestReq] = await pool.query("SELECT request_id FROM bm_franchise_partnership_requests WHERE request_id LIKE 'FPR%' ORDER BY id DESC LIMIT 1");
    let nextReqId = 'FPR0001';
    if (latestReq.length > 0 && latestReq[0].request_id) {
      const match = latestReq[0].request_id.match(/FPR(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        nextReqId = `FPR${String(num + 1).padStart(4, '0')}`;
      }
    }
    const [idCheck] = await pool.query('SELECT id FROM bm_franchise_partnership_requests WHERE request_id = ? LIMIT 1', [nextReqId]);
    if (idCheck.length > 0) {
      nextReqId = `FPR${Date.now().toString().slice(-6)}`;
    }

    const query = `
      INSERT INTO bm_franchise_partnership_requests 
      (request_id, name, phone, email, district, pincode, location, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `;

    await pool.execute(query, [
      nextReqId,
      name,
      phone,
      email,
      district,
      pincode,
      fullLocation,
      message
    ]);

    // Store full form data & documents in bm_franchise_verifications if provided
    if (hasFullDetails) {
      await pool.execute(
        `INSERT INTO bm_franchise_verifications 
         (request_id, applicant_type, form_data, documents, preferred_pincodes, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [
          nextReqId,
          applicantType,
          JSON.stringify(parsedFormData),
          JSON.stringify(documents),
          JSON.stringify(preferredPincodes)
        ]
      );
    }

    // Record audit log
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      await pool.execute(
        `INSERT INTO bm_franchise_audit_logs (request_id, action, performed_by, details, ip_address)
         VALUES (?, 'INITIAL_SUBMISSION', 'APPLICANT', ?, ?)`,
        [
          nextReqId,
          `Initial franchise partnership request submitted. Reference ID: ${nextReqId}`,
          clientIp
        ]
      );
    } catch (auditErr) {
      console.warn('Audit log error on initial submit:', auditErr.message);
    }

    // Send confirmation email asynchronously
    try {
      const transporter = getTransporter();
      if (transporter) {
        let supportEmail = 'support@bharathmarriage.com';
        let contactPhone = '+91 98450 12345';
        let siteName = 'Bharat Marriage';

        try {
          const [settingsRows] = await pool.query('SELECT site_name, support_email, contact_phone FROM bm_system_settings WHERE id = 1 LIMIT 1');
          if (settingsRows && settingsRows.length > 0) {
            supportEmail = settingsRows[0].support_email || supportEmail;
            contactPhone = settingsRows[0].contact_phone || contactPhone;
            siteName = settingsRows[0].site_name || siteName;
          }
        } catch (e) {
          // Ignore settings error
        }

        const submissionDate = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        const plainText = `Dear ${name},\n\n` +
          `Thank you for your interest in partnering with ${siteName}.\n\n` +
          `Your Franchise Partnership Request (Ref: ${nextReqId}) has been received successfully.\n\n` +
          `Application Summary:\n` +
          `- Reference ID: ${nextReqId}\n` +
          `- Applicant Name: ${name}\n` +
          `- Target Territory: ${district}${pincode ? ` (Pin: ${pincode})` : ''}\n` +
          `- Contact Number: ${phone}\n` +
          `- Date: ${submissionDate}\n\n` +
          `Our team is reviewing territory availability. Once initially approved, you will receive an email to complete your Franchise Registration Form.\n\n` +
          `Warm Regards,\n` +
          `Franchise Operations Team\n` +
          `${siteName}`;

        const mailOptions = {
          from: `"Bharat Marriage Partner Desk" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Franchise Partnership Request Received - ${nextReqId} | ${siteName}`,
          text: plainText
        };

        transporter.sendMail(mailOptions).catch(err => {
          console.error('Error sending franchise confirmation email:', err);
        });
      }
    } catch (emailErr) {
      console.error('Failed to trigger confirmation email for franchise request:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Franchise partnership request submitted successfully.',
      requestId: nextReqId,
      status: 'PENDING'
    });
  } catch (error) {
    console.error('Error submitting franchise request:', error);
    res.status(500).json({ error: 'Failed to submit request. Please try again later.' });
  }
};

export const getFranchiseRequests = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.request_id,
        r.name,
        r.phone,
        r.email,
        r.district,
        r.pincode,
        r.location,
        r.message,
        IF(r.status = 'APPROVED', 'APPROVED', IF(r.status = 'REJECTED', 'REJECTED', IF(v.status = 'SUBMITTED' OR v.id IS NOT NULL, 'VERIFICATION_SUBMITTED', r.status))) AS status,
        r.verification_token,
        r.token_expires_at,
        r.token_used,
        r.admin_remarks,
        r.reviewed_by,
        r.reviewed_at,
        r.created_at,
        v.id AS verification_id,
        v.applicant_type,
        v.status AS verification_status,
        v.created_at AS verification_submitted_at,
        v.preferred_pincodes,
        v.documents
      FROM bm_franchise_partnership_requests r
      LEFT JOIN bm_franchise_verifications v ON r.request_id = v.request_id
      ORDER BY r.created_at DESC
    `;

    const [rows] = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching franchise requests:', error);
    res.status(500).json({ error: 'Failed to fetch franchise requests.' });
  }
};

// Safe helper to query by id or request_id without MySQL numeric conversion errors
const findFranchiseRequestByIdOrRequestId = async (idOrReqId) => {
  if (!idOrReqId) return [];
  const clean = String(idOrReqId).trim();
  const isNumeric = /^\d+$/.test(clean);
  if (isNumeric) {
    const [rows] = await pool.execute(
      'SELECT * FROM bm_franchise_partnership_requests WHERE id = ? OR request_id = ? LIMIT 1',
      [parseInt(clean, 10), clean]
    );
    return rows;
  }
  const [rows] = await pool.execute(
    'SELECT * FROM bm_franchise_partnership_requests WHERE request_id = ? LIMIT 1',
    [clean]
  );
  return rows;
};

// Safe helper to update by id or request_id
const updateFranchiseRequestByIdOrRequestId = async (sqlSetClause, values, idOrReqId) => {
  const clean = String(idOrReqId).trim();
  const isNumeric = /^\d+$/.test(clean);
  if (isNumeric) {
    return pool.execute(
      `UPDATE bm_franchise_partnership_requests SET ${sqlSetClause} WHERE id = ? OR request_id = ?`,
      [...values, parseInt(clean, 10), clean]
    );
  }
  return pool.execute(
    `UPDATE bm_franchise_partnership_requests SET ${sqlSetClause} WHERE request_id = ?`,
    [...values, clean]
  );
};

// Admin: Get Single Request with full verification details & documents
export const getFranchiseVerificationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const requests = await findFranchiseRequestByIdOrRequestId(id);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Franchise request not found.' });
    }

    const request = requests[0];

    const [verifications] = await pool.execute(
      `SELECT * FROM bm_franchise_verifications WHERE request_id = ? LIMIT 1`,
      [request.request_id]
    );

    // If verification exists and request status is not final, ensure status reflects VERIFICATION_SUBMITTED
    if (verifications.length > 0 && request.status !== 'APPROVED' && request.status !== 'REJECTED') {
      request.status = 'VERIFICATION_SUBMITTED';
    }

    const [auditLogs] = await pool.execute(
      `SELECT * FROM bm_franchise_audit_logs WHERE request_id = ? ORDER BY created_at DESC`,
      [request.request_id]
    );

    res.status(200).json({
      success: true,
      request,
      verification: verifications.length > 0 ? verifications[0] : null,
      auditLogs
    });
  } catch (error) {
    console.error('Error fetching franchise verification details:', error);
    res.status(500).json({ error: 'Failed to fetch verification details.' });
  }
};

// Admin: STAGE 1 — INITIAL APPROVAL (Generates secure token & emails verification link)
export const initialApproveFranchiseRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const requests = await findFranchiseRequestByIdOrRequestId(id);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Franchise request not found.' });
    }

    const request = requests[0];

    if (request.status === 'APPROVED') {
      return res.status(400).json({ error: 'This franchise request is already approved.' });
    }

    // Generate cryptographically secure random verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresInDays = 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await updateFranchiseRequestByIdOrRequestId(
      `status = 'VERIFICATION_PENDING',
       verification_token = ?,
       token_expires_at = ?,
       token_used = 0,
       reviewed_by = ?,
       reviewed_at = CURRENT_TIMESTAMP`,
      [verificationToken, expiresAt, req.admin?.username || 'SUPER_ADMIN'],
      id
    );

    // Record audit log
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      await pool.execute(
        `INSERT INTO bm_franchise_audit_logs (request_id, action, performed_by, details, ip_address)
         VALUES (?, 'INITIAL_APPROVAL', ?, ?, ?)`,
        [
          request.request_id,
          req.admin?.username || 'SUPER_ADMIN',
          `Initial request approved. Generated 7-day verification token. Verification email dispatched to ${request.email}.`,
          clientIp
        ]
      );
    } catch (auditErr) {
      console.warn('Audit log error on initial approval:', auditErr.message);
    }

    // Send EMAIL #1: Verification Form Link (Strictly NO credentials sent)
    if (request.email) {
      sendFranchiseVerificationLinkEmail({
        name: request.name,
        email: request.email,
        requestId: request.request_id,
        district: request.district,
        pincode: request.pincode,
        verificationToken,
        expiresInDays
      }).catch(err => {
        console.error('Failed to send verification link email:', err);
      });
    }

    res.status(200).json({
      success: true,
      message: `Initial approval successful. Verification form link has been sent to ${request.email}.`,
      status: 'VERIFICATION_PENDING',
      verificationToken
    });
  } catch (error) {
    console.error('Error during initial franchise approval:', error);
    res.status(500).json({ error: 'Failed to process initial approval.' });
  }
};

// Admin: STAGE 2 — FINAL APPROVAL (Creates bm_franchise account & emails credentials)
export const finalApproveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedPinCodes } = req.body;

    const requests = await findFranchiseRequestByIdOrRequestId(id);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Franchise request not found.' });
    }

    const request = requests[0];
    const requestId = request.request_id;

    // Fetch submitted verification data if present
    const [verifications] = await pool.execute(
      'SELECT * FROM bm_franchise_verifications WHERE request_id = ? LIMIT 1',
      [requestId]
    );

    const reqStatus = (request.status || '').toUpperCase();
    if (reqStatus === 'APPROVED') {
      return res.status(400).json({ error: 'This franchise application is already approved.' });
    }

    if (verifications.length === 0 && reqStatus !== 'VERIFICATION_SUBMITTED' && reqStatus !== 'UNDER_REVIEW') {
      return res.status(400).json({
        error: `Cannot perform final approval. The applicant has not submitted the Stage 2 verification form yet.`
      });
    }

    let formData = {};
    let submittedPincodes = [];

    if (verifications.length > 0) {
      const ver = verifications[0];
      try {
        formData = typeof ver.form_data === 'string' ? JSON.parse(ver.form_data) : (ver.form_data || {});
      } catch (e) {
        formData = {};
      }
      try {
        submittedPincodes = typeof ver.preferred_pincodes === 'string' 
          ? JSON.parse(ver.preferred_pincodes) 
          : (ver.preferred_pincodes || []);
      } catch (e) {
        submittedPincodes = [];
      }
    }

    // Determine PIN codes to assign
    let finalPinCodes = [];
    if (Array.isArray(assignedPinCodes) && assignedPinCodes.length > 0) {
      finalPinCodes = assignedPinCodes.map(String).map(s => s.trim()).filter(Boolean);
    } else if (submittedPincodes && submittedPincodes.length > 0) {
      finalPinCodes = submittedPincodes.map(String).map(s => s.trim()).filter(Boolean);
    } else if (request.pincode) {
      finalPinCodes = [request.pincode.trim()];
    }

    // Determine account contact info (prioritize verification form)
    const activeEmail = (formData.officialEmail || formData.email || request.email).trim().toLowerCase();
    const activeMobile = (formData.contactPhone || formData.mobileNumber || formData.officeNumber || request.phone).trim();
    const activeName = (formData.orgName || formData.fullName || request.name).trim();
    const activeOwner = (formData.contactName || formData.fullName || request.name).trim();
    const activeDistrict = (formData.preferredDistrict || formData.district || request.district || 'Kerala').trim();
    const activeLocation = (formData.proposedLocation || formData.address || request.location || activeDistrict).trim();

    let generatedFranchiseId = null;

    // Generate random secure temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let plainPassword = '';
    for (let i = 0; i < 8; i++) {
      plainPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Check if franchise already exists in bm_franchise
    const [existingFranchise] = await pool.execute(
      'SELECT * FROM bm_franchise WHERE LOWER(email) = ? OR mobile_number = ? LIMIT 1',
      [activeEmail, activeMobile]
    );

    if (existingFranchise.length > 0) {
      generatedFranchiseId = existingFranchise[0].franchise_id;
      await pool.execute(
        `UPDATE bm_franchise 
         SET status = 'active', password = ?, pin_codes = ?, location = ?, name = ?, owner = ?
         WHERE id = ?`,
        [
          hashedPassword,
          JSON.stringify(finalPinCodes),
          activeLocation,
          activeName,
          activeOwner,
          existingFranchise[0].id
        ]
      );
    } else {
      // Generate district-based franchise code (e.g. BM-KKD-001)
      const firstPin = finalPinCodes.length > 0 ? finalPinCodes[0] : '';
      generatedFranchiseId = await generateDistrictFranchiseCode(activeDistrict, activeLocation, firstPin);

      const franchiseName = `BharatMarriage-${activeDistrict}`;

      await pool.execute(
        `INSERT INTO bm_franchise 
         (franchise_id, name, owner, location, mobile_number, email, pin_codes, status, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          generatedFranchiseId,
          franchiseName,
          activeOwner,
          activeLocation,
          activeMobile,
          activeEmail,
          JSON.stringify(finalPinCodes),
          hashedPassword
        ]
      );
    }

    // Update request and verification status
    await updateFranchiseRequestByIdOrRequestId(
      `status = 'APPROVED',
       reviewed_by = ?,
       reviewed_at = CURRENT_TIMESTAMP`,
      [req.admin?.username || 'SUPER_ADMIN'],
      id
    );

    if (verifications.length > 0) {
      await pool.execute(
        `UPDATE bm_franchise_verifications
         SET status = 'APPROVED',
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [req.admin?.username || 'SUPER_ADMIN', requestId]
      );
    }

    // Record audit log
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      await pool.execute(
        `INSERT INTO bm_franchise_audit_logs (request_id, franchise_id, action, performed_by, details, ip_address)
         VALUES (?, ?, 'FINAL_APPROVAL', ?, ?, ?)`,
        [
          requestId,
          generatedFranchiseId,
          req.admin?.username || 'SUPER_ADMIN',
          `Final verification approved. Created/activated franchise account ${generatedFranchiseId} with ${finalPinCodes.length} assigned PIN code(s): [${finalPinCodes.join(', ')}].`,
          clientIp
        ]
      );
    } catch (auditErr) {
      console.warn('Audit log error on final approval:', auditErr.message);
    }

    // Send EMAIL #2: Franchise Account Credentials Email
    if (activeEmail) {
      sendFranchiseApprovalEmail({
        name: activeOwner || activeName,
        email: activeEmail,
        franchise_id: generatedFranchiseId,
        plainPassword
      }).catch(emailErr => {
        console.error('Failed to send franchise credentials email:', emailErr);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Franchise verification approved. Partner account created and credentials dispatched via email.',
      franchiseId: generatedFranchiseId,
      assignedPinCodes: finalPinCodes
    });
  } catch (error) {
    console.error('Error during final franchise approval:', error);
    res.status(500).json({ error: 'Failed to process final approval.' });
  }
};

// Admin: REJECT Franchise Request / Verification
export const rejectFranchiseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const requests = await findFranchiseRequestByIdOrRequestId(id);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Franchise request not found.' });
    }

    const request = requests[0];

    await updateFranchiseRequestByIdOrRequestId(
      `status = 'REJECTED',
       admin_remarks = ?,
       reviewed_by = ?,
       reviewed_at = CURRENT_TIMESTAMP`,
      [reason || 'Application rejected by administration.', req.admin?.username || 'SUPER_ADMIN'],
      id
    );

    // Also update verification status if present
    await pool.execute(
      `UPDATE bm_franchise_verifications
       SET status = 'REJECTED',
           admin_remarks = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE request_id = ?`,
      [reason || 'Application rejected by administration.', req.admin?.username || 'SUPER_ADMIN', request.request_id]
    );

    // Deactivate franchise if existing
    await pool.execute(
      'UPDATE bm_franchise SET status = "inactive" WHERE LOWER(email) = ? OR mobile_number = ?',
      [request.email.toLowerCase(), request.phone]
    );

    // Record audit log
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      await pool.execute(
        `INSERT INTO bm_franchise_audit_logs (request_id, action, performed_by, details, ip_address)
         VALUES (?, 'REJECTED', ?, ?, ?)`,
        [
          request.request_id,
          req.admin?.username || 'SUPER_ADMIN',
          `Application rejected. Reason: ${reason || 'Not specified'}`,
          clientIp
        ]
      );
    } catch (auditErr) {
      console.warn('Audit log error on rejection:', auditErr.message);
    }

    // Send Rejection Email
    if (request.email) {
      sendFranchiseRejectionEmail({
        name: request.name,
        email: request.email,
        requestId: request.request_id,
        reason: reason || ''
      }).catch(err => {
        console.error('Failed to send franchise rejection email:', err);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Franchise request has been rejected.',
      status: 'REJECTED'
    });
  } catch (error) {
    console.error('Error rejecting franchise request:', error);
    res.status(500).json({ error: 'Failed to reject franchise request.' });
  }
};

// Admin: Unified Status Handler (Kept for full backward compatibility)
export const updateFranchiseRequestStatus = async (req, res) => {
  try {
    const { status, reason, assignedPinCodes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const upperStatus = status.toUpperCase();

    if (upperStatus === 'INITIAL_APPROVED' || upperStatus === 'VERIFICATION_PENDING') {
      return initialApproveFranchiseRequest(req, res);
    } else if (upperStatus === 'APPROVED' || upperStatus === 'FINAL_APPROVED') {
      return finalApproveVerification(req, res);
    } else if (upperStatus === 'REJECTED') {
      return rejectFranchiseRequest(req, res);
    } else {
      const { id } = req.params;
      await updateFranchiseRequestByIdOrRequestId('status = ?', [status], id);
      return res.status(200).json({ message: 'Request status updated successfully.' });
    }
  } catch (error) {
    console.error('Error updating franchise request status:', error);
    res.status(500).json({ error: 'Failed to update request status.' });
  }
};

// Admin: Delete Request
export const deleteFranchiseRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const requests = await findFranchiseRequestByIdOrRequestId(id);

    if (requests.length > 0) {
      const reqId = requests[0].request_id;
      await pool.execute('DELETE FROM bm_franchise_verifications WHERE request_id = ?', [reqId]);
      await pool.execute('DELETE FROM bm_franchise_audit_logs WHERE request_id = ?', [reqId]);
      await pool.execute('DELETE FROM bm_franchise_partnership_requests WHERE request_id = ?', [reqId]);
    } else {
      const isNumeric = /^\d+$/.test(String(id).trim());
      if (isNumeric) {
        await pool.execute('DELETE FROM bm_franchise_partnership_requests WHERE id = ?', [parseInt(id, 10)]);
      }
    }

    res.status(200).json({ message: 'Request and associated records deleted successfully.' });
  } catch (error) {
    console.error('Error deleting franchise request:', error);
    res.status(500).json({ error: 'Failed to delete request.' });
  }
};
