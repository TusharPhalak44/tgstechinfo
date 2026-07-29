/**
 * API & Webhooks Manager
 * Supports incoming webhooks, outgoing webhooks, REST API, future GraphQL compatibility
 */

class APIWebhooksManager {
  constructor() {
    this.incomingWebhooks = new Map();
    this.outgoingWebhooks = new Map();
    this.apiEndpoints = new Map();
    this.listeners = [];
  }

  /**
   * Register incoming webhook
   * @param {Object} webhook - Webhook configuration
   * @returns {string} Webhook ID
   */
  registerIncomingWebhook(webhook) {
    const id = webhook.id || this.generateId();
    
    const newWebhook = {
      id,
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events || [],
      headers: webhook.headers || {},
      enabled: webhook.enabled !== undefined ? webhook.enabled : true,
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
    };

    this.incomingWebhooks.set(id, newWebhook);
    this.notifyListeners('webhook:registered', newWebhook);
    return id;
  }

  /**
   * Register outgoing webhook
   * @param {Object} webhook - Webhook configuration
   * @returns {string} Webhook ID
   */
  registerOutgoingWebhook(webhook) {
    const id = webhook.id || this.generateId();
    
    const newWebhook = {
      id,
      name: webhook.name,
      url: webhook.url,
      method: webhook.method || 'POST',
      headers: webhook.headers || {},
      bodyTemplate: webhook.bodyTemplate || {},
      events: webhook.events || [],
      enabled: webhook.enabled !== undefined ? webhook.enabled : true,
      retryCount: webhook.retryCount || 3,
      timeout: webhook.timeout || 5000,
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
      successCount: 0,
      failureCount: 0,
    };

    this.outgoingWebhooks.set(id, newWebhook);
    this.notifyListeners('webhook:registered', newWebhook);
    return id;
  }

  /**
   * Trigger incoming webhook
   * @param {string} webhookId - Webhook ID
   * @param {Object} payload - Webhook payload
   * @returns {Promise<Object>} Trigger result
   */
  async triggerIncomingWebhook(webhookId, payload) {
    const webhook = this.incomingWebhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.enabled) {
      throw new Error('Webhook is disabled');
    }

    webhook.lastTriggered = Date.now();
    webhook.triggerCount++;
    this.incomingWebhooks.set(webhookId, webhook);

