import pool from '../config/db.js';

async function fixPhotos() {
  try {
    console.log('Fixing photo_1 paths in user_registration...');

    // 1. Convert female profiles with male photo URLs to female photo URLs
    const [femaleRows] = await pool.query("SELECT id, profile_id, photo_1 FROM user_registration WHERE gender = 'Female' AND photo_1 LIKE '%indian_male_%'");
    for (const u of femaleRows) {
      const newPhoto = u.photo_1.replace('indian_male_', 'indian_female_');
      await pool.query('UPDATE user_registration SET photo_1 = ? WHERE id = ?', [newPhoto, u.id]);
      console.log(`Updated female profile ${u.profile_id} photo to ${newPhoto}`);
    }

    // 2. Convert male profiles with female photo URLs to male photo URLs
    const [maleRows] = await pool.query("SELECT id, profile_id, photo_1 FROM user_registration WHERE gender = 'Male' AND photo_1 LIKE '%indian_female_%'");
    for (const u of maleRows) {
      const newPhoto = u.photo_1.replace('indian_female_', 'indian_male_');
      await pool.query('UPDATE user_registration SET photo_1 = ? WHERE id = ?', [newPhoto, u.id]);
      console.log(`Updated male profile ${u.profile_id} photo to ${newPhoto}`);
    }

    console.log('Photo paths fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to fix photos:', err);
    process.exit(1);
  }
}

fixPhotos();
