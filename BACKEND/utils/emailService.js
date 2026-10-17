import nodemailer from 'nodemailer';

export const getEmailTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // 1. If explicit SMTP_HOST is provided (e.g., smtp.hostinger.com, smtp.zoho.com, mail.domain.com)
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE !== 'false' && port === 465);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: isSecure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // 2. If user is standard Gmail address
  if (user.toLowerCase().endsWith('@gmail.com') || user.toLowerCase().endsWith('@googlemail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  // 3. For custom business domains (e.g. help@bharathmarriage.com)
  const domain = user.includes('@') ? user.split('@')[1] : '';
  return nodemailer.createTransport({
    host: `smtp.${domain}`,
    port: 465,
    secure: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send generic notification email with optional attachments
 */
export const sendNotificationEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    if (!to) return false;
    const transporter = getEmailTransporter();
    if (!transporter) {
      console.warn('SMTP credentials not configured. Email not sent to:', to);
      return false;
    }
    await transporter.sendMail({
      from: `"Bharat Marriage" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || `<p>${text}</p>`,
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    });
    console.log(`[Email Service] Sent email to ${to}: "${subject}" (Attachments: ${attachments?.length || 0})`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error);
    return false;
  }
};

/**
 * Base email layout with Bharat Marriage luxury branding
 */
const getBrandedEmailTemplate = ({ title, subtitle, preheader, bodyHtml, ctaText, ctaLink }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #780C28 0%, #A30D36 100%); padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                BHARATH MARRIAGE
              </h1>
              <p style="margin: 4px 0 0; font-size: 11px; color: #fecdd3; letter-spacing: 1px; text-transform: uppercase;">
                ${subtitle || 'Trusted Kerala Matrimony'}
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #0f172a;">
                ${title}
              </h2>
              <div style="font-size: 14px; line-height: 1.6; color: #334155;">
                ${bodyHtml}
              </div>

              ${ctaText && ctaLink ? `
              <div style="margin-top: 28px; text-align: center;">
                <a href="${ctaLink}" style="display: inline-block; background-color: #780C28; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 2px 8px rgba(120, 12, 40, 0.25);">
                  ${ctaText}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                © ${new Date().getFullYear()} Bharat Marriage. All rights reserved.
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">
                This is an automated safety and account notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send notification emails when a new report is filed
 */
export const sendReportFiledEmails = async ({ reporter, reported, reason, details }) => {
  // 1. Email to Reported User
  if (reported?.email_address) {
    const title = 'Important Notice: Profile Report Received';
    const bodyHtml = `
      <p>Hello <strong>${reported.full_name || 'Member'}</strong>,</p>
      <p>A community report has been submitted regarding your profile (<strong>${reported.profile_id}</strong>).</p>
      
      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase;">Stated Reason</p>
        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #9f1239;">${reason}</p>
        ${details ? `<p style="margin: 6px 0 0; font-size: 12px; color: #475569; font-style: italic;">"${details}"</p>` : ''}
      </div>

      <p>We are committed to fair resolution. You can view full report details, acknowledge the notification, or submit an appeal with your explanation directly through your account dashboard.</p>
    `;
    const html = getBrandedEmailTemplate({
      title,
      bodyHtml,
      ctaText: 'Review & Submit Appeal',
      ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
    });

    await sendNotificationEmail({
      to: reported.email_address,
      subject: `Notice Regarding Your Bharat Marriage Profile (${reported.profile_id})`,
      html,
      text: `Hello ${reported.full_name},\n\nA report has been filed regarding your profile for: "${reason}". Please log in to your dashboard to review and submit an appeal if needed.\n\nBharat Marriage Team`
    });
  }

  // 2. Email to Reporter
  if (reporter?.email_address) {
    const title = 'Your Community Report Has Been Received';
    const bodyHtml = `
      <p>Hello <strong>${reporter.full_name || 'Member'}</strong>,</p>
      <p>Thank you for submitting a report regarding profile <strong>${reported?.profile_id || 'the member'}</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Report Category</p>
        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #334155;">${reason}</p>
      </div>

      <p>Our moderation team takes community safety seriously and is actively reviewing this case. You will be notified once appropriate action has been taken.</p>
    `;
    const html = getBrandedEmailTemplate({
      title,
      bodyHtml
    });

    await sendNotificationEmail({
      to: reporter.email_address,
      subject: `Report Received for Profile ${reported?.profile_id || ''} - Bharat Marriage`,
      html,
      text: `Hello ${reporter.full_name},\n\nThank you for submitting your report. Our team is reviewing the issue.\n\nBharat Marriage Team`
    });
  }
};

/**
 * Send notification emails when admin takes moderation action (BLOCKED, BANNED, etc.)
 */
export const sendReportModerationActionEmails = async ({ reporter, reported, actionType, reason }) => {
  const isBlock = actionType === 'BLOCKED';
  const isBan = actionType === 'BANNED';
  const actionLabel = isBan ? 'permanently banned' : isBlock ? 'blocked/suspended' : 'updated';

  // 1. Email to Reported User
  if (reported?.email_address) {
    const title = isBan ? 'Account Banned - Violation of Terms' : 'Account Suspended - Community Violation';
    const bodyHtml = `
      <p>Hello <strong>${reported.full_name || 'Member'}</strong>,</p>
      <p>Your Bharat Marriage account (<strong>${reported.profile_id}</strong>) has been <strong>${actionLabel}</strong> following a moderation review of reported violations.</p>
      
      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase;">Violation Reason</p>
        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #9f1239;">${reason || 'Violation of Bharat Marriage Community Guidelines'}</p>
      </div>

      <p>During this suspension, access to profile searches, communications, and membership privileges has been disabled. If you believe this action was taken in error, please reach out to our official support team.</p>
    `;
    const html = getBrandedEmailTemplate({
      title,
      bodyHtml,
      ctaText: 'Contact Support',
      ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact`
    });

    await sendNotificationEmail({
      to: reported.email_address,
      subject: `Account Notice: Your Bharat Marriage Account Has Been ${isBan ? 'Banned' : 'Suspended'}`,
      html,
      text: `Hello ${reported.full_name},\n\nYour Bharat Marriage account (${reported.profile_id}) has been ${actionLabel} due to: ${reason || 'Community violations'}.\n\nBharat Marriage Team`
    });
  }

  // 2. Email to Reporter (Issue Resolved)
  if (reporter?.email_address) {
    const title = 'Update: Your Reported Issue Has Been Resolved';
    const bodyHtml = `
      <p>Hello <strong>${reporter.full_name || 'Member'}</strong>,</p>
      <p>We are writing to update you regarding the report you submitted for profile <strong>${reported?.profile_id || 'the member'}</strong>.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Resolution Status</p>
        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #15803d;">Action Taken & Account ${actionType}</p>
      </div>

      <p>Our moderation team thoroughly investigated the case and enforced appropriate disciplinary measures against the reported account.</p>
      <p>Thank you for your vigilance and for helping us maintain a safe, trustworthy matrimonial environment!</p>
    `;
    const html = getBrandedEmailTemplate({
      title,
      bodyHtml
    });

    await sendNotificationEmail({
      to: reporter.email_address,
      subject: `Issue Resolved: Update on Your Report for ${reported?.profile_id || ''} - Bharat Marriage`,
      html,
      text: `Hello ${reporter.full_name},\n\nThe report you submitted for profile ${reported?.profile_id} has been reviewed and resolved (Action: Account ${actionType}). Thank you for keeping our community safe.\n\nBharat Marriage Team`
    });
  }
};

/**
 * Send notification emails when a report is dismissed / resolved without penalty
 */
export const sendReportDismissedEmails = async ({ reporter, reported, reason }) => {
  // 1. Email to Reported User
  if (reported?.email_address) {
    const title = 'Good News: Report Resolved & In Good Standing';
    const bodyHtml = `
      <p>Hello <strong>${reported.full_name || 'Member'}</strong>,</p>
      <p>We are pleased to inform you that the report filed against your profile (<strong>${reported.profile_id}</strong>) has been reviewed and dismissed by our admin team.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Account Status</p>
        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #15803d;">100% Active & In Good Standing</p>
      </div>

      <p>No further action is required from you. You can continue browsing and connecting with matches as normal.</p>
    `;
    const html = getBrandedEmailTemplate({
      title,
      bodyHtml,
      ctaText: 'Go to Dashboard',
      ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
    });

    await sendNotificationEmail({
      to: reported.email_address,
      subject: `Report Resolved for Your Bharat Marriage Profile (${reported.profile_id})`,
      html,
      text: `Hello ${reported.full_name},\n\nThe report against your profile (${reported.profile_id}) has been reviewed and dismissed by our admin team. Your account is in good standing.\n\nBharat Marriage Team`
    });
  }

  // 2. Email to Reporter
  if (reporter?.email_address) {
    const title = 'Update: Your Report Has Been Reviewed';
    const bodyHtml = `
      <p>Hello <strong>${reporter.full_name || 'Member'}</strong>,</p>
      <p>We have completed our investigation regarding your report for profile <strong>${reported?.profile_id || 'the member'}</strong>.</p>
      <p>Our team found no conclusive policy violation at this time, and the report has been closed.</p>
      <p>Thank you for actively contributing to the safety of Bharat Marriage.</p>
    `;
    const html = getBrandedEmailTemplate({
      title,
      bodyHtml
    });

    await sendNotificationEmail({
      to: reporter.email_address,
      subject: `Report Closed: Update on Profile ${reported?.profile_id || ''} - Bharat Marriage`,
      html,
      text: `Hello ${reporter.full_name},\n\nYour report for profile ${reported?.profile_id} has been reviewed and closed by our moderation team.\n\nBharat Marriage Team`
    });
  }
};

/**
 * Send comprehensive profile details & photo completion reminder email to user
 */
export const sendProfilePhotoReminderEmail = async ({ user }) => {
  if (!user?.email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/login`;
  const dashboardUrl = `${frontendUrl}/dashboard`;

  const title = 'Complete Your Profile to Find Better Partner Matches!';
  const subtitle = 'Matrimonial Matchmaking & Profile Assistance';
  
  const bodyHtml = `
    <p>Dear <strong>${user.full_name || 'Member'}</strong>,</p>
    
    <p>To help you find your ideal life partner faster and with high compatibility, we recommend completing all the essential details on your Bharat Marriage profile (<strong>${user.profile_id}</strong>).</p>
    
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
        🌟 Why a Complete Profile Brings 10x Better Matches:
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #78350f; font-size: 13px; line-height: 1.8;">
        <li><strong>Add Recent Profile Photos:</strong> Profiles with clear photos receive up to <strong>10x more responses</strong> and interest requests from genuine families.</li>
        <li><strong>Education & Career Information:</strong> Sharing your qualifications and profession establishes authenticity and builds trust.</li>
        <li><strong>Horoscope & Astrology (Nakshatra & Rasi):</strong> Providing birth star and horoscope details enables seamless Porutham compatibility matching.</li>
        <li><strong>Family & Location Background:</strong> Helps prospective brides, grooms, and parents understand your heritage and roots.</li>
        <li><strong>Partner Expectations:</strong> Setting your preferences helps our smart matching algorithm recommend only the most suitable matches for you.</li>
      </ul>
    </div>

    <p>A fully completed matrimonial profile gives you maximum visibility in search results and ensures you never miss a meaningful proposal.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin: 18px 0; font-size: 12.5px; color: #475569; line-height: 1.6;">
      <strong style="color: #1e293b;">Quick Steps to Update:</strong><br>
      1. Log in to your Bharat Marriage account.<br>
      2. Visit your <strong>Dashboard / Edit Profile</strong> to update your photos and personal details.<br>
      3. Set your <strong>Partner Preferences</strong> to begin receiving daily tailored match suggestions.
    </div>

    <p style="margin-top: 22px;">If you have any questions or need guidance, our support team is always ready to assist you on your sacred matrimonial journey.</p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Complete Profile & Add Details',
    ctaLink: dashboardUrl
  });

  return await sendNotificationEmail({
    to: user.email_address,
    subject: `✨ Boost Your Matches! Complete Your Profile Details on Bharat Marriage (${user.profile_id})`,
    html,
    text: `Hello ${user.full_name},\n\nComplete your Bharat Marriage profile (${user.profile_id}) to get 10x better partner matches! Add your recent photos, horoscope details, education, career, and partner preferences.\n\nPlease log in at ${loginUrl} to update your profile details.\n\nWarm Regards,\nBharat Marriage Team`
  });
};

/**
 * Generate official Tax Invoice PDF Buffer using PDFKit
 */
export const generateInvoicePDFBuffer = async ({
  user = {},
  invoiceNo = '',
  invDate = '',
  invExpiry = '',
  validityDays = 30,
  planName = 'Plan',
  formattedAmount = '0.00',
  paymentId = '',
  orderId = '',
  status = 'PAID'
}) => {
  let PDFDocument;
  try {
    const pdfkitModule = await import('pdfkit');
    PDFDocument = pdfkitModule.default || pdfkitModule;
  } catch (err) {
    console.warn('[emailService] pdfkit is not installed on this server. Skipping PDF attachment generation.');
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // 1. Top Decorative Brand Bar (Maroon #800020)
      doc.rect(0, 0, doc.page.width, 8).fill('#800020');

      // 2. Header Section
      const topY = 38;
      doc.fillColor('#800020').fontSize(20).font('Helvetica-Bold').text('BHARATH MARRIAGE', 40, topY);
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('VERIFIED MATRIMONIAL SERVICES', 40, topY + 24);
      doc.fillColor('#475569').fontSize(8).font('Helvetica').text(
        'MG Road, Kochi, Kerala 682016\nIndia | GSTIN: 32AAACB1234F1Z9\nhelp@bharathmarriage.com',
        40,
        topY + 38,
        { lineGap: 2 }
      );

      // Top Right: TAX INVOICE
      doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text('TAX INVOICE', 320, topY, { align: 'right', width: 235 });

      const metaY = topY + 28;
      const metaData = [
        { label: 'Invoice No:', val: invoiceNo },
        { label: 'Date of Issue:', val: invDate },
        { label: 'Plan Expiry:', val: invExpiry },
        { label: 'Validity:', val: `${validityDays} Days` }
      ];

      metaData.forEach((item, idx) => {
        const y = metaY + (idx * 13);
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(item.label, 320, y, { align: 'right', width: 140 });
        doc.fillColor(item.label.includes('Expiry') ? '#800020' : '#0f172a')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(item.val, 465, y, { align: 'right', width: 90 });
      });

      // 3. Horizontal Separator
      const sepY = topY + 95;
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, sepY).lineTo(555, sepY).stroke();

      // 4. Two Info Boxes: Billed To & Payment Details
      const boxY = sepY + 15;
      const boxWidth = 248;
      const boxHeight = 85;

      // Billed To Box
      doc.rect(40, boxY, boxWidth, boxHeight).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica-Bold').text('BILLED TO', 52, boxY + 10);
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(user.full_name || 'Valued Member', 52, boxY + 24);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
        `Profile ID: ${user.profile_id || 'N/A'}\n${user.email_address || ''}\n${user.district ? `${user.district}, Kerala, India` : 'Kerala, India'}`,
        52,
        boxY + 40,
        { lineGap: 2 }
      );

      // Payment Details Box
      doc.rect(307, boxY, boxWidth, boxHeight).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica-Bold').text('PAYMENT DETAILS', 319, boxY + 10);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
        `Payment ID: ${paymentId || 'N/A'}\nOrder ID: ${orderId || 'N/A'}`,
        319,
        boxY + 26,
        { lineGap: 4 }
      );
      // Status pill
      doc.rect(319, boxY + 58, 80, 16).fill('#dcfce7');
      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text(`* ${status || 'PAID'}`, 325, boxY + 62);

      // 5. Items Table
      const tableY = boxY + boxHeight + 20;
      doc.rect(40, tableY, 515, 24).fill('#f8fafc');
      doc.strokeColor('#e2e8f0').lineWidth(1).rect(40, tableY, 515, 60).stroke();

      // Table Header Text
      doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
      doc.text('DESCRIPTION', 52, tableY + 8);
      doc.text('PLAN TIER', 260, tableY + 8);
      doc.text('DURATION', 360, tableY + 8);
      doc.text('AMOUNT (INR)', 470, tableY + 8, { align: 'right', width: 75 });

      // Table Row Text
      const rowY = tableY + 34;
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(`${planName} Membership Subscription`, 52, rowY);
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('Full Matrimonial Matchmaking Access (Digital Service)', 52, rowY + 12);

      doc.fillColor('#800020').fontSize(9).font('Helvetica-Bold').text(planName, 260, rowY);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(`${validityDays} Days`, 360, rowY);
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(`Rs. ${formattedAmount}`, 470, rowY, { align: 'right', width: 75 });

      // 6. Summary Card on Right
      const sumY = tableY + 75;
      const sumWidth = 200;
      const sumX = 555 - sumWidth;
      doc.rect(sumX, sumY, sumWidth, 68).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Subtotal', sumX + 12, sumY + 10);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(`Rs. ${formattedAmount}`, sumX + 90, sumY + 10, { align: 'right', width: 95 });

      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Taxes (GST 0%)', sumX + 12, sumY + 24);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Rs. 0.00', sumX + 90, sumY + 24, { align: 'right', width: 95 });

      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(sumX + 12, sumY + 38).lineTo(sumX + 188, sumY + 38).stroke();

      doc.fillColor('#800020').fontSize(10).font('Helvetica-Bold').text('Total Paid', sumX + 12, sumY + 46);
      doc.fillColor('#800020').fontSize(11).font('Helvetica-Bold').text(`Rs. ${formattedAmount}`, sumX + 90, sumY + 46, { align: 'right', width: 95 });

      // 7. Footer
      const footerY = sumY + 95;
      doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(40, footerY).lineTo(555, footerY).stroke();

      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Thank you for choosing Bharath Marriage!', 40, footerY + 12, { align: 'center', width: 515 });
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(
        'This is a computer-generated tax invoice and does not require a physical signature.\nFor billing inquiries, please contact help@bharathmarriage.com or visit https://kerala.bharathmarriage.com',
        40,
        footerY + 26,
        { align: 'center', width: 515, lineGap: 2 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Send official Tax Invoice email when a user purchases or activates a plan
 */
export const sendInvoiceEmail = async ({
  user,
  paymentId,
  orderId,
  planName,
  amount = 0,
  startDate,
  expiryDate,
  validityDays = 30,
  status = 'PAID'
}) => {
  if (!user || !user.email_address) {
    console.warn('[sendInvoiceEmail] No user email provided. Skipping invoice email.');
    return false;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const dashboardUrl = `${frontendUrl}/dashboard`;

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const invDate = formatDate(startDate || new Date());
  const invExpiry = formatDate(expiryDate);
  const rawId = paymentId || orderId || String(Date.now());
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  const invoiceNo = `INV-${cleanId}`;

  const numAmount = Number(amount || 0);
  const formattedAmount = numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isFree = numAmount === 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoiceNo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Invoice Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 660px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- Top Accent Line (Maroon Gradient) -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #800020 0%, #b3002d 100%); line-height: 6px; font-size: 1px;">&nbsp;</td>
          </tr>

          <!-- Main Content Padding -->
          <tr>
            <td style="padding: 36px 32px;">

              <!-- Header: Brand & Invoice Heading -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td valign="top" style="text-align: left;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #800020; letter-spacing: -0.5px; text-transform: uppercase;">
                      BHARATH MARRIAGE
                    </h1>
                    <p style="margin: 3px 0 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      Verified Matrimonial Services
                    </p>
                    <p style="margin: 10px 0 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                      MG Road, Kochi, Kerala 682016<br>
                      India | GSTIN: 32AAACB1234F1Z9<br>
                      help@bharathmarriage.com
                    </p>
                  </td>
                  <td valign="top" style="text-align: right;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
                      TAX INVOICE
                    </h2>
                    <table border="0" cellspacing="0" cellpadding="0" align="right" style="margin-top: 8px; font-size: 12px;">
                      <tr>
                        <td style="padding: 2px 8px 2px 0; color: #64748b; font-weight: 500; text-align: right;">Invoice No:</td>
                        <td style="padding: 2px 0; color: #0f172a; font-weight: 700; text-align: right;">${invoiceNo}</td>
                      </tr>
                      <tr>
                        <td style="padding: 2px 8px 2px 0; color: #64748b; font-weight: 500; text-align: right;">Date of Issue:</td>
                        <td style="padding: 2px 0; color: #0f172a; font-weight: 700; text-align: right;">${invDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 2px 8px 2px 0; color: #64748b; font-weight: 500; text-align: right;">Plan Expiry:</td>
                        <td style="padding: 2px 0; color: #800020; font-weight: 800; text-align: right;">${invExpiry}</td>
                      </tr>
                      <tr>
                        <td style="padding: 2px 8px 2px 0; color: #64748b; font-weight: 500; text-align: right;">Validity:</td>
                        <td style="padding: 2px 0; color: #0f172a; font-weight: 700; text-align: right;">${validityDays} Days</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr><td style="height: 1px; background-color: #f1f5f9; line-height: 1px; font-size: 1px;">&nbsp;</td></tr>
              </table>

              <!-- Two Column Meta: Billed To & Payment Details -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <!-- Billed To -->
                  <td width="50%" valign="top" style="padding-right: 16px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; min-height: 90px;">
                      <p style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">
                        Billed To
                      </p>
                      <p style="margin: 0 0 3px; font-size: 13px; font-weight: 700; color: #0f172a;">
                        ${user.full_name || 'Valued Member'}
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                        Profile ID: <strong>${user.profile_id || 'N/A'}</strong><br>
                        ${user.email_address || ''}<br>
                        ${user.district ? `${user.district}, Kerala, India` : 'Kerala, India'}
                      </p>
                    </div>
                  </td>

                  <!-- Payment Details -->
                  <td width="50%" valign="top" style="padding-left: 16px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; min-height: 90px;">
                      <p style="margin: 0 0 6px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">
                        Payment Details
                      </p>
                      <p style="margin: 0 0 4px; font-size: 11px; color: #64748b;">
                        Payment ID: <span style="font-family: monospace; color: #0f172a; font-weight: 600;">${paymentId || 'N/A'}</span>
                      </p>
                      <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">
                        Order ID: <span style="font-family: monospace; color: #0f172a;">${orderId || 'N/A'}</span>
                      </p>
                      <div>
                        <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-weight: 700; font-size: 10px; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                          ● ${status || 'PAID'}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px; border-collapse: separate; border-spacing: 0;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 1px solid #e2e8f0;">Description</th>
                    <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 1px solid #e2e8f0;">Plan Tier</th>
                    <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 1px solid #e2e8f0;">Duration</th>
                    <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right; border-bottom: 1px solid #e2e8f0;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 14px; font-size: 12.5px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
                      <strong>${planName} Membership Subscription</strong>
                      <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Full Matrimonial Matchmaking Access (Digital Service)</div>
                    </td>
                    <td style="padding: 14px; font-size: 12.5px; font-weight: 700; color: #800020; border-bottom: 1px solid #f1f5f9;">
                      ${planName}
                    </td>
                    <td style="padding: 14px; font-size: 12px; color: #475569; border-bottom: 1px solid #f1f5f9;">
                      ${validityDays} Days
                    </td>
                    <td style="padding: 14px; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">
                      ₹${formattedAmount}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Summary Card (Right-aligned) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td width="55%">&nbsp;</td>
                  <td width="45%">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 12px;">
                        <tr>
                          <td style="padding: 4px 0; color: #64748b;">Subtotal</td>
                          <td style="padding: 4px 0; color: #0f172a; font-weight: 600; text-align: right;">₹${formattedAmount}</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #64748b;">Taxes (GST 0%)</td>
                          <td style="padding: 4px 0; color: #0f172a; font-weight: 600; text-align: right;">₹0.00</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding-top: 8px; border-top: 1px dashed #cbd5e1;"></td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #800020;">Total Paid</td>
                          <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #800020; text-align: right;">₹${formattedAmount}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button to Dashboard -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #800020; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(128, 0, 32, 0.25);">
                      View Invoices in Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer Notice -->
              <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #0f172a;">
                  Thank you for choosing Bharath Marriage!
                </p>
                <p style="margin: 0; font-size: 11px; color: #64748b;">
                  This is a computer-generated tax invoice and does not require a physical signature.<br>
                  For any billing inquiries, please contact <a href="mailto:help@bharathmarriage.com" style="color: #800020; font-weight: 600;">help@bharathmarriage.com</a>.
                </p>
              </div>

            </td>
          </tr>

          <!-- Email Shell Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                © ${new Date().getFullYear()} Bharath Marriage. All rights reserved. MG Road, Kochi, Kerala.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  let attachments = [];
  try {
    const pdfBuffer = await generateInvoicePDFBuffer({
      user,
      invoiceNo,
      invDate,
      invExpiry,
      validityDays,
      planName,
      formattedAmount,
      paymentId,
      orderId,
      status
    });

    if (pdfBuffer && pdfBuffer.length > 0) {
      attachments.push({
        filename: `${invoiceNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }
  } catch (pdfErr) {
    console.error('[sendInvoiceEmail] Error generating invoice PDF attachment:', pdfErr);
  }

  return await sendNotificationEmail({
    to: user.email_address,
    subject: `🧾 Tax Invoice - ${planName} Plan (${invoiceNo}) | Bharath Marriage`,
    html,
    text: `TAX INVOICE - BHARATH MARRIAGE\nInvoice No: ${invoiceNo}\nPlan: ${planName} Membership\nDuration: ${validityDays} Days\nValid Until: ${invExpiry}\nTotal Paid: Rs. ${formattedAmount}\nPayment ID: ${paymentId || 'N/A'}\n\nPlease find your official Tax Invoice attached as a PDF.\n\nThank you for choosing Bharath Marriage!\nLog in to your account at ${frontendUrl}`,
    attachments
  });
};

/**
 * Send notification email when an account is deactivated by an administrator
 */
export const sendAccountDeactivatedByAdminEmail = async ({ user, reason }) => {
  if (!user?.email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@bharathmarriage.com';
  const title = 'Account Deactivation Notice';
  const subtitle = 'Administrative Status Update';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${user.full_name || 'Member'}</strong>,</p>
    <p>This is an official communication regarding your Bharat Marriage profile (Profile ID: <strong style="color: #780C28;">${user.profile_id}</strong>).</p>
    <p>Please be advised that your account has been <strong>deactivated</strong> by the administration team.</p>
    
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #be123c; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
      <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.5px;">
        Account Status & Impact:
      </h3>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.65; color: #881337;">
        <li style="margin-bottom: 6px;"><strong>Profile Hidden:</strong> Your profile is temporarily hidden from all search results, recommendations, and matches.</li>
        <li style="margin-bottom: 6px;"><strong>Communication Paused:</strong> Other prospective members can no longer view your details, express interest, or exchange messages with you.</li>
        <li><strong>Active Sessions Logged Out:</strong> For your security, any current login sessions on web and mobile have been terminated.</li>
      </ul>
    </div>

    ${reason ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
      <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Administrative Note:</span>
      <p style="margin: 4px 0 0; font-size: 13px; color: #334155;">${reason}</p>
    </div>
    ` : ''}

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      If you believe this action was taken in error, or if you would like to reactivate your profile to continue your marriage search, please contact our support team or reach out to your local franchise representative.
    </p>

    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px 18px; margin-top: 20px; font-size: 12.5px; color: #475569;">
      <strong>Need assistance?</strong> Contact us at <a href="mailto:${supportEmail}" style="color: #780C28; font-weight: 600; text-decoration: underline;">${supportEmail}</a> or call our helpline.
    </div>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Contact Support',
    ctaLink: `${frontendUrl}/contact`
  });

  return await sendNotificationEmail({
    to: user.email_address,
    subject: `Notice: Your Bharat Marriage Account Has Been Deactivated (${user.profile_id})`,
    html,
    text: `Hello ${user.full_name || 'Member'},\n\nYour Bharat Marriage profile (${user.profile_id}) has been deactivated by the administration.\n\nYour profile is now hidden from searches and matches, and any active sessions have been safely logged out.\n\nIf you believe this was done in error or wish to reactivate your account, please reach out to our support team at ${supportEmail}.\n\nBest Regards,\nBharat Marriage Team`
  });
};

/**
 * Send notification email when a deactivated account is reactivated by an administrator
 */
export const sendAccountReactivatedByAdminEmail = async ({ user }) => {
  if (!user?.email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/login`;
  const title = 'Account Reactivated Successfully';
  const subtitle = 'Welcome Back to Bharat Marriage';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${user.full_name || 'Member'}</strong>,</p>
    <p>We are delighted to inform you that your <strong>Bharat Marriage</strong> profile (Profile ID: <strong style="color: #780C28;">${user.profile_id}</strong>) has been <strong>reactivated</strong> by the administration team.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #16a34a; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
      <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Account Is Active:
      </h3>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.65; color: #14532d;">
        <li style="margin-bottom: 6px;">Your profile is live and visible again to matching prospective brides and grooms.</li>
        <li style="margin-bottom: 6px;">You can now log in, search profiles, view contact details, and send interests.</li>
        <li>All your existing photos, horoscopes, and preferences have been preserved.</li>
      </ul>
    </div>

    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Account Login Details:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Profile ID:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px;">${user.profile_id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Registered Email:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${user.email_address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Login Page URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      Click below to log back into your account and continue your partner search.
    </p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In to Your Account',
    ctaLink: loginUrl
  });

  return await sendNotificationEmail({
    to: user.email_address,
    subject: `Welcome Back: Your Bharat Marriage Account Has Been Reactivated (${user.profile_id})`,
    html,
    text: `Hello ${user.full_name || 'Member'},\n\nGreat news! Your Bharat Marriage profile (${user.profile_id}) has been reactivated by the administration.\n\nYour profile is now live again and visible to matches.\n\nAccount Login Details:\n- Profile ID: ${user.profile_id}\n- Email: ${user.email_address}\n- Login URL: ${loginUrl}\n\nBest Regards,\nBharat Marriage Team`
  });
};

/**
 * Send notification email when a frozen account is unfrozen by an administrator
 */
export const sendAccountUnfrozenEmail = async ({ user }) => {
  if (!user?.email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/login`;
  const title = 'Account Unfrozen & Active';
  const subtitle = 'Welcome Back to Bharat Marriage';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${user.full_name || 'Member'}</strong>,</p>
    <p>We are pleased to inform you that your <strong>Bharat Marriage</strong> account (Profile ID: <strong style="color: #780C28;">${user.profile_id}</strong>) has been <strong>unfrozen</strong> by the administration team and is now fully active.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #16a34a; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
      <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
        Account Restored:
      </h3>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.65; color: #14532d;">
        <li style="margin-bottom: 6px;">You can now log in and access all platform features normally.</li>
        <li style="margin-bottom: 6px;">Your profile is visible again to prospective brides, grooms, and matches.</li>
        <li>You can view profiles, send and receive interests, and communicate freely.</li>
      </ul>
    </div>

    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Account Login Details:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Profile ID:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px;">${user.profile_id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Registered Email:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${user.email_address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Login Page URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      Click below to log back into your account and proceed with your partner search.
    </p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In to Your Account',
    ctaLink: loginUrl
  });

  return await sendNotificationEmail({
    to: user.email_address,
    subject: `Account Unfrozen: Your Bharat Marriage Account Is Now Active (${user.profile_id})`,
    html,
    text: `Hello ${user.full_name || 'Member'},\n\nYour Bharat Marriage account (${user.profile_id}) has been unfrozen by the administration and is now active.\n\nAccount Login Details:\n- Profile ID: ${user.profile_id}\n- Email: ${user.email_address}\n- Login URL: ${loginUrl}\n\nBest Regards,\nBharat Marriage Team`
  });
};

/**
 * Send notification email when an account is activated by an administrator
 */
export const sendAccountActivatedEmail = async ({ user }) => {
  if (!user?.email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/login`;
  const title = 'Account Activated Successfully';
  const subtitle = 'Welcome to Bharat Marriage';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${user.full_name || 'Member'}</strong>,</p>
    <p>Your <strong>Bharat Marriage</strong> account (Profile ID: <strong style="color: #780C28;">${user.profile_id}</strong>) has been <strong>activated</strong> by the administration team.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #16a34a; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
      <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
        Account Active & Ready:
      </h3>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.65; color: #14532d;">
        <li style="margin-bottom: 6px;">Your profile is live and searchable on Bharat Marriage.</li>
        <li style="margin-bottom: 6px;">You can now explore matching profiles and connect with prospective partners.</li>
      </ul>
    </div>

    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Account Login Details:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Profile ID:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px;">${user.profile_id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Registered Email:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${user.email_address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Login Page URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      Click the button below to log into your account and begin your partner search.
    </p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In to Your Account',
    ctaLink: loginUrl
  });

  return await sendNotificationEmail({
    to: user.email_address,
    subject: `Your Bharat Marriage Account Is Active (${user.profile_id})`,
    html,
    text: `Hello ${user.full_name || 'Member'},\n\nYour Bharat Marriage profile (${user.profile_id}) is now active.\n\nAccount Login Details:\n- Profile ID: ${user.profile_id}\n- Email: ${user.email_address}\n- Login URL: ${loginUrl}\n\nBest Regards,\nBharat Marriage Team`
  });
};

/**
 * Send welcome email to newly registered user with their Profile ID, generated password, and Login URL
 */
export const sendUserRegistrationWelcomeEmail = async ({ email_address, full_name, profile_id, plainPassword }) => {
  if (!email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/login`;
  const title = 'Welcome to Bharath Marriage!';
  const subtitle = 'Your Trusted Matrimony Partner';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${full_name || 'Member'}</strong>,</p>
    <p>Welcome to <strong>Bharath Marriage</strong>! Your matrimony profile has been created successfully.</p>
    
    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Account Login Credentials:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Profile / User ID:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px;">${profile_id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Registered Email:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${email_address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Generated Password:</strong></td>
          <td style="padding: 6px 0; color: #780C28; font-weight: 700; font-family: monospace; font-size: 15px; letter-spacing: 1px;">${plainPassword}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Login Page URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      You can log into your account using your registered <strong>Email</strong>, <strong>Mobile Number</strong>, or <strong>Profile ID</strong> along with your password.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 18px 0; font-size: 12.5px; color: #64748b; line-height: 1.5;">
      💡 <strong>Security Tip:</strong> For your account security, we recommend changing your password after your first login in your Profile / Account Settings.
    </div>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In to Your Account',
    ctaLink: loginUrl
  });

  return await sendNotificationEmail({
    to: email_address,
    subject: `Welcome to Bharath Marriage - Your Account Login Credentials (${profile_id})`,
    html,
    text: `Hello ${full_name},\n\nWelcome to Bharath Marriage! Your account has been successfully created.\n\nYour Account Details:\n- Profile / User ID: ${profile_id}\n- Registered Email: ${email_address}\n- Generated Password: ${plainPassword}\n- Login Page URL: ${loginUrl}\n\nYou can log in using your Email, Mobile Number, or Profile ID directly at: ${loginUrl}\n\nWe recommend updating your password after your first login.\n\nBest Regards,\nBharath Marriage Team`
  });
};

/**
 * Send password reset email with temporary password and Login URL
 */
export const sendForgotPasswordResetEmail = async ({ email_address, full_name, plainPassword }) => {
  if (!email_address) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/login`;
  const title = 'Your Password Reset Request';
  const subtitle = 'Account Security Notification';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${full_name || 'Member'}</strong>,</p>
    <p>We received a request to reset the password for your <strong>Bharath Marriage</strong> account.</p>
    
    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Temporary Password:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Registered Email:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${email_address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>New Password:</strong></td>
          <td style="padding: 6px 0; color: #780C28; font-weight: 700; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${plainPassword}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Login Page URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      Please log into your account using your new temporary password and update it immediately in your Account Settings.
    </p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In Now',
    ctaLink: loginUrl
  });

  return await sendNotificationEmail({
    to: email_address,
    subject: 'Password Reset - Bharath Marriage',
    html,
    text: `Hello ${full_name},\n\nWe received a request to reset your password for your Bharath Marriage account.\n\nYour temporary password is: ${plainPassword}\nLogin Page URL: ${loginUrl}\n\nFor your security, please log into your account at ${loginUrl} and change this password immediately.\n\nBest Regards,\nBharath Marriage Team`
  });
};

/**
 * Send notification email when a franchise partnership request is approved
 */
export const sendFranchiseApprovalEmail = async ({
  name,
  email,
  franchise_id,
  plainPassword
}) => {
  if (!email) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginUrl = `${frontendUrl}/franchise/login`;
  const title = 'Congratulations! Your Franchise Application Has Been Approved';
  const subtitle = 'Bharath Marriage Partner Network';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 16px; font-weight: 700; color: #780C28;">Congratulations!</p>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      Dear <strong>${name || 'Partner'}</strong>,<br>
      Your Bharath Marriage franchise application has been reviewed and approved.
    </p>
    
    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Franchise Login Credentials:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 160px;"><strong>Franchise ID:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px;">${franchise_id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Registered Email:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${email}</td>
        </tr>
        ${plainPassword ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Temporary Password:</strong></td>
          <td style="padding: 6px 0; color: #780C28; font-weight: 700; font-family: monospace; font-size: 15px; letter-spacing: 1px;">${plainPassword}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Franchise Login URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      Please use the above credentials to log in to your Franchise Portal.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 18px 0; font-size: 12.5px; color: #64748b; line-height: 1.5;">
      🔒 <strong>Security Tip:</strong> Please keep your credentials secure and change your temporary password upon logging into the franchise portal for the first time.
    </div>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In to Franchise Portal',
    ctaLink: loginUrl
  });

  const textLines = [
    `Congratulations!`,
    '',
    `Dear ${name || 'Partner'},`,
    'Your Bharath Marriage franchise application has been reviewed and approved.',
    '',
    `Franchise ID: ${franchise_id}`,
    `Registered Email: ${email}`,
    ...(plainPassword ? [`Temporary Password: ${plainPassword}`] : []),
    `Franchise Login URL: ${loginUrl}`,
    '',
    'Please use the above credentials to log in to your Franchise Portal.',
    '',
    'Best Regards,',
    'Bharat Marriage Team'
  ];

  return await sendNotificationEmail({
    to: email,
    subject: `Congratulations! Your Bharath Marriage Franchise Application Has Been Approved`,
    html,
    text: textLines.join('\n')
  });
};

/**
 * Send welcome email to newly created staff member with credentials and staff login URL
 */
export const sendStaffRegisteredWelcomeEmail = async ({
  name,
  email,
  staff_id,
  role,
  plainPassword
}) => {
  if (!email) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'https://kerala.bharathmarriage.com';
  const loginUrl = `${frontendUrl}/admin/login`;
  const title = 'Welcome to the Staff Team!';
  const subtitle = 'Bharat Marriage Staff & Admin Portal';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong>${name || 'Staff Member'}</strong>,</p>
    <p>Your staff account for the <strong>Bharat Marriage Admin Portal</strong> has been successfully created.</p>
    
    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Staff Portal Login Credentials:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 150px;"><strong>Staff ID:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px;">${staff_id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Email / Username:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${email}</td>
        </tr>
        ${role ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Assigned Role:</strong></td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${role}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Temporary Password:</strong></td>
          <td style="padding: 6px 0; color: #780C28; font-weight: 700; font-family: monospace; font-size: 15px; letter-spacing: 1px;">${plainPassword}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Staff Login URL:</strong></td>
          <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #780C28; text-decoration: underline; font-weight: 600; word-break: break-all;">${loginUrl}</a></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      Please use your assigned credentials to log in to the Bharat Marriage Admin & Staff Portal using the button below.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 18px 0; font-size: 12.5px; color: #64748b; line-height: 1.5;">
      🔒 <strong>Security Notice:</strong> Keep your login credentials confidential. Please change your password upon your first login.
    </div>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Log In to Staff Portal',
    ctaLink: loginUrl
  });

  return await sendNotificationEmail({
    to: email,
    subject: 'Welcome to Bharat Marriage - Staff Account Login Details',
    html,
    text: `Dear ${name},\n\nYour staff account for the Bharat Marriage Admin Portal has been successfully created.\n\nYour Login Details:\n- Staff ID: ${staff_id}\n- Email: ${email}\n- Temporary Password: ${plainPassword}\n- Staff Login URL: ${loginUrl}\n\nPlease use these credentials to log in at the staff portal: ${loginUrl}\n\nBest Regards,\nBharat Marriage Admin Team`
  });
};

/**
 * Send EMAIL #1: Initial Approval & Secure Verification Link Email
 * (Strictly NO credentials sent here)
 */
export const sendFranchiseVerificationLinkEmail = async ({
  name,
  email,
  requestId,
  district,
  pincode,
  verificationToken,
  expiresInDays = 7
}) => {
  if (!email) return false;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/franchise/register`;
  const title = 'Initial Approval - Complete Your Franchise Registration Form';
  const subtitle = 'Bharat Marriage Partner Network';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong>${name || 'Applicant'}</strong>,</p>
    <p>
      Thank you for applying to become an official Franchise Partner with <strong>Bharat Marriage</strong>.
      We are pleased to inform you that your initial franchise enquiry (Ref: <strong style="color: #780C28;">${requestId}</strong>) has been <strong>INITIALLY APPROVED</strong>.
    </p>

    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-left: 4px solid #780C28; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #780C28; text-transform: uppercase; letter-spacing: 0.5px;">
        Application Reference Summary:
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #64748b; width: 160px;"><strong>Reference ID:</strong></td>
          <td style="padding: 5px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${requestId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;"><strong>Applicant Name:</strong></td>
          <td style="padding: 5px 0; color: #0f172a; font-weight: 600;">${name}</td>
        </tr>
        ${district ? `
        <tr>
          <td style="padding: 5px 0; color: #64748b;"><strong>Target Territory:</strong></td>
          <td style="padding: 5px 0; color: #0f172a; font-weight: 600;">${district}${pincode ? ` (${pincode})` : ''}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 5px 0; color: #64748b;"><strong>Link Expiry:</strong></td>
          <td style="padding: 5px 0; color: #be123c; font-weight: 700;">Valid for ${expiresInDays} days</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13.5px; line-height: 1.6; color: #334155;">
      Your initial franchise request has received initial approval. Please complete the Franchise Registration Form using the link below and provide the required information/documents.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 18px 0;">
      <p style="margin: 0 0 8px; font-size: 12.5px; font-weight: 700; color: #0f172a;">Required Information & Documents:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.6;">
        <li>Authorized Person / Organization Information</li>
        <li>Operating District & Territory Pincodes</li>
        <li>Bank Account Details</li>
        <li>Identity Proof (Aadhaar / PAN / GST documents)</li>
      </ul>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 18px;">
      If the button above does not work, open this registration link in your browser:<br>
      <a href="${verificationUrl}" style="color: #780C28; word-break: break-all;">${verificationUrl}</a>
    </p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml,
    ctaText: 'Complete Franchise Registration',
    ctaLink: verificationUrl
  });

  const text = `Dear ${name},\n\n` +
    `Your initial franchise request has received initial approval.\n` +
    `Please complete the Franchise Registration Form using the link below:\n` +
    `${verificationUrl}\n\n` +
    `Best Regards,\n` +
    `Franchise Onboarding Team\n` +
    `Bharat Marriage`;

  return await sendNotificationEmail({
    to: email,
    subject: `Initial Approval - Complete Your Franchise Registration - ${requestId} | Bharat Marriage`,
    html,
    text
  });
};

/**
 * Send franchise request rejection notification email
 */
export const sendFranchiseRejectionEmail = async ({ name, email, requestId, reason }) => {
  if (!email) return false;

  const title = 'Update Regarding Your Franchise Request';
  const subtitle = 'Bharat Marriage Partner Desk';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong>${name || 'Applicant'}</strong>,</p>
    <p>
      Thank you for your interest in partnering with Bharat Marriage. After careful review of your application (Ref: <strong>${requestId || 'N/A'}</strong>), we regret to inform you that we are unable to approve your franchise partnership at this time.
    </p>

    ${reason ? `
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase;">Review Remarks</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #9f1239;">${reason}</p>
    </div>
    ` : ''}

    <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
      If you believe this was an error or if your territory details have changed, feel free to submit a new enquiry in the future or contact our franchise desk.
    </p>
  `;

  const html = getBrandedEmailTemplate({
    title,
    subtitle,
    bodyHtml
  });

  return await sendNotificationEmail({
    to: email,
    subject: `Update on Franchise Application - ${requestId || ''} | Bharat Marriage`,
    html,
    text: `Dear ${name},\n\nThank you for your interest in partnering with Bharat Marriage. Unfortunately, your application could not be approved at this time.\n${reason ? `\nRemarks: ${reason}\n` : ''}\nBest Regards,\nBharat Marriage Team`
  });
};




