/**
 * StandaloneBuilderPage
 * Renders Visual Builder (builder_page_data) content at /content/:slug
 * No Navbar or Footer — full-screen, same as HTML builder landing pages.
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConfigProvider, theme } from 'antd';
import { BuilderProvider, useBuilderActions } from '../builder/core/BuilderStore.jsx';
import { registerAllWidgets } from '../builder/registry/registerWidgets';
import PreviewCanvas from '../builder/components/PreviewCanvas';
import { BuilderContentIdContext } from '../builder/components/VisualBuilder.jsx';
import { useTheme } from '../context/ThemeContext';

// ── Inner component — has access to BuilderStore ──────────────────────────────
function BuilderPageContent({ content, contentWebhookUrl }) {
  const actions = useBuilderActions();
  const { darkMode } = useTheme();

  useEffect(() => {
    // Register widgets once globally
    if (!window.__widgetsRegistered) {
      registerAllWidgets();
      window.__widgetsRegistered = true;
    }

    // Load the page tree from builder_page_data
    if (content?.builder_page_data) {
      let pageData = content.builder_page_data;
      if (typeof pageData === 'string') {
        try { pageData = JSON.parse(pageData); } catch { pageData = null; }
      }
      if (pageData) {
        actions.loadPage(pageData);
      }
    }
  }, [content?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: darkMode ? '#0f172a' : '#fff',
      margin: 0,
      padding: 0,
    }}>
      <PreviewCanvas contentWebhookUrl={contentWebhookUrl} />
    </div>
  );
}

// ── Public export — wraps with all required providers ─────────────────────────
export default function StandaloneBuilderPage({ content }) {
  const { darkMode } = useTheme();

  return (
    <>
      <Helmet>
        <title>{content.seo_meta_title || content.title}</title>
        <meta name="description" content={content.seo_meta_description || content.short_description || ''} />
        <meta name="keywords" content={content.seo_meta_keywords || ''} />
        <meta property="og:title" content={content.seo_meta_title || content.title} />
        <meta property="og:description" content={content.seo_meta_description || content.short_description || ''} />
        <meta property="og:type" content="website" />
        {content.banner_image && (
          <meta property="og:image" content={`${window.location.origin}/uploads/${content.banner_image}`} />
        )}
        <link rel="canonical" href={`${window.location.origin}/content/${content.slug}`} />
      </Helmet>

      {/* BuilderContentIdContext makes contentId available to FormRenderer etc. */}
      <BuilderContentIdContext.Provider value={content.id}>
        <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
          <BuilderProvider>
            <BuilderPageContent content={content} contentWebhookUrl={content?.webhook_url} />
          </BuilderProvider>
        </ConfigProvider>
      </BuilderContentIdContext.Provider>
    </>
  );
}
