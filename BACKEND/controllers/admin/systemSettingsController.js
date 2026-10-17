import pool from '../../config/db.js';

// Default fallback settings
const defaultSettings = {
  siteName: "Bharath Marriage",
  supportEmail: "support@bharathmarriage.com",
  contactPhone: "+91 98450 12345",
  copyright: "© 2026 Bharath Marriage. All rights reserved.",
  minBrideAge: 18,
  minGroomAge: 21,
  maxPhotos: 5,
  autoVerifyProfiles: false,
  sessionExpiry: 60,
  enableCaptcha: true,
  maintenanceMode: false
};

const mapRowToSettings = (row) => {
  if (!row) return defaultSettings;
  return {
    siteName: row.site_name || defaultSettings.siteName,
    supportEmail: row.support_email || defaultSettings.supportEmail,
    contactPhone: row.contact_phone || defaultSettings.contactPhone,
    copyright: row.copyright || defaultSettings.copyright,
    minBrideAge: row.min_bride_age !== undefined && row.min_bride_age !== null ? Number(row.min_bride_age) : defaultSettings.minBrideAge,
    minGroomAge: row.min_groom_age !== undefined && row.min_groom_age !== null ? Number(row.min_groom_age) : defaultSettings.minGroomAge,
    maxPhotos: row.max_photos !== undefined && row.max_photos !== null ? Number(row.max_photos) : defaultSettings.maxPhotos,
    autoVerifyProfiles: Boolean(row.auto_verify_profiles),
    sessionExpiry: row.session_expiry !== undefined && row.session_expiry !== null ? Number(row.session_expiry) : defaultSettings.sessionExpiry,
    enableCaptcha: Boolean(row.enable_captcha),
    maintenanceMode: Boolean(row.maintenance_mode)
  };
};

export const getSystemSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bm_system_settings WHERE id = 1 LIMIT 1');
    if (rows.length === 0) {
      return res.status(200).json({ settings: defaultSettings });
    }
    return res.status(200).json({ settings: mapRowToSettings(rows[0]) });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return res.status(500).json({ error: 'Failed to fetch system settings' });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    const {
      siteName,
      supportEmail,
      contactPhone,
      copyright,
      minBrideAge,
      minGroomAge,
      maxPhotos,
      autoVerifyProfiles,
      sessionExpiry,
      enableCaptcha,
      maintenanceMode
    } = req.body;

    const sName = siteName || defaultSettings.siteName;
    const sEmail = supportEmail || defaultSettings.supportEmail;
    const cPhone = contactPhone || defaultSettings.contactPhone;
    const copy = copyright || defaultSettings.copyright;
    
    const brideAge = parseInt(minBrideAge, 10);
    const groomAge = parseInt(minGroomAge, 10);

    if (isNaN(brideAge) || brideAge < 18) {
      return res.status(400).json({ error: 'Minimum age limit for Bride cannot be less than 18 years.' });
    }

    if (isNaN(groomAge) || groomAge < 18) {
      return res.status(400).json({ error: 'Minimum age limit for Groom cannot be less than 18 years.' });
    }

    const photos = parseInt(maxPhotos, 10) || 5;
    const autoVerify = autoVerifyProfiles ? 1 : 0;
    const sessExp = parseInt(sessionExpiry, 10) || 60;
    const captcha = enableCaptcha ? 1 : 0;
    const maintenance = maintenanceMode ? 1 : 0;

    await pool.query(
      `INSERT INTO bm_system_settings 
        (id, site_name, support_email, contact_phone, copyright, min_bride_age, min_groom_age, max_photos, auto_verify_profiles, session_expiry, enable_captcha, maintenance_mode) 
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
        site_name = VALUES(site_name),
        support_email = VALUES(support_email),
        contact_phone = VALUES(contact_phone),
        copyright = VALUES(copyright),
        min_bride_age = VALUES(min_bride_age),
        min_groom_age = VALUES(min_groom_age),
        max_photos = VALUES(max_photos),
        auto_verify_profiles = VALUES(auto_verify_profiles),
        session_expiry = VALUES(session_expiry),
        enable_captcha = VALUES(enable_captcha),
        maintenance_mode = VALUES(maintenance_mode)`,
      [sName, sEmail, cPhone, copy, brideAge, groomAge, photos, autoVerify, sessExp, captcha, maintenance]
    );

    const [updatedRows] = await pool.query('SELECT * FROM bm_system_settings WHERE id = 1 LIMIT 1');
    const updatedSettings = mapRowToSettings(updatedRows[0]);

    return res.status(200).json({
      message: 'Website configurations and settings saved successfully!',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return res.status(500).json({ error: 'Failed to save system settings' });
  }
};
