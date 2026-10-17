import pool from '../../config/db.js';
import { ensureAccountClosureFeedbackTable } from '../user/accountSettingsController.js';

export const getAdminMarriageRequests = async (req, res) => {
  try {
    await ensureAccountClosureFeedbackTable();
    const { tab = 'all', search = '' } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (tab === 'pending') {
      whereConditions.push("f.partner_confirmation_status = 'PENDING'");
    } else if (tab === 'accepted') {
      whereConditions.push("f.partner_confirmation_status = 'ACCEPTED'");
    } else if (tab === 'rejected') {
      whereConditions.push("f.partner_confirmation_status = 'REJECTED'");
    } else if (tab === 'ads_eligible') {
      whereConditions.push("f.partner_confirmation_status = 'ACCEPTED' AND f.allow_advertisement = 1");
    } else if (tab === 'featured_ads') {
      whereConditions.push("f.is_featured_for_ads = 1");
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 1. Fetch records directly from bm_account_closure_feedback (safe from collation mismatches and JOIN errors)
    let feedbackRows = [];
    try {
      const [resRows] = await pool.query(
        `SELECT * FROM bm_account_closure_feedback f ${whereClause} ORDER BY f.created_at DESC`,
        queryParams
      );
      feedbackRows = resRows || [];
    } catch (queryErr) {
      console.error('Error querying bm_account_closure_feedback:', queryErr);
      feedbackRows = [];
    }

    // 2. Collect unique profile IDs for both requester and partner
    const profileIdSet = new Set();
    feedbackRows.forEach(f => {
      if (f.profile_id && typeof f.profile_id === 'string') profileIdSet.add(f.profile_id.trim());
      if (f.partner_profile_id && typeof f.partner_profile_id === 'string') profileIdSet.add(f.partner_profile_id.trim());
    });

    // 3. Fetch user details in a single query
    let userMap = {};
    if (profileIdSet.size > 0) {
      const ids = Array.from(profileIdSet);
      const placeholders = ids.map(() => '?').join(',');
      try {
        const [userRows] = await pool.query(
          `SELECT profile_id, full_name, email_address, mobile_number, gender, district, religion, status, photo_1 
           FROM user_registration 
           WHERE profile_id IN (${placeholders})`,
          ids
        );
        (userRows || []).forEach(u => {
          if (u.profile_id) {
            userMap[u.profile_id.trim().toLowerCase()] = u;
          }
        });
      } catch (userErr) {
        console.warn('Error fetching user profiles for marriage requests:', userErr.message);
      }
    }

    // 4. Map each feedback record with its requester and partner details
    let rows = feedbackRows.map(f => {
      const u_req = userMap[f.profile_id?.trim()?.toLowerCase()] || {};
      const u_part = userMap[f.partner_profile_id?.trim()?.toLowerCase()] || {};

      return {
        request_id: f.id,
        requester_profile_id: f.profile_id,
        partner_profile_id: f.partner_profile_id,
        action_type: f.action_type || 'DEACTIVATE',
        is_married: Boolean(f.is_married),
        found_via_platform: Boolean(f.found_via_platform),
        partner_confirmation_status: f.partner_confirmation_status || 'PENDING',
        partner_responded_at: f.partner_responded_at,
        allow_advertisement: Boolean(f.allow_advertisement),
        is_featured_for_ads: Boolean(f.is_featured_for_ads),
        marriage_source: f.marriage_source,
        reason: f.reason,
        feedback: f.feedback,
        couple_photo_1: f.couple_photo_1,
        couple_photo_2: f.couple_photo_2,
        created_at: f.created_at,

        // Requester Details
        requester_name: u_req.full_name || null,
        requester_email: u_req.email_address || null,
        requester_phone: u_req.mobile_number || null,
        requester_gender: u_req.gender || null,
        requester_district: u_req.district || null,
        requester_religion: u_req.religion || null,
        requester_status: u_req.status || null,
        requester_photo: u_req.photo_1 || null,

        // Partner Details
        partner_name: u_part.full_name || null,
        partner_email: u_part.email_address || null,
        partner_phone: u_part.mobile_number || null,
        partner_gender: u_part.gender || null,
        partner_district: u_part.district || null,
        partner_religion: u_part.religion || null,
        partner_status: u_part.status || null,
        partner_photo: u_part.photo_1 || null
      };
    });

    // 5. Apply search filter if provided
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter(r => 
        (r.requester_profile_id && r.requester_profile_id.toLowerCase().includes(s)) ||
        (r.partner_profile_id && r.partner_profile_id.toLowerCase().includes(s)) ||
        (r.requester_name && r.requester_name.toLowerCase().includes(s)) ||
        (r.partner_name && r.partner_name.toLowerCase().includes(s)) ||
        (r.requester_email && r.requester_email.toLowerCase().includes(s)) ||
        (r.partner_email && r.partner_email.toLowerCase().includes(s)) ||
        (r.requester_phone && r.requester_phone.toLowerCase().includes(s)) ||
        (r.partner_phone && r.partner_phone.toLowerCase().includes(s))
      );
    }

    // 6. Calculate metrics
    let metrics = { total: 0, pending: 0, accepted: 0, rejected: 0, ads_eligible: 0, featured_ads: 0 };
    try {
      const [counts] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN partner_confirmation_status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN partner_confirmation_status = 'ACCEPTED' THEN 1 ELSE 0 END), 0) as accepted,
          COALESCE(SUM(CASE WHEN partner_confirmation_status = 'REJECTED' THEN 1 ELSE 0 END), 0) as rejected,
          COALESCE(SUM(CASE WHEN partner_confirmation_status = 'ACCEPTED' AND allow_advertisement = 1 THEN 1 ELSE 0 END), 0) as ads_eligible,
          COALESCE(SUM(CASE WHEN is_featured_for_ads = 1 THEN 1 ELSE 0 END), 0) as featured_ads
        FROM bm_account_closure_feedback
      `);
      if (counts && counts.length > 0) {
        metrics = {
          total: Number(counts[0].total) || 0,
          pending: Number(counts[0].pending) || 0,
          accepted: Number(counts[0].accepted) || 0,
          rejected: Number(counts[0].rejected) || 0,
          ads_eligible: Number(counts[0].ads_eligible) || 0,
          featured_ads: Number(counts[0].featured_ads) || 0
        };
      }
    } catch (metricErr) {
      console.warn('Metrics query error:', metricErr.message);
    }

    res.status(200).json({
      success: true,
      requests: rows,
      metrics
    });
  } catch (error) {
    console.error('Error fetching admin marriage requests:', error);
    res.status(500).json({ error: error.message || 'Server error fetching marriage requests' });
  }
};

export const toggleFeaturedForAds = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const [existing] = await pool.query('SELECT * FROM bm_account_closure_feedback WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Marriage request not found' });
    }

    const item = existing[0];

    // Verify confirmation and user consent if turning ON
    if (isFeatured && (item.partner_confirmation_status !== 'ACCEPTED' || !item.allow_advertisement)) {
      return res.status(400).json({ 
        error: 'Cannot feature profile for ads unless the partner has accepted the match and granted advertisement consent.' 
      });
    }

    const targetVal = isFeatured ? 1 : 0;

    await pool.query(
      'UPDATE bm_account_closure_feedback SET is_featured_for_ads = ? WHERE id = ?',
      [targetVal, id]
    );

    res.status(200).json({
      success: true,
      is_featured_for_ads: Boolean(targetVal),
      message: targetVal === 1 
        ? 'Profile match successfully set as featured for advertisements & promotions!' 
        : 'Profile match removed from featured advertisements.'
    });
  } catch (error) {
    console.error('Error updating featured ads status:', error);
    res.status(500).json({ error: 'Server error updating featured ads status' });
  }
};

export const deleteAdminMarriageRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM bm_account_closure_feedback WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.status(200).json({ success: true, message: 'Marriage request record removed successfully' });
  } catch (error) {
    console.error('Error deleting marriage request record:', error);
    res.status(500).json({ error: 'Server error deleting marriage request record' });
  }
};

export const getPublicSuccessStories = async (req, res) => {
  try {
    await ensureAccountClosureFeedbackTable();

    // 1. Fetch featured stories directly from feedback table
    const [feedbackRows] = await pool.query(`
      SELECT 
        id,
        profile_id,
        partner_profile_id,
        feedback,
        reason,
        marriage_source,
        couple_photo_1,
        couple_photo_2,
        partner_responded_at,
        created_at
      FROM bm_account_closure_feedback
      WHERE is_featured_for_ads = 1 
        AND partner_confirmation_status = 'ACCEPTED' 
        AND allow_advertisement = 1
      ORDER BY created_at DESC
    `);

    // 2. Fetch requester and partner user details
    const profileIdSet = new Set();
    (feedbackRows || []).forEach(f => {
      if (f.profile_id) profileIdSet.add(f.profile_id.trim());
      if (f.partner_profile_id) profileIdSet.add(f.partner_profile_id.trim());
    });

    let userMap = {};
    if (profileIdSet.size > 0) {
      const ids = Array.from(profileIdSet);
      const placeholders = ids.map(() => '?').join(',');
      try {
        const [userRows] = await pool.query(
          `SELECT profile_id, full_name, gender, district, religion, photo_1, photo_1_status 
           FROM user_registration 
           WHERE profile_id IN (${placeholders})`,
          ids
        );
        (userRows || []).forEach(u => {
          if (u.profile_id) {
            userMap[u.profile_id.trim().toLowerCase()] = u;
          }
        });
      } catch (uErr) {
        console.warn('Error fetching user profiles for success stories:', uErr.message);
      }
    }

    const defaultCoupleImages = ['/default-couple.jpg', '/image1.jpg', '/image2.png'];

    const stories = (feedbackRows || []).map((f, index) => {
      const u_req = userMap[f.profile_id?.trim()?.toLowerCase()] || {};
      const u_part = userMap[f.partner_profile_id?.trim()?.toLowerCase()] || {};

      const reqName = u_req.full_name || f.profile_id || 'Bride/Groom';
      const partName = u_part.full_name || f.partner_profile_id || 'Partner';
      const names = `${reqName} & ${partName}`;

      let location = 'Kerala';
      if (u_req.district && u_part.district) {
        if (u_req.district.toLowerCase() === u_part.district.toLowerCase()) {
          location = `${u_req.district}, Kerala`;
        } else {
          location = `${u_req.district} & ${u_part.district}`;
        }
      } else if (u_req.district) {
        location = `${u_req.district}, Kerala`;
      } else if (u_part.district) {
        location = `${u_part.district}, Kerala`;
      }

      const dateObj = f.partner_responded_at || f.created_at || new Date();
      const weddingDate = new Date(dateObj).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      let image = null;
      let hasCouplePhoto = false;
      if (f.couple_photo_1) {
        image = f.couple_photo_1.startsWith('uploads/') ? `/${f.couple_photo_1}` : `/uploads/${f.couple_photo_1}`;
        hasCouplePhoto = true;
      } else if (f.couple_photo_2) {
        image = f.couple_photo_2.startsWith('uploads/') ? `/${f.couple_photo_2}` : `/uploads/${f.couple_photo_2}`;
        hasCouplePhoto = true;
      } else {
        image = defaultCoupleImages[index % defaultCoupleImages.length];
      }

      const quote = f.feedback && f.feedback.trim()
        ? (f.feedback.length > 120 ? f.feedback.substring(0, 117) + '...' : f.feedback)
        : `We found our soulmate through Bharath Marriage! Truly thankful for bringing our families together.`;

      const story = f.feedback && f.feedback.trim()
        ? f.feedback
        : `Our journey began on Bharath Marriage. From matching preferences to aligning with our cultural values and families, everything fell into place smoothly. We are excited to step into our happily ever after together!`;

      return {
        id: f.id,
        names,
        category: 'Kerala Marriages',
        location,
        weddingDate,
        image,
        hasCouplePhoto,
        couple_photo_1: f.couple_photo_1 ? (f.couple_photo_1.startsWith('uploads/') ? `/${f.couple_photo_1}` : `/uploads/${f.couple_photo_1}`) : null,
        couple_photo_2: f.couple_photo_2 ? (f.couple_photo_2.startsWith('uploads/') ? `/${f.couple_photo_2}` : `/uploads/${f.couple_photo_2}`) : null,
        requester_photo: u_req.photo_1 || null,
        partner_photo: u_part.photo_1 || null,
        requester_gender: u_req.gender || null,
        partner_gender: u_part.gender || null,
        isFeatured: index === 0,
        poruthamMatch: 'Verified Marriage Match',
        quote,
        story,
        tags: ['Verified Couple', 'Bharath Marriage Match', 'Community Blessed']
      };
    });

    res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    console.error('Error fetching public success stories:', error);
    res.status(500).json({ error: 'Server error fetching success stories' });
  }
};
