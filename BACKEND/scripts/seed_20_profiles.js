import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const DISTRICTS = [
  { name: '01-Thiruvananthapuram', code: '01', place: 'Thiruvananthapuram' },
  { name: '02-Kollam',             code: '02', place: 'Kollam' },
  { name: '03-Pathanamthitta',      code: '03', place: 'Pathanamthitta' },
  { name: '04-Alappuzha',          code: '04', place: 'Alappuzha' },
  { name: '05-Kottayam',           code: '05', place: 'Kottayam' },
  { name: '06-Idukki',             code: '06', place: 'Thodupuzha' },
  { name: '07-Ernakulam',          code: '07', place: 'Kochi' },
  { name: '08-Thrissur',           code: '08', place: 'Thrissur' },
  { name: '09-Palakkad',           code: '09', place: 'Palakkad' },
  { name: '10-Malappuram',         code: '10', place: 'Malappuram' },
  { name: '11-Kozhikode',          code: '11', place: 'Kozhikode' },
  { name: '12-Wayanad',            code: '12', place: 'Kalpetta' },
  { name: '13-Kannur',             code: '13', place: 'Kannur' },
  { name: '14-Kasaragod',          code: '14', place: 'Kasaragod' },
];

const profiles20 = [
  // ─── 10 MALES ───
  {
    religion: 'Hindu',
    full_name: 'Adarsh Nambiar',
    gender: 'Male',
    dob: '1995-04-12',
    district_obj: DISTRICTS[12], // Kannur
    mobile_number: '9847000101',
    email_address: 'adarsh.nambiar@bhtest.in',
    height: "5'11\"",
    education: 'B.Tech Computer Science',
    profession: 'Senior Software Engineer',
    marital_status: 'Never Married',
    about_me: 'Simple, family-oriented professional working in tech. Enjoys travel and badminton.',
    place: 'Kannur',
    state: 'Kerala',
    country: 'India',
    pincode: '670001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Fahad Mohammed',
    gender: 'Male',
    dob: '1994-08-20',
    district_obj: DISTRICTS[10], // Kozhikode
    mobile_number: '9847000102',
    email_address: 'fahad.mohammed@bhtest.in',
    height: "5'9\"",
    education: 'MBA Marketing',
    profession: 'Business Development Manager',
    marital_status: 'Never Married',
    about_me: 'Dynamic and progressive individual with strong family values and entrepreneurial goals.',
    place: 'Kozhikode',
    state: 'Kerala',
    country: 'India',
    pincode: '673001',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Kevin Thomas',
    gender: 'Male',
    dob: '1993-12-05',
    district_obj: DISTRICTS[4], // Kottayam
    mobile_number: '9847000103',
    email_address: 'kevin.thomas@bhtest.in',
    height: "5'10\"",
    education: 'MS in Civil Engineering',
    profession: 'Structural Engineer',
    marital_status: 'Never Married',
    about_me: 'God-fearing and hardworking person. Looking for an understanding and cheerful life partner.',
    place: 'Kottayam',
    state: 'Kerala',
    country: 'India',
    pincode: '686001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Gautham Varma',
    gender: 'Male',
    dob: '1996-02-18',
    district_obj: DISTRICTS[6], // Ernakulam
    mobile_number: '9847000104',
    email_address: 'gautham.varma@bhtest.in',
    height: "6'0\"",
    education: 'CA (Chartered Accountant)',
    profession: 'Finance Manager',
    marital_status: 'Never Married',
    about_me: 'Chartered Accountant based in Kochi. Passionate about photography, fitness, and reading.',
    place: 'Kochi',
    state: 'Kerala',
    country: 'India',
    pincode: '682016',
    plan: 'PLATINUM',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Nabeel Rahman',
    gender: 'Male',
    dob: '1997-06-11',
    district_obj: DISTRICTS[9], // Malappuram
    mobile_number: '9847000105',
    email_address: 'nabeel.rahman@bhtest.in',
    height: "5'8\"",
    education: 'B.Pharm',
    profession: 'Pharmacist',
    marital_status: 'Never Married',
    about_me: 'Friendly and compassionate healthcare professional looking for an educated partner.',
    place: 'Malappuram',
    state: 'Kerala',
    country: 'India',
    pincode: '676505',
    plan: 'FREE',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Mathew Varghese',
    gender: 'Male',
    dob: '1995-10-25',
    district_obj: DISTRICTS[7], // Thrissur
    mobile_number: '9847000106',
    email_address: 'mathew.varghese@bhtest.in',
    height: "5'9\"",
    education: 'M.Tech Electronics',
    profession: 'Embedded Systems Engineer',
    marital_status: 'Never Married',
    about_me: 'Passionate engineer who loves music and weekend road trips.',
    place: 'Thrissur',
    state: 'Kerala',
    country: 'India',
    pincode: '680001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Vishnu Prasad',
    gender: 'Male',
    dob: '1992-09-08',
    district_obj: DISTRICTS[0], // Thiruvananthapuram
    mobile_number: '9847000107',
    email_address: 'vishnu.prasad@bhtest.in',
    height: "5'7\"",
    education: 'M.Sc Physics, B.Ed',
    profession: 'High School Teacher',
    marital_status: 'Never Married',
    about_me: 'Calm-minded and respectful teacher searching for a loving and supportive partner.',
    place: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    pincode: '695001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Riyaz Ali',
    gender: 'Male',
    dob: '1994-01-30',
    district_obj: DISTRICTS[1], // Kollam
    mobile_number: '9847000108',
    email_address: 'riyaz.ali@bhtest.in',
    height: "5'11\"",
    education: 'B.Com, Logistics Diploma',
    profession: 'Supply Chain Executive',
    marital_status: 'Never Married',
    about_me: 'Hardworking and honest individual working in supply chain operations.',
    place: 'Kollam',
    state: 'Kerala',
    country: 'India',
    pincode: '691001',
    plan: 'FREE',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Joel Abraham',
    gender: 'Male',
    dob: '1996-07-14',
    district_obj: DISTRICTS[6], // Ernakulam
    mobile_number: '9847000109',
    email_address: 'joel.abraham@bhtest.in',
    height: "5'10\"",
    education: 'B.Des (Visual Communication)',
    profession: 'UI/UX Designer',
    marital_status: 'Never Married',
    about_me: 'Creative designer living in Kochi. Loves art, indie music, and nature trails.',
    place: 'Kochi',
    state: 'Kerala',
    country: 'India',
    pincode: '682020',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Siddharth Menon',
    gender: 'Male',
    dob: '1993-03-22',
    district_obj: DISTRICTS[8], // Palakkad
    mobile_number: '9847000110',
    email_address: 'siddharth.menon@bhtest.in',
    height: "5'8\"",
    education: 'B.Sc Agriculture, MBA',
    profession: 'Agronomist & Consultant',
    marital_status: 'Never Married',
    about_me: 'Down-to-earth person passionate about organic farming and sustainable living.',
    place: 'Palakkad',
    state: 'Kerala',
    country: 'India',
    pincode: '678001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },

  // ─── 10 FEMALES ───
  {
    religion: 'Hindu',
    full_name: 'Ananya Nair',
    gender: 'Female',
    dob: '1998-05-19',
    district_obj: DISTRICTS[6], // Ernakulam
    mobile_number: '9847000111',
    email_address: 'ananya.nair@bhtest.in',
    height: "5'5\"",
    education: 'B.Tech IT',
    profession: 'Cloud Engineer',
    marital_status: 'Never Married',
    about_me: 'Tech enthusiast who loves classical dance and exploring new cultures.',
    place: 'Kochi',
    state: 'Kerala',
    country: 'India',
    pincode: '682024',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Amina Zehra',
    gender: 'Female',
    dob: '1999-09-12',
    district_obj: DISTRICTS[10], // Kozhikode
    mobile_number: '9847000112',
    email_address: 'amina.zehra@bhtest.in',
    height: "5'4\"",
    education: 'BDS',
    profession: 'Dentist',
    marital_status: 'Never Married',
    about_me: 'Practicing dentist who is caring, empathetic, and values both family and career.',
    place: 'Kozhikode',
    state: 'Kerala',
    country: 'India',
    pincode: '673004',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Sneha Mary Kurian',
    gender: 'Female',
    dob: '1997-11-28',
    district_obj: DISTRICTS[4], // Kottayam
    mobile_number: '9847000113',
    email_address: 'sneha.kurian@bhtest.in',
    height: "5'6\"",
    education: 'M.Sc Nursing',
    profession: 'Nursing Officer',
    marital_status: 'Never Married',
    about_me: 'Caring and dedicated healthcare professional. Enjoys choir singing and baking.',
    place: 'Kottayam',
    state: 'Kerala',
    country: 'India',
    pincode: '686002',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Devika Pillai',
    gender: 'Female',
    dob: '2000-01-15',
    district_obj: DISTRICTS[0], // Thiruvananthapuram
    mobile_number: '9847000114',
    email_address: 'devika.pillai@bhtest.in',
    height: "5'3\"",
    education: 'M.A. English Literature',
    profession: 'Content Strategist',
    marital_status: 'Never Married',
    about_me: 'Creative writer and book lover with an outgoing personality.',
    place: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    pincode: '695003',
    plan: 'FREE',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Fathima Sana',
    gender: 'Female',
    dob: '1998-03-04',
    district_obj: DISTRICTS[9], // Malappuram
    mobile_number: '9847000115',
    email_address: 'fathima.sana@bhtest.in',
    height: "5'2\"",
    education: 'M.Com, UGC-NET',
    profession: 'Assistant Professor',
    marital_status: 'Never Married',
    about_me: 'Lecturer in commerce, fond of teaching, gardening, and cultural events.',
    place: 'Malappuram',
    state: 'Kerala',
    country: 'India',
    pincode: '676509',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Rose Maria Joseph',
    gender: 'Female',
    dob: '1996-08-17',
    district_obj: DISTRICTS[7], // Thrissur
    mobile_number: '9847000116',
    email_address: 'rose.joseph@bhtest.in',
    height: "5'5\"",
    education: 'B.Arch',
    profession: 'Architect',
    marital_status: 'Never Married',
    about_me: 'Architect working on sustainable interior spaces. Loves travel and sketching.',
    place: 'Thrissur',
    state: 'Kerala',
    country: 'India',
    pincode: '680005',
    plan: 'PLATINUM',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Kavya Madhavan',
    gender: 'Female',
    dob: '1997-12-09',
    district_obj: DISTRICTS[3], // Alappuzha
    mobile_number: '9847000117',
    email_address: 'kavya.madhavan@bhtest.in',
    height: "5'4\"",
    education: 'B.Tech Electrical',
    profession: 'Quality Assurance Analyst',
    marital_status: 'Never Married',
    about_me: 'Warm and cheerful nature. Seeking a compatible and understanding partner.',
    place: 'Alappuzha',
    state: 'Kerala',
    country: 'India',
    pincode: '688001',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
  {
    religion: 'Muslim',
    full_name: 'Shabana Parveen',
    gender: 'Female',
    dob: '1999-07-22',
    district_obj: DISTRICTS[13], // Kasaragod
    mobile_number: '9847000118',
    email_address: 'shabana.parveen@bhtest.in',
    height: "5'3\"",
    education: 'B.Sc Biotechnology',
    profession: 'Research Assistant',
    marital_status: 'Never Married',
    about_me: 'Ambitious science researcher with deep respect for elders and traditional values.',
    place: 'Kasaragod',
    state: 'Kerala',
    country: 'India',
    pincode: '671121',
    plan: 'FREE',
    verification: 'VERIFIED',
  },
  {
    religion: 'Christian',
    full_name: 'Rhea Elizabeth',
    gender: 'Female',
    dob: '1998-10-30',
    district_obj: DISTRICTS[6], // Ernakulam
    mobile_number: '9847000119',
    email_address: 'rhea.elizabeth@bhtest.in',
    height: "5'7\"",
    education: 'MBA HR',
    profession: 'Talent Acquisition Specialist',
    marital_status: 'Never Married',
    about_me: 'HR professional based in Kakkanad. Friendly, organized, and loves pets.',
    place: 'Kochi',
    state: 'Kerala',
    country: 'India',
    pincode: '682030',
    plan: 'DIAMOND',
    verification: 'VERIFIED',
  },
  {
    religion: 'Hindu',
    full_name: 'Dr. Pooja Namboodiri',
    gender: 'Female',
    dob: '1995-02-14',
    district_obj: DISTRICTS[1], // Kollam
    mobile_number: '9847000120',
    email_address: 'pooja.namboodiri@bhtest.in',
    height: "5'4\"",
    education: 'BAMS (Ayurveda)',
    profession: 'Ayurvedic Physician',
    marital_status: 'Never Married',
    about_me: 'Ayurvedic doctor passionate about holistic health, classical arts, and yoga.',
    place: 'Kollam',
    state: 'Kerala',
    country: 'India',
    pincode: '691002',
    plan: 'GOLD',
    verification: 'VERIFIED',
  },
];

function calculateAge(dobStr) {
  const birth = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function getReligionTable(religion) {
  switch (religion) {
    case 'Hindu':     return 'hindus';
    case 'Muslim':    return 'muslims';
    case 'Christian': return 'christians';
    default:          return 'others';
  }
}

async function seed20() {
  console.log('\n=============================================');
  console.log('Seeding 20 Static Profiles (10 Male, 10 Female)');
  console.log('=============================================\n');

  let successCount = 0;
  let skipCount = 0;

  for (const profile of profiles20) {
    const {
      religion, full_name, gender, dob, district_obj,
      mobile_number, email_address,
      height, education, profession, marital_status, about_me,
      place, state, country, pincode,
      plan, verification,
    } = profile;

    try {
      const [existing] = await pool.query(
        'SELECT id FROM user_registration WHERE email_address = ? OR mobile_number = ?',
        [email_address, mobile_number]
      );
      if (existing.length > 0) {
        console.log(`⚠️  SKIP [${gender.padEnd(6)}] ${full_name} – already exists`);
        skipCount++;
        continue;
      }

      const namePrefix = full_name.replace(/[^a-zA-Z]/g, '').substring(0, 4);
      const birthYear = dob.split('-')[0];
      const plainPassword = `${namePrefix}${birthYear}`;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const [result] = await pool.query(
        `INSERT INTO user_registration
          (full_name, country_code, mobile_number, email_address, religion, district, dob, gender, password, plan, verification, status, account_status)
         VALUES (?, '+91', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'active')`,
        [full_name, mobile_number, email_address, religion,
         district_obj.name, dob, gender, hashedPassword, plan, verification]
      );

      const userId = result.insertId;
      const stateCode = 'KL';
      const religionInitial = religion.charAt(0).toUpperCase();
      const districtCode = district_obj.code;
      const paddedId = String(userId).padStart(9, '0');
      const profileId = `B${stateCode}${religionInitial}${districtCode}${paddedId}`;

      await pool.query(
        'UPDATE user_registration SET profile_id = ? WHERE id = ?',
        [profileId, userId]
      );

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

      console.log(`✅ CREATED [${gender.padEnd(6)}] [${religion.padEnd(9)}] ${full_name.padEnd(23)} → ${profileId}`);
      successCount++;
    } catch (err) {
      console.error(`❌ ERROR [${gender}] ${full_name}: ${err.message}`);
    }
  }

  console.log('\n=============================================');
  console.log(`Done! Created: ${successCount}, Skipped: ${skipCount}`);
  console.log('=============================================\n');

  await pool.end();
  process.exit(0);
}

seed20().catch(err => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
