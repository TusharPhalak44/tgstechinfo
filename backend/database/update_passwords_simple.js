const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');

async function updatePasswordsToSimpleFormat() {
    try {
        console.log('Updating all user passwords to format: companyname@2026...\n');
        
        // Get all users except admin
        const [users] = await pool.query(`
            SELECT id, first_name, last_name, email, company_name, country
            FROM users 
            WHERE role != 'admin'
            ORDER BY country, company_name, first_name
        `);
        
        console.log(`Found ${users.length} users to update\n`);
        
        let updatedCount = 0;
        let credentials = [];
        
        const currentYear = new Date().getFullYear();
        
        for (const user of users) {
            // Generate simple password: companyname@2026
            const safeCompany = user.company_name || 'Default';
            const companyClean = safeCompany.replace(/\s+/g, ''); // Remove spaces
            const newPassword = `${companyClean}@${currentYear}`;
            
            // Hash the password
            const passwordHash = await hashPassword(newPassword);
            
            // Update password in database
            await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
            
            updatedCount++;
            
            credentials.push({
                'Email': user.email,
                'Password': newPassword,
                'Company': user.company_name,
                'Country': user.country
            });
            
            console.log(`✅ Updated user ${updatedCount}: ${user.email}`);
            console.log(`   Password: ${newPassword}`);
            console.log('---');
        }
        
        // Generate CSV report
        let csvContent = 'Email,Password,Company,Country\n';
        for (const cred of credentials) {
            csvContent += `"${cred.Email}","${cred.Password}","${cred.Company}","${cred.Country}"\n`;
        }
        
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, 'user_credentials_simple.csv');
        fs.writeFileSync(filePath, csvContent, 'utf8');
        
        console.log(`\n🎉 Password update completed!`);
        console.log(`📊 Total users updated: ${updatedCount}`);
        console.log(`📁 Credentials saved to: ${filePath}`);
        console.log(`\n🔐 New password format: companyname@${currentYear}`);
        console.log(`\n⚠️  SECURITY WARNING: This file contains sensitive credentials.`);
        console.log(`⚠️  Please store it securely and delete it after use.`);
        
    } catch (error) {
        console.error('Error updating passwords:', error);
    } finally {
        await pool.end();
    }
}

updatePasswordsToSimpleFormat();
