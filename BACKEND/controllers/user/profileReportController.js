import pool from '../../config/db.js';
import { sendReportFiledEmails } from '../../utils/emailService.js';

export const submitReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { profileId: reportedProfileId } = req.params;
    const { reason, details } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    // 1. Get reporter's details
    const [reporterRows] = await pool.query(
      'SELECT profile_id, full_name, email_address FROM user_registration WHERE id = ?',
      [userId]
    );

    if (reporterRows.length === 0) {
      return res.status(404).json({ error: 'Reporter user account not found' });
    }

    const reporter = reporterRows[0];
    const reporterProfileId = reporter.profile_id;

    if (reporterProfileId?.toLowerCase() === reportedProfileId?.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot report your own profile' });
    }

    // 2. Check if reported user exists
    const [reportedRows] = await pool.query(
      'SELECT profile_id, full_name, email_address, status FROM user_registration WHERE LOWER(profile_id) = LOWER(?)',
      [reportedProfileId]
    );

    if (reportedRows.length === 0) {
      return res.status(404).json({ error: 'Reported profile not found' });
    }

    const reported = reportedRows[0];

    // 3. Insert report record
    await pool.query(
      `INSERT INTO user_reports (reporter_profile_id, reported_profile_id, reason, details)
       VALUES (?, ?, ?, ?)`,
      [reporterProfileId, reportedProfileId, reason.trim(), details ? details.trim() : '']
    );

    // 4. Send email notifications to both users asynchronously
    sendReportFiledEmails({
      reporter,
      reported,
      reason: reason.trim(),
      details: details ? details.trim() : ''
    }).catch(err => console.error('Error sending report filed emails:', err));

    res.status(200).json({ message: 'Profile reported successfully. Our team will review this report.' });
  } catch (error) {
    console.error('Error submitting profile report:', error);
    res.status(500).json({ error: 'Failed to submit profile report' });
  }
};

// GET /api/users/my-reports - Get reports filed against the logged-in user and reports submitted by the user
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [userRows] = await pool.query(
      'SELECT profile_id FROM user_registration WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const profileId = userRows[0].profile_id;

    // 1. Reports filed AGAINST me (Received violation notices)
    const [receivedReports] = await pool.query(
      `SELECT 
        r.id,
        r.reporter_profile_id,
        r.reported_profile_id,
        r.reason,
        r.details,
        r.status,
        r.appeal_status,
        r.appeal_message,
        r.appealed_at,
        r.created_at,
        'RECEIVED' as report_direction,
        ur_reporter.full_name as reporter_name,
        ur_reporter.photo_1 as reporter_photo,
        ur_reporter.gender as reporter_gender
       FROM user_reports r
       LEFT JOIN user_registration ur_reporter ON LOWER(r.reporter_profile_id) = LOWER(ur_reporter.profile_id)
       WHERE LOWER(r.reported_profile_id) = LOWER(?)
       ORDER BY r.created_at DESC`,
      [profileId]
    );

    // 2. Reports SUBMITTED BY me (Reports I sent against others)
    const [sentReports] = await pool.query(
      `SELECT 
        r.id,
        r.reporter_profile_id,
        r.reported_profile_id,
        r.reason,
        r.details,
        r.status,
        r.appeal_status,
        r.appeal_message,
        r.appealed_at,
        r.created_at,
        'SENT' as report_direction,
        ur_reported.full_name as reported_name,
        ur_reported.photo_1 as reported_photo,
        ur_reported.gender as reported_gender
       FROM user_reports r
       LEFT JOIN user_registration ur_reported ON LOWER(r.reported_profile_id) = LOWER(ur_reported.profile_id)
       WHERE LOWER(r.reporter_profile_id) = LOWER(?)
       ORDER BY r.created_at DESC`,
      [profileId]
    );

    res.status(200).json({ 
      reports: receivedReports, // backward compatibility
      received_reports: receivedReports,
      sent_reports: sentReports
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// POST /api/users/my-reports/:reportId/appeal - Appeal or accept a report
export const respondToReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reportId } = req.params;
    const { action, appeal_message } = req.body;

    if (!['APPEAL', 'ACCEPT'].includes(action)) {
      return res.status(400).json({ error: 'Action must be APPEAL or ACCEPT' });
    }

    if (action === 'APPEAL' && (!appeal_message || !appeal_message.trim())) {
      return res.status(400).json({ error: 'Appeal explanation/reason is required' });
    }

    const [userRows] = await pool.query(
      'SELECT profile_id FROM user_registration WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const profileId = userRows[0].profile_id;

    // Check if report exists and belongs to this user
    const [reportRows] = await pool.query(
      'SELECT id, status, appeal_status FROM user_reports WHERE id = ? AND LOWER(reported_profile_id) = LOWER(?)',
      [reportId, profileId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found or does not belong to your account' });
    }

    const report = reportRows[0];
    if (report.appeal_status === 'APPEALED' || report.appeal_status === 'ACCEPTED') {
      return res.status(400).json({ error: `You have already ${report.appeal_status.toLowerCase()} this report.` });
    }

    if (action === 'ACCEPT') {
      await pool.query(
        'UPDATE user_reports SET appeal_status = "ACCEPTED", appealed_at = NOW() WHERE id = ?',
        [reportId]
      );
      return res.status(200).json({ message: 'Report acknowledged and accepted successfully.' });
    } else {
      await pool.query(
        'UPDATE user_reports SET appeal_status = "APPEALED", appeal_message = ?, appealed_at = NOW() WHERE id = ?',
        [appeal_message.trim(), reportId]
      );
      return res.status(200).json({ message: 'Appeal submitted successfully. Our admin team will review your explanation.' });
    }
  } catch (error) {
    console.error('Error responding to report:', error);
    res.status(500).json({ error: 'Failed to process report appeal' });
  }
};

// DELETE /api/users/my-reports/:reportId/withdraw - Withdraw a report submitted by the user
export const withdrawReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reportId } = req.params;

    const [userRows] = await pool.query(
      'SELECT profile_id FROM user_registration WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const profileId = userRows[0].profile_id;

    // Check if report exists and was created by this reporter
    const [reportRows] = await pool.query(
      'SELECT id, status FROM user_reports WHERE id = ? AND LOWER(reporter_profile_id) = LOWER(?)',
      [reportId, profileId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found or was not submitted by you' });
    }

    await pool.query('DELETE FROM user_reports WHERE id = ?', [reportId]);

    res.status(200).json({ message: 'Report withdrawn and removed successfully.' });
  } catch (error) {
    console.error('Error withdrawing report:', error);
    res.status(500).json({ error: 'Failed to withdraw report' });
  }
};

