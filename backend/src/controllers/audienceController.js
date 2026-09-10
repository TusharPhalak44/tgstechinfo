/**
 * B2B Audience Intelligence Public & Sales Analytics Controller
 * Handles aggregated demographic queries, high-speed multi-dimensional filtering,
 * share token generation, and sales presentation event tracking.
 */

const { pool } = require('../config/database');
const crypto = require('crypto');

// In-memory cache for static taxonomies and metadata (5 min TTL)
let metadataCache = null;
let metadataCacheExpiry = 0;

/**
 * Get all taxonomies, geography hierarchies, and global commercial settings
 */
exports.getMetadata = async (req, res, next) => {
    try {
        const now = Date.now();
        const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';
        if (!forceRefresh && metadataCache && now < metadataCacheExpiry) {
            return res.json({ success: true, data: metadataCache });
        }

        // Fetch all active taxonomies in parallel
        const [
            [regions],
            [geoGroups],
            [countries],
            [regionCountries],
            [groupCountries],
            [industries],
            [employeeSizes],
            [functions],
            [departments],
            [jobLevels],
            [jobTitles],
            [settingsRows]
        ] = await Promise.all([
            pool.query('SELECT id, name, code, region_type, parent_id, lat, lon, default_zoom, display_order FROM audience_geo_regions WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, description, display_order FROM audience_geo_groups WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, iso_code, iso_alpha2, iso_alpha3, numeric_code, continent, lat, lon, display_order FROM audience_countries WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'),
            pool.query('SELECT region_id, country_id FROM audience_geo_region_countries'),
            pool.query('SELECT geo_group_id, country_id FROM audience_geo_group_countries'),
            pool.query('SELECT id, name, code, parent_id, level, hierarchy_path, linkedin_industry_id, description, display_order FROM audience_industries WHERE is_active = TRUE ORDER BY level ASC, display_order ASC, name ASC'),
            pool.query('SELECT id, name, code, min_employees, max_employees, display_order FROM audience_employee_sizes WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, description, display_order FROM audience_functions WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, display_order FROM audience_departments WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, name, code, rank_order, display_order FROM audience_job_levels WHERE is_active = TRUE ORDER BY display_order ASC'),
            pool.query('SELECT id, title, function_id, seniority_id FROM audience_job_titles WHERE is_active = TRUE ORDER BY title ASC LIMIT 200'),
            pool.query('SELECT setting_key, setting_value, description FROM audience_global_settings')
        ]);

        // Build global settings map
        const settings = {};
        for (const row of settingsRows) {
            settings[row.setting_key] = row.setting_value;
        }

        // Map countries into regions
        const regionCountryMap = {};
        for (const rc of regionCountries) {
            if (!regionCountryMap[rc.region_id]) regionCountryMap[rc.region_id] = [];
            regionCountryMap[rc.region_id].push(rc.country_id);
        }

        const groupCountryMap = {};
        for (const gc of groupCountries) {
            if (!groupCountryMap[gc.geo_group_id]) groupCountryMap[gc.geo_group_id] = [];
            groupCountryMap[gc.geo_group_id].push(gc.country_id);
        }

        const enrichedRegions = regions.map(r => ({
            ...r,
            country_ids: regionCountryMap[r.id] || []
        }));

        const enrichedGeoGroups = geoGroups.map(g => ({
            ...g,
            country_ids: groupCountryMap[g.id] || []
        }));

        const metadata = {
            regions: enrichedRegions,
            geo_groups: enrichedGeoGroups,
            countries,
            industries,
            employee_sizes: employeeSizes,
            functions,
            departments,
            job_levels: jobLevels,
            job_titles: jobTitles,
            settings
        };

        metadataCache = metadata;
        metadataCacheExpiry = now + 5 * 60 * 1000; // 5 mins

        res.json({
            success: true,
            data: metadata
        });
    } catch (err) {
        next(err);
    }
};

// In-memory cache for aggregated statistics calculations (5 min TTL)
const statsCache = new Map();
const STATS_CACHE_TTL = 5 * 60 * 1000;

exports.clearStatsCache = () => {
    statsCache.clear();
};

/**
 * High-performance Dynamic Audience Filtering & Breakdown Calculation (LinkedIn V2 Aligned)
 */
