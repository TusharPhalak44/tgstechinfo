const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');

const SALT_ROUNDS = 12;

// Read the CSV file and generate hashed passwords
const csvFilePath = './user_credentials.csv';
const users = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    if (row.Email && row.Email !== '' && row.Password && row.Password !== 'Default@2026') {
      users.push({
        email: row.Email,
        plainPassword: row.Password,
        company: row.Company,
        country: row.Country
      });
    }
  })
  .on('end', async () => {
    console.log(`Processing ${users.length} users...`);
    
    // Generate SQL INSERT statements with hashed passwords
    let sql = `-- SQL Query to insert 500 users with bcrypt hashed passwords
-- Passwords are hashed using bcrypt with ${SALT_ROUNDS} salt rounds
-- Password format: companyname@2026 (without spaces/special chars)

-- This assumes your users table has the following structure:
-- id, first_name, last_name, email, job_title, company_name, country, password_hash, role, is_active, created_at

INSERT INTO users (first_name, last_name, email, job_title, company_name, country, password_hash, role, is_active, created_at) VALUES
`;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.plainPassword, SALT_ROUNDS);
      
      // Extract first name and last name from email
      const emailParts = user.email.split('@')[0].split('.');
      const firstName = emailParts[0] || 'user';
      const lastName = emailParts[1] || 'user';
      
      // Determine company name (use 'Unknown' if null)
      const companyName = user.company || 'Unknown';
      const countryName = user.country || 'Unknown';
      
      // Add comma separator (except for last item)
      const separator = i < users.length - 1 ? ',' : ';';
      
      sql += `('${firstName}', '${lastName}', '${user.email}', 'User', '${companyName}', '${countryName}', '${hashedPassword}', 'user', 1, NOW())${separator}\n`;
      
      if ((i + 1) % 50 === 0) {
        console.log(`Processed ${i + 1}/${users.length} users...`);
      }
    }
    
    // Write to SQL file
    fs.writeFileSync('./insert_500_users_hashed.sql', sql);
    console.log('SQL file generated successfully: insert_500_users_hashed.sql');
    console.log(`Total users: ${users.length}`);
  });
