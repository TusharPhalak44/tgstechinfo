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

        // Validate image data — must be a base64 data URL string
        if (typeof imageData !== 'string') {
            return res.status(400).json({ message: 'imageData must be a string' });
        }

        // Log the size for debugging on hosted servers
        const sizeKb = Math.round((imageData.length * 3) / 4 / 1024);
        console.log(`[uploadLogo] type=${type} size≈${sizeKb}KB`);

        const settings = await SiteSettings.updateLogo(type, imageData);
        res.json({ message: 'Logo updated successfully', settings });
    } catch (error) {
        // Log full error so it appears in `docker logs tgstechinfo_backend`
        console.error('[uploadLogo] FAILED', {
            type: req.params.type,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            message: error.message
        });

        // Surface actionable detail to the client (safe — no stack traces)
        res.status(500).json({
            message: 'Failed to save logo',
            detail: error.sqlMessage || error.message,
            code: error.code || null,
            errno: error.errno || null
        });
    }
};
