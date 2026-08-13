const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Upload file — requires authentication
router.post('/upload', authenticate, mediaController.uploadMiddleware, mediaController.uploadFile);

// Get all files (admin endpoint - requires admin role)
router.get('/all', authenticate, requireAdmin, mediaController.getAllFiles);

// Get user's own files (requires authentication)
router.get('/user/all', authenticate, mediaController.getUserFiles);

// Get folder counts (admin endpoint - requires admin role)
router.get('/folder-counts', authenticate, requireAdmin, mediaController.getFolderCounts);

// Get user folder counts (requires authentication)
router.get('/user/folder-counts', authenticate, mediaController.getUserFolderCounts);

// Serve file from DB (filesystem-independent)
router.get('/file/:filename', mediaController.serveFile);

// Delete file — requires authentication
router.delete('/:id', authenticate, mediaController.deleteFile);

module.exports = router;
