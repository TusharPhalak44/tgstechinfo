const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

// Helper function to generate password based on company name and job title
function generatePassword(companyName, jobTitle) {
    // Handle null values
    const safeCompany = companyName || 'Default';
    const safeJob = jobTitle || 'User';
    
    // Take first 6 chars of company name + first 4 chars of job title + special chars + numbers + uppercase + lowercase
    const companyPart = safeCompany.replace(/\s/g, '').substring(0, 6);
    const jobPart = safeJob.replace(/\s/g, '').substring(0, 4);
    const specialChars = '!@#$%^&*';
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const randomUpper = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const randomLower = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    
    return `${companyPart}${jobPart}${randomSpecial}${randomNum}${randomUpper}${randomLower}`;
}

async function generateUserReport() {
    try {
        console.log('Generating user report...\n');
        
        // Get all users except admin
        const [users] = await pool.query(`
            SELECT id, first_name, last_name, email, job_title, company_name, country, created_at
            FROM users 
            WHERE role != 'admin'
            ORDER BY country, company_name, first_name
        `);
        
        console.log('='.repeat(120));
        console.log('COMPLETE USER LIST WITH CREDENTIALS');
        console.log('='.repeat(120));
        console.log('');
        
        let report = [];
        
        for (const user of users) {
            const newPassword = generatePassword(user.company_name, user.job_title);
            const passwordHash = await hashPassword(newPassword);
            
            // Update password in database
            await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
            
            report.push({
                'ID': user.id,
                'First Name': user.first_name,
                'Last Name': user.last_name,
                'Email': user.email,
                'Country': user.country || 'N/A',
                'Job Title': user.job_title || 'N/A',
                'Company Name': user.company_name || 'N/A',
                'Password': newPassword,
                'Created At': user.created_at
            });
        }
        
        // Display report by country
        const countries = [...new Set(report.map(u => u.Country))];
        
        for (const country of countries) {
            console.log(`\n${'='.repeat(120)}`);
            console.log(`COUNTRY: ${country}`);
            console.log('='.repeat(120));
            console.log('');
            
            const countryUsers = report.filter(u => u.Country === country);
            
            for (const user of countryUsers) {
                console.log(`User ID: ${user['ID']}`);
                console.log(`Name: ${user['First Name']} ${user['Last Name']}`);
                console.log(`Email: ${user['Email']}`);
                console.log(`Job Title: ${user['Job Title']}`);
                console.log(`Company: ${user['Company Name']}`);
                console.log(`Password: ${user['Password']}`);
                console.log(`Created: ${user['Created At']}`);
                console.log('-'.repeat(120));
            }
        }
        
        // Summary
        console.log(`\n${'='.repeat(120)}`);
        console.log('SUMMARY');
        console.log('='.repeat(120));
        console.log(`Total Users: ${report.length}`);
        console.log(`Countries: ${countries.length}`);
        
        for (const country of countries) {
            const count = report.filter(u => u.Country === country).length;
            console.log(`${country}: ${count} users`);
        }
        
        console.log('\n✅ User report generated successfully!');
        console.log('✅ All passwords have been updated in the database');
        console.log('⚠️  Please save this report securely as it contains sensitive credentials');
        
    } catch (error) {
        console.error('Error generating user report:', error);
    } finally {
        await pool.end();
    }
}

generateUserReport();
