const { pool } = require('../src/config/database');

async function checkDatabase() {
    try {
        console.log('🔍 Checking database state...\n');

        // Check users
        console.log('📋 Users:');
        const [users] = await pool.query('SELECT id, first_name, last_name, email, role, is_active FROM users');
        users.forEach(user => {
            console.log(`  - ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}, Active: ${user.is_active}`);
        });

        // Check content types
        console.log('\n📚 Content Types:');
        const [contentTypes] = await pool.query('SELECT id, name, slug FROM content_types');
        contentTypes.forEach(ct => {
            console.log(`  - ${ct.name} (${ct.slug}) - ID: ${ct.id}`);
        });

        // Check categories
        console.log('\n🏷️  Categories:');
        const [categories] = await pool.query('SELECT id, name, slug, type FROM categories');
        categories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.slug}) - Type: ${cat.type}, ID: ${cat.id}`);
        });

        // Check content
        console.log('\n📄 Content:');
        const [contents] = await pool.query(`
            SELECT c.id, c.title, c.status, c.user_id, 
                   u.first_name, u.last_name, u.email,
                   ct.name as content_type_name,
                   cat.name as category_name
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ORDER BY c.created_at DESC
        `);

        if (contents.length === 0) {
            console.log('  ℹ️  No content found in database');
        } else {
            contents.forEach(content => {
                console.log(`  - [${content.id}] ${content.title} by ${content.first_name} ${content.last_name} (${content.email})`);
                console.log(`    Status: ${content.status}, Type: ${content.content_type_name}, Category: ${content.category_name}`);
            });
        }

        console.log('\n✅ Database check complete!');
        await pool.end();
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkDatabase();
