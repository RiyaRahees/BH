/**
 * ============================================================
 * DUMMY PROFILE SEED SCRIPT
 * Bharath Marriage - Kerala
 * ============================================================
 * Creates 15 realistic Kerala dummy profiles:
 *   - 5 Hindu profiles (mix of male/female)
 *   - 5 Muslim profiles (mix of male/female)
 *   - 5 Christian profiles (mix of male/female)
 *
 * HOW TO RUN:
 *   1. Upload this file to your server's BACKEND/scripts/ folder
 *   2. SSH into your server and navigate to the BACKEND folder
 *   3. Run: node scripts/seed_dummy_profiles.js
 *
 * NOTE: Uses the LIVE .env credentials automatically.
 * ============================================================
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

// ─── Kerala District Codes ─────────────────────────────────
const DISTRICTS = [
  { name: '01-Thiruvananthapuram', code: '01', place: 'Thiruvananthapuram' },
  { name: '02-Kollam',             code: '02', place: 'Kollam' },
  { name: '07-Ernakulam',          code: '07', place: 'Ernakulam' },
  { name: '11-Kozhikode',          code: '11', place: 'Kozhikode' },
  { name: '13-Kannur',             code: '13', place: 'Kannur' },
];

// ─── Dummy Profile Data ────────────────────────────────────
const profiles = [
  // ── HINDU PROFILES ──────────────────────────────────────
  {
    religion: 'Hindu',
    full_name: 'Arjun Krishnan',
    gender: 'Male',
    dob: '1996-05-14',
    district_obj: DISTRICTS[2], // Ernakulam
    mobile_number: '9876100001',
    email_address: 'arjun.krishnan.dummy@bhtest.in',
    height: "5'10\"",
    education: 'B.Tech',
    profession: 'Software Engineer',
    marital_status: 'Never Married',
    about_me: 'Simple, family-oriented person looking for a life partner. I love travelling and cooking.',
    place: 'Ernakulam',
    state: 'Kerala',
    country: 'India',
    pincode: '682001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Meera Nair',
    gender: 'Female',
    dob: '1998-08-22',
    district_obj: DISTRICTS[0], // Thiruvananthapuram
    mobile_number: '9876100002',
    email_address: 'meera.nair.dummy@bhtest.in',
    height: "5'4\"",
    education: 'MBA',
    profession: 'Business Analyst',
    marital_status: 'Never Married',
    about_me: 'Fun-loving and ambitious. Looking for a well-educated partner who values family.',
    place: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    pincode: '695001',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Rahul Menon',
    gender: 'Male',
    dob: '1994-11-30',
    district_obj: DISTRICTS[3], // Kozhikode
    mobile_number: '9876100003',
    email_address: 'rahul.menon.dummy@bhtest.in',
    height: "5'8\"",
    education: 'MBBS',
    profession: 'Doctor',
    marital_status: 'Never Married',
    about_me: 'Hardworking doctor seeking a caring and understanding life partner.',
    place: 'Kozhikode',
    state: 'Kerala',
    country: 'India',
    pincode: '673001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Priya Pillai',
    gender: 'Female',
    dob: '2000-03-15',
    district_obj: DISTRICTS[1], // Kollam
    mobile_number: '9876100004',
    email_address: 'priya.pillai.dummy@bhtest.in',
    height: "5'3\"",
    education: 'B.Com',
    profession: 'Accountant',
    marital_status: 'Never Married',
    about_me: 'I am cheerful and family-oriented. I enjoy cooking and music.',
    place: 'Kollam',
    state: 'Kerala',
    country: 'India',
    pincode: '691001',
    plan: 'FREE',
    verification: 'UNVERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Vishnu Kumar',
    gender: 'Male',
    dob: '1993-07-07',
    district_obj: DISTRICTS[4], // Kannur
    mobile_number: '9876100005',
    email_address: 'vishnu.kumar.dummy@bhtest.in',
    height: "6'0\"",
    education: 'M.Tech',
    profession: 'Civil Engineer',
    marital_status: 'Never Married',
    about_me: 'Sincere and goal-oriented. I value tradition and modern thinking equally.',
    place: 'Kannur',
    state: 'Kerala',
    country: 'India',
    pincode: '670001',
    plan: 'SILVER',
    verification: 'VERIFIED',
  },

  // ── MUSLIM PROFILES ─────────────────────────────────────
  {
    religion: 'Muslim',
    full_name: 'Muhammed Shareef',
    gender: 'Male',
    dob: '1995-04-20',
    district_obj: DISTRICTS[3], // Kozhikode
    mobile_number: '9876100006',
    email_address: 'muhammed.shareef.dummy@bhtest.in',
    height: "5'9\"",
    education: 'B.Sc',
    profession: 'Teacher',
    marital_status: 'Never Married',
    about_me: 'A practicing Muslim who believes in honest relationships. Love books and nature.',
    place: 'Kozhikode',
    state: 'Kerala',
    country: 'India',
    pincode: '673305',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Fathima Zara',
    gender: 'Female',
    dob: '1999-09-10',
    district_obj: DISTRICTS[4], // Kannur
    mobile_number: '9876100007',
    email_address: 'fathima.zara.dummy@bhtest.in',
    height: "5'5\"",
    education: 'B.Ed',
    profession: 'Teacher',
    marital_status: 'Never Married',
    about_me: 'Simple, religious girl seeking a pious and responsible life partner.',
    place: 'Kannur',
    state: 'Kerala',
    country: 'India',
    pincode: '670002',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Abdul Rasheed',
    gender: 'Male',
    dob: '1992-12-05',
    district_obj: DISTRICTS[2], // Ernakulam
    mobile_number: '9876100008',
    email_address: 'abdul.rasheed.dummy@bhtest.in',
    height: "5'11\"",
    education: 'MBA',
    profession: 'Business Owner',
    marital_status: 'Never Married',
    about_me: 'Entrepreneur with a vision. Looking for a supportive and educated partner.',
    place: 'Ernakulam',
    state: 'Kerala',
    country: 'India',
    pincode: '682002',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Aisha Nabeela',
    gender: 'Female',
    dob: '2001-02-28',
    district_obj: DISTRICTS[0], // Thiruvananthapuram
    mobile_number: '9876100009',
    email_address: 'aisha.nabeela.dummy@bhtest.in',
    height: "5'2\"",
    education: 'BCA',
    profession: 'IT Professional',
    marital_status: 'Never Married',
    about_me: 'Tech-savvy and creative. I love art and believe in a balanced life.',
    place: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    pincode: '695002',
    plan: 'FREE',
    verification: 'UNVERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Riyas Basheer',
    gender: 'Male',
    dob: '1997-06-18',
    district_obj: DISTRICTS[1], // Kollam
    mobile_number: '9876100010',
    email_address: 'riyas.basheer.dummy@bhtest.in',
    height: "5'8\"",
    education: 'B.Pharmacy',
    profession: 'Pharmacist',
    marital_status: 'Never Married',
    about_me: 'Calm and responsible. Looking for a caring and understanding partner.',
    place: 'Kollam',
    state: 'Kerala',
    country: 'India',
    pincode: '691002',
    plan: 'SILVER',
    verification: 'VERIFIED',
  },

  // ── CHRISTIAN PROFILES ───────────────────────────────────
  {
    religion: 'Christian',
    full_name: 'Thomas Varghese',
    gender: 'Male',
    dob: '1994-01-25',
    district_obj: DISTRICTS[2], // Ernakulam
    mobile_number: '9876100011',
    email_address: 'thomas.varghese.dummy@bhtest.in',
    height: "5'10\"",
    education: 'M.Com',
    profession: 'Chartered Accountant',
    marital_status: 'Never Married',
    about_me: 'God-fearing and family-oriented. Enjoy church activities and outdoor sports.',
    place: 'Ernakulam',
    state: 'Kerala',
    country: 'India',
    pincode: '682003',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Maria George',
    gender: 'Female',
    dob: '1999-04-12',
    district_obj: DISTRICTS[0], // Thiruvananthapuram
    mobile_number: '9876100012',
    email_address: 'maria.george.dummy@bhtest.in',
    height: "5'4\"",
    education: 'B.Sc Nursing',
    profession: 'Nurse',
    marital_status: 'Never Married',
    about_me: 'Gentle and caring. Love music and spending time with family.',
    place: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    pincode: '695003',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Biju Mathew',
    gender: 'Male',
    dob: '1991-09-08',
    district_obj: DISTRICTS[4], // Kannur
    mobile_number: '9876100013',
    email_address: 'biju.mathew.dummy@bhtest.in',
    height: "5'9\"",
    education: 'BBA',
    profession: 'Manager',
    marital_status: 'Never Married',
    about_me: 'Energetic and ambitious. Looking for a life partner who shares similar values.',
    place: 'Kannur',
    state: 'Kerala',
    country: 'India',
    pincode: '670003',
    plan: 'SILVER',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Anu Jacob',
    gender: 'Female',
    dob: '2000-11-20',
    district_obj: DISTRICTS[1], // Kollam
    mobile_number: '9876100014',
    email_address: 'anu.jacob.dummy@bhtest.in',
    height: "5'3\"",
    education: 'BA English',
    profession: 'Content Writer',
    marital_status: 'Never Married',
    about_me: 'Creative writer who loves reading and travelling. Seeking a kind-hearted partner.',
    place: 'Kollam',
    state: 'Kerala',
    country: 'India',
    pincode: '691003',
    plan: 'FREE',
    verification: 'UNVERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Rejo Philip',
    gender: 'Male',
    dob: '1996-03-03',
    district_obj: DISTRICTS[3], // Kozhikode
    mobile_number: '9876100015',
    email_address: 'rejo.philip.dummy@bhtest.in',
    height: "5'11\"",
    education: 'LLB',
    profession: 'Lawyer',
    marital_status: 'Never Married',
    about_me: 'Disciplined and professional. I enjoy debate, cricket, and volunteering.',
    place: 'Kozhikode',
    state: 'Kerala',
    country: 'India',
    pincode: '673002',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
];

// ─── Helpers ───────────────────────────────────────────────
function calculateAge(dobStr) {
  const dob = new Date(dobStr);
  const diff = Date.now() - dob.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

function getReligionTable(religion) {
  switch (religion) {
    case 'Hindu':    return 'hindus';
    case 'Muslim':   return 'muslims';
    case 'Christian': return 'christians';
    default:         return 'others';
  }
}

// ─── Main Seeder ───────────────────────────────────────────
async function seedProfiles() {
  console.log('\n🌱  Bharath Marriage – Dummy Profile Seeder');
  console.log('=============================================');
  console.log(`📡  DB Host   : ${process.env.DB_HOST}`);
  console.log(`🗄️   DB Name   : ${process.env.DB_NAME}`);
  console.log('=============================================\n');

  let successCount = 0;
  let skipCount = 0;

  for (const profile of profiles) {
    const {
      religion, full_name, gender, dob, district_obj,
      mobile_number, email_address,
      height, education, profession, marital_status, about_me,
      place, state, country, pincode,
      plan, verification,
    } = profile;

    try {
      // ── Check if already exists ──────────────────────────
      const [existing] = await pool.query(
        'SELECT id FROM user_registration WHERE email_address = ? OR mobile_number = ?',
        [email_address, mobile_number]
      );
      if (existing.length > 0) {
        console.log(`  ⚠️  SKIP  [${religion}] ${full_name} – already exists`);
        skipCount++;
        continue;
      }

      // ── Hash password (Name + birth year) ───────────────
      const namePrefix = full_name.replace(/\s+/g, '').substring(0, 4);
      const birthYear = dob.split('-')[0];
      const plainPassword = `${namePrefix}${birthYear}`;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // ── Insert into user_registration ────────────────────
      const [result] = await pool.query(
        `INSERT INTO user_registration
          (full_name, country_code, mobile_number, email_address, religion, district, dob, gender, password, plan, verification, status, account_status)
         VALUES (?, '+91', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'active')`,
        [full_name, mobile_number, email_address, religion,
         district_obj.name, dob, gender, hashedPassword, plan, verification]
      );

      const userId = result.insertId;

      // ── Generate profile_id ──────────────────────────────
      const stateCode = 'KL';
      const religionInitial = religion.charAt(0).toUpperCase();
      const districtCode = district_obj.code;
      const paddedId = String(userId).padStart(9, '0');
      const profileId = `B${stateCode}${religionInitial}${districtCode}${paddedId}`;

      // ── Update profile_id ────────────────────────────────
      await pool.query(
        'UPDATE user_registration SET profile_id = ? WHERE id = ?',
        [profileId, userId]
      );

      // ── Insert into religion-specific table ──────────────
      const table = getReligionTable(religion);
      const age = calculateAge(dob);

      await pool.query(
        `INSERT INTO ${table}
          (profile_id, name, gender, age, height, marital_status, place, district, state, country, education, profession, about_me, date_of_birth, pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [profileId, full_name, gender, age, height, marital_status,
         place, district_obj.name, state, country,
         education, profession, about_me, dob, pincode]
      );

      console.log(`  ✅  CREATED [${religion.padEnd(9)}] ${full_name.padEnd(22)} → ${profileId}  (Password: ${plainPassword})`);
      successCount++;

    } catch (err) {
      console.error(`  ❌  ERROR   [${religion}] ${full_name}: ${err.message}`);
    }
  }

  console.log('\n=============================================');
  console.log(`✅  Created : ${successCount} profiles`);
  console.log(`⚠️   Skipped : ${skipCount} profiles (already exist)`);
  console.log('=============================================\n');
  console.log('🔐  Login credentials format: Password = First4CharsOfName + BirthYear');
  console.log('    Example: Arjun Krishnan (1996) → Password: Arju1996\n');

  await pool.end();
  process.exit(0);
}

seedProfiles().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
