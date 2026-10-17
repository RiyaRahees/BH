import express from 'express';
import { 
  getProfileCompletion 
} from '../../controllers/user/profileCompletionController.js';

const router = express.Router({ mergeParams: true });

// GET /api/users/profile/:profileId/completion
router.get('/profile/:profileId/completion', getProfileCompletion);

export default router;
