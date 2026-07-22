const User = require('../models/User');

/**
 * Check if user has a specific permission by name
 * @param {string} permissionName - The permission name (e.g., 'content.create')
 */
const hasPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            const hasPermission = await User.hasPermission(req.user.id, permissionName);
            
            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'Access denied. You do not have the required permission.',
                    required: permissionName
                });
            }
            
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Check if user has any permission for a resource and action
 * @param {string} resource - The resource (e.g., 'content', 'user')
 * @param {string} action - The action (e.g., 'create', 'read', 'update', 'delete')
 */
const hasAnyPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const hasPermission = await User.hasAnyPermission(req.user.id, resource, action);
            
            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'Access denied. You do not have the required permission.',
                    required: `${resource}.${action}`
                });
            }
            
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Check if user has a minimum role level
 * @param {number} minLevel - The minimum role level required
 */
const hasRoleLevel = (minLevel) => {
    return async (req, res, next) => {
        try {
            const userRoleLevel = await User.getRoleLevel(req.user.id);
            
            if (userRoleLevel < minLevel) {
                return res.status(403).json({ 
                    message: 'Access denied. You do not have the required role level.',
                    required: minLevel,
                    current: userRoleLevel
                });
            }
            
            next();
        } catch (error) {
            console.error('Role level check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Check if user owns the resource (for ownership-based access control)
 * @param {Function} getResourceOwnerId - Function that extracts owner ID from request
 */
const isOwnerOrHasPermission = (permissionName, getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            const resourceOwnerId = await getResourceOwnerId(req);
            
            // User owns the resource
            if (resourceOwnerId === req.user.id) {
                return next();
            }
            
            // User has the permission
            const hasPermission = await User.hasPermission(req.user.id, permissionName);
            
            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'Access denied. You do not own this resource or have the required permission.',
                    required: permissionName
                });
            }
            
            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissionNames - Array of permission names
 */
const hasAnyOfPermissions = (permissionNames) => {
    return async (req, res, next) => {
        try {
            for (const permissionName of permissionNames) {
                const hasPermission = await User.hasPermission(req.user.id, permissionName);
                if (hasPermission) {
                    return next();
                }
            }
            
            return res.status(403).json({ 
                message: 'Access denied. You do not have any of the required permissions.',
                required: permissionNames
            });
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Check if user has all of the specified permissions
 * @param {string[]} permissionNames - Array of permission names
 */
const hasAllPermissions = (permissionNames) => {
    return async (req, res, next) => {
        try {
            for (const permissionName of permissionNames) {
                const hasPermission = await User.hasPermission(req.user.id, permissionName);
                if (!hasPermission) {
                    return res.status(403).json({ 
                        message: 'Access denied. You do not have all the required permissions.',
                        required: permissionNames
                    });
                }
            }
            
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = {
    hasPermission,
    hasAnyPermission,
    hasRoleLevel,
    isOwnerOrHasPermission,
    hasAnyOfPermissions,
    hasAllPermissions
};
