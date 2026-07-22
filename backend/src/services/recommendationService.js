const { pool } = require('../config/database');

class RecommendationService {
    /**
     * Get related content based on multiple factors
     * Priority: Same Category > Same Tags > Same Author > Most Viewed > Recently Published > Editor's Choice
     */
    static async getRelatedContent(contentId, options = {}) {
        const {
            limit = 5,
            excludeId = contentId
        } = options;

        // Get the source content details
        const [sourceContent] = await pool.query(`
            SELECT c.category_id, c.tags, c.user_id, c.content_type_id, c.published_date, c.builder_layout
            FROM contents c
            WHERE c.id = ? AND c.status = 'published'
        `, [contentId]);

        if (!sourceContent.length) {
            return [];
        }

        const source = sourceContent[0];
        const sourceTags = sourceContent.tags ? (typeof sourceContent.tags === 'string' ? JSON.parse(sourceContent.tags) : sourceContent.tags) : [];
        const tagArray = Array.isArray(sourceTags) ? sourceTags : [];

        // Build recommendation candidates with scores
        const candidates = [];

        // Priority 1: Same Category (highest weight)
        if (source.category_id) {
            const [sameCategory] = await pool.query(`
                SELECT 
                    c.id, c.title, c.slug, c.short_description, c.banner_image,
                    c.view_count, c.published_date, c.category_id, c.tags, c.user_id, c.builder_layout,
                    ct.name as content_type_name, ct.slug as content_type_slug,
                    cat.name as category_name, cat.slug as category_slug,
                    100 as score, 'same_category' as reason
                FROM contents c
                LEFT JOIN content_types ct ON c.content_type_id = ct.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE c.category_id = ? 
                AND c.id != ? 
                AND c.status = 'published'
                ORDER BY c.published_date DESC
                LIMIT 10
            `, [source.category_id, excludeId]);

            candidates.push(...sameCategory.map(c => ({ ...c, score: 100 })));
        }

        // Priority 2: Same Tags
        if (tagArray.length > 0) {
            const tagConditions = tagArray.map(() => 'c.tags LIKE ?').join(' OR ');
            const tagParams = tagArray.map(tag => `%${tag}%`);

            const [sameTags] = await pool.query(`
                SELECT 
                    c.id, c.title, c.slug, c.short_description, c.banner_image,
                    c.view_count, c.published_date, c.category_id, c.tags, c.user_id, c.builder_layout,
                    ct.name as content_type_name, ct.slug as content_type_slug,
                    cat.name as category_name, cat.slug as category_slug,
                    80 as score, 'same_tags' as reason
                FROM contents c
                LEFT JOIN content_types ct ON c.content_type_id = ct.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE (${tagConditions})
                AND c.id != ? 
                AND c.status = 'published'
                ORDER BY c.published_date DESC
                LIMIT 10
            `, [...tagParams, excludeId]);

            // Add tag match count to score
            sameTags.forEach(c => {
                const contentTags = c.tags ? (typeof c.tags === 'string' ? JSON.parse(c.tags) : c.tags) : [];
                const contentTagArray = Array.isArray(contentTags) ? contentTags : [];
                const matchCount = tagArray.filter(tag => contentTagArray.includes(tag)).length;
                c.score = 80 + (matchCount * 5);
            });

            candidates.push(...sameTags);
        }

        // Priority 3: Same Author
        if (source.user_id) {
            const [sameAuthor] = await pool.query(`
                SELECT 
                    c.id, c.title, c.slug, c.short_description, c.banner_image,
                    c.view_count, c.published_date, c.category_id, c.tags, c.user_id, c.builder_layout,
                    ct.name as content_type_name, ct.slug as content_type_slug,
                    cat.name as category_name, cat.slug as category_slug,
                    60 as score, 'same_author' as reason
                FROM contents c
                LEFT JOIN content_types ct ON c.content_type_id = ct.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE c.user_id = ? 
                AND c.id != ? 
                AND c.status = 'published'
                ORDER BY c.published_date DESC
                LIMIT 10
            `, [source.user_id, excludeId]);

            candidates.push(...sameAuthor.map(c => ({ ...c, score: 60 })));
        }

        // Priority 4: Most Viewed
        const [mostViewed] = await pool.query(`
            SELECT 
                c.id, c.title, c.slug, c.short_description, c.banner_image,
                c.view_count, c.published_date, c.category_id, c.tags, c.user_id, c.builder_layout,
                ct.name as content_type_name, ct.slug as content_type_slug,
                cat.name as category_name, cat.slug as category_slug,
                40 as score, 'most_viewed' as reason
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id != ? 
            AND c.status = 'published'
            ORDER BY c.view_count DESC
            LIMIT 10
        `, [excludeId]);

        candidates.push(...mostViewed.map(c => ({ ...c, score: 40 })));

        // Priority 5: Recently Published
        const [recentlyPublished] = await pool.query(`
            SELECT 
                c.id, c.title, c.slug, c.short_description, c.banner_image,
                c.view_count, c.published_date, c.category_id, c.tags, c.user_id, c.builder_layout,
                ct.name as content_type_name, ct.slug as content_type_slug,
                cat.name as category_name, cat.slug as category_slug,
                30 as score, 'recently_published' as reason
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id != ? 
            AND c.status = 'published'
            ORDER BY c.published_date DESC
            LIMIT 10
        `, [excludeId]);

        candidates.push(...recentlyPublished.map(c => ({ ...c, score: 30 })));

        // Priority 6: Editor's Choice (if you have an editor's choice flag, otherwise skip)
        // Assuming you might add an 'editors_choice' boolean field to contents table
        const [editorsChoice] = await pool.query(`
            SELECT 
                c.id, c.title, c.slug, c.short_description, c.banner_image,
                c.view_count, c.published_date, c.category_id, c.tags, c.user_id, c.builder_layout,
                ct.name as content_type_name, ct.slug as content_type_slug,
                cat.name as category_name, cat.slug as category_slug,
                50 as score, 'editors_choice' as reason
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id != ? 
            AND c.status = 'published'
            ORDER BY c.published_date DESC
            LIMIT 10
        `, [excludeId]);

        candidates.push(...editorsChoice.map(c => ({ ...c, score: 50 })));

        // Deduplicate and sort by score
        const uniqueCandidates = this.deduplicateCandidates(candidates);
        const sortedCandidates = uniqueCandidates.sort((a, b) => b.score - a.score);

        // Return top results
        return sortedCandidates.slice(0, limit).map(c => this.formatResult(c));
    }

