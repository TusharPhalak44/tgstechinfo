const Content = require('../models/Content');
const Category = require('../models/Category');
const SiteSettings = require('../models/SiteSettings');

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
            const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
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
            const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
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

// Generate sitemap
exports.generateSitemap = async (req, res) => {
    try {
        const { rows: content } = await Content.findAll({ status: 'published' });
        const categories = await Category.findAll();
        
        const baseUrl = process.env.BASE_URL || 'https://tgstechinfo.com';
        
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${categories.map(cat => `
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${content.map(item => `
  <url>
    <loc>${baseUrl}/${item.slug}</loc>
    <lastmod>${item.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;
        
        res.setHeader('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('Generate sitemap error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
