/**
 * Database Migration & Seeding Script for B2B Audience Intelligence Module (LinkedIn-Aligned V2)
 * Seeds comprehensive Master Geography, Commercial Geo Groups, LinkedIn Industry V2 Hierarchy,
 * LinkedIn Headcount Brackets, Functions, Job Titles, Seniorities, and Aggregated Demographic Cube.
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
    // Safely drop old audience tables in reverse foreign key order to ensure fresh LinkedIn schema
    const tablesToDrop = [
        'audience_statistics',
        'audience_job_titles',
        'audience_share_tokens',
        'audience_analytics_events',
        'audience_adjustment_history',
        'audience_data_imports',
        'audience_geo_group_countries',
        'audience_geo_region_countries',
        'audience_functions',
        'audience_job_levels',
        'audience_departments',
        'audience_employee_sizes',
        'audience_industries',
        'audience_countries',
        'audience_geo_groups',
        'audience_geo_regions'
    ];

    for (const t of tablesToDrop) {
        try {
            await pool.query(`DROP TABLE IF EXISTS ${t}`);
        } catch (e) {
            // ignore
        }
    }

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
    console.log('🌍 Seeding LinkedIn-Aligned B2B Audience Intelligence data...');

    // 1. Global Settings
    const defaultSettings = [
        { key: 'global_contacts_total', value: '78000000', desc: 'Commercial Global Database Size (78M+)' },
        { key: 'global_companies_total', value: '4250000', desc: 'Commercial Global Companies Count' },
        { key: 'countries_covered_count', value: '195+', desc: 'Total Countries Covered Worldwide' },
        { key: 'last_updated_display', value: 'September 2026', desc: 'Commercial Freshness Badge' },
        { key: 'privacy_threshold', value: '25', desc: 'Minimum Audience Count before Masking' },
        { key: 'module_title', value: 'B2B Audience Intelligence', desc: 'Header Title' },
        { key: 'brand_name', value: 'TGS TECH INFO', desc: 'Brand Name' },
        { key: 'industry_taxonomy_version', value: 'LinkedIn Industry Codes V2', desc: 'Active Industry Taxonomy' }
    ];

    for (const s of defaultSettings) {
        await pool.query(`
            INSERT INTO audience_global_settings (setting_key, setting_value, description)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = VALUES(description)
        `, [s.key, s.value, s.desc]);
    }
    console.log('✅ Global Settings seeded');

    // 2. Geographic Continents / Macro Regions
    const regions = [
        { name: 'Global', code: 'GLOBAL', type: 'GLOBAL', lat: 20.0, lon: 0.0, zoom: 1.0, order: 0 },
        { name: 'North America', code: 'NORTH_AMERICA', type: 'CONTINENT', lat: 40.0, lon: -100.0, zoom: 1.5, order: 1 },
        { name: 'LATAM', code: 'LATAM', type: 'CONTINENT', lat: -15.0, lon: -60.0, zoom: 1.6, order: 2 },
        { name: 'EMEA', code: 'EMEA', type: 'CONTINENT', lat: 48.0, lon: 20.0, zoom: 1.5, order: 3 },
        { name: 'APAC', code: 'APAC', type: 'CONTINENT', lat: 20.0, lon: 95.0, zoom: 1.4, order: 4 }
    ];

    const regionMap = {};
    for (const r of regions) {
        await pool.query(`
            INSERT INTO audience_geo_regions (name, code, region_type, lat, lon, default_zoom, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), lat=VALUES(lat), lon=VALUES(lon), default_zoom=VALUES(default_zoom), display_order=VALUES(display_order)
        `, [r.name, r.code, r.type, r.lat, r.lon, r.zoom, r.order]);
        
        const [row] = await pool.query('SELECT id FROM audience_geo_regions WHERE code = ?', [r.code]);
        if (row[0]) regionMap[r.code] = row[0].id;
    }
    console.log('✅ Geo Macro Regions seeded');

    // 3. Commercial Geo Groups (Many-to-Many Groups)
    const geoGroups = [
        { name: 'North America', code: 'NORTH_AMERICA', desc: 'USA and Canada Enterprise Markets', order: 1 },
        { name: 'EMEA', code: 'EMEA', desc: 'Europe, Middle East and Africa', order: 2 },
        { name: 'APAC', code: 'APAC', desc: 'Asia Pacific Region', order: 3 },
        { name: 'LATAM', code: 'LATAM', desc: 'Latin America (Brazil, Mexico, Colombia, etc.)', order: 4 },
        { name: 'DACH', code: 'DACH', desc: 'Germany, Austria, Switzerland', order: 5 },
        { name: 'Nordics', code: 'NORDICS', desc: 'Sweden, Norway, Denmark, Finland', order: 6 },
        { name: 'UK & Ireland', code: 'UK_IRELAND', desc: 'United Kingdom and Ireland', order: 7 },
        { name: 'MENA', code: 'MENA', desc: 'Middle East and North Africa', order: 8 },
        { name: 'ANZ', code: 'ANZ', desc: 'Australia and New Zealand', order: 9 },
        { name: 'Southeast Asia', code: 'SEA', desc: 'Singapore, Malaysia, Indonesia, Philippines, Vietnam', order: 10 }
    ];

    const groupMap = {};
    for (const g of geoGroups) {
        await pool.query(`
            INSERT INTO audience_geo_groups (name, code, description, display_order)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), display_order=VALUES(display_order)
        `, [g.name, g.code, g.desc, g.order]);
        
        const [row] = await pool.query('SELECT id FROM audience_geo_groups WHERE code = ?', [g.code]);
        if (row[0]) groupMap[g.code] = row[0].id;
    }
    console.log('✅ Commercial Geo Groups seeded');

    // 4. Country Master (Comprehensive Global List)
    const countries = [
        // North America
        { name: 'United States', iso: 'US', iso3: 'USA', num: '840', continent: 'North America', lat: 37.090, lon: -95.712, order: 1, groups: ['NORTH_AMERICA'], macro: 'NORTH_AMERICA' },
        { name: 'Canada', iso: 'CA', iso3: 'CAN', num: '124', continent: 'North America', lat: 56.130, lon: -106.346, order: 2, groups: ['NORTH_AMERICA'], macro: 'NORTH_AMERICA' },

        // LATAM
        { name: 'Brazil', iso: 'BR', iso3: 'BRA', num: '076', continent: 'South America', lat: -14.235, lon: -51.925, order: 10, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Mexico', iso: 'MX', iso3: 'MEX', num: '484', continent: 'North America', lat: 23.634, lon: -102.552, order: 11, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Colombia', iso: 'CO', iso3: 'COL', num: '170', continent: 'South America', lat: 4.570, lon: -74.297, order: 12, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Peru', iso: 'PE', iso3: 'PER', num: '604', continent: 'South America', lat: -9.189, lon: -75.015, order: 13, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Chile', iso: 'CL', iso3: 'CHL', num: '152', continent: 'South America', lat: -35.675, lon: -71.542, order: 14, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Argentina', iso: 'AR', iso3: 'ARG', num: '032', continent: 'South America', lat: -38.416, lon: -63.616, order: 15, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Costa Rica', iso: 'CR', iso3: 'CRI', num: '188', continent: 'North America', lat: 9.748, lon: -83.753, order: 16, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Venezuela', iso: 'VE', iso3: 'VEN', num: '862', continent: 'South America', lat: 6.423, lon: -66.589, order: 17, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Ecuador', iso: 'EC', iso3: 'ECU', num: '218', continent: 'South America', lat: -1.831, lon: -78.183, order: 18, groups: ['LATAM'], macro: 'LATAM' },
        { name: 'Bolivia', iso: 'BO', iso3: 'BOL', num: '068', continent: 'South America', lat: -16.290, lon: -63.588, order: 19, groups: ['LATAM'], macro: 'LATAM' },

        // APAC
        { name: 'India', iso: 'IN', iso3: 'IND', num: '356', continent: 'Asia', lat: 20.593, lon: 78.962, order: 20, groups: ['APAC'], macro: 'APAC' },
        { name: 'Australia', iso: 'AU', iso3: 'AUS', num: '036', continent: 'Oceania', lat: -25.274, lon: 133.775, order: 21, groups: ['APAC', 'ANZ'], macro: 'APAC' },
        { name: 'Singapore', iso: 'SG', iso3: 'SGP', num: '702', continent: 'Asia', lat: 1.352, lon: 103.819, order: 22, groups: ['APAC', 'SEA'], macro: 'APAC' },
        { name: 'Japan', iso: 'JP', iso3: 'JPN', num: '392', continent: 'Asia', lat: 36.204, lon: 138.252, order: 23, groups: ['APAC'], macro: 'APAC' },
        { name: 'Indonesia', iso: 'ID', iso3: 'IDN', num: '360', continent: 'Asia', lat: -0.789, lon: 113.921, order: 24, groups: ['APAC', 'SEA'], macro: 'APAC' },
        { name: 'Malaysia', iso: 'MY', iso3: 'MYS', num: '458', continent: 'Asia', lat: 4.210, lon: 101.975, order: 25, groups: ['APAC', 'SEA'], macro: 'APAC' },
        { name: 'Philippines', iso: 'PH', iso3: 'PHL', num: '608', continent: 'Asia', lat: 12.879, lon: 121.774, order: 26, groups: ['APAC', 'SEA'], macro: 'APAC' },
        { name: 'South Korea', iso: 'KR', iso3: 'KOR', num: '410', continent: 'Asia', lat: 35.907, lon: 127.766, order: 27, groups: ['APAC'], macro: 'APAC' },
        { name: 'New Zealand', iso: 'NZ', iso3: 'NZL', num: '554', continent: 'Oceania', lat: -40.900, lon: 174.885, order: 28, groups: ['APAC', 'ANZ'], macro: 'APAC' },
        { name: 'Vietnam', iso: 'VN', iso3: 'VNM', num: '704', continent: 'Asia', lat: 14.058, lon: 108.277, order: 29, groups: ['APAC', 'SEA'], macro: 'APAC' },
        { name: 'Thailand', iso: 'TH', iso3: 'THA', num: '764', continent: 'Asia', lat: 15.870, lon: 100.992, order: 30, groups: ['APAC', 'SEA'], macro: 'APAC' },

        // EMEA / DACH / Nordics / UK / MENA
        { name: 'United Kingdom', iso: 'GB', iso3: 'GBR', num: '826', continent: 'Europe', lat: 55.378, lon: -3.435, order: 40, groups: ['EMEA', 'UK_IRELAND'], macro: 'EMEA' },
        { name: 'Ireland', iso: 'IE', iso3: 'IRL', num: '372', continent: 'Europe', lat: 53.412, lon: -8.243, order: 41, groups: ['EMEA', 'UK_IRELAND'], macro: 'EMEA' },
        { name: 'Germany', iso: 'DE', iso3: 'DEU', num: '276', continent: 'Europe', lat: 51.165, lon: 10.451, order: 42, groups: ['EMEA', 'DACH'], macro: 'EMEA' },
        { name: 'Austria', iso: 'AT', iso3: 'AUT', num: '040', continent: 'Europe', lat: 47.516, lon: 14.550, order: 43, groups: ['EMEA', 'DACH'], macro: 'EMEA' },
        { name: 'Switzerland', iso: 'CH', iso3: 'CHE', num: '756', continent: 'Europe', lat: 46.818, lon: 8.227, order: 44, groups: ['EMEA', 'DACH'], macro: 'EMEA' },
        { name: 'France', iso: 'FR', iso3: 'FRA', num: '250', continent: 'Europe', lat: 46.227, lon: 2.213, order: 45, groups: ['EMEA'], macro: 'EMEA' },
        { name: 'Netherlands', iso: 'NL', iso3: 'NLD', num: '528', continent: 'Europe', lat: 52.132, lon: 5.291, order: 46, groups: ['EMEA'], macro: 'EMEA' },
        { name: 'Spain', iso: 'ES', iso3: 'ESP', num: '724', continent: 'Europe', lat: 40.463, lon: -3.749, order: 47, groups: ['EMEA'], macro: 'EMEA' },
        { name: 'Italy', iso: 'IT', iso3: 'ITA', num: '380', continent: 'Europe', lat: 41.871, lon: 12.567, order: 48, groups: ['EMEA'], macro: 'EMEA' },
        { name: 'Sweden', iso: 'SE', iso3: 'SWE', num: '752', continent: 'Europe', lat: 60.128, lon: 18.643, order: 49, groups: ['EMEA', 'NORDICS'], macro: 'EMEA' },
        { name: 'Norway', iso: 'NO', iso3: 'NOR', num: '578', continent: 'Europe', lat: 60.472, lon: 8.468, order: 50, groups: ['EMEA', 'NORDICS'], macro: 'EMEA' },
        { name: 'Denmark', iso: 'DK', iso3: 'DNK', num: '208', continent: 'Europe', lat: 56.263, lon: 9.501, order: 51, groups: ['EMEA', 'NORDICS'], macro: 'EMEA' },
        { name: 'Finland', iso: 'FI', iso3: 'FIN', num: '246', continent: 'Europe', lat: 61.924, lon: 25.748, order: 52, groups: ['EMEA', 'NORDICS'], macro: 'EMEA' },
        { name: 'Belgium', iso: 'BE', iso3: 'BEL', num: '056', continent: 'Europe', lat: 50.503, lon: 4.469, order: 53, groups: ['EMEA'], macro: 'EMEA' },
        { name: 'Poland', iso: 'PL', iso3: 'POL', num: '616', continent: 'Europe', lat: 51.919, lon: 19.145, order: 54, groups: ['EMEA'], macro: 'EMEA' },
        { name: 'United Arab Emirates', iso: 'AE', iso3: 'ARE', num: '784', continent: 'Asia', lat: 23.424, lon: 53.847, order: 55, groups: ['EMEA', 'MENA'], macro: 'EMEA' },
        { name: 'Saudi Arabia', iso: 'SA', iso3: 'SAU', num: '682', continent: 'Asia', lat: 23.885, lon: 45.079, order: 56, groups: ['EMEA', 'MENA'], macro: 'EMEA' },
        { name: 'South Africa', iso: 'ZA', iso3: 'ZAF', num: '710', continent: 'Africa', lat: -30.559, lon: 22.937, order: 57, groups: ['EMEA'], macro: 'EMEA' }
    ];

    const countryMap = {};
    for (const c of countries) {
        await pool.query(`
            INSERT INTO audience_countries 
            (name, iso_code, iso_alpha2, iso_alpha3, numeric_code, continent, lat, lon, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                name=VALUES(name), iso_alpha2=VALUES(iso_alpha2), iso_alpha3=VALUES(iso_alpha3), 
                numeric_code=VALUES(numeric_code), continent=VALUES(continent), lat=VALUES(lat), lon=VALUES(lon), display_order=VALUES(display_order)
        `, [c.name, c.iso, c.iso, c.iso3, c.num, c.continent, c.lat, c.lon, c.order]);

        const [row] = await pool.query('SELECT id FROM audience_countries WHERE iso_code = ?', [c.iso]);
        if (row[0]) {
            const countryId = row[0].id;
            countryMap[c.iso] = countryId;

            // Map to macro region
            const macroId = regionMap[c.macro];
            if (macroId) {
                await pool.query(`
                    INSERT INTO audience_geo_region_countries (region_id, country_id)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE country_id=country_id
                `, [macroId, countryId]);
            }

            // Map to commercial groups
            for (const gCode of c.groups) {
                const gId = groupMap[gCode];
                if (gId) {
                    await pool.query(`
                        INSERT INTO audience_geo_group_countries (geo_group_id, country_id)
                        VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE country_id=country_id
                    `, [gId, countryId]);
                }
            }
        }
    }
    console.log(`✅ ${countries.length} Countries and Group Mappings seeded`);

    // 5. LinkedIn Industry Codes V2 Hierarchy (L1, L2, L3)
    const industriesL1 = [
        { code: 'TECH_MEDIA', name: 'Technology, Information and Media', lkId: '4', desc: 'Software, Hardware, Telecommunications, Cloud and Media', order: 1 },
        { code: 'FINANCIAL_SERVICES', name: 'Financial Services', lkId: '43', desc: 'Banking, Investment, FinTech, Insurance, Wealth Management', order: 2 },
        { code: 'MANUFACTURING', name: 'Manufacturing', lkId: '19', desc: 'Industrial Automation, Automotive, Machinery, Aerospace', order: 3 },
        { code: 'HEALTHCARE', name: 'Hospitals and Health Care', lkId: '14', desc: 'Medical Devices, Biotechnology, Healthcare Systems, Pharma', order: 4 },
        { code: 'PROFESSIONAL_SERVICES', name: 'Professional Services', lkId: '96', desc: 'Management Consulting, Legal, Accounting, IT Services', order: 5 },
        { code: 'RETAIL_COMMERCE', name: 'Retail and E-Commerce', lkId: '27', desc: 'Omnichannel Retail, Consumer Goods, Wholesale, E-Commerce', order: 6 },
        { code: 'EDUCATION', name: 'Educational Services', lkId: '68', desc: 'Higher Education, E-Learning, EdTech, Research', order: 7 },
        { code: 'CONSTRUCTION_REAL_ESTATE', name: 'Construction and Real Estate', lkId: '48', desc: 'Commercial Real Estate, Civil Engineering, Architecture', order: 8 },
        { code: 'TRANSPORT_LOGISTICS', name: 'Transportation, Logistics and Storage', lkId: '116', desc: 'Supply Chain, Freight, Maritime, Aviation Logistics', order: 9 },
        { code: 'ENERGY_UTILITIES', name: 'Utilities and Energy', lkId: '57', desc: 'Renewable Energy, Oil & Gas, Power Generation, Smart Grid', order: 10 },
        { code: 'GOVERNMENT_NON_PROFIT', name: 'Government and Non-Profit', lkId: '75', desc: 'Public Sector, International Affairs, Defense, NGOs', order: 11 },
        { code: 'UNCLASSIFIED', name: 'Unclassified / Multi-Sector', lkId: '0', desc: 'Cross-industry and emerging niche segments', order: 12 }
    ];

    const industryMap = {};
    for (const l1 of industriesL1) {
        await pool.query(`
            INSERT INTO audience_industries (name, code, linkedin_industry_id, level, hierarchy_path, description, display_order)
            VALUES (?, ?, ?, 1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), linkedin_industry_id=VALUES(linkedin_industry_id), level=1, hierarchy_path=VALUES(hierarchy_path), description=VALUES(description), display_order=VALUES(display_order)
        `, [l1.name, l1.code, l1.lkId, l1.name, l1.desc, l1.order]);

        const [row] = await pool.query('SELECT id FROM audience_industries WHERE code = ?', [l1.code]);
        if (row[0]) industryMap[l1.code] = row[0].id;
    }

    // L2 Sub-Industries
    const industriesL2 = [
        { parent: 'TECH_MEDIA', code: 'SOFTWARE_DEV', name: 'Software Development', lkId: '4', desc: 'Enterprise SaaS, Application Development' },
        { parent: 'TECH_MEDIA', code: 'IT_SERVICES_CONSULTING', name: 'IT Services and IT Consulting', lkId: '96', desc: 'Managed Services, Cloud Integration' },
        { parent: 'TECH_MEDIA', code: 'CYBERSECURITY_NETWORKS', name: 'Computer and Network Security', lkId: '118', desc: 'Cybersecurity, Threat Intelligence' },
        { parent: 'TECH_MEDIA', code: 'TELECOM', name: 'Telecommunications', lkId: '8', desc: 'Wireless, 5G Infrastructure, Telecom Providers' },
        { parent: 'FINANCIAL_SERVICES', code: 'BANKING', name: 'Banking', lkId: '41', desc: 'Commercial & Retail Banking' },
        { parent: 'FINANCIAL_SERVICES', code: 'FINTECH', name: 'Financial Technology (FinTech)', lkId: '43', desc: 'Payment Gateways, Digital Banking' },
        { parent: 'FINANCIAL_SERVICES', code: 'INVESTMENT_MGMT', name: 'Investment Management & VC', lkId: '45', desc: 'Private Equity, Venture Capital' },
        { parent: 'HEALTHCARE', code: 'MEDICAL_EQUIPMENT', name: 'Medical Equipment Manufacturing', lkId: '17', desc: 'Diagnostic & Surgical Technology' },
        { parent: 'HEALTHCARE', code: 'BIOTECH_PHARMA', name: 'Biotechnology and Pharmaceuticals', lkId: '15', desc: 'Drug Discovery, Therapeutics' },
        { parent: 'MANUFACTURING', code: 'INDUSTRIAL_AUTOMATION', name: 'Industrial Automation & Robotics', lkId: '135', desc: 'Industry 4.0, Smart Manufacturing' },
        { parent: 'MANUFACTURING', code: 'AUTOMOTIVE_EV', name: 'Motor Vehicle Manufacturing & EV', lkId: '54', desc: 'Automotive OEMs and Suppliers' },
        { parent: 'PROFESSIONAL_SERVICES', code: 'MANAGEMENT_CONSULTING', name: 'Business Consulting and Services', lkId: '80', desc: 'Strategic Advisory, Operations' }
    ];

    for (const l2 of industriesL2) {
        const parentId = industryMap[l2.parent];
        if (!parentId) continue;
        const parentName = industriesL1.find(x => x.code === l2.parent)?.name || '';
        const path = `${parentName} > ${l2.name}`;

        await pool.query(`
            INSERT INTO audience_industries (name, code, parent_id, linkedin_industry_id, level, hierarchy_path, description)
            VALUES (?, ?, ?, ?, 2, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), parent_id=VALUES(parent_id), linkedin_industry_id=VALUES(linkedin_industry_id), level=2, hierarchy_path=VALUES(hierarchy_path), description=VALUES(description)
        `, [l2.name, l2.code, parentId, l2.lkId, path, l2.desc]);

        const [row] = await pool.query('SELECT id FROM audience_industries WHERE code = ?', [l2.code]);
        if (row[0]) industryMap[l2.code] = row[0].id;
    }
    console.log('✅ LinkedIn Industry V2 Hierarchy seeded');

    // 6. LinkedIn Company Headcount Brackets
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
    for (const s of employeeSizes) {
        await pool.query(`
            INSERT INTO audience_employee_sizes (name, code, min_employees, max_employees, display_order)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), min_employees=VALUES(min_employees), max_employees=VALUES(max_employees), display_order=VALUES(display_order)
        `, [s.name, s.code, s.min, s.max, s.order]);

        const [row] = await pool.query('SELECT id FROM audience_employee_sizes WHERE code = ?', [s.code]);
        if (row[0]) sizeMap[s.code] = row[0].id;
    }
    console.log('✅ LinkedIn Headcount Brackets seeded');

    // 7. LinkedIn Standard Functions
    const linkedinFunctions = [
        { name: 'Information Technology', code: 'IT', desc: 'IT Infrastructure, Cloud, Security, Systems Administration', order: 1 },
        { name: 'Engineering', code: 'ENGINEERING', desc: 'Software Architecture, DevOps, QA, Hardware Engineering', order: 2 },
        { name: 'Sales & Revenue', code: 'SALES', desc: 'Account Executives, Enterprise Sales, Business Development', order: 3 },
        { name: 'Marketing & Growth', code: 'MARKETING', desc: 'Demand Generation, Product Marketing, Brand, Growth', order: 4 },
        { name: 'Finance', code: 'FINANCE', desc: 'Corporate Finance, Accounting, FP&A, Treasury, Tax', order: 5 },
        { name: 'Operations', code: 'OPERATIONS', desc: 'Business Operations, Supply Chain, Logistics, Procurement', order: 6 },
        { name: 'Product Management', code: 'PRODUCT', desc: 'Product Strategy, UX, Technical Product Managers', order: 7 },
        { name: 'Human Resources', code: 'HR', desc: 'Talent Acquisition, People Operations, HR Leadership', order: 8 },
        { name: 'Consulting', code: 'CONSULTING', desc: 'Strategy, Implementation, Management Consulting', order: 9 },
        { name: 'Healthcare Services', code: 'HEALTHCARE_SERVICES', desc: 'Clinical, Medical Affairs, Health Administration', order: 10 },
        { name: 'Legal', code: 'LEGAL', desc: 'Corporate Counsel, Compliance, Regulatory Affairs', order: 11 },
        { name: 'Research & Development', code: 'RESEARCH', desc: 'Applied Science, Data Science, Lab Research', order: 12 }
    ];

    const functionMap = {};
    for (const f of linkedinFunctions) {
        await pool.query(`
            INSERT INTO audience_functions (name, code, description, display_order)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), display_order=VALUES(display_order)
        `, [f.name, f.code, f.desc, f.order]);

        const [row] = await pool.query('SELECT id FROM audience_functions WHERE code = ?', [f.code]);
        if (row[0]) functionMap[f.code] = row[0].id;
    }
    console.log('✅ LinkedIn Standard Job Functions seeded');

    // 8. Departments (Mapped/Synonymous for compatibility)
    const departments = [
        { name: 'Information Technology', code: 'IT', order: 1 },
        { name: 'Engineering', code: 'ENGINEERING', order: 2 },
        { name: 'Sales', code: 'SALES', order: 3 },
        { name: 'Marketing', code: 'MARKETING', order: 4 },
        { name: 'Finance', code: 'FINANCE', order: 5 },
        { name: 'Operations', code: 'OPERATIONS', order: 6 },
        { name: 'Human Resources', code: 'HR', order: 7 },
        { name: 'Other Department', code: 'OTHER', order: 8 }
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

    // 9. LinkedIn Seniorities
    const linkedinSeniorities = [
        { name: 'CXO / C-Suite', code: 'CXO', rank: 1, order: 1 },
        { name: 'Vice President (VP)', code: 'VP', rank: 2, order: 2 },
        { name: 'Director', code: 'DIRECTOR', rank: 3, order: 3 },
        { name: 'Manager / Lead', code: 'MANAGER', rank: 4, order: 4 },
        { name: 'Senior Practitioner', code: 'SENIOR', rank: 5, order: 5 },
        { name: 'Entry Level', code: 'ENTRY', rank: 6, order: 6 },
        { name: 'Partner / Owner', code: 'OWNER', rank: 7, order: 7 },
        { name: 'Training / Student', code: 'TRAINING', rank: 8, order: 8 }
    ];

    const levelMap = {};
    for (const j of linkedinSeniorities) {
        await pool.query(`
            INSERT INTO audience_job_levels (name, code, rank_order, display_order)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), rank_order=VALUES(rank_order), display_order=VALUES(display_order)
        `, [j.name, j.code, j.rank, j.order]);

        const [row] = await pool.query('SELECT id FROM audience_job_levels WHERE code = ?', [j.code]);
        if (row[0]) levelMap[j.code] = row[0].id;
    }
    console.log('✅ LinkedIn Seniority Levels seeded');

    // 10. Job Titles (Dynamic sample master)
    const jobTitles = [
        { title: 'Chief Executive Officer', func: 'OPERATIONS', level: 'CXO' },
        { title: 'Chief Technology Officer', func: 'ENGINEERING', level: 'CXO' },
        { title: 'Chief Information Officer', func: 'IT', level: 'CXO' },
        { title: 'Chief Information Security Officer', func: 'IT', level: 'CXO' },
        { title: 'Chief Marketing Officer', func: 'MARKETING', level: 'CXO' },
        { title: 'Chief Financial Officer', func: 'FINANCE', level: 'CXO' },
        { title: 'VP of Information Technology', func: 'IT', level: 'VP' },
        { title: 'VP of Engineering', func: 'ENGINEERING', level: 'VP' },
        { title: 'VP of Demand Generation', func: 'MARKETING', level: 'VP' },
        { title: 'VP of Enterprise Sales', func: 'SALES', level: 'VP' },
        { title: 'Director of IT Infrastructure', func: 'IT', level: 'DIRECTOR' },
        { title: 'Director of Cloud Architecture', func: 'ENGINEERING', level: 'DIRECTOR' },
        { title: 'Director of Growth Marketing', func: 'MARKETING', level: 'DIRECTOR' },
        { title: 'IT Manager', func: 'IT', level: 'MANAGER' },
        { title: 'DevOps Lead', func: 'ENGINEERING', level: 'MANAGER' },
        { title: 'Senior Security Architect', func: 'IT', level: 'SENIOR' }
    ];

    for (const t of jobTitles) {
        const fId = functionMap[t.func] || null;
        const sId = levelMap[t.level] || null;
        await pool.query(`
            INSERT INTO audience_job_titles (title, function_id, seniority_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE function_id=VALUES(function_id), seniority_id=VALUES(seniority_id)
        `, [t.title, fId, sId]);
    }
    console.log('✅ Searchable Dynamic Job Titles seeded');

    // 11. Aggregated Audience Statistics (Multi-Dimensional Cube totaling 78,000,000 contacts)
    await pool.query('DELETE FROM audience_statistics');

    console.log('📊 Generating aggregated audience demographic combinations...');

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
                            regionId, countryId, indId, sizeId, deptId, funcId, lvlId,
                            contactCount, companyCount, 'Internal B2B Intelligence', 'September 2026', 'Published'
                        ]);

                        totalGeneratedContacts += contactCount;
                    }
                }
            }
        }
    }

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < batchRows.length; i += CHUNK_SIZE) {
        const chunk = batchRows.slice(i, i + CHUNK_SIZE);
        await pool.query(`
            INSERT INTO audience_statistics 
            (region_id, country_id, industry_id, employee_size_id, department_id, function_id, job_level_id, contact_count, company_count, data_source, effective_date, status)
            VALUES ?
        `, [chunk]);
    }

    console.log(`✅ Seeded ${batchRows.length} LinkedIn-aligned demographic combinations.`);
    console.log(`📊 Aggregated Total Contacts in Database: ~${totalGeneratedContacts.toLocaleString()}`);

    // Update global settings total
    await pool.query(`
        UPDATE audience_global_settings SET setting_value = ? WHERE setting_key = 'global_contacts_total'
    `, [String(totalGeneratedContacts)]);

    await pool.query(`
        INSERT INTO audience_audit_logs 
        (user_name, action, entity, entity_id, new_value)
        VALUES ('System', 'SCHEMA_SEED', 'audience_statistics', 'ALL', JSON_OBJECT('total_contacts', ?, 'records_count', ?))
    `, [totalGeneratedContacts, batchRows.length]);

    console.log('🎉 B2B Audience Intelligence LinkedIn-Aligned V2 Database successfully initialized!');
};

const run = async () => {
    try {
        const schemaPath = path.join(__dirname, '../database/audience_intelligence_schema.sql');
        console.log('📄 Executing schema definitions from:', schemaPath);
        await executeSqlFile(schemaPath);
        await seedData();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Error:', err);
        process.exit(1);
    }
};

run();
