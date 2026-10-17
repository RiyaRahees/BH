import express from 'express';
import { 
  getPartnerPreferences, 
  updatePartnerPreferences 
} from '../../controllers/user/partnerPreferenceController.js';

const router = express.Router({ mergeParams: true });

// GET /api/users/profile/:profileId/partner-preferences
router.get('/profile/:profileId/partner-preferences', getPartnerPreferences);

// PUT /api/users/profile/:profileId/partner-preferences
router.put('/profile/:profileId/partner-preferences', updatePartnerPreferences);

export default router;
