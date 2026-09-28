/**
 * create_bulk_users.js
 * Generates 500 users with proper bcrypt hashes (12 salt rounds),
 * inserts them into the MySQL users table, and saves a CSV file
 * with plain credentials for testing.
 * 
 * Usage:
 *   node backend/database/create_bulk_users.js
 */

const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const SALT_ROUNDS = 12;
const TOTAL_USERS = 500;
const DEFAULT_PASSWORD = 'User@2026'; // Default password for all bulk users

async function generateBulkUsers() {
  console.log(`\n==================================================`);
  console.log(`Generating & Inserting ${TOTAL_USERS} Bulk Users`);
  console.log(`Password Hashing Criteria:`);
  console.log(`- Algorithm: bcrypt (via bcryptjs)`);
  console.log(`- Salt Rounds: ${SALT_ROUNDS}`);
  console.log(`- Default Password: ${DEFAULT_PASSWORD}`);
  console.log(`==================================================\n`);

  try {
    // 1. Generate real bcrypt hash for the password
    console.log('Generating bcrypt hash with 12 salt rounds...');
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    console.log('Generated bcrypt hash:', passwordHash);

    // 2. Prepare user records
    const usersList = [];
    const csvRows = ['id,first_name,last_name,email,plain_password,company,country,role'];

    const countries = ['India', 'United States', 'United Kingdom', 'Australia', 'Canada', 'Germany', 'France', 'Singapore'];
    const companies = ['TechCorp', 'Innovatech', 'CloudScale', 'GlobalData', 'EnterpriseAI', 'FinPulse', 'CyberShield', 'AlphaDigital'];

    for (let i = 1; i <= TOTAL_USERS; i++) {
      const paddedId = String(i).padStart(3, '0');
      const firstName = `TestUser${paddedId}`;
      const lastName = `Member`;
      const email = `bulk.user${paddedId}@tgstest.com`;
      const company = companies[i % companies.length];
      const country = countries[i % countries.length];
      const role = 'user';

      usersList.push([
        firstName,
        lastName,
        email,
        'Analyst',
        company,
        country,
        passwordHash,
        role,
        1, // is_active = 1 (CRITICAL FOR LOGIN)
        0, // failed_login_attempts = 0
        null // locked_until = null
      ]);

      csvRows.push(`${i},${firstName},${lastName},${email},${DEFAULT_PASSWORD},${company},${country},${role}`);
    }

    // 3. Save CSV credentials for user reference
    const csvPath = path.join(__dirname, 'bulk_500_users_credentials.csv');
    fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
    console.log(`Credentials CSV exported to: ${csvPath}`);

    // 4. Generate SQL file for user if they want to run it via phpMyAdmin / MySQL CLI
    let sqlContent = `-- SQL Query to insert ${TOTAL_USERS} users\n`;
    sqlContent += `-- Default Password for all accounts: ${DEFAULT_PASSWORD}\n`;
    sqlContent += `-- Bcrypt Hash (12 rounds): ${passwordHash}\n\n`;
    sqlContent += `INSERT INTO users (first_name, last_name, email, job_title, company_name, country, password_hash, role, is_active, failed_login_attempts, locked_until, created_at)\nVALUES\n`;

    const sqlValues = usersList.map(u => 
      `('${u[0]}', '${u[1]}', '${u[2]}', '${u[3]}', '${u[4]}', '${u[5]}', '${u[6]}', '${u[7]}', ${u[8]}, ${u[9]}, NULL, NOW())`
    ).join(',\n');
    sqlContent += sqlValues + ';\n';

    const sqlPath = path.join(__dirname, 'insert_bulk_500_users.sql');
    fs.writeFileSync(sqlPath, sqlContent, 'utf8');
    console.log(`SQL File exported to: ${sqlPath}`);

    // 5. Ask or insert directly into database
    console.log('\nInserting 500 users into database using batch queries...');
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < usersList.length; i += batchSize) {
      const batch = usersList.slice(i, i + batchSize);
      const query = `
        INSERT INTO users (first_name, last_name, email, job_title, company_name, country, password_hash, role, is_active, failed_login_attempts, locked_until, created_at)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          password_hash = VALUES(password_hash),
          is_active = 1,
          failed_login_attempts = 0,
          locked_until = NULL
      `;
      const batchWithTimestamp = batch.map(u => [...u, new Date()]);
      await pool.query(query, [batchWithTimestamp]);
      insertedCount += batch.length;
      console.log(`Progress: ${insertedCount}/${TOTAL_USERS} users processed`);
    }

    console.log(`\nSUCCESS: ${insertedCount} users are ready in the database!`);
    console.log(`\nTest Login Credentials:`);
    console.log(`Email: bulk.user001@tgstest.com`);
    console.log(`Password: ${DEFAULT_PASSWORD}`);
    console.log(`\nAll users are active and ready to log in immediately!`);
  } catch (error) {
    console.error('Error creating bulk users:', error);
  } finally {
    process.exit(0);
  }
}

generateBulkUsers();
