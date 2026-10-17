import express from 'express';
import { getPaymentHistory } from '../../controllers/admin/adminPaymentController.js';

const router = express.Router();

router.get('/', getPaymentHistory);

export default router;
