import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Spin, Result, Button } from 'antd';

const StandaloneLandingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [slug]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/public/content/${slug}`);
      const data = res.data.content;

      // Verify this is an HTML Builder page
      const builderLayout = data.builder_layout ? JSON.parse(data.builder_layout) : null;
      if (!builderLayout || !Array.isArray(builderLayout) || builderLayout[0] !== 'html') {
        setError('This content is not a standalone landing page');
        return;
      }

      setContent(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err.response?.data?.message || 'Content not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!content || !content.content) return;

    // ── Inject platform globals BEFORE the page scripts run ──────────────────
    // This gives the client's inline script access to the content id/slug
    // without requiring them to hard-code it in their HTML.
    const globalsScript = document.createElement('script');
    globalsScript.textContent = `
      window.__CONTENT_ID   = ${JSON.stringify(content.id)};
      window.__CONTENT_SLUG = ${JSON.stringify(content.slug)};

      // Auto-patch fetch so ANY call to /api/public/landing-page automatically
      // includes content_id in the JSON body — works even if the client's HTML
      // doesn't include it explicitly.
      (function() {
        const _originalFetch = window.fetch;
        window.fetch = function(url, options) {
          try {
            const urlStr = (typeof url === 'string') ? url : (url.url || String(url));
            if (urlStr.includes('/api/public/landing-page') && options && options.body) {
              let body;
              try { body = JSON.parse(options.body); } catch(e) { body = null; }
              if (body && typeof body === 'object' && !body.content_id) {
                body.content_id = window.__CONTENT_ID;
                options = { ...options, body: JSON.stringify(body) };
              }
            }
          } catch(e) { /* never break the original fetch */ }
          return _originalFetch.call(this, url, options);
        };
      })();
    `;
    document.body.insertBefore(globalsScript, document.body.firstChild);

    // ── Extract and execute the page's own scripts ────────────────────────────
    const parser = new DOMParser();
    const doc = parser.parseFromString(content.content, 'text/html');
    const scripts = doc.querySelectorAll('script');
    const addedScripts = [globalsScript];

    scripts.forEach(script => {
      const newScript = document.createElement('script');
      
      // Copy all attributes (like src, type, etc.)
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // If it's an inline script, process the code
      if (!script.src) {
        let code = script.textContent;
        // Replace legacy placeholder API URL with our actual endpoint
        code = code.replace(/https:\/\/your-api-url\.com\/api\/leads/g, '/api/public/landing-page');
        // Convert any const API_URL declaration to a non‑redeclaring global
        code = code.replace(/\bconst\s+API_URL\b/g, 'window.API_URL');
        newScript.textContent = code;
      }
      
      document.body.appendChild(newScript);
      addedScripts.push(newScript);
    });

    return () => {
      // Clean up scripts on unmount or content change
      addedScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [content]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Result
          status="404"
          title="Page Not Found"
          subTitle={error || 'The requested landing page could not be found.'}
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              Return Home
            </Button>
          }
        />
      </div>
    );
  }

  // Pre-process raw HTML to replace target placeholder endpoints in form elements too
  const rawHtml = (content.content || '')
    .replace(/https:\/\/your-api-url\.com\/api\/leads/g, '/api/public/landing-page');

  return (
    <>
      <Helmet>
        <title>{content.seo_meta_title || content.title}</title>
        <meta name="description" content={content.seo_meta_description || content.short_description} />
        <meta name="keywords" content={content.seo_meta_keywords || ''} />
        
        {/* Open Graph */}
        <meta property="og:title" content={content.seo_meta_title || content.title} />
        <meta property="og:description" content={content.seo_meta_description || content.short_description} />
        <meta property="og:type" content="website" />
        {content.banner_image && (
          <meta property="og:image" content={`${window.location.origin}/uploads/${content.banner_image}`} />
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content.seo_meta_title || content.title} />
        <meta name="twitter:description" content={content.seo_meta_description || content.short_description} />
        {content.banner_image && (
          <meta name="twitter:image" content={`${window.location.origin}/uploads/${content.banner_image}`} />
        )}
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${window.location.origin}/content/${content.slug}`} />
      </Helmet>
      
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        background: '#fff'
      }}>
        <div 
          dangerouslySetInnerHTML={{ __html: rawHtml }} 
          style={{ 
            width: '100%',
            minHeight: '100vh'
          }}
        />
      </div>
    </>
  );
};

export default StandaloneLandingPage;
