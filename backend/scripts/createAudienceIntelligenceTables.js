/**
 * Database Migration & Seeding Script for B2B Audience Intelligence Module
 * Configures taxonomies, global settings, and realistic aggregated statistics
 * matching the 78M+ global database and LATAM 8.40M+ presentation reference.
 */

const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

const splitSqlStatements = (sql) => {
    const statements = [];
    let currentStatement = '';
    let inMultiLineComment = false;
    
    const lines = sql.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--')) continue;
        if (trimmed.startsWith('/*')) {
            inMultiLineComment = true;
            if (trimmed.includes('*/')) inMultiLineComment = false;
            continue;
        }
        if (inMultiLineComment) {
            if (trimmed.includes('*/')) inMultiLineComment = false;
            continue;
        }
        currentStatement += line + '\n';
        if (trimmed.endsWith(';')) {
            const stmt = currentStatement.trim();
            if (stmt) statements.push(stmt);
            currentStatement = '';
        }
    }
    return statements;
};

const executeSqlFile = async (filePath) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = splitSqlStatements(sql);
    for (const stmt of statements) {
        try {
            await pool.query(stmt);
        } catch (err) {
            if (!err.message.includes('already exists') && !err.message.includes('Duplicate entry')) {
                console.warn('⚠️ SQL Warning:', err.message);
            }
        }
    }
};

