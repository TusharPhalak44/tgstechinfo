const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const { hashPassword, comparePassword } = require('../src/config/auth');

async function processAll() {
  console.log('Reading C:/Users/TGS34/Downloads/users.sql ...');
  const sqlPath = 'C:/Users/TGS34/Downloads/users.sql';
  const content = fs.readFileSync(sqlPath, 'utf8');
  const lines = content.split('\n');
  const rowRegex = /\(\s*\d+\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(?:NULL|'[^']*')\s*,\s*'([^']*)'/;

  const passwordMap = new Map();
  for (const line of lines) {
    const match = line.match(rowRegex);
    if (match) {
      passwordMap.set(match[3].toLowerCase().trim(), match[7].trim());
    }
  }

  console.log('Loaded', passwordMap.size, 'passwords from users.sql');

  const [dbUsers] = await pool.query(
    'SELECT id, email, first_name, last_name, company_name, country FROM users WHERE id BETWEEN 6 AND 504 ORDER BY id ASC'
  );
  console.log('Total DB users to update:', dbUsers.length);

  const updates = [];
  const exportRows = ['id,first_name,last_name,email,plain_password,company_name,country'];

  // Map to cache bcrypt hashes for duplicate passwords (huge speedup!)
  const hashCache = new Map();

  for (let i = 0; i < dbUsers.length; i++) {
    const u = dbUsers[i];
    const emailKey = u.email.toLowerCase().trim();
    let plainPw = passwordMap.get(emailKey);

    if (!plainPw) {
      if (emailKey === 'user123@gmail.com') {
        plainPw = 'tgstechinfo@2026';
      } else if (u.company_name) {
        const cleanCompany = u.company_name.replace(/[^a-zA-Z0-9]/g, '');
        plainPw = cleanCompany + '@2026';
      } else {
        plainPw = 'User@123';
      }
    }

    // Get or generate bcrypt hash
    let hash = hashCache.get(plainPw);
    if (!hash) {
      hash = await hashPassword(plainPw);
      hashCache.set(plainPw, hash);
    }

    // Update DB
    await pool.query(
      'UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, is_active = 1 WHERE id = ?',
      [hash, u.id]
    );

    exportRows.push(
      `${u.id},"${u.first_name}","${u.last_name}","${u.email}","${plainPw}","${u.company_name || ''}","${u.country || ''}"`
    );

    if ((i + 1) % 50 === 0 || i === dbUsers.length - 1) {
      console.log(`Processed and updated ${i + 1} / ${dbUsers.length} users...`);
    }
  }

  // Save CSV
  const csvPath = path.join(__dirname, 'user_credentials_500.csv');
  fs.writeFileSync(csvPath, exportRows.join('\n'), 'utf8');
  console.log(`\n✅ Successfully exported credentials CSV to ${csvPath}`);

  // Test sample logins
  console.log('\nVerifying sample users against updated hashes:');
  const testSample = [
    { email: 'diya.patel1@outlook.com', expectedPw: passwordMap.get('diya.patel1@outlook.com') || 'AdobeMarketo@2026' },
    { email: 'zoe.wilson3@yahoo.com', expectedPw: passwordMap.get('zoe.wilson3@yahoo.com') || 'DemandbaseAustralia@2026' },
    { email: 'lucas.thomas50@company.com', expectedPw: passwordMap.get('lucas.thomas50@company.com') || 'ClearbitAustralia@2026' },
    { email: 'user123@gmail.com', expectedPw: 'tgstechinfo@2026' }
  ];

  for (const item of testSample) {
    const [r] = await pool.query('SELECT password_hash FROM users WHERE email = ?', [item.email]);
    if (r.length > 0) {
      const ok = await comparePassword(item.expectedPw, r[0].password_hash);
      console.log(`  ${item.email} (password: "${item.expectedPw}") => Hash valid: ${ok}`);
    }
  }

  process.exit(0);
}

processAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
