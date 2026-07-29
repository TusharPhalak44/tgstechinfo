/**
 * Role Based Permissions Manager
 * Manages permissions for Builder, Templates, Assets, Publishing, SEO, Workflow, Analytics, AI
 */

class RoleBasedPermissionsManager {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    this.listeners = [];
    
    this.initializePermissions();
    this.initializeRoles();
  }

  /**
   * Initialize permission definitions
   */
  initializePermissions() {
    // Builder permissions
    this.permissions.set('builder:view', { category: 'builder', description: 'View builder' });
    this.permissions.set('builder:edit', { category: 'builder', description: 'Edit pages in builder' });
    this.permissions.set('builder:publish', { category: 'builder', description: 'Publish from builder' });
    this.permissions.set('builder:delete', { category: 'builder', description: 'Delete pages' });

    // Templates permissions
    this.permissions.set('templates:view', { category: 'templates', description: 'View templates' });
    this.permissions.set('templates:create', { category: 'templates', description: 'Create templates' });
    this.permissions.set('templates:edit', { category: 'templates', description: 'Edit templates' });
    this.permissions.set('templates:delete', { category: 'templates', description: 'Delete templates' });

    // Assets permissions
    this.permissions.set('assets:view', { category: 'assets', description: 'View assets' });
    this.permissions.set('assets:upload', { category: 'assets', description: 'Upload assets' });
    this.permissions.set('assets:edit', { category: 'assets', description: 'Edit assets' });
    this.permissions.set('assets:delete', { category: 'assets', description: 'Delete assets' });
    this.permissions.set('assets:manage', { category: 'assets', description: 'Manage asset library' });

    // Publishing permissions
    this.permissions.set('publishing:view', { category: 'publishing', description: 'View publishing status' });
    this.permissions.set('publishing:submit', { category: 'publishing', description: 'Submit for review' });
    this.permissions.set('publishing:review', { category: 'publishing', description: 'Review content' });
    this.permissions.set('publishing:approve', { category: 'publishing', description: 'Approve content' });
    this.permissions.set('publishing:reject', { category: 'publishing', description: 'Reject content' });
    this.permissions.set('publishing:schedule', { category: 'publishing', description: 'Schedule publishing' });
    this.permissions.set('publishing:publish', { category: 'publishing', description: 'Publish immediately' });
    this.permissions.set('publishing:archive', { category: 'publishing', description: 'Archive content' });

    // SEO permissions
    this.permissions.set('seo:view', { category: 'seo', description: 'View SEO settings' });
    this.permissions.set('seo:edit', { category: 'seo', description: 'Edit SEO settings' });
    this.permissions.set('seo:analyze', { category: 'seo', description: 'Run SEO analysis' });

    // Workflow permissions
    this.permissions.set('workflow:view', { category: 'workflow', description: 'View workflow status' });
    this.permissions.set('workflow:manage', { category: 'workflow', description: 'Manage workflows' });
    this.permissions.set('workflow:assign', { category: 'workflow', description: 'Assign content' });

    // Analytics permissions
    this.permissions.set('analytics:view', { category: 'analytics', description: 'View analytics' });
    this.permissions.set('analytics:export', { category: 'analytics', description: 'Export analytics' });
    this.permissions.set('analytics:manage', { category: 'analytics', description: 'Manage analytics settings' });

    // AI permissions
    this.permissions.set('ai:generate', { category: 'ai', description: 'Generate content with AI' });
    this.permissions.set('ai:rewrite', { category: 'ai', description: 'Rewrite content with AI' });
    this.permissions.set('ai:optimize', { category: 'ai', description: 'Optimize content with AI' });
    this.permissions.set('ai:images', { category: 'ai', description: 'Generate images with AI' });
    this.permissions.set('ai:manage', { category: 'ai', description: 'Manage AI settings' });

    // User management permissions
    this.permissions.set('users:view', { category: 'users', description: 'View users' });
    this.permissions.set('users:create', { category: 'users', description: 'Create users' });
    this.permissions.set('users:edit', { category: 'users', description: 'Edit users' });
    this.permissions.set('users:delete', { category: 'users', description: 'Delete users' });
    this.permissions.set('users:assign', { category: 'users', description: 'Assign roles' });
  }

  /**
   * Initialize default roles
   */
  initializeRoles() {
    // Viewer role
    this.roles.set('viewer', {
      id: 'viewer',
      name: 'Viewer',
      level: 10,
      permissions: [
        'builder:view',
        'templates:view',
        'assets:view',
        'publishing:view',
        'seo:view',
        'workflow:view',
        'analytics:view',
        'users:view',
      ],
    });

    // Writer role
    this.roles.set('writer', {
      id: 'writer',
      name: 'Writer',
      level: 30,
      permissions: [
        'builder:view',
        'builder:edit',
        'templates:view',
        'assets:view',
        'assets:upload',
        'publishing:view',
        'publishing:submit',
        'seo:view',
        'seo:edit',
        'workflow:view',
        'analytics:view',
        'ai:generate',
        'ai:rewrite',
      ],
    });

    // Editor role
    this.roles.set('editor', {
      id: 'editor',
      name: 'Editor',
      level: 50,
      permissions: [
        'builder:view',
        'builder:edit',
        'templates:view',
        'templates:create',
        'assets:view',
        'assets:upload',
        'assets:edit',
        'publishing:view',
        'publishing:submit',
        'publishing:review',
        'publishing:reject',
        'seo:view',
        'seo:edit',
        'seo:analyze',
        'workflow:view',
        'workflow:assign',
        'analytics:view',
        'ai:generate',
        'ai:rewrite',
        'ai:optimize',
      ],
    });

    // Publisher role
    this.roles.set('publisher', {
      id: 'publisher',
      name: 'Publisher',
      level: 70,
      permissions: [
        'builder:view',
        'builder:edit',
        'builder:publish',
        'templates:view',
        'templates:create',
        'templates:edit',
        'assets:view',
        'assets:upload',
        'assets:edit',
        'publishing:view',
        'publishing:submit',
        'publishing:review',
        'publishing:approve',
        'publishing:reject',
        'publishing:schedule',
        'publishing:publish',
        'seo:view',
        'seo:edit',
        'seo:analyze',
        'workflow:view',
        'workflow:manage',
        'workflow:assign',
        'analytics:view',
        'analytics:export',
        'ai:generate',
        'ai:rewrite',
        'ai:optimize',
        'ai:images',
      ],
    });

    // Admin role
    this.roles.set('admin', {
      id: 'admin',
      name: 'Admin',
      level: 100,
      permissions: Array.from(this.permissions.keys()),
    });
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   */
  assignRole(userId, roleId) {
    if (!this.roles.has(roleId)) {
      throw new Error(`Role ${roleId} not found`);
    }

    this.userRoles.set(userId, roleId);
    this.notifyListeners('role:assigned', { userId, roleId });
  }

  /**
   * Get user role
   * @param {string} userId - User ID
   * @returns {Object|null} Role or null
   */
  getUserRole(userId) {
    const roleId = this.userRoles.get(userId);
    return roleId ? this.roles.get(roleId) : null;
  }

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission string
   * @returns {boolean} Has permission
   */
  hasPermission(userId, permission) {
    const role = this.getUserRole(userId);
    if (!role) return false;

    return role.permissions.includes(permission);
  }

  /**
   * Check if user has any of the permissions
   * @param {string} userId - User ID
   * @param {Array} permissions - Array of permissions
   * @returns {boolean} Has any permission
   */
  hasAnyPermission(userId, permissions) {
    return permissions.some(permission => this.hasPermission(userId, permission));
  }

  /**
   * Check if user has all permissions
   * @param {string} userId - User ID
   * @param {Array} permissions - Array of permissions
   * @returns {boolean} Has all permissions
   */
  hasAllPermissions(userId, permissions) {
    return permissions.every(permission => this.hasPermission(userId, permission));
  }

  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @returns {Array} Array of permissions
   */
  getUserPermissions(userId) {
    const role = this.getUserRole(userId);
    return role ? role.permissions : [];
  }

  /**
   * Create custom role
   * @param {Object} role - Role configuration
   * @returns {string} Role ID
   */
  createRole(role) {
    const id = role.id || this.generateId();
    
    const newRole = {
      id,
      name: role.name,
      level: role.level || 50,
      permissions: role.permissions || [],
      createdAt: Date.now(),
    };

    this.roles.set(id, newRole);
    this.notifyListeners('role:created', newRole);
    return id;
  }

  /**
   * Update role
   * @param {string} roleId - Role ID
   * @param {Object} updates - Updates to apply
   */
  updateRole(roleId, updates) {
    const role = this.roles.get(roleId);
    if (!role) return;

    Object.assign(role, updates);
    this.notifyListeners('role:updated', role);
  }

  /**
   * Add permission to role
   * @param {string} roleId - Role ID
   * @param {string} permission - Permission to add
   */
  addPermissionToRole(roleId, permission) {
    const role = this.roles.get(roleId);
    if (!role) return;

    if (!role.permissions.includes(permission)) {
      role.permissions.push(permission);
      this.notifyListeners('role:updated', role);
    }
  }

  /**
   * Remove permission from role
   * @param {string} roleId - Role ID
   * @param {string} permission - Permission to remove
   */
  removePermissionFromRole(roleId, permission) {
    const role = this.roles.get(roleId);
    if (!role) return;

    const index = role.permissions.indexOf(permission);
    if (index > -1) {
      role.permissions.splice(index, 1);
      this.notifyListeners('role:updated', role);
    }
  }

  /**
   * Delete role
   * @param {string} roleId - Role ID
   */
  deleteRole(roleId) {
    if (roleId === 'admin') {
      throw new Error('Cannot delete admin role');
    }

    this.roles.delete(roleId);
    this.notifyListeners('role:deleted', { roleId });
  }

  /**
   * Get all roles
   * @returns {Array} Array of roles
   */
  getAllRoles() {
    return Array.from(this.roles.values());
  }

  /**
   * Get all permissions
   * @returns {Array} Array of permissions
   */
  getAllPermissions() {
    return Array.from(this.permissions.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  /**
   * Get permissions by category
   * @param {string} category - Permission category
   * @returns {Array} Array of permissions
   */
  getPermissionsByCategory(category) {
    return this.getAllPermissions().filter(p => p.category === category);
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Subscribe to events
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      listener(event, data);
    });
  }
}

const roleBasedPermissionsManager = new RoleBasedPermissionsManager();
export default roleBasedPermissionsManager;