    this.notifyListeners('webhook:triggered', { webhookId, payload });
    return { success: true, webhookId };
  }

  /**
   * Trigger outgoing webhook
   * @param {string} webhookId - Webhook ID
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} Trigger result
   */
  async triggerOutgoingWebhook(webhookId, data) {
    const webhook = this.outgoingWebhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.enabled) {
      throw new Error('Webhook is disabled');
    }

    webhook.lastTriggered = Date.now();
    webhook.triggerCount++;

    try {
      // Prepare request
      const body = this.prepareWebhookBody(webhook.bodyTemplate, data);
      
      // Send request (placeholder for actual fetch)
      const response = await this.sendWebhookRequest(webhook, body);
      
      webhook.successCount++;
      this.outgoingWebhooks.set(webhookId, webhook);
      
      this.notifyListeners('webhook:triggered', { webhookId, data, response });
      return { success: true, webhookId, response };
    } catch (error) {
      webhook.failureCount++;
      this.outgoingWebhooks.set(webhookId, webhook);
      
      this.notifyListeners('webhook:failed', { webhookId, error });
      throw error;
    }
  }

  /**
   * Trigger webhooks by event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  async triggerWebhooksByEvent(event, data) {
    const outgoingWebhooks = Array.from(this.outgoingWebhooks.values()).filter(
      webhook => webhook.enabled && webhook.events.includes(event)
    );

    const results = await Promise.allSettled(
      outgoingWebhooks.map(webhook => this.triggerOutgoingWebhook(webhook.id, data))
    );

    return results;
  }

  /**
   * Prepare webhook body from template
   * @param {Object} template - Body template
   * @param {Object} data - Data to merge
   * @returns {Object} Prepared body
   */
  prepareWebhookBody(template, data) {
    return { ...template, ...data };
  }

  /**
   * Send webhook request (placeholder)
   * @param {Object} webhook - Webhook configuration
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response
   */
  async sendWebhookRequest(webhook, body) {
    // Placeholder for actual fetch implementation
    return { status: 200, data: body };
  }

  /**
   * Register API endpoint
   * @param {Object} endpoint - Endpoint configuration
   * @returns {string} Endpoint ID
   */
  registerAPIEndpoint(endpoint) {
    const id = endpoint.id || this.generateId();
    
    const newEndpoint = {
      id,
      path: endpoint.path,
      method: endpoint.method || 'GET',
      handler: endpoint.handler,
      authRequired: endpoint.authRequired !== undefined ? endpoint.authRequired : true,
      rateLimit: endpoint.rateLimit || 100,
      createdAt: Date.now(),
    };

    this.apiEndpoints.set(id, newEndpoint);
    this.notifyListeners('endpoint:registered', newEndpoint);
    return id;
  }

  /**
   * Get incoming webhook
   * @param {string} id - Webhook ID
   * @returns {Object|null} Webhook or null
   */
  getIncomingWebhook(id) {
    return this.incomingWebhooks.get(id) || null;
  }

  /**
   * Get outgoing webhook
   * @param {string} id - Webhook ID
   * @returns {Object|null} Webhook or null
   */
  getOutgoingWebhook(id) {
    return this.outgoingWebhooks.get(id) || null;
  }

  /**
   * Get all incoming webhooks
   * @returns {Array} Array of webhooks
   */
  getAllIncomingWebhooks() {
    return Array.from(this.incomingWebhooks.values());
  }

  /**
   * Get all outgoing webhooks
   * @returns {Array} Array of webhooks
   */
  getAllOutgoingWebhooks() {
    return Array.from(this.outgoingWebhooks.values());
  }

  /**
   * Update webhook
   * @param {string} id - Webhook ID
   * @param {string} type - Webhook type (incoming/outgoing)
   * @param {Object} updates - Updates to apply
   */
  updateWebhook(id, type, updates) {
    const webhooks = type === 'incoming' ? this.incomingWebhooks : this.outgoingWebhooks;
    const webhook = webhooks.get(id);
    if (!webhook) return;

    Object.assign(webhook, updates);
    webhooks.set(id, webhook);
    this.notifyListeners('webhook:updated', webhook);
  }

  /**
   * Delete webhook
   * @param {string} id - Webhook ID
   * @param {string} type - Webhook type (incoming/outgoing)
   */
  deleteWebhook(id, type) {
    const webhooks = type === 'incoming' ? this.incomingWebhooks : this.outgoingWebhooks;
    webhooks.delete(id);
    this.notifyListeners('webhook:deleted', { id, type });
  }

  /**
   * Toggle webhook enabled state
   * @param {string} id - Webhook ID
   * @param {string} type - Webhook type (incoming/outgoing)
   */
  toggleWebhook(id, type) {
    const webhooks = type === 'incoming' ? this.incomingWebhooks : this.outgoingWebhooks;
    const webhook = webhooks.get(id);
    if (!webhook) return;

    webhook.enabled = !webhook.enabled;
    webhooks.set(id, webhook);
    this.notifyListeners('webhook:toggled', webhook);
  }

  /**
   * Get webhook statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const incoming = Array.from(this.incomingWebhooks.values());
    const outgoing = Array.from(this.outgoingWebhooks.values());
    
    return {
      totalIncoming: incoming.length,
      totalOutgoing: outgoing.length,
      enabledIncoming: incoming.filter(w => w.enabled).length,
      enabledOutgoing: outgoing.filter(w => w.enabled).length,
      totalTriggers: incoming.reduce((sum, w) => sum + w.triggerCount, 0) +
                       outgoing.reduce((sum, w) => sum + w.triggerCount, 0),
      totalSuccess: outgoing.reduce((sum, w) => sum + w.successCount, 0),
      totalFailures: outgoing.reduce((sum, w) => sum + w.failureCount, 0),
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const apiWebhooksManager = new APIWebhooksManager();
export default apiWebhooksManager;
