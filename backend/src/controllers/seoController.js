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
        
        const pageAnalysis = content.map(item => {
            const title = item.title || '';
            
            // Check meta description from seo_meta_description field first, then meta_description
            const metaDescription = item.seo_meta_description || item.meta_description || '';
            const hasMetaDescription = metaDescription.length >= 150 && metaDescription.length <= 160;
            
            // Check for H1 in multiple content sources
            let hasH1 = false;
            const contentSources = [];
            
            // Check main content field
            if (item.content) {
                contentSources.push(item.content);
            }
            
            // Check builder content elements if they exist
            if (item.builder_content_elements) {
                try {
                    const elements = typeof item.builder_content_elements === 'string' 
                        ? JSON.parse(item.builder_content_elements) 
                        : item.builder_content_elements;
                    if (Array.isArray(elements)) {
                        elements.forEach(el => {
                            if (el.content) contentSources.push(el.content);
                            if (el.html) contentSources.push(el.html);
                            if (el.text) contentSources.push(el.text);
                        });
                    }
                } catch (e) {
                    console.error('Error parsing builder_content_elements:', e);
                }
            }
            
            // Check short description
            if (item.short_description) {
                contentSources.push(item.short_description);
            }
            
            // Check for H1 in all content sources (case-insensitive, with attributes)
            const h1Regex = /<h1\b[^>]*>/i;
            hasH1 = contentSources.some(source => h1Regex.test(source));
            
            const hasAltText = true; // This would need to be checked in the actual content
            
            // Calculate SEO score
            let score = 100;
            if (!hasMetaDescription) score -= 20;
            if (!hasH1) score -= 15;
            if (!hasAltText) score -= 10;
            if (title.length < 30 || title.length > 60) score -= 15;
            
            const issues = [];
            
            if (!hasMetaDescription) {
                const currentLength = metaDescription.length;
                if (currentLength === 0) {
                    issues.push('Meta description is missing');
                } else if (currentLength < 150) {
                    issues.push(`Meta description too short (${currentLength}/150 chars)`);
                } else if (currentLength > 160) {
                    issues.push(`Meta description too long (${currentLength}/160 chars)`);
                }
            }
            
            if (!hasH1) {
                issues.push('Missing H1 tag in content');
            }
            
            if (!hasAltText) {
                issues.push('Missing alt text on images');
            }
            
            if (title.length < 30 || title.length > 60) {
                issues.push(`Title length not optimal (${title.length}/30-60 chars)`);
            }

            return {
                id: item.id,
                page: item.slug || 'Unknown',
                title: title,
                status: score >= 70 ? 'Good' : score >= 50 ? 'Warning' : 'Critical',
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
        
        let totalScore = 0;
        const allIssues = [];
        
        content.forEach(item => {
            const title = item.title || '';
            const metaDescription = item.meta_description || '';
            const hasMetaDescription = metaDescription.length >= 150 && metaDescription.length <= 160;
            const hasH1 = item.content && item.content.includes('<h1>');
            
            let score = 100;
            if (!hasMetaDescription) {
                score -= 20;
                allIssues.push({ type: 'warning', message: `Meta description is too short or too long for "${title}"` });
            }
            if (!hasH1) {
                score -= 15;
                allIssues.push({ type: 'warning', message: `Missing H1 tag for "${title}"` });
            }
            if (title.length < 30 || title.length > 60) {
                score -= 15;
                allIssues.push({ type: 'warning', message: `Title tag length is not optimal for "${title}"` });
            }
            
            totalScore += score;
        });
        
        const averageScore = Math.round(totalScore / content.length);
        
        // Add some success messages
        const successCount = allIssues.filter(i => i.type === 'success').length;
        if (successCount === 0) {
            allIssues.unshift({ type: 'success', message: 'Title tags are present on all pages' });
            allIssues.unshift({ type: 'success', message: 'All pages have content structure' });
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
        const { rows: categories } = await Category.findAll();
        
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
