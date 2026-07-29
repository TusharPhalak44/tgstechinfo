/**
 * Approval System
 * Manages approval workflow with roles (Writer, Editor, Reviewer, Publisher, Admin)
 * Pages cannot be published until approved
 */

class ApprovalSystem {
  constructor() {
    this.approvals = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.listeners = [];
    
    // Initialize default roles
    this.initializeRoles();
  }

  /**
   * Initialize default roles
   */
  initializeRoles() {
    this.roles.set('writer', {
      id: 'writer',
      name: 'Writer',
      level: 10,
      permissions: [
        'create:page',
        'edit:own:page',
        'submit:approval',
        'view:own:analytics',
      ],
    });

    this.roles.set('editor', {
      id: 'editor',
      name: 'Editor',
      level: 30,
      permissions: [
        'create:page',
        'edit:any:page',
        'submit:approval',
        'review:page',
        'reject:page',
        'view:own:analytics',
      ],
    });

    this.roles.set('reviewer', {
      id: 'reviewer',
      name: 'Reviewer',
      level: 50,
      permissions: [
        'create:page',
        'edit:any:page',
        'submit:approval',
        'review:page',
        'approve:page',
        'reject:page',
        'view:any:analytics',
      ],
    });

    this.roles.set('publisher', {
      id: 'publisher',
      name: 'Publisher',
      level: 70,
      permissions: [
        'create:page',
        'edit:any:page',
        'submit:approval',
        'review:page',
        'approve:page',
        'reject:page',
        'publish:page',
        'schedule:page',
        'view:any:analytics',
      ],
    });

    this.roles.set('admin', {
      id: 'admin',
      name: 'Admin',
      level: 100,
      permissions: [
        'create:page',
        'edit:any:page',
        'delete:any:page',
        'submit:approval',
        'review:page',
        'approve:page',
        'reject:page',
        'publish:page',
        'schedule:page',
        'archive:page',
        'manage:users',
        'manage:roles',
        'manage:workflows',
        'view:any:analytics',
      ],
    });
  }

  /**
   * Create an approval request
   * @param {Object} approval - Approval configuration
   * @returns {string} Approval ID
   */
  createApproval(approval) {
    const id = approval.id || this.generateId();
    
    const newApproval = {
      id,
      pageId: approval.pageId,
      requestedBy: approval.requestedBy,
      requestedAt: Date.now(),
      status: 'pending',
      reviewers: approval.reviewers || [],
      comments: [],
      history: [],
      requiredApprovals: approval.requiredApprovals || 1,
      currentApprovals: 0,
    };

    this.approvals.set(id, newApproval);
    this.notifyListeners('approval:created', newApproval);
    return id;
  }

  /**
   * Get an approval
   * @param {string} id - Approval ID
   * @returns {Object|null} Approval or null
   */
  getApproval(id) {
    return this.approvals.get(id) || null;
  }

  /**
   * Get approvals for a page
   * @param {string} pageId - Page ID
   * @returns {Array} Array of approvals
   */
  getApprovalsForPage(pageId) {
    return Array.from(this.approvals.values()).filter(
      approval => approval.pageId === pageId
    );
  }

  /**
   * Get pending approvals for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of approvals
   */
  getPendingApprovalsForUser(userId) {
    return Array.from(this.approvals.values()).filter(
      approval => 
        approval.status === 'pending' && 
        approval.reviewers.includes(userId)
    );
  }

  /**
   * Approve a page
   * @param {string} approvalId - Approval ID
   * @param {string} userId - User ID
   * @param {string} comment - Approval comment
   * @returns {Object} Approval result
   */
  approve(approvalId, userId, comment = '') {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    if (!approval.reviewers.includes(userId)) {
      throw new Error('User is not a reviewer');
    }

    if (approval.status !== 'pending') {
      throw new Error('Approval is not pending');
    }

    approval.currentApprovals++;
    approval.history.push({
      action: 'approve',
      userId,
      timestamp: Date.now(),
      comment,
    });

    // Check if all required approvals are met
    if (approval.currentApprovals >= approval.requiredApprovals) {
      approval.status = 'approved';
      approval.approvedAt = Date.now();
    }

    this.approvals.set(approvalId, approval);
    this.notifyListeners('approval:approved', approval);
    return approval;
  }

