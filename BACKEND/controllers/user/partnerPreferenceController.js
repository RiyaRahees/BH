import pool from '../../config/db.js';

export const getPartnerPreferences = async (req, res) => {
  const { profileId } = req.params;
  
  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }
    
    // Fetch user's gender
    const [userRows] = await pool.query(
      'SELECT gender, full_name, religion FROM user_registration WHERE LOWER(profile_id) = LOWER(?)',
      [profileId]
    );

    const userGender = userRows.length > 0 ? userRows[0].gender : null;
    const isMale = userGender && ['male', 'groom', 'man'].includes(String(userGender).trim().toLowerCase());
    const minAllowedAge = isMale ? 18 : 20;
    const partnerRole = isMale ? 'Bride' : 'Groom';

    const [preferences] = await pool.query(
      'SELECT * FROM partner_preference WHERE profile_id = ?',
      [profileId]
    );
    
    let prefData = preferences.length > 0 ? preferences[0] : null;

    res.status(200).json({
      message: 'Partner preferences fetched successfully',
      preferences: prefData,
      user_gender: userGender,
      min_allowed_age: minAllowedAge,
      partner_type: partnerRole
    });
  } catch (error) {
     console.error('Error fetching partner preferences:', error);
     res.status(500).json({ error: 'Server error while fetching partner preferences' });
  }
};

export const updatePartnerPreferences = async (req, res) => {
  const { profileId } = req.params;
  const updateData = req.body;

  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    // Fetch user gender to enforce legal and configured minimum age limits
    const [userRows] = await pool.query(
      'SELECT gender FROM user_registration WHERE LOWER(profile_id) = LOWER(?)',
      [profileId]
    );

    const userGender = userRows.length > 0 ? userRows[0].gender : null;
    const isMale = userGender && ['male', 'groom', 'man'].includes(String(userGender).trim().toLowerCase());
    const minAllowedAge = isMale ? 18 : 20; // Male user seeks Bride (min 18); Female user seeks Groom (min 20)
    const partnerRole = isMale ? 'Bride' : 'Groom';

    let minAge = updateData.min_age !== undefined && updateData.min_age !== '' && updateData.min_age !== null 
      ? parseInt(updateData.min_age, 10) 
      : null;
    let maxAge = updateData.max_age !== undefined && updateData.max_age !== '' && updateData.max_age !== null 
      ? parseInt(updateData.max_age, 10) 
      : null;

    if (minAge !== null && !isNaN(minAge)) {
      if (minAge < minAllowedAge) {
        return res.status(400).json({ 
          error: `Minimum age preference for ${partnerRole} cannot be less than ${minAllowedAge} years.` 
        });
      }
    }

    if (maxAge !== null && !isNaN(maxAge) && minAge !== null && !isNaN(minAge) && maxAge < minAge) {
      return res.status(400).json({
        error: `Maximum age cannot be less than Minimum age (${minAge} years).`
      });
    }

    const {
      min_height,
      max_height,
      marital_status,
      mother_tongue,
      religion,
      caste,
      education_level,
      preferred_professions,
      location_preferences
    } = updateData;

    // Check if preferences already exist
    const [existing] = await pool.query(
      'SELECT id FROM partner_preference WHERE profile_id = ?',
      [profileId]
    );

    if (existing.length > 0) {
      // Update
      const updateQuery = `
        UPDATE partner_preference 
        SET 
          min_age = ?, 
          max_age = ?, 
          min_height = ?, 
          max_height = ?, 
          marital_status = ?, 
          mother_tongue = ?, 
          religion = ?, 
          caste = ?, 
          education_level = ?, 
          preferred_professions = ?, 
          location_preferences = ?
        WHERE profile_id = ?
      `;
      await pool.query(updateQuery, [
        minAge || null,
        maxAge || null,
        min_height || null,
        max_height || null,
        marital_status || null,
        mother_tongue || null,
        religion || null,
        caste || null,
        education_level || null,
        preferred_professions || null,
        location_preferences || null,
        profileId
      ]);
    } else {
      // Insert
      const insertQuery = `
        INSERT INTO partner_preference (
          profile_id, 
          min_age, 
          max_age, 
          min_height, 
          max_height, 
          marital_status, 
          mother_tongue, 
          religion, 
          caste, 
          education_level, 
          preferred_professions, 
          location_preferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.query(insertQuery, [
        profileId,
        minAge || null,
        maxAge || null,
        min_height || null,
        max_height || null,
        marital_status || null,
        mother_tongue || null,
        religion || null,
        caste || null,
        education_level || null,
        preferred_professions || null,
        location_preferences || null
      ]);
    }

    res.status(200).json({ message: 'Partner preferences updated successfully' });
  } catch (error) {
    console.error('Error updating partner preferences:', error);
    res.status(500).json({ error: 'Server error while updating partner preferences' });
  }
};
