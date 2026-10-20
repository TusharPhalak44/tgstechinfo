/**
 * Admin B2B Audience Intelligence Management Controller
 * Handles global configuration, taxonomy CRUD, statistics management,
 * CSV/JSON data import with validation and dry-run, versioning, and audit logging.
 */

const { pool } = require('../config/database');
const { invalidateMetadataCache } = require('./audienceController');

// Helper to log audit events
const logAudit = async (req, action, entity, entityId, oldValue, newValue) => {
    try {
        const userId = req.user?.id || null;
        const userName = req.user?.name || req.user?.email || 'Admin User';
        const ip = req.ip || req.headers['x-forwarded-for'] || null;

        await pool.query(`
            INSERT INTO audience_audit_logs 
            (user_id, user_name, action, entity, entity_id, old_value, new_value, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            userName,
            action,
            entity,
            String(entityId || ''),
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ip
        ]);
    } catch (e) {
        console.warn('Failed to log audit event:', e.message);
    }
};

/**
 * Get All Global Settings
 */
exports.getGlobalSettings = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audience_global_settings ORDER BY id ASC');
        const [totalStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_combinations,
                SUM(contact_count) as total_contacts,
                SUM(company_count) as total_companies,
                COUNT(DISTINCT country_id) as active_countries,
                COUNT(DISTINCT industry_id) as active_industries
            FROM audience_statistics WHERE status = 'Published'
        `);

        res.json({
            success: true,
            data: {
                settings: rows,
                database_summary: totalStats[0] || {}
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update Global Setting
 */
exports.updateGlobalSettings = async (req, res, next) => {
    try {
        const { settings } = req.body; // Array of { key, value }
        if (!Array.isArray(settings)) {
            return res.status(400).json({ error: 'settings must be an array of key/value pairs' });
        }

        for (const s of settings) {
            const [[existing]] = await pool.query('SELECT * FROM audience_global_settings WHERE setting_key = ?', [s.key]);
            await pool.query(`
                INSERT INTO audience_global_settings (setting_key, setting_value, updated_by)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)
            `, [s.key, String(s.value), req.user?.id || null]);

            await logAudit(req, 'UPDATE_SETTING', 'audience_global_settings', s.key, existing, { value: s.value });
        }

        invalidateMetadataCache();

        res.json({
            success: true,
            message: 'Global audience settings updated successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get Full Admin Taxonomies (with associated record counts)
 */
exports.getAdminTaxonomies = async (req, res, next) => {
    try {
        const [
            [regions],
            [countries],
            [regionCountries],
            [industries],
            [employeeSizes],
            [departments],
            [jobLevels]
        ] = await Promise.all([
            pool.query('SELECT r.*, COUNT(s.id) as stats_count FROM audience_geo_regions r LEFT JOIN audience_statistics s ON s.region_id = r.id GROUP BY r.id ORDER BY r.display_order ASC'),
            pool.query('SELECT c.*, COUNT(s.id) as stats_count FROM audience_countries c LEFT JOIN audience_statistics s ON s.country_id = c.id GROUP BY c.id ORDER BY c.display_order ASC, c.name ASC'),
            pool.query('SELECT rc.*, r.name as region_name, c.name as country_name FROM audience_geo_region_countries rc JOIN audience_geo_regions r ON rc.region_id = r.id JOIN audience_countries c ON rc.country_id = c.id'),
            pool.query('SELECT ind.*, COUNT(s.id) as stats_count FROM audience_industries ind LEFT JOIN audience_statistics s ON s.industry_id = ind.id GROUP BY ind.id ORDER BY ind.display_order ASC'),
            pool.query('SELECT sz.*, COUNT(s.id) as stats_count FROM audience_employee_sizes sz LEFT JOIN audience_statistics s ON s.employee_size_id = sz.id GROUP BY sz.id ORDER BY sz.display_order ASC'),
            pool.query('SELECT d.*, COUNT(s.id) as stats_count FROM audience_departments d LEFT JOIN audience_statistics s ON s.department_id = d.id GROUP BY d.id ORDER BY d.display_order ASC'),
            pool.query('SELECT j.*, COUNT(s.id) as stats_count FROM audience_job_levels j LEFT JOIN audience_statistics s ON s.job_level_id = j.id GROUP BY j.id ORDER BY j.rank_order ASC')
        ]);

        res.json({
            success: true,
            data: {
                regions,
                countries,
                region_countries: regionCountries,
                industries,
                employee_sizes: employeeSizes,
                departments,
                job_levels: jobLevels
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Generic Taxonomy Item Upsert
 */
exports.upsertTaxonomyItem = async (req, res, next) => {
    try {
        const { type } = req.params; // regions, countries, industries, employee-sizes, departments, job-levels
        const { id, name, code, is_active, display_order, lat, lon, min_employees, max_employees, rank_order, region_ids, iso_code, iso3_code } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and Code are required' });
        }

        let table = '';
        if (type === 'regions') table = 'audience_geo_regions';
        else if (type === 'countries') table = 'audience_countries';
        else if (type === 'industries') table = 'audience_industries';
        else if (type === 'employee-sizes') table = 'audience_employee_sizes';
        else if (type === 'departments') table = 'audience_departments';
        else if (type === 'job-levels') table = 'audience_job_levels';
        else return res.status(400).json({ error: 'Invalid taxonomy type' });

        let insertedId = id;

        if (id) {
            // Update
            const [[existing]] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
            if (type === 'countries') {
                await pool.query(`
                    UPDATE audience_countries 
                    SET name=?, iso_code=?, iso_alpha3=?, lat=?, lon=?, is_active=?, display_order=?
                    WHERE id=?
                `, [name, iso_code || code, iso3_code || iso_alpha3 || null, lat || 0, lon || 0, is_active !== false, display_order || 0, id]);
            } else if (type === 'regions') {
                await pool.query(`
                    UPDATE audience_geo_regions 
                    SET name=?, code=?, lat=?, lon=?, is_active=?, display_order=?
                    WHERE id=?
                `, [name, code, lat || 0, lon || 0, is_active !== false, display_order || 0, id]);
            } else if (type === 'employee-sizes') {
                await pool.query(`
                    UPDATE audience_employee_sizes 
                    SET name=?, code=?, min_employees=?, max_employees=?, is_active=?, display_order=?
                    WHERE id=?
                `, [name, code, min_employees || 0, max_employees || null, is_active !== false, display_order || 0, id]);
            } else if (type === 'job-levels') {
                await pool.query(`
                    UPDATE audience_job_levels 
                    SET name=?, code=?, rank_order=?, is_active=?, display_order=?
                    WHERE id=?
                `, [name, code, rank_order || 0, is_active !== false, display_order || 0, id]);
            } else {
                await pool.query(`
                    UPDATE ${table} 
                    SET name=?, code=?, is_active=?, display_order=?
                    WHERE id=?
                `, [name, code, is_active !== false, display_order || 0, id]);
            }

            await logAudit(req, `UPDATE_${type.toUpperCase()}`, table, id, existing, req.body);
        } else {
            // Insert
            if (type === 'countries') {
                const [res] = await pool.query(`
                    INSERT INTO audience_countries (name, iso_code, iso_alpha3, lat, lon, is_active, display_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [name, iso_code || code, iso3_code || iso_alpha3 || null, lat || 0, lon || 0, is_active !== false, display_order || 0]);
                insertedId = res.insertId;
            } else if (type === 'regions') {
                const [res] = await pool.query(`
                    INSERT INTO audience_geo_regions (name, code, lat, lon, is_active, display_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [name, code, lat || 0, lon || 0, is_active !== false, display_order || 0]);
                insertedId = res.insertId;
            } else if (type === 'employee-sizes') {
                const [res] = await pool.query(`
                    INSERT INTO audience_employee_sizes (name, code, min_employees, max_employees, is_active, display_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [name, code, min_employees || 0, max_employees || null, is_active !== false, display_order || 0]);
                insertedId = res.insertId;
            } else if (type === 'job-levels') {
                const [res] = await pool.query(`
                    INSERT INTO audience_job_levels (name, code, rank_order, is_active, display_order)
                    VALUES (?, ?, ?, ?, ?)
                `, [name, code, rank_order || 0, is_active !== false, display_order || 0]);
                insertedId = res.insertId;
            } else {
                const [res] = await pool.query(`
                    INSERT INTO ${table} (name, code, is_active, display_order)
                    VALUES (?, ?, ?, ?)
                `, [name, code, is_active !== false, display_order || 0]);
                insertedId = res.insertId;
            }

            await logAudit(req, `CREATE_${type.toUpperCase()}`, table, insertedId, null, req.body);
        }

        // If country and region_ids are specified, update mapping
        if (type === 'countries' && Array.isArray(region_ids)) {
            await pool.query('DELETE FROM audience_geo_region_countries WHERE country_id = ?', [insertedId]);
            for (const rId of region_ids) {
                await pool.query(`
                    INSERT INTO audience_geo_region_countries (region_id, country_id)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE region_id=region_id
                `, [rId, insertedId]);
            }
        }

        invalidateMetadataCache();

        res.json({
            success: true,
            id: insertedId,
            message: `${type} item saved successfully`
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get Paginated List of Aggregated Statistics for Explorer / Editor
 */
exports.getStatisticsList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(100, parseInt(req.query.limit) || 25);
        const offset = (page - 1) * limit;

        const { region_id, country_id, industry_id, employee_size_id, department_id, job_level_id, search } = req.query;

        const whereClauses = ['1=1'];
        const params = [];

        if (region_id && region_id !== 'all') {
            whereClauses.push('s.region_id = ?');
            params.push(region_id);
        }
        if (country_id && country_id !== 'all') {
            if (!isNaN(Number(country_id))) {
                whereClauses.push('s.country_id = ?');
                params.push(Number(country_id));
            } else {
                whereClauses.push('(c.iso_code = ? OR c.name = ?)');
                params.push(country_id, country_id);
            }
        }
        if (industry_id && industry_id !== 'all') {
            if (!isNaN(Number(industry_id))) {
                whereClauses.push('s.industry_id = ?');
                params.push(Number(industry_id));
            } else {
                whereClauses.push('(ind.code = ? OR ind.name = ?)');
                params.push(industry_id, industry_id);
            }
        }
        if (employee_size_id && employee_size_id !== 'all') {
            if (!isNaN(Number(employee_size_id))) {
                whereClauses.push('s.employee_size_id = ?');
                params.push(Number(employee_size_id));
            } else {
                whereClauses.push('(sz.code = ? OR sz.name = ?)');
                params.push(employee_size_id, employee_size_id);
            }
        }
        if (department_id && department_id !== 'all') {
            if (!isNaN(Number(department_id))) {
                whereClauses.push('s.department_id = ?');
                params.push(Number(department_id));
            } else {
                whereClauses.push('(dept.code = ? OR dept.name = ?)');
                params.push(department_id, department_id);
            }
        }
        if (job_level_id && job_level_id !== 'all') {
            if (!isNaN(Number(job_level_id))) {
                whereClauses.push('s.job_level_id = ?');
                params.push(Number(job_level_id));
            } else {
                whereClauses.push('(lvl.code = ? OR lvl.name = ?)');
                params.push(job_level_id, job_level_id);
            }
        }

        if (search && search.trim()) {
            whereClauses.push('(r.name LIKE ? OR r.code LIKE ? OR c.name LIKE ? OR c.iso_code LIKE ? OR ind.name LIKE ? OR sz.name LIKE ? OR dept.name LIKE ? OR lvl.name LIKE ?)');
            const s = `%${search.trim()}%`;
            params.push(s, s, s, s, s, s, s, s);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM audience_statistics s
            JOIN audience_geo_regions r ON s.region_id = r.id
            JOIN audience_countries c ON s.country_id = c.id
            JOIN audience_industries ind ON s.industry_id = ind.id
            JOIN audience_employee_sizes sz ON s.employee_size_id = sz.id
            JOIN audience_departments dept ON s.department_id = dept.id
            JOIN audience_job_levels lvl ON s.job_level_id = lvl.id
            ${whereSql}
        `;

        const dataQuery = `
            SELECT 
                s.id,
                s.region_id,
                s.country_id,
                s.industry_id,
                s.employee_size_id,
                s.department_id,
                s.job_level_id,
                s.contact_count,
                s.company_count,
                s.data_source,
                s.effective_date,
                s.status,
                s.updated_at,
                r.name as region_name,
                r.code as region_code,
                c.name as country_name,
                c.iso_code as country_iso,
                ind.name as industry_name,
                sz.name as size_name,
                sz.code as size_code,
                dept.name as department_name,
                lvl.name as level_name
            FROM audience_statistics s
            JOIN audience_geo_regions r ON s.region_id = r.id
            JOIN audience_countries c ON s.country_id = c.id
            JOIN audience_industries ind ON s.industry_id = ind.id
            JOIN audience_employee_sizes sz ON s.employee_size_id = sz.id
            JOIN audience_departments dept ON s.department_id = dept.id
            JOIN audience_job_levels lvl ON s.job_level_id = lvl.id
            ${whereSql}
            ORDER BY s.id DESC
            LIMIT ? OFFSET ?
        `;

        const [[countRes], [rows]] = await Promise.all([
            pool.query(countQuery, params),
            pool.query(dataQuery, [...params, limit, offset])
        ]);

        res.json({
            success: true,
            data: {
                rows,
                pagination: {
                    total: countRes[0]?.total || 0,
                    page,
                    limit,
                    total_pages: Math.ceil((countRes[0]?.total || 0) / limit)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update Individual Statistic Count
 */
exports.updateStatisticRecord = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { contact_count, company_count, data_source, effective_date, status } = req.body;

        const [[existing]] = await pool.query('SELECT * FROM audience_statistics WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Record not found' });

        await pool.query(`
            UPDATE audience_statistics
            SET contact_count = ?, company_count = ?, data_source = COALESCE(?, data_source), effective_date = COALESCE(?, effective_date), status = COALESCE(?, status)
            WHERE id = ?
        `, [
            parseInt(contact_count, 10),
            parseInt(company_count || Math.round(contact_count / 3.4), 10),
            data_source || null,
            effective_date || null,
            status || null,
            id
        ]);

        await logAudit(req, 'UPDATE_STATISTIC', 'audience_statistics', id, existing, req.body);

        // Recalculate Global Database Total
        const [[newGlobalRow]] = await pool.query('SELECT SUM(contact_count) as total FROM audience_statistics WHERE status = "Published"');
        const newGlobalTotal = parseInt(newGlobalRow?.total || 0, 10);

        await pool.query(`
            UPDATE audience_global_settings 
            SET setting_value = ?, updated_by = ?
            WHERE setting_key = 'global_contacts_total'
        `, [String(newGlobalTotal), req.user?.id || null]);

        invalidateMetadataCache();

        res.json({
            success: true,
            message: 'Audience statistic updated successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Data Import Engine (Dry-Run Validation and Direct Batch Import)
 */
exports.importAudienceData = async (req, res, next) => {
    try {
        const { rows, dry_run = true, version_label = 'Import ' + new Date().toISOString().slice(0, 10), filename = 'manual_import.csv' } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No rows provided for import.' });
        }

        // Preload taxonomies for validation and name/code resolution
        const [
            [regions],
            [countries],
            [industries],
            [employeeSizes],
            [departments],
            [jobLevels],
            [[currentTotalRow]]
        ] = await Promise.all([
            pool.query('SELECT id, name, code FROM audience_geo_regions'),
            pool.query('SELECT id, name, iso_code, iso_alpha3 AS iso3_code FROM audience_countries'),
            pool.query('SELECT id, name, code FROM audience_industries'),
            pool.query('SELECT id, name, code FROM audience_employee_sizes'),
            pool.query('SELECT id, name, code FROM audience_departments'),
            pool.query('SELECT id, name, code FROM audience_job_levels'),
            pool.query('SELECT SUM(contact_count) as total FROM audience_statistics WHERE status = "Published"')
        ]);

        // Build lookup helpers
        const matchItem = (list, key, codeKey = 'code') => {
            const normalized = String(key || '').trim().toLowerCase();
            return list.find(item => 
                item.name.toLowerCase() === normalized ||
                item[codeKey]?.toLowerCase() === normalized ||
                (item.iso_code && item.iso_code.toLowerCase() === normalized) ||
                (item.iso3_code && item.iso3_code.toLowerCase() === normalized) ||
                (item.iso_alpha3 && item.iso_alpha3.toLowerCase() === normalized)
            );
        };

        const validationErrors = [];
        const validatedRecords = [];
        let rowIdx = 1;
        let newTotalAdded = 0;

        for (const row of rows) {
            rowIdx++;
            const issues = [];

            // 1. Resolve Country
            const countryMatch = matchItem(countries, row.country || row.country_code || row.iso_code, 'iso_code');
            if (!countryMatch) issues.push(`Unknown country: "${row.country || row.country_code}"`);

            // 2. Resolve Region (or fallback to country's region)
            let regionMatch = matchItem(regions, row.region || row.region_code);
            if (!regionMatch && countryMatch) {
                // Find mapped region
                const [[mapped]] = await pool.query('SELECT region_id FROM audience_geo_region_countries WHERE country_id = ? LIMIT 1', [countryMatch.id]);
                if (mapped) regionMatch = regions.find(r => r.id === mapped.region_id);
            }
            if (!regionMatch) regionMatch = regions[0]; // default Global

            // 3. Resolve Industry
            const industryMatch = matchItem(industries, row.industry || row.industry_code);
            if (!industryMatch) issues.push(`Unknown industry: "${row.industry || row.industry_code}"`);

            // 4. Resolve Employee Size
            const sizeMatch = matchItem(employeeSizes, row.employee_size || row.size_code || row.company_size);
            if (!sizeMatch) issues.push(`Unknown employee size: "${row.employee_size || row.size_code}"`);

            // 5. Resolve Department
            const deptMatch = matchItem(departments, row.department || row.department_code);
            if (!deptMatch) issues.push(`Unknown department: "${row.department || row.department_code}"`);

            // 6. Resolve Job Level
            const levelMatch = matchItem(jobLevels, row.job_level || row.level_code || row.seniority);
            if (!levelMatch) issues.push(`Unknown job level: "${row.job_level || row.level_code}"`);

            // 7. Validate Counts
            const contactCount = parseInt(row.contact_count || row.contacts || 0, 10);
            if (isNaN(contactCount) || contactCount < 0) {
                issues.push(`Invalid contact count: "${row.contact_count}"`);
            }

            const companyCount = parseInt(row.company_count || Math.round(contactCount / 3.4), 10);

            if (issues.length > 0) {
                validationErrors.push({ row_index: rowIdx, data: row, errors: issues });
            } else {
                validatedRecords.push({
                    region_id: regionMatch.id,
                    country_id: countryMatch.id,
                    industry_id: industryMatch.id,
                    employee_size_id: sizeMatch.id,
                    department_id: deptMatch.id,
                    job_level_id: levelMatch.id,
                    contact_count: contactCount,
                    company_count: companyCount,
                    data_source: row.data_source || 'CSV Import',
                    effective_date: row.effective_date || 'August 2026',
                    status: 'Published'
                });
                newTotalAdded += contactCount;
            }
        }

        if (dry_run) {
            return res.json({
                success: true,
                dry_run: true,
                total_rows: rows.length,
                valid_rows_count: validatedRecords.length,
                invalid_rows_count: validationErrors.length,
                validation_errors: validationErrors.slice(0, 50), // return top 50
                preview_records: validatedRecords.slice(0, 10),
                current_total_contacts: parseInt(currentTotalRow?.total || 0, 10),
                projected_added_contacts: newTotalAdded
            });
        }

        // Execute batch insert if not dry-run
        if (validationErrors.length > 0 && !req.body.ignore_errors) {
            return res.status(400).json({
                success: false,
                message: `Import failed with ${validationErrors.length} validation errors. Review and fix errors or set ignore_errors to true.`,
                validation_errors: validationErrors
            });
        }

        const batchValues = validatedRecords.map(r => [
            r.region_id, r.country_id, r.industry_id, r.employee_size_id, r.department_id, r.job_level_id,
            r.contact_count, r.company_count, r.data_source, r.effective_date, r.status
        ]);

        const CHUNK_SIZE = 1000;
        for (let i = 0; i < batchValues.length; i += CHUNK_SIZE) {
            const chunk = batchValues.slice(i, i + CHUNK_SIZE);
            await pool.query(`
                INSERT INTO audience_statistics 
                (region_id, country_id, industry_id, employee_size_id, department_id, job_level_id, contact_count, company_count, data_source, effective_date, status)
                VALUES ?
            `, [chunk]);
        }

        // Record import history
        const [[newTotalRow]] = await pool.query('SELECT SUM(contact_count) as total FROM audience_statistics WHERE status = "Published"');
        const [importRec] = await pool.query(`
            INSERT INTO audience_data_imports 
            (version_label, filename, uploaded_by, uploaded_by_name, records_processed, previous_total_contacts, new_total_contacts, status, validation_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Completed', ?)
        `, [
            version_label,
            filename,
            req.user?.id || null,
            req.user?.name || req.user?.email || 'Admin',
            validatedRecords.length,
            parseInt(currentTotalRow?.total || 0, 10),
            parseInt(newTotalRow?.total || 0, 10),
            JSON.stringify({ errors_count: validationErrors.length, imported_count: validatedRecords.length })
        ]);

        await logAudit(req, 'DATA_IMPORT', 'audience_statistics', importRec.insertId, null, {
            filename,
            records_count: validatedRecords.length,
            new_total: parseInt(newTotalRow?.total || 0, 10)
        });

        invalidateMetadataCache();

        res.json({
            success: true,
            dry_run: false,
            message: `Successfully imported ${validatedRecords.length} audience records!`,
            import_id: importRec.insertId,
            new_total_contacts: parseInt(newTotalRow?.total || 0, 10)
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get Audit Logs
 */
exports.getAuditLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const offset = (page - 1) * limit;

        const [[countRes], [rows]] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM audience_audit_logs'),
            pool.query('SELECT * FROM audience_audit_logs ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset])
        ]);

        res.json({
            success: true,
            data: {
                logs: rows,
                pagination: {
                    total: countRes[0]?.total || 0,
                    page,
                    limit,
                    total_pages: Math.ceil((countRes[0]?.total || 0) / limit)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get Data Import History
 */
exports.getImportHistory = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audience_data_imports ORDER BY id DESC LIMIT 50');
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Preview Proportional Volume Adjustment for Region / Scope
 */
exports.previewAudienceAdjustment = async (req, res, next) => {
    try {
        const { scope_type = 'REGION', scope_code: rawScopeCode, adjustment_mode = 'DELTA', delta_contacts = 0, target_total_contacts = 0 } = req.body;
        const scope_code = (rawScopeCode || '').trim().toUpperCase();

        if (!scope_code) {
            return res.status(400).json({ error: 'scope_code is required (e.g., APAC, EMEA, IN, GLOBAL)' });
        }

        // Build WHERE clause based on scope
        let scopeWhere = '';
        let scopeParams = [];
        let scopeName = scope_code;

        if (scope_type === 'GLOBAL' || scope_code === 'GLOBAL') {
            scopeWhere = "s.status = 'Published'";
            scopeName = 'Global Database';
        } else if (scope_type === 'REGION') {
            scopeWhere = "r.code = ? AND s.status = 'Published'";
            scopeParams = [scope_code];
            const [[rRow]] = await pool.query('SELECT name FROM audience_geo_regions WHERE code = ?', [scope_code]);
            if (rRow) scopeName = `${rRow.name} (${scope_code})`;
        } else if (scope_type === 'GEO_GROUP') {
            scopeWhere = "s.country_id IN (SELECT gc.country_id FROM audience_geo_group_countries gc JOIN audience_geo_groups g ON gc.geo_group_id = g.id WHERE g.code = ?) AND s.status = 'Published'";
            scopeParams = [scope_code];
            const [[gRow]] = await pool.query('SELECT name FROM audience_geo_groups WHERE code = ?', [scope_code]);
            if (gRow) scopeName = `${gRow.name} (${scope_code})`;
        } else if (scope_type === 'COUNTRY') {
            scopeWhere = "c.iso_code = ? AND s.status = 'Published'";
            scopeParams = [scope_code];
            const [[cRow]] = await pool.query('SELECT name FROM audience_countries WHERE iso_code = ?', [scope_code]);
            if (cRow) scopeName = `${cRow.name} (${scope_code})`;
        } else {
            return res.status(400).json({ error: 'Invalid scope_type' });
        }

        const joinSql = `
            FROM audience_statistics s
            JOIN audience_geo_regions r ON s.region_id = r.id
            JOIN audience_countries c ON s.country_id = c.id
        `;

        // 1. Get current baseline for scope
        const [[scopeTotals]] = await pool.query(`
            SELECT 
                COALESCE(SUM(s.contact_count), 0) AS current_contacts,
                COALESCE(SUM(s.company_count), 0) AS current_companies,
                COUNT(s.id) AS records_count
            ${joinSql}
            WHERE ${scopeWhere}
        `, scopeParams);

        // 2. Get global total baseline
        const [[globalTotals]] = await pool.query(`
            SELECT COALESCE(SUM(contact_count), 0) AS current_global_total
            FROM audience_statistics WHERE status = 'Published'
        `);

        const currentScopeTotal = parseInt(scopeTotals?.current_contacts || 0, 10);
        const currentGlobalTotal = parseInt(globalTotals?.current_global_total || 0, 10);

        if (currentScopeTotal <= 0) {
            return res.status(400).json({ error: `No active records found for scope "${scope_code}"` });
        }

        // Calculate target scope total and delta
        let delta = 0;
        let targetScopeTotal = 0;

        if (adjustment_mode === 'DELTA') {
            delta = parseInt(delta_contacts || 0, 10);
            targetScopeTotal = Math.max(0, currentScopeTotal + delta);
        } else {
            targetScopeTotal = Math.max(0, parseInt(target_total_contacts || 0, 10));
            delta = targetScopeTotal - currentScopeTotal;
        }

        const ratio = currentScopeTotal > 0 ? (targetScopeTotal / currentScopeTotal) : 1.0;
        const projectedGlobalTotal = currentGlobalTotal + delta;

        // 3. Country-by-country breakdown within scope
        const [countryBreakdown] = await pool.query(`
            SELECT 
                c.id AS country_id,
                c.name AS country_name,
                c.iso_code,
                SUM(s.contact_count) AS current_country_contacts,
                SUM(s.company_count) AS current_country_companies
            ${joinSql}
            WHERE ${scopeWhere}
            GROUP BY c.id, c.name, c.iso_code
            ORDER BY current_country_contacts DESC
        `, scopeParams);

        const countryPreview = countryBreakdown.map(c => {
            const currentCount = parseInt(c.current_country_contacts || 0, 10);
            const currentCompany = parseInt(c.current_country_companies || 0, 10);
            const weightPct = currentScopeTotal > 0 ? ((currentCount / currentScopeTotal) * 100) : 0;
            const countryDelta = Math.round(delta * (weightPct / 100));
            const projectedCount = Math.max(0, Math.round(currentCount * ratio));

            return {
                country_id: c.country_id,
                country_name: c.country_name,
                iso_code: c.iso_code,
                current_contacts: currentCount,
                current_companies: currentCompany,
                weight_percentage: Number(weightPct.toFixed(2)),
                added_delta: countryDelta,
                projected_contacts: projectedCount,
                projected_companies: Math.max(0, Math.round(currentCompany * ratio))
            };
        });

        res.json({
            success: true,
            data: {
                scope_type,
                scope_code,
                scope_name: scopeName,
                adjustment_mode,
                baseline_scope_contacts: currentScopeTotal,
                delta_applied: delta,
                target_scope_contacts: targetScopeTotal,
                proportional_ratio: Number(ratio.toFixed(6)),
                records_to_update: parseInt(scopeTotals?.records_count || 0, 10),
                current_global_total: currentGlobalTotal,
                projected_global_total: projectedGlobalTotal,
                country_breakdown: countryPreview
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Execute Proportional Volume Adjustment for Region / Scope
 */
exports.adjustAudienceVolume = async (req, res, next) => {
    try {
        const { scope_type = 'REGION', scope_code: rawScopeCode, adjustment_mode = 'DELTA', delta_contacts = 0, target_total_contacts = 0, notes } = req.body;
        const scope_code = (rawScopeCode || '').trim().toUpperCase();

        if (!scope_code) {
            return res.status(400).json({ error: 'scope_code is required' });
        }

        // Build WHERE clause based on scope
        let scopeWhere = '';
        let scopeParams = [];
        let scopeName = scope_code;

        if (scope_type === 'GLOBAL' || scope_code === 'GLOBAL') {
            scopeWhere = "status = 'Published'";
            scopeName = 'Global Database';
        } else if (scope_type === 'REGION') {
            scopeWhere = "region_id = (SELECT id FROM audience_geo_regions WHERE code = ?) AND status = 'Published'";
            scopeParams = [scope_code];
            const [[rRow]] = await pool.query('SELECT name FROM audience_geo_regions WHERE code = ?', [scope_code]);
            if (rRow) scopeName = `${rRow.name} (${scope_code})`;
        } else if (scope_type === 'GEO_GROUP') {
            scopeWhere = "country_id IN (SELECT gc.country_id FROM audience_geo_group_countries gc JOIN audience_geo_groups g ON gc.geo_group_id = g.id WHERE g.code = ?) AND status = 'Published'";
            scopeParams = [scope_code];
            const [[gRow]] = await pool.query('SELECT name FROM audience_geo_groups WHERE code = ?', [scope_code]);
            if (gRow) scopeName = `${gRow.name} (${scope_code})`;
        } else if (scope_type === 'COUNTRY') {
            scopeWhere = "country_id = (SELECT id FROM audience_countries WHERE iso_code = ?) AND status = 'Published'";
            scopeParams = [scope_code];
            const [[cRow]] = await pool.query('SELECT name FROM audience_countries WHERE iso_code = ?', [scope_code]);
            if (cRow) scopeName = `${cRow.name} (${scope_code})`;
        } else {
            return res.status(400).json({ error: 'Invalid scope_type' });
        }

        // 1. Get baseline scope totals
        const [[currentScopeRow]] = await pool.query(`
            SELECT COALESCE(SUM(contact_count), 0) AS total_contacts, COUNT(*) AS records_count 
            FROM audience_statistics 
            WHERE ${scopeWhere}
        `, scopeParams);

        const currentScopeTotal = parseInt(currentScopeRow?.total_contacts || 0, 10);
        const recordsCount = parseInt(currentScopeRow?.records_count || 0, 10);

        if (currentScopeTotal <= 0) {
            return res.status(400).json({ error: `No records found to adjust for scope "${scope_code}"` });
        }

        // Calculate target scope total and delta
        let delta = 0;
        let targetScopeTotal = 0;

        if (adjustment_mode === 'DELTA') {
            delta = parseInt(delta_contacts || 0, 10);
            targetScopeTotal = Math.max(0, currentScopeTotal + delta);
        } else {
            targetScopeTotal = Math.max(0, parseInt(target_total_contacts || 0, 10));
            delta = targetScopeTotal - currentScopeTotal;
        }

        const ratio = currentScopeTotal > 0 ? (targetScopeTotal / currentScopeTotal) : 1.0;

        // 2. Perform Proportional Bulk Update in MySQL
        await pool.query(`
            UPDATE audience_statistics 
            SET contact_count = GREATEST(1, ROUND(contact_count * ?)),
                company_count = GREATEST(1, ROUND(company_count * ?))
            WHERE ${scopeWhere}
        `, [ratio, ratio, ...scopeParams]);

        // 3. Recalculate Global Database Total
        const [[newGlobalRow]] = await pool.query('SELECT SUM(contact_count) as total FROM audience_statistics WHERE status = "Published"');
        const newGlobalTotal = parseInt(newGlobalRow?.total || 0, 10);

        // 4. Update Global Settings
        await pool.query(`
            UPDATE audience_global_settings 
            SET setting_value = ?, updated_by = ?
            WHERE setting_key = 'global_contacts_total'
        `, [String(newGlobalTotal), req.user?.id || null]);

        // 5. Record History & Audit Log
        await pool.query(`
            INSERT INTO audience_adjustment_history
            (scope_type, scope_id, scope_name, adjustment_type, delta_applied, previous_total, new_total, records_affected, performed_by, performed_by_name, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            scope_type,
            scope_code,
            scopeName,
            adjustment_mode,
            delta,
            currentScopeTotal,
            targetScopeTotal,
            recordsCount,
            req.user?.id || null,
            req.user?.name || req.user?.email || 'Admin',
            JSON.stringify({ ratio: Number(ratio.toFixed(6)), notes: notes || '' })
        ]);

        await logAudit(req, 'PROPORTIONAL_ADJUSTMENT', 'audience_statistics', scope_code, { previous_scope_total: currentScopeTotal }, { new_scope_total: targetScopeTotal, delta, new_global_total: newGlobalTotal });

        invalidateMetadataCache();

        res.json({
            success: true,
            message: `Proportional volume adjustment applied! ${scopeName} updated from ${currentScopeTotal.toLocaleString()} to ${targetScopeTotal.toLocaleString()} contacts.`,
            data: {
                scope_code,
                scope_name: scopeName,
                delta_applied: delta,
                previous_scope_total: currentScopeTotal,
                new_scope_total: targetScopeTotal,
                new_global_total: newGlobalTotal,
                records_affected: recordsCount
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get Proportional Adjustment History
 */
exports.getAdjustmentHistory = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audience_adjustment_history ORDER BY id DESC LIMIT 50');
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get Data Quality & Coverage Matrix Report
 */
exports.getDataQualityReport = async (req, res, next) => {
    try {
        const [
            [totalStats],
            [indCoverage],
            [funcCoverage],
            [sizeCoverage],
            [levelCoverage],
            [geoCoverage]
        ] = await Promise.all([
            pool.query('SELECT SUM(contact_count) as total_contacts, COUNT(*) as total_records FROM audience_statistics WHERE status = "Published"'),
            pool.query(`
                SELECT 
                    SUM(CASE WHEN ind.code != 'UNCLASSIFIED' THEN s.contact_count ELSE 0 END) as classified_contacts,
                    SUM(CASE WHEN ind.code = 'UNCLASSIFIED' THEN s.contact_count ELSE 0 END) as unclassified_contacts
                FROM audience_statistics s JOIN audience_industries ind ON s.industry_id = ind.id WHERE s.status = 'Published'
            `),
            pool.query(`
                SELECT 
                    SUM(CASE WHEN s.function_id IS NOT NULL THEN s.contact_count ELSE 0 END) as classified_contacts,
                    SUM(CASE WHEN s.function_id IS NULL THEN s.contact_count ELSE 0 END) as unclassified_contacts
                FROM audience_statistics s WHERE s.status = 'Published'
            `),
            pool.query(`
                SELECT 
                    SUM(CASE WHEN sz.code IS NOT NULL THEN s.contact_count ELSE 0 END) as classified_contacts
                FROM audience_statistics s JOIN audience_employee_sizes sz ON s.employee_size_id = sz.id WHERE s.status = 'Published'
            `),
            pool.query(`
                SELECT 
                    SUM(CASE WHEN lvl.code IS NOT NULL THEN s.contact_count ELSE 0 END) as classified_contacts
                FROM audience_statistics s JOIN audience_job_levels lvl ON s.job_level_id = lvl.id WHERE s.status = 'Published'
            `),
            pool.query(`
                SELECT 
                    SUM(CASE WHEN c.iso_code IS NOT NULL THEN s.contact_count ELSE 0 END) as classified_contacts
                FROM audience_statistics s JOIN audience_countries c ON s.country_id = c.id WHERE s.status = 'Published'
            `)
        ]);

        const totalContacts = parseInt(totalStats[0]?.total_contacts || 0, 10);

        const calcMetric = (classified, unclassified = 0) => {
            const cls = parseInt(classified || 0, 10);
            const uncls = parseInt(unclassified || 0, 10);
            const pct = totalContacts > 0 ? Number(((cls / totalContacts) * 100).toFixed(2)) : 0;
            return {
                classified_contacts: cls,
                unclassified_contacts: uncls,
                coverage_percentage: pct
            };
        };

        res.json({
            success: true,
            data: {
                total_contacts: totalContacts,
                total_indexed_records: parseInt(totalStats[0]?.total_records || 0, 10),
                dimensions: {
                    geography: calcMetric(geoCoverage[0]?.classified_contacts),
                    industry_linkedin_v2: calcMetric(indCoverage[0]?.classified_contacts, indCoverage[0]?.unclassified_contacts),
                    linkedin_functions: calcMetric(funcCoverage[0]?.classified_contacts, funcCoverage[0]?.unclassified_contacts),
                    company_headcount: calcMetric(sizeCoverage[0]?.classified_contacts),
                    seniority_levels: calcMetric(levelCoverage[0]?.classified_contacts)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

