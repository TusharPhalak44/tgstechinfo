import React, { useEffect } from 'react';

/**
 * Fallback route handler for /sitemap.xml if reached via React Router.
 * Automatically redirects the browser to the backend XML endpoint.
 */
const SitemapXml = () => {
  useEffect(() => {
    window.location.replace('/api/seo/sitemap');
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'monospace' }}>
      Loading sitemap.xml...
    </div>
  );
};

export default SitemapXml;