  /**
   * Reject a page
   * @param {string} approvalId - Approval ID
   * @param {string} userId - User ID
   * @param {string} comment - Rejection comment
   * @returns {Object} Approval result
   */
  reject(approvalId, userId, comment = '') {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    if (!approval.reviewers.includes(userId)) {
      throw new Error('User is not a reviewer');
    }

    if (approval.status !== 'pending') {
      throw new Error('Approval is not pending');
    }

    approval.status = 'rejected';
    approval.rejectedAt = Date.now();
    approval.rejectedBy = userId;
    approval.rejectionComment = comment;

    approval.history.push({
      action: 'reject',
      userId,
      timestamp: Date.now(),
      comment,
    });

    this.approvals.set(approvalId, approval);
    this.notifyListeners('approval:rejected', approval);
    return approval;
  }

  /**
   * Request changes
   * @param {string} approvalId - Approval ID
   * @param {string} userId - User ID
   * @param {string} comment - Change comment
   * @returns {Object} Approval result
   */
  requestChanges(approvalId, userId, comment = '') {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    if (!approval.reviewers.includes(userId)) {
      throw new Error('User is not a reviewer');
    }

    approval.status = 'changes_requested';
    approval.changesRequestedAt = Date.now();
    approval.changesRequestedBy = userId;

    approval.history.push({
      action: 'request_changes',
      userId,
      timestamp: Date.now(),
      comment,
    });

    this.approvals.set(approvalId, approval);
    this.notifyListeners('approval:changes_requested', approval);
    return approval;
  }

  /**
   * Resubmit for approval
   * @param {string} approvalId - Approval ID
   * @param {string} comment - Resubmission comment
   * @returns {Object} Approval result
   */
  resubmit(approvalId, comment = '') {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    if (approval.status !== 'rejected' && approval.status !== 'changes_requested') {
      throw new Error('Cannot resubmit from current status');
    }

    approval.status = 'pending';
    approval.currentApprovals = 0;
    approval.resubmittedAt = Date.now();

    approval.history.push({
      action: 'resubmit',
      timestamp: Date.now(),
      comment,
    });

    this.approvals.set(approvalId, approval);
    this.notifyListeners('approval:resubmitted', approval);
    return approval;
  }

  /**
   * Add a comment to approval
   * @param {string} approvalId - Approval ID
   * @param {string} userId - User ID
   * @param {string} comment - Comment text
   * @returns {Object} Approval result
   */
  addComment(approvalId, userId, comment) {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    approval.comments.push({
      id: this.generateId(),
      userId,
      comment,
      timestamp: Date.now(),
    });

    this.approvals.set(approvalId, approval);
    this.notifyListeners('approval:commented', approval);
    return approval;
  }

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission string
   * @returns {boolean} Has permission
   */
  hasPermission(userId, permission) {
    // In a real implementation, this would check user's role
    // For now, assume admin has all permissions
    return true;
  }

  /**
   * Get user role
   * @param {string} userId - User ID
   * @returns {Object|null} Role or null
   */
  getUserRole(userId) {
    // In a real implementation, this would fetch from user data
    return this.roles.get('admin');
  }

  /**
   * Get all roles
   * @returns {Array} Array of roles
   */
  getAllRoles() {
    return Array.from(this.roles.values());
  }

  /**
   * Get role by ID
   * @param {string} roleId - Role ID
   * @returns {Object|null} Role or null
   */
  getRole(roleId) {
    return this.roles.get(roleId) || null;
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
   * Delete an approval
   * @param {string} approvalId - Approval ID
   */
  deleteApproval(approvalId) {
    this.approvals.delete(approvalId);
    this.notifyListeners('approval:deleted', { id: approvalId });
  }

  /**
   * Get approval statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const approvals = Array.from(this.approvals.values());
    
    return {
      totalApprovals: approvals.length,
      pending: approvals.filter(a => a.status === 'pending').length,
      approved: approvals.filter(a => a.status === 'approved').length,
      rejected: approvals.filter(a => a.status === 'rejected').length,
      changesRequested: approvals.filter(a => a.status === 'changes_requested').length,
      totalRoles: this.roles.size,
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Singleton instance
const approvalSystem = new ApprovalSystem();

export default approvalSystem;
export { ApprovalSystem };
