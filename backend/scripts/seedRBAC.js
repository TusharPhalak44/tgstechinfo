const { pool } = require('../src/config/database');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const User = require('../src/models/User');

const seedRBAC = async () => {
  try {
    console.log('🌱 Starting RBAC seed data initialization...');

    // Check if roles already exist
    const existingRoles = await Role.findAll();
    if (existingRoles.length > 0) {
      console.log('✅ Roles already exist, skipping role creation');
    } else {
      // Create default roles
      const roles = [
        { name: 'Super Admin', description: 'Full system access with all permissions', level: 100, is_system: true },
        { name: 'Admin', description: 'Administrative access with most permissions', level: 80, is_system: true },
        { name: 'Editor', description: 'Content management permissions', level: 60, is_system: true },
        { name: 'Contributor', description: 'Can create and edit own content', level: 40, is_system: true },
        { name: 'Viewer', description: 'Read-only access', level: 20, is_system: true },
      ];

      for (const roleData of roles) {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.name}`);
      }
    }

    // Check if permissions already exist
    const existingPermissions = await Permission.findAll();
    if (existingPermissions.length > 0) {
      console.log('✅ Permissions already exist, skipping permission creation');
    } else {
      // Create default permissions
      const permissions = [
        // Content permissions
        { name: 'content.create', description: 'Create new content', resource: 'content', action: 'create' },
        { name: 'content.read', description: 'View content', resource: 'content', action: 'read' },
        { name: 'content.update', description: 'Edit content', resource: 'content', action: 'update' },
        { name: 'content.delete', description: 'Delete content', resource: 'content', action: 'delete' },
        { name: 'content.publish', description: 'Publish content', resource: 'content', action: 'publish' },
        { name: 'content.unpublish', description: 'Unpublish content', resource: 'content', action: 'unpublish' },

        // User permissions
        { name: 'user.create', description: 'Create new users', resource: 'user', action: 'create' },
        { name: 'user.read', description: 'View users', resource: 'user', action: 'read' },
        { name: 'user.update', description: 'Edit users', resource: 'user', action: 'update' },
        { name: 'user.delete', description: 'Delete users', resource: 'user', action: 'delete' },
        { name: 'user.manage_roles', description: 'Manage user roles', resource: 'user', action: 'manage_roles' },

        // Category permissions
        { name: 'category.create', description: 'Create categories', resource: 'category', action: 'create' },
        { name: 'category.read', description: 'View categories', resource: 'category', action: 'read' },
        { name: 'category.update', description: 'Edit categories', resource: 'category', action: 'update' },
        { name: 'category.delete', description: 'Delete categories', resource: 'category', action: 'delete' },

        // Media permissions
        { name: 'media.upload', description: 'Upload media files', resource: 'media', action: 'upload' },
        { name: 'media.read', description: 'View media files', resource: 'media', action: 'read' },
        { name: 'media.update', description: 'Edit media files', resource: 'media', action: 'update' },
        { name: 'media.delete', description: 'Delete media files', resource: 'media', action: 'delete' },

        // Settings permissions
        { name: 'settings.read', description: 'View settings', resource: 'settings', action: 'read' },
        { name: 'settings.update', description: 'Update settings', resource: 'settings', action: 'update' },

        // Analytics permissions
        { name: 'analytics.read', description: 'View analytics', resource: 'analytics', action: 'read' },

        // Role permissions
        { name: 'role.create', description: 'Create roles', resource: 'role', action: 'create' },
        { name: 'role.read', description: 'View roles', resource: 'role', action: 'read' },
        { name: 'role.update', description: 'Edit roles', resource: 'role', action: 'update' },
        { name: 'role.delete', description: 'Delete roles', resource: 'role', action: 'delete' },
        { name: 'role.assign', description: 'Assign roles to users', resource: 'role', action: 'assign' },
      ];

      for (const permData of permissions) {
        await Permission.create(permData);
        console.log(`✅ Created permission: ${permData.name}`);
      }
    }

    // Assign permissions to roles
    const allPermissions = await Permission.findAll();
    const superAdminRole = await Role.findByName('Super Admin');
    const adminRole = await Role.findByName('Admin');
    const editorRole = await Role.findByName('Editor');
    const contributorRole = await Role.findByName('Contributor');
    const viewerRole = await Role.findByName('Viewer');

    if (superAdminRole && allPermissions.length > 0) {
      await Role.setPermissions(superAdminRole.id, allPermissions.map(p => p.id));
      console.log('✅ Assigned all permissions to Super Admin');
    }

    if (adminRole) {
      const adminPermissions = allPermissions.filter(p => !p.name.startsWith('role.'));
      await Role.setPermissions(adminRole.id, adminPermissions.map(p => p.id));
      console.log('✅ Assigned permissions to Admin');
    }

    if (editorRole) {
      const editorPermissions = allPermissions.filter(p => 
        ['content', 'category', 'media'].includes(p.resource)
      );
      await Role.setPermissions(editorRole.id, editorPermissions.map(p => p.id));
      console.log('✅ Assigned permissions to Editor');
    }

    if (contributorRole) {
      const contributorPermissions = allPermissions.filter(p =>
        ['content.create', 'content.read', 'content.update', 'media.upload', 'media.read', 'category.read'].includes(p.name)
      );
      await Role.setPermissions(contributorRole.id, contributorPermissions.map(p => p.id));
      console.log('✅ Assigned permissions to Contributor');
    }

    if (viewerRole) {
      const viewerPermissions = allPermissions.filter(p => p.action === 'read');
      await Role.setPermissions(viewerRole.id, viewerPermissions.map(p => p.id));
      console.log('✅ Assigned permissions to Viewer');
    }

    // Assign default role to existing users without roles
    const [users] = await pool.query('SELECT id FROM users WHERE role_id IS NULL');
    const contributor = await Role.findByName('Contributor');
    
    if (contributor && users.length > 0) {
      for (const user of users) {
        await Role.assignToUser(user.id, contributor.id);
        console.log(`✅ Assigned Contributor role to user ${user.id}`);
      }
    }

    console.log('🎉 RBAC seed data initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ RBAC seed data initialization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedRBAC();
