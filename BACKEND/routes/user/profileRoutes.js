import express from 'express';
import { 
  getUserDetailsByProfileId, 
  updateUserDetailsByProfileId,
  getRecommendedProfiles,
  getDailyRecommendations,
  getHighlightedProfiles,
  getTopMatches,
  searchProfiles,
  claimFreeTrial
} from '../../controllers/user/userDetailsController.js';
import { submitReport, getMyReports, respondToReport, withdrawReport } from '../../controllers/user/profileReportController.js';
import { verifyUserSession, optionalUserAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// GET /api/users/my-reports — Get reports against current user & submitted by user
router.get('/my-reports', verifyUserSession, getMyReports);

// POST /api/users/my-reports/:reportId/appeal — Appeal or accept a report
router.post('/my-reports/:reportId/appeal', verifyUserSession, respondToReport);

// DELETE /api/users/my-reports/:reportId/withdraw — Withdraw a submitted report
router.delete('/my-reports/:reportId/withdraw', verifyUserSession, withdrawReport);

// POST /api/users/claim-free-trial — Claim 365-Day Free Trial
router.post('/claim-free-trial', verifyUserSession, claimFreeTrial);

// GET /api/users/highlighted-profiles — interleaved male and female profiles for Home landing page
router.get('/highlighted-profiles', optionalUserAuth, getHighlightedProfiles);
router.get('/recommendations', optionalUserAuth, getHighlightedProfiles);

// GET /api/users/daily-recommendations — newest & highest plan users first
router.get('/daily-recommendations', optionalUserAuth, getDailyRecommendations);

// GET /api/users/top-matches — based on partner preferences, religion & caste matching
router.get('/top-matches', optionalUserAuth, getTopMatches);

// GET /api/users/search
router.get('/search', optionalUserAuth, searchProfiles);

// GET /api/users/profile/:profileId
router.get('/profile/:profileId', optionalUserAuth, getUserDetailsByProfileId);

// PUT /api/users/profile/:profileId
router.put('/profile/:profileId', verifyUserSession, updateUserDetailsByProfileId);

// POST /api/users/profile/:profileId/report
router.post('/profile/:profileId/report', verifyUserSession, submitReport);

export default router;
