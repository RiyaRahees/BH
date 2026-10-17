import express from 'express';
import { 
  getPlanetaryPositions, 
  updatePlanetaryPositions 
} from '../../controllers/user/planetaryPositionsController.js';

const router = express.Router({ mergeParams: true });

// GET /api/users/profile/:profileId/planetary-positions
router.get('/profile/:profileId/planetary-positions', getPlanetaryPositions);

// PUT /api/users/profile/:profileId/planetary-positions
router.put('/profile/:profileId/planetary-positions', updatePlanetaryPositions);

export default router;
