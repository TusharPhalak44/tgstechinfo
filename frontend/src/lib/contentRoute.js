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

const slugifyCategory = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const extractCategorySlug = (item) => {
  if (!item) return '';
  if (typeof item.category_slug === 'string' && item.category_slug.trim()) {
    return slugifyCategory(item.category_slug);
  }
  if (typeof item.category === 'string' && item.category.trim()) {
    return slugifyCategory(item.category);
  }
  if (typeof item.category === 'object' && item.category !== null) {
    if (typeof item.category.slug === 'string' && item.category.slug.trim()) {
      return slugifyCategory(item.category.slug);
    }
    if (typeof item.category.name === 'string' && item.category.name.trim()) {
      return slugifyCategory(item.category.name);
    }
  }
  if (typeof item.category_name === 'string' && item.category_name.trim()) {
    return slugifyCategory(item.category_name);
  }
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    const first = item.categories[0];
    if (typeof first === 'string') return slugifyCategory(first);
    if (typeof first === 'object' && first !== null) {
      return slugifyCategory(first.slug || first.name);
    }
  }
  return '';
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
  const isFileLanding = Boolean(
    item?.is_file_landing_page ||
    (Array.isArray(parsedLayout) && (parsedLayout.includes('file-landing') || layout?.[0] === 'file-landing')) ||
    (typeof item?.content === 'string' && item.content.includes('File-based landing page')) ||
    (rawUrl && (rawUrl.startsWith('/lp/') || rawUrl.includes('/lp/')))
  );

  if (isFileLanding) {
    const targetSlug = slug || (rawUrl ? rawUrl.replace(/^\/lp\//, '') : '');
    const url = targetSlug ? `/lp/${encodeURIComponent(targetSlug)}` : (rawUrl || '/lp');
    return { url, newTab: true, isFileLanding: true };
  }

  const isStandalone = Boolean(isHtmlBuilder || isLandingPageType);
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl, origin);
      if (parsed.origin === origin) {
        return { url: parsed.pathname + parsed.search + parsed.hash, newTab: true };
      }
      return { url: rawUrl, newTab: true };
    } catch {
      if (rawUrl.startsWith('/')) {
        return { url: rawUrl, newTab: true };
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
    return { url: `/content/${encodeURIComponent(slug)}`, newTab: true };
  }

  const type = normalizeContentType(contentType || contentTypeName || 'article');
  if (type === 'event' || type === 'events' || item?.content_type_id === 5) {
    return { url: `/events/${encodeURIComponent(slug)}`, newTab: true };
  }
  const catSlug = extractCategorySlug(item) || 'general';

  return { url: `/${type}/${encodeURIComponent(catSlug)}/${encodeURIComponent(slug)}`, newTab: true };
};

export const navigateContentItem = (item, navigate, options = {}) => {
  const resolved = resolveContentRoute(item);
  const shouldOpenNewTab = options.newTab ?? resolved.newTab ?? true;

  // File-based landing pages are served directly by Express via /lp/:slug
  // Use browser navigation to ensure static assets load properly
  if (resolved.isFileLanding || resolved.url.startsWith('/lp/')) {
    if (shouldOpenNewTab) {
      window.open(resolved.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = resolved.url;
    }
    return;
  }

  if (shouldOpenNewTab) {
    window.open(resolved.url, '_blank', 'noopener,noreferrer');
    return;
  }

  navigate(resolved.url);
};
