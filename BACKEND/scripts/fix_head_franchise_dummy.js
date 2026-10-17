/**
 * Fix Head Franchise Requests for Dummy Users
 * Run this on the live server to populate bm_head_franchise_requests
 * for dummy users whose pincodes don't match any franchise.
 */
import 'dotenv/config';
import pool from '../config/db.js';

async function run() {
  console.log('\n🔧  Fixing Head Franchise Requests for Dummy Users\n');

  // Get all franchises and their pincodes
  const [franchises] = await pool.query('SELECT franchise_id, pin_codes FROM bm_franchise');
  const allFranchisePincodes = new Set();
  for (const f of franchises) {
    let pins = f.pin_codes;
    if (typeof pins === 'string') {
      try { pins = JSON.parse(pins); } catch (e) { pins = []; }
    }
    if (Array.isArray(pins)) {
      pins.forEach(p => allFranchisePincodes.add(String(p)));
    }
  }
  console.log('📌 All franchise pincodes:', [...allFranchisePincodes]);

  // Get dummy users with their pincodes
  const [dummies] = await pool.query(`
    SELECT ur.profile_id, ur.full_name,
      COALESCE(h.pincode, c.pincode, m.pincode, o.pincode) as pincode
    FROM user_registration ur
    LEFT JOIN hindus h ON ur.profile_id = h.profile_id
    LEFT JOIN christians c ON ur.profile_id = c.profile_id
    LEFT JOIN muslims m ON ur.profile_id = m.profile_id
    LEFT JOIN others o ON ur.profile_id = o.profile_id
    WHERE ur.email_address LIKE '%bhtest.in%'
  `);

  // Get last request_id to generate new ones
  const [lastReq] = await pool.query('SELECT request_id FROM bm_head_franchise_requests ORDER BY id DESC LIMIT 1');
  let lastNum = 0;
  if (lastReq.length > 0) {
    const match = lastReq[0].request_id.match(/(\d+)$/);
    if (match) lastNum = parseInt(match[1]);
  }

  let inserted = 0;
  let skipped = 0;

  for (const user of dummies) {
    const pincode = user.pincode;
    if (!pincode) {
      console.log(`  ⚠️  SKIP ${user.full_name} – no pincode`);
      skipped++;
      continue;
    }

    // Check if pincode is covered by a franchise
    if (allFranchisePincodes.has(String(pincode))) {
      console.log(`  ✅  SKIP ${user.full_name} (${pincode}) – covered by franchise`);
      skipped++;
      continue;
    }

    // Check if already in head franchise requests
    const [existing] = await pool.query(
      'SELECT id FROM bm_head_franchise_requests WHERE profile_id = ? AND status = "Unassigned"',
      [user.profile_id]
    );
    if (existing.length > 0) {
      console.log(`  ⚠️  SKIP ${user.full_name} – already in head franchise queue`);
      skipped++;
      continue;
    }

    // Generate request ID
    lastNum++;
    const requestId = `HFR${String(lastNum).padStart(6, '0')}`;

    await pool.query(
      'INSERT INTO bm_head_franchise_requests (request_id, profile_id, pincode, status) VALUES (?, ?, ?, "Unassigned")',
      [requestId, user.profile_id, pincode]
    );

    console.log(`  ✅  ADDED ${user.full_name} (${pincode}) → ${requestId}`);
    inserted++;
  }

  console.log(`\n✅  Inserted: ${inserted}  |  Skipped: ${skipped}\n`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
