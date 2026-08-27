-- Taraj Global: B2B Audience Intelligence & Demographic Data Schema

-- 1. Geographic Regions (APAC, EMEA, LATAM, North America, DACH, Nordics, MENA, etc.)
CREATE TABLE IF NOT EXISTS audience_geo_regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    region_type VARCHAR(50) DEFAULT 'CONTINENT',
    parent_id INT NULL,
    lat DECIMAL(10, 6) DEFAULT 0.000000,
    lon DECIMAL(10, 6) DEFAULT 0.000000,
    default_zoom DECIMAL(4, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES audience_geo_regions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Countries
CREATE TABLE IF NOT EXISTS audience_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    iso_code VARCHAR(10) NOT NULL UNIQUE,
    iso3_code VARCHAR(10) NULL,
    lat DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
    lon DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Region - Country Many-to-Many Mapping (Allows DACH, EMEA, etc. coexistence)
CREATE TABLE IF NOT EXISTS audience_geo_region_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    country_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_region_country (region_id, country_id),
    FOREIGN KEY (region_id) REFERENCES audience_geo_regions(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES audience_countries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Industries (Hierarchical support)
CREATE TABLE IF NOT EXISTS audience_industries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES audience_industries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Employee Size Brackets
CREATE TABLE IF NOT EXISTS audience_employee_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    min_employees INT DEFAULT 0,
    max_employees INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Departments
CREATE TABLE IF NOT EXISTS audience_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Job Levels / Seniority Tiers
CREATE TABLE IF NOT EXISTS audience_job_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    rank_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Aggregated Audience Statistics Table (Source of truth for combinations)
CREATE TABLE IF NOT EXISTS audience_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    country_id INT NOT NULL,
    industry_id INT NOT NULL,
    employee_size_id INT NOT NULL,
    department_id INT NOT NULL,
    job_level_id INT NOT NULL,
    contact_count INT NOT NULL DEFAULT 0,
    company_count INT NOT NULL DEFAULT 0,
    data_source VARCHAR(100) DEFAULT 'Internal B2B Intelligence',
    effective_date VARCHAR(50) DEFAULT 'August 2026',
    status VARCHAR(50) DEFAULT 'Published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_aud_geo (region_id, country_id),
    INDEX idx_aud_ind (industry_id),
    INDEX idx_aud_size (employee_size_id),
    INDEX idx_aud_dept (department_id),
    INDEX idx_aud_level (job_level_id),
    INDEX idx_aud_full_combo (country_id, industry_id, employee_size_id, department_id, job_level_id),
    
    FOREIGN KEY (region_id) REFERENCES audience_geo_regions(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES audience_countries(id) ON DELETE CASCADE,
    FOREIGN KEY (industry_id) REFERENCES audience_industries(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_size_id) REFERENCES audience_employee_sizes(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES audience_departments(id) ON DELETE CASCADE,
    FOREIGN KEY (job_level_id) REFERENCES audience_job_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Global Dashboard Configuration & Headroom Settings
CREATE TABLE IF NOT EXISTS audience_global_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audience Data Import & Versioning Records
CREATE TABLE IF NOT EXISTS audience_data_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version_label VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    uploaded_by INT NULL,
    uploaded_by_name VARCHAR(150) NULL,
    records_processed INT DEFAULT 0,
    previous_total_contacts BIGINT DEFAULT 0,
    new_total_contacts BIGINT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending',
    validation_notes JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Audience Audit Log
CREATE TABLE IF NOT EXISTS audience_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_name VARCHAR(150) NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Shareable Client Presentation Tokens
CREATE TABLE IF NOT EXISTS audience_share_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NULL,
    client_name VARCHAR(150) NULL,
    filters_json JSON NOT NULL,
    total_matching_contacts INT NOT NULL DEFAULT 0,
    total_matching_companies INT NOT NULL DEFAULT 0,
    created_by INT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_share_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Sales Presentation Event Tracking
CREATE TABLE IF NOT EXISTS audience_analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    filters_applied JSON NULL,
    result_count INT DEFAULT 0,
    session_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_event_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
