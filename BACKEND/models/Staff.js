export const createStaffTableQuery = `
  CREATE TABLE IF NOT EXISTS bm_staff_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('USER MANAGEMENT', 'FINANCE & PACKAGE') NOT NULL,
    franchise VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    account_status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_id (staff_id)
  );
`;
