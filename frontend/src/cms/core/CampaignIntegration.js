/**
 * Campaign Integration Manager
 * Links landing page to campaign, lead form, email, CRM, analytics, webhook
 */

class CampaignIntegrationManager {
  constructor() {
    this.campaigns = new Map();
    this.pageCampaigns = new Map();
    this.listeners = [];
  }

  /**
   * Create a campaign
   * @param {Object} campaign - Campaign configuration
   * @returns {string} Campaign ID
   */
  createCampaign(campaign) {
    const id = campaign.id || this.generateId();
    
    const newCampaign = {
      id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type || 'lead_generation', // lead_generation, brand_awareness, product_launch, webinar, event
      status: campaign.status || 'active',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget || 0,
      channels: campaign.channels || [], // email, social, paid, organic
      landingPages: campaign.landingPages || [],
      leadForms: campaign.leadForms || [],
      emailSequences: campaign.emailSequences || [],
      crmIntegrations: campaign.crmIntegrations || [],
      analytics: campaign.analytics || {},
      webhooks: campaign.webhooks || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.campaigns.set(id, newCampaign);
    this.notifyListeners('campaign:created', newCampaign);
    return id;
  }

  /**
   * Get a campaign
   * @param {string} id - Campaign ID
   * @returns {Object|null} Campaign or null
   */
  getCampaign(id) {
    return this.campaigns.get(id) || null;
  }

  /**
   * Get all campaigns
   * @returns {Array} Array of campaigns
   */
  getAllCampaigns() {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get active campaigns
   * @returns {Array} Array of active campaigns
   */
  getActiveCampaigns() {
    const now = Date.now();
    return Array.from(this.campaign.values()).filter(
      campaign => 
        campaign.status === 'active' &&
        new Date(campaign.startDate).getTime() <= now &&
        (!campaign.endDate || new Date(campaign.endDate).getTime() >= now)
    );
  }

  /**
   * Update campaign
   * @param {string} id - Campaign ID
   * @param {Object} updates - Updates to apply
   */
  updateCampaign(id, updates) {
    const campaign = this.campaigns.get(id);
    if (!campaign) return;

    Object.assign(campaign, updates);
    campaign.updatedAt = Date.now();
    this.campaigns.set(id, campaign);
    this.notifyListeners('campaign:updated', campaign);
  }

  /**
   * Delete campaign
   * @param {string} id - Campaign ID
   */
  deleteCampaign(id) {
    this.campaigns.delete(id);
    this.notifyListeners('campaign:deleted', { id });
  }

  /**
   * Link page to campaign
   * @param {string} pageId - Page ID
   * @param {string} campaignId - Campaign ID
   */
  linkPageToCampaign(pageId, campaignId) {
    if (!this.pageCampaigns.has(pageId)) {
      this.pageCampaigns.set(pageId, []);
    }

    const campaigns = this.pageCampaigns.get(pageId);
    if (!campaigns.includes(campaignId)) {
      campaigns.push(campaignId);
      this.pageCampaigns.set(pageId, campaigns);
      this.notifyListeners('page:linked_to_campaign', { pageId, campaignId });
    }
  }

  /**
   * Unlink page from campaign
   * @param {string} pageId - Page ID
   * @param {string} campaignId - Campaign ID
   */
  unlinkPageFromCampaign(pageId, campaignId) {
    const campaigns = this.pageCampaigns.get(pageId);
    if (campaigns) {
      const index = campaigns.indexOf(campaignId);
      if (index > -1) {
        campaigns.splice(index, 1);
        this.pageCampaigns.set(pageId, campaigns);
        this.notifyListeners('page:unlinked_from_campaign', { pageId, campaignId });
      }
    }
  }

  /**
   * Get campaigns for a page
   * @param {string} pageId - Page ID
   * @returns {Array} Array of campaigns
   */
  getCampaignsForPage(pageId) {
    const campaignIds = this.pageCampaigns.get(pageId) || [];
    return campaignIds
      .map(id => this.campaigns.get(id))
      .filter(Boolean);
  }

  /**
   * Add landing page to campaign
   * @param {string} campaignId - Campaign ID
   * @param {string} pageId - Page ID
   */
  addLandingPage(campaignId, pageId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    if (!campaign.landingPages.includes(pageId)) {
      campaign.landingPages.push(pageId);
      campaign.updatedAt = Date.now();
      this.campaigns.set(campaignId, campaign);
      this.notifyListeners('landing_page:added', { campaignId, pageId });
    }
  }

  /**
   * Add lead form to campaign
   * @param {string} campaignId - Campaign ID
   * @param {string} formId - Form ID
   */
  addLeadForm(campaignId, formId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    if (!campaign.leadForms.includes(formId)) {
      campaign.leadForms.push(formId);
      campaign.updatedAt = Date.now();
      this.campaigns.set(campaignId, campaign);
      this.notifyListeners('lead_form:added', { campaignId, formId });
    }
  }

  /**
   * Add email sequence to campaign
   * @param {string} campaignId - Campaign ID
   * @param {string} sequenceId - Sequence ID
   */
  addEmailSequence(campaignId, sequenceId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    if (!campaign.emailSequences.includes(sequenceId)) {
      campaign.emailSequences.push(sequenceId);
      campaign.updatedAt = Date.now();
      this.campaigns.set(campaignId, campaign);
      this.notifyListeners('email_sequence:added', { campaignId, sequenceId });
    }
  }

  /**
   * Add CRM integration to campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} integration - CRM integration
   */
  addCRMIntegration(campaignId, integration) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    campaign.crmIntegrations.push({
      id: this.generateId(),
      ...integration,
      addedAt: Date.now(),
    });
    campaign.updatedAt = Date.now();
    this.campaigns.set(campaignId, campaign);
    this.notifyListeners('crm:integration_added', { campaignId, integration });
  }

  /**
   * Update campaign analytics
   * @param {string} campaignId - Campaign ID
   * @param {Object} analytics - Analytics data
   */
  updateAnalytics(campaignId, analytics) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    campaign.analytics = { ...campaign.analytics, ...analytics };
    campaign.updatedAt = Date.now();
    this.campaigns.set(campaignId, campaign);
    this.notifyListeners('analytics:updated', { campaignId, analytics });
  }

  /**
   * Get campaign performance
   * @param {string} campaignId - Campaign ID
   * @returns {Object} Performance data
   */
  getCampaignPerformance(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    return {
      campaignId,
      name: campaign.name,
      status: campaign.status,
      landingPages: campaign.landingPages.length,
      leadForms: campaign.leadForms.length,
      emailSequences: campaign.emailSequences.length,
      analytics: campaign.analytics,
    };
  }

  /**
   * Get campaign statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const campaigns = Array.from(this.campaigns.values());
    
    return {
      totalCampaigns: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      byType: {
        lead_generation: campaigns.filter(c => c.type === 'lead_generation').length,
        brand_awareness: campaigns.filter(c => c.type === 'brand_awareness').length,
        product_launch: campaigns.filter(c => c.type === 'product_launch').length,
        webinar: campaigns.filter(c => c.type === 'webinar').length,
        event: campaigns.filter(c => c.type === 'event').length,
      },
      totalLandingPages: campaigns.reduce((sum, c) => sum + c.landingPages.length, 0),
      totalLeadForms: campaigns.reduce((sum, c) => sum + c.leadForms.length, 0),
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const campaignIntegrationManager = new CampaignIntegrationManager();
export default campaignIntegrationManager;
