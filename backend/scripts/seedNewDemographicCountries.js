const { pool } = require('../src/config/database');

async function updateDemographicRecords() {
    console.log('🚀 Starting demographic records generation for North America / Caribbean countries...');

    // 1. Target countries configuration
    const targetCountries = {
        'DO': { name: 'Dominican Republic', region: 'NORTH_AMERICA', total: 720000 },
        'GT': { name: 'Guatemala', region: 'NORTH_AMERICA', total: 580000 },
        'CR': { name: 'Costa Rica', region: 'NORTH_AMERICA', total: 490000 },
        'PA': { name: 'Panama', region: 'NORTH_AMERICA', total: 380000 },
        'TT': { name: 'Trinidad and Tobago', region: 'NORTH_AMERICA', total: 230000 }
    };

    // 2. Fetch maps
    const [regions] = await pool.query('SELECT id, code FROM audience_geo_regions');
    const regionMap = Object.fromEntries(regions.map(r => [r.code, r.id]));

    const [groups] = await pool.query('SELECT id, code FROM audience_geo_groups');
    const groupMap = Object.fromEntries(groups.map(g => [g.code, g.id]));

    const [countries] = await pool.query('SELECT id, iso_code FROM audience_countries WHERE iso_code IN (?, ?, ?, ?, ?)', ['DO', 'GT', 'CR', 'PA', 'TT']);
    const countryMap = Object.fromEntries(countries.map(c => [c.iso_code, c.id]));

    const [industries] = await pool.query('SELECT id, code FROM audience_industries');
    const industryMap = Object.fromEntries(industries.map(i => [i.code, i.id]));

    const [sizes] = await pool.query('SELECT id, code FROM audience_employee_sizes');
    const sizeMap = Object.fromEntries(sizes.map(s => [s.code, s.id]));

    const [depts] = await pool.query('SELECT id, code FROM audience_departments');
    const deptMap = Object.fromEntries(depts.map(d => [d.code, d.id]));

    const [functions] = await pool.query('SELECT id, code FROM audience_functions');
    const functionMap = Object.fromEntries(functions.map(f => [f.code, f.id]));

    const [levels] = await pool.query('SELECT id, code FROM audience_job_levels');
    const levelMap = Object.fromEntries(levels.map(l => [l.code, l.id]));

    const naRegionId = regionMap['NORTH_AMERICA'];
    const naGroupId = groupMap['NORTH_AMERICA'];

    console.log('📌 Region ID (NORTH_AMERICA):', naRegionId);
    console.log('📌 Group ID (NORTH_AMERICA):', naGroupId);
    console.log('📌 Countries found:', countryMap);

    // 3. Ensure region and group relationships exist
    for (const [iso, meta] of Object.entries(targetCountries)) {
        const countryId = countryMap[iso];
        if (!countryId) {
            console.error(`❌ Country ${iso} not found in audience_countries!`);
            continue;
        }

        // Region mapping
        await pool.query(`
            INSERT INTO audience_geo_region_countries (region_id, country_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE region_id = VALUES(region_id)
        `, [naRegionId, countryId]);

        // Commercial Geo Group mapping
        if (naGroupId) {
            await pool.query(`
                INSERT INTO audience_geo_group_countries (geo_group_id, country_id)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE geo_group_id = VALUES(geo_group_id)
            `, [naGroupId, countryId]);
        }
    }

    // 4. Multi-dimensional demographic distribution weights
    const indWeights = {
        'TECH_MEDIA': 0.24,
        'FINANCIAL_SERVICES': 0.18,
        'MANUFACTURING': 0.14,
        'HEALTHCARE': 0.12,
        'PROFESSIONAL_SERVICES': 0.10,
        'RETAIL_COMMERCE': 0.08,
        'EDUCATION': 0.04,
        'CONSTRUCTION_REAL_ESTATE': 0.04,
        'TRANSPORT_LOGISTICS': 0.03,
        'ENERGY_UTILITIES': 0.02,
        'UNCLASSIFIED': 0.01
    };

    const sizeWeights = {
        '1_10': 0.15,
        '11_50': 0.20,
        '51_200': 0.22,
        '201_500': 0.16,
        '501_1000': 0.11,
        '1001_5000': 0.08,
        '5001_10000': 0.05,
        '10001_PLUS': 0.03
    };

    const functionWeights = {
        'IT': { dept: 'IT', weight: 0.28 },
        'ENGINEERING': { dept: 'ENGINEERING', weight: 0.20 },
        'SALES': { dept: 'SALES', weight: 0.18 },
        'MARKETING': { dept: 'MARKETING', weight: 0.14 },
        'FINANCE': { dept: 'FINANCE', weight: 0.10 },
        'OPERATIONS': { dept: 'OPERATIONS', weight: 0.06 },
        'HR': { dept: 'HR', weight: 0.04 }
    };

    const levelWeights = {
        'CXO': 0.12,
        'VP': 0.14,
        'DIRECTOR': 0.24,
        'MANAGER': 0.28,
        'SENIOR': 0.16,
        'ENTRY': 0.06
    };

    const countryIds = Object.keys(targetCountries).map(iso => countryMap[iso]).filter(Boolean);

    // 5. Clean existing statistics for these countries before regenerating
    await pool.query('DELETE FROM audience_statistics WHERE country_id IN (?)', [countryIds]);
    console.log(`🧹 Cleared old statistics rows for countries: [${countryIds.join(', ')}]`);

    const batchRows = [];
    let addedContacts = 0;

    for (const [iso, meta] of Object.entries(targetCountries)) {
        const countryId = countryMap[iso];
        if (!countryId) continue;

        const countryTotal = meta.total;
        let countryCount = 0;
        let countryRows = 0;

        for (const [indCode, indW] of Object.entries(indWeights)) {
            const indId = industryMap[indCode];
            if (!indId) continue;

            for (const [sizeCode, sizeW] of Object.entries(sizeWeights)) {
                const sizeId = sizeMap[sizeCode];
                if (!sizeId) continue;

                for (const [funcCode, fMeta] of Object.entries(functionWeights)) {
                    const funcId = functionMap[funcCode];
                    const deptId = deptMap[fMeta.dept] || deptMap['OTHER'];
                    if (!funcId || !deptId) continue;

                    for (const [lvlCode, lvlW] of Object.entries(levelWeights)) {
                        const lvlId = levelMap[lvlCode];
                        if (!lvlId) continue;

                        const rawCount = countryTotal * indW * sizeW * fMeta.weight * lvlW;
                        const contactCount = Math.max(1, Math.round(rawCount));
                        const companyCount = Math.max(1, Math.round(contactCount / 3.2));

                        batchRows.push([
                            naRegionId, countryId, indId, sizeId, deptId, funcId, lvlId,
                            contactCount, companyCount, 'Internal B2B Intelligence', 'September 2026', 'Published'
                        ]);

                        countryCount += contactCount;
                        countryRows++;
                    }
                }
            }
        }
        addedContacts += countryCount;
        console.log(`  ✓ ${meta.name} (${iso}): Generated ${countryRows} demographic combinations totaling ~${countryCount.toLocaleString()} contacts`);
    }

    // Insert in chunks of 1000
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < batchRows.length; i += CHUNK_SIZE) {
        const chunk = batchRows.slice(i, i + CHUNK_SIZE);
        await pool.query(`
            INSERT INTO audience_statistics 
            (region_id, country_id, industry_id, employee_size_id, department_id, function_id, job_level_id, contact_count, company_count, data_source, effective_date, status)
            VALUES ?
        `, [chunk]);
    }

    console.log(`✅ Successfully inserted ${batchRows.length} demographic combinations into audience_statistics!`);

    // 6. Recalculate and update global settings
    const [[newGlobalRow]] = await pool.query('SELECT SUM(contact_count) as total_contacts, SUM(company_count) as total_companies FROM audience_statistics WHERE status = "Published"');
    await pool.query('UPDATE audience_global_settings SET setting_value = ? WHERE setting_key = "global_contacts_total"', [String(newGlobalRow.total_contacts)]);
    await pool.query('UPDATE audience_global_settings SET setting_value = ? WHERE setting_key = "global_companies_total"', [String(newGlobalRow.total_companies)]);

    // 7. Audit log
    await pool.query(`
        INSERT INTO audience_audit_logs 
        (user_name, action, entity, entity_id, new_value)
        VALUES ('Admin', 'ADD_DEMOGRAPHIC_RECORDS', 'audience_statistics', 'NA_COUNTRIES', JSON_OBJECT('countries', ?, 'records_added', ?, 'new_global_contacts', ?))
    `, [JSON.stringify(Object.keys(targetCountries)), batchRows.length, newGlobalRow.total_contacts]);

    console.log(`📊 Updated global total contacts: ~${Number(newGlobalRow.total_contacts).toLocaleString()}`);
    console.log(`📊 Updated global total companies: ~${Number(newGlobalRow.total_companies).toLocaleString()}`);
    console.log('🎉 Done!');
    process.exit(0);
}

updateDemographicRecords().catch(err => {
    console.error('❌ Error updating demographic records:', err);
    process.exit(1);
});
