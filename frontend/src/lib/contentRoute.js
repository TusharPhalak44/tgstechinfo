const CONTENT_TYPE_ROUTE_MAP = {
  articles: 'article', article: 'article',
  blogs: 'blog', blog: 'blog',
  news: 'news',
  webinars: 'webinar', webinar: 'webinar',
  events: 'event', event: 'event',
  whitepapers: 'whitepaper', whitepaper: 'whitepaper', 'white-paper': 'whitepaper',
  ebooks: 'ebook', ebook: 'ebook',
  interviews: 'interview', interview: 'interview',
  reports: 'report', report: 'report',
  'case-study': 'case-study', 'case study': 'case-study', 'case-studies': 'case-study', casestudy: 'case-study',
  'landing-page': 'article', 'landing page': 'article'
};

const normalizeContentType = (value = 'article') => CONTENT_TYPE_ROUTE_MAP[String(value || '').toLowerCase().trim()] || 'article';

const parseLayout = (layout) => {
  if (Array.isArray(layout)) return layout;
  if (typeof layout !== 'string') return null;
  try {
    return JSON.parse(layout);
  } catch {
    return null;
  }
};

export const resolveContentRoute = (item = {}) => {
  const rawUrl = typeof item?.url === 'string' ? item.url.trim() : '';
  const slug = typeof item?.slug === 'string' ? item.slug.trim() : '';
  const contentType = typeof item?.content_type === 'string' ? item.content_type.trim() : '';
  const contentTypeName = typeof item?.content_type_name === 'string' ? item.content_type_name.trim() : '';
  const layout = item?.builder_layout;
  const parsedLayout = parseLayout(layout);
  const isHtmlBuilder = Array.isArray(parsedLayout) && parsedLayout[0] === 'html';
  const isLandingPageType = ['landing-page', 'landing page'].includes((contentType || contentTypeName || '').toLowerCase().trim());
  const isStandalone = Boolean(isHtmlBuilder || isLandingPageType);
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl, origin);
      if (parsed.origin === origin) {
        return { url: parsed.pathname + parsed.search + parsed.hash, newTab: false };
      }
      return { url: rawUrl, newTab: true };
    } catch {
      if (rawUrl.startsWith('/')) {
        return { url: rawUrl, newTab: false };
      }
      if (rawUrl.startsWith('#')) {
        return { url: rawUrl, newTab: false };
      }
      return { url: rawUrl, newTab: true };
    }
  }

  if (!slug) {
    return { url: '/', newTab: false };
  }

  if (isStandalone) {
    return { url: `/content/${slug}`, newTab: true };
  }

  return { url: `/${normalizeContentType(contentType || contentTypeName || 'article')}/${slug}`, newTab: false };
};

export const navigateContentItem = (item, navigate, options = {}) => {
  const resolved = resolveContentRoute(item);
  const shouldOpenNewTab = options.newTab ?? resolved.newTab;

  if (shouldOpenNewTab) {
    window.open(resolved.url, '_blank', 'noopener,noreferrer');
    return;
  }

  navigate(resolved.url);
};
