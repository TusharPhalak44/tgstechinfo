const AuditLog = require('../models/AuditLog');

/**
 * Helper function to create audit logs
 * @param {Object} req - Express request object
 * @param {String} action - Action performed (e.g., 'login', 'create', 'update', 'delete')
 * @param {String} entityType - Type of entity (e.g., 'user', 'content', 'media')
 * @param {Number} entityId - ID of the entity
 * @param {String} details - Additional details about the action
 * @param {String} status - Status of the action ('success', 'failed', 'warning')
 */
async function logAudit(req, action, entityType, entityId = null, details = null, status = 'success') {
    try {
        const { getClientIP, parseUserAgent } = require('./deviceFingerprint');
        const ipAddress = getClientIP(req);
        const deviceInfo = parseUserAgent(req.headers['user-agent']);
        
        await AuditLog.create({
            user_id: req.user ? req.user.id : null,
            action,
            entity_type: entityType,
            entity_id: entityId,
            ip_address: ipAddress,
            details: details || `${action} on ${entityType}${entityId ? ` (ID: ${entityId})` : ''}`,
            status
        });
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw error - audit logging should not break the main flow
    }
}

module.exports = logAudit;
