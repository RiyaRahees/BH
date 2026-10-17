import express from 'express';
import { getCastes, addCaste, deleteCaste } from '../../controllers/admin/casteController.js';

const router = express.Router();

// GET /api/admin/castes - Fetch castes
router.get('/', getCastes);

// POST /api/admin/castes - Add caste
router.post('/', addCaste);

// DELETE /api/admin/castes/:id - Delete caste
router.delete('/:id', deleteCaste);

export default router;
