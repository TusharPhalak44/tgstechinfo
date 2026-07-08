const Content = require('../models/Content');
const ContentType = require('../models/ContentType');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const { sendEmail, accessGrantEmailTemplate } = require('../config/email');
const { notifyAdmins } = require('./notificationController');

exports.createContent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const contentData = {
            ...req.body,
            user_id: req.user.id,
            banner_image: req.files?.banner_image?.[0]?.filename || null,
            pdf_file: req.files?.pdf_file?.[0]?.filename || null,
            tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            custom_fields: req.body.custom_fields ? JSON.parse(req.body.custom_fields) : null
        };

        const content = await Content.create(contentData);
        res.status(201).json({ message: 'Content created successfully', content });
    } catch (error) {
        console.error('Create content error:', error.message);
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

        const updateData = { ...req.body };
        if (req.files?.banner_image?.[0]) updateData.banner_image = req.files.banner_image[0].filename;
        if (req.files?.pdf_file?.[0]) updateData.pdf_file = req.files.pdf_file[0].filename;
        if (req.body.custom_fields) updateData.custom_fields = req.body.custom_fields;
        if (req.body.tags) updateData.tags = JSON.stringify(req.body.tags.split(',').map(t => t.trim()).filter(Boolean));
        // webhook_url is already in req.body via spread

        const updatedContent = await Content.update(id, updateData);
        res.json({ message: 'Content updated successfully', content: updatedContent });
    } catch (error) {
        console.error('Update content error:', error);
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