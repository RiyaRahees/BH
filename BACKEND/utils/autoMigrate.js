import pool from '../config/db.js';
import { ensureAccountClosureFeedbackTable, ensureAccountDeletionColumns } from '../controllers/user/accountSettingsController.js';

export const autoMigrate = async () => {
  try {
    console.log('[AutoMigrate] Checking and ensuring database tables & columns...');

    // 1. Ensure user_registration subscription columns exist
    try {
      const [subCols] = await pool.query(`SHOW COLUMNS FROM user_registration LIKE 'subscription_start_date'`);
      if (subCols.length === 0) {
        await pool.query(`
          ALTER TABLE user_registration 
          ADD COLUMN subscription_start_date DATETIME NULL AFTER plan,
          ADD COLUMN subscription_expiry_date DATETIME NULL AFTER subscription_start_date
        `);
        console.log('[AutoMigrate] Added subscription_start_date & subscription_expiry_date to user_registration.');
      }
    } catch (subErr) {
      console.warn('[AutoMigrate Warning] Step 1 subscription columns:', subErr.message);
    }

    // Ensure account deletion & deactivation columns exist in user_registration
    try {
      await ensureAccountDeletionColumns();
    } catch (delColErr) {
      console.warn('[AutoMigrate Warning] Step 1b account deletion columns:', delColErr.message);
    }

    // 2. Ensure bm_chat_messages table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_chat_messages (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          sender_id BIGINT NOT NULL,
          receiver_id BIGINT NOT NULL,
          message TEXT NOT NULL,
          read_status BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_sender_receiver (sender_id, receiver_id),
          INDEX idx_receiver_sender (receiver_id, sender_id),
          INDEX idx_created_at (created_at)
        )
      `);
    } catch (chatErr) {
      console.warn('[AutoMigrate Warning] Step 2 bm_chat_messages:', chatErr.message);
    }

    // Ensure bm_interests table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_interests (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          sender_id VARCHAR(20) NOT NULL,
          receiver_id VARCHAR(20) NOT NULL,
          status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_interest (sender_id, receiver_id),
          INDEX idx_sender (sender_id),
          INDEX idx_receiver (receiver_id)
        )
      `);
    } catch (interestErr) {
      console.warn('[AutoMigrate Warning] Step 2 bm_interests:', interestErr.message);
    }

    // Ensure detailed address and employment columns exist in profile tables
    const profileTables = ['hindus', 'christians', 'muslims', 'others'];
    const newAddressCols = [
      { name: 'house_name', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'street_locality', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'post_office', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'employment_status', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'employment_country', type: 'VARCHAR(100) DEFAULT NULL' }
    ];

    for (const table of profileTables) {
      for (const col of newAddressCols) {
        try {
          const [existing] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE '${col.name}'`);
          if (existing.length === 0) {
            await pool.query(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
            console.log(`[AutoMigrate] Added ${col.name} column to ${table} table.`);
          }
        } catch (colErr) {
          console.warn(`[AutoMigrate Warning] Could not check/add ${col.name} on ${table}:`, colErr.message);
        }
      }
    }

    // 3. Ensure bm_upgrade_history table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_upgrade_history (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          previous_plan VARCHAR(50) NOT NULL,
          new_plan VARCHAR(50) NOT NULL,
          credit_amount DECIMAL(10, 2) NOT NULL,
          payable_amount DECIMAL(10, 2) NOT NULL,
          payment_id VARCHAR(100) NOT NULL,
          order_id VARCHAR(100) NOT NULL,
          expiry_date DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id)
        )
      `);

      const [expCols] = await pool.query(`SHOW COLUMNS FROM bm_upgrade_history LIKE 'expiry_date'`);
      if (expCols.length === 0) {
        await pool.query(`ALTER TABLE bm_upgrade_history ADD COLUMN expiry_date DATETIME NULL AFTER order_id`);
        console.log('[AutoMigrate] Added expiry_date column to bm_upgrade_history.');
      }
    } catch (upErr) {
      console.warn('[AutoMigrate Warning] Step 3 bm_upgrade_history:', upErr.message);
    }

    // 4. Ensure bm_profile_reports table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_profile_reports (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          reporter_profile_id VARCHAR(50) NOT NULL,
          reported_profile_id VARCHAR(50) NOT NULL,
          reason VARCHAR(255) NOT NULL,
          details TEXT,
          status ENUM('PENDING', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_reporter (reporter_profile_id),
          INDEX idx_reported (reported_profile_id)
        )
      `);
    } catch (repErr) {
      console.warn('[AutoMigrate Warning] Step 4 bm_profile_reports:', repErr.message);
    }

    // 5. Ensure bm_head_franchise_requests table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_head_franchise_requests (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          request_id VARCHAR(50) NOT NULL UNIQUE,
          profile_id VARCHAR(50) NOT NULL,
          pincode VARCHAR(20) NOT NULL,
          status ENUM('Unassigned', 'Assigned', 'Rejected') DEFAULT 'Unassigned',
          assigned_franchise_id VARCHAR(50) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_profile (profile_id),
          INDEX idx_status (status),
          INDEX idx_pincode (pincode)
        )
      `);
    } catch (hfErr) {
      console.warn('[AutoMigrate Warning] Step 5 bm_head_franchise_requests:', hfErr.message);
    }

    // 6. Ensure caste columns exist in religion tables & user_registration
    for (const tbl of ['user_registration', 'hindus', 'christians', 'muslims', 'others']) {
      try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM ${tbl} LIKE 'caste'`);
        if (cols.length === 0) {
          await pool.query(`ALTER TABLE ${tbl} ADD COLUMN caste VARCHAR(100) DEFAULT NULL`);
          console.log(`[AutoMigrate] Added caste column to ${tbl}.`);
        }
      } catch (err) {
        console.error(`[AutoMigrate] Error adding caste column to ${tbl}:`, err.message);
      }
    }

    // 7. Ensure bm_castes table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_castes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        religion VARCHAR(50) NOT NULL,
        caste_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_caste_religion (religion, caste_name)
      )
    `);

    // Seed default Hindu castes
    const hinduCasteList = [
      "Adi Andhra", "Adi Dravida", "Adi Karnataka", "Adiyan", "Agamudayar", "Agasa", "Ajila", "Ambalakkaran",
      "Ambalavasi", "Anchunadu Vellalars", "Aranadan", "Arandan", "Araya", "Arayan", "Aremahrati", "Arunthathiyar",
      "Arya", "Arya Vysya", "Ayyanavar", "Badaga", "Baira", "Bakuda", "Bandari", "Bathada", "Bestha", "Bharathar",
      "Bhattathiri", "Billava", "Blacksmith Viswakarma", "Boyan", "Brahmin", "Brahmin - Tamil", "Brahmin / Namboothiri",
      "Bunt", "Carpenter Viswakarma", "Chakkala", "Chakkala Nair", "Chakkiliyan", "Chakliyan", "Chaliya", "Chavalakaran",
      "Chavalakkaran", "Cheramar", "Cheruman", "Chettiar", "Chettiyar", "Chetty", "Chetty - Tamil", "Cholanaickan",
      "Devadiga", "Devanga", "Devender", "Dheevara", "Domban", "Elayathu", "Embrandiri", "Eravallan", "Ezhava",
      "Ezhavan", "Ezhavathi", "Ezhavathy", "Ezhuthachan", "Ganaka", "Ganika", "Gatti", "Gauda Sar. Brahmin",
      "Goldsmith Viswakarma", "Gowda", "Gupthan", "Guruckal", "Haveega Brahmin", "Hegde", "Holeya", "Ilayath",
      "Irular", "Iyengar", "Iyer", "Jain", "Jogi", "Kadar", "Kadaiyan", "Kadupattan", "Kaikolan", "Kaimal",
      "Kakkan", "Kakkalan", "Kalladi", "Kallasari", "Kalthachan", "Kammala", "Kammalan", "Kammalar", "Kamsala",
      "Kanakkan", "Kani", "Kanikkar", "Kanisan", "Kanisu", "Kaniyan", "Kaniyar", "Kannan", "Kartha", "Karuvan",
      "Kavadia", "Kavara", "Kavudiyaru", "Kavuthiyan", "Kavuthiyya", "Keralal Mudali", "Kitaran", "Kollan",
      "Komati", "Kongu Navithan", "Kongu Vellala Gounder", "Koodan", "Koppula Velama", "Koraga", "Korava",
      "Kottar Chettiar", "Kshatriya", "Kudiya", "Kudumban", "Kudumbi", "Kudumbis", "Kulala", "Kumara Kshatriya",
      "Kumbaran", "Kumbhar", "Kumhar", "Kummari", "Kunnuvar Mannadi", "Kurava", "Kuravan", "Kurichchan",
      "Kurichiyan", "Kuruba", "Kuruman", "Kurumans", "Kurumban", "Kurumbas", "Kurup", "Kusavan", "Lambani",
      "Lingayat", "Madhwa Brahmin", "Madiga", "Madivala", "Mala", "Malai Arayan", "Malai Pandaram", "Malai Vedan",
      "Malakkuravan", "Malasar", "Malayan", "Malayarayar", "Mannadiar", "Mannan", "Marar", "Maratha", "Maravans",
      "Maruthuvar", "Mavilan", "Menon", "Mogaveera", "Moger", "Moosad", "Mukkuva", "Mukkuvan", "Mukkuvar",
      "Mundala", "Munnuru Kapu", "Muthuvan", "Nadar", "Naidu", "Nair", "Nambiar", "Namboodiri", "Namboothiri",
      "Nayadi", "Nayaka", "Nayee Brahmin", "Niyogi Brahmin", "Nulayan", "Odans", "Other", "Padmashali",
      "Pallar", "Palliyan", "Palliyar", "Pambada", "Panan", "Panicker", "Paraiyan", "Paravan", "Parayan",
      "Parayar", "Pattari", "Pattariyas", "Peruvannan", "Pillai", "Pisharody", "Prajapati", "Pulaya", "Pulayan",
      "Pulayar", "Pulluvan", "Puthirai Vannan", "Rajapur", "Rajput", "Reddiar", "Reddy", "Saliya", "Samagara",
      "Samban", "Sambava", "Sambavar", "Senai Thalavan", "Sengunthar", "Shetty", "Sourashtra", "Sowrashtra",
      "Sutar", "Thachan", "Thandan", "Thattan", "Thevar", "Thiyya", "Tholkollan", "Thottian", "Tigala",
      "Tuluva", "Tuluva Brahmin", "Ulladan", "Uppara", "Uraly", "V - Nair", "Vada Balija", "Vadugan", "Vadukans",
      "Vakkaliga", "Valluvan", "Vannathan", "Vanniyar", "Variar", "Velaan", "Velaar", "Velama", "Vellala",
      "Vellalar", "Veluthedan", "Vettakuruman", "Vettuva", "Vettuvan", "Vishwakarma", "Viswabrahmin",
      "Viswakarma", "Viswakarmala", "Vokkaliga", "Warrier", "Yadava"
    ];

    for (const cname of hinduCasteList) {
      await pool.query('INSERT IGNORE INTO bm_castes (religion, caste_name) VALUES (?, ?)', ['Hindu', cname]);
    }

    const otherCastes = [
      ['Christian', 'Roman Catholic (RC)'], ['Christian', 'Syro Malabar'], ['Christian', 'Latin Catholic'],
      ['Christian', 'Knanaya'], ['Christian', 'Jacobite'], ['Christian', 'Orthodox'], ['Christian', 'Marthoma'],
      ['Christian', 'Pentecost'], ['Christian', 'CSI'], ['Christian', 'Catholic'], ['Christian', 'Protestant'],
      ['Muslim', 'Sunni'], ['Muslim', 'Mujahid'], ['Muslim', 'Shafi'], ['Muslim', 'Hanafi'], ['Muslim', 'Thangal'],
      ['Other', 'General']
    ];
    for (const [rel, cname] of otherCastes) {
      await pool.query('INSERT IGNORE INTO bm_castes (religion, caste_name) VALUES (?, ?)', [rel, cname]);
    }

    // 8. Ensure is_free_trial_claimed column exists in user_registration
    try {
      const [claimCols] = await pool.query(`SHOW COLUMNS FROM user_registration LIKE 'is_free_trial_claimed'`);
      if (claimCols.length === 0) {
        await pool.query(`
          ALTER TABLE user_registration 
          ADD COLUMN is_free_trial_claimed TINYINT(1) DEFAULT 0 AFTER subscription_expiry_date
        `);
        console.log('[AutoMigrate] Added is_free_trial_claimed column to user_registration.');
      }

      // Reset users whose trial is unclaimed back to FREE plan
      await pool.query(`
        UPDATE user_registration 
        SET plan = 'FREE', subscription_start_date = NULL, subscription_expiry_date = NULL
        WHERE is_free_trial_claimed IS NULL OR is_free_trial_claimed = 0
      `);
      console.log('[AutoMigrate] Unclaimed users set to FREE plan (ready for 365-day claim).');
    } catch (migErr) {
      console.error('[AutoMigrate] Error updating user_registration for free trial claims:', migErr.message);
    }

    // 9. Ensure bm_system_settings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_system_settings (
        id INT PRIMARY KEY DEFAULT 1,
        site_name VARCHAR(255) DEFAULT 'Bharath Marriage',
        support_email VARCHAR(255) DEFAULT 'support@bharathmarriage.com',
        contact_phone VARCHAR(100) DEFAULT '+91 98450 12345',
        copyright VARCHAR(255) DEFAULT '© 2026 Bharath Marriage. All rights reserved.',
        min_bride_age INT DEFAULT 18,
        min_groom_age INT DEFAULT 21,
        max_photos INT DEFAULT 5,
        auto_verify_profiles BOOLEAN DEFAULT FALSE,
        session_expiry INT DEFAULT 60,
        enable_captcha BOOLEAN DEFAULT TRUE,
        maintenance_mode BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [settingsCount] = await pool.query('SELECT COUNT(*) as count FROM bm_system_settings');
    if (settingsCount[0].count === 0) {
      await pool.query(`
        INSERT IGNORE INTO bm_system_settings 
        (id, site_name, support_email, contact_phone, copyright, min_bride_age, min_groom_age, max_photos, auto_verify_profiles, session_expiry, enable_captcha, maintenance_mode) 
        VALUES 
        (1, 'Bharath Marriage', 'support@bharathmarriage.com', '+91 98450 12345', '© 2026 Bharath Marriage. All rights reserved.', 18, 21, 5, FALSE, 60, TRUE, FALSE)
      `);
      console.log('[AutoMigrate] Seeded initial system settings row into bm_system_settings.');
    }

    // 10. Ensure bm_franchise_partnership_requests table exists & columns are up to date
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bm_franchise_partnership_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        district VARCHAR(100) DEFAULT NULL,
        pincode VARCHAR(20) DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        verification_token VARCHAR(255) DEFAULT NULL,
        token_expires_at DATETIME DEFAULT NULL,
        token_used TINYINT(1) DEFAULT 0,
        admin_remarks TEXT DEFAULT NULL,
        reviewed_by VARCHAR(100) DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_token (verification_token)
      )
    `);

    try {
      const [distCols] = await pool.query(`SHOW COLUMNS FROM bm_franchise_partnership_requests LIKE 'district'`);
      if (distCols.length === 0) {
        await pool.query(`
          ALTER TABLE bm_franchise_partnership_requests 
          ADD COLUMN district VARCHAR(100) DEFAULT NULL AFTER email,
          ADD COLUMN pincode VARCHAR(20) DEFAULT NULL AFTER district
        `);
      }

      // Ensure status column is VARCHAR(50) so new statuses like VERIFICATION_PENDING, VERIFICATION_SUBMITTED work without ENUM truncation
      await pool.query(`ALTER TABLE bm_franchise_partnership_requests MODIFY COLUMN status VARCHAR(50) DEFAULT 'PENDING'`);

      const [tokenCols] = await pool.query(`SHOW COLUMNS FROM bm_franchise_partnership_requests LIKE 'verification_token'`);
      if (tokenCols.length === 0) {
        await pool.query(`
          ALTER TABLE bm_franchise_partnership_requests
          ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL AFTER status,
          ADD COLUMN token_expires_at DATETIME DEFAULT NULL AFTER verification_token,
          ADD COLUMN token_used TINYINT(1) DEFAULT 0 AFTER token_expires_at,
          ADD COLUMN admin_remarks TEXT DEFAULT NULL AFTER token_used,
          ADD COLUMN reviewed_by VARCHAR(100) DEFAULT NULL AFTER admin_remarks,
          ADD COLUMN reviewed_at DATETIME DEFAULT NULL AFTER reviewed_by
        `);
        console.log('[AutoMigrate] Added verification token & audit columns to bm_franchise_partnership_requests.');
      }
    } catch (migErr) {
      console.warn('[AutoMigrate] Column check on bm_franchise_partnership_requests:', migErr.message);
    }

    // 10b. Ensure bm_franchise_verifications table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_franchise_verifications (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          request_id VARCHAR(50) NOT NULL,
          applicant_type ENUM('organization', 'individual') NOT NULL,
          form_data JSON NOT NULL,
          documents JSON NOT NULL,
          preferred_pincodes JSON DEFAULT NULL,
          status ENUM('SUBMITTED', 'APPROVED', 'REJECTED') DEFAULT 'SUBMITTED',
          admin_remarks TEXT NULL,
          reviewed_by VARCHAR(100) NULL,
          reviewed_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_request (request_id),
          INDEX idx_status (status)
        )
      `);
      console.log('[AutoMigrate] Checked/created bm_franchise_verifications table.');
    } catch (verErr) {
      console.warn('[AutoMigrate Warning] bm_franchise_verifications table check:', verErr.message);
    }

    // 10c. Ensure bm_franchise_audit_logs table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_franchise_audit_logs (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          request_id VARCHAR(50) NULL,
          franchise_id VARCHAR(50) NULL,
          action VARCHAR(100) NOT NULL,
          performed_by VARCHAR(100) DEFAULT 'SYSTEM',
          details TEXT NULL,
          ip_address VARCHAR(45) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_request (request_id),
          INDEX idx_franchise (franchise_id),
          INDEX idx_action (action)
        )
      `);
      console.log('[AutoMigrate] Checked/created bm_franchise_audit_logs table.');
    } catch (auditErr) {
      console.warn('[AutoMigrate Warning] bm_franchise_audit_logs table check:', auditErr.message);
    }

    // 11. Ensure bm_staff_data permissions column exists
    try {
      const [permCols] = await pool.query(`SHOW COLUMNS FROM bm_staff_data LIKE 'permissions'`);
      if (permCols.length === 0) {
        await pool.query(`
          ALTER TABLE bm_staff_data 
          ADD COLUMN permissions TEXT NULL AFTER role
        `);
        console.log('[AutoMigrate] Added permissions column to bm_staff_data.');
      }
    } catch (permErr) {
      console.warn('[AutoMigrate] Column check on bm_staff_data permissions:', permErr.message);
    }

    // 12. Ensure bm_staff_data role column is VARCHAR(255) instead of ENUM
    try {
      await pool.query(`ALTER TABLE bm_staff_data MODIFY COLUMN role VARCHAR(255) NOT NULL`);
      console.log('[AutoMigrate] Ensured role column in bm_staff_data is VARCHAR(255).');
    } catch (roleErr) {
      console.warn('[AutoMigrate] Column check on bm_staff_data role:', roleErr.message);
    }

    // 13. Ensure user_reports table and appeal columns exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reporter_profile_id VARCHAR(20) NOT NULL,
          reported_profile_id VARCHAR(20) NOT NULL,
          reason VARCHAR(255) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status ENUM('PENDING','RESOLVED','DISMISSED') DEFAULT 'PENDING',
          appeal_status VARCHAR(50) DEFAULT 'NONE',
          appeal_message TEXT DEFAULT NULL,
          appealed_at TIMESTAMP NULL DEFAULT NULL,
          INDEX idx_reported (reported_profile_id),
          INDEX idx_reporter (reporter_profile_id)
        )
      `);

      const [appealCols] = await pool.query(`SHOW COLUMNS FROM user_reports LIKE 'appeal_status'`);
      if (appealCols.length === 0) {
        await pool.query(`
          ALTER TABLE user_reports 
          ADD COLUMN appeal_status VARCHAR(50) DEFAULT 'NONE' AFTER status,
          ADD COLUMN appeal_message TEXT NULL AFTER appeal_status,
          ADD COLUMN appealed_at TIMESTAMP NULL DEFAULT NULL AFTER appeal_message
        `);
        console.log('[AutoMigrate] Added appeal_status, appeal_message, appealed_at to user_reports.');
      }
    } catch (reportMigErr) {
      console.warn('[AutoMigrate] user_reports table/column check:', reportMigErr.message);
    }

    // 14. Ensure photo status columns exist in user_registration
    try {
      const [photoStatusCols] = await pool.query(`SHOW COLUMNS FROM user_registration LIKE 'photo_1_status'`);
      if (photoStatusCols.length === 0) {
        await pool.query(`
          ALTER TABLE user_registration 
          ADD COLUMN photo_1_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED' AFTER photo_1,
          ADD COLUMN photo_2_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED' AFTER photo_2,
          ADD COLUMN photo_3_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED' AFTER photo_3,
          ADD COLUMN photo_4_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED' AFTER photo_4,
          ADD COLUMN photo_rejection_reason VARCHAR(255) DEFAULT NULL AFTER photo_4_status
        `);
        console.log('[AutoMigrate] Added photo_1_status, photo_2_status, photo_3_status, photo_4_status to user_registration.');
      }
    } catch (photoMigErr) {
      console.warn('[AutoMigrate] photo status column check:', photoMigErr.message);
    }

    // 15. Format / capitalize existing user names in user_registration & religion profile tables
    try {
      const [users] = await pool.query('SELECT id, profile_id, full_name FROM user_registration WHERE full_name IS NOT NULL AND full_name != ""');
      for (const u of users) {
        if (!u.full_name || !u.full_name.trim()) continue;
        const formattedName = u.full_name
          .trim()
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        
        if (formattedName !== u.full_name) {
          await pool.query('UPDATE user_registration SET full_name = ? WHERE id = ?', [formattedName, u.id]);
          if (u.profile_id) {
            await pool.query('UPDATE hindus SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
            await pool.query('UPDATE christians SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
            await pool.query('UPDATE muslims SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
            await pool.query('UPDATE others SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
          }
        }
      }
      // Also format staff names in bm_staff_data
      try {
        const [staffs] = await pool.query('SELECT id, staff_id, name FROM bm_staff_data WHERE name IS NOT NULL AND name != ""');
        for (const s of staffs) {
          if (!s.name || !s.name.trim()) continue;
          const formattedStaffName = s.name
            .trim()
            .split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
          if (formattedStaffName !== s.name) {
            await pool.query('UPDATE bm_staff_data SET name = ? WHERE id = ?', [formattedStaffName, s.id]);
          }
        }
        console.log('[AutoMigrate] Checked and formatted existing staff names to Title Case.');
      } catch (staffNameErr) {
        console.warn('[AutoMigrate] Staff name formatting check:', staffNameErr.message);
      }
    } catch (nameErr) {
      console.warn('[AutoMigrate] User name formatting check:', nameErr.message);
    }

    // 16. Ensure bm_account_closure_feedback table exists
    try {
      await ensureAccountClosureFeedbackTable();
      console.log('[AutoMigrate] Checked/created bm_account_closure_feedback table.');
    } catch (feedbackErr) {
      console.warn('[AutoMigrate] bm_account_closure_feedback table check:', feedbackErr.message);
    }

    // 17. Ensure bm_franchise_reports table exists for staff reports
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bm_franchise_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          franchise_id VARCHAR(100) NOT NULL,
          franchise_name VARCHAR(255) NOT NULL,
          staff_id VARCHAR(100) NULL,
          staff_name VARCHAR(255) NOT NULL,
          report_type VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'Normal',
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          metrics_notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_franchise (franchise_id),
          INDEX idx_created (created_at)
        )
      `);
      console.log('[AutoMigrate] Checked/created bm_franchise_reports table.');
    } catch (repErr) {
      console.warn('[AutoMigrate] bm_franchise_reports table check:', repErr.message);
    }

    // 18. Ensure mother_tongue column exists in user_registration and religion profile tables
    try {
      const motherTongueTables = ['user_registration', 'hindus', 'christians', 'muslims', 'others'];
      for (const tbl of motherTongueTables) {
        const [mtCols] = await pool.query(`SHOW COLUMNS FROM ${tbl} LIKE 'mother_tongue'`);
        if (mtCols.length === 0) {
          await pool.query(`ALTER TABLE ${tbl} ADD COLUMN mother_tongue VARCHAR(100) DEFAULT NULL`);
          console.log(`[AutoMigrate] Added mother_tongue column to ${tbl}.`);
        }
      }
    } catch (mtErr) {
      console.warn('[AutoMigrate] mother_tongue column check:', mtErr.message);
    }

    // 19. Ensure planetary_positions table exists
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
      console.log('[AutoMigrate] Checked/created planetary_positions table.');
    } catch (astErr) {
      console.warn('[AutoMigrate] planetary_positions table check:', astErr.message);
    }

    // 20. Ensure assigned_franchise_id column exists on user_registration and index is created
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM user_registration LIKE 'assigned_franchise_id'`);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE user_registration ADD COLUMN assigned_franchise_id VARCHAR(50) DEFAULT NULL AFTER status`);
        console.log('[AutoMigrate] Added assigned_franchise_id column to user_registration.');
      }

      // Check index
      const [idx] = await pool.query(`SHOW INDEX FROM user_registration WHERE Key_name = 'idx_assigned_franchise'`);
      if (idx.length === 0) {
        await pool.query(`ALTER TABLE user_registration ADD INDEX idx_assigned_franchise (assigned_franchise_id)`);
        console.log('[AutoMigrate] Created idx_assigned_franchise index on user_registration.');
      }

      // Backfill: If user has no assigned_franchise_id, check if their pincode belongs to an active franchise
      const [activeFranchises] = await pool.query(`SELECT franchise_id, pin_codes FROM bm_franchise WHERE LOWER(status) = 'active'`);
      for (const f of activeFranchises) {
        let pCodes = f.pin_codes;
        if (typeof pCodes === 'string') {
          try { pCodes = JSON.parse(pCodes); } catch (e) { pCodes = []; }
        }
        if (Array.isArray(pCodes) && pCodes.length > 0) {
          const cleanCodes = pCodes.map(String).map(s => s.trim()).filter(Boolean);
          if (cleanCodes.length > 0) {
            const placeholders = cleanCodes.map(() => '?').join(',');
            await pool.query(
              `UPDATE user_registration ur
               LEFT JOIN hindus h ON ur.profile_id = h.profile_id
               LEFT JOIN christians c ON ur.profile_id = c.profile_id
               LEFT JOIN muslims m ON ur.profile_id = m.profile_id
               LEFT JOIN others o ON ur.profile_id = o.profile_id
               SET ur.assigned_franchise_id = ?
               WHERE ur.assigned_franchise_id IS NULL
                 AND COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) IN (${placeholders})`,
              [f.franchise_id, ...cleanCodes]
            );
          }
        }
      }
    } catch (afErr) {
      console.warn('[AutoMigrate] assigned_franchise_id check/backfill:', afErr.message);
    }

    console.log('[AutoMigrate] All database tables and columns are up to date!');
  } catch (error) {
    console.error('[AutoMigrate Error]', error);
  }
};

