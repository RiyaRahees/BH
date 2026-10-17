import pool from '../config/db.js';

/**
 * Safely parse pin codes from string/JSON/array
 */
export const parsePinCodes = (pinCodes) => {
  if (!pinCodes) return [];
  if (Array.isArray(pinCodes)) return pinCodes.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof pinCodes === 'string') {
    try {
      const parsed = JSON.parse(pinCodes);
      if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
    } catch {
      return pinCodes.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * Check if a pincode is covered by any active franchise
 * Returns the matching active franchise object or null
 */
export const findActiveFranchiseForPincode = async (pincode) => {
  if (!pincode) return null;
  const cleanPin = String(pincode).trim();
  if (!cleanPin) return null;

  try {
    const [activeFranchises] = await pool.query(
      `SELECT id, franchise_id, name, location, pin_codes, status 
       FROM bm_franchise 
       WHERE LOWER(status) = 'active'`
    );

    for (const f of activeFranchises) {
      const pins = parsePinCodes(f.pin_codes);
      if (pins.includes(cleanPin)) {
        return f;
      }
    }
  } catch (error) {
    console.error('Error finding active franchise for pincode:', error);
  }

  return null;
};
