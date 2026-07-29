/**
 * Document AI
 * Handles PDF, DOCX, PPT document processing and content extraction
 * Automatically extracts title, summary, highlights, benefits, CTA, FAQ, keywords, meta tags
 */

class DocumentAI {
  constructor() {
    this.processors = new Map();
    this.extractors = new Map();
    this.listeners = [];
  }

  /**
   * Register a document processor
   * @param {string} type - Document type (pdf, docx, ppt)
   * @param {Function} processor - Processor function
   */
  registerProcessor(type, processor) {
    this.processors.set(type, processor);
  }

  /**
   * Register a content extractor
   * @param {string} type - Extractor type
   * @param {Function} extractor - Extractor function
   */
  registerExtractor(type, extractor) {
    this.extractors.set(type, extractor);
  }

  /**
   * Upload and process document
   * @param {File} file - Document file
   * @param {string} type - Document type
   * @returns {Promise<Object>} Processed document data
   */
  async uploadDocument(file, type) {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new Error(`Processor for ${type} not registered`);
    }

    this.notifyListeners('upload:started', { file, type });

    try {
      const result = await processor(file);
      this.notifyListeners('upload:completed', { file, type, result });
      return result;
    } catch (error) {
      this.notifyListeners('upload:failed', { file, type, error });
      throw error;
    }
  }

  /**
   * Extract title from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<string>} Extracted title
   */
  async extractTitle(documentData) {
    const extractor = this.extractors.get('title');
    if (!extractor) {
      throw new Error('Title extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract summary from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<string>} Extracted summary
   */
  async extractSummary(documentData) {
    const extractor = this.extractors.get('summary');
    if (!extractor) {
      throw new Error('Summary extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract highlights from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Array>} Extracted highlights
   */
  async extractHighlights(documentData) {
    const extractor = this.extractors.get('highlights');
    if (!extractor) {
      throw new Error('Highlights extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract benefits from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Array>} Extracted benefits
   */
  async extractBenefits(documentData) {
    const extractor = this.extractors.get('benefits');
    if (!extractor) {
      throw new Error('Benefits extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract CTA from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Object>} Extracted CTA
   */
  async extractCTA(documentData) {
    const extractor = this.extractors.get('cta');
    if (!extractor) {
      throw new Error('CTA extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract FAQ from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Array>} Extracted FAQ
   */
  async extractFAQ(documentData) {
    const extractor = this.extractors.get('faq');
    if (!extractor) {
      throw new Error('FAQ extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract keywords from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Array>} Extracted keywords
   */
  async extractKeywords(documentData) {
    const extractor = this.extractors.get('keywords');
    if (!extractor) {
      throw new Error('Keywords extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Extract meta tags from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Object>} Extracted meta tags
   */
  async extractMetaTags(documentData) {
    const extractor = this.extractors.get('metaTags');
    if (!extractor) {
      throw new Error('Meta tags extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Suggest images from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Array>} Suggested images
   */
  async suggestImages(documentData) {
    const extractor = this.extractors.get('images');
    if (!extractor) {
      throw new Error('Images extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Suggest forms from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Object>} Suggested forms
   */
  async suggestForms(documentData) {
    const extractor = this.extractors.get('forms');
    if (!extractor) {
      throw new Error('Forms extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Generate complete landing page from document
   * @param {Object} documentData - Processed document data
   * @returns {Promise<Object>} Generated landing page structure
   */
  async generateLandingPage(documentData) {
    const extractor = this.extractors.get('landingPage');
    if (!extractor) {
      throw new Error('Landing page extractor not registered');
    }

    return await extractor(documentData);
  }

  /**
   * Process document and extract all information
   * @param {File} file - Document file
   * @param {string} type - Document type
   * @returns {Promise<Object>} Complete extracted data
   */
  async processDocument(file, type) {
    const documentData = await this.uploadDocument(file, type);

    const [
      title,
      summary,
      highlights,
      benefits,
      cta,
      faq,
      keywords,
      metaTags,
      suggestedImages,
      suggestedForms,
    ] = await Promise.all([
      this.extractTitle(documentData),
      this.extractSummary(documentData),
      this.extractHighlights(documentData),
      this.extractBenefits(documentData),
      this.extractCTA(documentData),
      this.extractFAQ(documentData),
      this.extractKeywords(documentData),
      this.extractMetaTags(documentData),
      this.suggestImages(documentData),
      this.suggestForms(documentData),
    ]);

    return {
      documentData,
      title,
      summary,
      highlights,
      benefits,
      cta,
      faq,
      keywords,
      metaTags,
      suggestedImages,
      suggestedForms,
      landingPage: await this.generateLandingPage(documentData),
    };
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
const documentAI = new DocumentAI();

export default documentAI;
export { DocumentAI };
