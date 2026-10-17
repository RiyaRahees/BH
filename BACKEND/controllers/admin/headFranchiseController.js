import pool from '../../config/db.js';
import { parsePinCodes } from '../../utils/franchiseAssignmentUtils.js';

// Helper to map pincode / profileId to accurate Kerala district
const getKeralaDistrictFromPincode = (pincode, profileId) => {
  const clean = String(pincode || '').trim();
  const prefix3 = clean.substring(0, 3);
  const prefix4 = clean.substring(0, 4);
  
  if (prefix4 === '6735' || prefix4 === '6731') return 'Wayanad';
  const map = {
    '695': 'Thiruvananthapuram',
    '691': 'Kollam',
    '689': 'Pathanamthitta',
    '688': 'Alappuzha',
    '686': 'Kottayam',
    '685': 'Idukki',
    '682': 'Ernakulam',
    '683': 'Ernakulam',
    '684': 'Ernakulam',
    '680': 'Thrissur',
    '678': 'Palakkad',
    '679': 'Palakkad',
    '676': 'Malappuram',
    '673': 'Kozhikode',
    '670': 'Kannur',
    '671': 'Kasaragod',
    '675': 'Wayanad'
  };
  if (map[prefix3]) return map[prefix3];

  // Fallback from profileId prefix (e.g. BKLH01... -> 01 = Thiruvananthapuram)
  if (profileId && profileId.length >= 6) {
    const code = profileId.substring(4, 6);
    const codeMap = {
      '01': 'Thiruvananthapuram',
      '02': 'Kollam',
      '03': 'Pathanamthitta',
      '04': 'Alappuzha',
      '05': 'Kottayam',
      '06': 'Idukki',
      '07': 'Ernakulam',
      '08': 'Thrissur',
      '09': 'Palakkad',
      '10': 'Malappuram',
      '11': 'Kozhikode',
      '12': 'Wayanad',
      '13': 'Kannur',
      '14': 'Kasaragod'
    };
    if (codeMap[code]) return codeMap[code];
  }

  return 'Kozhikode';
};

const cleanDistrictName = (raw, pincode, profileId) => {
  if (!raw || typeof raw !== 'string') return getKeralaDistrictFromPincode(pincode, profileId);
  let cleaned = raw.replace(/^(\d+[\s\-_:]*)/, '').trim();
  if (!cleaned || cleaned.toLowerCase() === 'kerala' || cleaned.toLowerCase() === 'n/a' || cleaned.toLowerCase() === 'other') {
    return getKeralaDistrictFromPincode(pincode, profileId);
  }
  return cleaned;
};

// Get all unassigned users for Pincode Allocation
export const getRequests = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    // 1. Fetch all active franchises and map their pincodes
    const [activeFranchises] = await pool.query(
      `SELECT id, franchise_id, pin_codes FROM bm_franchise WHERE LOWER(status) = 'active'`
    );

    const activePincodeMap = new Map(); // pincode -> franchise_id
    const assignedPincodesSet = new Set();
    const activeFranchiseIdsSet = new Set();

    activeFranchises.forEach(f => {
      const fId = String(f.franchise_id || '').trim();
      const numId = String(f.id || '').trim();
      if (fId) activeFranchiseIdsSet.add(fId.toLowerCase());
      if (numId) activeFranchiseIdsSet.add(numId.toLowerCase());
      
      const pins = parsePinCodes(f.pin_codes);
      pins.forEach(pc => {
        if (pc) {
          assignedPincodesSet.add(pc);
          if (fId && !activePincodeMap.has(pc)) {
            activePincodeMap.set(pc, f.franchise_id);
          }
        }
      });
    });

    // 2. Fetch all registered users
    const query = `
      SELECT 
        ur.id, ur.profile_id, ur.full_name, ur.gender, ur.mobile_number, ur.email_address,
        ur.photo_1, ur.status as user_status, ur.account_status, ur.assigned_franchise_id,
        DATE_FORMAT(ur.created_at, '%d-%m-%Y') as registeredOn,
        COALESCE(hd.pincode, cr.pincode, ms.pincode, ot.pincode) as userPincode,
        COALESCE(hd.district, cr.district, ms.district, ot.district, ur.district) as userDistrict,
        COALESCE(hd.place, cr.place, ms.place, ot.place) as userPlace
      FROM user_registration ur
      LEFT JOIN hindus hd ON ur.profile_id = hd.profile_id
      LEFT JOIN christians cr ON ur.profile_id = cr.profile_id
      LEFT JOIN muslims ms ON ur.profile_id = ms.profile_id
      LEFT JOIN others ot ON ur.profile_id = ot.profile_id
      WHERE (ur.account_status IS NULL OR ur.account_status != 'Banned')
      ORDER BY ur.created_at DESC
    `;

    const [rows] = await pool.query(query);

    const trulyUnassignedUsers = [];
    const staleCleanupUpdates = [];

    for (const row of rows) {
      const pin = row.userPincode ? String(row.userPincode).trim() : '';
      const assignedId = row.assigned_franchise_id ? String(row.assigned_franchise_id).trim() : '';

      // Check if user is covered by ANY active franchise's territory pincodes
      const isPincodeCovered = pin && assignedPincodesSet.has(pin);

      // Check if user is assigned to an active franchise
      const isDirectlyAssigned = assignedId && activeFranchiseIdsSet.has(assignedId.toLowerCase());

      if (isPincodeCovered || isDirectlyAssigned) {
        // Covered by active franchise territory or directly assigned - do not show in unassigned list
        continue;
      }

      if (assignedId && !activeFranchiseIdsSet.has(assignedId.toLowerCase())) {
        // Assigned franchise is no longer active or deleted - clean up stale assignment
        staleCleanupUpdates.push(row.profile_id);
      }

      // If we reach here, user is truly unassigned!
      const resolvedDistrict = cleanDistrictName(row.userDistrict, pin, row.profile_id);
      const resolvedPlace = row.userPlace ? row.userPlace.trim() : '';
      let location = resolvedDistrict;
      if (resolvedPlace && resolvedPlace.toLowerCase() !== resolvedDistrict.toLowerCase()) {
        location = resolvedDistrict ? `${resolvedDistrict}` : resolvedPlace;
      }

      const defaultAvatar = row.gender === 'Female' 
        ? 'https://www.w3schools.com/howto/img_avatar2.png' 
        : 'https://www.w3schools.com/howto/img_avatar.png';

      trulyUnassignedUsers.push({
        id: row.profile_id,
        requestId: row.profile_id,
        userId: row.profile_id,
        profile_id: row.profile_id,
        name: row.full_name,
        userName: row.full_name,
        gender: row.gender,
        email: row.email_address,
        phone: row.mobile_number,
        pincode: pin || 'N/A',
        district: resolvedDistrict,
        place: resolvedPlace,
        location: location || 'Kerala',
        registeredOn: row.registeredOn,
        image: row.photo_1 || defaultAvatar,
        status: 'Active',
        assignedTo: null
      });
    }

    // Run stale cleanup updates asynchronously
    if (staleCleanupUpdates.length > 0) {
      (async () => {
        for (const pid of staleCleanupUpdates) {
          try {
            await pool.query(
              `UPDATE user_registration SET assigned_franchise_id = NULL WHERE profile_id = ?`,
              [pid]
            );
          } catch (err) {
            console.error('Error clearing stale assignment in getRequests:', err);
          }
        }
      })();
    }

    // Apply search filter if provided
    let filteredUsers = trulyUnassignedUsers;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredUsers = trulyUnassignedUsers.filter(u => 
        (u.userId && u.userId.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.pincode && u.pincode.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.place && u.place.toLowerCase().includes(q))
      );
    }

    const total = filteredUsers.length;

    // Handle pagination if requested
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;
      const paginated = filteredUsers.slice(offset, offset + limitNum);

      return res.status(200).json({
        users: paginated,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum
      });
    }

    // Default: return users array directly with total property attached or as array
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error fetching unassigned users for pincode allocation:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned users' });
  }
};

