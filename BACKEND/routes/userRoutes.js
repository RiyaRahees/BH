import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getUserDetailsByProfileId, 
  updateUserDetailsByProfileId,
  getRecommendedProfiles,
  searchProfiles
} from '../controllers/user/userDetailsController.js';
import { 
  getPlanetaryPositions, 
  updatePlanetaryPositions 
} from '../controllers/user/planetaryPositionsController.js';
import { 
  getUserPhotos, 
  uploadUserPhoto, 
  deleteUserPhoto 
} from '../controllers/user/userPhotosController.js';
import { 
  addFavourite, 
  removeFavourite, 
  checkFavouriteStatus, 
  getFavourites 
} from '../controllers/user/favouriteController.js';
import { 
  getPartnerPreferences, 
  updatePartnerPreferences 
} from '../controllers/user/partnerPreferenceController.js';
import { 
  updateUserSettings, 
  resetPassword 
} from '../controllers/user/accountSettingsController.js';
import { 
  getProfileCompletion 
} from '../controllers/user/profileCompletionController.js';
import { verifyUserSession } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply the middleware to all user routes to ensure they are logged in
router.use(verifyUserSession);

// Multer config for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.profileId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET /api/users/recommendations
router.get('/recommendations', getRecommendedProfiles);

// GET /api/users/search
router.get('/search', searchProfiles);

// GET /api/users/profile/:profileId
router.get('/profile/:profileId', getUserDetailsByProfileId);

// PUT /api/users/profile/:profileId
router.put('/profile/:profileId', updateUserDetailsByProfileId);

// GET /api/users/profile/:profileId/planetary-positions
router.get('/profile/:profileId/planetary-positions', getPlanetaryPositions);

// PUT /api/users/profile/:profileId/planetary-positions
router.put('/profile/:profileId/planetary-positions', updatePlanetaryPositions);

// GET /api/users/profile/:profileId/photos
router.get('/profile/:profileId/photos', getUserPhotos);

// POST /api/users/profile/:profileId/photos
router.post('/profile/:profileId/photos', upload.single('photo'), uploadUserPhoto);

// DELETE /api/users/profile/:profileId/photos/:slot
router.delete('/profile/:profileId/photos/:slot', deleteUserPhoto);

// GET /api/users/favourites
router.get('/favourites', getFavourites);

// POST /api/users/profile/:profileId/favourites
router.post('/profile/:profileId/favourites', addFavourite);

// DELETE /api/users/profile/:profileId/favourites
router.delete('/profile/:profileId/favourites', removeFavourite);

// GET /api/users/profile/:profileId/favourites/status
router.get('/profile/:profileId/favourites/status', checkFavouriteStatus);

// GET /api/users/profile/:profileId/partner-preferences
router.get('/profile/:profileId/partner-preferences', getPartnerPreferences);

// PUT /api/users/profile/:profileId/partner-preferences
router.put('/profile/:profileId/partner-preferences', updatePartnerPreferences);

// PUT /api/users/profile/:profileId/settings
router.put('/profile/:profileId/settings', updateUserSettings);

// PUT /api/users/profile/:profileId/reset-password
router.put('/profile/:profileId/reset-password', resetPassword);

// GET /api/users/profile/:profileId/completion
router.get('/profile/:profileId/completion', getProfileCompletion);

export default router;
