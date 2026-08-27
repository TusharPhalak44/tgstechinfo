/**
 * Frontend Service for B2B Audience Intelligence API
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

// In-memory quick cache for metadata
let cachedMetadata = null;

export const audienceService = {
  /**
   * Fetch all active taxonomies, geography hierarchies, and global settings
   */
  async getMetadata(forceRefresh = false) {
    if (cachedMetadata && !forceRefresh) {
      return cachedMetadata;
    }
    const res = await axios.get(`${API_BASE}/api/audience/metadata`);
    if (res.data?.success) {
      cachedMetadata = res.data.data;
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to load audience metadata');
  },

  /**
   * High-speed dynamic calculation of matching audience and demographic breakdowns
   */
  async getAudienceStats(filters = {}) {
    const res = await axios.post(`${API_BASE}/api/audience/stats`, filters);
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to calculate audience statistics');
  },

  /**
   * Create a shareable read-only presentation link for clients
   */
  async createShareToken(payload) {
    const res = await axios.post(`${API_BASE}/api/audience/share`, payload);
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to generate share link');
  },

  /**
   * Retrieve shared client presentation audience
   */
  async getSharedAudience(token) {
    const res = await axios.get(`${API_BASE}/api/audience/view/${token}`);
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Audience link is invalid or expired');
  },

  /**
   * Track Sales Presentation Analytics Event
   */
  async trackEvent(eventType, filters = {}, resultCount = 0) {
    try {
      await axios.post(`${API_BASE}/api/audience/track-event`, {
        event_type: eventType,
        filters_applied: filters,
        result_count: resultCount,
        session_id: window.sessionStorage?.getItem('tgs_session_id') || undefined
      });
    } catch {
      // Non-blocking
    }
  },

  // ── Admin API Functions ──

  async getAdminSettings() {
    const res = await axios.get(`${API_BASE}/api/admin/audience/settings`, { withCredentials: true });
    return res.data;
  },

  async updateAdminSettings(settings) {
    const res = await axios.put(`${API_BASE}/api/admin/audience/settings`, { settings }, { withCredentials: true });
    cachedMetadata = null;
    return res.data;
  },

  async getAdminTaxonomies() {
    const res = await axios.get(`${API_BASE}/api/admin/audience/taxonomies`, { withCredentials: true });
    return res.data?.data;
  },

  async upsertTaxonomyItem(type, data) {
    const res = await axios.post(`${API_BASE}/api/admin/audience/taxonomies/${type}`, data, { withCredentials: true });
    cachedMetadata = null;
    return res.data;
  },

  async getAdminStatistics(params = {}) {
    const res = await axios.get(`${API_BASE}/api/admin/audience/statistics`, { params, withCredentials: true });
    return res.data?.data;
  },

  async updateStatistic(id, data) {
    const res = await axios.put(`${API_BASE}/api/admin/audience/statistics/${id}`, data, { withCredentials: true });
    return res.data;
  },

  async importAudienceData(payload) {
    const res = await axios.post(`${API_BASE}/api/admin/audience/import`, payload, { withCredentials: true });
    cachedMetadata = null;
    return res.data;
  },

  async getImportHistory() {
    const res = await axios.get(`${API_BASE}/api/admin/audience/imports`, { withCredentials: true });
    return res.data?.data;
  },

  async getAuditLogs(params = {}) {
    const res = await axios.get(`${API_BASE}/api/admin/audience/audit-logs`, { params, withCredentials: true });
    return res.data?.data;
  }
};
