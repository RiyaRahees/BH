import express from 'express';
import {
  getAdminMarriageRequests,
  toggleFeaturedForAds,
  deleteAdminMarriageRequest
} from '../../controllers/admin/marriageRequestAdminController.js';

const router = express.Router();

// GET /api/admin/marriage-requests
router.get('/', getAdminMarriageRequests);

// PATCH /api/admin/marriage-requests/:id/featured-ads
router.patch('/:id/featured-ads', toggleFeaturedForAds);

// DELETE /api/admin/marriage-requests/:id
router.delete('/:id', deleteAdminMarriageRequest);

export default router;
