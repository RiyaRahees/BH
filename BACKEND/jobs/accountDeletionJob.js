import cron from 'node-cron';
import pool from '../config/db.js';
import { sendNotificationEmail } from '../utils/emailService.js';

export const startAccountDeletionJob = () => {
  // Run every day at 12:00 AM (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running account deletion cron job...');
    try {
      // Find all users who requested deletion more than 3 days ago and are still in PENDING_DELETE status
      const [usersToDelete] = await pool.query(
        'SELECT id, full_name, email_address, delete_requested_at FROM user_registration WHERE status = ? AND delete_requested_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)',
        ['PENDING_DELETE']
      );

      if (usersToDelete.length > 0) {
        console.log(`Found ${usersToDelete.length} accounts to permanently delete.`);

        for (const user of usersToDelete) {
          // 1. Update status to DELETED
          await pool.query('UPDATE user_registration SET status = ? WHERE id = ?', ['DELETED', user.id]);

          // 2. Send email notification
          await sendNotificationEmail({
            to: user.email_address,
            subject: 'Account Permanently Deleted',
            text: `Hello ${user.full_name},\n\nThe 3-day grace period has expired, and your Bharat Marriage account has now been permanently deleted.\n\nYou will no longer be able to log in to this account.\n\nBest Regards,\nBharat Marriage`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2>Account Permanently Deleted</h2>
                <p>Hello ${user.full_name},</p>
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  The 3-day grace period has expired, and your account has now been permanently deleted.
                </div>
                <p>You will no longer be able to log in to this account.</p>
                <p>Best Regards,<br>Bharat Marriage</p>
              </div>
            `
          });
          
          console.log(`Successfully processed permanent deletion for user ID ${user.id} (${user.email_address})`);
        }
      } else {
        console.log('No accounts pending permanent deletion today.');
      }
    } catch (error) {
      console.error('Error in account deletion cron job:', error);
    }

    try {
      // Find all users who requested deactivation more than 3 days ago and are still in PENDING_DEACTIVATE status
      const [usersToDeactivate] = await pool.query(
        'SELECT id, full_name, email_address, deactivate_requested_at FROM user_registration WHERE status = ? AND deactivate_requested_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)',
        ['PENDING_DEACTIVATE']
      );

      if (usersToDeactivate.length > 0) {
        console.log(`Found ${usersToDeactivate.length} accounts to officially deactivate.`);

        for (const user of usersToDeactivate) {
          // 1. Update status to DEACTIVATED
          await pool.query('UPDATE user_registration SET status = ? WHERE id = ?', ['DEACTIVATED', user.id]);

          // 2. Send email notification
          await sendNotificationEmail({
            to: user.email_address,
            subject: 'Account Officially Deactivated',
            text: `Hello ${user.full_name},\n\nThe 3-day grace period has expired, and your Bharat Marriage account has now been officially deactivated.\n\nYou will no longer be able to log in to this account. To reactivate your account in the future, please use the Contact Us page to reach out to support.\n\nBest Regards,\nBharat Marriage`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2>Account Officially Deactivated</h2>
                <p>Hello ${user.full_name},</p>
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  The 3-day grace period has expired, and your account has now been officially deactivated.
                </div>
                <p>You will no longer be able to log in to this account. To reactivate your account in the future, please use the <strong>Contact Us</strong> page to reach out to our support team.</p>
                <p>Best Regards,<br>Bharat Marriage</p>
              </div>
            `
          });
          
          console.log(`Successfully processed official deactivation for user ID ${user.id} (${user.email_address})`);
        }
      } else {
        console.log('No accounts pending official deactivation today.');
      }
    } catch (error) {
      console.error('Error in account deactivation cron job:', error);
    }
  });
  
  console.log('Account deletion cron job scheduled (runs daily at midnight).');
};
