const Content = require('../models/Content');
const ContentType = require('../models/ContentType');
const Category = require('../models/Category');
const Media = require('../models/Media');

const User = require('../models/User');

const { validationResult } = require('express-validator');
const { sendEmail, accessGrantEmailTemplate, sendTemplatedEmail } = require('../config/email');
const { notifyAdmins } = require('./notificationController');
const logAudit = require('../utils/auditLogger');
const { updateTagUsage, decreaseTagUsage } = require('./tagsController');

// Replace em-dash (—) with hyphen (-) in any string or object
const stripEmDash = (val) => {
    if (typeof val === 'string') return val.replace(/—/g, '-');
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        const out = {};
        for (const k of Object.keys(val)) out[k] = stripEmDash(val[k]);
        return out;
    }
    return val;
};

exports.createContent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const contentData = stripEmDash({
            ...req.body,
            user_id: req.user.id,
            status: String(req.body.status || 'draft').trim(),
            banner_image: req.files?.banner_image?.[0]?.filename || null,
            pdf_file: req.files?.pdf_file?.[0]?.filename || null,
            tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            custom_fields: req.body.custom_fields ? JSON.parse(req.body.custom_fields) : null,
            webhook_field_mapping: req.body.webhook_field_mapping ? JSON.parse(req.body.webhook_field_mapping) : null,
            builder_layout: req.body.builder_layout || null,
            builder_content_elements: req.body.builder_content_elements ? (() => {
                try {
                    return JSON.parse(req.body.builder_content_elements);
                } catch (e) {
                    console.error('Error parsing builder_content_elements:', e);
                    return null;
                }
            })() : null,
            builder_page_data: req.body.builder_page_data ? (() => {
                try {
                    return typeof req.body.builder_page_data === 'string'
                        ? req.body.builder_page_data   // keep as JSON string — model handles it
                        : JSON.stringify(req.body.builder_page_data);
                } catch (e) {
                    console.error('Error processing builder_page_data:', e);
                    return null;
                }
            })() : null
        });

        // Log status value for debugging
        console.log('[createContent] Raw req.body.status:', req.body.status);
        console.log('[createContent] status value:', contentData.status, 'type:', typeof contentData.status, 'length:', contentData.status?.length);
        console.log('[createContent] status JSON:', JSON.stringify(contentData.status));
        console.log('[createContent] status char codes:', contentData.status ? Array.from(contentData.status).map(c => c.charCodeAt(0)) : 'null');

        const content = await Content.create(contentData);
        
        // Add banner image to media_files table if present and not already exists
        if (req.files?.banner_image?.[0]) {
            try {
                const bannerFile = req.files.banner_image[0];
                // Check if file with same original name already exists in media_files table
                const existingMedia = await Media.findByOriginalName(bannerFile.originalname);
                if (!existingMedia) {
                    const ext = bannerFile.filename.split('.').pop().toLowerCase();
                    const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'other';
                    const fileData = require('fs').readFileSync(bannerFile.path);
                    await Media.create({
                        filename: bannerFile.filename,
                        original_name: bannerFile.originalname,
                        file_path: `/uploads/${bannerFile.filename}`,
                        file_type: fileType,
                        file_size: bannerFile.size,
                        mime_type: bannerFile.mimetype,
                        folder: 'Images',
                        uploaded_by: req.user.id,
                        file_data: fileData
                    });
                    console.log('✓ Banner image added to media_files table:', bannerFile.filename);
                } else {
                    console.log('Banner image with same original name already exists in media_files table:', bannerFile.originalname);
                    // Use the existing file's filename for the content
                    req.body.banner_image = existingMedia.filename;
                }
            } catch (mediaError) {
                console.error('Error adding banner image to media_files:', mediaError);
            }
        } else {
            console.log('No banner image file found in req.files');
        }
        
        // Add PDF file to media_files table if present and not already exists
        if (req.files?.pdf_file?.[0]) {
            try {
                const pdfFile = req.files.pdf_file[0];
                // Check if file with same original name already exists in media_files table
                const existingMedia = await Media.findByOriginalName(pdfFile.originalname);
                if (!existingMedia) {
                    const fileData = require('fs').readFileSync(pdfFile.path);
                    await Media.create({
                        filename: pdfFile.filename,
                        original_name: pdfFile.originalname,
                        file_path: `/uploads/${pdfFile.filename}`,
                        file_type: 'document',
                        file_size: pdfFile.size,
                        mime_type: pdfFile.mimetype,
                        folder: 'Documents',
                        uploaded_by: req.user.id,
                        file_data: fileData
                    });
                    console.log('✓ PDF file added to media_files table:', pdfFile.filename);
                } else {
                    console.log('PDF file with same original name already exists in media_files table:', pdfFile.originalname);
                    // Use the existing file's filename for the content
                    req.body.pdf_file = existingMedia.filename;
                }
            } catch (mediaError) {
                console.error('Error adding PDF to media_files:', mediaError);
            }
        }
        
        // Update tag usage counts
        if (contentData.tags && contentData.tags.length > 0) {
            await updateTagUsage(contentData.tags);
        }

        // Log to audit logs
        await logAudit(req, 'create', 'content', content.id, `Created content: ${content.title}`, 'success');

        res.status(201).json({ message: 'Content created successfully', content });
    } catch (error) {
        console.error('Create content error:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body keys:', Object.keys(req.body));
        console.error('builder_content_elements value:', req.body.builder_content_elements);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

exports.getUserContentById = async (req, res) => {
    try {
        const { id } = req.params;
        const Content = require('../models/Content');
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });
        if (content.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json(content);
    } catch (error) {
        console.error('Get content by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserContent = async (req, res) => {
    try {
        const { status } = req.query;
        const filters = { user_id: req.user.id };
        if (status) filters.status = status;

        const { rows } = await Content.findAll(filters);
        res.json(rows);
    } catch (error) {
        console.error('Get user content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });
        if (content.user_id !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Access denied' });
        if (content.status === 'published')
            return res.status(400).json({ message: 'Published content cannot be edited' });

        let updateData = {};
        Object.keys(req.body).forEach(key => {
            updateData[key] = req.body[key];
        });
        
        // Ensure status is never empty/null - default to 'draft' if provided but empty
        if (updateData.status === '' || updateData.status === null || updateData.status === undefined) {
            updateData.status = 'draft';
        }
        
        if (req.files?.banner_image?.[0]) updateData.banner_image = req.files.banner_image[0].filename;
        if (req.files?.pdf_file?.[0]) updateData.pdf_file = req.files.pdf_file[0].filename;
        if (req.body.custom_fields) {
            try {
                updateData.custom_fields = typeof req.body.custom_fields === 'string'
                    ? JSON.parse(req.body.custom_fields)
                    : req.body.custom_fields;
            } catch (e) {
                console.error('Error parsing custom_fields on update:', e);
                updateData.custom_fields = [];
            }
        }
        if (req.body.webhook_field_mapping) {
            try {
                updateData.webhook_field_mapping = typeof req.body.webhook_field_mapping === 'string'
                    ? JSON.parse(req.body.webhook_field_mapping)
                    : req.body.webhook_field_mapping;
            } catch (e) {
                console.error('Error parsing webhook_field_mapping on update:', e);
                updateData.webhook_field_mapping = null;
            }
        }
        if (req.body.builder_content_elements !== undefined) {
            try {
                updateData.builder_content_elements = typeof req.body.builder_content_elements === 'string'
                    ? JSON.parse(req.body.builder_content_elements)
                    : req.body.builder_content_elements;
            } catch (e) {
                console.error('Error parsing builder_content_elements on update:', e);
                updateData.builder_content_elements = null;
            }
        }
        if (req.body.builder_page_data !== undefined) {
            try {
                updateData.builder_page_data = typeof req.body.builder_page_data === 'string'
                    ? req.body.builder_page_data
                    : JSON.stringify(req.body.builder_page_data);
            } catch (e) {
                console.error('Error processing builder_page_data on update:', e);
                updateData.builder_page_data = null;
            }
        }
        if (req.body.builder_layout !== undefined) {
            try {
                updateData.builder_layout = typeof req.body.builder_layout === 'string'
                    ? JSON.parse(req.body.builder_layout)
                    : req.body.builder_layout;
            } catch (e) {
                console.error('Error parsing builder_layout on update:', e);
                updateData.builder_layout = null;
            }
        }
        if (req.body.tags) updateData.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        updateData = stripEmDash(updateData);

        await Content.update(id, updateData);
        
        // Add new banner image to media_files table if present and not already exists
        if (req.files?.banner_image?.[0]) {
            try {
                const bannerFile = req.files.banner_image[0];
                // Check if file with same original name already exists in media_files table
                const existingMedia = await Media.findByOriginalName(bannerFile.originalname);
                if (!existingMedia) {
                    const ext = bannerFile.filename.split('.').pop().toLowerCase();
                    const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'other';
                    const fileData = require('fs').readFileSync(bannerFile.path);
                    await Media.create({
                        filename: bannerFile.filename,
                        original_name: bannerFile.originalname,
                        file_path: `/uploads/${bannerFile.filename}`,
                        file_type: fileType,
                        file_size: bannerFile.size,
                        mime_type: bannerFile.mimetype,
                        folder: 'Images',
                        uploaded_by: req.user.id,
                        file_data: fileData
                    });
                    console.log('✓ Banner image added to media_files table on update:', bannerFile.filename);
                } else {
                    console.log('Banner image with same original name already exists in media_files table on update:', bannerFile.originalname);
                    // Use the existing file's filename for the content
                    updateData.banner_image = existingMedia.filename;
                }
            } catch (mediaError) {
                console.error('Error adding banner image to media_files on update:', mediaError);
            }
        } else {
            console.log('No banner image file found in req.files during update');
        }
        
        // Add new PDF file to media_files table if present and not already exists
        if (req.files?.pdf_file?.[0]) {
            try {
                const pdfFile = req.files.pdf_file[0];
                // Check if file with same original name already exists in media_files table
                const existingMedia = await Media.findByOriginalName(pdfFile.originalname);
                if (!existingMedia) {
                    const fileData = require('fs').readFileSync(pdfFile.path);
                    await Media.create({
                        filename: pdfFile.filename,
                        original_name: pdfFile.originalname,
                        file_path: `/uploads/${pdfFile.filename}`,
                        file_type: 'document',
                        file_size: pdfFile.size,
                        mime_type: pdfFile.mimetype,
                        folder: 'Documents',
                        uploaded_by: req.user.id,
                        file_data: fileData
                    });
                    console.log('✓ PDF file added to media_files table on update:', pdfFile.filename);
                } else {
                    console.log('PDF file with same original name already exists in media_files table on update:', pdfFile.originalname);
                    // Use the existing file's filename for the content
                    updateData.pdf_file = existingMedia.filename;
                }
            } catch (mediaError) {
                console.error('Error adding PDF to media_files on update:', mediaError);
            }
        }
        
        // Handle tag usage updates
        const oldTags = content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [];
        const newTags = updateData.tags ? (typeof updateData.tags === 'string' ? JSON.parse(updateData.tags) : updateData.tags) : [];
        
        // Decrease usage for removed tags
        const removedTags = oldTags.filter(tag => !newTags.includes(tag));
        if (removedTags.length > 0) {
            await decreaseTagUsage(removedTags);
        }
        
        // Increase usage for new tags
        const addedTags = newTags.filter(tag => !oldTags.includes(tag));
        if (addedTags.length > 0) {
            await updateTagUsage(addedTags);
        }

        const updatedContent = await Content.findById(id);

        // Log to audit logs
        await logAudit(req, 'update', 'content', id, `Updated content: ${updatedContent.title}`, 'success');

        res.json({ message: 'Content updated successfully', content: updatedContent });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateWebhookSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });
        if (content.user_id !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Access denied' });

        const updateData = {};
        if (req.body.webhook_url !== undefined) updateData.webhook_url = req.body.webhook_url;
        if (req.body.webhook_field_mapping) updateData.webhook_field_mapping = req.body.webhook_field_mapping;
        if (req.body.custom_fields) updateData.custom_fields = req.body.custom_fields;

        const updated = await Content.update(id, updateData);
        res.json({ message: 'Webhook settings updated', content: updated });
    } catch (error) {
        console.error('Update webhook settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.submitForReview = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (content.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (content.status !== 'draft' && content.status !== 'changes_requested') {
            return res.status(400).json({ message: 'Content cannot be submitted for review' });
        }

        const updatedContent = await Content.updateStatus(id, 'pending');

        // Send notification to admins (non-blocking)
        const userName = `${req.user.first_name} ${req.user.last_name}`;
        notifyAdmins(id, 'review', `${userName} submitted "${content.title}" for review.`).catch(err => {
            console.error('Notification error (non-critical):', err.message);
        });
         // Send email to user about content submission
        try {
            const category = await Category.findById(content.category_id);
            const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            const frontendUrl = rawFrontend.split(',')[0].trim();
           
            await sendTemplatedEmail('content_submitted', req.user.email, {
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                content_title: content.title,
                category: category?.name || 'Uncategorized',
                submitted_date: new Date().toLocaleDateString(),
                dashboard_url: `${frontendUrl}/dashboard`
            });
        } catch (emailError) {
            console.error('Content submission email error:', emailError);
            // Don't fail submission if email fails
        }

        res.json({ message: 'Content submitted for review', content: updatedContent });
    } catch (error) {
        console.error('Submit for review error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getContentBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        console.log('📄 getContentBySlug called for slug:', slug);
        const content = await Content.findBySlug(slug);

        if (!content) {
            console.log('❌ Content not found for slug:', slug);
            return res.status(404).json({ message: 'Content not found' });
        }

        console.log('✅ Content found, ID:', content.id, 'Title:', content.title);

        // Get related articles
        const relatedArticles = await Content.getRelatedArticles(content.id, content.category_id);

        res.json({ content, relatedArticles });
    } catch (error) {
        console.error('Get content by slug error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getContentForPreview = async (req, res) => {
    try {
        const { slug } = req.params;
        const content = await Content.findBySlug(slug);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Get related articles
        const relatedArticles = await Content.getRelatedArticles(content.id, content.category_id);

        res.json({ content, relatedArticles });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (content.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Decrease tag usage for the content's tags
        const tags = content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [];
        if (tags.length > 0) {
            await decreaseTagUsage(tags);
        }

        await Content.delete(id);
        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.incrementContentView = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });
        await Content.incrementViewCount(id);
        res.json({ message: 'View count incremented successfully' });
    } catch (error) {
        console.error('Increment view count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};