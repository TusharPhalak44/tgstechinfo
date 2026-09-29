/**
 * test_bulk_login.js
 * 
 * Tests authentication against the running server (http://localhost:5000/api/auth/login)
 * using the real passwords from user_credentials_500.csv.
 */

const fs = require('fs');
const path = require('path');

async function testLogin(email, password) {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, data: { message: err.message } };
  }
}

async function run() {
  const csvPath = path.join(__dirname, 'user_credentials_500.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0).slice(1);

  console.log(`Loaded ${lines.length} users from credentials CSV.`);

  // Test specific users that user tried in Chrome
  const targetEmails = [
    'diya.patel1@outlook.com',
    'zoe.wilson3@yahoo.com',
    'lucas.thomas50@company.com',
    'user123@gmail.com',
    'admin@tgstechinfo.com',
    'user@tgstechinfo.com'
  ];

  console.log('\n--- 1. Testing specific target users ---');
  for (const line of lines) {
    const parts = line.split(',');
    const email = parts[3].replace(/"/g, '').trim();
    const plainPw = parts[4].replace(/"/g, '').trim();

    if (targetEmails.includes(email)) {
      const result = await testLogin(email, plainPw);
      if (result.status === 200) {
        console.log(`✅ [200 OK] ${email} (Password: "${plainPw}") -> Login Successful!`);
      } else {
        console.log(`❌ [${result.status}] ${email} (Password: "${plainPw}") -> ${result.data.message}`);
      }
    }
  }

  // Also test admin & user
  const adminRes = await testLogin('admin@tgstechinfo.com', 'Admin@123');
  console.log(`✅ [${adminRes.status}] admin@tgstechinfo.com -> ${adminRes.data.message}`);

  const userRes = await testLogin('user@tgstechinfo.com', 'User@123');
  console.log(`✅ [${userRes.status}] user@tgstechinfo.com -> ${userRes.data.message}`);

  // Test 10 random users
  console.log('\n--- 2. Testing 10 Random Bulk Users from CSV ---');
  const shuffled = lines.sort(() => 0.5 - Math.random()).slice(0, 10);
  let randomPassed = 0;

  for (const line of shuffled) {
    const parts = line.split(',');
    const id = parts[0].trim();
    const name = `${parts[1].replace(/"/g, '')} ${parts[2].replace(/"/g, '')}`;
    const email = parts[3].replace(/"/g, '').trim();
    const plainPw = parts[4].replace(/"/g, '').trim();

    const result = await testLogin(email, plainPw);
    if (result.status === 200) {
      randomPassed++;
      console.log(`✅ [200 OK] ID ${id}: ${email} | Password: "${plainPw}" (${name})`);
    } else {
      console.log(`❌ [${result.status}] ID ${id}: ${email} | Password: "${plainPw}" -> ${result.data.message}`);
    }
  }

  console.log(`\nResult for 10 random users: ${randomPassed} / 10 passed!`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
