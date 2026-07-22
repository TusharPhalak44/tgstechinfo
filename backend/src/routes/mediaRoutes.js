const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

// Upload file
router.post('/upload', mediaController.uploadMiddleware, mediaController.uploadFile);

module.exports = router;
