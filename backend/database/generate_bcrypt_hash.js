/**
 * generate_bcrypt_hash.js
 * 
 * Utility to generate a valid Bcrypt hash compatible with the TGS Publishing backend.
 * 
 * Usage:
 *   node backend/database/generate_bcrypt_hash.js "YourPasswordHere"
 *   node backend/database/generate_bcrypt_hash.js
 */

const path = require('path');
const { hashPassword, comparePassword } = require(path.join(__dirname, '../src/config/auth'));

async function main() {
  const plainPassword = process.argv[2] || 'User@123';
  
  console.log('================================================================');
  console.log('TGS Tech Info - Bcrypt Password Hash Generator');
  console.log('================================================================');
  console.log(`Plain Password : ${plainPassword}`);
  console.log(`Hashing Algorithm: Bcrypt (12 Salt Rounds)`);
  console.log('Generating hash...');

  const hash = await hashPassword(plainPassword);
  const isValid = await comparePassword(plainPassword, hash);

  console.log(`Generated Hash : ${hash}`);
  console.log(`Hash Length    : ${hash.length} characters`);
  console.log(`Verified       : ${isValid ? 'YES (Valid)' : 'NO'}`);
  console.log('================================================================');
  console.log('\nReady-to-use SQL UPDATE query:');
  console.log(`UPDATE users SET password_hash = '${hash}', failed_login_attempts = 0, locked_until = NULL WHERE id BETWEEN 6 AND 504;\n`);
  console.log('Ready-to-use SQL INSERT template:');
  console.log(`INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)`);
  console.log(`VALUES ('First', 'Last', 'newuser@example.com', '${hash}', 'user', 1);\n`);
  console.log('================================================================');
}

main().catch(err => {
  console.error('Error generating hash:', err);
  process.exit(1);
});
