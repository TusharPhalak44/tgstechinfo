/**
 * HTML Widget Component
 * Builder component for HTML editing - shows preview in canvas
 */

import React, { useRef, useEffect } from 'react';
import { CodeOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function HTMLWidget({ node }) {
  const content = safeParseJsonContent(node.content, { html: '', css: '', js: '' });
  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current && content.html) {
      // Inject HTML content
      previewRef.current.innerHTML = content.html;

      // Inject CSS if provided
      if (content.css) {
        const styleId = `html-widget-preview-css-${node.id}`;
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = content.css;
      }
    }

    // Cleanup on unmount
    return () => {
      const styleId = `html-widget-preview-css-${node.id}`;
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [content.html, content.css, node.id]);

  return (
    <div style={{ padding: 16, minHeight: 120 }}>
      {content.html ? (
        // Show HTML preview
        <div style={{
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          padding: 16,
          minHeight: 100,
          background: '#fff',
          position: 'relative',
        }}>
          <div
            ref={previewRef}
            style={{ minHeight: 60 }}
          />
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 10,
            color: '#999',
            background: '#f5f5f5',
            padding: '2px 6px',
            borderRadius: 4,
            pointerEvents: 'none',
          }}>
            HTML Preview
          </div>
        </div>
      ) : (
        // Show placeholder when no HTML is set
        <div style={{
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          background: '#fafafa',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <CodeOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 4 }}>HTML Block Widget</div>
          <div style={{ fontSize: 12, color: '#bfbfbf' }}>
            Configure HTML code in the inspector panel
          </div>
        </div>
      )}
    </div>
  );
}
