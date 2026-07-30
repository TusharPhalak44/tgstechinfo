const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');

// Upload file — requires authentication
router.post('/upload', mediaController.uploadMiddleware, mediaController.uploadFile);

// Get all files
router.get('/all', mediaController.getAllFiles);

// Get folder counts
router.get('/folder-counts', mediaController.getFolderCounts);

// Serve file from DB (filesystem-independent)
router.get('/file/:filename', mediaController.serveFile);

module.exports = router;
