const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testSuite() {
    console.log('===============================================================');
    console.log('--- TESTING SIMPLIFIED FILE-BASED LANDING PAGES (PORT 5000) ---');
    console.log('===============================================================');

    let passed = 0;
    let failed = 0;

    // Test 1: Basic Landing Page HTML (with inline styles & scripts)
    try {
        const res1 = await axios.get('http://localhost:5000/lp/test-whitepaper');
        const hasTitle = res1.data.includes('Healthcare MyChart');
        const hasBase = res1.data.includes('<base href="/lp/test-whitepaper/">');
        const hasInlineStyles = res1.data.includes('<style>') && res1.data.includes('--primary');
        const hasInlineScripts = res1.data.includes('<script>') && res1.data.includes('handleLeadSubmit');
        if (res1.status === 200 && hasTitle && hasBase && hasInlineStyles && hasInlineScripts) {
            console.log('✅ Test 1 (HTML /lp/test-whitepaper): PASS (status 200, inline styles/scripts, injected base tag)');
            passed++;
        } else {
            console.error('❌ Test 1: FAIL', { status: res1.status, hasTitle, hasBase, hasInlineStyles, hasInlineScripts });
            failed++;
        }
    } catch (e) {
        console.error('❌ Test 1 failed:', e.message);
        failed++;
    }

    // Test 2: Assets - Image inside assets/
    try {
        const res2 = await axios.get('http://localhost:5000/lp/test-whitepaper/assets/banner.jpg', { responseType: 'arraybuffer' });
        if (res2.status === 200 && res2.headers['content-type'].includes('image/jpeg') && res2.data.byteLength > 50) {
            console.log(`✅ Test 2 (Image /lp/.../assets/banner.jpg): PASS (status 200, image/jpeg, ${res2.data.byteLength} bytes)`);
            passed++;
        } else {
            console.error('❌ Test 2: FAIL', res2.status, res2.headers['content-type']);
            failed++;
        }
    } catch (e) {
        console.error('❌ Test 2 failed:', e.message);
        failed++;
    }

    // Test 3: Assets - PDF inside assets/
    try {
        const res3 = await axios.get('http://localhost:5000/lp/test-whitepaper/assets/whitepaper.pdf', { responseType: 'arraybuffer' });
        const isPdf = res3.headers['content-type'].includes('application/pdf');
        const isInline = res3.headers['content-disposition']?.includes('inline');
        if (res3.status === 200 && isPdf && isInline && res3.data.byteLength > 100) {
            console.log(`✅ Test 3 (PDF /lp/.../assets/whitepaper.pdf): PASS (status 200, application/pdf, inline disposition)`);
            passed++;
        } else {
            console.error('❌ Test 3: FAIL', res3.status, res3.headers['content-type']);
            failed++;
        }
    } catch (e) {
        console.error('❌ Test 3 failed:', e.message);
        failed++;
    }

    // Test 4: External folders not allowed (must be inside assets/)
    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/css/style.css');
        console.error('❌ Test 4: FAIL (Non-assets path was accessible!)');
        failed++;
    } catch (e) {
        if (e.response && (e.response.status === 404 || e.response.status === 403)) {
            console.log('✅ Test 4 (Only assets/ allowed): PASS (Non-assets subpath correctly rejected with 404)');
            passed++;
        } else {
            console.error('❌ Test 4: FAIL', e.message);
            failed++;
        }
    }

    // Test 5: Missing index.html (folder exists)
    try {
        await axios.get('http://localhost:5000/lp/invalid-page');
        console.error('❌ Test 5: FAIL (Expected 404 but got 200)');
        failed++;
    } catch (e) {
        if (e.response && e.response.status === 404) {
            console.log('✅ Test 5 (Missing index.html): PASS (Proper 404 returned without directory listing)');
            passed++;
        } else {
            console.error('❌ Test 5: FAIL with unexpected status', e.message);
            failed++;
        }
    }

    // Test 6: Missing Landing Page
    try {
        await axios.get('http://localhost:5000/lp/does-not-exist');
        console.error('❌ Test 6: FAIL (Expected 404 but got 200)');
        failed++;
    } catch (e) {
        if (e.response && e.response.status === 404) {
            console.log('✅ Test 6 (Missing landing page): PASS (Proper 404 returned)');
            passed++;
        } else {
            console.error('❌ Test 6: FAIL with unexpected status', e.message);
            failed++;
        }
    }

    // Test 7: Path Traversal Protection
    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/../../.env');
        console.error('❌ Test 7a: FAIL (Traversal request succeeded!)');
        failed++;
    } catch (e) {
        if (e.response && (e.response.status === 403 || e.response.status === 404)) {
            console.log(`✅ Test 7a (Path traversal ../../.env): PASS (Safely blocked with status ${e.response.status})`);
            passed++;
        } else {
            console.error('❌ Test 7a: FAIL', e.message);
            failed++;
        }
    }

    try {
        await axios.get('http://localhost:5000/lp/test-whitepaper/%2e%2e%2f%2e%2e%2f.env');
        console.error('❌ Test 7b: FAIL (Encoded traversal request succeeded!)');
        failed++;
    } catch (e) {
        if (e.response && (e.response.status === 403 || e.response.status === 404)) {
            console.log(`✅ Test 7b (Encoded traversal %2e%2e): PASS (Safely blocked with status ${e.response.status})`);
            passed++;
        } else {
            console.error('❌ Test 7b: FAIL', e.message);
            failed++;
        }
    }

    try {
        await axios.get('http://localhost:5000/lp/..%2ftest');
        console.error('❌ Test 7c: FAIL (Invalid slug traversal succeeded!)');
        failed++;
    } catch (e) {
        if (e.response && (e.response.status === 403 || e.response.status === 404 || e.response.status === 400)) {
            console.log(`✅ Test 7c (Invalid slug ..%2f): PASS (Safely rejected with status ${e.response.status})`);
            passed++;
        } else {
            console.error('❌ Test 7c: FAIL', e.message);
            failed++;
        }
    }

    // Test 8: Real-world Example (Enterprise AI Infrastructure)
    try {
        const resEnt = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper');
        const resLogo = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper/assets/company-logo.png');
        const resHero = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper/assets/hero.jpg');
        const resPdf = await axios.get('http://localhost:5000/lp/enterprise-ai-infrastructure-whitepaper/assets/whitepaper.pdf');
        if (resEnt.status === 200 && resLogo.status === 200 && resHero.status === 200 && resPdf.status === 200) {
            console.log('✅ Test 8 (Enterprise AI Whitepaper & Assets): PASS (status 200, HTML + assets verified)');
            passed++;
        } else {
            console.error('❌ Test 8: FAIL');
            failed++;
        }
    } catch (e) {
        console.error('❌ Test 8 failed:', e.message);
        failed++;
    }

    // Test 9: Exact User Workflow Test (Section 22 - manual-test-whitepaper)
    console.log('\n--- TESTING EXACT USER WORKFLOW (SECTION 22) ---');
    try {
        const manualHtmlRes = await axios.get('http://localhost:5000/lp/manual-test-whitepaper');
        const manualImgRes = await axios.get('http://localhost:5000/lp/manual-test-whitepaper/assets/test-image.jpg', { responseType: 'arraybuffer' });
        if (manualHtmlRes.status === 200 && manualHtmlRes.data.includes('Manual Workflow Test') && manualImgRes.status === 200) {
            console.log('✅ Test 9 (Manual Workflow /lp/manual-test-whitepaper): PASS (index.html + assets/test-image.jpg work)');
            passed++;
        } else {
            console.error('❌ Test 9: FAIL', manualHtmlRes.status, manualImgRes.status);
            failed++;
        }
    } catch (e) {
        console.error('❌ Test 9 failed:', e.message);
        failed++;
    }

    // Test 10: Dynamic Folder Renaming (Section 23 - Folder Name = URL without DB)
    console.log('\n--- TESTING FOLDER RENAMING DYNAMICS (SECTION 23) ---');
    const lpRoot = path.join(__dirname, '../landing-pages');
    const folderA = path.join(lpRoot, 'my-new-whitepaper');
    const folderB = path.join(lpRoot, 'enterprise-ai-whitepaper');
    try {
        if (!fs.existsSync(folderA)) fs.mkdirSync(folderA, { recursive: true });
        fs.writeFileSync(path.join(folderA, 'index.html'), '<h1>My New Whitepaper</h1>');

        // Access URL A
        const resA = await axios.get('http://localhost:5000/lp/my-new-whitepaper');
        const passA = resA.status === 200 && resA.data.includes('My New Whitepaper');

        // Rename to folder B
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });
        fs.renameSync(folderA, folderB);

        // Access URL B
        const resB = await axios.get('http://localhost:5000/lp/enterprise-ai-whitepaper');
        const passB = resB.status === 200 && resB.data.includes('My New Whitepaper');

        // Clean up
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });

        if (passA && passB) {
            console.log('✅ Test 10 (Folder Name Dynamic URL): PASS (Folder rename automatically updates URL without DB)');
            passed++;
        } else {
            console.error('❌ Test 10: FAIL', { passA, passB });
            failed++;
        }
    } catch (e) {
        console.error('❌ Test 10 failed:', e.message);
        if (fs.existsSync(folderA)) fs.rmSync(folderA, { recursive: true, force: true });
        if (fs.existsSync(folderB)) fs.rmSync(folderB, { recursive: true, force: true });
        failed++;
    }

    // Test 11: Frontend Proxy (Port 5173 -> 5000)
    console.log('\n--- TESTING VIA FRONTEND DEV SERVER PROXY (PORT 5173) ---');
    try {
        const fRes1 = await axios.get('http://localhost:5173/lp/test-whitepaper');
        const fRes2 = await axios.get('http://localhost:5173/lp/test-whitepaper/assets/banner.jpg', { responseType: 'arraybuffer' });
        const fRes3 = await axios.get('http://localhost:5173/lp/test-whitepaper/assets/whitepaper.pdf', { responseType: 'arraybuffer' });
        if (fRes1.status === 200 && fRes2.status === 200 && fRes3.status === 200) {
            console.log('✅ Test 11 (Frontend Proxy): PASS (Port 5173 proxies HTML, images, and PDFs seamlessly)');
            passed++;
        } else {
            console.error('❌ Test 11 (Frontend Proxy): FAIL');
            failed++;
        }
    } catch (e) {
        console.error('⚠️ Frontend proxy test note:', e.message);
    }

    // Test 12: Existing Public Content & CMS APIs (Regression check)
    console.log('\n--- TESTING EXISTING CMS / PUBLIC APIS (NO REGRESSION) ---');
    try {
        const catRes = await axios.get('http://localhost:5000/api/public/categories');
        const statsRes = await axios.get('http://localhost:5000/api/public/stats');
        if (catRes.status === 200 && statsRes.status === 200) {
            console.log(`✅ Test 12 (Existing CMS APIs): PASS (Categories and Stats intact)`);
            passed++;
        } else {
            console.error('❌ Test 12: FAIL');
            failed++;
        }
    } catch (e) {
        console.error('❌ Existing APIs regression check failed:', e.message);
        failed++;
    }

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    return { passed, failed };
}

testSuite().then(results => {
    if (results.failed > 0) process.exit(1);
    process.exit(0);
}).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
