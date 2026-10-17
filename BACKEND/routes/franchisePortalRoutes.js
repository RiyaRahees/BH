import express from 'express';
import {
  franchiseLogin,
  franchiseForgotPassword,
  getFranchiseDashboard,
  getFranchiseCustomers,
  getFranchisePayments,
  verifyCustomerInFranchisePin
} from '../controllers/franchisePortalController.js';
import {
  updateCustomer,
  forceLogout,
  approveUserPhotos,
  rejectUserPhotos
} from '../controllers/admin/customerController.js';
import { verifyFranchiseSession } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', franchiseLogin);
router.post('/forgot-password', franchiseForgotPassword);

// Protected routes (Requires valid franchise JWT session)
router.get('/dashboard', verifyFranchiseSession, getFranchiseDashboard);
router.get('/customers', verifyFranchiseSession, getFranchiseCustomers);

// Strictly territory-enforced customer mutation routes (Requires valid PIN match)
router.put('/customers/:id', verifyFranchiseSession, verifyCustomerInFranchisePin, updateCustomer);
router.post('/customers/force-logout/:id', verifyFranchiseSession, verifyCustomerInFranchisePin, forceLogout);
router.post('/customers/:id/photos/approve', verifyFranchiseSession, verifyCustomerInFranchisePin, approveUserPhotos);
router.post('/customers/:id/photos/reject', verifyFranchiseSession, verifyCustomerInFranchisePin, rejectUserPhotos);

router.get('/payments', verifyFranchiseSession, getFranchisePayments);

export default router;
