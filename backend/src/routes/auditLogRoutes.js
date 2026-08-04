const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all audit logs (admin only)
router.get('/', authenticate, isAdmin, auditLogController.getAllLogs);

// Get audit log by ID (admin only)
router.get('/:id', authenticate, isAdmin, auditLogController.getLogById);

// Create audit log (internal use, can be called by other controllers)
router.post('/', authenticate, auditLogController.createLog);

// Delete audit log (admin only)
router.delete('/:id', authenticate, isAdmin, auditLogController.deleteLog);

// Delete old logs (admin only)
router.post('/cleanup', authenticate, isAdmin, auditLogController.deleteOldLogs);

module.exports = router;
