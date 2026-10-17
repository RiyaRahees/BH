import express from 'express';
import { 
  addFavourite, 
  removeFavourite, 
  checkFavouriteStatus, 
  getFavourites 
} from '../../controllers/user/favouriteController.js';

const router = express.Router({ mergeParams: true });

// GET /api/users/favourites
router.get('/favourites', getFavourites);

// POST /api/users/profile/:profileId/favourites
router.post('/profile/:profileId/favourites', addFavourite);

// DELETE /api/users/profile/:profileId/favourites
router.delete('/profile/:profileId/favourites', removeFavourite);

// GET /api/users/profile/:profileId/favourites/status
router.get('/profile/:profileId/favourites/status', checkFavouriteStatus);

export default router;
