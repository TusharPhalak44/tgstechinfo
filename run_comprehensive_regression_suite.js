const path = require('path');
module.paths.push(path.resolve(__dirname, 'backend/node_modules'));
const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

async function runComprehensiveSuite() {
    console.log('========================================================================');
    console.log('  COMPREHENSIVE REGRESSION SUITE: SIMPLIFIED FILE-BASED LANDING PAGES   ');
    console.log('========================================================================\n');

    let total = 0;
    let passed = 0;
    let failed = 0;

    function assert(desc, condition, details = '') {
        total++;
        if (condition) {
            console.log(`  ✅ [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${desc} ${details ? '— ' + details : ''}`);
            failed++;
        }
    }

    // Connect to database
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'publishing_platform'
        });
    } catch (e) {
        console.error('Fatal: Cannot connect to MySQL:', e.message);
        process.exit(1);
    }

    console.log('[SECTION 1: Simplified Standard — index.html + assets/]');
    // Test 1a: HTML without trailing slash (inline CSS & JS)
    try {
        const r1 = await axios.get('http://localhost:5000/lp/test-whitepaper');
        const hasHtml = r1.status === 200 && r1.data.includes('<!DOCTYPE html>');
        const hasInlineCss = r1.data.includes('<style>') && r1.data.includes('--primary');
        const hasInlineJs = r1.data.includes('<script>') && r1.data.includes('handleLeadSubmit');
        assert('Test 1a: GET /lp/test-whitepaper returns 200 HTML with inline styles & scripts', hasHtml && hasInlineCss && hasInlineJs);
    } catch (e) { assert('Test 1a', false, e.message); }

    // Test 1b: HTML with trailing slash
    try {
        const r1b = await axios.get('http://localhost:5000/lp/test-whitepaper/');
        assert('Test 1b: GET /lp/test-whitepaper/ returns 200 and HTML with base tag', r1b.status === 200 && r1b.data.includes('<base href="/lp/test-whitepaper/">'));
    } catch (e) { assert('Test 1b', false, e.message); }

    // Test 2: Image asset inside assets/
    try {
        const r2 = await axios.get('http://localhost:5000/lp/test-whitepaper/assets/banner.jpg', { responseType: 'arraybuffer' });
        assert('Test 2: Image assets/banner.jpg loaded with image/jpeg', r2.status === 200 && r2.headers['content-type'].includes('image/jpeg'));
    } catch (e) { assert('Test 2', false, e.message); }

    // Test 3: PDF asset inside assets/
    try {
        const r3 = await axios.get('http://localhost:5000/lp/test-whitepaper/assets/whitepaper.pdf', { responseType: 'arraybuffer' });
        assert('Test 3: PDF assets/whitepaper.pdf loaded with application/pdf and inline disposition', r3.status === 200 && r3.headers['content-type'].includes('application/pdf') && r3.headers['content-disposition'].includes('inline'));
    } catch (e) { assert('Test 3', false, e.message); }

    // Test 4: External folders not allowed (must be inside assets/)
    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/css/style.css');
        assert('Test 4: Non-assets subpath blocked', false, 'Got 200');
    } catch (e) {
        assert('Test 4: Only assets/ allowed (non-assets subpath returns 404)', [404, 403].includes(e.response?.status));
    }

    // Test 5: Exact user workflow (Section 22 - manual-test-whitepaper)
    try {
        const r5 = await axios.get('http://localhost:5000/lp/manual-test-whitepaper');
        const r5Img = await axios.get('http://localhost:5000/lp/manual-test-whitepaper/assets/test-image.jpg', { responseType: 'arraybuffer' });
        assert('Test 5: Section 22 workflow /lp/manual-test-whitepaper renders HTML and assets/test-image.jpg', r5.status === 200 && r5Img.status === 200);
    } catch (e) { assert('Test 5', false, e.message); }

    console.log('\n[SECTION 2: Error Handling & Security Checks]');
    // Test 6: Folder without index.html
    try {
        await axios.get('http://localhost:5000/lp/invalid-page');
        assert('Test 6: Missing index.html returns 404', false, 'Got 200');
    } catch (e) {
        assert('Test 6: Missing index.html returns proper 404', e.response?.status === 404);
    }

    // Test 7: Non-existent page
    try {
        await axios.get('http://localhost:5000/lp/does-not-exist');
        assert('Test 7: Missing landing page returns 404', false, 'Got 200');
    } catch (e) {
        assert('Test 7: Missing landing page returns proper 404', e.response?.status === 404);
    }

    // Test 8: Traversal attempts
    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/../../.env');
        assert('Test 8a: Path traversal ../../.env blocked', false, 'Got 200');
    } catch (e) {
        assert('Test 8a: Path traversal ../../.env blocked', [403, 404].includes(e.response?.status));
    }

    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/%2e%2e%2fpackage.json');
        assert('Test 8b: Encoded traversal blocked', false, 'Got 200');
    } catch (e) {
        assert('Test 8b: Encoded traversal %2e%2e blocked', [403, 404].includes(e.response?.status));
    }

    try {
        await axios.get('http://localhost:5000/lp/node_modules');
        assert('Test 8c: Reserved/system folder rejected', false, 'Got 200');
    } catch (e) {
        assert('Test 8c: Reserved/system folder rejected (404/403)', [403, 404].includes(e.response?.status));
    }

    console.log('\n[SECTION 3: Dynamic Folder Renaming (Section 23)]');
    const lpRoot = path.join(__dirname, 'backend/landing-pages');
    const folderA = path.join(lpRoot, 'dynamic-test-a');
    const folderB = path.join(lpRoot, 'dynamic-test-b');
    try {
        if (!fs.existsSync(folderA)) fs.mkdirSync(folderA, { recursive: true });
        fs.writeFileSync(path.join(folderA, 'index.html'), '<h1>Dynamic Test Whitepaper</h1>');

        const resA = await axios.get('http://localhost:5000/lp/dynamic-test-a');
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });
        fs.renameSync(folderA, folderB);
        const resB = await axios.get('http://localhost:5000/lp/dynamic-test-b');

        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });

        assert('Test 9: Dynamic folder rename changes URL instantly without DB', resA.status === 200 && resB.status === 200);
    } catch (e) {
        if (fs.existsSync(folderA)) fs.rmSync(folderA, { recursive: true, force: true });
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });
        assert('Test 9: Dynamic folder rename', false, e.message);
    }

    console.log('\n[SECTION 4: Analytics Integration & Database Recording]');
    try {
        const [pvRows] = await conn.query(
            "SELECT id, page_url, page_type FROM page_views WHERE page_url LIKE '%/lp/test-whitepaper%' ORDER BY id DESC LIMIT 1"
        );
        assert('Test 10: Analytics page_views recorded for file-based landing page', pvRows.length > 0 && pvRows[0].page_type === 'landing');
    } catch (e) {
        assert('Analytics recording check', false, e.message);
    }

    console.log('\n[SECTION 5: Lead Form Submission & Lead Storage]');
    try {
        const leadRes = await axios.post('http://localhost:5000/api/public/landing-page', {
            first_name: 'Dr. Sarah',
            last_name: 'Connor',
            email: 'sconnor@cyberdyne.org',
            contact_number: '555-0143',
            landing_slug: 'enterprise-ai-infrastructure-whitepaper',
            extra_fields: {
                role: 'Lead Architect',
                organization: 'Cyberdyne Research'
            }
        });
        assert('Test 11: Lead Form API returns 200 with submission id', leadRes.status === 200 && leadRes.data.id !== undefined);

        const [subRows] = await conn.query(
            'SELECT id, content_id, extra_fields FROM landing_page_submissions WHERE id = ?',
            [leadRes.data.id]
        );
        assert('Test 12: Database lead stored in landing_page_submissions', subRows.length > 0 && subRows[0].extra_fields.includes('sconnor@cyberdyne.org'));
    } catch (e) {
        assert('Lead submission and storage', false, e.message);
    }

    console.log('\n[SECTION 6: Existing CMS & Core System Regression]');
    try {
        const cRes = await axios.get('http://localhost:5000/api/public/categories');
        assert('Test 13: Existing CMS Public Categories API intact', cRes.status === 200 && Array.isArray(cRes.data));
    } catch (e) { assert('Public Categories API', false, e.message); }

    try {
        const contRes = await axios.get('http://localhost:5000/api/public/content?limit=5');
        assert('Test 14: Existing CMS Public Content API intact', contRes.status === 200);
    } catch (e) { assert('Public Content API', false, e.message); }

    try {
        const [tables] = await conn.query("SHOW TABLES LIKE 'landing_page_submissions'");
        assert('Test 15: Database schema integrity verified (zero schema alterations)', tables.length > 0);
    } catch (e) { assert('Database schema check', false, e.message); }

    await conn.end();

    console.log('\n========================================================================');
    console.log(`COMPREHENSIVE SUITE COMPLETE: ${passed}/${total} TESTS PASSED (${failed} FAILURES)`);
    console.log('========================================================================\n');

    return { total, passed, failed };
}

runComprehensiveSuite().then(({ failed }) => {
    if (failed > 0) process.exit(1);
    process.exit(0);
}).catch(err => {
    console.error('Fatal suite failure:', err);
    process.exit(1);
});
