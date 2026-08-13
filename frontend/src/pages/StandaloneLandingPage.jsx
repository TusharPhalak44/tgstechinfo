import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Spin, Result, Button } from 'antd';
import { useCookieConsent } from '../context/CookieContext';
import { useTheme } from '../context/ThemeContext';
import StandaloneBuilderPage from './StandaloneBuilderPage';

const StandaloneLandingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { consent, hasAnalyticsConsent } = useCookieConsent();
  const { darkMode } = useTheme();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [slug]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Decode the slug if it was URL-encoded
      const decodedSlug = decodeURIComponent(slug);
      const res = await axios.get(`/api/public/content/${decodedSlug}`);
      const data = res.data.content;

      if (!data) {
        console.error('❌ No content data received from API');
        setError('Content not found');
        setLoading(false);
        return;
      }

      // Verify this is an HTML Builder page, Visual Builder page, or Landing Page content type
      const builderLayout = data.builder_layout ? (typeof data.builder_layout === 'string' ? JSON.parse(data.builder_layout) : data.builder_layout) : null;
      const isHtmlBuilder = Array.isArray(builderLayout) && builderLayout[0] === 'html';
      const isVisualBuilder = !!data.builder_page_data;
      const isLandingPageType = ['landing-page', 'landing page'].includes(
        (data.content_type || data.content_type_name || '').toLowerCase().trim()
      );
      
      console.log('🔍 Landing Page Debug:', {
        slug: data.slug,
        contentId: data.id,
        builderLayout,
        isHtmlBuilder,
        isVisualBuilder,
        isLandingPageType,
        contentTypeName: data.content_type_name,
        contentType: data.content_type,
        hasBuilderPageData: !!data.builder_page_data,
        builderPageDataType: typeof data.builder_page_data
      });
      
      // Allow ANY Visual Builder or HTML Builder content regardless of content type
      // Also allow dedicated landing page content types
      if (!isHtmlBuilder && !isVisualBuilder && !isLandingPageType) {
        console.log('❌ Not a builder page - redirecting to article view');
        console.log('   Reason: isHtmlBuilder=' + isHtmlBuilder + ', isVisualBuilder=' + isVisualBuilder + ', isLandingPageType=' + isLandingPageType);
        // Not a builder page — redirect to the normal article view
        navigate(`/article/${data.slug}`, { replace: true });
        return;
      }
      
      console.log('✅ Rendering as landing page');

      setContent(data);
      setError(null);
      
      console.log('Landing page loaded with consent:', consent, 'hasAnalyticsConsent:', hasAnalyticsConsent);
      
      // Set consent UUID globally if available
      if (consent?.uuid) {
        window.__CONSENT_UUID = consent.uuid;
        console.log('Set CONSENT_UUID:', consent.uuid);
      }
      
      // Initialize tracking session if analytics consent is granted and session doesn't exist
      if (hasAnalyticsConsent && consent && !window.__SESSION_UUID) {
        console.log('Initializing tracking session on landing page...');
        const { trackingApi, generateSessionUuid, getDeviceInfo } = require('../lib/trackingUtils');
        
        const sessionData = {
          consent_uuid: consent.uuid,
          landing_page: window.location.href,
          referrer: document.referrer,
          ...getDeviceInfo()
        };
        
        trackingApi.startSession(sessionData)
          .then(response => {
            window.__SESSION_UUID = response.session.session_uuid;
            localStorage.setItem('tracking_session_uuid', response.session.session_uuid);
            console.log('Tracking session initialized on landing page:', response.session.session_uuid);
          })
          .catch(err => {
            console.error('Failed to initialize tracking on landing page:', err);
          });
      } else if (!window.__SESSION_UUID) {
        // Try to get session from localStorage
        const savedSession = localStorage.getItem('tracking_session_uuid');
        if (savedSession) {
          window.__SESSION_UUID = savedSession;
          console.log('Restored session from localStorage:', savedSession);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching content:', err);
      console.error('Error response:', err.response?.data);
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
      window.__SESSION_UUID = ${JSON.stringify(window.__SESSION_UUID || null)};
      window.__CONSENT_UUID = ${JSON.stringify(window.__CONSENT_UUID || null)};
      
      console.log('Landing page globals:', {
        CONTENT_ID: window.__CONTENT_ID,
        SESSION_UUID: window.__SESSION_UUID,
        CONSENT_UUID: window.__CONSENT_UUID
      });

      // Auto-patch fetch so ANY call to /api/public/landing-page automatically
      // includes content_id, session_uuid, and consent_uuid in the JSON body
      // works even if the client's HTML doesn't include it explicitly.
      (function() {
        const _originalFetch = window.fetch;
        window.fetch = function(url, options) {
          try {
            const urlStr = (typeof url === 'string') ? url : (url.url || String(url));
            if (urlStr.includes('/api/public/landing-page') && options && options.body) {
              let body;
              try { body = JSON.parse(options.body); } catch(e) { body = null; }
              if (body && typeof body === 'object') {
                console.log('Before patch:', body);
                if (!body.content_id) body.content_id = window.__CONTENT_ID;
                if (!body.session_uuid) body.session_uuid = window.__SESSION_UUID;
                if (!body.consent_uuid) body.consent_uuid = window.__CONSENT_UUID;
                console.log('After patch:', body);
                options = { ...options, body: JSON.stringify(body) };
              }
            }
          } catch(e) { /* never break the original fetch */ }
          return _originalFetch.call(this, url, options);
        };
      })();

      // Also patch XMLHttpRequest (used by axios and some native HTML forms)
      (function() {
        const _XHROpen = XMLHttpRequest.prototype.open;
        const _XHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
          this._patchUrl = (typeof url === 'string') ? url : String(url);
          return _XHROpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
          try {
            if (this._patchUrl && this._patchUrl.includes('/api/public/landing-page') && body) {
              let parsed;
              try { parsed = JSON.parse(body); } catch(e) { parsed = null; }
              if (parsed && typeof parsed === 'object') {
                if (!parsed.content_id) parsed.content_id = window.__CONTENT_ID;
                if (!parsed.session_uuid) parsed.session_uuid = window.__SESSION_UUID;
                if (!parsed.consent_uuid) parsed.consent_uuid = window.__CONSENT_UUID;
                body = JSON.stringify(parsed);
                // Ensure Content-Type is set for JSON
                this.setRequestHeader('Content-Type', 'application/json');
              }
            }
          } catch(e) { /* never break XHR */ }
          return _XHRSend.call(this, body);
        };
      })();
    `;
    document.body.insertBefore(globalsScript, document.body.firstChild);

    // ── Extract and execute the page's own scripts ────────────────────────────
    const parser = new DOMParser();
    const doc = parser.parseFromString(content.content, 'text/html');
    const scripts = doc.querySelectorAll('script');
    const addedScripts = [globalsScript];

    // Clean up any existing scripts from previous renders to prevent duplicates
    const existingPageScripts = document.querySelectorAll('[data-html-builder-script]');
    existingPageScripts.forEach(oldScript => {
      if (oldScript.parentNode) {
        oldScript.parentNode.removeChild(oldScript);
      }
    });

    // Track which scripts have been executed to prevent re-execution
    const executedScriptHashes = new Set();

    scripts.forEach((script, index) => {
      // Create a simple hash of the script content to detect duplicates
      const scriptHash = script.src || script.textContent.substring(0, 100);
      if (executedScriptHashes.has(scriptHash)) {
        console.log('Skipping duplicate script:', scriptHash.substring(0, 50));
        return; // Skip duplicate scripts
      }
      executedScriptHashes.add(scriptHash);

      const newScript = document.createElement('script');
      newScript.setAttribute('data-html-builder-script', 'true');
      newScript.setAttribute('data-script-index', index);
      newScript.setAttribute('data-script-hash', scriptHash);

      // Copy all attributes (like src, type, etc.)
      Array.from(script.attributes).forEach(attr => {
        if (attr.name !== 'data-html-builder-script' && attr.name !== 'data-script-index' && attr.name !== 'data-script-hash') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });

      // If it's an inline script, process the code
      if (!script.src) {
        let code = script.textContent;
        // Replace legacy placeholder API URL with our actual endpoint
        code = code.replace(/https:\/\/your-api-url\.com\/api\/leads/g, '/api/public/landing-page');
        // Wrap in IIFE to prevent variable redeclaration issues
        // The IIFE creates a new scope, so const/let/var declarations won't conflict
        code = `(function() { try { ${code} } catch(e) { console.error('HTML Builder script error:', e); } })();`;
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
      // Also clean up any remaining html-builder scripts
      const remainingScripts = document.querySelectorAll('[data-html-builder-script]');
      remainingScripts.forEach(oldScript => {
        if (oldScript.parentNode) {
          oldScript.parentNode.removeChild(oldScript);
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
        background: darkMode ? '#0f172a' : '#f5f5f5'
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
        background: darkMode ? '#0f172a' : '#f5f5f5'
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

  console.log('🎨 Rendering content:', {
    hasBuilderPageData: !!content?.builder_page_data,
    hasContent: !!content?.content,
    contentLength: content?.content?.length,
    builderLayout: content?.builder_layout
  });

  // Visual Builder content — render using PreviewCanvas instead of dangerouslySetInnerHTML
  if (content?.builder_page_data) {
    console.log('🖼️ Rendering as Visual Builder page');
    return <StandaloneBuilderPage content={content} />;
  }
  
  console.log('📝 Rendering as HTML Builder page');

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
        background: darkMode ? '#0f172a' : '#fff'
      }}>
        <div
          dangerouslySetInnerHTML={{ __html: rawHtml }}
          style={{
            width: '100%',
            minHeight: '100vh'
          }}
        />
        {/* Hidden content_id field for HTML forms */}
        <input type="hidden" id="html-content-id" data-content-id={content.id} />
        <script dangerouslySetInnerHTML={{
          __html: `
            // HTML Builder Form Submission Enhancement
            (function() {
              console.log('HTML Builder page loaded with content_id:', ${content.id});
              console.log('Webhook URL:', '${content.webhook_url || 'none'}');
              console.log('Custom fields:', ${JSON.stringify(content.custom_fields || [])});

              // Ensure window.__CONTENT_ID is set
              if (!window.__CONTENT_ID) {
                window.__CONTENT_ID = ${content.id};
                console.log('Set window.__CONTENT_ID to:', window.__CONTENT_ID);
              }

              // Monitor form submissions
              document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.action && form.action.includes('/api/public/landing-page')) {
                  console.log('Form submission detected to:', form.action);
                  console.log('Form data before submission:');
                  const formData = new FormData(form);
                  for (let [key, value] of formData.entries()) {
                    console.log(key, ':', value);
                  }

                  // Ensure content_id is included
                  if (!formData.has('content_id')) {
                    const contentId = ${content.id};
                    console.log('Adding content_id to form:', contentId);
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = 'content_id';
                    hiddenField.value = contentId;
                    form.appendChild(hiddenField);
                  }
                }
              }, true);

              // Monitor fetch calls and inject content_id
              const originalFetch = window.fetch;
              window.fetch = function(...args) {
                if (args[0] && (typeof args[0] === 'string' && args[0].includes('/api/public/landing-page'))) {
                  console.log('Fetch call to /api/public/landing-page detected');
                  if (args[1] && args[1].body) {
                    try {
                      const body = typeof args[1].body === 'string' ? JSON.parse(args[1].body) : args[1].body;
                      console.log('Fetch body before injection:', body);

                      // Inject content_id if missing
                      if (body && typeof body === 'object' && !body.content_id) {
                        body.content_id = ${content.id};
                        args[1] = { ...args[1], body: JSON.stringify(body) };
                        console.log('Fetch body after injection:', body);
                      }
                    } catch(e) {
                      console.log('Fetch body (raw):', args[1].body);
                    }
                  }
                }
                return originalFetch.apply(this, args);
              };
            })();
          `
        }} />
      </div>
    </>
  );
};

export default StandaloneLandingPage;
