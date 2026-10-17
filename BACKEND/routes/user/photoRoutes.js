import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getUserPhotos, 
  uploadUserPhoto, 
  deleteUserPhoto,
  swapUserPhotos
} from '../../controllers/user/userPhotosController.js';

const router = express.Router({ mergeParams: true });

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

// GET /api/users/profile/:profileId/photos
router.get('/profile/:profileId/photos', getUserPhotos);

// PUT /api/users/profile/:profileId/photos/swap
router.put('/profile/:profileId/photos/swap', swapUserPhotos);

// POST /api/users/profile/:profileId/photos
router.post('/profile/:profileId/photos', upload.single('photo'), uploadUserPhoto);

// DELETE /api/users/profile/:profileId/photos/:slot
router.delete('/profile/:profileId/photos/:slot', deleteUserPhoto);

export default router;
