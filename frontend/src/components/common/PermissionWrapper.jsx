import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * PermissionWrapper - Conditionally renders children based on user permissions
 * 
 * @param {string|string[]} permissions - Permission name(s) required
 * @param {boolean} requireAll - If true, requires ALL permissions. If false, requires ANY (default: false)
 * @param {React.ReactNode} fallback - Component to render if permission check fails
 * @param {React.ReactNode} children - Component to render if permission check passes
 */
const PermissionWrapper = ({ permissions, requireAll = false, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission } = useAuth();

  // If no permissions specified, render children
  if (!permissions) {
    return <>{children}</>;
  }

  // Convert single permission to array
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

  // Check permissions based on requireAll flag
  const hasAccess = requireAll 
    ? permissionArray.every(perm => hasPermission(perm))
    : hasAnyPermission(permissionArray);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * withPermission - HOC to wrap components with permission checking
 */
export const withPermission = (permissions, requireAll = false) => (WrappedComponent) => {
  return (props) => (
    <PermissionWrapper permissions={permissions} requireAll={requireAll}>
      <WrappedComponent {...props} />
    </PermissionWrapper>
  );
};

export default PermissionWrapper;
