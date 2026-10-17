export const createPlanetaryPositionsQuery = `
  CREATE TABLE IF NOT EXISTS planetary_positions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id VARCHAR(20) NOT NULL,
    chart_type ENUM('grahanila', 'navamsakam') NOT NULL,
    planet_name ENUM('Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu') NOT NULL,
    house_number INT NOT NULL CHECK (house_number BETWEEN 1 AND 12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES user_registration(profile_id) ON DELETE CASCADE,
    UNIQUE KEY unique_planet_per_chart (profile_id, chart_type, planet_name),
    INDEX idx_matching_search (chart_type, planet_name, house_number)
  );
`;
