/**
 * Frontend Status Helper Utility
 * Provides consistent status management for React components
 * Matches the backend statusHelper for consistency
 */

/**
 * Valid content statuses
 */
export const CONTENT_STATUSES = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    CHANGES_REQUESTED: 'changes_requested',
    SCHEDULED: 'scheduled',
    ARCHIVED: 'archived'
};

/**
 * Valid edit request statuses
 */
export const EDIT_REQUEST_STATUSES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
};

/**
 * Status display properties for Ant Design components
 * Used for consistent UI display across admin and user panels
 */
export const STATUS_DISPLAY = {
    [CONTENT_STATUSES.DRAFT]: {
        label: 'Draft',
        color: 'default',
        icon: 'FileTextOutlined',
        description: 'Content is being created and not yet submitted',
        antTagColor: 'default'
    },
    [CONTENT_STATUSES.PENDING]: {
        label: 'Pending Review',
        color: 'processing',
        icon: 'ClockCircleOutlined',
        description: 'Content is waiting for admin approval',
        antTagColor: 'processing'
    },
    [CONTENT_STATUSES.APPROVED]: {
        label: 'Approved',
        color: 'success',
        icon: 'CheckCircleOutlined',
        description: 'Content has been approved and ready to publish',
        antTagColor: 'success'
    },
    [CONTENT_STATUSES.PUBLISHED]: {
        label: 'Published',
        color: 'success',
        icon: 'GlobalOutlined',
        description: 'Content is live on the website',
        antTagColor: 'success'
    },
    [CONTENT_STATUSES.REJECTED]: {
        label: 'Rejected',
        color: 'error',
        icon: 'CloseCircleOutlined',
        description: 'Content was rejected by admin',
        antTagColor: 'error'
    },
    [CONTENT_STATUSES.CHANGES_REQUESTED]: {
        label: 'Changes Requested',
        color: 'warning',
        icon: 'EditOutlined',
        description: 'Admin has requested changes before approval',
        antTagColor: 'warning'
    },
    [CONTENT_STATUSES.SCHEDULED]: {
        label: 'Scheduled',
        color: 'cyan',
        icon: 'CalendarOutlined',
        description: 'Content is scheduled for future publication',
        antTagColor: 'cyan'
    },
    [CONTENT_STATUSES.ARCHIVED]: {
        label: 'Archived',
        color: 'default',
        icon: 'InboxOutlined',
        description: 'Content is archived and not visible',
        antTagColor: 'default'
    }
};

/**
 * Edit request status display properties
 */
export const EDIT_REQUEST_STATUS_DISPLAY = {
    [EDIT_REQUEST_STATUSES.PENDING]: {
        label: 'Pending',
        color: 'warning',
        antTagColor: 'warning',
        description: 'Waiting for content creator to respond'
    },
    [EDIT_REQUEST_STATUSES.ACCEPTED]: {
        label: 'Accepted',
        color: 'success',
        antTagColor: 'success',
        description: 'Creator has accepted the edit request'
    },
    [EDIT_REQUEST_STATUSES.REJECTED]: {
        label: 'Rejected',
        color: 'error',
        antTagColor: 'error',
        description: 'Creator has rejected the edit request'
    },
    [EDIT_REQUEST_STATUSES.COMPLETED]: {
        label: 'Completed',
        color: 'default',
        antTagColor: 'default',
        description: 'Edit request has been completed'
    }
};

/**
 * Status-based permissions for UI elements
 * Defines what UI elements should be shown/hidden based on status
 */
