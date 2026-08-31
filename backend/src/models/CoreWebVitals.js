const { pool } = require('../config/database');

class CoreWebVitals {
    static async create(cwvData) {
        const {
            session_uuid,
            consent_uuid,
            lcp,
            fid,
            cls,
            ttfb,
            fcp,
            inp,
            dom_content_loaded_time,
            load_complete_time,
            total_resources,
            page_url,
            page_title,
            device_type,
            browser
        } = cwvData;

        const query = `
            INSERT INTO core_web_vitals (
                session_uuid, consent_uuid, lcp, fid, cls, ttfb, fcp, inp,
                dom_content_loaded_time, load_complete_time, total_resources,
                page_url, page_title, device_type, browser
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid, consent_uuid, lcp, fid, cls, ttfb, fcp, inp,
            dom_content_loaded_time, load_complete_time, total_resources,
            page_url, page_title, device_type, browser
        ];

        console.log('CoreWebVitals.create - Query:', query);
        console.log('CoreWebVitals.create - Values:', values);

        const [result] = await pool.query(query, values);
        console.log('CoreWebVitals.create - Insert result:', result);
        
        return await CoreWebVitals.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM core_web_vitals WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findBySession(session_uuid) {
        const query = 'SELECT * FROM core_web_vitals WHERE session_uuid = ? ORDER BY measured_at DESC';
        const [rows] = await pool.query(query, [session_uuid]);
        return rows;
    }

    static async getAggregatedMetrics(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND DATE(measured_at) >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND DATE(measured_at) <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                AVG(lcp) as avg_lcp,
                AVG(fid) as avg_fid,
                AVG(cls) as avg_cls,
                AVG(ttfb) as avg_ttfb,
                AVG(fcp) as avg_fcp,
                AVG(inp) as avg_inp,
                AVG(dom_content_loaded_time) as avg_dom_content_loaded,
                AVG(load_complete_time) as avg_load_complete,
                COUNT(*) as total_measurements
            FROM core_web_vitals
            ${baseWhere}
        `;

        console.log('CoreWebVitals.getAggregatedMetrics - Query:', query);
        console.log('CoreWebVitals.getAggregatedMetrics - Values:', values);

        const [rows] = await pool.query(query, values);
        console.log('CoreWebVitals.getAggregatedMetrics - Result:', rows[0]);
        return rows[0];
    }

    static async getMetricsByPage(filters = {}, limit = 10) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND DATE(measured_at) >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND DATE(measured_at) <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                page_url,
                page_title,
                AVG(lcp) as avg_lcp,
                AVG(fid) as avg_fid,
                AVG(cls) as avg_cls,
                AVG(ttfb) as avg_ttfb,
                AVG(fcp) as avg_fcp,
                AVG(inp) as avg_inp,
                COUNT(*) as measurement_count
            FROM core_web_vitals
            ${baseWhere}
            GROUP BY page_url, page_title
            ORDER BY measurement_count DESC
            LIMIT ?
        `;

        values.push(limit);
        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = CoreWebVitals;
