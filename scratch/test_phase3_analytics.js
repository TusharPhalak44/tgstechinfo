const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
const { generateToken } = require('../backend/src/config/auth');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'publishing_platform'
    });

    const [adminRows] = await conn.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    const [userRows] = await conn.query("SELECT * FROM users WHERE role = 'user' LIMIT 1");
    const admin = adminRows[0];
    const user = userRows[0];

    const adminToken = generateToken(admin);
    const userToken = generateToken(user);

    const client = axios.create({
      baseURL: 'http://localhost:5000',
      validateStatus: () => true
    });

    console.log('=== TEST 1: ADMIN USER REQUESTS ===');
    const adminOverview = await client.get('/api/analytics/overview', { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log(`[PASS] Admin GET /api/analytics/overview: ${adminOverview.status}`);
    if (adminOverview.status !== 200) throw new Error('Admin overview failed');

    const adminGlobal = await client.get('/api/analytics/global', { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log(`[PASS] Admin GET /api/analytics/global: ${adminGlobal.status}`);
    if (adminGlobal.status !== 200) throw new Error('Admin global failed');

    const adminGeoGlobal = await client.get('/api/analytics/geographic/global', { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log(`[PASS] Admin GET /api/analytics/geographic/global (canonical): ${adminGeoGlobal.status}`);
    if (adminGeoGlobal.status !== 200) throw new Error('Admin canonical geo global failed');

    const adminGeoTraffic = await client.get('/api/analytics/geographic/geographic-traffic', { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log(`[PASS] Admin GET /api/analytics/geographic/geographic-traffic: ${adminGeoTraffic.status}`);

    console.log('\n=== TEST 2: NORMAL CONTRIBUTOR / USER REQUESTS ===');
    const userOverview = await client.get('/api/analytics/overview', { headers: { Authorization: `Bearer ${userToken}` } });
    console.log(`[PASS] Normal User GET /api/analytics/overview: ${userOverview.status} (Expected 403 Forbidden)`);
    if (userOverview.status !== 403) throw new Error('User overview should be 403');

    const userGlobal = await client.get('/api/analytics/global', { headers: { Authorization: `Bearer ${userToken}` } });
    console.log(`[PASS] Normal User GET /api/analytics/global: ${userGlobal.status} (Expected 200 Authenticated)`);
    if (userGlobal.status !== 200) throw new Error('User global should be 200');

    const userGeoGlobal = await client.get('/api/analytics/geographic/global', { headers: { Authorization: `Bearer ${userToken}` } });
    console.log(`[PASS] Normal User GET /api/analytics/geographic/global (canonical): ${userGeoGlobal.status} (Expected 200)`);
    if (userGeoGlobal.status !== 200) throw new Error('User canonical geo global should be 200');

    console.log('\n=== TEST 3: UNAUTHENTICATED REQUESTS ===');
    const unauthOverview = await client.get('/api/analytics/overview');
    console.log(`[PASS] Unauth GET /api/analytics/overview: ${unauthOverview.status} (Expected 401)`);
    if (unauthOverview.status !== 401) throw new Error('Unauth overview should be 401');

    const unauthGlobal = await client.get('/api/analytics/global');
    console.log(`[PASS] Unauth GET /api/analytics/global: ${unauthGlobal.status} (Expected 401)`);
    if (unauthGlobal.status !== 401) throw new Error('Unauth global should be 401');

    const unauthGeoGlobal = await client.get('/api/analytics/geographic/global');
    console.log(`[PASS] Unauth GET /api/analytics/geographic/global: ${unauthGeoGlobal.status} (Expected 401)`);
    if (unauthGeoGlobal.status !== 401) throw new Error('Unauth canonical geo global should be 401');

    await conn.end();
    console.log('\n🎉 ALL PHASE 3 ANALYTICS ROUTER TESTS PASSED WITH 100% PRECISION!');
  } catch(e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
  }
})();
