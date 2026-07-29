/**
 * PDF Renderer Component
 * Frontend renderer for PDF widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function PDFRenderer({ node }) {
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
