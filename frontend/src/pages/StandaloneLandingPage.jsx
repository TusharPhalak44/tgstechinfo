import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Spin, Result, Button } from 'antd';
import { useCookieConsent } from '../context/CookieContext';
import { useTheme } from '../context/ThemeContext';
import StandaloneBuilderPage from './StandaloneBuilderPage';
import { useTracking } from '../context/TrackingContext';
import useEngagementTracking from '../hooks/useEngagementTracking';

const StandaloneLandingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { consent, hasAnalyticsConsent } = useCookieConsent();
  const { darkMode } = useTheme();
  const { isTrackingEnabled } = useTracking();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEngagementTracking({
    contentId: content?.id,
    contentType: content?.content_type_slug || content?.content_type,
    pageTitle: content?.title,
    enabled: !!content?.id && isTrackingEnabled
  });

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

      if (data?.id) {
        axios.post(`/api/public/content/${data.id}/view`).catch(() => { });
      }

      console.log('Landing page loaded with consent:', consent, 'hasAnalyticsConsent:', hasAnalyticsConsent);

      // Set consent UUID globally if available
      if (consent?.uuid) {
        window.__CONSENT_UUID = consent.uuid;
        console.log('Set CONSENT_UUID:', consent.uuid);
      }

      // Initialize tracking session if analytics consent is granted and session doesn't exist
      if (hasAnalyticsConsent && consent && !window.__SESSION_UUID) {
        console.log('Initializing tracking session on landing page...');
        try {
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
              // Don't block page functionality if tracking fails
              console.warn('Tracking initialization failed, but page will continue to function');
            });
        } catch (trackingError) {
          console.error('Tracking system error:', trackingError);
          console.warn('Tracking system unavailable, but page will continue to function');
        }
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

      // Automatic Form Submission Interceptor for HTML Builder pages
      (function() {
        document.addEventListener('submit', function(e) {
          const form = e.target;
          if (!form || form.tagName !== 'FORM') return;
          
          // Prevent standard browser GET/POST page navigation
          e.preventDefault();
          e.stopPropagation();

          console.log('🚀 Form submission intercepted on HTML Builder page');
          const formData = new FormData(form);
          const payload = {
            content_id: window.__CONTENT_ID || ${content.id},
            session_uuid: window.__SESSION_UUID || null,
            consent_uuid: window.__CONSENT_UUID || null
          };

          // Add FormData entries
          for (let [key, value] of formData.entries()) {
            if (key) {
              payload[key] = value;
            }
          }

          // Harvest input elements directly in case any input lacked name attribute or used id
          const inputs = form.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            const key = input.name || input.id;
            if (key && input.value !== undefined && !payload[key]) {
              payload[key] = input.value;
            }
          });

          console.log('Sending lead submission payload to /api/public/landing-page:', payload);

          // Disable submit button during request
          const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type="button"])');
          const originalBtnText = submitBtn ? (submitBtn.innerText || submitBtn.value) : '';
          if (submitBtn) {
            submitBtn.disabled = true;
            if (submitBtn.tagName === 'BUTTON') submitBtn.innerText = 'Submitting...';
            else submitBtn.value = 'Submitting...';
          }

          // Send POST request to backend API
          fetch('/api/public/landing-page', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
          .then(res => {
            if (!res.ok) throw new Error('HTTP status ' + res.status);
            return res.json();
          })
          .then(data => {
            console.log('✅ Lead form submit success:', data);

            // Hide error alert if previously shown
            const errBox = form.querySelector('.form-error-alert');
            if (errBox) errBox.style.display = 'none';

            // Check if there is a redirect URL from API response or form payload
            const rawTarget = data.redirect_url || data.page_url || payload.page_url || payload.redirect_url || payload.thank_you_url || payload.return_url;

            if (rawTarget && typeof rawTarget === 'string' && rawTarget.trim() && rawTarget.trim() !== '#' && !rawTarget.trim().startsWith('javascript:')) {
              const destination = rawTarget.trim();
              console.log('🔗 Redirecting to page_url:', destination);

              // Display quick redirect feedback inside or below the form
              let alertBox = form.querySelector('.form-success-alert');
              if (!alertBox) {
                alertBox = document.createElement('div');
                alertBox.className = 'form-success-alert';
                alertBox.style.cssText = 'padding: 12px 16px; margin-top: 16px; background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;';
                form.appendChild(alertBox);
              }
              alertBox.style.display = 'block';
              alertBox.innerText = 'Thank you! Redirecting...';

              // Redirect
              setTimeout(() => {
                window.location.href = destination;
              }, 300);
              return;
            }
            
            // Display success message inside or below the form if no redirect
            let alertBox = form.querySelector('.form-success-alert');
            if (!alertBox) {
              alertBox = document.createElement('div');
              alertBox.className = 'form-success-alert';
              alertBox.style.cssText = 'padding: 12px 16px; margin-top: 16px; background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;';
              form.appendChild(alertBox);
            }
            alertBox.style.display = 'block';
            alertBox.innerText = data.message || 'Thank you! Your details have been submitted successfully.';

            form.reset();
          })
          .catch(err => {
            console.error('❌ Lead form submit error:', err);
            let alertBox = form.querySelector('.form-error-alert');
            if (!alertBox) {
              alertBox = document.createElement('div');
              alertBox.className = 'form-error-alert';
              alertBox.style.cssText = 'padding: 12px 16px; margin-top: 16px; background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;';
              form.appendChild(alertBox);
            }
            alertBox.style.display = 'block';
            alertBox.innerText = 'Failed to submit details. Please try again.';
          })
          .finally(() => {
            if (submitBtn) {
              submitBtn.disabled = false;
              if (submitBtn.tagName === 'BUTTON') submitBtn.innerText = originalBtnText;
              else submitBtn.value = originalBtnText;
            }
          });
        }, true);
      })();

      // Auto-patch fetch so ANY call to /api/public/landing-page automatically
      // includes content_id, session_uuid, and consent_uuid in the JSON body
      (function() {
        const _originalFetch = window.fetch;
        window.fetch = function(url, options) {
          try {
            const urlStr = (typeof url === 'string') ? url : (url.url || String(url));
            if (urlStr.includes('/api/users')) {
              url = urlStr.replace('/api/users', '/api/public/landing-page');
            }
            if (urlStr.includes('/api/public/landing-page') && options && options.body) {
              let body;
              try { body = JSON.parse(options.body); } catch(e) { body = null; }
              if (body && typeof body === 'object') {
                if (!body.content_id) body.content_id = window.__CONTENT_ID;
                if (!body.session_uuid) body.session_uuid = window.__SESSION_UUID;
                if (!body.consent_uuid) body.consent_uuid = window.__CONSENT_UUID;
                options = { ...options, body: JSON.stringify(body) };
              }
            }
          } catch(e) { /* keep original */ }
          return _originalFetch.call(this, url, options);
        };
      })();

      // Also patch XMLHttpRequest
      (function() {
        const _XHROpen = XMLHttpRequest.prototype.open;
        const _XHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
          this._patchUrl = (typeof url === 'string') ? url : String(url);
          if (this._patchUrl.includes('/api/users')) {
            this._patchUrl = this._patchUrl.replace('/api/users', '/api/public/landing-page');
            arguments[1] = this._patchUrl;
          }
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
                this.setRequestHeader('Content-Type', 'application/json');
              }
            }
          } catch(e) { /* keep original */ }
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
      const scriptHash = script.src || script.textContent.substring(0, 100);
      if (executedScriptHashes.has(scriptHash)) {
        return; // Skip duplicate scripts
      }
      executedScriptHashes.add(scriptHash);

      const newScript = document.createElement('script');
      newScript.setAttribute('data-html-builder-script', 'true');
      newScript.setAttribute('data-script-index', index);
      newScript.setAttribute('data-script-hash', scriptHash);

      Array.from(script.attributes).forEach(attr => {
        if (attr.name !== 'data-html-builder-script' && attr.name !== 'data-script-index' && attr.name !== 'data-script-hash') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });

      if (!script.src) {
        let code = script.textContent;
        code = code.replace(/https:\/\/your-api-url\.com\/api\/leads/g, '/api/public/landing-page');
        code = code.replace(/\/api\/users/g, '/api/public/landing-page');

        // Wrap in IIFE with DOM element null-checking safeguards
        code = `(function() { try { 
          const _safeGetId = document.getElementById.bind(document);
          document.getElementById = function(id) {
            const res = _safeGetId(id);
            if (!res) {
              return { addEventListener: function(){}, style: {}, setAttribute: function(){}, value: '' };
            }
            return res;
          };
          
          const _safeQuery = document.querySelector.bind(document);
          document.querySelector = function(sel) {
            const res = _safeQuery(sel);
            if (!res && (sel.includes('form') || sel.includes('btn') || sel.includes('button') || sel.includes('submit'))) {
              return { addEventListener: function(){}, style: {}, setAttribute: function(){}, value: '' };
            }
            return res;
          };
          
          ${code} 
        } catch(e) { console.error('HTML Builder script error:', e); } })();`;
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
    .replace(/https:\/\/your-api-url\.com\/api\/leads/g, '/api/public/landing-page')
    .replace(/\/api\/users/g, '/api/public/landing-page');

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
      </div>
    </>
  );
};

export default StandaloneLandingPage;
