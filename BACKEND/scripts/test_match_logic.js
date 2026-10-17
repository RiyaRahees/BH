import pool from '../config/db.js';

async function testMatches() {
  try {
    const [userRows] = await pool.execute('SELECT id, profile_id, full_name, gender, religion FROM user_registration WHERE profile_id = ?', ['BKLM11000000038']);
    const user = userRows[0];
    console.log('--- LOGGED IN USER ---');
    console.log(user);

    const isMale = ['male', 'groom', 'man'].includes(String(user.gender).toLowerCase().trim());
    const targetGender = isMale ? 'Female' : 'Male';
    const targetReligion = user.religion ? user.religion.split('-')[0].trim() : null;

    console.log(`Targeting Gender: ${targetGender}, Religion: ${targetReligion}`);

    const [matches] = await pool.query(
      `SELECT u.profile_id, u.full_name, u.gender, u.religion, u.district 
       FROM user_registration u 
       WHERE u.id != ? 
         AND LOWER(u.gender) IN ('female', 'bride')
         AND LOWER(u.religion) LIKE ?`,
      [user.id, `%${targetReligion.toLowerCase()}%`]
    );

    console.log('--- MATCHED PROFILES ---');
    console.log(matches);
    process.exit(0);
  } catch (err) {
    console.error('Error running test match script:', err);
    process.exit(1);
  }
}

testMatches();