// Assign a user manually to an active franchise
export const assignRequest = async (req, res) => {
  try {
    const { request_id, user_id, profile_id, franchise_id } = req.body;

    const targetProfileId = profile_id || user_id || request_id;

    if (!targetProfileId || !franchise_id) {
      return res.status(400).json({ error: 'User ID and Franchise ID are required.' });
    }

    // 1. Verify User exists and is not already assigned
    const [userRows] = await pool.query(
      `SELECT id, profile_id, full_name, assigned_franchise_id 
       FROM user_registration 
       WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?)) OR id = ?
       LIMIT 1`,
      [targetProfileId, targetProfileId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found in system.' });
    }

    const user = userRows[0];

    // Duplicate Protection: check if user is already assigned
    if (user.assigned_franchise_id && user.assigned_franchise_id.trim() !== '') {
      return res.status(400).json({ 
        error: `User is already assigned to franchise (${user.assigned_franchise_id}).` 
      });
    }

    // 2. Verify Franchise exists and is ACTIVE
    const [franchiseRows] = await pool.query(
      `SELECT id, franchise_id, name, status 
       FROM bm_franchise 
       WHERE LOWER(TRIM(franchise_id)) = LOWER(TRIM(?)) OR id = ?
       LIMIT 1`,
      [franchise_id, franchise_id]
    );

    if (franchiseRows.length === 0) {
      return res.status(404).json({ error: 'Franchise not found.' });
    }

    const franchise = franchiseRows[0];

    if (!franchise.status || franchise.status.toLowerCase() !== 'active') {
      return res.status(400).json({ 
        error: 'The selected franchise is inactive. Please choose an active franchise.' 
      });
    }

    // 3. Assign User to Franchise
    const targetAssignedCode = franchise.franchise_id || String(franchise.id);
    await pool.query(
      `UPDATE user_registration SET assigned_franchise_id = ? WHERE profile_id = ?`,
      [targetAssignedCode, user.profile_id]
    );

    // Clean up legacy requests table if any
    await pool.query(
      `DELETE FROM bm_head_franchise_requests WHERE profile_id = ?`,
      [user.profile_id]
    ).catch(() => {});

    res.status(200).json({ 
      message: `User ${user.full_name} (${user.profile_id}) successfully assigned to ${franchise.name}.`,
      success: true,
      profile_id: user.profile_id,
      franchise_id: targetAssignedCode
    });
  } catch (error) {
    console.error('Error assigning user to franchise:', error);
    res.status(500).json({ error: 'Failed to assign user to franchise. Please try again.' });
  }
};

// Get all active franchises (for the assign modal dropdown)
export const getActiveFranchises = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, franchise_id, name, location, owner, mobile_number, email 
       FROM bm_franchise 
       WHERE LOWER(status) = 'active' 
       ORDER BY name ASC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching active franchises:', error);
    res.status(500).json({ error: 'Failed to fetch active franchises.' });
  }
};
