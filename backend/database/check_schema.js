const { pool } = require('../src/config/database');

async function checkSchema() {
    try {
        console.log('Checking users table schema...');
        
        const [rows] = await pool.query('DESCRIBE users');
        
        console.log('Current users table columns:');
        console.log('--------------------------------');
        rows.forEach(row => {
            console.log(`${row.field} - ${row.type} - ${row.null === 'YES' ? 'NULL' : 'NOT NULL'}${row.key ? ' - ' + row.key : ''}`);
        });
        
        console.log('--------------------------------');
        console.log(`Total columns: ${rows.length}`);
        
        // Check if new columns exist
        const hasJobTitle = rows.some(row => row.field === 'job_title');
        const hasCompanyName = rows.some(row => row.field === 'company_name');
        const hasCountry = rows.some(row => row.field === 'country');
        
        console.log('\nColumn Status:');
        console.log(`job_title: ${hasJobTitle ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`company_name: ${hasCompanyName ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`country: ${hasCountry ? '✅ EXISTS' : '❌ MISSING'}`);
        
    } catch (error) {
        console.error('Error checking schema:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
