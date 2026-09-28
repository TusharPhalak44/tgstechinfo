const { pool } = require('../src/config/database');

async function runMigration() {
    try {
        console.log('Starting database migration...');
        
        // Add job_title column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN job_title VARCHAR(150) DEFAULT NULL AFTER email');
            console.log('✅ job_title column added successfully');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  job_title column already exists');
            } else {
                throw error;
            }
        }
        
        // Add company_name column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN company_name VARCHAR(200) DEFAULT NULL AFTER job_title');
            console.log('✅ company_name column added successfully');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  company_name column already exists');
            } else {
                throw error;
            }
        }
        
        // Add comments
        try {
            await pool.query("ALTER TABLE users MODIFY COLUMN job_title VARCHAR(150) DEFAULT NULL COMMENT 'User job title for professional information'");
            await pool.query("ALTER TABLE users MODIFY COLUMN company_name VARCHAR(200) DEFAULT NULL COMMENT 'User company name for professional information'");
            console.log('✅ Column comments added successfully');
        } catch (error) {
            console.log('⚠️  Could not add column comments:', error.message);
        }
        
        console.log('\n🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();
