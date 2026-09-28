const { pool } = require('../backend/src/config/database');
const Content = require('../backend/src/models/Content');

async function benchmark() {
    console.log('--- Step 16: Content Queries Performance Benchmark ---');

    // Warm-up query
    await pool.query('SELECT 1');

    // 1. Content Listing (Public)
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) {
        await Content.findAll({ status: 'published', limit: 12 });
    }
    const t1 = performance.now();
    const avgListing = (t1 - t0) / 20;

    // 2. Content Detail (by slug)
    const [sample] = await pool.query('SELECT slug FROM contents WHERE status = "published" LIMIT 1');
    const slug = sample[0].slug;
    const t2 = performance.now();
    for (let i = 0; i < 20; i++) {
        await Content.findBySlug(slug);
    }
    const t3 = performance.now();
    const avgDetail = (t3 - t2) / 20;

    // 3. Admin Content Listing
    const t4 = performance.now();
    for (let i = 0; i < 20; i++) {
        await Content.findAll({ limit: 20, offset: 0 });
    }
    const t5 = performance.now();
    const avgAdminList = (t5 - t4) / 20;

    // 4. User Content Listing
    const [userSample] = await pool.query('SELECT user_id FROM contents WHERE user_id IS NOT NULL LIMIT 1');
    const uid = userSample[0].user_id;
    const t6 = performance.now();
    for (let i = 0; i < 20; i++) {
        await Content.findAll({ user_id: uid, limit: 10 });
    }
    const t7 = performance.now();
    const avgUserList = (t7 - t6) / 20;

    console.table([
        { Query: 'Public Content Listing', AvgDurationMs: avgListing.toFixed(3), ThresholdMs: '50.000', Status: avgListing < 50 ? 'PASS' : 'WARN' },
        { Query: 'Content Detail by Slug', AvgDurationMs: avgDetail.toFixed(3), ThresholdMs: '20.000', Status: avgDetail < 20 ? 'PASS' : 'WARN' },
        { Query: 'Admin Content Listing', AvgDurationMs: avgAdminList.toFixed(3), ThresholdMs: '50.000', Status: avgAdminList < 50 ? 'PASS' : 'WARN' },
        { Query: 'User Content Listing (Indexed user_id)', AvgDurationMs: avgUserList.toFixed(3), ThresholdMs: '30.000', Status: avgUserList < 30 ? 'PASS' : 'WARN' }
    ]);

    await pool.end();
}

benchmark().catch(console.error);
