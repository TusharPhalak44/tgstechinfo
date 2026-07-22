-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create roles table with hierarchy support
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    level INT DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Update users table to use role_id instead of role string
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id INT,
ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Create user_roles junction table for multiple roles support (optional)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- Content permissions
('content.create', 'Create new content', 'content', 'create'),
('content.read', 'View content', 'content', 'read'),
('content.update', 'Edit content', 'content', 'update'),
('content.delete', 'Delete content', 'content', 'delete'),
('content.publish', 'Publish content', 'content', 'publish'),
('content.unpublish', 'Unpublish content', 'content', 'unpublish'),

-- User permissions
('user.create', 'Create new users', 'user', 'create'),
('user.read', 'View users', 'user', 'read'),
('user.update', 'Edit users', 'user', 'update'),
('user.delete', 'Delete users', 'user', 'delete'),
('user.manage_roles', 'Manage user roles', 'user', 'manage_roles'),

-- Category permissions
('category.create', 'Create categories', 'category', 'create'),
('category.read', 'View categories', 'category', 'read'),
('category.update', 'Edit categories', 'category', 'update'),
('category.delete', 'Delete categories', 'category', 'delete'),

-- Media permissions
('media.upload', 'Upload media files', 'media', 'upload'),
('media.read', 'View media files', 'media', 'read'),
('media.update', 'Edit media files', 'media', 'update'),
('media.delete', 'Delete media files', 'media', 'delete'),

-- Settings permissions
('settings.read', 'View settings', 'settings', 'read'),
('settings.update', 'Update settings', 'settings', 'update'),

-- Analytics permissions
('analytics.read', 'View analytics', 'analytics', 'read'),

-- Role permissions
('role.create', 'Create roles', 'role', 'create'),
('role.read', 'View roles', 'role', 'read'),
('role.update', 'Edit roles', 'role', 'update'),
('role.delete', 'Delete roles', 'role', 'delete'),
('role.assign', 'Assign roles to users', 'role', 'assign')

ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Insert default roles with hierarchy
INSERT INTO roles (name, description, level, is_system) VALUES
('Super Admin', 'Full system access with all permissions', 100, TRUE),
('Admin', 'Administrative access with most permissions', 80, TRUE),
('Editor', 'Content management permissions', 60, TRUE),
('Contributor', 'Can create and edit own content', 40, TRUE),
('Viewer', 'Read-only access', 20, TRUE)
ON DUPLICATE KEY UPDATE description=VALUES(description), level=VALUES(level);

-- Assign permissions to Super Admin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Super Admin'),
    id
FROM permissions
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Admin (all except role management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Admin'),
    id
FROM permissions
WHERE name NOT LIKE 'role.%'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Editor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Editor'),
    id
FROM permissions
WHERE resource IN ('content', 'category', 'media')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Contributor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Contributor'),
    id
FROM permissions
WHERE name IN ('content.create', 'content.read', 'content.update', 'media.upload', 'media.read', 'category.read')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Viewer'),
    id
FROM permissions
WHERE action = 'read'
ON DUPLICATE KEY UPDATE role_id=role_id;
