import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  updateUserSettings, 
  resetPassword,
  toggleAccountStatus,
  requestAccountDeletion,
  lookupPartner,
  getMarriageConfirmationRequests,
  respondToMarriageConfirmation
} from '../../controllers/user/accountSettingsController.js';

const router = express.Router({ mergeParams: true });

// Multer config for couple photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'couple-' + (req.params.profileId || 'unknown') + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET /api/users/lookup-partner?query=...
router.get('/lookup-partner', lookupPartner);

// GET /api/users/marriage-confirmation-requests
router.get('/marriage-confirmation-requests', getMarriageConfirmationRequests);

// POST /api/users/marriage-confirmation-requests/:requestId/respond
router.post('/marriage-confirmation-requests/:requestId/respond', respondToMarriageConfirmation);

// PUT /api/users/profile/:profileId/settings
router.put('/profile/:profileId/settings', updateUserSettings);

// PUT /api/users/profile/:profileId/reset-password
router.put('/profile/:profileId/reset-password', resetPassword);

// PUT /api/users/profile/:profileId/status
router.put('/profile/:profileId/status', upload.array('couplePhotos', 2), toggleAccountStatus);

// PUT /api/users/profile/:profileId/delete-request
router.put('/profile/:profileId/delete-request', upload.array('couplePhotos', 2), requestAccountDeletion);

export default router;
