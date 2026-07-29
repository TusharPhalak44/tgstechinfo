/**
 * AI SEO Assistant
 * Analyzes page content and suggests improvements for heading, keyword density, meta tags, image alt text, internal links, CTA, readability, SEO score
 */

class AISEOAssistant {
  constructor() {
    this.analyzers = new Map();
    this.listeners = [];
    
    this.initializeAnalyzers();
  }

  /**
   * Initialize SEO analyzers
   */
  initializeAnalyzers() {
    this.analyzers.set('headings', {
      analyze: this.analyzeHeadings.bind(this),
      weight: 0.2,
    });

    this.analyzers.set('keywords', {
      analyze: this.analyzeKeywords.bind(this),
      weight: 0.25,
    });

    this.analyzers.set('meta', {
      analyze: this.analyzeMeta.bind(this),
      weight: 0.15,
    });

    this.analyzers.set('images', {
      analyze: this.analyzeImages.bind(this),
      weight: 0.1,
    });

    this.analyzers.set('links', {
      analyze: this.analyzeLinks.bind(this),
      weight: 0.1,
    });

    this.analyzers.set('cta', {
      analyze: this.analyzeCTA.bind(this),
      weight: 0.1,
    });

    this.analyzers.set('readability', {
      analyze: this.analyzeReadability.bind(this),
      weight: 0.1,
    });
  }

  /**
   * Analyze page SEO
   * @param {Object} pageData - Page data
   * @returns {Promise<Object>} SEO analysis result
   */
  async analyzePage(pageData) {
    const analyses = {};
    let totalScore = 0;

    for (const [key, analyzer] of this.analyzers) {
      const result = await analyzer.analyze(pageData);
      analyses[key] = result;
      totalScore += result.score * analyzer.weight;
    }

    const overallScore = Math.round(totalScore * 100);

    return {
      overallScore,
      analyses,
      suggestions: this.generateSuggestions(analyses),
      priority: this.getPriority(overallScore),
    };
  }

