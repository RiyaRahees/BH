import express from 'express';
import franchiseRoutes from './admin/franchiseRoutes.js';
import dashboardRoutes from './admin/dashboardRoutes.js';
import staffRoutes from './admin/staffRoutes.js';
import customerRoutes from './admin/customerRoutes.js';
import planRoutes from './admin/planRoutes.js';
import headFranchiseRoutes from './admin/headFranchiseRoutes.js';
import adminPaymentRoutes from './admin/adminPaymentRoutes.js';
import casteRoutes from './admin/casteRoutes.js';
import systemSettingsRoutes from './admin/systemSettingsRoutes.js';
import marriageRequestRoutes from './admin/marriageRequestRoutes.js';
import { 
  getFranchiseRequests, 
  getFranchiseVerificationDetails,
  initialApproveFranchiseRequest,
  finalApproveVerification,
  rejectFranchiseRequest,
  updateFranchiseRequestStatus, 
  deleteFranchiseRequest 
} from '../controllers/franchiseRequestController.js';
import {
  getContactMessages,
  updateContactStatus,
  deleteContactMessage
} from '../controllers/contactController.js';

const router = express.Router();

// Mount all admin related routes here
router.use('/franchises', franchiseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/staff', staffRoutes);
router.use('/customers', customerRoutes);
router.use('/plans', planRoutes);
router.use('/head-franchise', headFranchiseRoutes);
router.use('/payments', adminPaymentRoutes);
router.use('/castes', casteRoutes);
router.use('/settings', systemSettingsRoutes);
router.use('/marriage-requests', marriageRequestRoutes);

// Contact form message management
router.get('/contact-messages', getContactMessages);
router.put('/contact-messages/:id/status', updateContactStatus);
router.delete('/contact-messages/:id', deleteContactMessage);

// Franchise Partnership & Verification Workflow Management
router.get('/franchise-partnership-requests', getFranchiseRequests);
router.get('/franchise-partnership-requests/:id/details', getFranchiseVerificationDetails);
router.post('/franchise-partnership-requests/:id/initial-approve', initialApproveFranchiseRequest);
router.post('/franchise-partnership-requests/:id/final-approve', finalApproveVerification);
router.post('/franchise-partnership-requests/:id/reject', rejectFranchiseRequest);
router.put('/franchise-partnership-requests/:id/status', updateFranchiseRequestStatus);
router.delete('/franchise-partnership-requests/:id', deleteFranchiseRequest);

export default router;
