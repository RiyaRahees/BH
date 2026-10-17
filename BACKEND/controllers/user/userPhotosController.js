import pool from '../../config/db.js';
import fs from 'fs';
import path from 'path';

export const getUserPhotos = async (req, res) => {
  const { profileId } = req.params;
  try {
    const [users] = await pool.query(
      `SELECT photo_1, photo_1_status, 
              photo_2, photo_2_status, 
              photo_3, photo_3_status, 
              photo_4, photo_4_status, 
              photo_rejection_reason 
       FROM user_registration 
       WHERE LOWER(profile_id) = LOWER(?)`,
      [profileId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    res.status(200).json({
      photos: {
        photo_1: user.photo_1 || '',
        photo_2: user.photo_2 || '',
        photo_3: user.photo_3 || '',
        photo_4: user.photo_4 || ''
      },
      statuses: {
        photo_1: user.photo_1_status || 'APPROVED',
        photo_2: user.photo_2_status || 'APPROVED',
        photo_3: user.photo_3_status || 'APPROVED',
        photo_4: user.photo_4_status || 'APPROVED'
      },
      rejectionReason: user.photo_rejection_reason || null
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Server error fetching photos' });
  }
};

const deleteOldPhotoFile = (oldUrl) => {
  if (oldUrl && oldUrl.includes('/uploads/')) {
    try {
      const filename = oldUrl.split('/uploads/')[1];
      const filepath = path.resolve(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (err) {
      console.error('Failed to delete old photo file:', err);
    }
  }
};

export const uploadUserPhoto = async (req, res) => {
  const { profileId } = req.params;
  const { slot } = req.body; // e.g. "photo_1", "photo_2"

  if (!['photo_1', 'photo_2', 'photo_3', 'photo_4'].includes(slot)) {
    return res.status(400).json({ error: 'Invalid photo slot' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // 1. Check for existing photo to delete it
    const [existing] = await pool.query(
      `SELECT ${slot} FROM user_registration WHERE LOWER(profile_id) = LOWER(?)`,
      [profileId]
    );
    const oldUrl = existing.length > 0 ? existing[0][slot] : null;

    // 2. Generate the URL for the frontend to access
    const protocol = req.protocol;
    const host = req.get('host');
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const defaultBaseUrl = isLocal ? `${protocol}://${host}` : `${protocol}://${host}/api`;
    
    let baseUrl = process.env.BACKEND_URL;
    if (!baseUrl || (baseUrl.includes('localhost') && !isLocal)) {
      baseUrl = defaultBaseUrl;
    }
    
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // 3. Update the database with PENDING status for admin review
    const statusCol = `${slot}_status`;
    await pool.query(
      `UPDATE user_registration SET ${slot} = ?, ${statusCol} = 'PENDING' WHERE LOWER(profile_id) = LOWER(?)`,
      [photoUrl, profileId]
    );

    // 4. Delete the old file from the system if it exists
    deleteOldPhotoFile(oldUrl);

    res.status(200).json({
      message: 'Photo uploaded successfully and submitted for admin review.',
      photoUrl,
      slot,
      status: 'PENDING'
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Server error uploading photo' });
  }
};

export const deleteUserPhoto = async (req, res) => {
  const { profileId, slot } = req.params;

  if (!['photo_1', 'photo_2', 'photo_3', 'photo_4'].includes(slot)) {
    return res.status(400).json({ error: 'Invalid photo slot' });
  }

  try {
    // 1. Fetch the existing URL so we can delete the file
    const [existing] = await pool.query(
      `SELECT ${slot} FROM user_registration WHERE LOWER(profile_id) = LOWER(?)`,
      [profileId]
    );
    const oldUrl = existing.length > 0 ? existing[0][slot] : null;

    // 2. Set the column to NULL and status to APPROVED
    const statusCol = `${slot}_status`;
    await pool.query(
      `UPDATE user_registration SET ${slot} = NULL, ${statusCol} = 'APPROVED' WHERE LOWER(profile_id) = LOWER(?)`,
      [profileId]
    );

    // 3. Delete the file from the system
    deleteOldPhotoFile(oldUrl);

    res.status(200).json({
      message: 'Photo deleted successfully',
      slot,
      status: 'APPROVED'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Server error deleting photo' });
  }
};

export const swapUserPhotos = async (req, res) => {
  const { profileId } = req.params;
  const { slot1, slot2 } = req.body;

  if (!['photo_1', 'photo_2', 'photo_3', 'photo_4'].includes(slot1) || 
      !['photo_1', 'photo_2', 'photo_3', 'photo_4'].includes(slot2)) {
    return res.status(400).json({ error: 'Invalid photo slot' });
  }

  try {
    const status1Col = `${slot1}_status`;
    const status2Col = `${slot2}_status`;

    const [existing] = await pool.query(
      `SELECT ${slot1}, ${status1Col}, ${slot2}, ${status2Col} FROM user_registration WHERE LOWER(profile_id) = LOWER(?)`,
      [profileId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const val1 = existing[0][slot1];
    const stat1 = existing[0][status1Col] || 'APPROVED';
    const val2 = existing[0][slot2];
    const stat2 = existing[0][status2Col] || 'APPROVED';

    // If one of the slots is photo_1 (Primary), ensure the photo becoming Primary is approved!
    if (slot1 === 'photo_1' && val2 && stat2 !== 'APPROVED') {
      return res.status(400).json({ 
        error: stat2 === 'REJECTED' 
          ? 'Rejected photos cannot be set as your primary profile photo.' 
          : 'Photos under review cannot be set as primary until approved.' 
      });
    }
    if (slot2 === 'photo_1' && val1 && stat1 !== 'APPROVED') {
      return res.status(400).json({ 
        error: stat1 === 'REJECTED' 
          ? 'Rejected photos cannot be set as your primary profile photo.' 
          : 'Photos under review cannot be set as primary until approved.' 
      });
    }

    await pool.query(
      `UPDATE user_registration SET ${slot1} = ?, ${status1Col} = ?, ${slot2} = ?, ${status2Col} = ? WHERE LOWER(profile_id) = LOWER(?)`,
      [val2, stat2, val1, stat1, profileId]
    );

    res.status(200).json({
      message: 'Photos swapped successfully'
    });
  } catch (error) {
    console.error('Error swapping photos:', error);
    res.status(500).json({ error: 'Server error swapping photos' });
  }
};
