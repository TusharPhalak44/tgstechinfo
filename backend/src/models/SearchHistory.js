const { pool } = require('../config/database');

class SearchHistory {
    static async create(searchData) {
        const {
            session_uuid,
            consent_uuid,
            search_keyword,
            search_type,
            results_count,
            selected_result_id,
            selected_result_title,
            search_time_ms
        } = searchData;

        const query = `
            INSERT INTO search_history (
                session_uuid, consent_uuid, search_keyword, search_type,
                results_count, selected_result_id, selected_result_title, search_time_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid, consent_uuid, search_keyword, search_type,
            results_count, selected_result_id, selected_result_title, search_time_ms
        ];

        const [result] = await pool.query(query, values);
        return await SearchHistory.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM search_history WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findBySession(session_uuid) {
        const query = 'SELECT * FROM search_history WHERE session_uuid = ? ORDER BY created_at DESC';
        const [rows] = await pool.query(query, [session_uuid]);
        return rows;
    }

    static async getPopularSearches(limit = 10, filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND created_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND created_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                search_keyword,
                search_type,
                COUNT(*) as search_count,
                AVG(results_count) as avg_results,
                SUM(CASE WHEN selected_result_id IS NOT NULL THEN 1 ELSE 0 END) as click_count
            FROM search_history
            ${baseWhere}
            GROUP BY search_keyword, search_type
            ORDER BY search_count DESC
            LIMIT ?
        `;

        values.push(limit);
        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async getSearchAnalytics(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND created_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND created_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                COUNT(*) as total_searches,
                COUNT(DISTINCT session_uuid) as unique_searchers,
                AVG(results_count) as avg_results,
                AVG(search_time_ms) as avg_search_time,
                SUM(CASE WHEN selected_result_id IS NOT NULL THEN 1 ELSE 0 END) as total_clicks,
                search_type
            FROM search_history
            ${baseWhere}
            GROUP BY search_type
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = SearchHistory;