const seedData = async () => {
    console.log('🌍 Seeding B2B Audience Intelligence data...');

    // 1. Global Settings
    const defaultSettings = [
        { key: 'global_contacts_total', value: '78000000', desc: 'Commercial Global Database Size (78M+)' },
        { key: 'global_companies_total', value: '4250000', desc: 'Commercial Global Companies Count' },
        { key: 'countries_covered_count', value: '195+', desc: 'Total Countries Covered Worldwide' },
        { key: 'last_updated_display', value: 'August 2026', desc: 'Commercial Freshness Badge' },
        { key: 'privacy_threshold', value: '25', desc: 'Minimum Audience Count before Masking' },
        { key: 'module_title', value: 'B2B Audience Intelligence', desc: 'Header Title' },
        { key: 'brand_name', value: 'TARAJ GLOBAL', desc: 'Brand Name' }
    ];

    for (const s of defaultSettings) {
        await pool.query(`
            INSERT INTO audience_global_settings (setting_key, setting_value, description)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = VALUES(description)
        `, [s.key, s.value, s.desc]);
    }
    console.log('✅ Global Settings seeded');

    // 2. Geo Regions
    const regions = [
        { name: 'Global', code: 'GLOBAL', type: 'GLOBAL', lat: 20.0, lon: 0.0, zoom: 1.0, order: 0 },
        { name: 'North America', code: 'NORTH_AMERICA', type: 'CONTINENT', lat: 40.0, lon: -100.0, zoom: 1.5, order: 1 },
        { name: 'LATAM', code: 'LATAM', type: 'CONTINENT', lat: -15.0, lon: -60.0, zoom: 1.6, order: 2 },
        { name: 'EMEA', code: 'EMEA', type: 'CONTINENT', lat: 48.0, lon: 20.0, zoom: 1.5, order: 3 },
        { name: 'DACH', code: 'DACH', type: 'TRADE_ZONE', lat: 50.0, lon: 10.0, zoom: 2.2, order: 4 },
        { name: 'Nordics', code: 'NORDICS', type: 'TRADE_ZONE', lat: 62.0, lon: 15.0, zoom: 2.0, order: 5 },
        { name: 'APAC', code: 'APAC', type: 'CONTINENT', lat: 20.0, lon: 95.0, zoom: 1.4, order: 6 },
        { name: 'MENA', code: 'MENA', type: 'TRADE_ZONE', lat: 25.0, lon: 45.0, zoom: 1.8, order: 7 }
    ];

    const regionMap = {};
    for (const r of regions) {
        const [res] = await pool.query(`
            INSERT INTO audience_geo_regions (name, code, region_type, lat, lon, default_zoom, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), lat=VALUES(lat), lon=VALUES(lon), default_zoom=VALUES(default_zoom), display_order=VALUES(display_order)
        `, [r.name, r.code, r.type, r.lat, r.lon, r.zoom, r.order]);
        
        const [row] = await pool.query('SELECT id FROM audience_geo_regions WHERE code = ?', [r.code]);
        if (row[0]) regionMap[r.code] = row[0].id;
    }
    console.log('✅ Geo Regions seeded');

    // 3. Countries
    const countries = [
        // LATAM Countries (from PPT)
        { name: 'Brazil', iso: 'BR', iso3: 'BRA', lat: -14.235, lon: -51.925, order: 1, regions: ['LATAM'] },
        { name: 'Mexico', iso: 'MX', iso3: 'MEX', lat: 23.634, lon: -102.552, order: 2, regions: ['LATAM'] },
        { name: 'Colombia', iso: 'CO', iso3: 'COL', lat: 4.570, lon: -74.297, order: 3, regions: ['LATAM'] },
        { name: 'Peru', iso: 'PE', iso3: 'PER', lat: -9.189, lon: -75.015, order: 4, regions: ['LATAM'] },
        { name: 'Chile', iso: 'CL', iso3: 'CHL', lat: -35.675, lon: -71.542, order: 5, regions: ['LATAM'] },
        { name: 'Argentina', iso: 'AR', iso3: 'ARG', lat: -38.416, lon: -63.616, order: 6, regions: ['LATAM'] },
        { name: 'Costa Rica', iso: 'CR', iso3: 'CRI', lat: 9.748, lon: -83.753, order: 7, regions: ['LATAM'] },
        { name: 'Venezuela', iso: 'VE', iso3: 'VEN', lat: 6.423, lon: -66.589, order: 8, regions: ['LATAM'] },
        { name: 'Ecuador', iso: 'EC', iso3: 'ECU', lat: -1.831, lon: -78.183, order: 9, regions: ['LATAM'] },
        { name: 'Bolivia', iso: 'BO', iso3: 'BOL', lat: -16.290, lon: -63.588, order: 10, regions: ['LATAM'] },

        // North America
        { name: 'United States', iso: 'US', iso3: 'USA', lat: 37.090, lon: -95.712, order: 11, regions: ['NORTH_AMERICA'] },
        { name: 'Canada', iso: 'CA', iso3: 'CAN', lat: 56.130, lon: -106.346, order: 12, regions: ['NORTH_AMERICA'] },

        // APAC
        { name: 'India', iso: 'IN', iso3: 'IND', lat: 20.593, lon: 78.962, order: 13, regions: ['APAC'] },
        { name: 'Australia', iso: 'AU', iso3: 'AUS', lat: -25.274, lon: 133.775, order: 14, regions: ['APAC'] },
        { name: 'Singapore', iso: 'SG', iso3: 'SGP', lat: 1.352, lon: 103.819, order: 15, regions: ['APAC'] },
        { name: 'Japan', iso: 'JP', iso3: 'JPN', lat: 36.204, lon: 138.252, order: 16, regions: ['APAC'] },
        { name: 'Indonesia', iso: 'ID', iso3: 'IDN', lat: -0.789, lon: 113.921, order: 17, regions: ['APAC'] },
        { name: 'Malaysia', iso: 'MY', iso3: 'MYS', lat: 4.210, lon: 101.975, order: 18, regions: ['APAC'] },
        { name: 'Philippines', iso: 'PH', iso3: 'PHL', lat: 12.879, lon: 121.774, order: 19, regions: ['APAC'] },
        { name: 'South Korea', iso: 'KR', iso3: 'KOR', lat: 35.907, lon: 127.766, order: 20, regions: ['APAC'] },
        { name: 'New Zealand', iso: 'NZ', iso3: 'NZL', lat: -40.900, lon: 174.885, order: 21, regions: ['APAC'] },
        { name: 'Vietnam', iso: 'VN', iso3: 'VNM', lat: 14.058, lon: 108.277, order: 22, regions: ['APAC'] },

        // EMEA & DACH & Nordics & MENA
        { name: 'United Kingdom', iso: 'GB', iso3: 'GBR', lat: 55.378, lon: -3.435, order: 23, regions: ['EMEA'] },
        { name: 'Germany', iso: 'DE', iso3: 'DEU', lat: 51.165, lon: 10.451, order: 24, regions: ['EMEA', 'DACH'] },
        { name: 'Austria', iso: 'AT', iso3: 'AUT', lat: 47.516, lon: 14.550, order: 25, regions: ['EMEA', 'DACH'] },
        { name: 'Switzerland', iso: 'CH', iso3: 'CHE', lat: 46.818, lon: 8.227, order: 26, regions: ['EMEA', 'DACH'] },
        { name: 'France', iso: 'FR', iso3: 'FRA', lat: 46.227, lon: 2.213, order: 27, regions: ['EMEA'] },
        { name: 'Netherlands', iso: 'NL', iso3: 'NLD', lat: 52.132, lon: 5.291, order: 28, regions: ['EMEA'] },
        { name: 'Spain', iso: 'ES', iso3: 'ESP', lat: 40.463, lon: -3.749, order: 29, regions: ['EMEA'] },
        { name: 'Italy', iso: 'IT', iso3: 'ITA', lat: 41.871, lon: 12.567, order: 30, regions: ['EMEA'] },
        { name: 'Sweden', iso: 'SE', iso3: 'SWE', lat: 60.128, lon: 18.643, order: 31, regions: ['EMEA', 'NORDICS'] },
        { name: 'Norway', iso: 'NO', iso3: 'NOR', lat: 60.472, lon: 8.468, order: 32, regions: ['EMEA', 'NORDICS'] },
        { name: 'Denmark', iso: 'DK', iso3: 'DNK', lat: 56.263, lon: 9.501, order: 33, regions: ['EMEA', 'NORDICS'] },
        { name: 'Finland', iso: 'FI', iso3: 'FIN', lat: 61.924, lon: 25.748, order: 34, regions: ['EMEA', 'NORDICS'] },
        { name: 'United Arab Emirates', iso: 'AE', iso3: 'ARE', lat: 23.424, lon: 53.847, order: 35, regions: ['EMEA', 'MENA'] },
        { name: 'Saudi Arabia', iso: 'SA', iso3: 'SAU', lat: 23.885, lon: 45.079, order: 36, regions: ['EMEA', 'MENA'] },
        { name: 'South Africa', iso: 'ZA', iso3: 'ZAF', lat: -30.559, lon: 22.937, order: 37, regions: ['EMEA'] }
    ];

    const countryMap = {};
    for (const c of countries) {
        await pool.query(`
            INSERT INTO audience_countries (name, iso_code, iso3_code, lat, lon, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), iso3_code=VALUES(iso3_code), lat=VALUES(lat), lon=VALUES(lon), display_order=VALUES(display_order)
        `, [c.name, c.iso, c.iso3, c.lat, c.lon, c.order]);

        const [row] = await pool.query('SELECT id FROM audience_countries WHERE iso_code = ?', [c.iso]);
        const countryId = row[0]?.id;
        if (countryId) {
            countryMap[c.iso] = countryId;
            for (const rCode of c.regions) {
                const regId = regionMap[rCode];
                if (regId) {
                    await pool.query(`
                        INSERT INTO audience_geo_region_countries (region_id, country_id)
                        VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE region_id=region_id
                    `, [regId, countryId]);
                }
            }
        }
    }
    console.log('✅ Countries & Region Mappings seeded');

    // 4. Industries (Directly from PPT)
    const industries = [
        { name: 'Telecommunications/Technology Sector', code: 'TECH_TELCO', order: 1 },
        { name: 'Manufacturing & Process Industries', code: 'MANUFACTURING', order: 2 },
        { name: 'Finance/Banking/Insurance/VC/Private Equity', code: 'FINANCE_BANKING', order: 3 },
        { name: 'Healthcare/Pharmaceuticals', code: 'HEALTHCARE_PHARMA', order: 4 },
        { name: 'Retail & Wholesale/Distribution/Logistics', code: 'RETAIL_LOGISTICS', order: 5 },
        { name: 'Business Services/Legal/Accounting/Real Estate/Architecture/Professional Services', code: 'BUSINESS_SERVICES', order: 6 },
        { name: 'Construction/Mining & Utilities/Agriculture & Forestry', code: 'CONSTRUCTION_UTILITIES', order: 7 },
        { name: 'Education', code: 'EDUCATION', order: 8 },
        { name: 'Government/Charity Sector', code: 'GOV_CHARITY', order: 9 },
        { name: 'Travel & Hospitality/Entertainment/Recreation', code: 'TRAVEL_HOSPITALITY', order: 10 },
        { name: 'Media/Advertising/Marketing/PR/Publishing', code: 'MEDIA_MARKETING', order: 11 },
        { name: 'All Other', code: 'ALL_OTHER', order: 12 }
    ];

    const industryMap = {};
    for (const ind of industries) {
        await pool.query(`
            INSERT INTO audience_industries (name, code, display_order)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), display_order=VALUES(display_order)
        `, [ind.name, ind.code, ind.order]);

        const [row] = await pool.query('SELECT id FROM audience_industries WHERE code = ?', [ind.code]);
        if (row[0]) industryMap[ind.code] = row[0].id;
    }
    console.log('✅ Industries seeded');

    // 5. Employee Size Brackets (Updated with granular ranges)
    const employeeSizes = [
        { name: '1–10 employees', code: '1_10', min: 1, max: 10, order: 1 },
        { name: '11–50 employees', code: '11_50', min: 11, max: 50, order: 2 },
        { name: '51–200 employees', code: '51_200', min: 51, max: 200, order: 3 },
        { name: '201–500 employees', code: '201_500', min: 201, max: 500, order: 4 },
        { name: '501–1,000 employees', code: '501_1000', min: 501, max: 1000, order: 5 },
        { name: '1,001–5,000 employees', code: '1001_5000', min: 1001, max: 5000, order: 6 },
        { name: '5,001–10,000 employees', code: '5001_10000', min: 5001, max: 10000, order: 7 },
        { name: '10,001+ employees', code: '10001_PLUS', min: 10001, max: null, order: 8 }
    ];

    const sizeMap = {};
    for (const sz of employeeSizes) {
        await pool.query(`
            INSERT INTO audience_employee_sizes (name, code, min_employees, max_employees, display_order)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), min_employees=VALUES(min_employees), max_employees=VALUES(max_employees), display_order=VALUES(display_order)
        `, [sz.name, sz.code, sz.min, sz.max, sz.order]);

        const [row] = await pool.query('SELECT id FROM audience_employee_sizes WHERE code = ?', [sz.code]);
        if (row[0]) sizeMap[sz.code] = row[0].id;
    }
    console.log('✅ Employee Sizes seeded');

    // 6. Departments (From PPT)
    const departments = [
        { name: 'IT', code: 'IT', order: 1 },
        { name: 'HR', code: 'HR', order: 2 },
        { name: 'Marketing', code: 'MARKETING', order: 3 },
        { name: 'Sales', code: 'SALES', order: 4 },
        { name: 'Finance', code: 'FINANCE', order: 5 },
        { name: 'Operations', code: 'OPERATIONS', order: 6 },
        { name: 'Other', code: 'OTHER', order: 7 }
    ];

    const deptMap = {};
    for (const d of departments) {
        await pool.query(`
            INSERT INTO audience_departments (name, code, display_order)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), display_order=VALUES(display_order)
        `, [d.name, d.code, d.order]);

        const [row] = await pool.query('SELECT id FROM audience_departments WHERE code = ?', [d.code]);
        if (row[0]) deptMap[d.code] = row[0].id;
    }
    console.log('✅ Departments seeded');

    // 7. Job Levels / Seniority (From PPT reference)
    const jobLevels = [
        { name: 'C-Level / CXO', code: 'C_LEVEL', rank: 1, order: 1 },
        { name: 'Executive / VP', code: 'VP_EXEC', rank: 2, order: 2 },
        { name: 'Director', code: 'DIRECTOR', rank: 3, order: 3 },
        { name: 'Manager / Decision Maker', code: 'MANAGER', rank: 4, order: 4 },
        { name: 'Professional / Technical Title', code: 'TECHNICAL', rank: 5, order: 5 },
        { name: 'Other', code: 'OTHER_LEVEL', rank: 6, order: 6 }
    ];

    const levelMap = {};
    for (const lvl of jobLevels) {
        await pool.query(`
            INSERT INTO audience_job_levels (name, code, rank_order, display_order)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), rank_order=VALUES(rank_order), display_order=VALUES(display_order)
        `, [lvl.name, lvl.code, lvl.rank, lvl.order]);

        const [row] = await pool.query('SELECT id FROM audience_job_levels WHERE code = ?', [lvl.code]);
        if (row[0]) levelMap[lvl.code] = row[0].id;
    }
    console.log('✅ Job Levels seeded');

    // 8. Aggregated Audience Statistics (Populate realistic, high-fidelity combinations)
    // Clear existing statistics to re-seed a completely coherent set
    await pool.query('DELETE FROM audience_statistics');

    console.log('📊 Generating aggregated audience demographic combinations...');

    // Regional Base Multipliers & Totals:
    // Global Total = ~78M Contacts
    // - North America: ~26.5M
    // - EMEA (including DACH, Nordics, MENA): ~23.2M
    // - APAC (India, Australia, Singapore, etc.): ~19.9M
    // - LATAM: Exactly 8.40M+ as per PPT
    const countryWeights = {
        // LATAM (~8.40M total)
        'BR': { region: 'LATAM', total: 3100000 },
        'MX': { region: 'LATAM', total: 2450000 },
        'CO': { region: 'LATAM', total: 920000 },
        'PE': { region: 'LATAM', total: 580000 },
        'CL': { region: 'LATAM', total: 470000 },
        'AR': { region: 'LATAM', total: 410000 },
        'CR': { region: 'LATAM', total: 190000 },
        'EC': { region: 'LATAM', total: 130000 },
        'VE': { region: 'LATAM', total: 95000 },
        'BO': { region: 'LATAM', total: 55000 },

        // North America (~26.5M)
        'US': { region: 'NORTH_AMERICA', total: 23500000 },
        'CA': { region: 'NORTH_AMERICA', total: 3000000 },

        // APAC (~19.9M)
        'IN': { region: 'APAC', total: 9800000 },
        'AU': { region: 'APAC', total: 2900000 },
        'SG': { region: 'APAC', total: 1450000 },
        'JP': { region: 'APAC', total: 2200000 },
        'KR': { region: 'APAC', total: 1100000 },
        'ID': { region: 'APAC', total: 850000 },
        'MY': { region: 'APAC', total: 620000 },
        'PH': { region: 'APAC', total: 510000 },
        'NZ': { region: 'APAC', total: 320000 },
        'VN': { region: 'APAC', total: 150000 },

        // EMEA / DACH / Nordics / MENA (~23.2M)
        'GB': { region: 'EMEA', total: 5400000 },
        'DE': { region: 'EMEA', total: 4600000 },
        'FR': { region: 'EMEA', total: 3300000 },
        'NL': { region: 'EMEA', total: 1800000 },
        'IT': { region: 'EMEA', total: 1500000 },
        'ES': { region: 'EMEA', total: 1400000 },
        'CH': { region: 'EMEA', total: 980000 },
        'SE': { region: 'EMEA', total: 920000 },
        'AT': { region: 'EMEA', total: 720000 },
        'AE': { region: 'EMEA', total: 850000 },
        'SA': { region: 'EMEA', total: 680000 },
        'ZA': { region: 'EMEA', total: 550000 },
        'NO': { region: 'EMEA', total: 420000 },
        'DK': { region: 'EMEA', total: 380000 },
        'FI': { region: 'EMEA', total: 300000 }
    };

    // Industry Distribution Weights (summing to 100)
    const indWeights = {
        'TECH_TELCO': 0.22,
        'FINANCE_BANKING': 0.16,
        'MANUFACTURING': 0.14,
        'HEALTHCARE_PHARMA': 0.11,
        'BUSINESS_SERVICES': 0.10,
        'RETAIL_LOGISTICS': 0.08,
        'MEDIA_MARKETING': 0.05,
        'EDUCATION': 0.04,
        'CONSTRUCTION_UTILITIES': 0.04,
        'GOV_CHARITY': 0.02,
        'TRAVEL_HOSPITALITY': 0.02,
        'ALL_OTHER': 0.02
    };

    // Employee Size Distribution Weights
    const sizeWeights = {
        '1_10': 0.18,
        '11_50': 0.22,
        '51_200': 0.20,
        '201_500': 0.14,
        '501_1000': 0.10,
        '1001_5000': 0.08,
        '5001_10000': 0.05,
        '10001_PLUS': 0.03
    };

    // Department Distribution Weights
    const deptWeights = {
        'IT': 0.32,
        'SALES': 0.18,
        'MARKETING': 0.16,
        'OPERATIONS': 0.14,
        'FINANCE': 0.10,
        'HR': 0.06,
        'OTHER': 0.04
    };

    // Seniority Distribution Weights
    const levelWeights = {
        'DIRECTOR': 0.26,
        'MANAGER': 0.30,
        'C_LEVEL': 0.12,
        'VP_EXEC': 0.14,
        'TECHNICAL': 0.14,
        'OTHER_LEVEL': 0.04
    };

    const batchRows = [];
    let totalGeneratedContacts = 0;

    for (const [iso, meta] of Object.entries(countryWeights)) {
        const countryId = countryMap[iso];
        const regionId = regionMap[meta.region];
        if (!countryId || !regionId) continue;

        const countryTotal = meta.total;

        for (const [indCode, indW] of Object.entries(indWeights)) {
            const indId = industryMap[indCode];
            if (!indId) continue;

            for (const [sizeCode, sizeW] of Object.entries(sizeWeights)) {
                const sizeId = sizeMap[sizeCode];
                if (!sizeId) continue;

                for (const [deptCode, deptW] of Object.entries(deptWeights)) {
                    const deptId = deptMap[deptCode];
                    if (!deptId) continue;

                    for (const [lvlCode, lvlW] of Object.entries(levelWeights)) {
                        const lvlId = levelMap[lvlCode];
                        if (!lvlId) continue;

                        // Precise expected count for this atomic demographic cell
                        const rawCount = countryTotal * indW * sizeW * deptW * lvlW;
                        const contactCount = Math.max(1, Math.round(rawCount));
                        const companyCount = Math.max(1, Math.round(contactCount / 3.4));

                        batchRows.push([
                            regionId, countryId, indId, sizeId, deptId, lvlId,
                            contactCount, companyCount, 'Internal B2B Intelligence', 'August 2026', 'Published'
                        ]);

                        totalGeneratedContacts += contactCount;
                    }
                }
            }
        }
    }

    // Insert in optimized batches of 1000
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < batchRows.length; i += CHUNK_SIZE) {
        const chunk = batchRows.slice(i, i + CHUNK_SIZE);
        await pool.query(`
            INSERT INTO audience_statistics 
            (region_id, country_id, industry_id, employee_size_id, department_id, job_level_id, contact_count, company_count, data_source, effective_date, status)
            VALUES ?
        `, [chunk]);
    }

    console.log(`✅ Seeded ${batchRows.length} demographic combinations across all dimensions.`);
    console.log(`📊 Aggregated Total Contacts in Database: ~${totalGeneratedContacts.toLocaleString()}`);

    // Update global total in settings to match exactly
    await pool.query(`
        UPDATE audience_global_settings 
        SET setting_value = ? 
        WHERE setting_key = 'global_contacts_total'
    `, [totalGeneratedContacts.toString()]);

    // Initial audit log
    await pool.query(`
        INSERT INTO audience_audit_logs (user_name, action, entity, entity_id, new_value)
        VALUES ('System Setup', 'SEED_DATABASE', 'audience_statistics', 'ALL', JSON_OBJECT('total_contacts', ?, 'records_count', ?))
    `, [totalGeneratedContacts, batchRows.length]);

    console.log('🎉 Audience Intelligence migration & seeding completed successfully!');
};

const run = async () => {
    try {
        console.log('🚀 Running Audience Intelligence Schema...');
        const schemaPath = path.join(__dirname, '../database/audience_intelligence_schema.sql');
        await executeSqlFile(schemaPath);
        console.log('✅ Schema tables verified/created');

        await seedData();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating audience intelligence tables:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

if (require.main === module) {
    run();
}

module.exports = { seedData };
