import pool from '../../config/db.js';
import { getEffectivePlan } from '../../utils/planUtils.js';
import { isOnline } from '../../utils/onlineTracker.js';
import { sendInvoiceEmail } from '../../utils/emailService.js';
import { findActiveFranchiseForPincode, parsePinCodes } from '../../utils/franchiseAssignmentUtils.js';
import * as kollavarshamPkg from 'kollavarsham';

const Kollavarsham = kollavarshamPkg.Kollavarsham || kollavarshamPkg.default;
const kollavarsham = new Kollavarsham();

export const getUserDetailsByProfileId = async (req, res) => {
  const { profileId } = req.params;

  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    // 1. Get base user details and identify religion
    const [users] = await pool.query(
      'SELECT id, profile_id, full_name, plan, is_free_trial_claimed, subscription_start_date, subscription_expiry_date, country_code, mobile_number, email_address, religion, dob, gender, district, created_at, photo_1, photo_1_status, photo_2, photo_2_status, photo_3, photo_3_status, photo_4, photo_4_status, is_online, last_seen, status, account_status FROM user_registration WHERE LOWER(profile_id) = LOWER(?)',
      [profileId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    let matchingTable;

    // Determine the matching table based on religion
    switch (user.religion) {
      case 'Hindu':
        matchingTable = 'hindus';
        break;
      case 'Christian':
        matchingTable = 'christians';
        break;
      case 'Muslim':
        matchingTable = 'muslims';
        break;
      default:
        matchingTable = 'others';
    }

    // 2. Fetch extended details
    let query = `
      SELECT r.*, u.*
      FROM user_registration r
      LEFT JOIN ${matchingTable} u ON LOWER(TRIM(r.profile_id)) = LOWER(TRIM(u.profile_id))
      WHERE LOWER(TRIM(r.profile_id)) = LOWER(TRIM(?))
    `;

    const [rows] = await pool.query(query, [profileId]);
    let profile = rows.length > 0 ? rows[0] : { ...user };

    // Format Malayalam Date of Birth if available
    if (profile.date_of_birth) {
      const d = new Date(profile.date_of_birth);
      if (!isNaN(d.getTime())) {
        const result = kollavarsham.fromGregorianDate(d);
        profile.date_of_birth_malayalam = result.toString ? result.toString() : result.year + ' ' + result.month + ' ' + result.date;
      }
    }
    profile.gender = user.gender || profile.gender;
    
    profile.caste = profile.caste || user.caste || '';

    // Check if requester is owner
    const isOwner = req.user && (req.user.id === user.id || req.user.profile_id?.toLowerCase() === profileId.toLowerCase());

    profile.photo_1_status = user.photo_1_status || 'APPROVED';
    profile.photo_2_status = user.photo_2_status || 'APPROVED';
    profile.photo_3_status = user.photo_3_status || 'APPROVED';
    profile.photo_4_status = user.photo_4_status || 'APPROVED';

    // If not owner, expose valid photos that are not rejected
    if (!isOwner) {
      profile.photo_1 = (user.photo_1_status !== 'REJECTED') ? (profile.photo_1 || profile.photo || profile.image || user.photo_1 || '') : '';
      profile.photo_2 = (user.photo_2_status !== 'REJECTED') ? (profile.photo_2 || user.photo_2 || '') : '';
      profile.photo_3 = (user.photo_3_status !== 'REJECTED') ? (profile.photo_3 || user.photo_3 || '') : '';
      profile.photo_4 = (user.photo_4_status !== 'REJECTED') ? (profile.photo_4 || user.photo_4 || '') : '';
    } else {
      profile.photo_1 = profile.photo_1 || profile.photo || profile.image || user.photo_1 || '';
      profile.photo_2 = profile.photo_2 || user.photo_2 || '';
      profile.photo_3 = profile.photo_3 || user.photo_3 || '';
      profile.photo_4 = profile.photo_4 || user.photo_4 || '';
    }
    profile.religion = user.religion;
    profile.name = profile.name || user.full_name;
    profile.mobile_number = profile.mobile_number || profile.phone || user.mobile_number;
    profile.email_address = profile.email_address || user.email_address;
    profile.country_code = user.country_code || '+91';
    profile.plan = getEffectivePlan(user);
    profile.subscription_start_date = user.subscription_start_date;
    profile.subscription_expiry_date = user.subscription_expiry_date;
    profile.account_status = user.account_status;
    profile.status = user.status;
    profile.is_free_trial_claimed = user.is_free_trial_claimed;
    profile.is_online = user.is_online;
    profile.last_seen = user.last_seen;

    // Normalize marital status and key attributes for consistent casing
    profile.marital_status = profile.marital_status || profile.maritalStatus || 'Never Married';
    profile.maritalStatus = profile.marital_status;
    profile.profile_created_for = profile.profile_created_for || profile.profileCreatedFor;
    profile.profileCreatedFor = profile.profile_created_for;
    profile.fathers_name = profile.fathers_name || profile.fathersName;
    profile.fathersName = profile.fathers_name;
    profile.fathers_job = profile.fathers_job || profile.fathersJob;
    profile.fathersJob = profile.fathers_job;
    profile.mothers_name = profile.mothers_name || profile.mothersName;
    profile.mothersName = profile.mothers_name;
    profile.mothers_job = profile.mothers_job || profile.mothersJob;
    profile.mothersJob = profile.mothers_job;
    profile.sibling_details = profile.sibling_details || profile.siblingDetails;
    profile.siblingDetails = profile.sibling_details;
    profile.age_of_father = profile.age_of_father || profile.fathersAge;
    profile.fathersAge = profile.age_of_father;
    profile.age_of_mother = profile.age_of_mother || profile.mothersAge;
    profile.mothersAge = profile.age_of_mother;

    res.status(200).json({
      message: 'User details fetched successfully',
      user: profile
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Server error while fetching user details' });
  }
};

export const updateUserDetailsByProfileId = async (req, res) => {
  const { profileId } = req.params;
  const updateData = req.body;

  try {
    const [users] = await pool.query(
      'SELECT religion FROM user_registration WHERE profile_id = ?',
      [profileId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    let matchingTable;
    switch (user.religion) {
      case 'Hindu': matchingTable = 'hindus'; break;
      case 'Christian': matchingTable = 'christians'; break;
      case 'Muslim': matchingTable = 'muslims'; break;
      case 'Others':
      case 'Other':
      default: matchingTable = 'others'; break;
    }

    // Process starRasi
    let nakshatra = null;
    let rasi = null;
    if (updateData.starRasi) {
      const parts = updateData.starRasi.split('/').map(s => s.trim());
      nakshatra = parts[0] || null;
      rasi = parts.length > 1 ? parts[1] : null;
    }

    // Process date_of_birth
    let dob = null;
    let dobMalayalam = null;
    if (updateData.dobEnglish) {
      const d = new Date(updateData.dobEnglish);
      if (!isNaN(d.getTime())) {
        dob = d.toISOString().split('T')[0];
        const result = kollavarsham.fromGregorianDate(d);
        dobMalayalam = result.toString ? result.toString() : result.year + ' ' + result.month + ' ' + result.date;

        // Automatically update age
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
          age--;
        }
        updateData.age = age;
      }
    }

    // Check if matchingTable has a record for this profileId; if not, insert initial row
    const [existingRows] = await pool.query(
      `SELECT id FROM ${matchingTable} WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?)) LIMIT 1`,
      [profileId]
    );

    if (existingRows.length === 0) {
      await pool.query(
        `INSERT INTO ${matchingTable} (profile_id, name) VALUES (?, ?)`,
        [profileId, updateData.name || '']
      );
    }

    // Inspect available columns dynamically to prevent SQL 1054 error if any column is missing in production
    const [tableCols] = await pool.query(`SHOW COLUMNS FROM ${matchingTable}`);
    const availableCols = new Set(tableCols.map(c => c.Field.toLowerCase()));

    const fieldMap = {
      name: updateData.name !== undefined ? updateData.name : null,
      gender: updateData.gender !== undefined ? updateData.gender : null,
      age: updateData.age !== undefined ? updateData.age : null,
      height: updateData.height !== undefined ? updateData.height : null,
      marital_status: updateData.maritalStatus !== undefined ? updateData.maritalStatus : null,
      profile_created_for: updateData.profileCreatedFor !== undefined ? updateData.profileCreatedFor : null,
      education: updateData.education !== undefined ? updateData.education : null,
      profession: updateData.profession !== undefined ? updateData.profession : null,
      country: updateData.country !== undefined ? updateData.country : null,
      state: updateData.state !== undefined ? updateData.state : null,
      district: updateData.district !== undefined ? updateData.district : null,
      place: updateData.city !== undefined ? updateData.city : null,
      pincode: updateData.pincode !== undefined ? updateData.pincode : null,
      caste: updateData.caste !== undefined ? updateData.caste : null,
      house_name: updateData.houseName !== undefined ? updateData.houseName : null,
      street_locality: updateData.streetLocality !== undefined ? updateData.streetLocality : null,
      post_office: updateData.postOffice !== undefined ? updateData.postOffice : null,
      fathers_name: updateData.fathersName !== undefined ? updateData.fathersName : null,
      fathers_job: updateData.fathersJob !== undefined ? updateData.fathersJob : null,
      mothers_name: updateData.mothersName !== undefined ? updateData.mothersName : null,
      mothers_job: updateData.mothersJob !== undefined ? updateData.mothersJob : null,
      sibling_details: updateData.siblingDetails !== undefined ? updateData.siblingDetails : null,
      about_me: updateData.aboutMe !== undefined ? updateData.aboutMe : null,
      employment_status: updateData.employmentStatus !== undefined ? updateData.employmentStatus : null,
      employment_country: updateData.employmentCountry !== undefined ? updateData.employmentCountry : null
    };

    const updateSet = [];
    const updateValues = [];

    for (const [colName, val] of Object.entries(fieldMap)) {
      if (availableCols.has(colName)) {
        updateSet.push(`${colName} = ?`);
        updateValues.push(val);
      }
    }

    if (dob && availableCols.has('date_of_birth')) {
      updateSet.push(`date_of_birth = ?`);
      updateValues.push(dob);
    }

    if (matchingTable === 'hindus') {
      if (availableCols.has('birth_time')) {
        updateSet.push(`birth_time = ?`);
        updateValues.push(updateData.birthTime || null);
      }
      if (availableCols.has('nakshatra')) {
        updateSet.push(`nakshatra = ?`);
        updateValues.push(nakshatra);
      }
      if (availableCols.has('rasi')) {
        updateSet.push(`rasi = ?`);
        updateValues.push(rasi);
      }
      if (dobMalayalam && availableCols.has('date_of_birth_malayalam')) {
        updateSet.push(`date_of_birth_malayalam = ?`);
        updateValues.push(dobMalayalam);
      }
    }

    if (updateSet.length > 0) {
      updateValues.push(profileId);
      await pool.query(
        `UPDATE ${matchingTable} SET ${updateSet.join(', ')} WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?))`,
        updateValues
      );
    }

    // Also update fields in user_registration
    let updateFields = [];
    let userRegValues = [];
    if (updateData.name) {
      updateFields.push('full_name = ?');
      userRegValues.push(updateData.name);
    }
    if (dob) {
      updateFields.push('dob = ?');
      userRegValues.push(dob);
    }
    if (updateData.caste) {
      updateFields.push('caste = ?');
      userRegValues.push(updateData.caste);
    }
    if (updateData.motherTongue !== undefined) {
      updateFields.push('mother_tongue = ?');
      userRegValues.push(updateData.motherTongue);
    }

    if (updateFields.length > 0) {
      userRegValues.push(profileId);
      await pool.query(
        `UPDATE user_registration SET ${updateFields.join(', ')} WHERE LOWER(TRIM(profile_id)) = LOWER(TRIM(?))`,
        userRegValues
      );
    }

    // Franchise Assignment Logic: Check if pincode is updated (safely wrapped in try-catch)
    try {
      if (updateData.pincode !== undefined) {
        const pincode = String(updateData.pincode || '').trim();
        if (pincode) {
          const matchedFranchise = await findActiveFranchiseForPincode(pincode);
          if (matchedFranchise) {
            await pool.query(
              `UPDATE user_registration SET assigned_franchise_id = ? WHERE profile_id = ?`,
              [matchedFranchise.franchise_id, profileId]
            );
          } else {
            // Uncovered pincode: check if user had an automatic assignment (not manual) or update to NULL
            const [userRow] = await pool.query(
              `SELECT assigned_franchise_id FROM user_registration WHERE profile_id = ?`,
              [profileId]
            );
            // If the user's previously assigned franchise does not cover this new pincode, reset to NULL
            if (userRow.length > 0 && userRow[0].assigned_franchise_id) {
              const [prevFranchise] = await pool.query(
                `SELECT pin_codes FROM bm_franchise WHERE franchise_id = ?`,
                [userRow[0].assigned_franchise_id]
              );
              if (prevFranchise.length > 0) {
                const prevPins = parsePinCodes ? parsePinCodes(prevFranchise[0].pin_codes) : [];
                if (!prevPins.includes(pincode)) {
                  await pool.query(
                    `UPDATE user_registration SET assigned_franchise_id = NULL WHERE profile_id = ?`,
                    [profileId]
                  );
                }
              }
            }
          }
        }
        // Clean up legacy requests table
        await pool.query(
          `DELETE FROM bm_head_franchise_requests WHERE profile_id = ?`,
          [profileId]
        ).catch(() => {});
      }
    } catch (hfErr) {
      console.warn('[Franchise Assignment Logic Warning]:', hfErr.message);
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message || 'Server error while updating profile' });
  }
};

// Pinned profile IDs list (disabled in favor of dynamic latest registration date sort)
export const PINNED_HIGHLIGHTED_PROFILE_IDS = [];

const isValidUpload = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (!clean || clean === 'null' || clean === 'undefined' || clean === 'none') return false;
  if (clean.includes('img_avatar') || clean.includes('default_avatar')) return false;
  return true;
};

const getPlanPriority = (plan) => {
  switch ((plan || '').toUpperCase()) {
    case 'DIAMOND':
      return 1;
    case 'PLATINUM':
      return 2;
    case 'GOLD':
      return 3;
    case 'SILVER':
      return 4;
    default:
      return 5;
  }
};

const parseHeightToInches = (height) => {
  if (!height) return null;

  const normalized = String(height).trim().toLowerCase();

  const feetInchesMatch = normalized.match(/(\d+)\s*(?:ft|feet|')\s*(\d+)?\s*(?:in|inch|inches|")?/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10);
    const inches = parseInt(feetInchesMatch[2] || '0', 10);
    return (feet * 12) + inches;
  }

  const centimetersMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*cm$/);
  if (centimetersMatch) {
    return Math.round(parseFloat(centimetersMatch[1]) / 2.54);
  }

  const plainNumber = normalized.match(/^(\d+(?:\.\d+)?)$/);
  if (plainNumber) {
    const numericHeight = parseFloat(plainNumber[1]);
    if (numericHeight > 100) {
      return Math.round(numericHeight / 2.54);
    }
  }

  return null;
};

const isHeightWithinPreference = (height, partnerPrefs) => {
  const minHeight = parseHeightToInches(partnerPrefs?.min_height);
  const maxHeight = parseHeightToInches(partnerPrefs?.max_height);

  if (minHeight === null && maxHeight === null) {
    return null;
  }

  const profileHeight = parseHeightToInches(height);
  if (profileHeight === null) {
    return false;
  }

  if (minHeight !== null && profileHeight < minHeight) {
    return false;
  }

  if (maxHeight !== null && profileHeight > maxHeight) {
    return false;
  }

  return true;
};

const calculateAgeMatchScore = (candidateAge, partnerPrefs, currentUser) => {
  if (!candidateAge) return 0;
  const numCandAge = parseInt(candidateAge, 10);
  if (isNaN(numCandAge)) return 0;

  const minAge = partnerPrefs?.min_age ? parseInt(partnerPrefs.min_age, 10) : null;
  const maxAge = partnerPrefs?.max_age ? parseInt(partnerPrefs.max_age, 10) : null;

  let targetAge = null;
  if (minAge !== null && maxAge !== null) {
    targetAge = (minAge + maxAge) / 2;
  } else if (minAge !== null) {
    targetAge = minAge;
  } else if (maxAge !== null) {
    targetAge = maxAge;
  } else if (currentUser?.dob || currentUser?.profile_age) {
    let userAge = currentUser.profile_age;
    if (!userAge && currentUser.dob) {
      const d = new Date(currentUser.dob);
      if (!isNaN(d.getTime())) {
        userAge = new Date().getFullYear() - d.getFullYear();
      }
    }
    if (userAge) targetAge = userAge;
  }

  if (targetAge === null) return 10;

  const ageDiff = Math.abs(numCandAge - targetAge);

  // Exact or nearest age gets higher score
  if (ageDiff === 0) return 25; // Exact age match -> Highest score!
  if (ageDiff <= 1) return 22;
  if (ageDiff <= 2) return 19;
  if (ageDiff <= 3) return 16;
  if (ageDiff <= 4) return 13;
  if (ageDiff <= 5) return 10;

  if (minAge !== null && maxAge !== null && numCandAge >= minAge && numCandAge <= maxAge) {
    return 8;
  }

  return 2;
};

const matchesAnyPreferenceToken = (userStr, prefStr, keywordGroups = []) => {
  if (!prefStr || ['any', 'all', 'open to all', ''].includes(String(prefStr).trim().toLowerCase())) {
    return null;
  }
  if (!userStr) return false;

  const targetClean = String(prefStr).trim().toLowerCase();
  const userClean = String(userStr).trim().toLowerCase();

  if (userClean.includes(targetClean) || targetClean.includes(userClean)) {
    return true;
  }

  const tokens = targetClean.split(/[,/|;\-\n]+/).map(t => t.trim()).filter(Boolean);
  for (const token of tokens) {
    if (token && (userClean.includes(token) || token.includes(userClean))) {
      return true;
    }
  }

  for (const group of keywordGroups) {
    const targetHasGroup = group.some(k => targetClean.includes(k));
    const userHasGroup = group.some(k => userClean.includes(k));
    if (targetHasGroup && userHasGroup) return true;
  }

  return false;
};

const edKeywordGroups = [
  ['b.tech', 'bca', 'b.sc', 'b.com', 'ba', 'b.ed', 'bba', 'degree', 'bachelor', 'graduate', 'undergraduate', 'b.e', 'b.arch', 'llb'],
  ['m.tech', 'mca', 'm.sc', 'm.com', 'ma', 'm.ed', 'mba', 'master', 'post graduate', 'pg', 'm.e', 'llm'],
  ['mbbs', 'bams', 'bhms', 'md', 'ms', 'doctor', 'nursing', 'b.sc nursing', 'medical', 'pharmacy', 'b.pharm'],
  ['diploma', 'polytechnic', 'iti'],
  ['phd', 'doctorate', 'research']
];

const isEducationMatching = (userEd, prefEd) => {
  return matchesAnyPreferenceToken(userEd, prefEd, edKeywordGroups);
};

const profKeywordGroups = [
  ['software', 'developer', 'engineer', 'it', 'programmer', 'tech', 'system analyst', 'coding', 'web'],
  ['teacher', 'professor', 'lecturer', 'b.ed', 'educator', 'tutor', 'academic'],
  ['doctor', 'nurse', 'medical', 'healthcare', 'pharmacist', 'hospital', 'dentist', 'physician'],
  ['government', 'civil', 'officer', 'police', 'bank', 'clerk', 'psu', 'railway'],
  ['accountant', 'ca', 'finance', 'auditor', 'banking', 'chartered'],
  ['business', 'self employed', 'entrepreneur', 'trader', 'shop owner']
];

const isProfessionMatching = (userProf, prefProf) => {
  return matchesAnyPreferenceToken(userProf, prefProf, profKeywordGroups);
};

const isLocationMatching = (candDistrict, prefLoc, userDistrict) => {
  if (!candDistrict) return false;

  const cleanCand = String(candDistrict).toLowerCase().replace(/^\d+[\s\-]+/, '').trim();
  if (!cleanCand) return false;

  const rawPref = prefLoc ? String(prefLoc).toLowerCase().replace(/^\d+[\s\-]+/, '').trim() : '';
  const cleanUserDist = userDistrict ? String(userDistrict).toLowerCase().replace(/^\d+[\s\-]+/, '').trim() : '';

  const isAnyPref = !rawPref || ['any', 'all', 'open to all', 'kerala', 'any district / kerala'].includes(rawPref);

  if (isAnyPref) {
    if (cleanUserDist && (cleanCand.includes(cleanUserDist) || cleanUserDist.includes(cleanCand))) {
      return true; // Candidate in same district as logged-in user!
    }
    return true;
  }

  // Handle multiple comma-separated preferred locations (e.g. "Thiruvananthapuram, Pathanamthitta, Alappuzha")
  const tokens = rawPref.split(',').map(s => s.trim()).filter(Boolean);
  for (const token of tokens) {
    if (['any', 'all', 'open to all', 'kerala', 'any district / kerala'].includes(token)) {
      return true;
    }
    if (cleanCand.includes(token) || token.includes(cleanCand)) {
      return true;
    }
  }

  if (cleanUserDist && (cleanCand.includes(cleanUserDist) || cleanUserDist.includes(cleanCand))) {
    return true;
  }

  return false;
};

const isCasteMatching = (userCaste, prefCaste) => {
  if (!prefCaste || ['any', 'all', 'open to all', ''].includes(String(prefCaste).trim().toLowerCase())) {
    return null;
  }
  if (!userCaste) return false;

  const target = String(prefCaste).trim().toLowerCase();
  const user = String(userCaste).trim().toLowerCase();

  return user.includes(target) || target.includes(user);
};

const isMaritalStatusMatching = (userStatus, prefStatus) => {
  if (!prefStatus || ['any', 'all', 'open to all', ''].includes(String(prefStatus).trim().toLowerCase())) {
    return null;
  }
  if (!userStatus) return false;

  const target = String(prefStatus).trim().toLowerCase();
  const user = String(userStatus).trim().toLowerCase();

  return user.includes(target) || target.includes(user);
};

const calculatePreferenceMatchScore = (user, partnerPrefs, currentUser) => {
  if (!partnerPrefs && !currentUser) return 0;

  let score = 0;

  // 1. Height match (+15 points)
  const heightMatch = isHeightWithinPreference(user.height, partnerPrefs);
  if (heightMatch === true) score += 15;

  // 2. Age Proximity & Match (Exact/nearest age match gets higher score, up to +25 points)
  score += calculateAgeMatchScore(user.profile_age || user.age, partnerPrefs, currentUser);

  // 3. Qualification / Education match (+15 points)
  const edMatch = isEducationMatching(user.education, partnerPrefs?.education_level);
  if (edMatch === true) score += 15;

  // 4. Occupation / Profession match (+15 points)
  const profMatch = isProfessionMatching(user.profession, partnerPrefs?.preferred_professions);
  if (profMatch === true) score += 15;

  // 5. Caste match (+15 points)
  const casteMatch = isCasteMatching(user.caste, partnerPrefs?.caste);
  if (casteMatch === true) score += 15;

  // 6. Marital Status match (+10 points)
  const maritalMatch = isMaritalStatusMatching(user.maritalStatus, partnerPrefs?.marital_status);
  if (maritalMatch === true) score += 10;

  // 7. Location / District match (+15 points if candidate is in same district as current user or preferred district)
  const candLoc = user.detailDistrict || user.location || user.district;
  const locMatch = isLocationMatching(candLoc, partnerPrefs?.location_preferences, currentUser?.district);
  if (locMatch === true) score += 15;

  // 8. Mother Tongue match (+5 points)
  if (partnerPrefs?.mother_tongue && !['any', 'all', 'open to all', ''].includes(String(partnerPrefs.mother_tongue).trim().toLowerCase())) {
    const mtPref = String(partnerPrefs.mother_tongue).trim().toLowerCase();
    const candidateMt = String(user.mother_tongue || user.language || 'malayalam').trim().toLowerCase();
    if (candidateMt.includes(mtPref) || mtPref.includes(candidateMt)) {
      score += 5;
    }
  }

  return score;
};

const sortDailyRecommendationsSimple = (users, userCaste) => {
  return [...users].sort((a, b) => {
    // 0. Photo priority: Real approved photos first before avatar placeholders
    const hasPhotoA = Boolean(a.photo_1 || a.photo1 || a.image);
    const hasPhotoB = Boolean(b.photo_1 || b.photo1 || b.image);
    if (hasPhotoA !== hasPhotoB) {
      return hasPhotoB ? 1 : -1;
    }

    // 1. Primary sort: Highest plan priority first (VIP -> Diamond -> Platinum -> Gold -> Silver -> Free)
    const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
    if (planDiff !== 0) {
      return planDiff;
    }

    // 2. Secondary sort: Same caste match bonus
    if (userCaste && (a.caste || b.caste)) {
      const aCaste = String(a.caste || '').toLowerCase();
      const bCaste = String(b.caste || '').toLowerCase();
      const targetCaste = String(userCaste).toLowerCase();
      const aMatch = aCaste && (aCaste.includes(targetCaste) || targetCaste.includes(aCaste)) ? 1 : 0;
      const bMatch = bCaste && (bCaste.includes(targetCaste) || targetCaste.includes(bCaste)) ? 1 : 0;
      if (aMatch !== bMatch) {
        return bMatch - aMatch;
      }
    }

    // 3. Tertiary sort: Updated/Created date (newest/updated first)
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    return 0;
  });
};

const sortRecommendationsByPriority = (users, partnerPrefs, currentUser) => {
  return [...users].sort((a, b) => {
    // 0. Photo priority: Real approved photos first before avatar placeholders
    const hasPhotoA = Boolean(a.photo_1 || a.photo1 || a.image);
    const hasPhotoB = Boolean(b.photo_1 || b.photo1 || b.image);
    if (hasPhotoA !== hasPhotoB) {
      return hasPhotoB ? 1 : -1;
    }

    // 1. Primary sort: Highest plan priority first (VIP -> Diamond -> Platinum -> Gold -> Silver -> Free)
    const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
    if (planDiff !== 0) {
      return planDiff;
    }

    // 2. Secondary sort: Comprehensive Partner Preference Match Score (Height, Qualification, Occupation, Age Proximity, Caste, Marital Status, Location)
    if (partnerPrefs || currentUser) {
      const aScore = calculatePreferenceMatchScore(a, partnerPrefs, currentUser);
      const bScore = calculatePreferenceMatchScore(b, partnerPrefs, currentUser);
      if (aScore !== bScore) {
        return bScore - aScore;
      }
    }

    // 3. Tertiary sort: Updated/Created date (newest/updated first)
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    return 0;
  });
};

const formatProfileCardData = (user) => {
  let age = user.profile_age;
  if (!age && user.dob) {
    const d = new Date(user.dob);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      age = today.getFullYear() - d.getFullYear();
      const month = today.getMonth() - d.getMonth();
      if (month < 0 || (month === 0 && today.getDate() < d.getDate())) age--;
    }
  }

  const district = user.detailDistrict || user.location || 'Kerala';

  // Extract accurate working / employment status from backend DB
  const rawStatus = (user.employmentStatus || user.employment_status || '').trim();
  const rawProf = (user.profession || '').trim();
  let employmentStatus = 'Working';

  if (rawStatus && !['none', 'null', 'undefined', ''].includes(rawStatus.toLowerCase())) {
    employmentStatus = rawStatus;
  } else if (rawProf && !['none', 'null', 'undefined', 'n/a', 'nil', 'not working', 'unemployed', ''].includes(rawProf.toLowerCase())) {
    const profLower = rawProf.toLowerCase();
    if (['homemaker', 'home maker'].includes(profLower)) {
      employmentStatus = 'Homemaker';
    } else if (['student'].includes(profLower)) {
      employmentStatus = 'Student';
    } else if (['not working', 'unemployed'].includes(profLower)) {
      employmentStatus = 'Not Working';
    } else {
      employmentStatus = 'Working';
    }
  } else {
    employmentStatus = 'Working';
  }

  return {
    id: user.id,
    name: user.name,
    age: age || 25,
    height: user.height || "5'5\"",
    religion: user.religion || 'Hindu',
    caste: user.caste || '',
    education: user.education || 'Degree',
    profession: user.profession || '',
    location: district,
    district: district,
    gender: user.gender,
    image: isValidUpload(user.photo_1) 
      ? user.photo_1 
      : (typeof user.gender === 'string' && ['female', 'bride', 'f'].includes(user.gender.trim().toLowerCase()) 
        ? 'https://www.w3schools.com/howto/img_avatar2.png' 
        : 'https://www.w3schools.com/howto/img_avatar.png'),
    verified: user.verified === 'verified' || user.verified === 1,
    premium: user.plan === 'DIAMOND' || user.plan === 'PLATINUM' || user.plan === 'VIP',
    plan: user.plan,
    isOnline: Boolean(isOnline(user.id) || user.isOnline === 1 || user.isOnline === true),
    star: user.star || null,
    maritalStatus: user.maritalStatus || 'Never Married',
    employmentStatus: employmentStatus,
    employment_status: employmentStatus,
  };
};

// 1. Daily Recommendations: Priority by Highest Plan Tier + Height Preference + Newest Registered Users
export const getDailyRecommendations = async (req, res) => {
  try {
    let currentUser = null;
    let partnerPrefs = null;
    let targetGender = null;
    let targetReligion = null;
    let userCaste = null;

    if (req.user && req.user.id) {
      const [userRows] = await pool.execute(
        `SELECT u.id, u.profile_id, u.gender, u.religion, u.district,
                COALESCE(h.caste, m.caste, c.caste, o.caste) as caste
         FROM user_registration u
         LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
         LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
         LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
         LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
         WHERE u.id = ? LIMIT 1`,
        [req.user.id]
      );
      if (userRows.length > 0) {
        currentUser = userRows[0];
        userCaste = currentUser.caste;
        const isMaleUser = currentUser.gender && ['male', 'groom', 'man'].includes(String(currentUser.gender).trim().toLowerCase());
        targetGender = isMaleUser ? 'Female' : 'Male';

        // Fetch partner preferences for logged-in user
        const [prefRows] = await pool.execute(
          'SELECT * FROM partner_preference WHERE profile_id = ? LIMIT 1',
          [currentUser.profile_id]
        );
        if (prefRows.length > 0) {
          partnerPrefs = prefRows[0];
        }

        const rawTargetReligion = partnerPrefs?.religion || currentUser?.religion || null;
        if (rawTargetReligion) {
          const relClean = rawTargetReligion.split('-')[0].trim().split(' ')[0].trim();
          if (relClean && !['all', 'open to all'].includes(relClean.toLowerCase())) {
            targetReligion = relClean;
          }
        }
      }
    }

    let query = `
      SELECT 
        u.profile_id as id, u.full_name as name, u.religion, u.dob, u.gender,
        u.district as location, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) as photo_1, u.is_online as isOnline, u.plan,
        u.created_at as createdAt, u.verification as verified, u.status as status, u.account_status as accountStatus,
        COALESCE(h.caste, m.caste, c.caste, o.caste) as caste,
        COALESCE(h.age, m.age, c.age, o.age) as profile_age,
        COALESCE(h.height, m.height, c.height, o.height) as height,
        COALESCE(h.education, m.education, c.education, o.education) as education,
        COALESCE(h.profession, m.profession, c.profession, o.profession) as profession,
        COALESCE(h.employment_status, m.employment_status, c.employment_status, o.employment_status) as employmentStatus,
        COALESCE(h.marital_status, m.marital_status, c.marital_status, o.marital_status) as maritalStatus,
        COALESCE(h.district, m.district, c.district, o.district) as detailDistrict,
        h.nakshatra as star
      FROM user_registration u
      LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
      LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
      LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
      LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
      WHERE (u.account_status IS NULL OR UPPER(u.account_status) NOT IN ('BANNED', 'DEACTIVATED', 'FREEZED', 'BLOCKED'))
        AND (u.status IS NULL OR UPPER(u.status) NOT IN ('DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE', 'PENDING_DELETE', 'DELETED', 'PENDING_DEACTIVATE'))
        AND UPPER(COALESCE(u.verification, 'UNVERIFIED')) = 'VERIFIED'
    `;
    const queryParams = [];

    if (currentUser) {
      query += ' AND u.id != ?';
      queryParams.push(currentUser.id);
    }

    if (targetGender) {
      if (targetGender === 'Female') {
        query += " AND LOWER(u.gender) IN ('female', 'bride')";
      } else {
        query += " AND LOWER(u.gender) IN ('male', 'groom')";
      }
    }

    if (targetReligion) {
      query += " AND LOWER(u.religion) LIKE ?";
      queryParams.push(`%${targetReligion.toLowerCase()}%`);
    }

    query += ` ORDER BY
      CASE UPPER(COALESCE(u.plan, 'FREE'))
        WHEN 'VIP'      THEN 1
        WHEN 'DIAMOND'  THEN 2
        WHEN 'PLATINUM' THEN 3
        WHEN 'GOLD'     THEN 4
        WHEN 'SILVER'   THEN 5
        ELSE 6
      END ASC,
      u.created_at DESC,
      u.id DESC
      LIMIT 30`;

    const [users] = await pool.query(query, queryParams);
    let finalUsers = users;

    if (finalUsers.length < 5) {
      const existingIds = finalUsers.map(u => u.id);
      let fallbackQuery = `
        SELECT 
          u.profile_id as id, u.full_name as name, u.religion, u.dob, u.gender,
          u.district as location, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) as photo_1, u.is_online as isOnline, u.plan,
          u.created_at as createdAt, u.verification as verified, u.status as status, u.account_status as accountStatus,
          COALESCE(h.caste, m.caste, c.caste, o.caste) as caste,
          COALESCE(h.age, m.age, c.age, o.age) as profile_age,
          COALESCE(h.height, m.height, c.height, o.height) as height,
          COALESCE(h.education, m.education, c.education, o.education) as education,
          COALESCE(h.profession, m.profession, c.profession, o.profession) as profession,
          COALESCE(h.employment_status, m.employment_status, c.employment_status, o.employment_status) as employmentStatus,
          COALESCE(h.marital_status, m.marital_status, c.marital_status, o.marital_status) as maritalStatus,
          COALESCE(h.district, m.district, c.district, o.district) as detailDistrict,
          h.nakshatra as star
        FROM user_registration u
        LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
        LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
        LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
        LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
        WHERE (u.account_status IS NULL OR UPPER(u.account_status) NOT IN ('BANNED', 'DEACTIVATED', 'FREEZED', 'BLOCKED'))
          AND (u.status IS NULL OR UPPER(u.status) NOT IN ('DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE', 'PENDING_DELETE', 'DELETED', 'PENDING_DEACTIVATE'))
          AND UPPER(COALESCE(u.verification, 'UNVERIFIED')) = 'VERIFIED'
      `;
      const fallbackParams = [];
      if (currentUser) {
        fallbackQuery += ' AND u.id != ?';
        fallbackParams.push(currentUser.id);
      }
      if (targetGender) {
        if (targetGender === 'Female') {
          fallbackQuery += " AND LOWER(u.gender) IN ('female', 'bride')";
        } else {
          fallbackQuery += " AND LOWER(u.gender) IN ('male', 'groom')";
        }
      }
      if (targetReligion) {
        fallbackQuery += " AND LOWER(u.religion) LIKE ?";
        fallbackParams.push(`%${targetReligion.toLowerCase()}%`);
      }
      if (existingIds.length > 0) {
        fallbackQuery += ` AND u.profile_id NOT IN (${existingIds.map(() => '?').join(',')})`;
        fallbackParams.push(...existingIds);
      }
      fallbackQuery += ` ORDER BY u.created_at DESC LIMIT 15`;
      const [fallbackUsers] = await pool.query(fallbackQuery, fallbackParams);
      finalUsers = [...finalUsers, ...fallbackUsers];
    }

    // Failsafe: Filter out deactivated / inactive / banned / freezed / unverified users
    finalUsers = finalUsers.filter(u => {
      const s = String(u.status || '').trim().toUpperCase();
      const accS = String(u.accountStatus || u.account_status || '').trim().toUpperCase();
      const v = String(u.verified || u.verification || '').trim().toUpperCase();
      if (v !== 'VERIFIED') return false;
      if (['DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE'].includes(s)) return false;
      if (['DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE'].includes(accS)) return false;
      return true;
    });

    // Failsafe: Filter out any profile matching the logged-in user's gender
    if (currentUser && currentUser.gender) {
      const cGender = String(currentUser.gender).trim().toLowerCase();
      finalUsers = finalUsers.filter(u => {
        const uGender = String(u.gender || '').trim().toLowerCase();
        if (['male', 'groom', 'man'].includes(cGender)) {
          return ['female', 'bride', 'woman'].includes(uGender);
        } else {
          return ['male', 'groom', 'man'].includes(uGender);
        }
      });
    }

    // Sort profiles for Daily Recommendations: Highest Plan Priority -> Same Caste -> Newest Registered Users
    finalUsers = sortDailyRecommendationsSimple(finalUsers, userCaste || partnerPrefs?.caste);

    const formattedProfiles = finalUsers.map(formatProfileCardData);
    res.status(200).json({ profiles: formattedProfiles });
  } catch (error) {
    console.error('Error fetching daily recommendations:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. Top Matches: Priority based on Partner Preferences (Religion, Caste, Age, Marital Status, District)
export const getTopMatches = async (req, res) => {
  try {
    let currentUser = null;
    let partnerPrefs = null;
    let targetGender = null;
    let userCaste = null;

    if (req.user && req.user.id) {
      const [userRows] = await pool.execute(
        `SELECT u.id, u.profile_id, u.gender, u.religion, u.district,
                COALESCE(h.caste, m.caste, c.caste, o.caste) as caste
         FROM user_registration u
         LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
         LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
         LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
         LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
         WHERE u.id = ? LIMIT 1`,
        [req.user.id]
      );
      if (userRows.length > 0) {
        currentUser = userRows[0];
        userCaste = currentUser.caste;
        const isMaleUser = currentUser.gender && ['male', 'groom', 'man'].includes(String(currentUser.gender).trim().toLowerCase());
        targetGender = isMaleUser ? 'Female' : 'Male';

        const [prefRows] = await pool.execute(
          'SELECT * FROM partner_preference WHERE profile_id = ? LIMIT 1',
          [currentUser.profile_id]
        );
        if (prefRows.length > 0) {
          partnerPrefs = prefRows[0];
        }
      }
    }

    const rawTargetReligion = partnerPrefs?.religion || (currentUser?.religion || null);
    const targetReligion = rawTargetReligion 
      ? rawTargetReligion.split('-')[0].trim().split(' ')[0].trim()
      : null;

    const targetCaste = (partnerPrefs?.caste && partnerPrefs.caste !== 'Open to all') 
      ? partnerPrefs.caste 
      : (userCaste || null);
    const targetMinAge = partnerPrefs?.min_age ? parseInt(partnerPrefs.min_age) : null;
    const targetMaxAge = partnerPrefs?.max_age ? parseInt(partnerPrefs.max_age) : null;
    const targetMaritalStatus = partnerPrefs?.marital_status || null;
    const targetLocation = partnerPrefs?.location_preferences || null;

    const locTokens = targetLocation 
      ? targetLocation.split(',').map(s => s.trim()).filter(s => s && !['any', 'all', 'open to all', 'kerala', 'any district / kerala'].includes(s.toLowerCase()))
      : [];

    let locScoreSql = '0';
    const locQueryParams = [];
    if (locTokens.length > 0) {
      const locChecks = locTokens.map(() => '(LOWER(u.district) LIKE ? OR LOWER(COALESCE(h.district, m.district, c.district, o.district)) LIKE ?)').join(' OR ');
      locScoreSql = `(CASE WHEN ${locChecks} THEN 5 ELSE 0 END)`;
      locTokens.forEach(t => {
        locQueryParams.push(`%${t.toLowerCase()}%`, `%${t.toLowerCase()}%`);
      });
    } else if (targetLocation) {
      locScoreSql = '5';
    }

    let query = `
      SELECT 
        u.profile_id as id, u.full_name as name, u.religion, u.dob, u.gender,
        u.district as location, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) as photo_1, u.is_online as isOnline, u.plan,
        u.created_at as createdAt, u.verification as verified, u.status as status, u.account_status as accountStatus,
        COALESCE(h.caste, m.caste, c.caste, o.caste) as caste,
        COALESCE(h.age, m.age, c.age, o.age) as profile_age,
        COALESCE(h.height, m.height, c.height, o.height) as height,
        COALESCE(h.education, m.education, c.education, o.education) as education,
        COALESCE(h.profession, m.profession, c.profession, o.profession) as profession,
        COALESCE(h.employment_status, m.employment_status, c.employment_status, o.employment_status) as employmentStatus,
        COALESCE(h.marital_status, m.marital_status, c.marital_status, o.marital_status) as maritalStatus,
        COALESCE(h.district, m.district, c.district, o.district) as detailDistrict,
        h.nakshatra as star,
        (
          (CASE WHEN ? IS NOT NULL AND LOWER(u.religion) LIKE LOWER(?) THEN 10 ELSE 0 END) +
          (CASE WHEN ? IS NOT NULL AND LOWER(COALESCE(h.caste, m.caste, c.caste, o.caste)) = LOWER(?) THEN 10 ELSE 0 END) +
          (CASE WHEN ? IS NOT NULL AND LOWER(COALESCE(h.marital_status, m.marital_status, c.marital_status, o.marital_status)) = LOWER(?) THEN 5 ELSE 0 END) +
          ${locScoreSql} +
          (CASE WHEN ? IS NOT NULL AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ? THEN 3 ELSE 0 END) +
          (CASE WHEN ? IS NOT NULL AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) <= ? THEN 3 ELSE 0 END)
        ) as match_score
      FROM user_registration u
      LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
      LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
      LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
      LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
      WHERE (u.account_status IS NULL OR UPPER(u.account_status) NOT IN ('BANNED', 'DEACTIVATED', 'FREEZED', 'BLOCKED'))
        AND (u.status IS NULL OR UPPER(u.status) NOT IN ('DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE', 'PENDING_DELETE', 'DELETED', 'PENDING_DEACTIVATE'))
        AND UPPER(COALESCE(u.verification, 'UNVERIFIED')) = 'VERIFIED'
    `;

    const queryParams = [
      targetReligion, targetReligion ? `%${targetReligion}%` : null,
      targetCaste, targetCaste,
      targetMaritalStatus, targetMaritalStatus,
      ...locQueryParams,
      targetMinAge, targetMinAge,
      targetMaxAge, targetMaxAge
    ];

    if (currentUser) {
      query += ' AND u.id != ?';
      queryParams.push(currentUser.id);
    }

    if (targetGender) {
      if (targetGender === 'Female') {
        query += " AND LOWER(u.gender) IN ('female', 'bride')";
      } else {
        query += " AND LOWER(u.gender) IN ('male', 'groom')";
      }
    }

    if (targetReligion) {
      query += " AND LOWER(u.religion) LIKE ?";
      queryParams.push(`%${targetReligion}%`);
    }

    // Sort by Match Score DESC, then Plan Tier, then Recency
    query += ` ORDER BY
      match_score DESC,
      CASE UPPER(COALESCE(u.plan, 'FREE'))
        WHEN 'VIP'      THEN 1
        WHEN 'DIAMOND'  THEN 2
        WHEN 'PLATINUM' THEN 3
        WHEN 'GOLD'     THEN 4
        WHEN 'SILVER'   THEN 5
        ELSE 6
      END ASC,
      u.created_at DESC
      LIMIT 30`;

    const [users] = await pool.query(query, queryParams);

    // Failsafe: Filter out deactivated / banned / unverified
    let finalUsers = users.filter(u => {
      const s = String(u.status || '').trim().toUpperCase();
      const accS = String(u.accountStatus || u.account_status || '').trim().toUpperCase();
      const v = String(u.verified || u.verification || '').trim().toUpperCase();
      return v === 'VERIFIED' &&
             !['DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE'].includes(s) &&
             !['DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE'].includes(accS);
    });

    // Failsafe: Filter out same gender
    if (currentUser && currentUser.gender) {
      const cGender = String(currentUser.gender).trim().toLowerCase();
      finalUsers = finalUsers.filter(u => {
        const uGender = String(u.gender || '').trim().toLowerCase();
        if (['male', 'groom', 'man'].includes(cGender)) {
          return ['female', 'bride', 'woman'].includes(uGender);
        } else {
          return ['male', 'groom', 'man'].includes(uGender);
        }
      });
    }

    const formattedProfiles = finalUsers.map(formatProfileCardData);
    res.status(200).json({ profiles: formattedProfiles });
  } catch (error) {
    console.error('Error fetching top matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getRecommendedProfiles = getDailyRecommendations;

export const getHighlightedProfiles = async (req, res) => {
  try {
    let baseQuery = `
      SELECT 
        u.profile_id as id, u.full_name as name, u.religion, u.dob, u.gender,
        u.district as location, 
        IF(u.photo_1 IS NOT NULL AND u.photo_1 != '' AND (u.photo_1_status != 'REJECTED' OR u.photo_1_status IS NULL), u.photo_1, NULL) as photo_1, 
        u.is_online as isOnline, u.plan,
        u.created_at as createdAt, u.verification as verified, u.status as status, u.account_status as accountStatus,
        COALESCE(h.caste, m.caste, c.caste, o.caste) as caste,
        COALESCE(h.age, m.age, c.age, o.age) as profile_age,
        COALESCE(h.height, m.height, c.height, o.height) as height,
        COALESCE(h.education, m.education, c.education, o.education) as education,
        COALESCE(h.profession, m.profession, c.profession, o.profession) as profession,
        COALESCE(h.employment_status, m.employment_status, c.employment_status, o.employment_status) as employmentStatus,
        COALESCE(h.marital_status, m.marital_status, c.marital_status, o.marital_status) as maritalStatus,
        COALESCE(h.district, m.district, c.district, o.district) as detailDistrict,
        h.nakshatra as star
      FROM user_registration u
      LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
      LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
      LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
      LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
      WHERE (u.account_status IS NULL OR UPPER(u.account_status) NOT IN ('BANNED', 'DEACTIVATED', 'FREEZED', 'BLOCKED'))
        AND (u.status IS NULL OR UPPER(u.status) NOT IN ('DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE', 'PENDING_DELETE', 'DELETED', 'PENDING_DEACTIVATE'))
        AND UPPER(COALESCE(u.verification, 'UNVERIFIED')) = 'VERIFIED'
    `;

    // Fetch latest profiles sorted strictly by registration date (latest user comes first)
    const [profiles] = await pool.query(
      `${baseQuery}
       ORDER BY 
         u.created_at DESC, 
         u.id DESC 
       LIMIT 30`
    );

    // Deduplicate profiles by profile_id
    const seen = new Set();
    const uniqueProfiles = [];
    for (const p of profiles) {
      const pid = String(p.id || p.profile_id).toLowerCase();
      if (!seen.has(pid)) {
        seen.add(pid);
        uniqueProfiles.push(p);
      }
    }

    const formattedProfiles = uniqueProfiles.map(formatProfileCardData);
    res.status(200).json({ profiles: formattedProfiles });
  } catch (error) {
    console.error('Error fetching highlighted profiles:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


export const searchProfiles = async (req, res) => {
  try {
    const { 
      gender, minAge, maxAge, religion, location, 
      education, profession, maritalStatus, nakshatra, profileId 
    } = req.query;

    let baseQuery = `
      SELECT u.profile_id as id, u.full_name as name, u.religion, u.caste, u.dob, u.gender, u.district as location, IF(u.photo_1_status = 'APPROVED', u.photo_1, NULL) as photo_1, u.is_online as isOnline,
        COALESCE(h.caste, m.caste, c.caste, o.caste, u.caste) as community,
        COALESCE(h.age, m.age, c.age, o.age) as profile_age,
        COALESCE(h.height, m.height, c.height, o.height) as height,
        COALESCE(h.education, m.education, c.education, o.education) as education,
        COALESCE(h.profession, m.profession, c.profession, o.profession) as profession,
        COALESCE(h.employment_status, m.employment_status, c.employment_status, o.employment_status) as employmentStatus,
        COALESCE(h.marital_status, m.marital_status, c.marital_status, o.marital_status) as maritalStatus,
        h.nakshatra as star
      FROM user_registration u
      LEFT JOIN hindus h ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(h.profile_id))
      LEFT JOIN muslims m ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(m.profile_id))
      LEFT JOIN christians c ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(c.profile_id))
      LEFT JOIN others o ON LOWER(TRIM(u.profile_id)) = LOWER(TRIM(o.profile_id))
      WHERE UPPER(COALESCE(u.verification, 'UNVERIFIED')) = 'VERIFIED'
        AND (u.account_status IS NULL OR UPPER(u.account_status) NOT IN ('BANNED', 'DEACTIVATED', 'FREEZED', 'BLOCKED'))
        AND (u.status IS NULL OR UPPER(u.status) NOT IN ('DEACTIVATED', 'BANNED', 'FREEZED', 'BLOCKED', 'INACTIVE', 'PENDING_DELETE', 'DELETED', 'PENDING_DEACTIVATE'))
    `;
    const queryParams = [];

    if (req.user && req.user.id) {
      baseQuery += ' AND u.id != ?';
      queryParams.push(req.user.id);
    }

    let havingClause = [];

    if (profileId) {
      // If searching by ID, ignore other filters and use partial match (includes)
      baseQuery += ' AND u.profile_id LIKE ?';
      queryParams.push(`%${profileId}%`);
    } else {
      if (gender && gender !== 'Both') {
        const dbGender = gender === 'Bride' ? 'Female' : gender === 'Groom' ? 'Male' : gender;
        baseQuery += ' AND u.gender = ?';
        queryParams.push(dbGender);
      }
      
      if (religion && religion !== 'All') {
        baseQuery += ' AND u.religion = ?';
        queryParams.push(religion);
      }

      if (location && location !== 'All Districts') {
        baseQuery += ' AND u.district LIKE ?';
        queryParams.push(`%${location}%`);
      }

      if (minAge) {
        baseQuery += ' AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?';
        queryParams.push(parseInt(minAge));
      }
      if (maxAge) {
        baseQuery += ' AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) <= ?';
        queryParams.push(parseInt(maxAge));
      }

      if (education) {
        havingClause.push('education LIKE ?');
        queryParams.push(`%${education}%`);
      }
      if (profession) {
        havingClause.push('profession LIKE ?');
        queryParams.push(`%${profession}%`);
      }
      if (maritalStatus && maritalStatus !== 'Any' && maritalStatus !== 'Open to all' && maritalStatus !== 'All') {
        if (maritalStatus === 'Never Married' || maritalStatus === 'Unmarried' || maritalStatus === 'Single') {
          havingClause.push('(maritalStatus = ? OR maritalStatus = ? OR maritalStatus = ? OR maritalStatus IS NULL OR maritalStatus = "")');
          queryParams.push('Never Married', 'Unmarried', 'Single');
        } else if (maritalStatus === 'Second Marriage') {
          havingClause.push('(maritalStatus = ? OR maritalStatus = ? OR maritalStatus = ? OR maritalStatus LIKE ?)');
          queryParams.push('Second Marriage', 'Divorced', 'Widowed', '%Second%');
        } else {
          havingClause.push('maritalStatus LIKE ?');
          queryParams.push(`%${maritalStatus}%`);
        }
      }
      if (nakshatra && religion === 'Hindu') {
        havingClause.push('star = ?');
        queryParams.push(nakshatra);
      }
    }
    
    if (havingClause.length > 0) {
      baseQuery += ' HAVING ' + havingClause.join(' AND ');
    }

    baseQuery += ` ORDER BY 
      CASE WHEN (u.photo_1_status = 'APPROVED' AND u.photo_1 IS NOT NULL AND u.photo_1 != '') THEN 0 ELSE 1 END ASC,
      CASE UPPER(COALESCE(u.plan, 'FREE')) WHEN 'VIP' THEN 1 WHEN 'DIAMOND' THEN 2 WHEN 'PLATINUM' THEN 3 WHEN 'GOLD' THEN 4 WHEN 'SILVER' THEN 5 ELSE 6 END ASC,
      u.created_at DESC, 
      u.id DESC 
      LIMIT 1000`;

    const [users] = await pool.query(baseQuery, queryParams);
    const formattedProfiles = users.map(formatProfileCardData);
    
    res.status(200).json({ profiles: formattedProfiles });
  } catch (error) {
    console.error('Error in searchProfiles:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
};

// Claim 365-Day (1-Year) Free DIAMOND Trial
export const claimFreeTrial = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to claim free trial' });
    }

    const [userRows] = await pool.query(
      'SELECT id, profile_id, full_name, plan, is_free_trial_claimed FROM user_registration WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    if (user.is_free_trial_claimed === 1 || user.is_free_trial_claimed === true) {
      return res.status(400).json({ error: 'You have already claimed your 1-Year Free Trial!' });
    }

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);

    await pool.query(
      `UPDATE user_registration 
       SET plan = 'DIAMOND', 
           is_free_trial_claimed = 1, 
           subscription_start_date = ?, 
           subscription_expiry_date = ? 
       WHERE id = ?`,
      [now, expiryDate, userId]
    );

    try {
      await pool.query(
        `INSERT INTO bm_upgrade_history (user_id, payment_id, order_id, previous_plan, new_plan, credit_amount, payable_amount, created_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
        [userId, `FREE_CLAIM_${user.profile_id || userId}`, `ORD_FREE_TRIAL_365`, user.plan || 'FREE', 'DIAMOND (365 Days Free Trial)', now]
      );
    } catch (histErr) {
      console.warn('Could not insert upgrade history record:', histErr.message);
    }

    const [updatedUserRows] = await pool.query(
      'SELECT id, profile_id, full_name, email_address, plan, is_free_trial_claimed, subscription_start_date, subscription_expiry_date, created_at, photo_1, gender FROM user_registration WHERE id = ?',
      [userId]
    );

    const updatedUser = updatedUserRows[0];

    // Send membership invoice email for the activated Diamond Free Trial
    if (updatedUser && updatedUser.email_address) {
      sendInvoiceEmail({
        user: updatedUser,
        paymentId: `FREE_CLAIM_${updatedUser.profile_id || userId}`,
        orderId: `ORD_FREE_TRIAL_365`,
        planName: 'DIAMOND (1-Year Free Trial)',
        amount: 0,
        startDate: now,
        expiryDate,
        validityDays: 365,
        status: 'ACTIVATED'
      }).catch((mailErr) => console.error('[Diamond Claim Invoice Email Error]:', mailErr));
    }

    res.status(200).json({
      success: true,
      message: '🎉 Congratulations! Your 1-Year Free Diamond Plan has been successfully claimed and activated!',
      user: {
        ...updatedUser,
        plan: 'DIAMOND',
        effectivePlan: 'DIAMOND',
        is_free_trial_claimed: 1
      }
    });
  } catch (error) {
    console.error('Claim Free Trial Error:', error);
    res.status(500).json({ error: 'Failed to claim free trial. Please try again.' });
  }
};