exports.calculateAudienceStats = async (req, res, next) => {
    try {
        const filters = req.method === 'POST' ? req.body : req.query;

        // Helper to normalize input arrays
        const normalizeArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val.filter(Boolean);
            return String(val).split(',').map(s => s.trim()).filter(Boolean);
        };

        const regionCodes = normalizeArray(filters.region || filters.regions || filters.region_code);
        const geoGroupCodes = normalizeArray(filters.geo_group || filters.geo_groups || filters.group_code);
        const countryIsos = normalizeArray(filters.country || filters.countries || filters.iso_code);
        let industryCodes = normalizeArray(filters.industry || filters.industries || filters.industry_code);
        const employeeSizeCodes = normalizeArray(filters.employee_size || filters.employee_sizes || filters.size_code);
        const functionCodes = normalizeArray(filters.function || filters.functions || filters.function_code);
        const departmentCodes = normalizeArray(filters.department || filters.departments || filters.department_code);
        let jobLevelCodes = normalizeArray(filters.job_level || filters.job_levels || filters.level_code || filters.seniority);
        const jobTitleQuery = (filters.job_title || filters.title || '').trim();
        const exactIndustry = filters.exact_industry === true || filters.exact_industry === 'true';
        const seniorityPreset = (filters.seniority_preset || '').toUpperCase();

        // ── Fast In-Memory Cache Lookup ──
        const cacheKey = JSON.stringify({
            regionCodes, geoGroupCodes, countryIsos, industryCodes, employeeSizeCodes,
            functionCodes, departmentCodes, jobLevelCodes, jobTitleQuery, exactIndustry, seniorityPreset
        });

        const cached = statsCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < STATS_CACHE_TTL)) {
            return res.json({
                success: true,
                cached: true,
                filters: {
                    regions: regionCodes,
                    countries: countryIsos,
                    industries: industryCodes,
                    employee_sizes: employeeSizeCodes,
                    departments: departmentCodes,
                    job_levels: jobLevelCodes
                },
                data: cached.data
            });
        }

        // Resolve Seniority Presets
        if (seniorityPreset) {
            if (seniorityPreset === 'DIRECTOR+') {
                jobLevelCodes = [...new Set([...jobLevelCodes, 'DIRECTOR', 'VP', 'CXO', 'OWNER'])];
            } else if (seniorityPreset === 'VP+' || seniorityPreset === 'EXECUTIVE') {
                jobLevelCodes = [...new Set([...jobLevelCodes, 'VP', 'CXO', 'OWNER'])];
            } else if (seniorityPreset === 'MANAGER+') {
                jobLevelCodes = [...new Set([...jobLevelCodes, 'MANAGER', 'DIRECTOR', 'VP', 'CXO', 'OWNER'])];
            }
        }

        // Expand Parent Industry Selection to include Child Industries (LinkedIn behavior)
        if (industryCodes.length > 0 && !exactIndustry) {
            const [allIndustries] = await pool.query('SELECT id, code, parent_id FROM audience_industries');
            const industryMapByCode = {};
            const childrenMapByParentId = {};

            for (const ind of allIndustries) {
                industryMapByCode[ind.code] = ind;
                if (ind.parent_id) {
                    if (!childrenMapByParentId[ind.parent_id]) childrenMapByParentId[ind.parent_id] = [];
                    childrenMapByParentId[ind.parent_id].push(ind.code);
                }
            }

            const expandedCodes = new Set(industryCodes);
            for (const code of industryCodes) {
                const item = industryMapByCode[code];
                if (item) {
                    const children = childrenMapByParentId[item.id] || [];
                    for (const childCode of children) {
                        expandedCodes.add(childCode);
                    }
                }
            }
            industryCodes = Array.from(expandedCodes);
        }

        // Build WHERE clauses dynamically
        const whereClauses = ["s.status = 'Published'"];
        const params = [];

        // 1. Geography Filter
        if (countryIsos.length > 0) {
            const placeholders = countryIsos.map(() => '?').join(',');
            whereClauses.push(`c.iso_code IN (${placeholders})`);
            params.push(...countryIsos);
        } else if (geoGroupCodes.length > 0) {
            const placeholders = geoGroupCodes.map(() => '?').join(',');
            whereClauses.push(`c.id IN (SELECT gc.country_id FROM audience_geo_group_countries gc JOIN audience_geo_groups g ON gc.geo_group_id = g.id WHERE g.code IN (${placeholders}))`);
            params.push(...geoGroupCodes);
        } else if (regionCodes.length > 0 && !regionCodes.includes('GLOBAL')) {
            const placeholders = regionCodes.map(() => '?').join(',');
            whereClauses.push(`r.code IN (${placeholders})`);
            params.push(...regionCodes);
        }

        // 2. Industry Filter
        if (industryCodes.length > 0) {
            const placeholders = industryCodes.map(() => '?').join(',');
            whereClauses.push(`ind.code IN (${placeholders})`);
            params.push(...industryCodes);
        }

        // 3. Employee Size Filter
        if (employeeSizeCodes.length > 0) {
            const placeholders = employeeSizeCodes.map(() => '?').join(',');
            whereClauses.push(`sz.code IN (${placeholders})`);
            params.push(...employeeSizeCodes);
        }

        // 4. Function / Department Filter
        if (functionCodes.length > 0) {
            const placeholders = functionCodes.map(() => '?').join(',');
            whereClauses.push(`f.code IN (${placeholders})`);
            params.push(...functionCodes);
        } else if (departmentCodes.length > 0) {
            const placeholders = departmentCodes.map(() => '?').join(',');
            whereClauses.push(`dept.code IN (${placeholders})`);
            params.push(...departmentCodes);
        }

        // 5. Seniority Level Filter
        if (jobLevelCodes.length > 0) {
            const placeholders = jobLevelCodes.map(() => '?').join(',');
            whereClauses.push(`lvl.code IN (${placeholders})`);
            params.push(...jobLevelCodes);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Base JOIN structure
        const joinSql = `
            FROM audience_statistics s
            JOIN audience_geo_regions r ON s.region_id = r.id
            JOIN audience_countries c ON s.country_id = c.id
            JOIN audience_industries ind ON s.industry_id = ind.id
            JOIN audience_employee_sizes sz ON s.employee_size_id = sz.id
            JOIN audience_departments dept ON s.department_id = dept.id
            LEFT JOIN audience_functions f ON s.function_id = f.id
            JOIN audience_job_levels lvl ON s.job_level_id = lvl.id
        `;

        // 1. Calculate Totals
        const totalQuery = `
            SELECT 
                COALESCE(SUM(s.contact_count), 0) AS matching_contacts,
                COALESCE(SUM(s.company_count), 0) AS matching_companies,
                COUNT(DISTINCT s.country_id) AS matching_countries_count,
                COUNT(DISTINCT s.industry_id) AS matching_industries_count
            ${joinSql}
            ${whereSql}
        `;

        // 2. Country Breakdown
        const countryBreakdownQuery = `
            SELECT 
                c.id AS country_id,
                c.name AS country_name,
                c.iso_code,
                c.iso_alpha3 AS iso3_code,
                c.lat,
                c.lon,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY c.id, c.name, c.iso_code, c.iso_alpha3, c.lat, c.lon
            ORDER BY contact_count DESC
        `;

        // 3. Industry Breakdown
        const industryBreakdownQuery = `
            SELECT 
                ind.id AS industry_id,
                ind.name AS industry_name,
                ind.code AS industry_code,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY ind.id, ind.name, ind.code
            ORDER BY contact_count DESC
        `;

        // 4. Employee Size Breakdown
        const employeeSizeBreakdownQuery = `
            SELECT 
                sz.id AS size_id,
                sz.name AS size_name,
                sz.code AS size_code,
                sz.display_order,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY sz.id, sz.name, sz.code, sz.display_order
            ORDER BY sz.display_order ASC
        `;

        // 5. Department Breakdown
        const departmentBreakdownQuery = `
            SELECT 
                dept.id AS department_id,
                dept.name AS department_name,
                dept.code AS department_code,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY dept.id, dept.name, dept.code
            ORDER BY contact_count DESC
        `;

        // 6. Job Level Breakdown
        const jobLevelBreakdownQuery = `
            SELECT 
                lvl.id AS job_level_id,
                lvl.name AS job_level_name,
                lvl.code AS job_level_code,
                lvl.rank_order,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY lvl.id, lvl.name, lvl.code, lvl.rank_order
            ORDER BY lvl.rank_order ASC
        `;

        // 7. Region Breakdown
        const regionBreakdownQuery = `
            SELECT 
                r.id AS region_id,
                r.name AS region_name,
                r.code AS region_code,
                SUM(s.contact_count) AS contact_count,
                SUM(s.company_count) AS company_count
            ${joinSql}
            ${whereSql}
            GROUP BY r.id, r.name, r.code
            ORDER BY contact_count DESC
        `;

        // Execute all aggregations in parallel for maximum query speed
        const [
            [totalRows],
            [countryRows],
            [industryRows],
            [sizeRows],
            [deptRows],
            [levelRows],
            [regionRows]
        ] = await Promise.all([
            pool.query(totalQuery, params),
            pool.query(countryBreakdownQuery, params),
            pool.query(industryBreakdownQuery, params),
            pool.query(employeeSizeBreakdownQuery, params),
            pool.query(departmentBreakdownQuery, params),
            pool.query(jobLevelBreakdownQuery, params),
            pool.query(regionBreakdownQuery, params)
        ]);

        const matchingContacts = parseInt(totalRows[0]?.matching_contacts || 0, 10);
        const matchingCompanies = parseInt(totalRows[0]?.matching_companies || 0, 10);

        // Calculate percentage distribution for each dimension
        const calculatePct = (items) => {
            return items.map(item => ({
                ...item,
                contact_count: parseInt(item.contact_count || 0, 10),
                company_count: parseInt(item.company_count || 0, 10),
                percentage: matchingContacts > 0 
                    ? Number(((parseInt(item.contact_count || 0, 10) / matchingContacts) * 100).toFixed(1))
                    : 0
            }));
        };

        const privacyThreshold = 25;
        const isLimitedAudience = matchingContacts > 0 && matchingContacts < privacyThreshold;

        const responsePayload = {
            matching_contacts: matchingContacts,
            matching_companies: matchingCompanies,
            matching_countries_count: parseInt(totalRows[0]?.matching_countries_count || 0, 10),
            matching_industries_count: parseInt(totalRows[0]?.matching_industries_count || 0, 10),
            is_limited_audience: isLimitedAudience,
            privacy_threshold: privacyThreshold,
            region_breakdown: calculatePct(regionRows),
            country_breakdown: calculatePct(countryRows),
            industry_breakdown: calculatePct(industryRows),
            employee_size_breakdown: calculatePct(sizeRows),
            department_breakdown: calculatePct(deptRows),
            job_level_breakdown: calculatePct(levelRows),
            updated_at: new Date().toISOString()
        };

        // Cache response payload for fast subsequent queries
        statsCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
        if (statsCache.size > 200) {
            const firstKey = statsCache.keys().next().value;
            statsCache.delete(firstKey);
        }

        res.json({
            success: true,
            filters: {
                regions: regionCodes,
                countries: countryIsos,
                industries: industryCodes,
                employee_sizes: employeeSizeCodes,
                departments: departmentCodes,
                job_levels: jobLevelCodes
            },
            data: responsePayload
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Generate a secure read-only token for client presentation sharing
 */
exports.createShareToken = async (req, res, next) => {
    try {
        const { filters, title, client_name, total_contacts, total_companies, created_by_name } = req.body;
        const token = crypto.randomBytes(24).toString('hex');
        
        // 30 days expiration by default
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const creatorName = created_by_name ||
            (req.user ? ([req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || req.user.username || req.user.role) : null) ||
            'admin';

        const mergedFilters = {
            ...(filters || {}),
            created_by_name: creatorName
        };

        await pool.query(`
            INSERT INTO audience_share_tokens 
            (token, title, client_name, filters_json, total_matching_contacts, total_matching_companies, created_by, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            token,
            title || 'Target B2B Audience Intelligence',
            client_name || 'Valued Client',
            JSON.stringify(mergedFilters),
            total_contacts || 0,
            total_companies || 0,
            req.user?.id || null,
            expiresAt
        ]);

        res.json({
            success: true,
            data: {
                token,
                share_url: `/audience/view/${token}`,
                created_by_name: creatorName,
                expires_at: expiresAt
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get shared audience definition and live calculated breakdowns by token
 */
exports.getSharedAudience = async (req, res, next) => {
    try {
        const { token } = req.params;
        const [rows] = await pool.query(`
            SELECT id, token, title, client_name, filters_json, total_matching_contacts, total_matching_companies, created_by, expires_at, created_at
            FROM audience_share_tokens
            WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW())
        `, [token]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Audience link is invalid or has expired.'
            });
        }

        const record = rows[0];
        const filters = typeof record.filters_json === 'string' ? JSON.parse(record.filters_json) : (record.filters_json || {});
        const createdByName = filters.created_by_name || record.created_by_name || 'admin';

        res.json({
            success: true,
            data: {
                token: record.token,
                title: record.title,
                client_name: record.client_name,
                filters,
                created_by_name: createdByName,
                created_at: record.created_at
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Track Sales Demonstration Analytics Event
 */
exports.trackEvent = async (req, res, next) => {
    try {
        const { event_type, filters_applied, result_count, session_id } = req.body;
        if (!event_type) return res.status(400).json({ error: 'event_type is required' });

        await pool.query(`
            INSERT INTO audience_analytics_events (event_type, filters_applied, result_count, session_id)
            VALUES (?, ?, ?, ?)
        `, [
            event_type,
            JSON.stringify(filters_applied || {}),
            result_count || 0,
            session_id || null
        ]);

        res.json({ success: true });
    } catch (err) {
        // Silently handle analytics tracking failures to not block UI
        console.warn('Analytics event tracking error:', err.message);
        res.json({ success: false });
    }
};

// Invalidation helper for admin changes
exports.invalidateMetadataCache = () => {
    metadataCache = null;
    metadataCacheExpiry = 0;
};
