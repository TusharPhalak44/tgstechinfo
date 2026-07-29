/**
 * Comments & Collaboration Manager
 * Google Docs-style commenting with comment, reply, resolve, mention, assign, highlight elements
 */

class CommentsCollaborationManager {
  constructor() {
    this.comments = new Map();
    this.threads = new Map();
    this.listeners = [];
  }

  /**
   * Add a comment
   * @param {Object} comment - Comment configuration
   * @returns {string} Comment ID
   */
  addComment(comment) {
    const id = comment.id || this.generateId();
    
    const newComment = {
      id,
      pageId: comment.pageId,
      nodeId: comment.nodeId || null,
      userId: comment.userId,
      userName: comment.userName,
      content: comment.content,
      mentions: comment.mentions || [],
      assignedTo: comment.assignedTo || null,
      status: comment.status || 'open', // open, resolved
      resolvedBy: null,
      resolvedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now,
      replies: [],
    };

    this.comments.set(id, newComment);
    this.notifyListeners('comment:added', newComment);
    return id;
  }

  /**
   * Reply to a comment
   * @param {string} commentId - Comment ID
   * @param {Object} reply - Reply configuration
   * @returns {string} Reply ID
   */
  addReply(commentId, reply) {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const replyId = this.generateId();
    const newReply = {
      id: replyId,
      userId: reply.userId,
      userName: reply.userName,
      content: reply.content,
      mentions: reply.mentions || [],
      createdAt: Date.now(),
    };

    comment.replies.push(newReply);
    comment.updatedAt = Date.now();
    this.comments.set(commentId, comment);
    this.notifyListeners('comment:replied', { commentId, reply: newReply });
    return replyId;
  }

  /**
   * Resolve a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID resolving the comment
   */
  resolveComment(commentId, userId) {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.status = 'resolved';
    comment.resolvedBy = userId;
    comment.resolvedAt = Date.now();
    comment.updatedAt = Date.now();
    this.comments.set(commentId, comment);
    this.notifyListeners('comment:resolved', comment);
  }

  /**
   * Reopen a comment
   * @param {string} commentId - Comment ID
   */
  reopenComment(commentId) {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.status = 'open';
    comment.resolvedBy = null;
    comment.resolvedAt = null;
    comment.updatedAt = Date.now();
    this.comments.set(commentId, comment);
    this.notifyListeners('comment:reopened', comment);
  }

  /**
   * Assign a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID to assign to
   */
  assignComment(commentId, userId) {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.assignedTo = userId;
    comment.updatedAt = Date.now();
    this.comments.set(commentId, comment);
    this.notifyListeners('comment:assigned', comment);
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   */
  deleteComment(commentId) {
    this.comments.delete(commentId);
    this.notifyListeners('comment:deleted', { commentId });
  }

  /**
   * Delete a reply
   * @param {string} commentId - Comment ID
   * @param {string} replyId - Reply ID
   */
  deleteReply(commentId, replyId) {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    const index = comment.replies.findIndex(r => r.id === replyId);
    if (index > -1) {
      comment.replies.splice(index, 1);
      comment.updatedAt = Date.now();
      this.comments.set(commentId, comment);
      this.notifyListeners('reply:deleted', { commentId, replyId });
    }
  }

  /**
   * Get a comment
   * @param {string} id - Comment ID
   * @returns {Object|null} Comment or null
   */
  getComment(id) {
    return this.comments.get(id) || null;
  }

  /**
   * Get comments for a page
   * @param {string} pageId - Page ID
   * @returns {Array} Array of comments
   */
  getCommentsForPage(pageId) {
    return Array.from(this.comments.values()).filter(
      comment => comment.pageId === pageId
    ).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get comments for a node
   * @param {string} nodeId - Node ID
   * @returns {Array} Array of comments
   */
  getCommentsForNode(nodeId) {
    return Array.from(this.comments.values()).filter(
      comment => comment.nodeId === nodeId
    );
  }

  /**
   * Get comments for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of comments
   */
  getCommentsForUser(userId) {
    return Array.from(this.comments.values()).filter(
      comment => comment.userId === userId || comment.assignedTo === userId
    );
  }

  /**
   * Get comments assigned to user
   * @param {string} userId - User ID
   * @returns {Array} Array of comments
   */
  getAssignedComments(userId) {
    return Array.from(this.comments.values()).filter(
      comment => comment.assignedTo === userId && comment.status === 'open'
    );
  }

  /**
   * Get comments mentioning user
   * @param {string} userId - User ID
   * @returns {Array} Array of comments
   */
  getMentionedComments(userId) {
    return Array.from(this.comments.values()).filter(
      comment => comment.mentions.includes(userId)
    );
  }

  /**
   * Get unresolved comments
   * @param {string} pageId - Page ID (optional)
   * @returns {Array} Array of unresolved comments
   */
  getUnresolvedComments(pageId = null) {
    const comments = Array.from(this.comments.values()).filter(
      comment => comment.status === 'open'
    );

    if (pageId) {
      return comments.filter(comment => comment.pageId === pageId);
    }

    return comments;
  }

  /**
   * Update comment content
   * @param {string} commentId - Comment ID
   * @param {string} content - New content
   */
  updateComment(commentId, content) {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    comment.content = content;
    comment.updatedAt = Date.now();
    this.comments.set(commentId, comment);
    this.notifyListeners('comment:updated', comment);
  }

  /**
   * Highlight an element for comment
   * @param {string} nodeId - Node ID
   * @param {string} commentId - Comment ID
   */
  highlightElement(nodeId, commentId) {
    this.notifyListeners('element:highlighted', { nodeId, commentId });
  }

  /**
   * Remove element highlight
   * @param {string} nodeId - Node ID
   */
  removeHighlight(nodeId) {
    this.notifyListeners('highlight:removed', { nodeId });
  }

  /**
   * Get comment statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const comments = Array.from(this.comments.values());
    
    return {
      totalComments: comments.length,
      open: comments.filter(c => c.status === 'open').length,
      resolved: comments.filter(c => c.status === 'resolved').length,
      assigned: comments.filter(c => c.assignedTo).length,
      totalReplies: comments.reduce((sum, c) => sum + c.replies.length, 0),
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const commentsCollaborationManager = new CommentsCollaborationManager();
export default commentsCollaborationManager;
