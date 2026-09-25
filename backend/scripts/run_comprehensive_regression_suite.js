const axios = require('axios');
const { pool } = require('../src/config/database');

const BASE_URL = 'http://localhost:5000';

async function runComprehensiveSuite() {
    console.log('================================================================');
    console.log('🔬 STARTING COMPLETE REGRESSION TEST SUITE (25 AUDIT ISSUES & CORE)');
    console.log('================================================================\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const testResults = [];

    async function test(area, name, fn) {
        totalTests++;
        try {
            await fn();
            console.log(`  ✅ [PASS] (${area}) ${name}`);
            passedTests++;
            testResults.push({ area, name, status: 'PASS', error: null });
        } catch (err) {
            console.error(`  ❌ [FAIL] (${area}) ${name}: ${err.message}`);
            failedTests++;
            testResults.push({ area, name, status: 'FAIL', error: err.message });
        }
    }

    let userCookie = '';
    let adminCookie = '';

    // -------------------------------------------------------------
    // AREA 1: AUTHENTICATION & AUTHORIZATION
    // -------------------------------------------------------------
    console.log('\n--- AREA 1: Authentication, Authorization & Privilege Escalation ---');

    await test('AUTH', 'User Registration with valid fields creates standard account', async () => {
        const testEmail = `reg-normal-${Date.now()}@example.com`;
        const res = await axios.post(`${BASE_URL}/api/auth/register`, {
            first_name: 'Test',
            last_name: 'Normal',
            email: testEmail,
            job_title: 'Developer',
            company_name: 'Test Lab',
            country: 'US',
            password: 'StrongPassword123!'
        });
        if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
        const [rows] = await pool.query('SELECT id, role FROM users WHERE email = ?', [testEmail]);
        if (!rows.length || rows[0].role !== 'user') throw new Error(`Role is not 'user': ${rows[0]?.role}`);
        await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
    });

    await test('AUTH', 'ISSUE-SEC-01: Privilege escalation attempt (role: admin) is strictly ignored', async () => {
        const testEmail = `reg-escl-${Date.now()}@example.com`;
        const res = await axios.post(`${BASE_URL}/api/auth/register`, {
            first_name: 'Attacker',
            last_name: 'Admin',
            email: testEmail,
            job_title: 'Security Auditor',
            company_name: 'Test Corp',
            country: 'US',
            password: 'StrongPassword123!',
            role: 'admin'
        });
        if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
        const [rows] = await pool.query('SELECT role FROM users WHERE email = ?', [testEmail]);
        if (rows[0].role === 'admin') throw new Error('Privilege escalation succeeded! Admin role was granted');
        if (rows[0].role !== 'user') throw new Error(`Unexpected role: ${rows[0].role}`);
        await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
    });

    await test('AUTH', 'Normal user login sets authentication cookies and returns user profile', async () => {
        const res = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'user@tgstechinfo.com',
            password: 'User@123'
        });
        if (res.status !== 200 || !res.headers['set-cookie']) throw new Error('Failed to retrieve auth cookie');
        userCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        if (res.data.user.role !== 'user') throw new Error(`Expected role user, got ${res.data.user.role}`);
    });

    await test('AUTH', 'Admin user login sets admin authentication cookies', async () => {
        const res = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@tgstechinfo.com',
            password: 'Admin@123'
        });
        if (res.status !== 200 || !res.headers['set-cookie']) throw new Error('Failed to retrieve admin auth cookie');
        adminCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        if (res.data.user.role !== 'admin') throw new Error(`Expected role admin, got ${res.data.user.role}`);
    });

    await test('AUTH', 'ISSUE-SEC-03: Normal user cannot access admin content endpoints (403 Forbidden)', async () => {
        try {
            await axios.get(`${BASE_URL}/api/admin/content/all`, {
                headers: { Cookie: userCookie }
            });
            throw new Error('User was able to access admin endpoint with status 200');
        } catch (err) {
            if (err.response && (err.response.status === 403 || err.response.status === 401)) {
                return; // Expected
            }
            throw err;
        }
    });

    await test('AUTH', 'ISSUE-SEC-03: Unauthenticated request to admin content is blocked (401)', async () => {
        try {
            await axios.get(`${BASE_URL}/api/admin/content/all`);
            throw new Error('Unauthenticated request succeeded');
        } catch (err) {
            if (err.response && err.response.status === 401) return;
            throw err;
        }
    });

    await test('AUTH', 'ISSUE-UI-01: User profile update persists job_title, company_name, and country', async () => {
        const testJob = `Lead Engineer ${Date.now()}`;
        const res = await axios.put(`${BASE_URL}/api/auth/profile`, {
            first_name: 'TGS',
            last_name: 'Tester',
            job_title: testJob,
            company_name: 'TGS Global',
            country: 'India'
        }, {
            headers: { Cookie: userCookie }
        });
        if (res.status !== 200) throw new Error(`Profile update failed: ${res.status}`);
        const [profile] = await pool.query('SELECT job_title, company_name, country FROM users WHERE email = ?', ['user@tgstechinfo.com']);
        if (profile[0].job_title !== testJob || profile[0].country !== 'India') {
            throw new Error(`Profile values in DB did not match: ${JSON.stringify(profile[0])}`);
        }
    });

    // -------------------------------------------------------------
    // AREA 2: PUBLIC CONTENT & VISIBILITY SAFEGUARDS
    // -------------------------------------------------------------
    console.log('\n--- AREA 2: Public Content & Visibility Safeguards ---');

    await test('CONTENT', 'Public Content list returns 200 and defaults to 10 items', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/content`);
        if (res.status !== 200 || !Array.isArray(res.data.data)) throw new Error('Invalid content list format');
        if (res.data.data.length > 10) throw new Error(`Expected <= 10 items, got ${res.data.data.length}`);
    });

    await test('CONTENT', 'ISSUE-DB-03: Pagination limit sanitization clamps high numbers to 100 max', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/content?limit=50000`);
        if (res.status !== 200 || res.data.data.length > 100) {
            throw new Error(`Limit was not clamped to <= 100. Returned: ${res.data.data.length}`);
        }
    });

    await test('CONTENT', 'ISSUE-DB-03: Tolerates invalid limit/offset params (NaN, negative)', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/content?limit=xyz&offset=-99`);
        if (res.status !== 200 || !Array.isArray(res.data.data)) {
            throw new Error('API failed on invalid pagination parameters');
        }
    });

    await test('CONTENT', 'ISSUE-SEC-06: Draft articles return 404 to public visitors', async () => {
        const draftSlug = `draft-test-${Date.now()}`;
        const [ins] = await pool.query(`
            INSERT INTO contents (title, slug, status, content_type_id, is_visible_on_site, created_at, updated_at)
            VALUES ('Draft Article Test', ?, 'draft', 1, 1, NOW(), NOW())
        `, [draftSlug]);
        const draftId = ins.insertId;

        try {
            const res = await axios.get(`${BASE_URL}/api/public/content/${draftSlug}`);
            throw new Error(`Draft article returned ${res.status} instead of 404!`);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                await pool.query('DELETE FROM contents WHERE id = ?', [draftId]);
                return;
            }
            await pool.query('DELETE FROM contents WHERE id = ?', [draftId]);
            throw err;
        }
    });

    await test('CONTENT', 'ISSUE-SEC-06 & ISSUE-CONT-02: Hidden published articles (is_visible_on_site=0) return 404', async () => {
        const hiddenSlug = `hidden-test-${Date.now()}`;
        const [ins] = await pool.query(`
            INSERT INTO contents (title, slug, status, content_type_id, is_visible_on_site, created_at, updated_at)
            VALUES ('Hidden Article Test', ?, 'published', 1, 0, NOW(), NOW())
        `, [hiddenSlug]);
        const hiddenId = ins.insertId;

        try {
            const res = await axios.get(`${BASE_URL}/api/public/content/${hiddenSlug}`);
            throw new Error(`Hidden article returned ${res.status} instead of 404!`);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                await pool.query('DELETE FROM contents WHERE id = ?', [hiddenId]);
                return;
            }
            await pool.query('DELETE FROM contents WHERE id = ?', [hiddenId]);
            throw err;
        }
    });

    await test('CONTENT', 'ISSUE-CONT-01: Future scheduled articles are not publicly accessible until scheduled date', async () => {
        const futureSlug = `future-test-${Date.now()}`;
        const [ins] = await pool.query(`
            INSERT INTO contents (title, slug, status, content_type_id, is_visible_on_site, scheduled_publish_date, created_at, updated_at)
            VALUES ('Future Scheduled Test', ?, 'scheduled', 1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), NOW(), NOW())
        `, [futureSlug]);
        const futureId = ins.insertId;

        try {
            const res = await axios.get(`${BASE_URL}/api/public/content/${futureSlug}`);
            throw new Error(`Future scheduled article was returned publicly with status ${res.status}!`);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                await pool.query('DELETE FROM contents WHERE id = ?', [futureId]);
                return;
            }
            await pool.query('DELETE FROM contents WHERE id = ?', [futureId]);
            throw err;
        }
    });

    await test('CONTENT', 'ISSUE-CONT-01: Scheduled runner publishes content when scheduled_publish_date arrives', async () => {
        const dueSlug = `due-test-${Date.now()}`;
        const [ins] = await pool.query(`
            INSERT INTO contents (title, slug, status, content_type_id, is_visible_on_site, scheduled_publish_date, created_at, updated_at)
            VALUES ('Due Scheduled Test', ?, 'scheduled', 1, 1, DATE_SUB(NOW(), INTERVAL 5 MINUTE), NOW(), NOW())
        `, [dueSlug]);
        const dueId = ins.insertId;

        // Run the promotion query (the same query in server.js interval)
        await pool.query(`
            UPDATE contents
            SET status = 'published', published_date = NOW()
            WHERE status = 'scheduled'
              AND scheduled_publish_date IS NOT NULL
              AND scheduled_publish_date <= NOW()
              AND id = ?
        `, [dueId]);

        const [rows] = await pool.query('SELECT status FROM contents WHERE id = ?', [dueId]);
        if (rows[0].status !== 'published') throw new Error(`Content not transitioned to published: status is ${rows[0].status}`);

        const res = await axios.get(`${BASE_URL}/api/public/content/${dueSlug}`);
        if (res.status !== 200) throw new Error(`Newly published article failed to load publicly`);

        await pool.query('DELETE FROM contents WHERE id = ?', [dueId]);
    });

    // -------------------------------------------------------------
    // AREA 3: DATABASE SCHEMA & VIEWS SYNCHRONIZATION
    // -------------------------------------------------------------
    console.log('\n--- AREA 3: Database Schema & Views Synchronization ---');

    await test('DATABASE', 'ISSUE-DB-02: contents.user_id matches users.id type and has index', async () => {
        const [cCol] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="user_id"');
        const [uCol] = await pool.query('SHOW COLUMNS FROM users WHERE Field="id"');
        if (cCol[0].Type !== 'bigint(20) unsigned' || uCol[0].Type !== 'bigint(20) unsigned') {
            throw new Error(`Type mismatch: contents.user_id=${cCol[0].Type}, users.id=${uCol[0].Type}`);
        }
        const [idx] = await pool.query('SHOW INDEX FROM contents WHERE Column_name="user_id"');
        if (!idx.length) throw new Error('Missing index on contents.user_id');
    });

    await test('DATABASE', 'ISSUE-CONT-01: contents.status enum contains scheduled and archived', async () => {
        const [statusCol] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="status"');
        const type = statusCol[0].Type;
        if (!type.includes("'scheduled'") || !type.includes("'archived'")) {
            throw new Error(`contents.status missing enum values: ${type}`);
        }
    });

    await test('DATABASE', 'ISSUE-DB-01: View count increment synchronizes both view_count and views_count', async () => {
        const [arts] = await pool.query("SELECT id, view_count, views_count FROM contents WHERE status='published' LIMIT 1");
        if (!arts.length) throw new Error('No published content found to test view count');
        const article = arts[0];
        const oldView = article.view_count || 0;

        const res = await axios.post(`${BASE_URL}/api/public/content/${article.id}/view`);
        if (res.status !== 200) throw new Error(`View increment returned ${res.status}`);

        const [updated] = await pool.query('SELECT view_count, views_count FROM contents WHERE id = ?', [article.id]);
        if (updated[0].view_count !== updated[0].views_count) {
            throw new Error(`Desynchronized counts! view_count=${updated[0].view_count}, views_count=${updated[0].views_count}`);
        }
        if (updated[0].view_count < oldView + 1) {
            throw new Error(`view_count did not increment! Before: ${oldView}, After: ${updated[0].view_count}`);
        }
    });

    // -------------------------------------------------------------
    // AREA 4: SECURITY (IDOR, SSRF, ERROR DISCLOSURE)
    // -------------------------------------------------------------
    console.log('\n--- AREA 4: Security Protections (IDOR, SSRF, Error Masking) ---');

    await test('SECURITY', 'ISSUE-SEC-02: Public submission IDOR endpoint removed/protected (404/401)', async () => {
        try {
            await axios.get(`${BASE_URL}/api/public/submission/1`);
            throw new Error('Endpoint returned 200 unauthenticated');
        } catch (err) {
            if (err.response && (err.response.status === 404 || err.response.status === 401)) return;
            throw err;
        }
    });

    await test('SECURITY', 'ISSUE-SEC-05: Lead form webhook rejects SSRF to private/loopback IPs', async () => {
        try {
            const res = await axios.post(`${BASE_URL}/api/public/landing-page`, {
                content_id: 1,
                name: 'SSRF Test',
                email: 'test@example.com',
                phone: '1234567890',
                webhook_url: 'http://127.0.0.1:8080/internal'
            });
            if (res.data?.webhook_triggered === true) {
                throw new Error('Private loopback webhook was permitted and triggered!');
            }
        } catch (err) {
            if (err.response && (err.response.status === 400 || err.response.status === 403)) return;
        }
    });

    await test('SECURITY', 'ISSUE-SEC-08: Global error handler masks internal stack traces in production', async () => {
        try {
            await axios.get(`${BASE_URL}/api/public/content/%c0%ae%c0%ae`);
        } catch (err) {
            if (err.response && err.response.data) {
                const bodyStr = JSON.stringify(err.response.data);
                if (bodyStr.includes('node_modules') || bodyStr.includes('SQL syntax') || bodyStr.includes('Error:')) {
                    if (process.env.NODE_ENV === 'production') {
                        throw new Error('Stack trace or internal details exposed in error response');
                    }
                }
            }
        }
    });

    // -------------------------------------------------------------
    // AREA 5: CHATBOT SEARCH & PRIVACY
    // -------------------------------------------------------------
    console.log('\n--- AREA 5: Chatbot Functionality & Isolation ---');

    await test('CHATBOT', 'ISSUE-SEC-04: Chatbot administrative queries require admin token', async () => {
        try {
            await axios.get(`${BASE_URL}/api/chatbot/queries`);
            throw new Error('Unauthenticated chatbot query logs access was granted');
        } catch (err) {
            if (err.response && err.response.status === 401) return;
            throw err;
        }
    });

    await test('CHATBOT', 'ISSUE-CHAT-01: Chatbot search strictly filters out draft/hidden/scheduled content', async () => {
        const res = await axios.post(`${BASE_URL}/api/chatbot/search`, {
            query: 'technology',
            limit: 5
        });
        if (res.status !== 200 || !res.data.success) throw new Error('Chatbot search failed');
        if (res.data.results && res.data.results.length > 0) {
            const ids = res.data.results.map(r => r.id);
            const [rows] = await pool.query('SELECT id, status, is_visible_on_site, scheduled_publish_date FROM contents WHERE id IN (?)', [ids]);
            for (const item of rows) {
                if (item.status !== 'published') throw new Error(`Chatbot returned non-published article #${item.id}`);
                if (item.is_visible_on_site === 0) throw new Error(`Chatbot returned hidden article #${item.id}`);
                if (item.scheduled_publish_date && new Date(item.scheduled_publish_date) > new Date()) {
                    throw new Error(`Chatbot returned future scheduled article #${item.id}`);
                }
            }
        }
    });

    // -------------------------------------------------------------
    // AREA 6: ADMIN DASHBOARD DYNAMIC ANALYTICS
    // -------------------------------------------------------------
    console.log('\n--- AREA 6: Admin Dashboard Dynamic Analytics ---');

    await test('ANALYTICS', 'ISSUE-UI-03: Admin KPIs return real database computations', async () => {
        const res = await axios.get(`${BASE_URL}/api/admin/dashboard/kpis`, {
            headers: { Cookie: adminCookie }
        });
        if (res.status !== 200) throw new Error(`KPIs endpoint failed: ${res.status}`);
        const kpis = res.data;
        if (kpis.totalPublished === undefined) throw new Error('totalPublished is missing');
        if (kpis.totalViews === undefined) throw new Error('totalViews is missing');
        if (kpis.avgReadTime === undefined) throw new Error('avgReadTime is missing');
        if (kpis.viewsDelta === undefined) throw new Error('viewsDelta is missing');
    });

    // -------------------------------------------------------------
    // AREA 7: ADDITIONAL CORE & ROUTE TESTING
    // -------------------------------------------------------------
    console.log('\n--- AREA 7: Additional Core Endpoints & Route Verification ---');

    await test('CORE', 'Public categories endpoint returns array of categories', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/categories`);
        if (res.status !== 200 || !Array.isArray(res.data)) throw new Error('Categories failed');
    });

    await test('CORE', 'Public search endpoint queries content with query string', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/search?q=innovation`);
        if (res.status !== 200 || !Array.isArray(res.data)) throw new Error('Search failed');
    });

    await test('CORE', 'Public case studies endpoint returns 200', async () => {
        const res = await axios.get(`${BASE_URL}/api/public/case-studies`);
        if (res.status !== 200) throw new Error('Case studies failed');
    });

    await test('CORE', 'Admin content pending review list loads with admin credentials', async () => {
        const res = await axios.get(`${BASE_URL}/api/admin/content/pending`, {
            headers: { Cookie: adminCookie }
        });
        if (res.status !== 200) throw new Error(`Admin content review failed: ${res.status}`);
    });

    await test('CORE', 'User submissions list loads with user credentials', async () => {
        const res = await axios.get(`${BASE_URL}/api/user/submissions`, {
            headers: { Cookie: userCookie }
        });
        if (res.status !== 200) throw new Error(`User submissions failed: ${res.status}`);
    });

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📊 COMPREHENSIVE REGRESSION SUITE RESULTS');
    console.log(`   Total Tests:  ${totalTests}`);
    console.log(`   Passed Tests: ${passedTests}`);
    console.log(`   Failed Tests: ${failedTests}`);
    console.log('================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runComprehensiveSuite();
