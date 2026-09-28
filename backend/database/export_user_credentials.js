const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function exportUserCredentials() {
    try {
        console.log('Exporting user credentials to CSV...\n');
        
        // Get all users except admin
        const [users] = await pool.query(`
            SELECT id, first_name, last_name, email, job_title, company_name, country, created_at
            FROM users 
            WHERE role != 'admin'
            ORDER BY country, company_name, first_name
        `);
        
        // Generate CSV content
        let csvContent = 'ID,First Name,Last Name,Email,Country,Job Title,Company Name,Password,Created At\n';
        
        // Helper function to generate password based on company name and job title
        function generatePassword(companyName, jobTitle) {
            const safeCompany = companyName || 'Default';
            const safeJob = jobTitle || 'User';
            const companyPart = safeCompany.replace(/\s/g, '').substring(0, 6);
            const jobPart = safeJob.replace(/\s/g, '').substring(0, 4);
            const specialChars = '!@#$%^&*';
            const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
            const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
            const randomUpper = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            const randomLower = String.fromCharCode(97 + Math.floor(Math.random() * 26));
            return `${companyPart}${jobPart}${randomSpecial}${randomNum}${randomUpper}${randomLower}`;
        }
        
        for (const user of users) {
            const password = generatePassword(user.company_name, user.job_title);
            const created = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'N/A';
            
            csvContent += `${user.id},"${user.first_name}","${user.last_name}","${user.email}","${user.country || 'N/A'}","${user.job_title || 'N/A'}","${user.company_name || 'N/A'}","${password}","${created}"\n`;
        }
        
        // Save to file
        const filePath = path.join(__dirname, 'user_credentials.csv');
        fs.writeFileSync(filePath, csvContent, 'utf8');
        
        console.log('✅ User credentials exported successfully!');
        console.log(`📁 File saved to: ${filePath}`);
        console.log(`📊 Total users: ${users.length}`);
        
        // Display summary by country
        const countries = [...new Set(users.map(u => u.country))];
        console.log('\n📋 Users by Country:');
        for (const country of countries) {
            const count = users.filter(u => u.country === country).length;
            console.log(`   ${country || 'N/A'}: ${count} users`);
        }
        
        console.log('\n⚠️  SECURITY WARNING: This file contains sensitive credentials.');
        console.log('⚠️  Please store it securely and delete it after use.');
        
    } catch (error) {
        console.error('Error exporting credentials:', error);
    } finally {
        await pool.end();
    }
}

exportUserCredentials();
