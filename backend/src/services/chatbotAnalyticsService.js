const { pool } = require('../config/database');

class ChatbotAnalyticsService {
    /**
     * Get search analytics
     */
    static async getSearchAnalytics(options = {}) {
        const { startDate, endDate, limit = 50 } = options;

        let dateFilter = '';
        const params = [limit];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                query,
                search_type,
                COUNT(*) as search_count,
                AVG(results_count) as avg_results,
                COUNT(DISTINCT session_id) as unique_sessions,
                SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as no_result_count
            FROM chatbot_search_logs
            WHERE 1=1
            ${dateFilter}
            GROUP BY query, search_type
            ORDER BY search_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get search analytics error:', error);
            throw new Error('Failed to get search analytics');
        }
    }

    /**
     * Get click analytics
     */
    static async getClickAnalytics(options = {}) {
        const { startDate, endDate, limit = 50 } = options;

        let dateFilter = '';
        const params = [limit];

        if (startDate && endDate) {
            dateFilter = ' AND ccl.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                ccl.content_id,
                c.title,
                c.slug,
                ccl.search_query,
                COUNT(*) as click_count,
                AVG(ccl.position_in_results) as avg_position,
                COUNT(DISTINCT ccl.session_id) as unique_clickers
            FROM chatbot_click_logs ccl
            JOIN contents c ON ccl.content_id = c.id
            WHERE 1=1
            ${dateFilter}
            GROUP BY ccl.content_id, c.title, c.slug, ccl.search_query
            ORDER BY click_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get click analytics error:', error);
            throw new Error('Failed to get click analytics');
        }
    }

    /**
     * Get trending analytics
     */
    static async getTrendingAnalytics(options = {}) {
        const { limit = 20 } = options;

        const query = `
            SELECT 
                ctc.content_id,
                c.title,
                c.slug,
                ctc.search_count,
                ctc.click_count,
                ctc.trend_score,
                cat.name as category_name,
                ct.name as content_type_name,
                ctc.last_calculated
            FROM chatbot_trending_cache ctc
            JOIN contents c ON ctc.content_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            ORDER BY ctc.trend_score DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Get trending analytics error:', error);
            throw new Error('Failed to get trending analytics');
        }
    }

    /**
     * Get feedback analytics
     */
    static async getFeedbackAnalytics(options = {}) {
        const { startDate, endDate } = options;

        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                feedback_type,
                COUNT(*) as feedback_count,
                AVG(rating) as avg_rating,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM chatbot_feedback
            WHERE 1=1
            ${dateFilter}
            GROUP BY feedback_type
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get feedback analytics error:', error);
            throw new Error('Failed to get feedback analytics');
        }
    }

    /**
     * Get session analytics
     */
    static async getSessionAnalytics(options = {}) {
        const { startDate, endDate } = options;

        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT visitor_session_id) as unique_visitors,
                AVG(message_count) as avg_messages,
                AVG(TIMESTAMPDIFF(MINUTE, created_at, last_activity)) as avg_session_minutes,
                COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_sessions,
                COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_sessions
            FROM chatbot_sessions
            WHERE 1=1
            ${dateFilter}
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows[0];
        } catch (error) {
            console.error('Get session analytics error:', error);
            throw new Error('Failed to get session analytics');
        }
    }

    /**
     * Get top searches
     */
    static async getTopSearches(options = {}) {
        const { startDate, endDate, limit = 10 } = options;

        let dateFilter = '';
        const params = [limit];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                query,
                COUNT(*) as search_count,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM chatbot_search_logs
            WHERE 1=1
            ${dateFilter}
            GROUP BY query
            ORDER BY search_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get top searches error:', error);
            throw new Error('Failed to get top searches');
        }
    }

    /**
     * Get top categories
     */
    static async getTopCategories(options = {}) {
        const { startDate, endDate, limit = 10 } = options;

        let dateFilter = '';
        const params = [limit];

        if (startDate && endDate) {
            dateFilter = ' AND csl.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                cat.name as category_name,
                cat.slug as category_slug,
                COUNT(*) as search_count
            FROM chatbot_search_logs csl
            JOIN contents c ON csl.query LIKE CONCAT('%', c.title, '%')
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE 1=1
            ${dateFilter}
            AND cat.id IS NOT NULL
            GROUP BY cat.id, cat.name, cat.slug
            ORDER BY search_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get top categories error:', error);
            throw new Error('Failed to get top categories');
        }
    }

    /**
     * Get most clicked content
     */
    static async getMostClickedContent(options = {}) {
        const { startDate, endDate, limit = 10 } = options;

        let dateFilter = '';
        const params = [limit];

        if (startDate && endDate) {
            dateFilter = ' AND ccl.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                COUNT(*) as click_count,
                COUNT(DISTINCT ccl.session_id) as unique_clickers,
                cat.name as category_name
            FROM chatbot_click_logs ccl
            JOIN contents c ON ccl.content_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE 1=1
            ${dateFilter}
            GROUP BY c.id, c.title, c.slug, cat.name
            ORDER BY click_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get most clicked content error:', error);
            throw new Error('Failed to get most clicked content');
        }
    }

    /**
     * Get no result searches
     */
    static async getNoResultSearches(options = {}) {
        const { startDate, endDate, limit = 10 } = options;

        let dateFilter = '';
        const params = [limit];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                query,
                COUNT(*) as no_result_count,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM chatbot_search_logs
            WHERE results_count = 0
            ${dateFilter}
            GROUP BY query
            ORDER BY no_result_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Get no result searches error:', error);
            throw new Error('Failed to get no result searches');
        }
    }

    /**
     * Get average session time
     */
    static async getAverageSessionTime(options = {}) {
        const { startDate, endDate } = options;

        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                AVG(TIMESTAMPDIFF(MINUTE, created_at, last_activity)) as avg_session_minutes,
                MIN(TIMESTAMPDIFF(MINUTE, created_at, last_activity)) as min_session_minutes,
                MAX(TIMESTAMPDIFF(MINUTE, created_at, last_activity)) as max_session_minutes
            FROM chatbot_sessions
            WHERE last_activity IS NOT NULL
            ${dateFilter}
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows[0];
        } catch (error) {
            console.error('Get average session time error:', error);
            throw new Error('Failed to get average session time');
        }
    }

    /**
     * Get click-through rate (CTR)
     */
    static async getCTR(options = {}) {
        const { startDate, endDate } = options;

        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' AND csl.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT 
                COUNT(DISTINCT csl.id) as total_searches,
                COUNT(DISTINCT ccl.id) as total_clicks,
                (COUNT(DISTINCT ccl.id) * 100.0 / NULLIF(COUNT(DISTINCT csl.id), 0)) as ctr_percentage
            FROM chatbot_search_logs csl
            LEFT JOIN chatbot_click_logs ccl ON csl.session_id = ccl.session_id
            WHERE 1=1
            ${dateFilter}
        `;

        try {
            const [rows] = await pool.query(query, params);
            return rows[0];
        } catch (error) {
            console.error('Get CTR error:', error);
            throw new Error('Failed to get CTR');
        }
    }

    /**
     * Get daily analytics
     */
    static async getDailyAnalytics(options = {}) {
        const { startDate, endDate, days = 30 } = options;

        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_searches,
                COUNT(DISTINCT session_id) as unique_sessions,
                SUM(results_count) as total_results,
                SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as no_result_count
            FROM chatbot_search_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, [days, days]);
            return rows;
        } catch (error) {
            console.error('Get daily analytics error:', error);
            throw new Error('Failed to get daily analytics');
        }
    }

    /**
     * Get monthly analytics
     */
    static async getMonthlyAnalytics(options = {}) {
        const { months = 12 } = options;

        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as total_searches,
                COUNT(DISTINCT session_id) as unique_sessions,
                SUM(results_count) as total_results,
                SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as no_result_count
            FROM chatbot_search_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, [months, months]);
            return rows;
        } catch (error) {
            console.error('Get monthly analytics error:', error);
            throw new Error('Failed to get monthly analytics');
        }
    }

    /**
     * Get comprehensive dashboard analytics
     */
    static async getDashboardAnalytics(options = {}) {
        const { startDate, endDate } = options;

        try {
            const [
                topSearches,
                topCategories,
                mostClicked,
                noResultSearches,
                sessionStats,
                avgSessionTime,
                ctr,
                dailyAnalytics,
                monthlyAnalytics,
                feedbackAnalytics
            ] = await Promise.all([
                this.getTopSearches({ startDate, endDate, limit: 10 }),
                this.getTopCategories({ startDate, endDate, limit: 10 }),
                this.getMostClickedContent({ startDate, endDate, limit: 10 }),
                this.getNoResultSearches({ startDate, endDate, limit: 10 }),
                this.getSessionAnalytics({ startDate, endDate }),
                this.getAverageSessionTime({ startDate, endDate }),
                this.getCTR({ startDate, endDate }),
                this.getDailyAnalytics({ days: 30 }),
                this.getMonthlyAnalytics({ months: 12 }),
                this.getFeedbackAnalytics({ startDate, endDate })
            ]);

            return {
                summary: {
                    topSearches,
                    topCategories,
                    mostClicked,
                    noResultSearches,
                    sessionStats,
                    avgSessionTime,
                    ctr,
                    feedbackAnalytics
                },
                trends: {
                    daily: dailyAnalytics,
                    monthly: monthlyAnalytics
                }
            };
        } catch (error) {
            console.error('Get dashboard analytics error:', error);
            throw new Error('Failed to get dashboard analytics');
        }
    }
}

module.exports = ChatbotAnalyticsService;
