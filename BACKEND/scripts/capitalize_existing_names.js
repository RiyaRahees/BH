import pool from '../config/db.js';

const capitalizeNames = async () => {
  try {
    console.log('Connecting to database to format names...');
    const [users] = await pool.query('SELECT id, profile_id, full_name FROM user_registration WHERE full_name IS NOT NULL AND full_name != ""');

    let updatedCount = 0;

    for (const u of users) {
      if (!u.full_name || !u.full_name.trim()) continue;

      const formattedName = u.full_name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      if (formattedName !== u.full_name) {
        await pool.query('UPDATE user_registration SET full_name = ? WHERE id = ?', [formattedName, u.id]);
        if (u.profile_id) {
          await pool.query('UPDATE hindus SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
          await pool.query('UPDATE christians SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
          await pool.query('UPDATE muslims SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
          await pool.query('UPDATE others SET name = ? WHERE profile_id = ?', [formattedName, u.profile_id]);
        }
        console.log(`Updated: "${u.full_name}" -> "${formattedName}" (ID: ${u.profile_id || u.id})`);
        updatedCount++;
      }
    }

    console.log(`Successfully formatted ${updatedCount} existing user names to Title Case!`);
    process.exit(0);
  } catch (err) {
    console.error('Error formatting user names:', err);
    process.exit(1);
  }
};

capitalizeNames();
