const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tagsController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all tags with pagination and search
router.get('/', authenticate, isAdmin, tagsController.getAllTags);

// Get tag suggestions for autocomplete
router.get('/suggestions', authenticate, isAdmin, tagsController.getTagSuggestions);

// Get a single tag by ID
router.get('/:id', authenticate, isAdmin, tagsController.getTagById);

// Create a new tag
router.post('/', authenticate, isAdmin, tagsController.createTag);

// Update a tag
router.put('/:id', authenticate, isAdmin, tagsController.updateTag);

// Delete a tag
router.delete('/:id', authenticate, isAdmin, tagsController.deleteTag);

module.exports = router;
