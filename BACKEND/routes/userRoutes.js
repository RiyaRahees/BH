import express from 'express';
import { verifyUserSession } from '../middlewares/authMiddleware.js';

import profileRoutes from './user/profileRoutes.js';
import planetaryPositionsRoutes from './user/planetaryPositionsRoutes.js';
import photoRoutes from './user/photoRoutes.js';
import favouriteRoutes from './user/favouriteRoutes.js';
import partnerPreferenceRoutes from './user/partnerPreferenceRoutes.js';
import accountSettingsRoutes from './user/accountSettingsRoutes.js';
import profileCompletionRoutes from './user/profileCompletionRoutes.js';
import chatRoutes from './user/chatRoutes.js';
import interestRoutes from './user/interestRoutes.js';

const router = express.Router();

// Mount profile routes BEFORE global auth, because it handles public search/viewing
// Ensure you protect the specific mutable routes inside profileRoutes!
router.use('/', profileRoutes);

// Apply the middleware to all OTHER user routes to ensure they are logged in
router.use(verifyUserSession);
router.use('/', planetaryPositionsRoutes);
router.use('/', photoRoutes);
router.use('/', favouriteRoutes);
router.use('/', partnerPreferenceRoutes);
router.use('/', accountSettingsRoutes);
router.use('/', profileCompletionRoutes);
router.use('/', chatRoutes);
router.use('/', interestRoutes);

export default router;