  /**
   * Analyze headings
   * @param {Object} pageData - Page data
   * @returns {Object} Heading analysis
   */
  analyzeHeadings(pageData) {
    const headings = pageData.headings || [];
    let score = 1;
    const issues = [];
    const suggestions = [];

    // Check for H1
    const h1Count = headings.filter(h => h.tag === 'h1').length;
    if (h1Count === 0) {
      score -= 0.3;
      issues.push('Missing H1 heading');
      suggestions.push('Add a single H1 heading with your main keyword');
    } else if (h1Count > 1) {
      score -= 0.2;
      issues.push('Multiple H1 headings');
      suggestions.push('Use only one H1 heading per page');
    }

    // Check heading hierarchy
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tag.replace('h', ''));
      if (level > previousLevel + 1 && previousLevel !== 0) {
        score -= 0.1;
        issues.push(`Skipped heading level: h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Analyze keywords
   * @param {Object} pageData - Page data
   * @returns {Object} Keyword analysis
   */
  analyzeKeywords(pageData) {
    const content = pageData.content || '';
    const targetKeywords = pageData.keywords || [];
    let score = 1;
    const issues = [];
    const suggestions = [];

    if (targetKeywords.length === 0) {
      score -= 0.4;
      issues.push('No target keywords defined');
      suggestions.push('Define target keywords for this page');
    }

    targetKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex) || [];
      const count = matches.length;
      const wordCount = content.split(/\s+/).length;
      const density = (count / wordCount) * 100;

      if (density < 0.5) {
        score -= 0.1;
        issues.push(`Keyword "${keyword}" density too low: ${density.toFixed(2)}%`);
        suggestions.push(`Increase keyword "${keyword}" usage to 1-2%`);
      } else if (density > 3) {
        score -= 0.1;
        issues.push(`Keyword "${keyword}" density too high: ${density.toFixed(2)}%`);
        suggestions.push(`Reduce keyword "${keyword}" usage to avoid keyword stuffing`);
      }
    });

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Analyze meta tags
   * @param {Object} pageData - Page data
   * @returns {Object} Meta analysis
   */
  analyzeMeta(pageData) {
    const meta = pageData.meta || {};
    let score = 1;
    const issues = [];
    const suggestions = [];

    // Title
    if (!meta.title) {
      score -= 0.3;
      issues.push('Missing meta title');
      suggestions.push('Add a descriptive meta title (50-60 characters)');
    } else if (meta.title.length < 30 || meta.title.length > 60) {
      score -= 0.1;
      issues.push('Meta title length not optimal');
      suggestions.push('Optimize meta title to 50-60 characters');
    }

    // Description
    if (!meta.description) {
      score -= 0.3;
      issues.push('Missing meta description');
      suggestions.push('Add a compelling meta description (150-160 characters)');
    } else if (meta.description.length < 120 || meta.description.length > 160) {
      score -= 0.1;
      issues.push('Meta description length not optimal');
      suggestions.push('Optimize meta description to 150-160 characters');
    }

    // OG tags
    if (!meta.ogImage) {
      score -= 0.1;
      issues.push('Missing OG image');
      suggestions.push('Add an OG image for social sharing');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Analyze images
   * @param {Object} pageData - Page data
   * @returns {Object} Image analysis
   */
  analyzeImages(pageData) {
    const images = pageData.images || [];
    let score = 1;
    const issues = [];
    const suggestions = [];

    images.forEach((image, index) => {
      if (!image.alt) {
        score -= 0.15;
        issues.push(`Image ${index + 1} missing alt text`);
        suggestions.push(`Add descriptive alt text to image ${index + 1}`);
      } else if (image.alt.length < 10) {
        score -= 0.05;
        issues.push(`Image ${index + 1} alt text too short`);
        suggestions.push(`Improve alt text for image ${index + 1}`);
      }
    });

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Analyze links
   * @param {Object} pageData - Page data
   * @returns {Object} Link analysis
   */
  analyzeLinks(pageData) {
    const links = pageData.links || [];
    let score = 1;
    const issues = [];
    const suggestions = [];

    const internalLinks = links.filter(l => l.internal);
    const externalLinks = links.filter(l => !l.internal);

    if (internalLinks.length === 0) {
      score -= 0.2;
      issues.push('No internal links');
      suggestions.push('Add internal links to related content');
    }

    if (links.length > 0 && links.every(l => !l.anchorText || l.anchorText === 'click here')) {
      score -= 0.3;
      issues.push('Generic anchor text used');
      suggestions.push('Use descriptive anchor text for links');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Analyze CTA
   * @param {Object} pageData - Page data
   * @returns {Object} CTA analysis
   */
  analyzeCTA(pageData) {
    const ctas = pageData.ctas || [];
    let score = 1;
    const issues = [];
    const suggestions = [];

    if (ctas.length === 0) {
      score -= 0.4;
      issues.push('No CTA found');
      suggestions.push('Add at least one clear call-to-action');
    }

    ctas.forEach((cta, index) => {
      if (!cta.text || cta.text.length < 3) {
        score -= 0.1;
        issues.push(`CTA ${index + 1} text too short`);
        suggestions.push(`Improve CTA ${index + 1} text to be more compelling`);
      }
    });

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Analyze readability
   * @param {Object} pageData - Page data
   * @returns {Object} Readability analysis
   */
  analyzeReadability(pageData) {
    const content = pageData.content || '';
    let score = 1;
    const issues = [];
    const suggestions = [];

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/);
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);

    if (avgSentenceLength > 25) {
      score -= 0.2;
      issues.push('Sentences too long on average');
      suggestions.push('Break up long sentences for better readability');
    }

    const longWords = words.filter(w => w.length > 15).length;
    if (longWords / words.length > 0.1) {
      score -= 0.1;
      issues.push('Too many complex words');
      suggestions.push('Simplify complex words for broader audience');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Generate suggestions from analyses
   * @param {Object} analyses - Analysis results
   * @returns {Array} Array of suggestions
   */
  generateSuggestions(analyses) {
    const allSuggestions = [];
    
    Object.values(analyses).forEach(analysis => {
      analysis.suggestions.forEach(suggestion => {
        allSuggestions.push(suggestion);
      });
    });

    return allSuggestions;
  }

  /**
   * Get priority level based on score
   * @param {number} score - SEO score
   * @returns {string} Priority level
   */
  getPriority(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  /**
   * Generate improved meta title
   * @param {Object} pageData - Page data
   * @returns {Promise<string>} Improved title
   */
  async generateMetaTitle(pageData) {
    const currentTitle = pageData.meta?.title || '';
    const keywords = pageData.keywords || [];
    
    // Placeholder for AI generation
    return currentTitle || 'Optimized Title with Keywords';
  }

  /**
   * Generate improved meta description
   * @param {Object} pageData - Page data
   * @returns {Promise<string>} Improved description
   */
  async generateMetaDescription(pageData) {
    const content = pageData.content || '';
    
    // Placeholder for AI generation
    return content.substring(0, 150) + '...';
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

const aiSEOAssistant = new AISEOAssistant();
export default aiSEOAssistant;
