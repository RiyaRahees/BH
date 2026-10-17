import express from 'express';
import { createOrder, verifyPayment, calculateUpgradeCost, getUserPaymentHistory, claimFreePlan } from '../controllers/paymentController.js';
import { verifyUserSession } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Both endpoints require the user to be logged in
router.use(verifyUserSession);

router.get('/history', getUserPaymentHistory);
router.post('/calculate-upgrade', calculateUpgradeCost);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.post('/claim-free-plan', claimFreePlan);

export default router;
