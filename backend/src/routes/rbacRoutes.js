const express = require('express');
const router = express.Router();
const rbacController = require('../controllers/rbacController');
const { authenticate } = require('../middleware/auth');
const { hasPermission, hasRoleLevel } = require('../middleware/permissions');

// Role Management Routes
router.get('/roles', authenticate, rbacController.getAllRoles);
router.get('/roles/:id', authenticate, rbacController.getRoleById);
router.post('/roles', authenticate, rbacController.createRole);
router.put('/roles/:id', authenticate, rbacController.updateRole);
router.delete('/roles/:id', authenticate, rbacController.deleteRole);
router.put('/roles/:id/permissions', authenticate, rbacController.assignPermissionsToRole);
router.get('/roles/:id/users', authenticate, rbacController.getRoleUsers);

// Permission Management Routes
router.get('/permissions', authenticate, rbacController.getAllPermissions);
router.get('/permissions/:id', authenticate, rbacController.getPermissionById);
router.post('/permissions', authenticate, rbacController.createPermission);
router.put('/permissions/:id', authenticate, rbacController.updatePermission);
router.delete('/permissions/:id', authenticate, rbacController.deletePermission);

// User Role Management Routes
router.get('/users/:userId/roles', authenticate, hasPermission('user.read'), rbacController.getUserRoles);
router.get('/users/:userId/permissions', authenticate, hasPermission('user.read'), rbacController.getUserPermissions);
router.post('/users/:userId/roles', authenticate, hasPermission('user.manage_roles'), rbacController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', authenticate, hasPermission('user.manage_roles'), rbacController.removeRoleFromUser);
router.put('/users/:userId/roles', authenticate, hasPermission('user.manage_roles'), rbacController.setUserRoles);
router.get('/users/:userId/check-permission', authenticate, rbacController.checkUserPermission);

module.exports = router;
