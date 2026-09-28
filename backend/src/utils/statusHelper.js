/**
 * Centralized Status Helper Utility
 * Provides consistent status management and validation across the application
 * This eliminates scattered status transition logic and prevents invalid states
 */

/**
 * Valid content statuses
 */
const CONTENT_STATUSES = {
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
const EDIT_REQUEST_STATUSES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
};

/**
 * Valid chatbot query statuses
 */
const CHATBOT_QUERY_STATUSES = {
    PENDING: 'pending',
    ANSWERED: 'answered',
    CLOSED: 'closed'
};

/**
 * Valid status transitions for content
 * Defines which status changes are allowed
 */
const VALID_STATUS_TRANSITIONS = {
    [CONTENT_STATUSES.DRAFT]: [
        CONTENT_STATUSES.PENDING,      // Submit for review
        CONTENT_STATUSES.PUBLISHED,    // Direct publish (admin only)
        CONTENT_STATUSES.ARCHIVED      // Archive
    ],
    [CONTENT_STATUSES.PENDING]: [
        CONTENT_STATUSES.APPROVED,     // Admin approval
        CONTENT_STATUSES.REJECTED,     // Admin rejection
        CONTENT_STATUSES.CHANGES_REQUESTED, // Admin requests changes
        CONTENT_STATUSES.DRAFT        // Return to draft
    ],
    [CONTENT_STATUSES.APPROVED]: [
        CONTENT_STATUSES.PUBLISHED,    // Publish
        CONTENT_STATUSES.SCHEDULED,    // Schedule for later
        CONTENT_STATUSES.CHANGES_REQUESTED, // Request changes after approval
        CONTENT_STATUSES.DRAFT        // Return to draft
    ],
    [CONTENT_STATUSES.PUBLISHED]: [
        CONTENT_STATUSES.ARCHIVED,     // Archive
        CONTENT_STATUSES.DRAFT        // Unpublish and edit (admin only)
    ],
    [CONTENT_STATUSES.REJECTED]: [
        CONTENT_STATUSES.DRAFT,        // Edit and resubmit
        CONTENT_STATUSES.PENDING,      // Resubmit directly
        CONTENT_STATUSES.ARCHIVED      // Archive
    ],
    [CONTENT_STATUSES.CHANGES_REQUESTED]: [
        CONTENT_STATUSES.PENDING,      // Resubmit after changes
        CONTENT_STATUSES.DRAFT,        // Continue editing
        CONTENT_STATUSES.REJECTED,     // Final rejection
        CONTENT_STATUSES.ARCHIVED      // Archive
    ],
    [CONTENT_STATUSES.SCHEDULED]: [
        CONTENT_STATUSES.PUBLISHED,    // When scheduled time arrives
        CONTENT_STATUSES.DRAFT,        // Cancel schedule
        CONTENT_STATUSES.ARCHIVED      // Archive
    ],
    [CONTENT_STATUSES.ARCHIVED]: [
        CONTENT_STATUSES.DRAFT,        // Restore to draft
        CONTENT_STATUSES.PUBLISHED     // Restore and publish (admin only)
    ]
};

/**
 * Status display properties
 * Used for consistent UI display across admin and user panels
 */
const STATUS_DISPLAY = {
    [CONTENT_STATUSES.DRAFT]: {
        label: 'Draft',
        color: 'default',
        icon: 'FileTextOutlined',
        description: 'Content is being created and not yet submitted'
    },
    [CONTENT_STATUSES.PENDING]: {
        label: 'Pending Review',
        color: 'processing',
        icon: 'ClockCircleOutlined',
        description: 'Content is waiting for admin approval'
    },
    [CONTENT_STATUSES.APPROVED]: {
        label: 'Approved',
        color: 'success',
        icon: 'CheckCircleOutlined',
        description: 'Content has been approved and ready to publish'
    },
    [CONTENT_STATUSES.PUBLISHED]: {
        label: 'Published',
        color: 'success',
        icon: 'GlobalOutlined',
        description: 'Content is live on the website'
    },
    [CONTENT_STATUSES.REJECTED]: {
        label: 'Rejected',
        color: 'error',
        icon: 'CloseCircleOutlined',
        description: 'Content was rejected by admin'
    },
    [CONTENT_STATUSES.CHANGES_REQUESTED]: {
        label: 'Changes Requested',
        color: 'warning',
        icon: 'EditOutlined',
        description: 'Admin has requested changes before approval'
    },
    [CONTENT_STATUSES.SCHEDULED]: {
        label: 'Scheduled',
        color: 'cyan',
        icon: 'CalendarOutlined',
        description: 'Content is scheduled for future publication'
    },
    [CONTENT_STATUSES.ARCHIVED]: {
        label: 'Archived',
        color: 'default',
        icon: 'InboxOutlined',
        description: 'Content is archived and not visible'
    }
};

