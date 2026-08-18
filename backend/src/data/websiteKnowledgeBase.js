// Website Knowledge Base - Static data for common website questions
const WEBSITE_KNOWLEDGE_BASE = {
  about: {
    keywords: ['about', 'company', 'who are you', 'what is tgs', 'tgs tech info', 'organization', 'about us'],
    answer: {
      title: 'About TGS Tech Info',
      content: 'TGS Tech Info is a leading technology publishing platform that provides insights, whitepapers, reports, and articles on emerging technologies. We help businesses and professionals stay informed about the latest trends in AI, cybersecurity, cloud computing, and more. Our mission is to bridge the gap between complex technology and business decision-making through accessible, high-quality content.',
      link: '/about'
    }
  },
  services: {
    keywords: ['services', 'what do you offer', 'offerings', 'solutions', 'products'],
    answer: {
      title: 'Our Services',
      content: 'We offer a range of services including content publishing, lead generation, demand generation, and technology research. Our platform helps businesses reach their target audience through high-quality technical content. From creating compelling whitepapers to managing email campaigns, we provide end-to-end solutions for B2B marketing.',
      link: '/services'
    }
  },
  contact: {
    keywords: ['contact', 'contact us', 'reach', 'email address', 'phone number', 'address', 'customer support', 'customer care', 'customer service'],
    answer: {
      title: 'Contact Us',
      content: 'You can reach our team through the contact form on our website or email us at support@tgstechinfo.com. Our team is available Monday through Friday, 9 AM to 6 PM IST. We typically respond within 24-48 hours for general inquiries and within 4 hours for urgent matters.',
      link: '/contact'
    }
  },
  privacy: {
    keywords: ['privacy', 'privacy policy', 'data', 'personal information', 'gdpr'],
    answer: {
      title: 'Privacy Policy',
      content: 'We take your privacy seriously. Our Privacy Policy explains how we collect, use, and protect your personal information. We comply with GDPR and other data protection regulations. Learn about your rights regarding your data, how we use cookies, and what information we collect when you visit our website.',
      link: '/privacy-policy'
    }
  },
  terms: {
    keywords: ['terms', 'terms of service', 'tos', 'legal', 'agreement'],
    answer: {
      title: 'Terms of Service',
      content: 'Our Terms of Service outline the rules and guidelines for using our platform. By using our services, you agree to these terms. This document covers user responsibilities, content usage policies, intellectual property rights, and limitations of liability.',
      link: '/terms-of-use'
    }
  },
  cookies: {
    keywords: ['cookies', 'cookie policy', 'tracking', 'consent'],
    answer: {
      title: 'Cookie Policy',
      content: 'We use cookies to improve your browsing experience and analyze site traffic. You can manage your cookie preferences through our cookie consent banner. Learn about the different types of cookies we use, how long they are stored, and how you can control your cookie settings.',
      link: '/cookie-policy'
    }
  },
  download: {
    keywords: ['download', 'how to download', 'access', 'get content', 'pdf'],
    answer: {
      title: 'How to Download Content',
      content: 'To download our whitepapers, reports, or other content:\n\n1. Navigate to the content page you want to download.\n2. Complete the lead generation form with your details.\n3. Click the "Submit" or "Download" button.\n4. The download will begin automatically, or you will receive an email with the download link.\n\nIf you encounter any issues, please contact our support team.',
      link: null
    }
  },
  lead_generation: {
    keywords: ['lead generation', 'leads', 'marketing', 'capture'],
    answer: {
      title: 'Lead Generation',
      content: 'Our platform helps businesses generate qualified leads through gated content. Users provide their contact information to access premium content, enabling you to build your sales pipeline. We offer various lead capture forms, scoring systems, and integration with popular CRM platforms.',
      link: '/contact'
    }
  },
  demand_generation: {
    keywords: ['demand generation', 'demand gen', 'awareness', 'marketing'],
    answer: {
      title: 'Demand Generation',
      content: 'We help create market demand for your products and services through strategic content marketing. Our approach focuses on educating prospects and nurturing them through the buyer journey. From awareness to consideration to decision, we support each stage with targeted content.',
      link: '/contact'
    }
  },
  newsletter: {
    keywords: ['newsletter', 'subscribe', 'email updates', 'news'],
    answer: {
      title: 'Newsletter',
      content: 'Subscribe to our newsletter to receive the latest technology insights, whitepapers, and industry updates directly in your inbox. Our weekly newsletter covers AI trends, cybersecurity updates, cloud computing news, and exclusive content available only to subscribers.',
      link: '/newsletter'
    }
  },
  support: {
    keywords: ['support', 'help', 'technical support', 'customer support', 'customer care', 'customer service', 'assistance', 'troubleshoot', 'issue'],
    answer: {
      title: 'Support',
      content: 'For technical support or account-related issues, please contact our support team. You can also submit a query through this chatbot, and our team will get back to you. Our support team is trained to help with content access, account management, and technical troubleshooting.',
      link: '/contact'
    }
  },
  career: {
    keywords: ['career', 'jobs', 'employment', 'hiring', 'work', 'join'],
    answer: {
      title: 'Careers',
      content: 'We are always looking for talented individuals to join our team. Check our careers page for current job openings and application details. We offer competitive salaries, flexible work arrangements, and opportunities for professional growth in the technology publishing industry.',
      link: '/contact'
    }
  },
  pricing: {
    keywords: ['pricing', 'price', 'cost', 'subscription', 'plan', 'enterprise'],
    answer: {
      title: 'Pricing',
      content: 'For enterprise pricing and custom solutions, please contact our sales team. We offer flexible plans based on your business needs, including content licensing, sponsored content opportunities, and custom research projects. Contact us for a personalized quote.',
      link: '/contact'
    }
  }
};

/**
 * Search knowledge base for matching answer
 * @param {string} query - User query
 * @returns {object|null} - Matching knowledge base entry or null
 */
function searchKnowledgeBase(query) {
  const lowerQuery = query.toLowerCase();
  
  for (const [key, data] of Object.entries(WEBSITE_KNOWLEDGE_BASE)) {
    for (const keyword of data.keywords) {
      if (lowerQuery.includes(keyword)) {
        return data.answer;
      }
    }
  }
  
  return null;
}

module.exports = {
  WEBSITE_KNOWLEDGE_BASE,
  searchKnowledgeBase
};
