const EmailTemplate = require('../models/EmailTemplate');
const { validationResult } = require('express-validator');

exports.getAllTemplates = async (req, res) => {
    try {
        const { template_type, is_active } = req.query;
        const filters = {};
        
        if (template_type) filters.template_type = template_type;
        if (is_active !== undefined) filters.is_active = is_active === 'true';

        const templates = await EmailTemplate.findAll(filters);
        res.json({ templates });
    } catch (error) {
        console.error('Get all templates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await EmailTemplate.findById(id);
        
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        
        res.json({ template });
    } catch (error) {
        console.error('Get template by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTemplateByType = async (req, res) => {
    try {
        const { template_type } = req.params;
        const template = await EmailTemplate.findByType(template_type);
        
        if (!template) {
            return res.status(404).json({ message: 'Template not found for this type' });
        }
        
        res.json({ template });
    } catch (error) {
        console.error('Get template by type error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { template_type, template_name, subject, html_body, is_active } = req.body;

        const template = await EmailTemplate.create({
            template_type,
            template_name,
            subject,
            html_body,
            is_active: is_active !== undefined ? is_active : true
        });

        res.status(201).json({ message: 'Template created successfully', template });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const existingTemplate = await EmailTemplate.findById(id);

        if (!existingTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const { template_type, template_name, subject, html_body, is_active } = req.body;

        const updatedTemplate = await EmailTemplate.update(id, {
            template_type: template_type || existingTemplate.template_type,
            template_name: template_name || existingTemplate.template_name,
            subject: subject || existingTemplate.subject,
            html_body: html_body || existingTemplate.html_body,
            is_active: is_active !== undefined ? is_active : existingTemplate.is_active
        });

        res.json({ message: 'Template updated successfully', template: updatedTemplate });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const existingTemplate = await EmailTemplate.findById(id);

        if (!existingTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await EmailTemplate.delete(id);
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.toggleTemplateActive = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await EmailTemplate.toggleActive(id);
        
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        
        res.json({ message: 'Template status updated successfully', template });
    } catch (error) {
        console.error('Toggle template active error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to render template with variables
exports.renderTemplate = (template, variables) => {
    let renderedHtml = template.html_body;
    let renderedSubject = template.subject;

    // Replace all variables in both subject and body
    Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = variables[key] || '';
        renderedHtml = renderedHtml.replace(new RegExp(placeholder, 'g'), value);
        renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject: renderedSubject, html: renderedHtml };
};
