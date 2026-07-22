const { searchKnowledgeBase } = require('../data/websiteKnowledgeBase');

/**
 * Detect user intent from query
 * @param {string} query - User's query
 * @returns {object} - Intent detection result
 */
function detectIntent(query) {
  const lowerQuery = query.toLowerCase().trim();
  const wordCount = lowerQuery.split(/\s+/).length;
  
  console.log('[detectIntent] Original query:', query);
  console.log('[detectIntent] Lowercase query:', lowerQuery);
  console.log('[detectIntent] Word count:', wordCount);
  
  // Validate input - reject empty, whitespace-only, or punctuation-only
  if (!lowerQuery || lowerQuery.length === 0) {
    console.log('[detectIntent] Detected intent: unknown (empty input)');
    return {
      intent: 'unknown',
      confidence: 'low',
      reason: 'empty_input'
    };
  }
  
  // Check if input is only punctuation or whitespace
  if (/^[^\w\s]+$/.test(lowerQuery) || /^\s+$/.test(lowerQuery)) {
    console.log('[detectIntent] Detected intent: unknown (punctuation/whitespace only)');
    return {
      intent: 'unknown',
      confidence: 'low',
      reason: 'invalid_input'
    };
  }
  
  // Reject very short meaningless inputs (single character)
  if (wordCount === 1 && lowerQuery.length <= 2) {
    console.log('[detectIntent] Detected intent: unknown (too_short)');
    return {
      intent: 'unknown',
      confidence: 'low',
      reason: 'too_short'
    };
  }
  
  // Synonym normalization before processing
  const synonymMap = {
    'artificial intelligence': 'ai',
    'machine learning': 'ml',
    'cloud': 'cloud computing',
    'cyber': 'cybersecurity',
    'crm': 'customer relationship management',
    'hr': 'human resources',
    'iot': 'internet of things',
    'saas': 'software as a service',
    'paas': 'platform as a service',
    'iaas': 'infrastructure as a service'
  };
  
  let normalizedQuery = lowerQuery;
  for (const [synonym, canonical] of Object.entries(synonymMap)) {
    if (lowerQuery.includes(synonym)) {
      normalizedQuery = lowerQuery.replace(synonym, canonical);
      console.log('[detectIntent] Normalized query:', normalizedQuery, '(synonym:', synonym, '→', canonical, ')');
      break;
    }
  }
  
  const queryToCheck = normalizedQuery;
  
  // Greeting detection - highest priority
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 
    'good evening', 'how are you', 'howdy', 'thanks', 'thank you', 'ok', 
    'okay', 'bye', 'goodbye', 'sure', 'yes', 'no', 'maybe'
  ];
  
  const isGreeting = greetings.some(greeting => 
    lowerQuery === greeting || 
    lowerQuery.startsWith(greeting) || 
    lowerQuery === greeting + '!' ||
    lowerQuery === greeting + '.'
  );
  
  if (isGreeting) {
    console.log('[detectIntent] Detected intent: greeting');
    return {
      intent: 'greeting',
      confidence: 'high'
    };
  }
  
  // Business inquiry detection - high priority
  // Use word boundaries to avoid matching content-related terms like "AI pricing" or "Cloud enterprise"
  const businessInquiryKeywords = [
    'partnership', 'partner', 'demo', 'quote', 
    'quotation', 'proposal', 'business proposal', 'custom solution', 
    'custom development', 'api integration', 'consultation', 
    'consult', 'contact sales', 'sales team', 'meeting', 
    'schedule meeting', 'request demo', 'collaboration', 'bulk purchase', 
    'vendor', 'become a partner', 'discuss partnership', 'need demo', 
    'want demo', 'sales team contact', 'implementation support'
  ];
  
  const isBusinessInquiry = businessInquiryKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerQuery);
  });
  
  if (isBusinessInquiry) {
    console.log('[detectIntent] Detected intent: business_inquiry');
    return {
      intent: 'business_inquiry',
      confidence: 'high'
    };
  }
  
  // Content type detection - for filtering
  const contentTypeMap = {
    'article': 'article',
    'articles': 'article',
    'blog': 'blog',
    'blogs': 'blog',
    'whitepaper': 'whitepaper',
    'whitepapers': 'whitepaper',
    'ebook': 'ebook',
    'ebooks': 'ebook',
    'report': 'report',
    'reports': 'report',
    'webinar': 'webinar',
    'webinars': 'webinar',
    'case study': 'case_study',
    'case studies': 'case_study',
    'guide': 'guide',
    'guides': 'guide'
  };
  
  let detectedContentType = null;
  for (const [keyword, type] of Object.entries(contentTypeMap)) {
    if (lowerQuery.includes(keyword)) {
      detectedContentType = type;
      break;
    }
  }
  
  // Check if it's a website question - ONLY if knowledge base has a match
  // Do NOT use question indicators (what, how, when, where, why) as these are common in article titles
  const knowledgeBaseAnswer = searchKnowledgeBase(queryToCheck);
  if (knowledgeBaseAnswer) {
    console.log('[detectIntent] Detected intent: website_question (knowledge base match)');
    return {
      intent: 'website_question',
      confidence: 'high',
      answer: knowledgeBaseAnswer,
      contentType: detectedContentType
    };
  }
  
  // DEFAULT: Any meaningful query that's not greeting/business inquiry/website question is content_search
  // This ensures article titles, blog titles, whitepaper titles, report titles are always routed to content_search
  // Question words like "what", "how", "when", "where", "why" are NOT used for classification
  console.log('[detectIntent] Detected intent: content_search (default fallback for meaningful query)');
  return {
    intent: 'content_search',
    confidence: 'medium',
    contentType: detectedContentType
  };
}

module.exports = {
  detectIntent
};
