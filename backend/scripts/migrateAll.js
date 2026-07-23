const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

// Helper function to split SQL statements
const splitSqlStatements = (sql) => {
    const statements = [];
    let currentStatement = '';
    let inComment = false;
    let inMultiLineComment = false;
    
    const lines = sql.split('\n');
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Handle single-line comments
        if (trimmedLine.startsWith('--')) {
            continue;
        }
        
        // Handle multi-line comments
        if (trimmedLine.startsWith('/*')) {
            inMultiLineComment = true;
            if (trimmedLine.includes('*/')) {
                inMultiLineComment = false;
            }
            continue;
        }
        
        if (inMultiLineComment) {
            if (trimmedLine.includes('*/')) {
                inMultiLineComment = false;
            }
            continue;
        }
        
        currentStatement += line + '\n';
        
        // Check if statement ends with semicolon
        if (trimmedLine.endsWith(';')) {
            const statement = currentStatement.trim();
            if (statement && !statement.startsWith('--')) {
                statements.push(statement);
            }
            currentStatement = '';
        }
    }
    
    return statements;
};

const executeSqlFile = async (filePath) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = splitSqlStatements(sql);
    
    for (const statement of statements) {
        try {
            await pool.query(statement);
        } catch (err) {
            // Ignore errors for IF NOT EXISTS statements
            if (!err.message.includes('already exists')) {
                console.warn('Warning:', err.message);
            }
        }
    }
};

const migrateAll = async () => {
    try {
        console.log('🚀 Starting database migration...');

        // Read and execute sessions.sql
        console.log('📋 Running sessions.sql...');
        await executeSqlFile(path.join(__dirname, '../database/sessions.sql'));
        console.log('✅ Sessions tables created');

        // Read and execute visitor_tracking.sql
        console.log('📋 Running visitor_tracking.sql...');
        await executeSqlFile(path.join(__dirname, '../database/visitor_tracking.sql'));
        console.log('✅ Visitor tracking tables created');

        // Read and execute add_account_lockout_columns.sql
        console.log('📋 Running add_account_lockout_columns.sql...');
        await executeSqlFile(path.join(__dirname, '../database/add_account_lockout_columns.sql'));
        console.log('✅ Account lockout columns added');

        // Read and execute rbac.sql
        console.log('📋 Running rbac.sql...');
        await executeSqlFile(path.join(__dirname, '../database/rbac.sql'));
        console.log('✅ RBAC tables created');

        // Read and execute cookie_consents.sql
        console.log('📋 Running cookie_consents.sql...');
        await executeSqlFile(path.join(__dirname, '../database/cookie_consents.sql'));
        console.log('✅ Cookie consent tables created');

        // Read and execute contact_submissions.sql
        console.log('📋 Running contact_submissions.sql...');
        await executeSqlFile(path.join(__dirname, '../database/contact_submissions.sql'));
        console.log('✅ Contact submission tables created');

        // Run existing content migrations
        console.log('📋 Running content migrations...');
        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS pdf_file VARCHAR(255) NULL AFTER banner_image
        `).catch(() => {});

        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS custom_fields JSON NULL AFTER pdf_file
        `).catch(() => {});

        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500) NULL AFTER custom_fields
        `).catch(() => {});

        await pool.query(`
            ALTER TABLE contents 
            ADD COLUMN IF NOT EXISTS builder_layout JSON NULL AFTER webhook_url
        `).catch(() => {});

        await pool.query(`
            CREATE TABLE IF NOT EXISTS landing_page_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_number VARCHAR(20) NOT NULL,
                content_id INT NULL,
                extra_fields JSON NULL,
                has_access BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Content migrations completed');

        // Run case_studies.sql (adds email_subject, email_template, case_study_headline, case_study_summary)
        console.log('📋 Running case_studies.sql...');
        await executeSqlFile(path.join(__dirname, '../database/case_studies.sql'));
        console.log('✅ Case studies schema applied');

        // Seed Landing Page content type
        console.log('📋 Running landing_page_content_type.sql...');
        await executeSqlFile(path.join(__dirname, '../database/landing_page_content_type.sql'));
        console.log('✅ Landing Page content type seeded');

        console.log('🎉 All migrations completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

migrateAll();