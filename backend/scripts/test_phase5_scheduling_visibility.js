const { pool } = require('../src/config/database');
const Content = require('../src/models/Content');
const ChatbotSearchService = require('../src/services/chatbotSearchService');

async function testPhase5() {
    console.log('--- Testing Phase 5: Scheduled Publishing & is_visible_on_site Consistency ---');
    let testIds = [];
    try {
        // 1. Insert test content:
        // A: status='scheduled', scheduled_publish_date in past (5 minutes ago)
        const [resA] = await pool.query(`
            INSERT INTO contents (title, slug, status, scheduled_publish_date, is_visible_on_site, content)
            VALUES ('Test Past Scheduled', 'test-past-scheduled', 'scheduled', DATE_SUB(NOW(), INTERVAL 5 MINUTE), 1, 'Past test content')
        `);
        testIds.push(resA.insertId);

        // B: status='published', scheduled_publish_date in future (+2 hours)
        const [resB] = await pool.query(`
            INSERT INTO contents (title, slug, status, scheduled_publish_date, is_visible_on_site, content)
            VALUES ('Test Future Scheduled', 'test-future-scheduled', 'published', DATE_ADD(NOW(), INTERVAL 2 HOUR), 1, 'Future test content')
        `);
        testIds.push(resB.insertId);

        // C: status='published', is_visible_on_site=0
        const [resC] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content)
            VALUES ('Test Hidden Content', 'test-hidden-content', 'published', 0, 'Hidden test content')
        `);
        testIds.push(resC.insertId);

        // D: status='published', is_visible_on_site=1, no schedule
        const [resD] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content)
            VALUES ('Test Visible Content', 'test-visible-content', 'published', 1, 'Visible test content')
        `);
        testIds.push(resD.insertId);

        console.log('✅ Created 4 test contents with IDs:', testIds);

        // 2. Test scheduled publisher runner logic
        console.log('\n2. Testing scheduled publisher transition:');
        const [publishResult] = await pool.query(`
            UPDATE contents 
            SET status = 'published', 
                published_date = COALESCE(published_date, scheduled_publish_date, CURRENT_TIMESTAMP)
            WHERE (status = 'scheduled' OR status = 'approved')
              AND scheduled_publish_date IS NOT NULL 
              AND scheduled_publish_date <= CURRENT_TIMESTAMP
              AND id = ?
        `, [resA.insertId]);

        console.log('Affected rows for past scheduled content:', publishResult.affectedRows);
        const [rowA] = await pool.query('SELECT status, published_date FROM contents WHERE id = ?', [resA.insertId]);
        console.log('Updated row A status:', rowA[0].status);
        if (rowA[0].status !== 'published') throw new Error('Past scheduled content was not published!');
        console.log('✅ Scheduled publisher successfully transitions past scheduled items.');

        // 3. Test Content.findAll with status='published' and is_visible_on_site=true
        console.log('\n3. Testing Content.findAll filtering:');
        const { rows } = await Content.findAll({ status: 'published', is_visible_on_site: true });
        const slugs = rows.map(r => r.slug);

        console.log('Contains past scheduled (now published)?', slugs.includes('test-past-scheduled'));
        console.log('Contains future scheduled?', slugs.includes('test-future-scheduled'));
        console.log('Contains hidden content?', slugs.includes('test-hidden-content'));
        console.log('Contains normal visible content?', slugs.includes('test-visible-content'));

        if (!slugs.includes('test-past-scheduled')) throw new Error('Missing past-scheduled item!');
        if (slugs.includes('test-future-scheduled')) throw new Error('Future scheduled item leaked into public listings!');
        if (slugs.includes('test-hidden-content')) throw new Error('Hidden item leaked into public listings!');
        if (!slugs.includes('test-visible-content')) throw new Error('Visible item missing from public listings!');
        console.log('✅ Content.findAll correctly excludes future-scheduled and hidden items.');

        // 4. Test Content.findBySlug
        console.log('\n4. Testing Content.findBySlug:');
        const findFuture = await Content.findBySlug('test-future-scheduled');
        console.log('findBySlug future scheduled:', findFuture ? 'EXPOSED' : 'HIDDEN (null)');
        const findHidden = await Content.findBySlug('test-hidden-content');
        console.log('findBySlug hidden content:', findHidden ? 'EXPOSED' : 'HIDDEN (null)');
        const findVisible = await Content.findBySlug('test-visible-content');
        console.log('findBySlug visible content:', findVisible ? 'FOUND' : 'MISSING');

        if (findFuture) throw new Error('Future scheduled article exposed via findBySlug!');
        if (findHidden) throw new Error('Hidden article exposed via findBySlug!');
        if (!findVisible) throw new Error('Visible article missing in findBySlug!');
        console.log('✅ Content.findBySlug correctly blocks future-scheduled and hidden content.');

        // 5. Test ChatbotSearchService
        console.log('\n5. Testing ChatbotSearchService.search:');
        const chatbotResults = await ChatbotSearchService.search('Test', { limit: 20 });
        const chatbotSlugs = chatbotResults.map(r => r.slug);
        console.log('Chatbot search returned slugs:', chatbotSlugs);
        if (chatbotSlugs.includes('test-future-scheduled')) throw new Error('Chatbot exposed future-scheduled item!');
        if (chatbotSlugs.includes('test-hidden-content')) throw new Error('Chatbot exposed hidden item!');
        console.log('✅ ChatbotSearchService correctly excludes future-scheduled and hidden content.');

        console.log('\n🎉 ALL PHASE 5 TESTS PASSED SUCCESSFULLY!');
    } finally {
        // Cleanup test contents
        if (testIds.length > 0) {
            await pool.query('DELETE FROM contents WHERE id IN (?)', [testIds]);
            console.log('🧹 Cleaned up test content rows.');
        }
        process.exit(0);
    }
}

testPhase5().catch(e => {
    console.error('❌ Phase 5 test failed:', e);
    process.exit(1);
});
