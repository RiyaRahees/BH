-- ==========================================================
-- BHARATH MARRIAGE - DATABASE UPDATE MIGRATION
-- Run this query in phpMyAdmin / cPanel MySQL if not auto-migrated
-- ==========================================================

CREATE TABLE IF NOT EXISTS bm_franchise_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(50) UNIQUE NOT NULL,
  staff_id VARCHAR(50) NOT NULL,
  staff_name VARCHAR(100) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  report_title VARCHAR(255) NOT NULL,
  notes TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff (staff_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