/**
 * Edit request status display properties
 */
const EDIT_REQUEST_STATUS_DISPLAY = {
    [EDIT_REQUEST_STATUSES.PENDING]: {
        label: 'Pending',
        color: 'warning',
        description: 'Waiting for content creator to respond'
    },
    [EDIT_REQUEST_STATUSES.ACCEPTED]: {
        label: 'Accepted',
        color: 'success',
        description: 'Creator has accepted the edit request'
    },
    [EDIT_REQUEST_STATUSES.REJECTED]: {
        label: 'Rejected',
        color: 'error',
        description: 'Creator has rejected the edit request'
    },
    [EDIT_REQUEST_STATUSES.COMPLETED]: {
        label: 'Completed',
        color: 'default',
        description: 'Edit request has been completed'
    }
};

/**
 * Chatbot query status display properties
 */
const CHATBOT_QUERY_STATUS_DISPLAY = {
    [CHATBOT_QUERY_STATUSES.PENDING]: {
        label: 'Pending',
        color: 'warning',
        description: 'Waiting for admin response'
    },
    [CHATBOT_QUERY_STATUSES.ANSWERED]: {
        label: 'Answered',
        color: 'success',
        description: 'Admin has responded to the query'
    },
    [CHATBOT_QUERY_STATUSES.CLOSED]: {
        label: 'Closed',
        color: 'default',
        description: 'Query has been closed'
    }
};

/**
 * Status-based permissions
 * Defines what actions can be taken on each status
 */
const STATUS_PERMISSIONS = {
    [CONTENT_STATUSES.DRAFT]: {
        canEdit: true,
        canDelete: true,
        canSubmit: true,
        canPublish: false,
        canSchedule: false,
        canArchive: true
    },
    [CONTENT_STATUSES.PENDING]: {
        canEdit: false,  // Can only edit if changes requested
        canDelete: false,
        canSubmit: false,
        canPublish: false,
        canSchedule: false,
        canArchive: false
    },
    [CONTENT_STATUSES.APPROVED]: {
        canEdit: false,
        canDelete: false,
        canSubmit: false,
        canPublish: true,
        canSchedule: true,
        canArchive: true
    },
    [CONTENT_STATUSES.PUBLISHED]: {
        canEdit: false,  // Admin only
        canDelete: false, // Admin only
        canSubmit: false,
        canPublish: false,
        canSchedule: false,
        canArchive: true
    },
    [CONTENT_STATUSES.REJECTED]: {
        canEdit: true,
        canDelete: true,
        canSubmit: true,
        canPublish: false,
        canSchedule: false,
        canArchive: true
    },
    [CONTENT_STATUSES.CHANGES_REQUESTED]: {
        canEdit: true,
        canDelete: false,
        canSubmit: true,
        canPublish: false,
        canSchedule: false,
        canArchive: false
    },
    [CONTENT_STATUSES.SCHEDULED]: {
        canEdit: true,
        canDelete: true,
        canSubmit: false,
        canPublish: false,
        canSchedule: true,
        canArchive: true
    },
    [CONTENT_STATUSES.ARCHIVED]: {
        canEdit: true,
        canDelete: true,
        canSubmit: false,
        canPublish: false,
        canSchedule: false,
        canArchive: false
    }
};

/**
 * Validate if a status transition is allowed
 * 
 * @param {string} currentStatus - Current content status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} True if transition is valid
 */
function isValidStatusTransition(currentStatus, newStatus) {
    if (!currentStatus || !newStatus) return false;
    
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions) return false;
    
    return allowedTransitions.includes(newStatus);
}

/**
 * Check if a status is valid
 * 
 * @param {string} status - Status to validate
 * @returns {boolean} True if status is valid
 */
function isValidContentStatus(status) {
    return Object.values(CONTENT_STATUSES).includes(status);
}

/**
 * Check if an edit request status is valid
 * 
 * @param {string} status - Status to validate
 * @returns {boolean} True if status is valid
 */
function isValidEditRequestStatus(status) {
    return Object.values(EDIT_REQUEST_STATUSES).includes(status);
}

/**
 * Check if a chatbot query status is valid
 * 
 * @param {string} status - Status to validate
 * @returns {boolean} True if status is valid
 */
function isValidChatbotQueryStatus(status) {
    return Object.values(CHATBOT_QUERY_STATUSES).includes(status);
}

