import pool from '../../config/db.js';

// Get all castes (Public / User / Admin)
export const getCastes = async (req, res) => {
  try {
    const { religion } = req.query;
    let query = 'SELECT id, religion, caste_name, created_at FROM bm_castes';
    const params = [];

    if (religion && religion !== 'All') {
      query += ' WHERE religion = ?';
      params.push(religion);
    }

    query += ' ORDER BY religion ASC, caste_name ASC';

    const [castes] = await pool.query(query, params);
    res.status(200).json({ castes });
  } catch (error) {
    console.error('Error fetching castes:', error);
    res.status(500).json({ error: 'Failed to fetch castes' });
  }
};

// Add a new caste (Super Admin)
export const addCaste = async (req, res) => {
  try {
    const { religion, caste_name } = req.body;

    if (!religion || !caste_name || !caste_name.trim()) {
      return res.status(400).json({ error: 'Religion and caste name are required' });
    }

    const cleanName = caste_name.trim();

    // Check if duplicate
    const [existing] = await pool.query(
      'SELECT id FROM bm_castes WHERE religion = ? AND LOWER(caste_name) = LOWER(?)',
      [religion, cleanName]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: `Caste '${cleanName}' already exists for ${religion}` });
    }

    const [result] = await pool.query(
      'INSERT INTO bm_castes (religion, caste_name) VALUES (?, ?)',
      [religion, cleanName]
    );

    res.status(201).json({
      message: 'Caste added successfully',
      caste: {
        id: result.insertId,
        religion,
        caste_name: cleanName
      }
    });
  } catch (error) {
    console.error('Error adding caste:', error);
    res.status(500).json({ error: 'Failed to add caste' });
  }
};

// Delete a caste (Super Admin)
export const deleteCaste = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM bm_castes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Caste not found' });
    }

    res.status(200).json({ message: 'Caste deleted successfully' });
  } catch (error) {
    console.error('Error deleting caste:', error);
    res.status(500).json({ error: 'Failed to delete caste' });
  }
};