    /**
     * Get recommendations based on search query when no results found
     */
    static async getNoResultSuggestions(query, options = {}) {
        const { limit = 5 } = options;
        const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 2);

        if (searchTerms.length === 0) {
            // Return most viewed content as fallback
            return this.getMostViewed(limit);
        }

        const candidates = [];

        // Try to find content with partial matches
        for (const term of searchTerms) {
            const [partialMatches] = await pool.query(`
                SELECT 
                    c.id, c.title, c.slug, c.short_description, c.banner_image,
                    c.view_count, c.published_date,
                    ct.name as content_type_name, ct.slug as content_type_slug,
                    cat.name as category_name, cat.slug as category_slug,
                    LEAST(
                        CASE WHEN c.title LIKE ? THEN 50 ELSE 0 END,
                        CASE WHEN c.short_description LIKE ? THEN 30 ELSE 0 END,
                        CASE WHEN c.tags LIKE ? THEN 40 ELSE 0 END
                    ) as score
                FROM contents c
                LEFT JOIN content_types ct ON c.content_type_id = ct.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE c.status = 'published'
                AND (c.title LIKE ? OR c.short_description LIKE ? OR c.tags LIKE ?)
                ORDER BY score DESC, c.view_count DESC
                LIMIT 5
            `, [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`]);

            candidates.push(...partialMatches);
        }

        // If still no candidates, return most viewed
        if (candidates.length === 0) {
            return this.getMostViewed(limit);
        }

        // Deduplicate and return
        const uniqueCandidates = this.deduplicateCandidates(candidates);
        return uniqueCandidates.slice(0, limit).map(c => this.formatResult(c));
    }

    /**
     * Get most viewed content
     */
    static async getMostViewed(limit = 5) {
        const [results] = await pool.query(`
            SELECT 
                c.id, c.title, c.slug, c.short_description, c.banner_image,
                c.view_count, c.published_date, c.builder_layout,
                ct.name as content_type_name, ct.slug as content_type_slug,
                cat.name as category_name, cat.slug as category_slug
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.status = 'published'
            ORDER BY c.view_count DESC
            LIMIT ?
        `, [limit]);

        return results.map(c => this.formatResult(c));
    }

    /**
     * Deduplicate candidates by ID, keeping highest score
     */
    static deduplicateCandidates(candidates) {
        const candidateMap = new Map();

        for (const candidate of candidates) {
            const existing = candidateMap.get(candidate.id);
            if (!existing || candidate.score > existing.score) {
                candidateMap.set(candidate.id, candidate);
            }
        }

        return Array.from(candidateMap.values());
    }

    /**
     * Format result for API response
     */
    static formatResult(result) {
        const { score, reason, ...formattedResult } = result;
        
        const contentType = formattedResult.content_type_slug || 'article';
        
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
            tags: formattedResult.tags,
            recommendation_reason: reason || null
        };
    }
}

module.exports = RecommendationService;
