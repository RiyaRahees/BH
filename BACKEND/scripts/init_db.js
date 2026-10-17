import mysql from 'mysql2';
import 'dotenv/config';

import { createUsersTableQuery } from '../models/User.js';
import { 
  createHindusTableQuery, 
  createChristiansTableQuery, 
  createMuslimsTableQuery, 
  createOthersTableQuery 
} from '../models/Profile.js';
import { createPartnerPreferenceQuery, createFavouritesTableQuery } from '../models/Preference.js';
import { createPlanetaryPositionsQuery } from '../models/Astrology.js';
import { createFranchiseTableQuery, createHeadFranchiseRequestsQuery } from '../models/Franchise.js';
import { createStaffTableQuery } from '../models/Staff.js';
import { createPlansTableQuery, seedPlansQuery } from '../models/Plan.js';

const initDB = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Database name is excluded so we can create it if missing
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
  });

  const promisePool = pool.promise();

  try {
    console.log('Connecting to MariaDB...');
    
    // Create the database if it doesn't exist
    await promisePool.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' checked/created.`);

    // Use the newly created/existing database
    await promisePool.query(`USE \`${process.env.DB_NAME}\`;`);

    // Create tables
    await promisePool.query(createUsersTableQuery);
    console.log('user_registration table checked/created successfully with optimizations.');

    await promisePool.query(createHindusTableQuery);
    console.log('hindus table checked/created successfully.');

    await promisePool.query(createChristiansTableQuery);
    console.log('christians table checked/created successfully.');

    await promisePool.query(createMuslimsTableQuery);
    console.log('muslims table checked/created successfully.');

    await promisePool.query(createOthersTableQuery);
    console.log('others table checked/created successfully.');

    await promisePool.query(createPartnerPreferenceQuery);
    console.log('partner_preference table checked/created successfully.');

    await promisePool.query(createFavouritesTableQuery);
    console.log('user_favourites table checked/created successfully.');

    await promisePool.query(createPlanetaryPositionsQuery);
    console.log('planetary_positions table checked/created successfully with search index.');

    await promisePool.query(createFranchiseTableQuery);
    console.log('bm_franchise table checked/created successfully.');

    await promisePool.query(createStaffTableQuery);
    console.log('bm_staff_data table checked/created successfully.');

    await promisePool.query(createPlansTableQuery);
    console.log('bm_user_plans table checked/created successfully.');

    // Seed the plans if the table is empty
    const [existingPlans] = await promisePool.query('SELECT COUNT(*) as count FROM bm_user_plans');
    if (existingPlans[0].count === 0) {
      await promisePool.query(seedPlansQuery);
      console.log('bm_user_plans seeded with initial data.');
    }

    await promisePool.query(createHeadFranchiseRequestsQuery);
    console.log('bm_head_franchise_requests table checked/created successfully.');

    console.log('Database initialization completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

initDB();
