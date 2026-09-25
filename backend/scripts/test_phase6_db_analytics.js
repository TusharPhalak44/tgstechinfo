const { pool } = require('../src/config/database');
const Content = require('../src/models/Content');
const axios = require('axios');

async function testPhase6() {
    console.log('--- Testing Phase 6: Database & Analytics ---');
    try {
        // 1. Test ISSUE-DB-01: view_count & views_count sync
        console.log('\n1. Testing view_count and views_count synchronization:');
        const [sampleRows] = await pool.query('SELECT id, view_count, views_count FROM contents LIMIT 1');
        const sample = sampleRows[0];
        console.log(`Initial content #${sample.id}: view_count=${sample.view_count}, views_count=${sample.views_count}`);

        await Content.incrementViewCount(sample.id);

        const [afterRows] = await pool.query('SELECT id, view_count, views_count FROM contents WHERE id = ?', [sample.id]);
        const after = afterRows[0];
        console.log(`After increment content #${after.id}: view_count=${after.view_count}, views_count=${after.views_count}`);

        if (after.view_count !== sample.view_count + 1) throw new Error('view_count did not increment!');
        if (after.views_count !== sample.views_count + 1) throw new Error('views_count did not increment!');
        if (after.view_count !== after.views_count) throw new Error('view_count and views_count are out of sync!');
        console.log('✅ View count synchronization verified.');

        // Revert increment to keep data intact
        await pool.query('UPDATE contents SET view_count = ?, views_count = ? WHERE id = ?', [sample.view_count, sample.views_count, sample.id]);
        console.log('Restored test row to initial counts.');

        // 2. Test ISSUE-DB-02: contents.user_id type and insertion
        console.log('\n2. Testing contents.user_id schema and insertion:');
        const [col] = await pool.query('SHOW COLUMNS FROM contents WHERE Field="user_id"');
        console.log('contents.user_id type:', col[0].Type);
        if (col[0].Type !== 'bigint(20) unsigned') throw new Error('contents.user_id is not bigint(20) unsigned!');

        // Test insert with a bigint user_id
        const testBigintUserId = 1; // existing user
        const [insertRes] = await pool.query(`
            INSERT INTO contents (title, slug, status, user_id, is_visible_on_site, content)
            VALUES ('Bigint FK Test', 'bigint-fk-test', 'draft', ?, 1, 'Testing user_id FK compatibility')
        `, [testBigintUserId]);
        const testContentId = insertRes.insertId;
        console.log('Created test content with ID:', testContentId);

        const [testRow] = await pool.query('SELECT id, user_id, title FROM contents WHERE id = ?', [testContentId]);
        console.log('Fetched content user_id:', testRow[0].user_id);
        if (String(testRow[0].user_id) !== String(testBigintUserId)) throw new Error('user_id mismatch on fetch!');

        await pool.query('DELETE FROM contents WHERE id = ?', [testContentId]);
        console.log('✅ Foreign key type compatibility and insertion verified.');

        // 3. Test ISSUE-DB-03: Pagination limit edge cases
        console.log('\n3. Testing pagination limits against public API (http://localhost:5000/api/public/content):');
        const testCases = [
            { limit: '10', expectedMax: 10 },
            { limit: '20', expectedMax: 20 },
            { limit: '100', expectedMax: 100 },
            { limit: '100000', expectedMax: 100 }, // should clamp to 100
            { limit: '-1', expectedMax: 10 }, // should default to 10
            { limit: 'abc', expectedMax: 10 }, // should default to 10
        ];

        for (const tc of testCases) {
            const url = `http://localhost:5000/api/public/content?limit=${tc.limit}`;
            const res = await axios.get(url);
            console.log(`GET ${url} -> status=${res.status}, items returned=${res.data.data.length}, total=${res.data.total}`);
            if (res.status !== 200) throw new Error(`API failed for limit=${tc.limit}`);
            if (res.data.data.length > tc.expectedMax) {
                throw new Error(`Limit violated: received ${res.data.data.length} items, expected <= ${tc.expectedMax}`);
            }
        }

        // Test bad offset
        const badOffsetUrl = 'http://localhost:5000/api/public/content?limit=5&offset=abc';
        const resOffset = await axios.get(badOffsetUrl);
        console.log(`GET ${badOffsetUrl} -> status=${resOffset.status}, items returned=${resOffset.data.data.length}`);
        if (resOffset.status !== 200) throw new Error('API failed for bad offset');

        console.log('✅ Pagination edge cases passed without errors.');
        console.log('\n🎉 ALL PHASE 6 TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Phase 6 test failed:', err.message || err);
        process.exit(1);
    }
}

testPhase6();
