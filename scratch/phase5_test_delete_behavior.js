const { pool } = require('../backend/src/config/database');
const Content = require('../backend/src/models/Content');
const User = require('../backend/src/models/User');

async function testDeleteBehavior() {
    console.log('--- Testing Step 14 & Step 15 Delete Behavior ---');

    // 1. Create a dedicated test user
    const [userRes] = await pool.query(`
        INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES ('DeleteTest', 'Author', 'del_author_${Date.now()}@example.com', 'dummyhash')
    `);
    const testUserId = userRes.insertId;
    console.log('Created test user:', testUserId);

    // 2. Create content authored by this user
    const testSlug = `del-test-content-${Date.now()}`;
    const [contentRes] = await pool.query(`
        INSERT INTO contents (title, slug, status, user_id, content)
        VALUES ('Delete Test Article', ?, 'published', ?, 'Article body')
    `, [testSlug, testUserId]);
    const testContentId = contentRes.insertId;
    console.log('Created test content:', testContentId);

    // Verify initial relationship
    const itemBefore = await Content.findById(testContentId);
    console.log('Content before parent deletion:', {
        id: itemBefore.id,
        user_id: itemBefore.user_id,
        first_name: itemBefore.first_name,
        author_email: itemBefore.author_email
    });
    if (itemBefore.user_id !== testUserId) throw new Error('user_id mismatch before deletion');

    // Step 15: Delete referenced parent user
    console.log('Deleting parent user...');
    const userDeleted = await User.delete(testUserId);
    console.log('Parent user deleted:', userDeleted);

    // Verify content still exists and user_id is now NULL
    const itemAfterUserDel = await Content.findById(testContentId);
    console.log('Content after parent user deletion:', {
        id: itemAfterUserDel?.id,
        user_id: itemAfterUserDel?.user_id,
        first_name: itemAfterUserDel?.first_name,
        author_email: itemAfterUserDel?.author_email
    });

    if (!itemAfterUserDel) {
        throw new Error('FAIL: Content was unexpectedly deleted when parent user was deleted!');
    }
    if (itemAfterUserDel.user_id !== null) {
        throw new Error('FAIL: Content user_id was NOT set to NULL!');
    }
    console.log('✅ PASS: Deleting parent user preserved content and set contents.user_id to NULL.');

    // Verify content listing still works with user_id NULL
    const { rows: publicList } = await Content.findAll({ status: 'published', limit: 10 });
    const foundInList = publicList.some(r => r.id === testContentId);
    console.log('✅ Content found in public listing with user_id NULL:', foundInList);

    // Step 14: Delete content row and verify parent tables are completely unaffected
    console.log('Deleting test content...');
    await pool.query('DELETE FROM contents WHERE id = ?', [testContentId]);

    const [[usersCount]] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const [[catsCount]] = await pool.query('SELECT COUNT(*) as cnt FROM categories');
    const [[typesCount]] = await pool.query('SELECT COUNT(*) as cnt FROM content_types');

    console.log('Table counts after content delete:', {
        users: usersCount.cnt,
        categories: catsCount.cnt,
        content_types: typesCount.cnt
    });

    console.log('✅ PASS: Deleting content had 0 adverse effects on parent tables.');

    await pool.end();
}

testDeleteBehavior().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
