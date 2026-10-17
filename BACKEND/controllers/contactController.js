import pool from '../config/db.js';
import { getEmailTransporter as getTransporter } from '../utils/emailService.js';

// Ensure columns exist helper
const ensureColumnsExist = async () => {
  try {
    const [replyCol] = await pool.query(`SHOW COLUMNS FROM bm_contact_messages LIKE 'admin_reply'`);
    if (replyCol.length === 0) {
      await pool.query(`
        ALTER TABLE bm_contact_messages 
        ADD COLUMN admin_reply TEXT DEFAULT NULL AFTER message,
        ADD COLUMN admin_responded_at TIMESTAMP NULL DEFAULT NULL AFTER admin_reply
      `);
    }
  } catch (e) {
    // Ignore migration check errors
  }
};

// Public: Submit contact form message
export const submitContactForm = async (req, res) => {
  try {
    await ensureColumnsExist();
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }

    const query = `
      INSERT INTO bm_contact_messages (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `;

    const [result] = await pool.execute(query, [
      name.trim(),
      email.trim(),
      phone ? phone.trim() : null,
      subject.trim(),
      message.trim()
    ]);

    res.status(201).json({
      message: 'Contact form submitted successfully.',
      contactId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};

// Admin: Fetch all contact form messages
export const getContactMessages = async (req, res) => {
  try {
    await ensureColumnsExist();
    const { franchise_id } = req.query;

    let baseSelect = `
      SELECT DISTINCT
        cm.id,
        cm.name,
        cm.email,
        cm.phone,
        cm.subject,
        cm.message,
        cm.admin_reply,
        cm.admin_responded_at,
        cm.status,
        cm.created_at
      FROM bm_contact_messages cm
      LEFT JOIN user_registration ur ON cm.email = ur.email_address OR cm.phone = ur.mobile_number
      LEFT JOIN hindus h ON ur.profile_id = h.profile_id
      LEFT JOIN christians c ON ur.profile_id = c.profile_id
      LEFT JOIN muslims m ON ur.profile_id = m.profile_id
      LEFT JOIN others o ON ur.profile_id = o.profile_id
      WHERE (cm.subject IS NULL OR (cm.subject NOT LIKE '%Franchise%' AND cm.subject != 'Franchise Request'))
    `;

    let filters = '';
    const queryParams = [];

    if (franchise_id && franchise_id !== 'HEAD_OFFICE' && franchise_id !== 'All') {
      const [franchiseRows] = await pool.execute('SELECT pin_codes FROM bm_franchise WHERE franchise_id = ?', [franchise_id]);
      if (franchiseRows.length > 0) {
        let pinCodes = franchiseRows[0].pin_codes;
        if (typeof pinCodes === 'string') {
          try { pinCodes = JSON.parse(pinCodes); } catch (e) { pinCodes = []; }
        }
        if (Array.isArray(pinCodes) && pinCodes.length > 0) {
          const placeholders = pinCodes.map(() => '?').join(',');
          filters += ` AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})`;
          queryParams.push(...pinCodes);
        } else {
          filters += ` AND 1=0`;
        }
      } else {
        filters += ` AND 1=0`;
      }
    }

    const orderBy = ` ORDER BY cm.created_at DESC`;

    const [messages] = await pool.execute(baseSelect + filters + orderBy, queryParams);

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
};

// Admin: Update contact message status (PENDING / RESOLVED) and send email result to user
export const updateContactStatus = async (req, res) => {
  try {
    await ensureColumnsExist();
    const { id } = req.params;
    const { status, adminReply } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const upperStatus = status.toUpperCase();

    // Fetch existing message record
    const [existingRows] = await pool.execute('SELECT * FROM bm_contact_messages WHERE id = ? LIMIT 1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Contact message not found.' });
    }

    const msg = existingRows[0];
    const replyText = adminReply !== undefined ? adminReply.trim() : (msg.admin_reply || null);

    // Update in Database
    if (replyText) {
      await pool.execute(
        'UPDATE bm_contact_messages SET status = ?, admin_reply = ?, admin_responded_at = NOW() WHERE id = ?',
        [upperStatus, replyText, id]
      );
    } else {
      await pool.execute(
        'UPDATE bm_contact_messages SET status = ? WHERE id = ?',
        [upperStatus, id]
      );
    }

    // Send Email to the User informing them of the action result
    if (msg.email) {
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

          const isResolved = upperStatus === 'RESOLVED';
          const statusLabel = isResolved ? 'RESOLVED' : 'UNDER REVIEW';
          const statusColor = isResolved ? '#059669' : '#d97706';
          const statusBg = isResolved ? '#ecfdf5' : '#fffbeb';
          const statusBorder = isResolved ? '#a7f3d0' : '#fde68a';

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: linear-gradient(135deg, #881337 0%, #4c0519 100%); padding: 26px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
                .header p { margin: 4px 0 0 0; color: #fecdd3; font-size: 13px; }
                .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #334155; }
                .badge { display: inline-block; background-color: ${statusBg}; color: ${statusColor}; padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; border: 1px solid ${statusBorder}; margin-bottom: 16px; }
                .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px; }
                .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; }
                .info-row:last-child { border-bottom: none; }
                .info-label { font-weight: 600; color: #64748b; }
                .info-val { font-weight: 600; color: #0f172a; }
                .reply-box { background: #fdf2f4; border-left: 4px solid #881337; border-radius: 8px; padding: 14px 16px; margin: 20px 0; }
                .reply-box h4 { margin: 0 0 6px 0; color: #881337; font-size: 13px; font-weight: 700; }
                .reply-box p { margin: 0; color: #1e293b; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; }
                .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                .footer a { color: #881337; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${siteName} Support</h1>
                  <p>Customer Care & Helpdesk</p>
                </div>
                <div class="content">
                  <div class="badge">Status: ${statusLabel} • Ticket #ENQ-${msg.id}</div>
                  <p>Dear <strong>${msg.name}</strong>,</p>
                  
                  <p>
                    ${isResolved 
                      ? `We are pleased to inform you that your general enquiry regarding <strong>"${msg.subject}"</strong> has been reviewed and marked as <strong>RESOLVED</strong> by our support team.`
                      : `Your general enquiry regarding <strong>"${msg.subject}"</strong> has been updated to <strong>UNDER REVIEW</strong>.`}
                  </p>

                  ${replyText ? `
                  <div class="reply-box">
                    <h4>Support Team Response / Action Remarks:</h4>
                    <p>${replyText}</p>
                  </div>
                  ` : ''}

                  <div class="info-card">
                    <div class="info-row">
                      <span class="info-label">Enquiry Subject:</span>
                      <span class="info-val">${msg.subject}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Ticket ID:</span>
                      <span class="info-val">#ENQ-${msg.id}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Current Status:</span>
                      <span class="info-val" style="color: ${statusColor}; font-weight: 700;">${statusLabel}</span>
                    </div>
                  </div>

                  <p style="margin-top: 20px; font-size: 13px; color: #475569;">
                    If you have any further questions or if your issue is not fully solved, you can reply directly to this email or call our support team at <strong>${contactPhone}</strong>.
                  </p>
                  
                  <p style="margin-top: 24px; margin-bottom: 0;">Warm Regards,<br><strong>Customer Support Desk</strong><br>${siteName} Kerala</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.<br>Official Helpdesk Email: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                </div>
              </div>
            </body>
            </html>
          `;

          const plainText = `Dear ${msg.name},\n\n` +
            `Your enquiry regarding "${msg.subject}" (Ticket #ENQ-${msg.id}) has been updated to: ${statusLabel}.\n\n` +
            (replyText ? `Support Team Response:\n${replyText}\n\n` : '') +
            `If you have any further questions, reply directly to this email or contact us at ${supportEmail} / ${contactPhone}.\n\n` +
            `Warm Regards,\n` +
            `Customer Support Team\n` +
            `${siteName}`;

          const mailOptions = {
            from: process.env.SMTP_USER,
            to: msg.email,
            subject: `Enquiry Update [Ticket #ENQ-${msg.id}]: ${msg.subject} | ${siteName}`,
            text: plainText,
            html: emailHtml
          };

          transporter.sendMail(mailOptions).catch(err => {
            console.error('Error sending enquiry resolution email:', err);
          });
        }
      } catch (mailErr) {
        console.error('Failed to trigger enquiry status email:', mailErr);
      }
    }

    res.status(200).json({ 
      message: `Status updated to ${upperStatus}. Email notification sent to user.` 
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Failed to update contact status.' });
  }
};

// Admin: Delete contact message
export const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM bm_contact_messages WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact message not found.' });
    }

    res.status(200).json({ message: 'Contact message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message.' });
  }
};
