const Content = require('../models/Content');
const ContentType = require('../models/ContentType');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const { sendEmail, accessGrantEmailTemplate } = require('../config/email');
const { notifyAdmins } = require('./notificationController');

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
            })() : null
        });

        const content = await Content.create(contentData);
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

        let updateData = { ...req.body };
        if (req.files?.banner_image?.[0]) updateData.banner_image = req.files.banner_image[0].filename;
        if (req.files?.pdf_file?.[0]) updateData.pdf_file = req.files.pdf_file[0].filename;
        if (req.body.custom_fields) updateData.custom_fields = req.body.custom_fields;
        if (req.body.webhook_field_mapping) updateData.webhook_field_mapping = req.body.webhook_field_mapping;
        if (req.body.builder_layout !== undefined) updateData.builder_layout = req.body.builder_layout;
        if (req.body.builder_content_elements !== undefined) updateData.builder_content_elements = req.body.builder_content_elements;
        if (req.body.tags) updateData.tags = JSON.stringify(req.body.tags.split(',').map(t => t.trim()).filter(Boolean));
        updateData = stripEmDash(updateData);

        const updatedContent = await Content.update(id, updateData);
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

        if (content.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (content.status !== 'draft' && content.status !== 'changes_requested') {
            return res.status(400).json({ message: 'Content cannot be submitted for review' });
        }

        const updatedContent = await Content.updateStatus(id, 'pending');

        const userName = `${req.user.first_name} ${req.user.last_name}`;
        await notifyAdmins(id, 'review', `${userName} submitted "${content.title}" for review.`);

        res.json({ message: 'Content submitted for review', content: updatedContent });
    } catch (error) {
        console.error('Submit for review error:', error);
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

        // Increment view count
        await Content.incrementViewCount(content.id);

        // Get related articles
        const relatedArticles = await Content.getRelatedArticles(content.id, content.category_id);

        res.json({ content, relatedArticles });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};