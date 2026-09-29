const path = require('path');
module.paths.push(path.join(__dirname, 'backend', 'node_modules'));
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function runFullRegressionAudit() {
    console.log('========================================================================');
    console.log('           RUNNING FULL REGRESSION AUDIT (TGS PUBLISH PLATFORM)         ');
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

    // 1. File-based Landing Page Server Serving (Simplified standard)
    console.log('[SECTION 1: File-Based Landing Page HTML]');
    try {
        const res = await axios.get('http://localhost:5000/lp/test-whitepaper');
        assert('HTML Page returns 200 OK', res.status === 200);
        assert('Content contains expected whitepaper title', res.data.includes('Healthcare MyChart'));
        assert('Injected <base> tag is present for relative links', res.data.includes('<base href="/lp/test-whitepaper/">'));
        assert('Inline CSS style block is present', res.data.includes('<style>') && res.data.includes('--primary'));
        assert('Inline JavaScript script block is present', res.data.includes('<script>') && res.data.includes('handleLeadSubmit'));
        assert('Content-Type header is text/html', res.headers['content-type'].includes('text/html'));
        assert('Cache-Control is no-cache for instant development visibility', res.headers['cache-control'].includes('no-cache'));
    } catch (e) {
        assert('HTML Page returns 200 OK', false, e.message);
    }

    // 2. Static Assets Delivery (strictly within assets/)
    console.log('\n[SECTION 2: Static Assets Delivery (assets/ folder)]');
    try {
        const imgRes = await axios.get('http://localhost:5000/lp/test-whitepaper/assets/banner.jpg', { responseType: 'arraybuffer' });
        assert('Image /lp/test-whitepaper/assets/banner.jpg returns 200', imgRes.status === 200);
        assert('Image Content-Type is image/jpeg', imgRes.headers['content-type'].includes('image/jpeg'));
        assert('Image binary byte length is non-empty', imgRes.data.byteLength > 50);
    } catch (e) {
        assert('Image asset returns 200', false, e.message);
    }

    try {
        const pdfRes = await axios.get('http://localhost:5000/lp/test-whitepaper/assets/whitepaper.pdf', { responseType: 'arraybuffer' });
        assert('PDF /lp/test-whitepaper/assets/whitepaper.pdf returns 200', pdfRes.status === 200);
        assert('PDF Content-Type is application/pdf', pdfRes.headers['content-type'].includes('application/pdf'));
        assert('PDF Content-Disposition is inline for direct viewing', pdfRes.headers['content-disposition'].includes('inline'));
    } catch (e) {
        assert('PDF asset returns 200', false, e.message);
    }

    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/css/style.css');
        assert('Non-assets folder blocked', false, 'Got 200');
    } catch (e) {
        assert('Only assets/ folder allowed: non-assets subpath rejected with 404', [404, 403].includes(e.response?.status));
    }

    // 3. Error Handling & Security Checks
    console.log('\n[SECTION 3: Security & Error Handling]');
    try {
        await axios.get('http://localhost:5000/lp/invalid-page');
        assert('Missing index.html returns 404', false, 'Got 200 instead of 404');
    } catch (e) {
        assert('Missing index.html returns 404 without directory listing', e.response?.status === 404);
    }

    try {
        await axios.get('http://localhost:5000/lp/non-existing-page-99');
        assert('Non-existing page returns 404', false, 'Got 200 instead of 404');
    } catch (e) {
        assert('Non-existing page returns 404', e.response?.status === 404);
    }

    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/../../.env');
        assert('Path traversal (../../.env) is blocked', false, 'Got 200');
    } catch (e) {
        assert('Path traversal (../../.env) is blocked (403/404)', [403, 404].includes(e.response?.status));
    }

    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/%2e%2e%2f%2e%2e%2f.env');
        assert('Encoded path traversal is blocked', false, 'Got 200');
    } catch (e) {
        assert('Encoded path traversal (%2e%2e) is blocked (403/404)', [403, 404].includes(e.response?.status));
    }

    try {
        await axios.get('http://localhost:5000/lp/..%2ftest');
        assert('Slug traversal is rejected', false, 'Got 200');
    } catch (e) {
        assert('Slug traversal (..%2f) is rejected (400/403/404)', [400, 403, 404].includes(e.response?.status));
    }

    // 4. Real-World Enterprise AI Landing Page
    console.log('\n[SECTION 4: Real-World Enterprise AI Landing Page]');
    try {
        const entRes = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper');
        assert('Enterprise AI Landing Page HTML returns 200', entRes.status === 200);
        assert('Enterprise AI contains correct hero headline', entRes.data.includes('Enterprise AI Infrastructure'));

        const entLogo = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper/assets/company-logo.png', { responseType: 'arraybuffer' });
        assert('Enterprise AI Logo PNG returns 200', entLogo.status === 200);

        const entHero = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper/assets/hero.jpg', { responseType: 'arraybuffer' });
        assert('Enterprise AI Hero JPG returns 200', entHero.status === 200);

        const entPdf = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper/assets/whitepaper.pdf', { responseType: 'arraybuffer' });
        assert('Enterprise AI PDF returns 200', entPdf.status === 200);
    } catch (e) {
        assert('Enterprise AI page complete asset bundle returns 200', false, e.message);
    }

    // 5. Section 22: Exact User Workflow Test
    console.log('\n[SECTION 5: Exact User Workflow Verification (Section 22)]');
    try {
        const manHtml = await axios.get('http://localhost:5000/lp/manual-test-whitepaper');
        assert('Section 22: GET /lp/manual-test-whitepaper HTML returns 200', manHtml.status === 200 && manHtml.data.includes('Manual Workflow Test'));

        const manImg = await axios.get('http://localhost:5000/lp/manual-test-whitepaper/assets/test-image.jpg', { responseType: 'arraybuffer' });
        assert('Section 22: GET /lp/manual-test-whitepaper/assets/test-image.jpg returns 200', manImg.status === 200);
    } catch (e) {
        assert('Section 22 workflow test', false, e.message);
    }

    // 6. Section 23: Dynamic Folder Renaming (Folder Name = URL without DB)
    console.log('\n[SECTION 6: Dynamic Folder Renaming Verification (Section 23)]');
    const lpRoot = path.join(__dirname, 'backend/landing-pages');
    const folderA = path.join(lpRoot, 'workflow-test-a');
    const folderB = path.join(lpRoot, 'workflow-test-b');
    try {
        if (!fs.existsSync(folderA)) fs.mkdirSync(folderA, { recursive: true });
        fs.writeFileSync(path.join(folderA, 'index.html'), '<h1>Workflow Test Page</h1>');

        const rA = await axios.get('http://localhost:5000/lp/workflow-test-a');
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });
        fs.renameSync(folderA, folderB);
        const rB = await axios.get('http://localhost:5000/lp/workflow-test-b');

        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });

        assert('Section 23: Renaming folder changes URL dynamically without database record', rA.status === 200 && rB.status === 200);
    } catch (e) {
        if (fs.existsSync(folderA)) fs.rmSync(folderA, { recursive: true, force: true });
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });
        assert('Section 23 rename test', false, e.message);
    }

    // 7. Admin Discovery Endpoint
    console.log('\n[SECTION 7: Protected Admin Discovery Endpoint]');
    try {
        const token = jwt.sign(
            { id: 1, email: 'admin@tgstechinfo.com', role: 'admin' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );
        const adminRes = await axios.get('http://localhost:5000/api/admin/landing-pages', {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert('Admin landing-pages discovery returns 200', adminRes.status === 200);
        assert('Admin discovery contains landingPages array', Array.isArray(adminRes.data.landingPages));
        assert('Admin discovery finds enterprise-ai-infrastructure-whitepaper', adminRes.data.landingPages.some(p => p.slug === 'enterprise-ai-infrastructure-whitepaper'));
    } catch (e) {
        assert('Admin discovery endpoint functions', false, e.message);
    }

    // 8. Existing CMS & Public API Regression Checks
    console.log('\n[SECTION 8: Regression Checks on Existing Functionality]');
    try {
        const catRes = await axios.get('http://localhost:5000/api/public/categories');
        assert('Existing Categories API returns 200', catRes.status === 200);

        const statsRes = await axios.get('http://localhost:5000/api/public/stats');
        assert('Existing Public Stats API returns 200', statsRes.status === 200 && statsRes.data.totalPublished !== undefined);

        const contRes = await axios.get('http://localhost:5000/api/public/content?limit=5');
        assert('Existing Public Content API returns 200', contRes.status === 200);

        const leadRes = await axios.post('http://localhost:5000/api/public/landing-page', {
            first_name: 'Regression',
            last_name: 'Tester',
            email: 'regression@tgstechinfo.com',
            contact_number: '1234567890',
            landing_slug: 'test-whitepaper'
        });
        assert('Lead submission API returns 200 success', leadRes.status === 200 && leadRes.data.id !== undefined);
    } catch (e) {
        assert('Regression checks on existing system', false, e.message);
    }

    // 9. Frontend Dev Server Proxy (Port 5173)
    console.log('\n[SECTION 9: Frontend Dev Server Proxy (Port 5173)]');
    try {
        const fp1 = await axios.get('http://localhost:5173/lp/test-whitepaper');
        assert('Frontend proxy (port 5173) serves /lp/test-whitepaper HTML', fp1.status === 200 && fp1.data.includes('Healthcare MyChart'));

        const fp2 = await axios.get('http://localhost:5173/lp/test-whitepaper/assets/banner.jpg', { responseType: 'arraybuffer' });
        assert('Frontend proxy (port 5173) serves /lp/test-whitepaper/assets/banner.jpg', fp2.status === 200 && fp2.headers['content-type'].includes('image/jpeg'));
    } catch (e) {
        assert('Frontend proxy delivers landing pages', false, e.message);
    }

    console.log('\n========================================================================');
    console.log(`AUDIT COMPLETE: ${passed}/${total} TESTS PASSED (${failed} FAILURES)`);
    console.log('========================================================================');

    return { total, passed, failed };
}

runFullRegressionAudit().then(({ failed }) => {
    if (failed > 0) process.exit(1);
    process.exit(0);
}).catch(err => {
    console.error('Fatal audit failure:', err);
    process.exit(1);
});
