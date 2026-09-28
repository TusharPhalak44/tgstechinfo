const { pool } = require('../src/config/database');

async function runCountryMigration() {
    try {
        console.log('Starting country column migration...');
        
        // Add country column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL AFTER company_name');
            console.log('✅ country column added successfully');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  country column already exists');
            } else {
                throw error;
            }
        }
        
        // Add comment
        try {
            await pool.query("ALTER TABLE users MODIFY COLUMN country VARCHAR(100) DEFAULT NULL COMMENT 'User country for geographic analytics'");
            console.log('✅ Column comment added successfully');
        } catch (error) {
            console.log('⚠️  Could not add column comment:', error.message);
        }
        
        console.log('\n🎉 Country migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runCountryMigration();
