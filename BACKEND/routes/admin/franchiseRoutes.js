import express from 'express';
import {
  createFranchise,
  getAllFranchises,
  getFranchiseById,
  getFranchiseUsers,
  updateFranchise,
  updateFranchisePincodes,
  deleteFranchise,
  getAllFranchiseReports,
  createFranchiseReport,
  deleteFranchiseReport
} from '../../controllers/admin/franchiseController.js';

const router = express.Router();

// Franchise Reports (Placed before /:franchise_id parameter route)
router.get('/reports', getAllFranchiseReports);
router.post('/reports', createFranchiseReport);
router.delete('/reports/:id', deleteFranchiseReport);

router.post('/', createFranchise);
router.get('/', getAllFranchises);
router.get('/:franchise_id', getFranchiseById);
router.get('/:franchise_id/users', getFranchiseUsers);
router.get('/:franchise_id/customers', getFranchiseUsers);
router.put('/:franchise_id', updateFranchise);
router.patch('/:franchise_id/pincodes', updateFranchisePincodes);
router.delete('/:franchise_id', deleteFranchise);

export default router;
