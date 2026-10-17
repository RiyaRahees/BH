import express from 'express';
import { getAllPlans } from '../controllers/admin/planController.js';
import { submitContactForm } from '../controllers/contactController.js';
import { submitFranchiseRequest } from '../controllers/franchiseRequestController.js';
import { getCastes } from '../controllers/admin/casteController.js';
import { getSystemSettings } from '../controllers/admin/systemSettingsController.js';
import { getPublicSuccessStories } from '../controllers/admin/marriageRequestAdminController.js';
import { 
  validateVerificationToken, 
  uploadFranchiseDocs, 
  submitVerificationForm 
} from '../controllers/franchiseVerificationController.js';

const router = express.Router();

router.get('/plans', getAllPlans);
router.get('/castes', getCastes);
router.get('/settings', getSystemSettings);
router.get('/success-stories', getPublicSuccessStories);
router.post('/contact', submitContactForm);
router.post('/franchise-request', uploadFranchiseDocs, submitFranchiseRequest);

// Secure Franchise Verification Endpoints
router.get('/franchise/verification/:token', validateVerificationToken);
router.post('/franchise/verification/:token/submit', uploadFranchiseDocs, submitVerificationForm);

export default router;
