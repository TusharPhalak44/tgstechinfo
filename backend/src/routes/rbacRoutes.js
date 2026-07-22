const express = require('express');
const router = express.Router();
const rbacController = require('../controllers/rbacController');
const { authenticate } = require('../middleware/auth');
const { hasPermission, hasRoleLevel } = require('../middleware/permissions');

// Role Management Routes
router.get('/roles', authenticate, hasPermission('role.read'), rbacController.getAllRoles);
router.get('/roles/:id', authenticate, hasPermission('role.read'), rbacController.getRoleById);
router.post('/roles', authenticate, hasPermission('role.create'), rbacController.createRole);
router.put('/roles/:id', authenticate, hasPermission('role.update'), rbacController.updateRole);
router.delete('/roles/:id', authenticate, hasPermission('role.delete'), rbacController.deleteRole);
router.put('/roles/:id/permissions', authenticate, hasPermission('role.assign'), rbacController.assignPermissionsToRole);
router.get('/roles/:id/users', authenticate, hasPermission('role.read'), rbacController.getRoleUsers);

// Permission Management Routes
router.get('/permissions', authenticate, hasPermission('role.read'), rbacController.getAllPermissions);
router.get('/permissions/:id', authenticate, hasPermission('role.read'), rbacController.getPermissionById);
router.post('/permissions', authenticate, hasPermission('role.create'), rbacController.createPermission);
router.put('/permissions/:id', authenticate, hasPermission('role.update'), rbacController.updatePermission);
router.delete('/permissions/:id', authenticate, hasPermission('role.delete'), rbacController.deletePermission);

// User Role Management Routes
router.get('/users/:userId/roles', authenticate, hasPermission('user.read'), rbacController.getUserRoles);
router.get('/users/:userId/permissions', authenticate, hasPermission('user.read'), rbacController.getUserPermissions);
router.post('/users/:userId/roles', authenticate, hasPermission('user.manage_roles'), rbacController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', authenticate, hasPermission('user.manage_roles'), rbacController.removeRoleFromUser);
router.put('/users/:userId/roles', authenticate, hasPermission('user.manage_roles'), rbacController.setUserRoles);
router.get('/users/:userId/check-permission', authenticate, rbacController.checkUserPermission);

module.exports = router;