export const STATUS_PERMISSIONS = {
    [CONTENT_STATUSES.DRAFT]: {
        canEdit: true,
        canDelete: true,
        canSubmit: true,
        canPublish: false,
        canSchedule: false,
        canArchive: true,
        showEditButton: true,
        showDeleteButton: true,
        showSubmitButton: true,
        showPublishButton: false
    },
    [CONTENT_STATUSES.PENDING]: {
        canEdit: false,
        canDelete: false,
        canSubmit: false,
        canPublish: false,
        canSchedule: false,
        canArchive: false,
        showEditButton: false,
        showDeleteButton: false,
        showSubmitButton: false,
        showPublishButton: false
    },
    [CONTENT_STATUSES.APPROVED]: {
        canEdit: false,
        canDelete: false,
        canSubmit: false,
        canPublish: true,
        canSchedule: true,
        canArchive: true,
        showEditButton: false,
        showDeleteButton: false,
        showSubmitButton: false,
        showPublishButton: true
    },
    [CONTENT_STATUSES.PUBLISHED]: {
        canEdit: false,
        canDelete: false,
        canSubmit: false,
        canPublish: false,
        canSchedule: false,
        canArchive: true,
        showEditButton: false,
        showDeleteButton: false,
        showSubmitButton: false,
        showPublishButton: false
    },
    [CONTENT_STATUSES.REJECTED]: {
        canEdit: true,
        canDelete: true,
        canSubmit: true,
        canPublish: false,
        canSchedule: false,
        canArchive: true,
        showEditButton: true,
        showDeleteButton: true,
        showSubmitButton: true,
        showPublishButton: false
    },
    [CONTENT_STATUSES.CHANGES_REQUESTED]: {
        canEdit: true,
        canDelete: false,
        canSubmit: true,
        canPublish: false,
        canSchedule: false,
        canArchive: false,
        showEditButton: true,
        showDeleteButton: false,
        showSubmitButton: true,
        showPublishButton: false
    },
    [CONTENT_STATUSES.SCHEDULED]: {
        canEdit: true,
        canDelete: true,
        canSubmit: false,
        canPublish: false,
        canSchedule: true,
        canArchive: true,
        showEditButton: true,
        showDeleteButton: true,
        showSubmitButton: false,
        showPublishButton: false
    },
    [CONTENT_STATUSES.ARCHIVED]: {
        canEdit: true,
        canDelete: true,
        canSubmit: false,
        canPublish: false,
        canSchedule: false,
        canArchive: false,
        showEditButton: true,
        showDeleteButton: true,
        showSubmitButton: false,
        showPublishButton: false
    }
};

/**
 * Get display properties for a status
 * 
 * @param {string} status - Content status
 * @returns {Object} Display properties (label, color, icon, description, antTagColor)
 */
export const getStatusDisplay = (status) => {
    return STATUS_DISPLAY[status] || {
        label: status || 'Unknown',
        color: 'default',
        icon: 'QuestionOutlined',
        description: 'Unknown status',
        antTagColor: 'default'
    };
};

/**
 * Get display properties for edit request status
 * 
 * @param {string} status - Edit request status
 * @returns {Object} Display properties
 */
export const getEditRequestStatusDisplay = (status) => {
    return EDIT_REQUEST_STATUS_DISPLAY[status] || {
        label: status || 'Unknown',
        color: 'default',
        antTagColor: 'default',
        description: 'Unknown status'
    };
};

/**
 * Check if user can perform action on content based on status
 * 
 * @param {string} status - Content status
 * @param {string} action - Action to check (edit, delete, submit, publish, schedule, archive)
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {boolean} True if action is allowed
 */
