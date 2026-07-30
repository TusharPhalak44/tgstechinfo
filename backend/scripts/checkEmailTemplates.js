const { pool } = require('../src/config/database');

async function checkEmailTemplates() {
    try {
        console.log('Checking email templates...\n');
        
        const [rows] = await pool.query('SELECT id, template_type, template_name, subject, is_active FROM email_templates ORDER BY template_type');
        
        if (rows.length === 0) {
            console.log('No email templates found in database.');
            return;
        }
        
        console.log(`Found ${rows.length} email templates:\n`);
        
        rows.forEach(template => {
            console.log(`ID: ${template.id}`);
            console.log(`Type: ${template.template_type}`);
            console.log(`Name: ${template.template_name}`);
            console.log(`Subject: ${template.subject}`);
            console.log(`Status: ${template.is_active ? '✅ ACTIVE' : '❌ INACTIVE'}`);
            console.log('---');
        });
        
        // Check if any templates are inactive
        const inactiveTemplates = rows.filter(t => !t.is_active);
        if (inactiveTemplates.length > 0) {
            console.log(`\n⚠️  ${inactiveTemplates.length} template(s) are inactive.`);
            console.log('Activating all templates...\n');
            
            for (const template of inactiveTemplates) {
                await pool.query('UPDATE email_templates SET is_active = 1 WHERE id = ?', [template.id]);
                console.log(`✅ Activated: ${template.template_name}`);
            }
        } else {
            console.log('\n✅ All email templates are active.');
        }
        
        // Check SMTP configuration
        console.log('\n--- SMTP Configuration Check ---\n');
        const envVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_FROM'];
        
        let allConfigured = true;
        envVars.forEach(varName => {
            const value = process.env[varName];
            if (!value || value.includes('placeholder')) {
                console.log(`❌ ${varName}: Not configured or contains placeholder`);
                allConfigured = false;
            } else {
                // Mask password for security
                const displayValue = varName === 'EMAIL_PASSWORD' ? '***CONFIGURED***' : value;
                console.log(`✅ ${varName}: ${displayValue}`);
            }
        });
        
        if (allConfigured) {
            console.log('\n✅ SMTP configuration is properly set.');
        } else {
            console.log('\n⚠️  SMTP configuration is incomplete. Please set up the environment variables.');
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('Error checking email templates:', error);
        process.exit(1);
    }
}

checkEmailTemplates();
