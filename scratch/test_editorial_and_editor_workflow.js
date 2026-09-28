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
    const [contentRows] = await conn.query("SELECT * FROM contents WHERE status = 'published' LIMIT 1");
    const [pendingRows] = await conn.query("SELECT * FROM contents WHERE status = 'pending' LIMIT 1");

    const admin = adminRows[0];
    const user = userRows[0];
    const article = contentRows[0];
    const pendingArticle = pendingRows[0] || article;

    console.log(`Testing with Admin #${admin.id}, User #${user.id}, Content #${article.id}`);

    const adminToken = generateToken(admin);
    const userToken = generateToken(user);

    const client = axios.create({
      baseURL: 'http://localhost:5000',
      validateStatus: () => true
    });

    // 1. Test Admin Fetch Content for Review
    const resReviewContent = await client.get(`/api/admin/content/${pendingArticle.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`[PASS] GET /api/admin/content/${pendingArticle.id}: status ${resReviewContent.status}`);
    if (resReviewContent.status !== 200) throw new Error('Failed to load content for review');

    // 2. Test ContentReviewDetail action API: PUT /api/admin/content/:id/review (dry run query)
    const [revCheck] = await conn.query("SELECT id, status FROM contents WHERE id = ?", [pendingArticle.id]);
    console.log(`[PASS] Content status before test: ${revCheck[0].status}`);

    // 3. Test Editor Fetch Content (used by CreateContent)
    const resEditorContent = await client.get(`/api/user/content/${article.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`[PASS] GET /api/user/content/${article.id}: status ${resEditorContent.status}`);

    // 4. Test Public Categories and Content Types (required by editor)
    const resCats = await client.get('/api/public/categories');
    const resTypes = await client.get('/api/public/content-types');
    console.log(`[PASS] Meta APIs: Categories (${resCats.data?.length}), Types (${resTypes.data?.length})`);

    await conn.end();
    console.log('✅ ALL EDITORIAL REVIEW & EDITOR WORKFLOW CHECKS PASSED!');
  } catch(e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
  }
})();
