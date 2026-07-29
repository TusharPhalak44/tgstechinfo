/**
 * Publishing Workflow Manager
 * Manages enterprise publishing workflow with configurable statuses and transitions
 * Draft → In Review → Approved → Scheduled → Published → Archived
 */

class PublishingWorkflowManager {
  constructor() {
    this.workflows = new Map();
    this.transitions = new Map();
    this.listeners = [];
    
    // Default workflow
    this.defaultWorkflow = {
      id: 'default',
      name: 'Default Workflow',
      statuses: [
        { id: 'draft', name: 'Draft', order: 1, color: '#999' },
        { id: 'in_review', name: 'In Review', order: 2, color: '#f59e0b' },
        { id: 'approved', name: 'Approved', order: 3, color: '#52c41a' },
        { id: 'scheduled', name: 'Scheduled', order: 4, color: '#1890ff' },
        { id: 'published', name: 'Published', order: 5, color: '#722ed1' },
        { id: 'archived', name: 'Archived', order: 6, color: '#8c8c8c' },
      ],
      transitions: [
        { from: 'draft', to: 'in_review', requires: 'submit' },
        { from: 'in_review', to: 'approved', requires: 'approve' },
        { from: 'in_review', to: 'draft', requires: 'reject' },
        { from: 'approved', to: 'scheduled', requires: 'schedule' },
        { from: 'approved', to: 'draft', requires: 'reject' },
        { from: 'scheduled', to: 'published', requires: 'auto' },
        { from: 'published', to: 'archived', requires: 'archive' },
        { from: 'archived', to: 'draft', requires: 'restore' },
      ],
    };

    this.workflows.set('default', this.defaultWorkflow);
    this.initializeTransitions();
  }

  /**
   * Initialize transitions from default workflow
   */
  initializeTransitions() {
    this.defaultWorkflow.transitions.forEach(transition => {
      const key = `${transition.from}:${transition.to}`;
      this.transitions.set(key, transition);
    });
  }

  /**
   * Create a custom workflow
   * @param {Object} workflow - Workflow configuration
   * @returns {string} Workflow ID
   */
  createWorkflow(workflow) {
    const id = workflow.id || this.generateId();
    
    const newWorkflow = {
      id,
      name: workflow.name || 'Custom Workflow',
      statuses: workflow.statuses || this.defaultWorkflow.statuses,
      transitions: workflow.transitions || this.defaultWorkflow.transitions,
      createdAt: Date.now(),
    };

    this.workflows.set(id, newWorkflow);

    // Update transitions
    newWorkflow.transitions.forEach(transition => {
      const key = `${transition.from}:${transition.to}`;
      this.transitions.set(key, transition);
    });

    this.notifyListeners('workflow:created', newWorkflow);
    return id;
  }

  /**
   * Get a workflow
   * @param {string} id - Workflow ID
   * @returns {Object|null} Workflow or null
   */
  getWorkflow(id) {
    return this.workflows.get(id) || null;
  }

  /**
   * Get all workflows
   * @returns {Array} Array of workflows
   */
  getAllWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Update a workflow
   * @param {string} id - Workflow ID
   * @param {Object} updates - Updates to apply
   */
  updateWorkflow(id, updates) {
    const workflow = this.workflows.get(id);
    if (!workflow) return;

    Object.assign(workflow, updates);
    this.notifyListeners('workflow:updated', workflow);
  }

  /**
   * Delete a workflow
   * @param {string} id - Workflow ID
   */
  deleteWorkflow(id) {
    if (id === 'default') {
      throw new Error('Cannot delete default workflow');
    }

    this.workflows.delete(id);
    this.notifyListeners('workflow:deleted', { id });
  }

  /**
   * Get workflow statuses
   * @param {string} workflowId - Workflow ID
   * @returns {Array} Array of statuses
   */
  getStatuses(workflowId = 'default') {
    const workflow = this.workflows.get(workflowId);
    return workflow ? workflow.statuses : [];
  }

  /**
   * Get status by ID
   * @param {string} statusId - Status ID
   * @param {string} workflowId - Workflow ID
   * @returns {Object|null} Status or null
   */
  getStatus(statusId, workflowId = 'default') {
    const statuses = this.getStatuses(workflowId);
    return statuses.find(s => s.id === statusId) || null;
  }

  /**
   * Get next statuses for a current status
   * @param {string} currentStatus - Current status ID
   * @param {string} workflowId - Workflow ID
   * @returns {Array} Array of next statuses
   */
  getNextStatuses(currentStatus, workflowId = 'default') {
    const nextStatuses = [];
    
    this.transitions.forEach((transition, key) => {
      if (transition.from === currentStatus) {
        const status = this.getStatus(transition.to, workflowId);
        if (status) {
          nextStatuses.push({
            ...status,
            requires: transition.requires,
          });
        }
      }
    });

    return nextStatuses.sort((a, b) => a.order - b.order);
  }

  /**
   * Check if transition is allowed
   * @param {string} fromStatus - From status ID
   * @param {string} toStatus - To status ID
   * @returns {boolean} Transition allowed
   */
  isTransitionAllowed(fromStatus, toStatus) {
    const key = `${fromStatus}:${toStatus}`;
    return this.transitions.has(key);
  }

  /**
   * Get transition requirement
   * @param {string} fromStatus - From status ID
   * @param {string} toStatus - To status ID
   * @returns {string|null} Requirement or null
   */
  getTransitionRequirement(fromStatus, toStatus) {
    const key = `${fromStatus}:${toStatus}`;
    const transition = this.transitions.get(key);
    return transition ? transition.requires : null;
  }

  /**
   * Transition page status
   * @param {string} pageId - Page ID
   * @param {string} toStatus - Target status
   * @param {Object} context - Transition context
   * @returns {Promise<Object>} Transition result
   */
  async transitionStatus(pageId, toStatus, context = {}) {
    // Get current status (would come from page data)
    const currentStatus = context.currentStatus || 'draft';

    if (!this.isTransitionAllowed(currentStatus, toStatus)) {
      throw new Error(`Transition from ${currentStatus} to ${toStatus} is not allowed`);
    }

    const requirement = this.getTransitionRequirement(currentStatus, toStatus);
    
    // Check if requirement is met
    if (requirement && !context[requirement]) {
      throw new Error(`Transition requires: ${requirement}`);
    }

    // Perform transition
    const result = {
      pageId,
      fromStatus: currentStatus,
      toStatus,
      timestamp: Date.now(),
      user: context.user,
      notes: context.notes,
    };

    this.notifyListeners('status:transitioned', result);
    return result;
  }

  /**
   * Get workflow statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalWorkflows: this.workflows.size,
      totalTransitions: this.transitions.size,
      workflows: Array.from(this.workflows.keys()),
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
const publishingWorkflowManager = new PublishingWorkflowManager();

export default publishingWorkflowManager;
export { PublishingWorkflowManager };
