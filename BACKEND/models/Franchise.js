export const createFranchiseTableQuery = `
  CREATE TABLE IF NOT EXISTS bm_franchise (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    franchise_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    pin_codes JSON NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    password VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_franchise_id (franchise_id)
  );
`;

export const createHeadFranchiseRequestsQuery = `
  CREATE TABLE IF NOT EXISTS bm_head_franchise_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(20) UNIQUE NOT NULL,
    profile_id VARCHAR(20) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    status ENUM('Unassigned', 'Assigned') DEFAULT 'Unassigned',
    assigned_franchise_id VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES user_registration(profile_id) ON DELETE CASCADE,
    INDEX idx_pincode (pincode),
    INDEX idx_status (status)
  );
`;
