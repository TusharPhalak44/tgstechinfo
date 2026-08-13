/**
 * BuilderPageRenderer
 * Renders Visual Builder (builder_page_data) content within ContentRenderer context.
 * Used in review pages and other content display contexts.
 */

import React, { useEffect } from 'react';
import { ConfigProvider, theme, Typography } from 'antd';
import { BuilderProvider, useBuilderActions } from '../../builder/core/BuilderStore.jsx';
import { registerAllWidgets } from '../../builder/registry/registerWidgets';
import PreviewCanvas from '../../builder/components/PreviewCanvas';
import { BuilderContentIdContext } from '../../builder/components/VisualBuilder.jsx';

const { Text } = Typography;

// ── Inner component — has access to BuilderStore ──────────────────────────────
function BuilderPageContent({ content, darkMode }) {
  const actions = useBuilderActions();

  useEffect(() => {
    console.log('[BuilderPageContent] Initializing visual builder rendering...');
    console.log('[BuilderPageContent] Content ID:', content?.id);
    console.log('[BuilderPageContent] Has builder_page_data:', !!content?.builder_page_data);
    
    // Register widgets once globally
    if (!window.__widgetsRegistered) {
      console.log('[BuilderPageContent] Registering widgets...');
      registerAllWidgets();
      window.__widgetsRegistered = true;
    }

    // Load the page tree from builder_page_data
    if (content?.builder_page_data) {
      let pageData = content.builder_page_data;
      if (typeof pageData === 'string') {
        try {
          pageData = JSON.parse(pageData);
          console.log('[BuilderPageContent] Parsed builder_page_data successfully');
        } catch (error) {
          console.error('[BuilderPageContent] Failed to parse builder_page_data:', error);
          pageData = null;
        }
      }
      
      if (pageData) {
        console.log('[BuilderPageContent] Loading page data into builder store...');
        console.log('[BuilderPageContent] Page data:', pageData);
        actions.loadPage(pageData);
        console.log('[BuilderPageContent] Page loaded successfully');
      } else {
        console.error('[BuilderPageContent] Page data is null after parsing');
      }
    } else {
      console.warn('[BuilderPageContent] No builder_page_data found in content');
    }
  }, [content?.id, content?.builder_page_data, actions]);

  return (
    <div style={{
      width: '100%',
      minHeight: '400px',
      background: darkMode ? '#1e293b' : '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: darkMode ? '#0f172a' : '#f0f9ff',
        borderRadius: '8px',
        borderLeft: `4px solid ${darkMode ? '#3b82f6' : '#0ea5e9'}`
      }}>
        <Text strong style={{ color: darkMode ? '#60a5fa' : '#0369a1' }}>
          Visual Builder Content
        </Text>
        <div style={{
          fontSize: '12px',
          color: darkMode ? '#94a3b8' : '#64748b',
          marginTop: '4px'
        }}>
          This page was created with the drag-and-drop visual builder.
        </div>
      </div>
      <PreviewCanvas contentWebhookUrl={content?.webhook_url} />
    </div>
  );
}

// ── Public export — wraps with all required providers ─────────────────────────
export default function BuilderPageRenderer({ content, darkMode }) {
  console.log('[BuilderPageRenderer] Component loaded');
  console.log('[BuilderPageRenderer] Content:', content);
  console.log('[BuilderPageRenderer] Dark mode:', darkMode);
  
  return (
    <BuilderContentIdContext.Provider value={content.id}>
      <ConfigProvider theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm
      }}>
        <BuilderProvider>
          <BuilderPageContent content={content} darkMode={darkMode} />
        </BuilderProvider>
      </ConfigProvider>
    </BuilderContentIdContext.Provider>
  );
}
