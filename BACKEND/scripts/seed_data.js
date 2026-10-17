import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import * as kollavarshamPkg from 'kollavarsham';
const Kollavarsham = kollavarshamPkg.Kollavarsham || kollavarshamPkg.default;
const kollavarsham = new Kollavarsham();

const seedData = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const promisePool = pool.promise();

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    const users = [
      // Hindus
      {
        profile_id: 'HIN001', full_name: 'Rahul Sharma', mobile_number: '9876543210', email: 'rahul@example.com',
        religion: 'Hindu', dob: '1995-05-15', gender: 'Male', table: 'hindus',
        profile: { profile_created_for: 'Myself', name: 'Rahul Sharma', gender: 'Male', age: 31, height: '5 ft 10 in', marital_status: 'Single', place: 'Kochi', country: 'India', state: 'Kerala', district: 'Ernakulam', education: 'B.Tech', profession: 'Software Engineer', employment_country: 'India', date_of_birth: '1995-05-15', birth_time: '10:30:00', nakshatra: 'Aswathi', rasi: 'Mesha', horoscope_information: 'Shuddha Jathakam' }
      },
      {
        profile_id: 'HIN002', full_name: 'Anjali Menon', mobile_number: '9876543211', email: 'anjali@example.com',
        religion: 'Hindu', dob: '1998-08-20', gender: 'Female', table: 'hindus',
        profile: { profile_created_for: 'Daughter', name: 'Anjali Menon', gender: 'Female', age: 28, height: '5 ft 5 in', marital_status: 'Single', place: 'Trivandrum', country: 'India', state: 'Kerala', district: 'Trivandrum', education: 'MBA', profession: 'HR Manager', employment_country: 'India', date_of_birth: '1998-08-20', birth_time: '14:45:00', nakshatra: 'Bharani', rasi: 'Edavam', horoscope_information: 'Papa Samyam' }
      },
      // Christians
      {
        profile_id: 'CHR001', full_name: 'Kevin Mathew', mobile_number: '9876543212', email: 'kevin@example.com',
        religion: 'Christian', dob: '1994-12-05', gender: 'Male', table: 'christians',
        profile: { profile_created_for: 'Myself', name: 'Kevin Mathew', gender: 'Male', age: 32, height: '5 ft 11 in', marital_status: 'Single', place: 'Kottayam', country: 'India', state: 'Kerala', district: 'Kottayam', education: 'B.Com', profession: 'Accountant', employment_country: 'India' }
      },
      {
        profile_id: 'CHR002', full_name: 'Sara Varghese', mobile_number: '9876543213', email: 'sara@example.com',
        religion: 'Christian', dob: '1999-03-10', gender: 'Female', table: 'christians',
        profile: { profile_created_for: 'Daughter', name: 'Sara Varghese', gender: 'Female', age: 27, height: '5 ft 4 in', marital_status: 'Single', place: 'Thrissur', country: 'UK', state: 'Kerala', district: 'Thrissur', education: 'Nursing', profession: 'Nurse', employment_country: 'UK' }
      },
      // Muslims
      {
        profile_id: 'MUS001', full_name: 'Mohammed Tariq', mobile_number: '9876543214', email: 'tariq@example.com',
        religion: 'Muslim', dob: '1993-11-22', gender: 'Male', table: 'muslims',
        profile: { profile_created_for: 'Son', name: 'Mohammed Tariq', gender: 'Male', age: 33, height: '5 ft 9 in', marital_status: 'Single', place: 'Kozhikode', country: 'UAE', state: 'Kerala', district: 'Kozhikode', education: 'BCA', profession: 'Business', employment_country: 'UAE' }
      },
      {
        profile_id: 'MUS002', full_name: 'Fathima Noor', mobile_number: '9876543215', email: 'fathima@example.com',
        religion: 'Muslim', dob: '1997-07-14', gender: 'Female', table: 'muslims',
        profile: { profile_created_for: 'Myself', name: 'Fathima Noor', gender: 'Female', age: 29, height: '5 ft 3 in', marital_status: 'Single', place: 'Malappuram', country: 'India', state: 'Kerala', district: 'Malappuram', education: 'B.Sc', profession: 'Teacher', employment_country: 'India' }
      },
      // Others (e.g. Sikh, Jain -> 'Sikh', 'Other')
      {
        profile_id: 'OTH001', full_name: 'Harpreet Singh', mobile_number: '9876543216', email: 'harpreet@example.com',
        religion: 'Others', dob: '1992-09-09', gender: 'Male', table: 'others',
        profile: { profile_created_for: 'Myself', name: 'Harpreet Singh', gender: 'Male', age: 34, height: '6 ft 0 in', marital_status: 'Single', place: 'Palakkad', country: 'Canada', state: 'Kerala', district: 'Palakkad', education: 'M.Tech', profession: 'Engineer', employment_country: 'Canada' }
      },
      {
        profile_id: 'OTH002', full_name: 'Priya Jain', mobile_number: '9876543217', email: 'priya@example.com',
        religion: 'Other', dob: '1996-02-18', gender: 'Female', table: 'others',
        profile: { profile_created_for: 'Daughter', name: 'Priya Jain', gender: 'Female', age: 30, height: '5 ft 6 in', marital_status: 'Single', place: 'Ernakulam', country: 'India', state: 'Kerala', district: 'Ernakulam', education: 'B.Arch', profession: 'Architect', employment_country: 'India' }
      }
    ];

    for (const u of users) {
      // 1. Insert into user_registration
      const userResult = await promisePool.query(
        `INSERT INTO user_registration (profile_id, full_name, mobile_number, email_address, religion, dob, gender, password) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.profile_id, u.full_name, u.mobile_number, u.email, u.religion, u.dob, u.gender, hashedPassword]
      );
      
      const userId = userResult[0].insertId;

      // 2. Insert into respective profile table
      const p = u.profile;
      let profileQuery = '';
      let profileValues = [];

      if (u.table === 'hindus') {
        let malayalamDob = null;
        if (p.date_of_birth) {
          const d = new Date(p.date_of_birth);
          if (!isNaN(d.getTime())) {
            const result = kollavarsham.fromGregorianDate(d);
            malayalamDob = result.toString ? result.toString() : result.year + ' ' + result.month + ' ' + result.date;
          }
        }
        profileQuery = `INSERT INTO hindus 
          (user_id, profile_created_for, name, gender, age, height, marital_status, place, country, state, district, education, profession, employment_country, date_of_birth, date_of_birth_malayalam, birth_time, nakshatra, rasi, horoscope_information)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        profileValues = [userId, p.profile_created_for, p.name, p.gender, p.age, p.height, p.marital_status, p.place, p.country, p.state, p.district, p.education, p.profession, p.employment_country, p.date_of_birth, malayalamDob, p.birth_time, p.nakshatra, p.rasi, p.horoscope_information];
      } else {
        profileQuery = `INSERT INTO ${u.table} 
          (profile_id, profile_created_for, name, gender, age, height, marital_status, place, country, state, district, education, profession, employment_country, date_of_birth)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        profileValues = [u.profile_id, p.profile_created_for, p.name, p.gender, p.age, p.height, p.marital_status, p.place, p.country, p.state, p.district, p.education, p.profession, p.employment_country, u.dob];
      }

      await promisePool.query(profileQuery, profileValues);
      console.log(`Inserted user ${u.full_name} into user_registration and ${u.table}`);
    }

    console.log('Seed data inserted successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
