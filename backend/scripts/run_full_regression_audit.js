const axios = require('axios');
const { pool } = require('../src/config/database');

const BASE_URL = 'http://localhost:5000';

async function runRegressionAudit() {
    console.log('=====================================================');
    console.log('🚀 RUNNING FINAL REGRESSION AUDIT ACROSS ALL MODULES');
    console.log('=====================================================\n');

    let passed = 0;
    let failed = 0;

    async function check(name, testFn) {
        try {
            await testFn();
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    // 1. PUBLIC ENDPOINTS
    console.log('\n--- 1. Testing Public Content & Navigation APIs ---');
    await check('Public Content Listing (Default 10 items)', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/content`);
        if (res.status !== 200 || !Array.isArray(res.data.data) || res.data.data.length !== 10) {
            throw new Error(`Expected 200 with 10 items, got status ${res.status} and length ${res.data?.data?.length}`);
        }
    });

    await check('Public Content Pagination Bounds (limit=100000 capped to 100)', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/content?limit=100000`);
        if (res.status !== 200 || res.data.data.length > 100) {
            throw new Error(`Expected <= 100 items, got ${res.data?.data?.length}`);
        }
    });

    await check('Public Content Bad Query Tolerance (limit=abc, offset=-5)', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/content?limit=abc&offset=-5`);
        if (res.status !== 200 || !Array.isArray(res.data.data)) {
            throw new Error('API failed on bad query parameters');
        }
    });

    await check('Public Article Detail By Slug (Published item)', async () => {
        const [rows] = await pool.query("SELECT slug FROM contents WHERE status='published' AND (is_visible_on_site=1 OR is_visible_on_site IS NULL) AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= NOW()) LIMIT 1");
        if (!rows.length) throw new Error("No published article found");
        const slug = rows[0].slug;
        const res = await axios.get(`${BASE_URL}/api/public/content/${encodeURIComponent(slug)}`);
        const returnedSlug = res.data?.content?.slug || res.data?.slug;
        if (res.status !== 200 || returnedSlug !== slug) {
            throw new Error(`Failed to fetch published slug: ${slug}, returned: ${returnedSlug}`);
        }
    });

    await check('Public Categories Listing', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/categories`);
        if (res.status !== 200 || !Array.isArray(res.data)) {
            throw new Error('Failed to retrieve categories');
        }
    });

    await check('Public Content Search Endpoint', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/search?q=tech`);
        if (res.status !== 200 || !Array.isArray(res.data)) {
            throw new Error('Public search content failed');
        }
    });

    // 2. SECURITY SAFEGUARDS (IDOR & AUTHORIZATION)
    console.log('\n--- 2. Testing Security & Authorization Protections ---');
    await check('Unauthenticated Submission IDOR Blocked (404/401)', async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/public/submission/1`);
            throw new Error(`Expected 404/401, but got ${res.status}`);
        } catch (err) {
            if (err.response && (err.response.status === 404 || err.response.status === 401)) {
                // Expected protection
                return;
            }
            throw err;
        }
    });

    await check('Unauthenticated Admin Content Access Blocked (401)', async () => {
        try {
            await axios.get(`${BASE_URL}/api/admin/content`);
            throw new Error('Admin endpoint returned 200 without token');
        } catch (err) {
            if (err.response && err.response.status === 401) return;
            throw err;
        }
    });

    await check('Unauthenticated Admin Chatbot Queries Blocked (401)', async () => {
        try {
            await axios.get(`${BASE_URL}/api/chatbot/queries`);
            throw new Error('Chatbot queries returned 200 without token');
        } catch (err) {
            if (err.response && err.response.status === 401) return;
            throw err;
        }
    });

    await check('Unauthenticated Admin Dashboard KPIs Blocked (401)', async () => {
        try {
            await axios.get(`${BASE_URL}/api/admin/dashboard/kpis`);
            throw new Error('KPIs endpoint returned 200 without token');
        } catch (err) {
            if (err.response && err.response.status === 401) return;
            throw err;
        }
    });

    // 3. REGISTRATION ROLE ESCALATION
    console.log('\n--- 3. Testing Registration Role Escalation ---');
    await check('Registration forces role=user even when role=admin is sent', async () => {
        const testEmail = `regelev-${Date.now()}@example.com`;
        const res = await axios.post(`${BASE_URL}/api/auth/register`, {
            first_name: 'Attacker',
            last_name: 'Admin',
            email: testEmail,
            job_title: 'Security Auditor',
            company_name: 'Test Corp',
            country: 'US',
            password: 'StrongPassword123!',
            role: 'admin' // Attempted escalation
        });

        if (res.status !== 201) throw new Error(`Registration failed: ${res.status}`);
        const [userRow] = await pool.query('SELECT id, role FROM users WHERE email = ?', [testEmail]);
        if (userRow[0].role !== 'user') throw new Error(`Role escalation succeeded! Got role: ${userRow[0].role}`);

        // Cleanup
        await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
    });

    // 4. CHATBOT VISIBILITY SAFEGUARDS
    console.log('\n--- 4. Testing Chatbot Public Visibility Safeguards ---');
    await check('Chatbot Search only returns published + visible content', async () => {
        const res = await axios.post(`${BASE_URL}/api/chatbot/search`, {
            query: 'cloud',
            limit: 10
        });
        if (res.status !== 200 || !res.data.success) throw new Error('Chatbot search failed');
        // Verify every returned item is published
        const ids = res.data.results.map(r => r.id);
        if (ids.length > 0) {
            const [rows] = await pool.query('SELECT id, status, is_visible_on_site, scheduled_publish_date FROM contents WHERE id IN (?)', [ids]);
            for (const row of rows) {
                if (row.status !== 'published') throw new Error(`Chatbot returned non-published article #${row.id} with status ${row.status}`);
                if (row.is_visible_on_site === 0) throw new Error(`Chatbot returned hidden article #${row.id}`);
                if (row.scheduled_publish_date && new Date(row.scheduled_publish_date) > new Date()) {
                    throw new Error(`Chatbot returned future-scheduled article #${row.id}`);
                }
            }
        }
    });

    // 5. DATABASE INTEGRITY
    console.log('\n--- 5. Testing Database Schema & Counts Integrity ---');
    await check('contents.user_id type matches users.id (BIGINT UNSIGNED)', async () => {
        const [cCol] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="user_id"');
        const [uCol] = await pool.query('SHOW COLUMNS FROM users WHERE Field="id"');
        if (cCol[0].Type !== 'bigint(20) unsigned' || uCol[0].Type !== 'bigint(20) unsigned') {
            throw new Error(`Type mismatch: contents.user_id=${cCol[0].Type}, users.id=${uCol[0].Type}`);
        }
    });

    await check('contents.status enum supports scheduled and archived', async () => {
        const [statusCol] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="status"');
        if (!statusCol[0].Type.includes('scheduled') || !statusCol[0].Type.includes('archived')) {
            throw new Error(`contents.status enum missing values: ${statusCol[0].Type}`);
        }
    });

    await check('view_count and views_count sums are synchronized', async () => {
        const [[{ countMismatch }]] = await pool.query('SELECT COUNT(*) as countMismatch FROM contents WHERE view_count != views_count');
        if (countMismatch > 0) throw new Error(`Found ${countMismatch} rows with desynchronized view counts!`);
    });

    console.log('\n=====================================================');
    console.log(`📊 FINAL REGRESSION AUDIT RESULTS:`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log('=====================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runRegressionAudit();
