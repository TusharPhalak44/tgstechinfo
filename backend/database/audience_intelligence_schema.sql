-- Taraj Global: B2B Audience Intelligence & Demographic Data Schema (LinkedIn-Aligned V2)

-- 1. Geographic Continents & Macro Regions
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

-- 2. Commercial Geo Groups (Business-defined multi-country clusters: DACH, Nordics, EMEA, APAC, LATAM, North America, UK & Ireland, MENA, ANZ, Southeast Asia)
CREATE TABLE IF NOT EXISTS audience_geo_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Comprehensive Country Master (Full 195+ Countries)
CREATE TABLE IF NOT EXISTS audience_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    iso_code VARCHAR(10) NOT NULL UNIQUE,
    iso_alpha2 VARCHAR(10) NULL,
    iso_alpha3 VARCHAR(10) NULL,
    numeric_code VARCHAR(10) NULL,
    continent VARCHAR(50) NULL,
    lat DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
    lon DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
    linkedin_geo_id VARCHAR(50) NULL,
    linkedin_geo_name VARCHAR(150) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Region - Country Mapping
CREATE TABLE IF NOT EXISTS audience_geo_region_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    country_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_region_country (region_id, country_id),
    FOREIGN KEY (region_id) REFERENCES audience_geo_regions(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES audience_countries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Commercial Geo Group - Country Many-to-Many Mapping
CREATE TABLE IF NOT EXISTS audience_geo_group_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    geo_group_id INT NOT NULL,
    country_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_group_country (geo_group_id, country_id),
    FOREIGN KEY (geo_group_id) REFERENCES audience_geo_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES audience_countries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. LinkedIn-Aligned Industry V2 Hierarchy (L1, L2, L3)
CREATE TABLE IF NOT EXISTS audience_industries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    linkedin_industry_id VARCHAR(50) NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT NULL,
    level INT DEFAULT 1,
    hierarchy_path VARCHAR(255) NULL,
    description VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES audience_industries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LinkedIn Standard Headcount / Company Size Brackets
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

-- 8. Standard LinkedIn Functions (Decoupled from Department)
CREATE TABLE IF NOT EXISTS audience_functions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Departments (Legacy and Internal Department Taxonomy)
CREATE TABLE IF NOT EXISTS audience_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. LinkedIn Seniority Levels (Unpaid, Training, Entry, Senior, Manager, Director, VP, CXO, Partner, Owner)
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

-- 11. Searchable Dynamic Job Titles
CREATE TABLE IF NOT EXISTS audience_job_titles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL UNIQUE,
    function_id INT NULL,
    seniority_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (function_id) REFERENCES audience_functions(id) ON DELETE SET NULL,
    FOREIGN KEY (seniority_id) REFERENCES audience_job_levels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Aggregated Audience Statistics Cube (Source of truth for combinations)
CREATE TABLE IF NOT EXISTS audience_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    country_id INT NOT NULL,
    industry_id INT NOT NULL,
    employee_size_id INT NOT NULL,
    department_id INT NOT NULL,
    function_id INT NULL,
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
    INDEX idx_aud_func (function_id),
    INDEX idx_aud_level (job_level_id),
    INDEX idx_aud_full_combo (country_id, industry_id, employee_size_id, department_id, job_level_id),
    
    FOREIGN KEY (region_id) REFERENCES audience_geo_regions(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES audience_countries(id) ON DELETE CASCADE,
    FOREIGN KEY (industry_id) REFERENCES audience_industries(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_size_id) REFERENCES audience_employee_sizes(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES audience_departments(id) ON DELETE CASCADE,
    FOREIGN KEY (function_id) REFERENCES audience_functions(id) ON DELETE SET NULL,
    FOREIGN KEY (job_level_id) REFERENCES audience_job_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Global Dashboard Configuration & Headroom Settings
CREATE TABLE IF NOT EXISTS audience_global_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Proportional Adjustment History
CREATE TABLE IF NOT EXISTS audience_adjustment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scope_type VARCHAR(50) NOT NULL, -- REGION, COUNTRY, GLOBAL, FILTER
    scope_id VARCHAR(100) NOT NULL,
    scope_name VARCHAR(150) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL, -- DELTA_ADD, DELTA_SUBTRACT, TARGET_SET
    delta_applied BIGINT NOT NULL,
    previous_total BIGINT NOT NULL,
    new_total BIGINT NOT NULL,
    records_affected INT NOT NULL DEFAULT 0,
    performed_by INT NULL,
    performed_by_name VARCHAR(150) NULL,
    details_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Audience Data Import & Versioning Records
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

-- 16. Audience Audit Log
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

-- 17. Shareable Client Presentation Tokens
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

-- 18. Sales Presentation Event Tracking
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
