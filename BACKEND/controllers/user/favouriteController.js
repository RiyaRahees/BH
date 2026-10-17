import pool from '../../config/db.js';

export const addFavourite = async (req, res) => {
  const { profileId } = req.params;
  const userId = req.user.id;

  try {
    const [userRows] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [userId]);
    const userProfileId = userRows[0].profile_id;
    // Check if it already exists
    const [existing] = await pool.query(
      'SELECT id FROM user_favourites WHERE user_profile_id = ? AND favourite_profile_id = ?',
      [userProfileId, profileId]
    );

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO user_favourites (user_profile_id, favourite_profile_id) VALUES (?, ?)',
        [userProfileId, profileId]
      );
    }

    res.status(200).json({ message: 'Added to favourites' });
  } catch (error) {
    console.error('Error adding favourite:', error);
    res.status(500).json({ error: 'Failed to add favourite' });
  }
};

export const removeFavourite = async (req, res) => {
  const { profileId } = req.params;
  const userId = req.user.id;

  try {
    const [userRows] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [userId]);
    const userProfileId = userRows[0].profile_id;
    await pool.query(
      'DELETE FROM user_favourites WHERE user_profile_id = ? AND favourite_profile_id = ?',
      [userProfileId, profileId]
    );

    res.status(200).json({ message: 'Removed from favourites' });
  } catch (error) {
    console.error('Error removing favourite:', error);
    res.status(500).json({ error: 'Failed to remove favourite' });
  }
};

export const checkFavouriteStatus = async (req, res) => {
  const { profileId } = req.params;
  const userId = req.user.id;

  try {
    const [userRows] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [userId]);
    const userProfileId = userRows[0].profile_id;
    const [existing] = await pool.query(
      'SELECT id FROM user_favourites WHERE user_profile_id = ? AND favourite_profile_id = ?',
      [userProfileId, profileId]
    );

    res.status(200).json({ isFavourite: existing.length > 0 });
  } catch (error) {
    console.error('Error checking favourite status:', error);
    res.status(500).json({ error: 'Failed to check favourite status' });
  }
};

export const getFavourites = async (req, res) => {
  const userId = req.user.id;

  try {
    const [userRows] = await pool.query('SELECT profile_id FROM user_registration WHERE id = ?', [userId]);
    const userProfileId = userRows[0].profile_id;
    const [favourites] = await pool.query(
      `SELECT 
        uf.favourite_profile_id as id,
        ur.full_name as name,
        IF(ur.photo_1_status = 'APPROVED', ur.photo_1, NULL) as image,
        ur.religion,
        ur.district,
        ur.gender
       FROM user_favourites uf
       JOIN user_registration ur ON uf.favourite_profile_id = ur.profile_id
       WHERE uf.user_profile_id = ?
       ORDER BY uf.created_at DESC`,
      [userProfileId]
    );

    // We also need age, education, occupation which are in community tables...
    // Let's do it simply by mapping and fetching, or just sending what we have
    // Actually we can do a left join to all tables or just query them in a loop since list might not be huge

    const populatedFavourites = [];
    for (let fav of favourites) {
      let communityTable = 'others';
      if (fav.religion === 'Hindu') communityTable = 'hindus';
      else if (fav.religion === 'Muslim') communityTable = 'muslims';
      else if (fav.religion === 'Christian') communityTable = 'christians';

      const [details] = await pool.query(
        `SELECT age, education, profession as role, district as location FROM ${communityTable} WHERE profile_id = ?`,
        [fav.id]
      );

      let finalFav = {
        id: fav.id,
        name: fav.name,
        image: fav.image || (fav.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png'),
        religion: fav.religion,
        gender: fav.gender,
        profession: details.length > 0 ? details[0].role : 'Unknown',
        education: details.length > 0 ? details[0].education : 'Unknown',
        location: details.length > 0 && details[0].location ? details[0].location.split('-')[1]?.trim() || details[0].location : (fav.district || 'Unknown'),
        age: details.length > 0 ? details[0].age : null
      };
      
      populatedFavourites.push(finalFav);
    }

    res.status(200).json({ favourites: populatedFavourites });
  } catch (error) {
    console.error('Error fetching favourites:', error);
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
};
