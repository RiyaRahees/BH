export const createPartnerPreferenceQuery = `
  CREATE TABLE IF NOT EXISTS partner_preference (
    id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    profile_id varchar(20) NOT NULL,
    min_age int(11) DEFAULT NULL,
    max_age int(11) DEFAULT NULL,
    min_height varchar(50) DEFAULT NULL,
    max_height varchar(50) DEFAULT NULL,
    marital_status enum('Never Married', 'Second Marriage') DEFAULT NULL,
    mother_tongue varchar(100) DEFAULT NULL,
    religion varchar(100) DEFAULT NULL,
    caste varchar(100) DEFAULT NULL,
    education_level varchar(255) DEFAULT NULL,
    preferred_professions varchar(255) DEFAULT NULL,
    location_preferences varchar(255) DEFAULT NULL,
    created_at timestamp NULL DEFAULT current_timestamp(),
    updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    UNIQUE KEY unique_profile_id (profile_id),
    CONSTRAINT fk_partner_preference_profile_id FOREIGN KEY (profile_id) REFERENCES user_registration (profile_id) ON DELETE CASCADE
  );
`;

export const createFavouritesTableQuery = `
  CREATE TABLE IF NOT EXISTS user_favourites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    favourite_profile_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_registration(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (favourite_profile_id) REFERENCES user_registration(profile_id) ON DELETE CASCADE,
    UNIQUE KEY unique_favourite (user_id, favourite_profile_id)
  );
`;
