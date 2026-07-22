const { pool } = require('../config/database');

const CONTENT_TYPE_SLUG_MAP = {
    articles: 'article', article: 'article',
    blogs: 'blog', blog: 'blog',
    news: 'news',
    webinars: 'webinar', webinar: 'webinar',
    events: 'event', event: 'event',
    whitepapers: 'whitepaper', whitepaper: 'whitepaper', 'white-paper': 'whitepaper',
    ebooks: 'ebook', ebook: 'ebook',
    interviews: 'interview', interview: 'interview',
    reports: 'report', report: 'report'
};

const normalizeSlug = (slug) => CONTENT_TYPE_SLUG_MAP[String(slug || '').toLowerCase().trim()] || String(slug || 'article').toLowerCase().trim();

class ChatbotSearchService {
    /**
     * Search content with ranking logic
     * Priority: Exact Title > Slug > Tags > Category > Short Description > Content Body > Popularity > Latest Published
     */
    static async search(query, options = {}) {
        const {
            searchType = 'keyword',
            limit = 10,
            categoryId = null,
            contentTypeId = null,
            status = 'published'
        } = options;

        console.log('[ChatbotSearchService.search] Input query:', query);
        console.log('[ChatbotSearchService.search] Options:', { searchType, limit, categoryId, contentTypeId, status });

        const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length === 0) return [];

        console.log('[ChatbotSearchService.search] Search terms:', searchTerms);

