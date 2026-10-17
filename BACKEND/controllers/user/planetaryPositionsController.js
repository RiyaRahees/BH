import pool from '../../config/db.js';

const ensurePlanetaryPositionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS planetary_positions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        profile_id VARCHAR(20) NOT NULL,
        chart_type VARCHAR(50) NOT NULL,
        planet_name VARCHAR(50) NOT NULL,
        house_number INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_profile (profile_id),
        INDEX idx_matching_search (chart_type, planet_name, house_number)
      )
    `);
  } catch (tErr) {
    console.warn('[Planetary Positions Table Warning]:', tErr.message);
  }
};

export const getPlanetaryPositions = async (req, res) => {
  const { profileId } = req.params;
  
  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    await ensurePlanetaryPositionsTable();
    
    const [positions] = await pool.query(
      'SELECT chart_type, planet_name, house_number FROM planetary_positions WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?))',
      [profileId]
    );
    
    res.status(200).json({
      message: 'Planetary positions fetched successfully',
      positions: positions || []
    });
  } catch (error) {
     console.error('Error fetching planetary positions:', error);
     res.status(200).json({ message: 'Planetary positions fetched', positions: [] });
  }
};

export const updatePlanetaryPositions = async (req, res) => {
  const { profileId } = req.params;
  const { positions } = req.body;

  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    if (!Array.isArray(positions)) {
      return res.status(400).json({ error: 'Positions must be an array' });
    }

    await ensurePlanetaryPositionsTable();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('DELETE FROM planetary_positions WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?))', [profileId]);

      if (positions.length > 0) {
        const insertQuery = `
          INSERT INTO planetary_positions (profile_id, chart_type, planet_name, house_number) 
          VALUES ?
        `;
        const values = positions.map(pos => [
          profileId,
          pos.chart_type,
          pos.planet_name,
          pos.house_number
        ]);
        
        await connection.query(insertQuery, [values]);
      }

      await connection.commit();
      res.status(200).json({ message: 'Planetary positions updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating planetary positions:', error);
    // Don't crash with 500 if it was an empty/optional astrology update
    res.status(200).json({ warning: 'Could not update planetary positions', error: error.message });
  }
};
