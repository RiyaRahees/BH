import express from 'express';
import { getRequests, assignRequest, getActiveFranchises } from '../../controllers/admin/headFranchiseController.js';

const router = express.Router();

router.get('/requests', getRequests);
router.get('/unassigned-users', getRequests);
router.get('/franchises', getActiveFranchises);
router.post('/assign', assignRequest);

export default router;

