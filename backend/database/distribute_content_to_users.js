const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function distributeContent({ dryRun = false } = {}) {
    console.log(`\n======================================================`);
    console.log(`🚀 Content Distribution to Users (${dryRun ? 'DRY RUN' : 'LIVE RUN'})`);
    console.log(`======================================================\n`);

    try {
        // 1. Fetch eligible user accounts
        // We select active user accounts with valid names and emails (id >= 7 are the 500 created users)
        const [users] = await pool.query(`
            SELECT id, first_name, last_name, email, job_title, company_name, country
            FROM users 
            WHERE role = 'user' 
              AND email != '' 
              AND first_name != ''
              AND id >= 7
            ORDER BY id ASC
        `);

        console.log(`✓ Found ${users.length} eligible target users for author assignment.`);
        if (users.length === 0) {
            console.error('❌ No eligible users found!');
            return;
        }

        // 2. Fetch all contents
        const [contents] = await pool.query(`
            SELECT c.id, c.title, c.slug, c.user_id, c.content_type_id, ct.name as content_type, cat.name as category_name
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ORDER BY c.id ASC
        `);

        console.log(`✓ Found ${contents.length} contents to distribute.\n`);

        // 3. Backup current state
        if (!dryRun) {
            console.log('📦 Creating backup table `contents_author_backup`...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS contents_author_backup (
                    backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    content_id INT,
                    previous_user_id BIGINT UNSIGNED,
                    PRIMARY KEY (content_id, backup_time)
                )
            `);

            // Store current snapshot
            for (const c of contents) {
                await pool.query(
                    'INSERT INTO contents_author_backup (content_id, previous_user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE previous_user_id = VALUES(previous_user_id)',
                    [c.id, c.user_id]
                );
            }

            const backupFile = path.join(__dirname, 'backups', `content_author_backup_${Date.now()}.json`);
            if (!fs.existsSync(path.dirname(backupFile))) {
                fs.mkdirSync(path.dirname(backupFile), { recursive: true });
            }
            fs.writeFileSync(backupFile, JSON.stringify(contents.map(c => ({ id: c.id, title: c.title, user_id: c.user_id })), null, 2));
            console.log(`✓ Backup saved to: ${backupFile}`);
        }

        // 4. Distribute contents evenly across users
        // Since we have ~299 contents and ~500 users:
        // Each article gets a unique author (1 content per user for the first 299 users).
        const distributionPlan = [];
        let userIdx = 0;

        for (const content of contents) {
            const assignedUser = users[userIdx % users.length];
            userIdx++;

            distributionPlan.push({
                contentId: content.id,
                title: content.title,
                type: content.content_type || 'Article',
                category: content.category_name || 'General',
                previousUserId: content.user_id,
                newAuthor: {
                    id: assignedUser.id,
                    name: `${assignedUser.first_name} ${assignedUser.last_name || ''}`.trim(),
                    email: assignedUser.email,
                    job_title: assignedUser.job_title || 'Expert Contributor',
                    company: assignedUser.company_name || 'Industry Partner',
                    country: assignedUser.country || 'Global'
                }
            });
        }

        console.log(`\n📋 Distribution Preview (First 10 items):`);
        console.table(distributionPlan.slice(0, 10).map(p => ({
            'Content ID': p.contentId,
            'Title': p.title.substring(0, 35) + '...',
            'Type': p.type,
            'New Author Name': p.newAuthor.name,
            'Author Email': p.newAuthor.email,
            'Company': p.newAuthor.company
        })));

        if (dryRun) {
            console.log('\n🔍 Dry run completed. No database changes were made.');
            return;
        }

        // 5. Execute database updates
        console.log('\n⚙️  Applying author assignments to database...');
        let updatedCount = 0;

        for (const item of distributionPlan) {
            await pool.query('UPDATE contents SET user_id = ? WHERE id = ?', [item.newAuthor.id, item.contentId]);
            updatedCount++;
        }

        console.log(`\n✅ Successfully distributed ${updatedCount} contents to ${updatedCount} distinct users!`);

        // 6. Verify distribution
        const [stats] = await pool.query(`
            SELECT 
                COUNT(DISTINCT user_id) as unique_authors,
                COUNT(*) as total_assigned
            FROM contents
            WHERE user_id IS NOT NULL
        `);
        console.log(`\n📊 Post-Distribution Stats:`);
        console.log(`   Total Contents: ${contents.length}`);
        console.log(`   Unique Authors: ${stats[0].unique_authors}`);
        console.log(`   Unassigned Contents: ${contents.length - stats[0].total_assigned}`);

        // Save mapping report to CSV
        const reportPath = path.join(__dirname, 'content_distribution_report.csv');
        let csv = 'Content ID,Title,Content Type,Category,Author ID,Author Name,Author Email,Job Title,Company,Country\n';
        for (const item of distributionPlan) {
            const cleanTitle = (item.title || '').replace(/"/g, '""');
            const cleanType = (item.type || '').replace(/"/g, '""');
            const cleanCat = (item.category || '').replace(/"/g, '""');
            const cleanName = (item.newAuthor.name || '').replace(/"/g, '""');
            const cleanEmail = (item.newAuthor.email || '').replace(/"/g, '""');
            const cleanJob = (item.newAuthor.job_title || '').replace(/"/g, '""');
            const cleanComp = (item.newAuthor.company || '').replace(/"/g, '""');
            const cleanCountry = (item.newAuthor.country || '').replace(/"/g, '""');
            csv += `"${item.contentId}","${cleanTitle}","${cleanType}","${cleanCat}","${item.newAuthor.id}","${cleanName}","${cleanEmail}","${cleanJob}","${cleanComp}","${cleanCountry}"\n`;
        }
        fs.writeFileSync(reportPath, csv, 'utf8');
        console.log(`📄 Detailed mapping report saved to: ${reportPath}`);

    } catch (err) {
        console.error('❌ Distribution failed:', err);
    } finally {
        await pool.end();
    }
}

// Check command line arguments: --dry-run
const isDryRun = process.argv.includes('--dry-run');
distributeContent({ dryRun: isDryRun });
