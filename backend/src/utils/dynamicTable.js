const { pool } = require('../config/database');

/**
 * Generate MySQL column type based on field type
 */
const getMySQLType = (fieldType) => {
    const typeMap = {
        'text': 'VARCHAR(255)',
        'email': 'VARCHAR(255)',
        'number': 'DECIMAL(10,2)',
        'textarea': 'TEXT',
        'select': 'VARCHAR(255)',
        'checkbox': 'BOOLEAN',
        'date': 'DATE',
        'phone': 'VARCHAR(20)',
        'url': 'VARCHAR(500)',
        'file': 'VARCHAR(255)'
    };
    return typeMap[fieldType] || 'VARCHAR(255)';
};

/**
 * Sanitize column name to be MySQL-compatible
 */
const sanitizeColumnName = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^([0-9])/, '_$1') // Prevent starting with number
        .substring(0, 64); // MySQL column name limit
};

/**
 * Create dynamic table for content form submissions
 */
const createDynamicTable = async (contentId, slug, customFields) => {
    try {
        if (!customFields || !Array.isArray(customFields) || customFields.length === 0) {
            console.log(`No custom fields for content ${contentId}, skipping table creation`);
            return { success: true, message: 'No custom fields to create table for' };
        }

        const tableName = `form_submissions_${contentId}`;
        
        // Check if table already exists
        const [existingTables] = await pool.query(
            `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (existingTables.length > 0) {
            console.log(`Table ${tableName} already exists, updating schema if needed`);
            return await updateDynamicTable(tableName, customFields);
        }

        // Build CREATE TABLE statement
        let createSQL = `
            CREATE TABLE ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT
        `;

        // Add dynamic columns for each custom field
        for (const field of customFields) {
            const columnName = sanitizeColumnName(field.name || field.label);
            const columnType = getMySQLType(field.type);
            const nullable = field.required === false ? 'NULL' : 'NOT NULL';
            const defaultValue = field.required === false ? 'DEFAULT NULL' : '';
            
            createSQL += `, ${columnName} ${columnType} ${nullable} ${defaultValue}`;
        }

        createSQL += `, INDEX idx_content_id (content_id)`;
        createSQL += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

        await pool.query(createSQL);
        console.log(`Created dynamic table: ${tableName}`);
        
        return { success: true, tableName };
    } catch (error) {
        console.error('Error creating dynamic table:', error);
        throw error;
    }
};

/**
 * Update existing dynamic table schema if fields changed
 */
const updateDynamicTable = async (tableName, customFields) => {
    try {
        // Check if table already exists
        const [existingTables] = await pool.query(
            `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (existingTables.length === 0) {
            console.log(`Table ${tableName} does not exist, creating it`);
            const contentId = tableName.replace('form_submissions_', '');
            return await createDynamicTable(contentId, null, customFields);
        }

        // Get existing columns
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const existingColumns = columns.map(col => col.Field);
        
        // Standard columns that should always exist
        const standardColumns = ['id', 'content_id', 'created_at', 'updated_at', 'ip_address', 'user_agent'];
        
        // Add new columns
        for (const field of customFields) {
            const columnName = sanitizeColumnName(field.name || field.label);
            
            if (!existingColumns.includes(columnName)) {
                const columnType = getMySQLType(field.type);
                const nullable = field.required === false ? 'NULL' : 'NOT NULL';
                const defaultValue = field.required === false ? 'DEFAULT NULL' : '';
                
                const alterSQL = `
                    ALTER TABLE ${tableName} 
                    ADD COLUMN ${columnName} ${columnType} ${nullable} ${defaultValue}
                `;
                await pool.query(alterSQL);
                console.log(`Added column ${columnName} to ${tableName}`);
            }
        }
        
        return { success: true, tableName, message: 'Table schema updated' };
    } catch (error) {
        console.error('Error updating dynamic table:', error);
        throw error;
    }
};

/**
 * Insert form submission into dynamic table
 */
const insertIntoDynamicTable = async (contentId, formData) => {
    try {
        const tableName = `form_submissions_${contentId}`;
        
        // Check if table exists
        const [existingTables] = await pool.query(
            `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (existingTables.length === 0) {
            throw new Error(`Table ${tableName} does not exist`);
        }
        
        // Get table columns
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const columnNames = columns.map(col => col.Field);
        
        // Filter form data to match table columns
        const filteredData = {};
        const standardColumns = ['id', 'content_id', 'created_at', 'updated_at', 'ip_address', 'user_agent'];
        
        for (const [key, value] of Object.entries(formData)) {
            const sanitizedKey = sanitizeColumnName(key);
            if (columnNames.includes(sanitizedKey) && !standardColumns.includes(sanitizedKey)) {
                filteredData[sanitizedKey] = value;
            }
        }
        
        // Build INSERT query
        const dynamicColumns = Object.keys(filteredData);
        const placeholders = dynamicColumns.map(() => '?').join(', ');
        const values = [...Object.values(filteredData), contentId];
        
        const insertSQL = `
            INSERT INTO ${tableName} (${dynamicColumns.join(', ')}, content_id)
            VALUES (${placeholders}, ?)
        `;
        
        const [result] = await pool.query(insertSQL, values);
        console.log(`Inserted form submission into ${tableName}`);
        
        return { success: true, insertId: result.insertId, tableName };
    } catch (error) {
        console.error('Error inserting into dynamic table:', error);
        throw error;
    }
};

/**
 * Get submissions from dynamic table
 */
const getDynamicTableSubmissions = async (contentId, { limit = 50, offset = 0 } = {}) => {
    try {
        const tableName = `form_submissions_${contentId}`;
        
        // Check if table exists
        const [existingTables] = await pool.query(
            `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (existingTables.length === 0) {
            return { rows: [], total: 0 };
        }
        
        // Get total count
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM ${tableName}`
        );
        
        // Get rows
        const [rows] = await pool.query(
            `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );
        
        return { rows, total };
    } catch (error) {
        console.error('Error getting dynamic table submissions:', error);
        throw error;
    }
};

/**
 * Drop dynamic table (for content deletion)
 */
const dropDynamicTable = async (contentId) => {
    try {
        const tableName = `form_submissions_${contentId}`;
        
        const [existingTables] = await pool.query(
            `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (existingTables.length > 0) {
            await pool.query(`DROP TABLE ${tableName}`);
            console.log(`Dropped table: ${tableName}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error dropping dynamic table:', error);
        throw error;
    }
};

module.exports = {
    createDynamicTable,
    updateDynamicTable,
    insertIntoDynamicTable,
    getDynamicTableSubmissions,
    dropDynamicTable,
    getMySQLType,
    sanitizeColumnName
};
