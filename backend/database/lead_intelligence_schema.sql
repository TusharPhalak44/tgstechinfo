-- Lead Intelligence Module - Dynamic Multidimensional Data Exploration System
-- This schema supports dynamic dimensions, hierarchical drill-down, NULL vs 0 handling,
-- percentage-only data, RBAC, and audit trails

-- ============================================
-- DATASETS - Top-level containers for data
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DIMENSIONS - Dynamic dimensions (Region, Country, Industry, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_dimensions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'Internal dimension identifier (e.g., "country", "industry")',
    display_name VARCHAR(255) NOT NULL COMMENT 'Human-readable name (e.g., "Country", "Industry")',
    parent_dimension_id INT NULL COMMENT 'Parent dimension for hierarchical relationships',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES lead_intelligence_datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_dimension_id) REFERENCES lead_intelligence_dimensions(id) ON DELETE SET NULL,
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_parent_dimension_id (parent_dimension_id),
    UNIQUE KEY uk_dataset_dimension (dataset_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATA RECORDS - Actual data points with hierarchical relationships
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    dimension_id INT NOT NULL,
    parent_record_id INT NULL COMMENT 'Parent record for drill-down hierarchy',
    dimension_value VARCHAR(255) NOT NULL COMMENT 'The value for this dimension (e.g., "United States", "Technology")',
    count_value INT NULL COMMENT 'Explicit count, NULL if not provided',
    percentage_value DECIMAL(10,2) NULL COMMENT 'Percentage value, NULL if not provided',
    is_percentage_only BOOLEAN DEFAULT FALSE COMMENT 'TRUE if only percentage is available (e.g., LATAM data)',
    metadata JSON COMMENT 'Additional flexible data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES lead_intelligence_datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (dimension_id) REFERENCES lead_intelligence_dimensions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_record_id) REFERENCES lead_intelligence_data(id) ON DELETE SET NULL,
    INDEX idx_dataset_dimension (dataset_id, dimension_id),
    INDEX idx_parent_record (parent_record_id),
    INDEX idx_dimension_value (dimension_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REGIONS - Geographic regions for filtering
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL COMMENT 'Region code (e.g., "NA", "EMEA", "APAC", "LATAM")',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- IMPORT/EXPORT TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    imported_by INT NOT NULL,
    file_name VARCHAR(255),
    record_count INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (dataset_id) REFERENCES lead_intelligence_datasets(id) ON DELETE CASCADE,
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_imported_by (imported_by),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_intelligence_exports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    exported_by INT NOT NULL,
    export_format ENUM('csv', 'json', 'excel') DEFAULT 'csv',
    filters JSON COMMENT 'Applied filters for this export',
    file_path VARCHAR(500),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (dataset_id) REFERENCES lead_intelligence_datasets(id) ON DELETE CASCADE,
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_exported_by (exported_by),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUDIT LOG - Track all data modifications
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    user_id INT,
    action ENUM('create', 'update', 'delete', 'import', 'export') NOT NULL,
    entity_type VARCHAR(50) NOT NULL COMMENT 'dataset, dimension, data, etc.',
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES lead_intelligence_datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_dataset_id (dataset_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
