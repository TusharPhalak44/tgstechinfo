/**
 * PDF Renderer Component
 * Frontend renderer for PDF widget - shows in canvas
 */

import React from 'react';
import { FilePdfOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function PDFRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const url = content.url || '';
  const width = settings.width === 'custom' ? `${settings.customWidth || 800}px` : settings.width || '100%';
  const height = settings.height || 600;
  const showDownload = settings.showDownload !== false;
  const downloadText = settings.downloadText || 'Download PDF';

  const containerStyles = {
    ...styles,
  };

  // Show placeholder when no URL is set
  if (!url) {
    return (
      <div style={{
        ...containerStyles,
        border: '2px dashed #d9d9d9',
        borderRadius: 8,
        padding: 40,
        textAlign: 'center',
        background: darkMode ? '#1e293b' : '#fafafa',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <FilePdfOutlined style={{ fontSize: 48, color: darkMode ? '#64748b' : '#bfbfbf', marginBottom: 12 }} />
        <div style={{ fontSize: 14, color: darkMode ? '#94a3b8' : '#8c8c8c', marginBottom: 4 }}>PDF Widget</div>
        <div style={{ fontSize: 12, color: darkMode ? '#64748b' : '#bfbfbf' }}>
          Select this widget and add a PDF URL in the Content panel →
        </div>
      </div>
    );
  }

  // Show PDF iframe when URL is set
  const iframeStyles = {
    width: width,
    height: `${height}px`,
    border: 'none',
  };

  return (
    <div style={containerStyles}>
      <iframe
        src={url}
        style={iframeStyles}
        title="PDF Viewer"
      />
      {showDownload && url && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <a
            href={url}
            download
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#4a7cff',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {downloadText}
          </a>
        </div>
      )}
    </div>
  );
}
