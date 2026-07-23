const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');

// Upload file — requires authentication
router.post('/upload', authenticate, mediaController.uploadMiddleware, mediaController.uploadFile);

module.exports = router;
