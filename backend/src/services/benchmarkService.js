const https = require('https');
const { URL } = require('url');

/**
 * Benchmark Email Service
 * Handles syncing contacts to Benchmark Email Contact Lists for:
 * 1. General Newsletter Subscription
 * 2. Content Category-wise Subscription
 * 3. Particular Content Updates Subscription
 *
 * Benchmark's web Automations / Autoresponders then automatically
 * trigger and shoot the respective welcome / marketing emails.
 */
class BenchmarkService {
    /**
     * Check if Benchmark API is configured
     */
    static isConfigured() {
        const apiKey = (process.env.BENCHMARK_API_KEY || '').trim();
        return Boolean(apiKey && !apiKey.includes('placeholder') && apiKey.length > 5);
    }

    /**
     * Get API base URL
     */
    static getBaseUrl() {
        return (process.env.BENCHMARK_API_BASE_URL || 'https://clientapi.benchmarkemail.com').replace(/\/+$/, '');
    }

    /**
     * Get API Key / AuthToken
     */
    static getApiKey() {
        return (process.env.BENCHMARK_API_KEY || '').trim();
    }

    /**
     * Low-level HTTPS helper for Benchmark Email REST API v3
     */
    static async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.isConfigured()) {
            throw new Error('Benchmark API key is not configured in environment variables.');
        }

        const baseUrl = this.getBaseUrl();
        const fullUrl = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, baseUrl);
        const apiKey = this.getApiKey();

        return new Promise((resolve, reject) => {
            const payload = data ? JSON.stringify(data) : null;
            const headers = {
                'AuthToken': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (payload) {
                headers['Content-Length'] = Buffer.byteLength(payload);
            }

            const req = https.request(fullUrl, {
                method,
                headers,
                timeout: 10000
            }, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    let parsed = null;
                    try {
                        parsed = responseBody ? JSON.parse(responseBody) : {};
                    } catch (_) {
                        parsed = { raw: responseBody };
                    }

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, statusCode: res.statusCode, data: parsed });
                    } else {
                        const errorMsg = parsed?.detail || parsed?.title || parsed?.message || `HTTP ${res.statusCode}`;
                        resolve({ success: false, statusCode: res.statusCode, error: errorMsg, details: parsed });
                    }
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Benchmark API request timed out after 10000ms'));
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (payload) {
                req.write(payload);
            }
            req.end();
        });
    }

    /**
     * Retrieve all Contact Lists from Benchmark
     * Useful for checking connection and verifying List IDs
     */
    static async getContactLists() {
        try {
            console.log('[BenchmarkService] Fetching contact lists...');
            const result = await this.makeRequest('/Contact/', 'GET');
            return result;
        } catch (err) {
            console.error('[BenchmarkService] getContactLists error:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Add or update a contact in a specific Benchmark List
     * @param {Object} params
     * @param {string|number} params.listId - Benchmark List ID
     * @param {string} params.email - Recipient email
     * @param {string} [params.firstName] - First name
     * @param {string} [params.lastName] - Last name
     * @param {Object} [params.customFields] - Optional extra fields
     */
    static async addContactToList({ listId, email, firstName = '', lastName = '', customFields = {} }) {
        if (!listId) {
            return { success: false, error: 'Benchmark List ID is required.' };
        }
        if (!email || !email.includes('@')) {
            return { success: false, error: 'Valid email address is required.' };
        }

        const cleanEmail = email.trim().toLowerCase();
        const payload = {
            Data: {
                Email: cleanEmail,
                FirstName: (firstName || '').trim(),
                LastName: (lastName || '').trim(),
                EmailPerm: '1',
                ...customFields
            }
        };

        try {
            console.log(`[BenchmarkService] Syncing contact ${cleanEmail} to List #${listId}...`);
            const endpoint = `/Contact/${listId}/ContactDetails`;
            const result = await this.makeRequest(endpoint, 'POST', payload);

            const isStatusSuccess = String(result?.data?.Response?.Status) === '1';
            const hasErrors = result?.data?.Response?.Errors && result.data.Response.Errors.length > 0;

            if (result.success && isStatusSuccess && !hasErrors) {
                console.log(`[BenchmarkService] ✅ Contact ${cleanEmail} successfully synced to List #${listId} (ContactID: ${result.data?.Response?.Data?.ID})`);
                return { success: true, contactId: result.data?.Response?.Data?.ID, details: result.data };
            } else {
                const errMsg = result?.data?.Response?.Errors?.[0]?.Message || result.error || 'Failed to sync contact';
                console.warn(`[BenchmarkService] ⚠️ Sync contact warning for ${cleanEmail} on List #${listId}:`, errMsg);
                return { success: false, error: errMsg, details: result.data };
            }
        } catch (err) {
            console.error(`[BenchmarkService] Failed to sync contact ${cleanEmail} to List #${listId}:`, err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Determine destination List ID based on subscription type
     * Flow A: General Newsletter routes to Benchmark General Welcome List.
     * Category and Content subscriptions only route to Benchmark if separate dedicated lists are defined,
     * preventing Benchmark's generic welcome automation from mistakenly firing on Category subscribers.
     */
    static resolveListId({ interestType, interestValue, source }) {
        const generalListId = (process.env.BENCHMARK_LIST_ID_GENERAL || process.env.BENCHMARK_LIST_ID || '').trim();
        const categoryListId = (process.env.BENCHMARK_LIST_ID_CATEGORY || '').trim();
        const contentListId = (process.env.BENCHMARK_LIST_ID_CONTENT || '').trim();

        if (interestType === 'content' || source === 'content_detail') {
            return contentListId || null;
        }

        if (interestType === 'technology' || interestType === 'industry' || interestType === 'category' || interestType === 'tag') {
            return categoryListId || null;
        }

        return generalListId;
    }

    /**
     * High-level sync helper for website subscriptions
     * Safely pushes the subscriber to Benchmark without crashing the caller
     */
    static async syncSubscriber({ email, name, interestType = 'general', interestValue = 'all', source = 'homepage', contentTitle = '' }) {
        if (!this.isConfigured()) {
            console.log('[BenchmarkService] Benchmark sync skipped: API key not configured.');
            return { success: false, skipped: true, reason: 'not_configured' };
        }

        const targetListId = this.resolveListId({ interestType, interestValue, source });
        if (!targetListId) {
            console.warn('[BenchmarkService] Benchmark sync skipped: No target List ID defined in environment.');
            return { success: false, skipped: true, reason: 'no_list_id_defined' };
        }

        // Parse Name into First and Last Name
        let firstName = '';
        let lastName = '';
        if (name && typeof name === 'string') {
            const parts = name.trim().split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        }

        // Prepare Category / Content dynamic name for Benchmark Field18 ("Notes")
        let topicDisplay = 'Enterprise Technology';
        if (contentTitle && contentTitle.trim()) {
            topicDisplay = contentTitle.trim();
        } else if (interestValue && interestValue !== 'all' && interestValue !== 'general') {
            topicDisplay = interestValue.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        const customFields = {
            Field18: topicDisplay
        };

        const syncResult = await this.addContactToList({
            listId: targetListId,
            email,
            firstName,
            lastName,
            customFields
        });

        return {
            ...syncResult,
            listId: targetListId,
            topicDisplay
        };
    }

    /**
     * High-level sync helper for newly registered website users
     */
    static async syncRegisteredUser({ email, firstName, lastName, company, jobTitle, country }) {
        if (!this.isConfigured()) {
            console.log('[BenchmarkService] Benchmark registration sync skipped: API key not configured.');
            return { success: false, skipped: true, reason: 'not_configured' };
        }

        const targetListId = (process.env.BENCHMARK_LIST_ID_GENERAL || process.env.BENCHMARK_LIST_ID || '').trim();
        if (!targetListId) {
            console.warn('[BenchmarkService] Benchmark registration sync skipped: No target List ID defined in environment.');
            return { success: false, skipped: true, reason: 'no_list_id_defined' };
        }

        const customFields = {};
        if (company) customFields.Field1 = company;
        if (jobTitle) customFields.Field2 = jobTitle;
        if (country) customFields.Country = country;

        const syncResult = await this.addContactToList({
            listId: targetListId,
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            customFields
        });

        return {
            ...syncResult,
            listId: targetListId
        };
    }
}

module.exports = BenchmarkService;
