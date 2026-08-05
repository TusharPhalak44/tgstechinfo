const AuditLog = require('../models/AuditLog');

exports.getAllLogs = async (req, res) => {
    try {
        const { user_id, action, entity_type, status, search, limit = 100, offset = 0 } = req.query;
        
        const filters = {
            user_id,
            action,
            entity_type,
            status,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        
        const logs = await AuditLog.findAll(filters);
        const total = await AuditLog.getCount({ user_id, action, entity_type, status, search });
        
        res.json({
            data: logs,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
};

exports.getLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await AuditLog.findById(id);
        
        if (!log) {
            return res.status(404).json({ message: 'Audit log not found' });
        }
        
        res.json(log);
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ message: 'Failed to fetch audit log' });
    }
};

exports.createLog = async (req, res) => {
    try {
        const { user_id, action, entity_type, entity_id, ip_address, details, status } = req.body;
        
        const log = await AuditLog.create({
            user_id: req.user ? req.user.id : user_id,
            action,
            entity_type,
            entity_id,
            ip_address: req.ip || ip_address,
            details,
            status
        });
        
        res.status(201).json({ message: 'Audit log created successfully', log });
    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ message: 'Failed to create audit log' });
    }
};

exports.deleteLog = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await AuditLog.delete(id);
        
        if (deleted) {
            res.json({ message: 'Audit log deleted successfully' });
        } else {
            res.status(404).json({ message: 'Audit log not found' });
        }
    } catch (error) {
        console.error('Error deleting audit log:', error);
        res.status(500).json({ message: 'Failed to delete audit log' });
    }
};

exports.deleteOldLogs = async (req, res) => {
    try {
        const { days = 90 } = req.body;
        
        const deletedCount = await AuditLog.deleteOldLogs(parseInt(days));
        
        res.json({ 
            message: `Deleted ${deletedCount} old audit logs`,
            deletedCount 
        });
    } catch (error) {
        console.error('Error deleting old audit logs:', error);
        res.status(500).json({ message: 'Failed to delete old audit logs' });
    }
};
