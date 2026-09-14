-- ==============================================================================
-- B2B Demographic Data, Demographic Datasets & Demographic Data History Schema
-- Taraj Global / TGS Tech Info - Enterprise Demographic Data Engine
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEMOGRAPHIC DATASETS - Top-level dataset containers & catalog
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demographic_datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'B2B Demographic',
    description TEXT NULL,
    data_source VARCHAR(150) DEFAULT 'LinkedIn-Aligned B2B Intelligence',
    version_label VARCHAR(50) DEFAULT 'V2.0',
    effective_date VARCHAR(50) DEFAULT 'September 2026',
    total_contacts BIGINT DEFAULT 0,
    total_companies BIGINT DEFAULT 0,
    record_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Published',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_dataset_status (status, is_active),
    INDEX idx_dataset_code (dataset_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------------------------
-- 2. DEMOGRAPHIC DATA - Multidimensional demographic records & statistics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demographic_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    region_code VARCHAR(50) NULL,
    region_name VARCHAR(100) NULL,
    country_code VARCHAR(10) NULL,
    country_name VARCHAR(150) NULL,
    industry_code VARCHAR(100) NULL,
    industry_name VARCHAR(150) NULL,
    employee_size_code VARCHAR(50) NULL,
    employee_size_name VARCHAR(100) NULL,
    function_code VARCHAR(50) NULL,
    function_name VARCHAR(100) NULL,
    job_level_code VARCHAR(50) NULL,
    job_level_name VARCHAR(100) NULL,
    department_code VARCHAR(50) NULL,
    department_name VARCHAR(100) NULL,
    
    -- Numerical Metrics & Volume Counts
    contact_count INT NOT NULL DEFAULT 0,
    company_count INT NOT NULL DEFAULT 0,
    percentage_share DECIMAL(10,4) NULL COMMENT 'Percentage value if count is unavailable or relative',
    is_percentage_only BOOLEAN DEFAULT FALSE COMMENT 'TRUE if only percentage distribution is available',
    
    -- Additional Metadata & Tags
    metadata JSON NULL COMMENT 'Flexible key-value payload for extended attributes',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys & Indexes
    FOREIGN KEY (dataset_id) REFERENCES demographic_datasets(id) ON DELETE CASCADE,
    INDEX idx_demo_dataset (dataset_id),
    INDEX idx_demo_geo (region_code, country_code),
    INDEX idx_demo_ind (industry_code),
    INDEX idx_demo_size (employee_size_code),
    INDEX idx_demo_func (function_code),
    INDEX idx_demo_level (job_level_code),
    INDEX idx_demo_combo (dataset_id, country_code, industry_code, job_level_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------------------------
-- 3. DEMOGRAPHIC DATA HISTORY - Audit log & proportional volume adjustment history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demographic_data_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    demographic_data_id BIGINT NULL COMMENT 'Target demographic record ID, NULL if batch/global adjustment',
    action_type VARCHAR(50) NOT NULL COMMENT 'IMPORT, ADJUSTMENT, REBALANCE, UPDATE, DELETE',
    scope_type VARCHAR(50) NOT NULL COMMENT 'GLOBAL, REGION, COUNTRY, INDUSTRY, FILTER',
    scope_name VARCHAR(150) NULL COMMENT 'Human readable scope name (e.g. "APAC", "DACH", "United States")',
    
    -- Metrics Before & After
    previous_contact_count BIGINT DEFAULT 0,
    new_contact_count BIGINT DEFAULT 0,
    delta_applied BIGINT DEFAULT 0,
    records_affected INT DEFAULT 0,
    
    -- User & Session Metadata
    change_summary TEXT NULL,
    details_json JSON NULL COMMENT 'JSON snapshot of parameters, filters, or formula applied',
    performed_by INT NULL,
    performed_by_name VARCHAR(150) NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys & Indexes
    FOREIGN KEY (dataset_id) REFERENCES demographic_datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (demographic_data_id) REFERENCES demographic_data(id) ON DELETE SET NULL,
    INDEX idx_hist_dataset (dataset_id),
    INDEX idx_hist_action (action_type),
    INDEX idx_hist_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------------------------
-- 4. INITIAL SEED DATA FOR DEMOGRAPHIC DATASETS
-- ------------------------------------------------------------------------------
INSERT INTO demographic_datasets (dataset_code, name, category, description, data_source, total_contacts, total_companies, record_count, status)
VALUES 
('GLOBAL_B2B_V2', 'Global B2B Enterprise Demographic Dataset V2', 'B2B Demographic', 'LinkedIn-aligned global B2B contact and company distribution by region, industry, company size, function, and seniority.', 'LinkedIn-Aligned B2B Intelligence', 78000000, 4250000, 12500, 'Published'),
('AMER_ICP_2026', 'Americas ICP Enterprise Decision Makers 2026', 'Target ICP', 'Americas enterprise technology decision makers across Fortune 2000 companies.', 'Verified Tech Syndication', 24500000, 1200000, 4200, 'Published'),
('EMEA_DACH_TECH', 'EMEA & DACH Industry Decision Makers', 'Regional ICP', 'DACH & Western Europe IT and Business leadership demographic distribution.', 'EMEA Syndication Network', 18200000, 980000, 3100, 'Published')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