/**
 * Get display properties for a status
 * 
 * @param {string} status - Content status
 * @returns {Object} Display properties (label, color, icon, description)
 */
function getStatusDisplay(status) {
    return STATUS_DISPLAY[status] || {
        label: status || 'Unknown',
        color: 'default',
        icon: 'QuestionOutlined',
        description: 'Unknown status'
    };
}

/**
 * Get display properties for edit request status
 * 
 * @param {string} status - Edit request status
 * @returns {Object} Display properties
 */
function getEditRequestStatusDisplay(status) {
    return EDIT_REQUEST_STATUS_DISPLAY[status] || {
        label: status || 'Unknown',
        color: 'default',
        description: 'Unknown status'
    };
}

/**
 * Get display properties for chatbot query status
 * 
 * @param {string} status - Chatbot query status
 * @returns {Object} Display properties
 */
function getChatbotQueryStatusDisplay(status) {
    return CHATBOT_QUERY_STATUS_DISPLAY[status] || {
        label: status || 'Unknown',
        color: 'default',
        description: 'Unknown status'
    };
}

/**
 * Check if user can perform action on content based on status
 * 
 * @param {string} status - Content status
 * @param {string} action - Action to check (edit, delete, submit, publish, schedule, archive)
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {boolean} True if action is allowed
 */
function canPerformAction(status, action, isAdmin = false) {
    if (isAdmin) {
        // Admins can do almost anything
        return true;
    }
    
    const permissions = STATUS_PERMISSIONS[status];
    if (!permissions) return false;
    
    const permissionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}`;
    return permissions[permissionKey] || false;
}

/**
 * Check if content can be edited by user
 * Considers both status and edit requests
 * 
 * @param {string} status - Content status
 * @param {boolean} isAdmin - Whether user is admin
 * @param {boolean} hasPendingEditRequest - Whether there's a pending edit request
 * @returns {Object} { canEdit: boolean, reason: string }
 */
function canEditContent(status, isAdmin = false, hasPendingEditRequest = false) {
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
}

/**
 * Get next valid statuses for current status
 * 
 * @param {string} currentStatus - Current content status
 * @returns {Array} Array of valid next statuses
 */
function getNextValidStatuses(currentStatus) {
    return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if content is in a final state (cannot be changed without admin intervention)
 * 
 * @param {string} status - Content status
 * @returns {boolean} True if status is final
 */
function isFinalStatus(status) {
    return status === CONTENT_STATUSES.PUBLISHED || 
           status === CONTENT_STATUSES.ARCHIVED;
}

/**
 * Check if content is awaiting user action
 * 
 * @param {string} status - Content status
 * @returns {boolean} True if content needs user action
 */
function needsUserAction(status) {
    return status === CONTENT_STATUSES.CHANGES_REQUESTED ||
           status === CONTENT_STATUSES.REJECTED;
}

/**
 * Check if content is awaiting admin action
 * 
 * @param {string} status - Content status
 * @returns {boolean} True if content needs admin review
 */
function needsAdminAction(status) {
    return status === CONTENT_STATUSES.PENDING ||
           status === CONTENT_STATUSES.APPROVED;
}

/**
 * Get status transition with validation
 * 
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - Desired new status
 * @returns {Object} { valid: boolean, reason: string }
 */
function validateStatusTransition(currentStatus, newStatus) {
    if (!isValidContentStatus(newStatus)) {
        return { valid: false, reason: `Invalid status: ${newStatus}` };
    }
    
    if (!isValidStatusTransition(currentStatus, newStatus)) {
        return { 
            valid: false, 
            reason: `Cannot transition from '${currentStatus}' to '${newStatus}'` 
        };
    }
    
    return { valid: true, reason: 'Valid transition' };
}

module.exports = {
    // Status constants
    CONTENT_STATUSES,
    EDIT_REQUEST_STATUSES,
    CHATBOT_QUERY_STATUSES,
    
    // Display properties
    STATUS_DISPLAY,
    EDIT_REQUEST_STATUS_DISPLAY,
    CHATBOT_QUERY_STATUS_DISPLAY,
    
    // Validation functions
    isValidStatusTransition,
    isValidContentStatus,
    isValidEditRequestStatus,
    isValidChatbotQueryStatus,
    validateStatusTransition,
    
    // Display functions
    getStatusDisplay,
    getEditRequestStatusDisplay,
    getChatbotQueryStatusDisplay,
    
    // Permission functions
    canPerformAction,
    canEditContent,
    
    // Utility functions
    getNextValidStatuses,
    isFinalStatus,
    needsUserAction,
    needsAdminAction,
    STATUS_PERMISSIONS
};