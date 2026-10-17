import express from 'express';
import {
  sendInterest,
  respondInterest,
  checkInterestStatus,
  getInterests,
  deleteInterest
} from '../../controllers/user/interestController.js';

const router = express.Router({ mergeParams: true });

// GET /api/users/interests - List interests (received, sent, accepted)
router.get('/interests', getInterests);

// POST /api/users/interests/respond - Accept (return interest) or decline
router.post('/interests/respond', respondInterest);

// POST /api/users/profile/:profileId/interests - Send or Return Interest to profile
router.post('/profile/:profileId/interests', sendInterest);

// GET /api/users/profile/:profileId/interests/status - Check interest status with profile
router.get('/profile/:profileId/interests/status', checkInterestStatus);

// DELETE /api/users/interests/:interestId - Delete interest
router.delete('/interests/:interestId', deleteInterest);

export default router;
