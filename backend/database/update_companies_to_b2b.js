const { pool } = require('../src/config/database');

// B2B Lead Generation and Demand Generation companies by country
const b2bCompanies = {
    'India': ['Zoho', 'Freshworks', 'HubSpot', 'LeadSquared', 'Marketo', 'Salesforce', 'Oracle Marketing Cloud', 'Adobe Marketo', 'Infusionsoft', 'Act-On', 'ClickDimensions', 'Pardot', 'Eloqua', 'SharpSpring', 'Salesfusion', 'Insightly', 'Autopilot', 'Outreach', 'Woodpecker', 'Drip', 'LeadFeeder', 'Clearbit', 'ZoomInfo', 'Demandbase', 'Lattice Engines', '6sense', 'Bombora', 'Dun & Bradstreet'],
    'Australia': ['HubSpot Australia', 'Salesforce Australia', 'Marketo Australia', 'Adobe Marketo Australia', 'Oracle Marketing Cloud Australia', 'Zoho Australia', 'LeadSquared Australia', 'Freshworks Australia', 'Infusionsoft Australia', 'Act-On Australia', 'Pardot Australia', 'Eloqua Australia', 'SharpSpring Australia', 'Salesfusion Australia', 'Insightly Australia', 'Autopilot Australia', 'Outreach Australia', 'Woodpecker Australia', 'Drip Australia', 'LeadFeeder Australia', 'Clearbit Australia', 'ZoomInfo Australia', 'Demandbase Australia', 'Lattice Engines Australia', '6sense Australia', 'Bombora Australia', 'Dun & Bradstreet Australia'],
    'United States': ['HubSpot', 'Salesforce', 'Marketo', 'Adobe Marketo', 'Oracle Marketing Cloud', 'Zoho', 'LeadSquared', 'Freshworks', 'Infusionsoft', 'Act-On', 'Pardot', 'Eloqua', 'SharpSpring', 'Salesfusion', 'Insightly', 'Autopilot', 'Outreach', 'Woodpecker', 'Drip', 'LeadFeeder', 'Clearbit', 'ZoomInfo', 'Demandbase', 'Lattice Engines', '6sense', 'Bombora', 'Dun & Bradstreet', 'Drift', 'Terminus', 'Calendly', 'RingCentral'],
    'Germany': ['HubSpot Germany', 'Salesforce Germany', 'Marketo Germany', 'Adobe Marketo Germany', 'Oracle Marketing Cloud Germany', 'Zoho Germany', 'LeadSquared Germany', 'Freshworks Germany', 'Infusionsoft Germany', 'Act-On Germany', 'Pardot Germany', 'Eloqua Germany', 'SharpSpring Germany', 'Salesfusion Germany', 'Insightly Germany', 'Autopilot Germany', 'Outreach Germany', 'Woodpecker Germany', 'Drip Germany', 'LeadFeeder Germany', 'Clearbit Germany', 'ZoomInfo Germany', 'Demandbase Germany', 'Lattice Engines Germany', '6sense Germany', 'Bombora Germany', 'Dun & Bradstreet Germany'],
    'Japan': ['HubSpot Japan', 'Salesforce Japan', 'Marketo Japan', 'Adobe Marketo Japan', 'Oracle Marketing Cloud Japan', 'Zoho Japan', 'LeadSquared Japan', 'Freshworks Japan', 'Infusionsoft Japan', 'Act-On Japan', 'Pardot Japan', 'Eloqua Japan', 'SharpSpring Japan', 'Salesfusion Japan', 'Insightly Japan', 'Autopilot Japan', 'Outreach Japan', 'Woodpecker Japan', 'Drip Japan', 'LeadFeeder Japan', 'Clearbit Japan', 'ZoomInfo Japan', 'Demandbase Japan', 'Lattice Engines Japan', '6sense Japan', 'Bombora Japan', 'Dun & Bradstreet Japan'],
    'Canada': ['HubSpot Canada', 'Salesforce Canada', 'Marketo Canada', 'Adobe Marketo Canada', 'Oracle Marketing Cloud Canada', 'Zoho Canada', 'LeadSquared Canada', 'Freshworks Canada', 'Infusionsoft Canada', 'Act-On Canada', 'Pardot Canada', 'Eloqua Canada', 'SharpSpring Canada', 'Salesfusion Canada', 'Insightly Canada', 'Autopilot Canada', 'Outreach Canada', 'Woodpecker Canada', 'Drip Canada', 'LeadFeeder Canada', 'Clearbit Canada', 'ZoomInfo Canada', 'Demandbase Canada', 'Lattice Engines Canada', '6sense Canada', 'Bombora Canada', 'Dun & Bradstreet Canada'],
    'United Kingdom': ['HubSpot UK', 'Salesforce UK', 'Marketo UK', 'Adobe Marketo UK', 'Oracle Marketing Cloud UK', 'Zoho UK', 'LeadSquared UK', 'Freshworks UK', 'Infusionsoft UK', 'Act-On UK', 'Pardot UK', 'Eloqua UK', 'SharpSpring UK', 'Salesfusion UK', 'Insightly UK', 'Autopilot UK', 'Outreach UK', 'Woodpecker UK', 'Drip UK', 'LeadFeeder UK', 'Clearbit UK', 'ZoomInfo UK', 'Demandbase UK', 'Lattice Engines UK', '6sense UK', 'Bombora UK', 'Dun & Bradstreet UK'],
    'France': ['HubSpot France', 'Salesforce France', 'Marketo France', 'Adobe Marketo France', 'Oracle Marketing Cloud France', 'Zoho France', 'LeadSquared France', 'Freshworks France', 'Infusionsoft France', 'Act-On France', 'Pardot France', 'Eloqua France', 'SharpSpring France', 'Salesfusion France', 'Insightly France', 'Autopilot France', 'Outreach France', 'Woodpecker France', 'Drip France', 'LeadFeeder France', 'Clearbit France', 'ZoomInfo France', 'Demandbase France', 'Lattice Engines France', '6sense France', 'Bombora France', 'Dun & Bradstreet France']
};

// Helper function to get random item from array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function updateCompanies() {
    try {
        console.log('Starting company update to B2B Lead Generation companies...');
        
        // Get all users
        const [users] = await pool.query('SELECT id, first_name, last_name, email, country, company_name FROM users WHERE role != "admin"');
        
        console.log(`Found ${users.length} users to update`);
        
        let updatedCount = 0;
        
        for (const user of users) {
            const country = user.country;
            
            if (!country || !b2bCompanies[country]) {
                console.log(`⚠️  Skipping user ${user.id} (${user.email}) - No country data or country not in list`);
                continue;
            }
            
            const newCompany = getRandomItem(b2bCompanies[country]);
            
            await pool.query('UPDATE users SET company_name = ? WHERE id = ?', [newCompany, user.id]);
            
            updatedCount++;
            
            console.log(`✅ Updated user ${updatedCount}: ${user.first_name} ${user.last_name} (${country})`);
            console.log(`   Old Company: ${user.company_name}`);
            console.log(`   New Company: ${newCompany}`);
            console.log('---');
        }
        
        console.log(`\n🎉 Company update completed!`);
        console.log(`Total users updated: ${updatedCount} out of ${users.length}`);
        
    } catch (error) {
        console.error('Error updating companies:', error);
    } finally {
        await pool.end();
    }
}

updateCompanies();
