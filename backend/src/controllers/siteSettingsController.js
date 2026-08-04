const SiteSettings = require('../models/SiteSettings');

exports.getSettings = async (req, res) => {
    try {
        const settings = await SiteSettings.getSettings();
        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = await SiteSettings.updateSettings(req.body);
        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.uploadLogo = async (req, res) => {
    try {
        const { type } = req.params;
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ message: 'Image data is required' });
        }

        const settings = await SiteSettings.updateLogo(type, imageData);
        res.json({ message: 'Logo updated successfully', settings });
    } catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
