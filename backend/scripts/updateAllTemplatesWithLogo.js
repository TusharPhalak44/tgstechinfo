const { pool } = require('../src/config/database');

async function updateAllTemplatesWithLogo() {
    try {
        console.log('🔄 Starting to update all email templates with logo placeholders...\n');

        // Delete duplicate templates (keeping the latest version of each type)
        const [templates] = await pool.query(`
            SELECT template_type, MAX(id) as keep_id 
            FROM email_templates 
            GROUP BY template_type
        `);

        for (const { template_type, keep_id } of templates) {
            await pool.query(
                'DELETE FROM email_templates WHERE template_type = ? AND id != ?',
                [template_type, keep_id]
            );
            console.log(`✅ Cleaned up duplicates for: ${template_type}`);
        }

        // Get all templates that don't have the logo placeholder
        const [templatesWithoutLogo] = await pool.query(`
            SELECT id, template_type, html_body 
            FROM email_templates 
            WHERE html_body NOT LIKE '%{{website_logo_html}}%'
        `);

        console.log(`\n📧 Found ${templatesWithoutLogo.length} templates without logo placeholder\n`);

        for (const template of templatesWithoutLogo) {
            let updatedHtml = template.html_body;
            
            // Find the header div and add logo placeholder after the opening tag
            // Pattern 1: Find <div class="header"> and inject logo right after
            if (updatedHtml.includes('<div class="header">')) {
                updatedHtml = updatedHtml.replace(
                    /<div class="header">/,
                    '<div class="header">\n            {{website_logo_html}}'
                );
            }
            // Pattern 2: If header has inline styles
            else if (updatedHtml.match(/<div[^>]*class="header"[^>]*>/)) {
                updatedHtml = updatedHtml.replace(
                    /(<div[^>]*class="header"[^>]*>)/,
                    '$1\n            {{website_logo_html}}'
                );
            }
            // Pattern 3: If there's a centered header structure
            else if (updatedHtml.includes('text-align: center') && updatedHtml.includes('<h2')) {
                // Add logo before the first h2 in the document
                updatedHtml = updatedHtml.replace(
                    /(<h[1-3][^>]*>)/,
                    '{{website_logo_html}}\n            $1'
                );
            }

            // Update the template in database
            await pool.query(
                'UPDATE email_templates SET html_body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [updatedHtml, template.id]
            );

            console.log(`✅ Updated template: ${template.template_type} (ID: ${template.id})`);
        }

        // Verify all templates now have logo
        const [verification] = await pool.query(`
            SELECT template_type, 
                   (html_body LIKE '%{{website_logo_html}}%') as has_logo 
            FROM email_templates
        `);

        console.log('\n📊 Verification Results:');
        console.table(verification);

        const allHaveLogo = verification.every(t => t.has_logo === 1);
        if (allHaveLogo) {
            console.log('\n✅ SUCCESS! All email templates now include logo placeholder');
        } else {
            console.log('\n⚠️  WARNING: Some templates still missing logo placeholder');
        }

    } catch (error) {
        console.error('❌ Error updating templates:', error);
        throw error;
    }
}

// Run the update
updateAllTemplatesWithLogo()
    .then(() => {
        console.log('\n✅ Template update completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Template update failed:', error);
        process.exit(1);
    });
