const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');

// Role Management
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.json({ roles });
    } catch (error) {
        console.error('Get all roles error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);
        
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        const permissions = await Role.getPermissions(id);
        
        res.json({ role, permissions });
    } catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createRole = async (req, res) => {
    try {
        const { name, description, level, is_system = false } = req.body;
        
        const existingRole = await Role.findByName(name);
        if (existingRole) {
            return res.status(400).json({ message: 'Role with this name already exists' });
        }

        const role = await Role.create({ name, description, level, is_system });
        
        res.status(201).json({ message: 'Role created successfully', role });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, level, is_system } = req.body;
        
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.is_system && is_system === false) {
            return res.status(400).json({ message: 'Cannot modify system role flag' });
        }

        const updatedRole = await Role.update(id, { name, description, level, is_system });
        
        res.json({ message: 'Role updated successfully', role: updatedRole });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        await Role.delete(id);
        
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Delete role error:', error);
        if (error.message === 'Cannot delete system roles') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.assignPermissionsToRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionIds } = req.body;
        
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        await Role.setPermissions(id, permissionIds);
        
        const updatedPermissions = await Role.getPermissions(id);
        
        res.json({ message: 'Permissions assigned successfully', permissions: updatedPermissions });
    } catch (error) {
        console.error('Assign permissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRoleUsers = async (req, res) => {
    try {
        const { id } = req.params;
        
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        const users = await Role.getUsers(id);
        
        res.json({ users });
    } catch (error) {
        console.error('Get role users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Permission Management
exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll();
        res.json({ permissions });
    } catch (error) {
        console.error('Get all permissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permission.findById(id);
        
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        res.json({ permission });
    } catch (error) {
        console.error('Get permission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createPermission = async (req, res) => {
    try {
        const { name, description, resource, action } = req.body;
        
        const existingPermission = await Permission.findByName(name);
        if (existingPermission) {
            return res.status(400).json({ message: 'Permission with this name already exists' });
        }

        const permission = await Permission.create({ name, description, resource, action });
        
        res.status(201).json({ message: 'Permission created successfully', permission });
    } catch (error) {
        console.error('Create permission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, resource, action } = req.body;
        
        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        const updatedPermission = await Permission.update(id, { name, description, resource, action });
        
        res.json({ message: 'Permission updated successfully', permission: updatedPermission });
    } catch (error) {
        console.error('Update permission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        
        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        await Permission.delete(id);
        
        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// User Role Management
exports.getUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const roles = await Role.getUserRoles(userId);
        
        res.json({ roles });
    } catch (error) {
        console.error('Get user roles error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserPermissions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const permissions = await User.getPermissions(userId);
        
        res.json({ permissions });
    } catch (error) {
        console.error('Get user permissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.assignRoleToUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;
        
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        await Role.assignToUser(userId, roleId);
        
        const roles = await Role.getUserRoles(userId);
        
        res.json({ message: 'Role assigned successfully', roles });
    } catch (error) {
        console.error('Assign role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.removeRoleFromUser = async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        
        await Role.removeFromUser(userId, roleId);
        
        const roles = await Role.getUserRoles(userId);
        
        res.json({ message: 'Role removed successfully', roles });
    } catch (error) {
        console.error('Remove role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.setUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleIds } = req.body;
        
        await Role.setUserRoles(userId, roleIds);
        
        const roles = await Role.getUserRoles(userId);
        
        res.json({ message: 'User roles updated successfully', roles });
    } catch (error) {
        console.error('Set user roles error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkUserPermission = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permissionName } = req.query;
        
        const hasPermission = await User.hasPermission(userId, permissionName);
        
        res.json({ hasPermission, permission: permissionName });
    } catch (error) {
        console.error('Check permission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
