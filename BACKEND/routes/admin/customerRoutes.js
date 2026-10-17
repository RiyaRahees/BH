import express from 'express';
import { 
  getCustomers, 
  forceLogout, 
  updateCustomer, 
  getReports, 
  dismissReport,
  approveUserPhotos,
  rejectUserPhotos,
  sendCustomerProfileReminder
} from '../../controllers/admin/customerController.js';

const router = express.Router();

// Get all customers with filters and pagination
router.get('/', getCustomers);

// Photo Moderation & Reminder Routes
router.post('/:profileId/photos/approve', approveUserPhotos);
router.post('/:profileId/photos/reject', rejectUserPhotos);
router.post('/:profileId/send-profile-reminder', sendCustomerProfileReminder);

// Get all profile reports
router.get('/reports/all', getReports);

// Dismiss a report
router.delete('/reports/:reportId', dismissReport);

// Force logout a user
router.post('/force-logout/:id', forceLogout);

// Update customer verification and status
router.put('/:id', updateCustomer);

export default router;
