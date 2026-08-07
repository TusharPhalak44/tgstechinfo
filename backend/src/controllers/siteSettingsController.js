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

        // Validate image data — must be a base64 data URL or empty string
        if (imageData && typeof imageData !== 'string') {
            return res.status(400).json({ message: 'imageData must be a string' });
        }

        // Log the size for debugging on hosted servers
        const sizeKb = Math.round((imageData.length * 3) / 4 / 1024);
        console.log(`[uploadLogo] type=${type} size≈${sizeKb}KB`);

        const settings = await SiteSettings.updateLogo(type, imageData);
        res.json({ message: 'Logo updated successfully', settings });
    } catch (error) {
        console.error('Upload logo error:', error.message, error.code || '');
        // Return the real error so the frontend can show a meaningful message
        res.status(500).json({
            message: 'Failed to save logo',
            detail: error.message,
            code: error.code || null
        });
    }
};