        let results = [];
        const baseQuery = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.short_description,
                c.banner_image,
                c.view_count,
                c.published_date,
                c.created_at,
                c.tags,
                c.builder_layout,
                ct.name as content_type_name,
                ct.slug as content_type_slug,
                cat.name as category_name,
                cat.slug as category_slug,
                cat.id as category_id,
                ct.id as content_type_id
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.status = ?
        `;

        const params = [status];

        // Add category filter if provided
        if (categoryId) {
            params.push(categoryId);
        }

        // Add content type filter if provided
        if (contentTypeId) {
            params.push(contentTypeId);
        }

        // Build search conditions based on search type
        let searchConditions = '';
        const searchParams = [];

        switch (searchType) {
            case 'title':
                searchConditions = ` AND (c.title LIKE ?)`;
                searchParams.push(`%${query}%`);
                break;
            case 'category':
                searchConditions = ` AND (cat.name LIKE ? OR cat.slug LIKE ?)`;
                searchParams.push(`%${query}%`, `%${query}%`);
                break;
            case 'tag':
                searchConditions = ` AND (c.tags LIKE ?)`;
                searchParams.push(`%${query}%`);
                break;
            case 'content_type':
                searchConditions = ` AND (ct.name LIKE ? OR ct.slug LIKE ?)`;
                searchParams.push(`%${query}%`, `%${query}%`);
                break;
            case 'keyword':
            default:
                // keyword handled separately below
                break;
        }

        // For non-keyword types, run single query
        if (searchType !== 'keyword') {
            const finalQuery = baseQuery +
                (categoryId ? ' AND c.category_id = ?' : '') +
                (contentTypeId ? ' AND c.content_type_id = ?' : '') +
                searchConditions +
                ' ORDER BY c.published_date DESC LIMIT ?';
            params.push(...searchParams, limit);
            try {
                const [rows] = await pool.query(finalQuery, params);
                results = this.rankResults(rows, query, searchType);
                return results.map(row => this.formatResult(row));
            } catch (error) {
                console.error('Search error:', error);
                throw new Error('Search failed');
            }
        }

        // KEYWORD search: 3-pass strategy for accurate results
        const STOPWORDS = new Set(['the','a','an','of','to','for','in','on','at','by','is','are','was','were','and','or','but','with','from','as','into','about']);
        const meaningfulTerms = searchTerms.filter(t => t.length > 1 && !STOPWORDS.has(t.toLowerCase()));
        const termsToUse = meaningfulTerms.length > 0 ? meaningfulTerms : searchTerms;

        const fieldMatch = (term) => [
            `c.title LIKE ?`, `c.slug LIKE ?`, `c.tags LIKE ?`,
            `cat.name LIKE ?`, `ct.name LIKE ?`, `c.short_description LIKE ?`, `c.content LIKE ?`
        ].join(' OR ');

        // Improved title match for partial phrases
        const titleMatch = (term) => `c.title LIKE ?`;

        const baseFilter = (categoryId ? ' AND c.category_id = ?' : '') + (contentTypeId ? ' AND c.content_type_id = ?' : '');
        const fetchLimit = Math.max(limit * 5, 50); // fetch more, rank, then slice

        const runQuery = async (whereCondition, whereParams) => {
            const sql = baseQuery + baseFilter + whereCondition + ' ORDER BY c.view_count DESC, c.published_date DESC LIMIT ?';
            const [rows] = await pool.query(sql, [...params, ...whereParams, fetchLimit]);
            return rows;
        };

        try {
            console.log('[ChatbotSearchService.search] Starting Pass 1: Exact full phrase match');
            // Pass 1: exact full phrase match across all fields
            const phraseParams = Array(7).fill(`%${query}%`);
            let rows = await runQuery(` AND (${fieldMatch()})`, phraseParams);
            console.log('[ChatbotSearchService.search] Pass 1 results:', rows.length);

            // Pass 1.5: Title-only partial phrase match (for queries like "HR Software", "Cloud Migration")
            if (rows.length === 0) {
                console.log('[ChatbotSearchService.search] Starting Pass 1.5: Title-only partial phrase match');
                const titleParams = [`%${query}%`];
                rows = await runQuery(` AND (${titleMatch()})`, titleParams);
                console.log('[ChatbotSearchService.search] Pass 1.5 results:', rows.length);
            }

            // Pass 2: AND match — every meaningful term must appear somewhere
            if (rows.length === 0 && termsToUse.length > 1) {
                console.log('[ChatbotSearchService.search] Starting Pass 2: AND match');
                const andConditions = termsToUse.map(() => `(${fieldMatch()})`);
                const andParams = termsToUse.flatMap(t => Array(7).fill(`%${t}%`));
                rows = await runQuery(` AND (${andConditions.join(' AND ')})`, andParams);
                console.log('[ChatbotSearchService.search] Pass 2 results:', rows.length);
            }

            // Pass 3: OR fallback — any term matches
            if (rows.length === 0) {
                console.log('[ChatbotSearchService.search] Starting Pass 3: OR fallback');
                const orConditions = termsToUse.map(() => `(${fieldMatch()})`);
                const orParams = termsToUse.flatMap(t => Array(7).fill(`%${t}%`));
                rows = await runQuery(` AND (${orConditions.join(' OR ')})`, orParams);
                console.log('[ChatbotSearchService.search] Pass 3 results:', rows.length);
            }

            console.log('[ChatbotSearchService.search] Total rows before ranking:', rows.length);
            results = this.rankResults(rows, query, searchType);
            console.log('[ChatbotSearchService.search] Results after ranking:', results.length);
            const finalResults = results.slice(0, limit).map(row => this.formatResult(row));
            console.log('[ChatbotSearchService.search] Final results (limited):', finalResults.length);
            return finalResults;
        } catch (error) {
            console.error('[ChatbotSearchService.search] Search error:', error);
            throw new Error('Search failed');
        }
    }

    /**
     * Rank results based on priority
     * Priority: Exact Title > Content Type > Slug > Category > Tags > Description > Content Body > Popularity > Latest Published
     * Minimum relevance threshold: 15 points
     */
    static rankResults(results, query, searchType) {
        const queryLower = query.toLowerCase();
        const searchTerms = queryLower.split(/\s+/).filter(term => term.length > 0);
        const MIN_RELEVANCE_SCORE = 15;

        console.log('[ChatbotSearchService.rankResults] Ranking', results.length, 'results for query:', query);

        const rankedResults = results.map(result => {
            let score = 0;
            const titleLower = (result.title || '').toLowerCase();
            const slugLower = (result.slug || '').toLowerCase();
            const contentTypeLower = (result.content_type_slug || '').toLowerCase();
            const contentTypeNameLower = (result.content_type_name || '').toLowerCase();
            let tags = [];
            try { tags = result.tags ? (typeof result.tags === 'string' ? JSON.parse(result.tags) : result.tags) : []; } catch { tags = result.tags ? result.tags.split(',').map(t => t.trim()) : []; }
            const tagsString = Array.isArray(tags) ? tags.join(' ').toLowerCase() : String(tags).toLowerCase();
            const categoryLower = (result.category_name || '').toLowerCase();
            const shortDescLower = (result.short_description || '').toLowerCase();
            const contentLower = (result.content || '').toLowerCase();

            // Priority 1: Exact Title match (highest weight)
            if (titleLower === queryLower) {
                score += 100;
            } else if (titleLower.includes(queryLower)) {
                score += 50;
            }

            // Priority 1.5: Partial title phrase match (e.g., "HR Software" matches "How to Choose an HR Software System")
            if (searchTerms.length > 1) {
                const allTermsInTitle = searchTerms.every(term => titleLower.includes(term));
                if (allTermsInTitle) {
                    score += 45;
                }
            }

            // Priority 2: Content Type match (second highest)
            if (contentTypeLower === queryLower || contentTypeNameLower === queryLower) {
                score += 70;
            } else if (contentTypeLower.includes(queryLower) || contentTypeNameLower.includes(queryLower)) {
                score += 35;
            }

            // Priority 3: Slug match
            if (slugLower === queryLower) {
                score += 60;
            } else if (slugLower.includes(queryLower)) {
                score += 30;
            }

            // Priority 4: Category match
            if (categoryLower === queryLower) {
                score += 40;
            } else if (categoryLower.includes(queryLower)) {
                score += 20;
            }

            // Priority 5: Tags match
            if (tagsString.includes(queryLower)) {
                score += 25;
            }
            // Bonus for exact tag match
            if (tags.some(tag => tag.toLowerCase() === queryLower)) {
                score += 15;
            }

            // Priority 6: Short Description match
            if (shortDescLower.includes(queryLower)) {
                score += 10;
            }

            // Priority 7: Content Body match
            if (contentLower.includes(queryLower)) {
                score += 5;
            }

            // Priority 8: Popularity (view count)
            score += Math.min(result.view_count || 0, 15); // Cap at 15 points

            // Priority 9: Latest Published (more recent = higher score)
            if (result.published_date) {
                const daysSincePublished = (Date.now() - new Date(result.published_date)) / (1000 * 60 * 60 * 24);
                if (daysSincePublished < 7) score += 10;
                else if (daysSincePublished < 30) score += 7;
                else if (daysSincePublished < 90) score += 4;
            }

            // Bonus for multiple search term matches
            if (searchTerms.length > 1) {
                const matchedTerms = searchTerms.filter(term => 
                    titleLower.includes(term) ||
                    slugLower.includes(term) ||
                    contentTypeLower.includes(term) ||
                    contentTypeNameLower.includes(term) ||
                    tagsString.includes(term) ||
                    categoryLower.includes(term) ||
                    shortDescLower.includes(term) ||
                    contentLower.includes(term)
                );
                score += matchedTerms.length * 2;
            }

            return { ...result, _score: score };
        }).sort((a, b) => b._score - a._score); // Sort by score descending

        console.log('[ChatbotSearchService.rankResults] Ranked results:', rankedResults.length);
        console.log('[ChatbotSearchService.rankResults] Top 3 scores:', rankedResults.slice(0, 3).map(r => ({ title: r.title, score: r._score })));

        // Filter out results below minimum relevance threshold
        const filtered = rankedResults.filter(result => result._score >= MIN_RELEVANCE_SCORE);
        console.log('[ChatbotSearchService.rankResults] Results after threshold filter:', filtered.length);
        return filtered;
    }

    /**
     * Format result for API response
     */
    static formatResult(result) {
        const { _score, ...formattedResult } = result;
        
        const contentType = normalizeSlug(formattedResult.content_type_slug);
        
        return {
            id: formattedResult.id,
            title: formattedResult.title,
            slug: formattedResult.slug,
            category: formattedResult.category_name,
            category_slug: formattedResult.category_slug,
            content_type: formattedResult.content_type_name,
            content_type_slug: formattedResult.content_type_slug,
            banner_image: formattedResult.banner_image,
            short_description: formattedResult.short_description,
            url: `/${contentType}/${formattedResult.slug}`,
            published_date: formattedResult.published_date,
            view_count: formattedResult.view_count,
            tags: formattedResult.tags
        };
    }

    /**
     * Get trending content based on chatbot interactions
     */
    static async getTrending(limit = 10) {
        const query = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.short_description,
                c.banner_image,
                c.view_count,
                c.published_date,
                ct.name as content_type_name,
                ct.slug as content_type_slug,
                cat.name as category_name,
                cat.slug as category_slug,
                COALESCE(trend.trend_score, 0) as trend_score,
                COALESCE(trend.search_count, 0) as chatbot_search_count,
                COALESCE(trend.click_count, 0) as chatbot_click_count
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN chatbot_trending_cache trend ON c.id = trend.content_id
            WHERE c.status = 'published'
            ORDER BY 
                COALESCE(trend.trend_score, 0) DESC,
                c.view_count DESC,
                c.published_date DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, [limit]);
            return rows.map(row => this.formatResult(row));
        } catch (error) {
            console.error('Get trending error:', error);
            throw new Error('Failed to get trending content');
        }
    }

    /**
     * Get categories for chatbot
     */
    static async getCategories() {
        const query = `
            SELECT 
                id,
                name,
                slug,
                type
            FROM categories
            ORDER BY name ASC
        `;

        try {
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('Get categories error:', error);
            throw new Error('Failed to get categories');
        }
    }

    /**
     * Get recent content for chatbot
     */
    static async getRecent(limit = 10) {
        const query = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.short_description,
                c.banner_image,
                c.view_count,
                c.published_date,
                ct.name as content_type_name,
                ct.slug as content_type_slug,
                cat.name as category_name,
                cat.slug as category_slug
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.status = 'published'
            ORDER BY c.published_date DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(query, [limit]);
            return rows.map(row => this.formatResult(row));
        } catch (error) {
            console.error('Get recent error:', error);
            throw new Error('Failed to get recent content');
        }
    }

    /**
     * Log search to database
     */
    static async logSearch(sessionId, query, searchType, resultsCount, metadata = {}) {
        const insertQuery = `
            INSERT INTO chatbot_search_logs 
            (session_id, query, search_type, results_count, search_metadata, ip_address, country, device_type, browser_info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            await pool.query(insertQuery, [
                sessionId,
                query,
                searchType,
                resultsCount,
                JSON.stringify(metadata),
                metadata.ip_address || null,
                metadata.country || null,
                metadata.device_type || null,
                metadata.browser_info ? JSON.stringify(metadata.browser_info) : null
            ]);
        } catch (error) {
            console.error('Log search error:', error);
            // Don't throw error, logging should not break search
        }
    }

    /**
     * Log click to database
     */
    static async logClick(sessionId, contentId, searchQuery, searchType, position, metadata = {}) {
        const insertQuery = `
            INSERT INTO chatbot_click_logs 
            (session_id, content_id, search_query, search_type, position_in_results, click_metadata, ip_address, country, device_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            await pool.query(insertQuery, [
                sessionId,
                contentId,
                searchQuery,
                searchType,
                position,
                JSON.stringify(metadata),
                metadata.ip_address || null,
                metadata.country || null,
                metadata.device_type || null
            ]);

            // Update trending cache
            await this.updateTrendingCache(contentId);
        } catch (error) {
            console.error('Log click error:', error);
            // Don't throw error, logging should not break click
        }
    }

    /**
     * Update trending cache for a content item
     */
    static async updateTrendingCache(contentId) {
        try {
            // Get current stats
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(DISTINCT cs.id) as total_searches,
                    COUNT(DISTINCT ccl.id) as total_clicks
                FROM chatbot_search_logs cs
                LEFT JOIN chatbot_click_logs ccl ON cs.session_id = ccl.session_id AND ccl.content_id = ?
                WHERE cs.query IN (
                    SELECT query FROM chatbot_search_logs
                )
            `, [contentId]);

            const searchCount = stats[0].total_searches || 0;
            const clickCount = stats[0].total_clicks || 0;

            // Calculate trend score (clicks have higher weight)
            const trendScore = (searchCount * 1) + (clickCount * 5);

            // Get content details
            const [content] = await pool.query(`
                SELECT category_id, content_type_id FROM contents WHERE id = ?
            `, [contentId]);

            if (content.length > 0) {
                // Upsert into trending cache
                await pool.query(`
                    INSERT INTO chatbot_trending_cache 
                    (content_id, search_count, click_count, trend_score, category_id, content_type_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    search_count = VALUES(search_count),
                    click_count = VALUES(click_count),
                    trend_score = VALUES(trend_score),
                    last_calculated = CURRENT_TIMESTAMP
                `, [
                    contentId,
                    searchCount,
                    clickCount,
                    trendScore,
                    content[0].category_id,
                    content[0].content_type_id
                ]);
            }
        } catch (error) {
            console.error('Update trending cache error:', error);
            // Don't throw error, cache update should not break functionality
        }
    }

    /**
     * Autocomplete for search input
     * Returns matching titles as user types
     */
    static async autocomplete(query, options = {}) {
        const { limit = 5 } = options;

        if (!query || query.trim().length < 2) {
            return [];
        }

        const searchTerm = `%${query.trim()}%`;

        const queryStr = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.short_description,
                ct.name as content_type_name,
                ct.slug as content_type_slug,
                cat.name as category_name
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.status = 'published'
            AND c.title LIKE ?
            ORDER BY 
                CASE 
                    WHEN c.title LIKE ? THEN 1
                    ELSE 2
                END,
                c.view_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await pool.query(queryStr, [searchTerm, `${query.trim()}%`, limit]);
            return rows.map(row => {
                const contentType = normalizeSlug(row.content_type_slug);
                return {
                    id: row.id,
                    title: row.title,
                    slug: row.slug,
                    short_description: row.short_description,
                    content_type: row.content_type_name,
                    content_type_slug: row.content_type_slug,
                    category: row.category_name,
                    url: `/${contentType}/${row.slug}`
                };
            });
        } catch (error) {
            console.error('Autocomplete error:', error);
            throw new Error('Autocomplete failed');
        }
    }
}

module.exports = ChatbotSearchService;
