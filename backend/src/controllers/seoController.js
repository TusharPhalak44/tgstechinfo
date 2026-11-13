const Content = require('../models/Content');
const Category = require('../models/Category');
const SiteSettings = require('../models/SiteSettings');
const SitemapService = require('../services/sitemapService');

// Get SEO settings
exports.getSeoSettings = async (req, res) => {
    try {
        // Get SEO settings from database
        const settings = await SiteSettings.getSettings();
        
        const seoSettings = {
            siteTitle: settings?.seo_site_title || 'TgsTechInfo - Technology Solutions',
            siteSeparator: settings?.seo_site_separator || ' - ',
            metaDescription: settings?.seo_meta_description || 'TgsTechInfo provides cutting-edge technology solutions for businesses. Discover our innovative services and products.',
            metaKeywords: settings?.seo_meta_keywords || 'technology, solutions, software, development',
            ogImage: settings?.seo_og_image || null,
        };
        
        res.json(seoSettings);
    } catch (error) {
        console.error('Get SEO settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update SEO settings
exports.updateSeoSettings = async (req, res) => {
    try {
        const { siteTitle, siteSeparator, metaDescription, metaKeywords, ogImage } = req.body;
        
        // Get current settings
        const currentSettings = await SiteSettings.getSettings();
        
        // Update SEO settings in database
        const updatedSettings = await SiteSettings.updateSettings({
            ...currentSettings,
            seo_site_title: siteTitle,
            seo_site_separator: siteSeparator,
            seo_meta_description: metaDescription,
            seo_meta_keywords: metaKeywords,
            seo_og_image: ogImage
        });
        
        res.json({ message: 'SEO settings updated successfully', settings: updatedSettings });
    } catch (error) {
        console.error('Update SEO settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get page SEO analysis
exports.getPageSeoAnalysis = async (req, res) => {
    try {
        // Get all published content
        const { rows: content } = await Content.findAll({ status: 'published' });

        // Use the same SEO calculation logic as CreateContent.jsx
        const calculateSEOScore = (title, description, content, tags, seoMetaTitle, seoMetaDescription, seoMetaKeywords) => {
            let score = 0;
            let maxScore = 100;
            let issues = [];

            // Title analysis (20 points)
            if (title && title.length >= 30 && title.length <= 60) {
                score += 20;
            } else if (title && title.length > 0) {
                score += 10;
                issues.push(title.length < 30 ? 'Title is too short (should be 30-60 characters)' : 'Title is too long (should be 30-60 characters)');
            } else {
                issues.push('Title is missing');
            }

            // Description analysis (15 points)
            if (description && description.length >= 120 && description.length <= 160) {
                score += 15;
            } else if (description && description.length > 0) {
                score += 8;
                issues.push(description.length < 120 ? 'Description is too short (should be 120-160 characters)' : 'Description is too long (should be 120-160 characters)');
            } else {
                issues.push('Description is missing');
            }

            // Content length analysis (25 points)
            const plainContent = content ? content.replace(/<[^>]*>/g, '').trim() : '';
            const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
            if (wordCount >= 300) {
                score += 25;
            } else if (wordCount >= 150) {
                score += 15;
                issues.push('Content is too short (should be at least 300 words)');
            } else {
                issues.push('Content is too short (should be at least 300 words)');
            }

            // Tags analysis (10 points)
            let parsedTags = [];
            if (tags) {
                try { parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch { parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []; }
            }
            if (parsedTags && parsedTags.length >= 3) {
                score += 10;
            } else if (parsedTags && parsedTags.length > 0) {
                score += 5;
                issues.push('Add more tags (should have at least 3 tags)');
            } else {
                issues.push('Tags are missing');
            }

            // SEO Meta Title analysis (15 points)
            if (seoMetaTitle && seoMetaTitle.length >= 30 && seoMetaTitle.length <= 60) {
                score += 15;
            } else if (seoMetaTitle && seoMetaTitle.length > 0) {
                score += 8;
                issues.push(seoMetaTitle.length < 30 ? 'SEO meta title is too short (should be 30-60 characters)' : 'SEO meta title is too long (should be 30-60 characters)');
            } else {
                issues.push('SEO meta title is missing');
            }

            // SEO Meta Description analysis (15 points)
            if (seoMetaDescription && seoMetaDescription.length >= 120 && seoMetaDescription.length <= 160) {
                score += 15;
            } else if (seoMetaDescription && seoMetaDescription.length > 0) {
                score += 8;
                issues.push(seoMetaDescription.length < 120 ? 'SEO meta description is too short (should be 120-160 characters)' : 'SEO meta description is too long (should be 120-160 characters)');
            } else {
                issues.push('SEO meta description is missing');
            }

            return {
                score: Math.round((score / maxScore) * 100),
                issues
            };
        };

        const pageAnalysis = content.map(item => {
            const { score, issues } = calculateSEOScore(
                item.title,
                item.short_description,
                item.content,
                item.tags,
                item.seo_meta_title,
                item.seo_meta_description,
                item.seo_meta_keywords
            );

            return {
                id: item.id,
                page: item.slug || 'Unknown',
                title: item.title || 'Unknown',
                status: score >= 80 ? 'Good' : score >= 60 ? 'Warning' : 'Critical',
                score: score,
                issues: issues,
            };
        });

        res.json(pageAnalysis);
    } catch (error) {
        console.error('Get page SEO analysis error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get overall SEO score
exports.getSeoScore = async (req, res) => {
    try {
        const { rows: content } = await Content.findAll({ status: 'published' });

        if (content.length === 0) {
            return res.json({ score: 0, issues: [] });
        }

        // Use the same SEO calculation logic as CreateContent.jsx
        const calculateSEOScore = (title, description, content, tags, seoMetaTitle, seoMetaDescription, seoMetaKeywords) => {
            let score = 0;
            let maxScore = 100;
            let issues = [];

            // Title analysis (20 points)
            if (title && title.length >= 30 && title.length <= 60) {
                score += 20;
            } else if (title && title.length > 0) {
                score += 10;
                issues.push(title.length < 30 ? 'Title is too short (should be 30-60 characters)' : 'Title is too long (should be 30-60 characters)');
            } else {
                issues.push('Title is missing');
            }

            // Description analysis (15 points)
            if (description && description.length >= 120 && description.length <= 160) {
                score += 15;
            } else if (description && description.length > 0) {
                score += 8;
                issues.push(description.length < 120 ? 'Description is too short (should be 120-160 characters)' : 'Description is too long (should be 120-160 characters)');
            } else {
                issues.push('Description is missing');
            }

            // Content length analysis (25 points)
            const plainContent = content ? content.replace(/<[^>]*>/g, '').trim() : '';
            const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
            if (wordCount >= 300) {
                score += 25;
            } else if (wordCount >= 150) {
                score += 15;
                issues.push('Content is too short (should be at least 300 words)');
            } else {
                issues.push('Content is too short (should be at least 300 words)');
            }

            // Tags analysis (10 points)
            let parsedTags = [];
            if (tags) {
                try { parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch { parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []; }
            }
            if (parsedTags && parsedTags.length >= 3) {
                score += 10;
            } else if (parsedTags && parsedTags.length > 0) {
                score += 5;
                issues.push('Add more tags (should have at least 3 tags)');
            } else {
                issues.push('Tags are missing');
            }

            // SEO Meta Title analysis (15 points)
            if (seoMetaTitle && seoMetaTitle.length >= 30 && seoMetaTitle.length <= 60) {
                score += 15;
            } else if (seoMetaTitle && seoMetaTitle.length > 0) {
                score += 8;
                issues.push(seoMetaTitle.length < 30 ? 'SEO meta title is too short (should be 30-60 characters)' : 'SEO meta title is too long (should be 30-60 characters)');
            } else {
                issues.push('SEO meta title is missing');
            }

            // SEO Meta Description analysis (15 points)
            if (seoMetaDescription && seoMetaDescription.length >= 120 && seoMetaDescription.length <= 160) {
                score += 15;
            } else if (seoMetaDescription && seoMetaDescription.length > 0) {
                score += 8;
                issues.push(seoMetaDescription.length < 120 ? 'SEO meta description is too short (should be 120-160 characters)' : 'SEO meta description is too long (should be 120-160 characters)');
            } else {
                issues.push('SEO meta description is missing');
            }

            return {
                score: Math.round((score / maxScore) * 100),
                issues
            };
        };

        let totalScore = 0;
        const allIssues = [];

        content.forEach(item => {
            const { score, issues } = calculateSEOScore(
                item.title,
                item.short_description,
                item.content,
                item.tags,
                item.seo_meta_title,
                item.seo_meta_description,
                item.seo_meta_keywords
            );

            totalScore += score;

            // Add issues with type
            issues.forEach(issue => {
                allIssues.push({ type: 'warning', message: `${issue} for "${item.title || 'Untitled'}"` });
            });
        });

        const averageScore = Math.round(totalScore / content.length);

        // Add some success messages
        if (allIssues.length === 0) {
            allIssues.unshift({ type: 'success', message: 'All content has excellent SEO scores' });
            allIssues.unshift({ type: 'success', message: 'All pages have proper meta tags' });
        } else {
            allIssues.unshift({ type: 'success', message: `${content.length} pages analyzed` });
        }

        res.json({
            score: averageScore,
            issues: allIssues.slice(0, 10), // Limit to 10 issues
        });
    } catch (error) {
        console.error('Get SEO score error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Generate sitemap dynamically with full content & page mapping
exports.generateSitemap = async (req, res) => {
    try {
        const force = req.query.force === '1' || req.query.refresh === '1';
        const { xml } = await SitemapService.getSitemapXml({ force });

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex');
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600');
        res.send(xml);
    } catch (error) {
        console.error('Generate sitemap error:', error);
        res.status(500).json({ message: 'Server error generating sitemap' });
    }
};

// Manually sync/regenerate sitemap file on disk and invalidate cache (Admin)
exports.syncSitemap = async (req, res) => {
    try {
        const result = await SitemapService.syncSitemapFile();
        SitemapService.invalidateCache();
        res.json({
            success: true,
            message: 'Sitemap generated and synced successfully',
            totalUrls: result.totalUrls,
            locationsWritten: result.writtenCount
        });
    } catch (error) {
        console.error('Sync sitemap error:', error);
        res.status(500).json({ success: false, message: 'Failed to sync sitemap' });
    }
};
