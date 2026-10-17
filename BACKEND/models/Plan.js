export const createPlansTableQuery = `
  CREATE TABLE IF NOT EXISTS bm_user_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    pricing INT NOT NULL,
    duration VARCHAR(100) NOT NULL,
    plan_status ENUM('active', 'inactive') DEFAULT 'active',
    plan_features JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_package_id (package_id)
  );
`;

export const seedPlansQuery = `
  INSERT INTO bm_user_plans (package_id, name, pricing, duration, plan_status, plan_features) VALUES
  ('PKG-01', 'Standard Plan', 0, 'Unlimited', 'active', '["Profile Listing", "Browse Profiles"]'),
  ('PKG-02', 'Silver Plan', 400, '1 Month', 'active', '["Profile Listing", "Browse Profiles", "View Photos & Horoscopes"]'),
  ('PKG-03', 'Gold Plan', 600, '1 Month', 'active', '["Profile Listing", "Browse Profiles", "View Photos & Horoscopes", "Detailed Profile Info", "Direct Chat & Messaging"]'),
  ('PKG-04', 'Platinum Plan', 800, '1 Month', 'active', '["Profile Listing", "Browse Profiles", "View Photos & Horoscopes", "Detailed Profile Info", "Direct Chat & Messaging", "View Contact Numbers", "Download Horoscope"]'),
  ('PKG-05', 'Diamond Plan', 1000, '1 Month', 'active', '["Profile Listing", "Browse Profiles", "View Photos & Horoscopes", "Detailed Profile Info", "Direct Chat & Messaging", "View Contact Numbers", "Download Horoscope", "Premium Profile Badge", "Video Calling"]')
`;
