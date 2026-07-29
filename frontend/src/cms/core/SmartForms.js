/**
 * Smart Forms Manager
 * AI suggests required fields, optional fields, validation, consent text, privacy notice, webhook mapping, CRM mapping, conditional logic
 */

class SmartFormsManager {
  constructor() {
    this.forms = new Map();
    this.fieldTemplates = new Map();
    this.listeners = [];
    
    this.initializeFieldTemplates();
  }

  /**
   * Initialize field templates
   */
  initializeFieldTemplates() {
    this.fieldTemplates.set('contact', {
      name: 'Contact Form',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ],
    });

    this.fieldTemplates.set('newsletter', {
      name: 'Newsletter Signup',
      fields: [
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'name', label: 'First Name', type: 'text', required: false },
      ],
    });

    this.fieldTemplates.set('lead_gen', {
      name: 'Lead Generation',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'company', label: 'Company', type: 'text', required: false },
        { name: 'role', label: 'Job Title', type: 'text', required: false },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
      ],
    });

    this.fieldTemplates.set('survey', {
      name: 'Survey',
      fields: [
        { name: 'satisfaction', label: 'Satisfaction Rating', type: 'rating', required: true },
        { name: 'feedback', label: 'Feedback', type: 'textarea', required: true },
        { name: 'recommend', label: 'Would you recommend us?', type: 'select', options: ['Yes', 'No', 'Maybe'], required: true },
      ],
    });
  }

  /**
   * Create a smart form
   * @param {Object} form - Form configuration
   * @returns {string} Form ID
   */
  createForm(form) {
    const id = form.id || this.generateId();
    
    const newForm = {
      id,
      name: form.name,
      description: form.description,
      fields: form.fields || [],
      consentText: form.consentText || 'I agree to the privacy policy',
      privacyNotice: form.privacyNotice || '',
      webhookMapping: form.webhookMapping || {},
      crmMapping: form.crmMapping || {},
      conditionalLogic: form.conditionalLogic || [],
      validation: form.validation || {},
      submitButton: form.submitButton || { text: 'Submit', style: 'primary' },
      successMessage: form.successMessage || 'Thank you for your submission!',
      errorMessage: form.errorMessage || 'An error occurred. Please try again.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.forms.set(id, newForm);
    this.notifyListeners('form:created', newForm);
    return id;
  }

  /**
   * Get a form
   * @param {string} id - Form ID
   * @returns {Object|null} Form or null
   */
  getForm(id) {
    return this.forms.get(id) || null;
  }

  /**
   * Get all forms
   * @returns {Array} Array of forms
   */
  getAllForms() {
    return Array.from(this.forms.values());
  }

  /**
   * Update form
   * @param {string} id - Form ID
   * @param {Object} updates - Updates to apply
   */
  updateForm(id, updates) {
    const form = this.forms.get(id);
    if (!form) return;

    Object.assign(form, updates);
    form.updatedAt = Date.now();
    this.forms.set(id, form);
    this.notifyListeners('form:updated', form);
  }

  /**
   * Delete form
   * @param {string} id - Form ID
   */
  deleteForm(id) {
    this.forms.delete(id);
    this.notifyListeners('form:deleted', { id });
  }

  /**
   * Add field to form
   * @param {string} formId - Form ID
   * @param {Object} field - Field configuration
   */
  addField(formId, field) {
    const form = this.forms.get(formId);
    if (!form) return;

    const newField = {
      id: this.generateId(),
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required || false,
      placeholder: field.placeholder || '',
      options: field.options || [],
      validation: field.validation || {},
      defaultValue: field.defaultValue || '',
    };

    form.fields.push(newField);
    form.updatedAt = Date.now();
    this.forms.set(formId, form);
    this.notifyListeners('field:added', { formId, field: newField });
  }

  /**
   * Remove field from form
   * @param {string} formId - Form ID
   * @param {string} fieldId - Field ID
   */
  removeField(formId, fieldId) {
    const form = this.forms.get(formId);
    if (!form) return;

    const index = form.fields.findIndex(f => f.id === fieldId);
    if (index > -1) {
      form.fields.splice(index, 1);
      form.updatedAt = Date.now();
      this.forms.set(formId, form);
      this.notifyListeners('field:removed', { formId, fieldId });
    }
  }

  /**
   * Update field
   * @param {string} formId - Form ID
   * @param {string} fieldId - Field ID
   * @param {Object} updates - Updates to apply
   */
  updateField(formId, fieldId, updates) {
    const form = this.forms.get(formId);
    if (!form) return;

    const field = form.fields.find(f => f.id === fieldId);
    if (field) {
      Object.assign(field, updates);
      form.updatedAt = Date.now();
      this.forms.set(formId, form);
      this.notifyListeners('field:updated', { formId, field });
    }
  }

  /**
   * Add conditional logic
   * @param {string} formId - Form ID
   * @param {Object} logic - Logic configuration
   */
  addConditionalLogic(formId, logic) {
    const form = this.forms.get(formId);
    if (!form) return;

    const newLogic = {
      id: this.generateId(),
      field: logic.field,
      operator: logic.operator, // equals, not_equals, contains, greater_than, less_than
      value: logic.value,
      action: logic.action, // show, hide, require, optional
      targetField: logic.targetField,
    };

    form.conditionalLogic.push(newLogic);
    form.updatedAt = Date.now();
    this.forms.set(formId, form);
    this.notifyListeners('logic:added', { formId, logic: newLogic });
  }

  /**
   * Remove conditional logic
   * @param {string} formId - Form ID
   * @param {string} logicId - Logic ID
   */
  removeConditionalLogic(formId, logicId) {
    const form = this.forms.get(formId);
    if (!form) return;

    const index = form.conditionalLogic.findIndex(l => l.id === logicId);
    if (index > -1) {
      form.conditionalLogic.splice(index, 1);
      form.updatedAt = Date.now();
      this.forms.set(formId, form);
      this.notifyListeners('logic:removed', { formId, logicId });
    }
  }

  /**
   * Set webhook mapping
   * @param {string} formId - Form ID
   * @param {Object} mapping - Webhook mapping
   */
  setWebhookMapping(formId, mapping) {
    const form = this.forms.get(formId);
    if (!form) return;

    form.webhookMapping = mapping;
    form.updatedAt = Date.now();
    this.forms.set(formId, form);
    this.notifyListeners('webhook:mapping_updated', { formId, mapping });
  }

  /**
   * Set CRM mapping
   * @param {string} formId - Form ID
   * @param {Object} mapping - CRM mapping
   */
  setCRMMapping(formId, mapping) {
    const form = this.forms.get(formId);
    if (!form) return;

    form.crmMapping = mapping;
    form.updatedAt = Date.now();
    this.forms.set(formId, form);
    this.notifyListeners('crm:mapping_updated', { formId, mapping });
  }

  /**
   * Suggest form fields based on purpose
   * @param {string} purpose - Form purpose
   * @returns {Array} Suggested fields
   */
  suggestFields(purpose) {
    const template = this.fieldTemplates.get(purpose.toLowerCase());
    if (template) {
      return template.fields.map(field => ({ ...field }));
    }

    // Default suggestions
    return [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
    ];
  }

  /**
   * Suggest validation for field type
   * @param {string} fieldType - Field type
   * @returns {Object} Validation rules
   */
  suggestValidation(fieldType) {
    const validations = {
      email: { pattern: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email address' },
      phone: { pattern: '^[0-9+\\-\\s()]+$', message: 'Invalid phone number' },
      url: { pattern: '^https?://.+', message: 'Invalid URL' },
      number: { min: 0, message: 'Must be a positive number' },
      text: { minLength: 2, maxLength: 100, message: 'Must be 2-100 characters' },
    };

    return validations[fieldType] || {};
  }

  /**
   * Generate consent text
   * @param {Object} context - Consent context
   * @returns {string} Consent text
   */
  generateConsentText(context) {
    const { companyName, dataUsage } = context;
    return `I agree to ${companyName}'s privacy policy and consent to ${dataUsage || 'the collection and processing of my personal data'}.`;
  }

  /**
   * Get field template
   * @param {string} type - Template type
   * @returns {Object|null} Template or null
   */
  getFieldTemplate(type) {
    return this.fieldTemplates.get(type) || null;
  }

  /**
   * Get all field templates
   * @returns {Array} Array of templates
   */
  getAllFieldTemplates() {
    return Array.from(this.fieldTemplates.values());
  }

  /**
   * Get form statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const forms = Array.from(this.forms.values());
    
    return {
      totalForms: forms.length,
      totalFields: forms.reduce((sum, form) => sum + form.fields.length, 0),
      byType: {
        contact: forms.filter(f => f.name.toLowerCase().includes('contact')).length,
        newsletter: forms.filter(f => f.name.toLowerCase().includes('newsletter')).length,
        lead_gen: forms.filter(f => f.name.toLowerCase().includes('lead')).length,
        survey: forms.filter(f => f.name.toLowerCase().includes('survey')).length,
      },
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const smartFormsManager = new SmartFormsManager();
export default smartFormsManager;
