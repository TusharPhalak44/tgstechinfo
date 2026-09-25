const { pool } = require('../src/config/database');
const ChatbotSearchService = require('../src/services/chatbotSearchService');

async function testPhase9() {
    console.log('--- Testing Phase 9: Chatbot Public Visibility Safeguards (ISSUE-CHAT-01) ---');
    const createdIds = [];
    const uniqueTag = `cbtest-${Date.now()}`;

    try {
        // 1. Insert 5 test contents covering all states
        // State 1: Published + visible
        const [r1] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content, tags)
            VALUES ('Valid Published AI Article', 'valid-pub-${uniqueTag}', 'published', 1, 'Body content for valid article', '${uniqueTag}')
        `);
        createdIds.push(r1.insertId);

        // State 2: Draft
        const [r2] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content, tags)
            VALUES ('Secret Draft AI Article', 'draft-${uniqueTag}', 'draft', 1, 'Draft content should never appear', '${uniqueTag}')
        `);
        createdIds.push(r2.insertId);

        // State 3: Pending
        const [r3] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content, tags)
            VALUES ('Pending Review AI Article', 'pending-${uniqueTag}', 'pending', 1, 'Pending content under review', '${uniqueTag}')
        `);
        createdIds.push(r3.insertId);

        // State 4: Rejected
        const [r4] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content, tags)
            VALUES ('Rejected AI Article', 'rejected-${uniqueTag}', 'rejected', 1, 'Rejected content not suitable for public', '${uniqueTag}')
        `);
        createdIds.push(r4.insertId);

        // State 5: Hidden (is_visible_on_site = 0)
        const [r5] = await pool.query(`
            INSERT INTO contents (title, slug, status, is_visible_on_site, content, tags)
            VALUES ('Hidden Published AI Article', 'hidden-${uniqueTag}', 'published', 0, 'Published but hidden from site', '${uniqueTag}')
        `);
        createdIds.push(r5.insertId);

        // State 6: Future scheduled
        const [r6] = await pool.query(`
            INSERT INTO contents (title, slug, status, scheduled_publish_date, is_visible_on_site, content, tags)
            VALUES ('Future Scheduled AI Article', 'future-${uniqueTag}', 'published', DATE_ADD(NOW(), INTERVAL 3 DAY), 1, 'Scheduled for next week', '${uniqueTag}')
        `);
        createdIds.push(r6.insertId);

        console.log(`✅ Seeded 6 test articles with tag '${uniqueTag}'`);

        // 2. Perform chatbot search using unique tag
        const searchResults = await ChatbotSearchService.search(uniqueTag, { limit: 20 });
        const returnedSlugs = searchResults.map(r => r.slug);

        console.log('\nSearch Results for tag:', returnedSlugs);

        // Verification checks
        const publishedFound = returnedSlugs.includes(`valid-pub-${uniqueTag}`);
        const draftFound = returnedSlugs.includes(`draft-${uniqueTag}`);
        const pendingFound = returnedSlugs.includes(`pending-${uniqueTag}`);
        const rejectedFound = returnedSlugs.includes(`rejected-${uniqueTag}`);
        const hiddenFound = returnedSlugs.includes(`hidden-${uniqueTag}`);
        const futureFound = returnedSlugs.includes(`future-${uniqueTag}`);

        console.log('1. Published + visible returned?', publishedFound ? 'YES (PASS)' : 'NO (FAIL)');
        console.log('2. Draft returned?', draftFound ? 'YES (FAIL)' : 'NO (PASS)');
        console.log('3. Pending returned?', pendingFound ? 'YES (FAIL)' : 'NO (PASS)');
        console.log('4. Rejected returned?', rejectedFound ? 'YES (FAIL)' : 'NO (PASS)');
        console.log('5. Hidden returned?', hiddenFound ? 'YES (FAIL)' : 'NO (PASS)');
        console.log('6. Future scheduled returned?', futureFound ? 'YES (FAIL)' : 'NO (PASS)');

        if (!publishedFound) throw new Error('Valid published content was not found by chatbot!');
        if (draftFound) throw new Error('Draft content was leaked by chatbot search!');
        if (pendingFound) throw new Error('Pending review content was leaked by chatbot search!');
        if (rejectedFound) throw new Error('Rejected content was leaked by chatbot search!');
        if (hiddenFound) throw new Error('Hidden content was leaked by chatbot search!');
        if (futureFound) throw new Error('Future scheduled content was leaked by chatbot search!');

        console.log('\n🎉 ALL PHASE 9 CHATBOT VISIBILITY TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Phase 9 test failed:', err);
        process.exit(1);
    } finally {
        if (createdIds.length > 0) {
            await pool.query('DELETE FROM contents WHERE id IN (?)', [createdIds]);
            console.log('🧹 Cleaned up test content rows.');
        }
    }
}

testPhase9();