export const canPerformAction = (status, action, isAdmin = false) => {
    if (isAdmin) {
        // Admins can do almost anything
        return true;
    }
    
    const permissions = STATUS_PERMISSIONS[status];
    if (!permissions) return false;
    
    const permissionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}`;
    return permissions[permissionKey] || false;
};

/**
 * Check if content can be edited by user
 * Considers both status and edit requests
 * 
 * @param {string} status - Content status
 * @param {boolean} isAdmin - Whether user is admin
 * @param {boolean} hasPendingEditRequest - Whether there's a pending edit request
 * @returns {Object} { canEdit: boolean, reason: string }
 */
export const canEditContent = (status, isAdmin = false, hasPendingEditRequest = false) => {
    // Admins can always edit
    if (isAdmin) {
        return { canEdit: true, reason: 'Admin can edit any content' };
    }
    
    // Check status-based permissions
    const permissions = STATUS_PERMISSIONS[status];
    if (!permissions || !permissions.canEdit) {
        return { canEdit: false, reason: `Content with status '${status}' cannot be edited` };
    }
    
    // Check for pending edit requests
    if (hasPendingEditRequest) {
        return { canEdit: false, reason: 'Edit request is pending. Please accept the edit request first.' };
    }
    
    return { canEdit: true, reason: 'Content can be edited' };
};

/**
 * Check if UI element should be shown based on status
 * 
 * @param {string} status - Content status
 * @param {string} element - Element to check (editButton, deleteButton, submitButton, publishButton)
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {boolean} True if element should be shown
 */
export const shouldShowUIElement = (status, element, isAdmin = false) => {
    if (isAdmin) {
        // Admins see most elements
        return true;
    }
    
    const permissions = STATUS_PERMISSIONS[status];
    if (!permissions) return false;
    
    const elementKey = `show${element.charAt(0).toUpperCase() + element.slice(1)}`;
    return permissions[elementKey] || false;
};

/**
 * Check if content is in a final state (cannot be changed without admin intervention)
 * 
 * @param {string} status - Content status
 * @returns {boolean} True if status is final
 */
export const isFinalStatus = (status) => {
    return status === CONTENT_STATUSES.PUBLISHED || 
           status === CONTENT_STATUSES.ARCHIVED;
};

/**
 * Check if content is awaiting user action
 * 
 * @param {string} status - Content status
 * @returns {boolean} True if content needs user action
 */
export const needsUserAction = (status) => {
    return status === CONTENT_STATUSES.CHANGES_REQUESTED ||
           status === CONTENT_STATUSES.REJECTED;
};

/**
 * Check if content is awaiting admin action
 * 
 * @param {string} status - Content status
 * @returns {boolean} True if content needs admin review
 */
export const needsAdminAction = (status) => {
    return status === CONTENT_STATUSES.PENDING ||
           status === CONTENT_STATUSES.APPROVED;
};

/**
 * Get status badge props for Ant Design Tag component
 * 
 * @param {string} status - Content status
 * @returns {Object} Props for Ant Design Tag
 */
export const getStatusBadgeProps = (status) => {
    const display = getStatusDisplay(status);
    return {
        color: display.antTagColor,
        icon: display.icon,
        children: display.label
    };
};

/**
 * Get edit request status badge props for Ant Design Tag component
 * 
 * @param {string} status - Edit request status
 * @returns {Object} Props for Ant Design Tag
 */
export const getEditRequestStatusBadgeProps = (status) => {
    const display = getEditRequestStatusDisplay(status);
    return {
        color: display.antTagColor,
        children: display.label
    };
};

/**
 * Get status counts from content array
 * 
 * @param {Array} contents - Array of content objects
 * @returns {Object} Counts by status
 */
export const getStatusCounts = (contents) => {
    if (!Array.isArray(contents)) return {};
    
    return contents.reduce((counts, content) => {
        const status = content.status || 'unknown';
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});
};

/**
 * Filter contents by status
 * 
 * @param {Array} contents - Array of content objects
 * @param {Array} statuses - Array of statuses to include
 * @returns {Array} Filtered contents
 */
export const filterByStatus = (contents, statuses) => {
    if (!Array.isArray(contents)) return [];
    if (!Array.isArray(statuses) || statuses.length === 0) return contents;
    
    return contents.filter(content => statuses.includes(content.status));
};

/**
 * Get status color for custom styling
 * 
 * @param {string} status - Content status
 * @param {boolean} darkMode - Whether dark mode is active
 * @returns {string} CSS color value
 */
export const getStatusColor = (status, darkMode = false) => {
    const colorMap = {
        [CONTENT_STATUSES.DRAFT]: darkMode ? '#64748B' : '#94A3B8',
        [CONTENT_STATUSES.PENDING]: darkMode ? '#F59E0B' : '#F59E0B',
        [CONTENT_STATUSES.APPROVED]: darkMode ? '#10B981' : '#10B981',
        [CONTENT_STATUSES.PUBLISHED]: darkMode ? '#0AAEEF' : '#0AAEEF',
        [CONTENT_STATUSES.REJECTED]: darkMode ? '#EF4444' : '#EF4444',
        [CONTENT_STATUSES.CHANGES_REQUESTED]: darkMode ? '#F59E0B' : '#F59E0B',
        [CONTENT_STATUSES.SCHEDULED]: darkMode ? '#06B6D4' : '#06B6D4',
        [CONTENT_STATUSES.ARCHIVED]: darkMode ? '#64748B' : '#94A3B8'
    };
    
    return colorMap[status] || (darkMode ? '#64748B' : '#94A3B8');
};

/**
 * Get status background color for badges
 * 
 * @param {string} status - Content status
 * @param {boolean} darkMode - Whether dark mode is active
 * @returns {string} CSS background color value
 */
export const getStatusBackgroundColor = (status, darkMode = false) => {
    const bgColorMap = {
        [CONTENT_STATUSES.DRAFT]: darkMode ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.12)',
        [CONTENT_STATUSES.PENDING]: darkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        [CONTENT_STATUSES.APPROVED]: darkMode => 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.12)',
        [CONTENT_STATUSES.PUBLISHED]: darkMode ? 'rgba(10, 174, 239, 0.12)' : 'rgba(10, 174, 239, 0.12)',
        [CONTENT_STATUSES.REJECTED]: darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        [CONTENT_STATUSES.CHANGES_REQUESTED]: darkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        [CONTENT_STATUSES.SCHEDULED]: darkMode ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.12)',
        [CONTENT_STATUSES.ARCHIVED]: darkMode ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.12)'
    };
    
    return bgColorMap[status] || (darkMode ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.12)');
};