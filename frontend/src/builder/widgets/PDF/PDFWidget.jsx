/**
 * PDF Widget Component
 * Builder component for PDF embedding - shows preview in canvas
 */

import React from 'react';
import { FilePdfOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function PDFWidget({ node, onUpdate, error }) {
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};
  
  const url = content.url || '';
  const height = settings.height || 600;

  if (error) {
    return <div style={{ padding: 16, color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 16, minHeight: 200 }}>
      {url ? (
        // Show PDF preview in iframe
        <div style={{ 
          border: '1px solid #e8e8e8', 
          borderRadius: 8, 
          overflow: 'hidden',
          background: '#fff'
        }}>
          <iframe
            src={url}
            style={{
              width: '100%',
              height: `${Math.min(height, 400)}px`, // Cap height in builder preview
              border: 'none',
              display: 'block',
            }}
            title="PDF Preview"
          />
        </div>
      ) : (
        // Show placeholder when no URL is set
        <div style={{
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          background: '#fafafa',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FilePdfOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 4 }}>PDF Widget</div>
          <div style={{ fontSize: 12, color: '#bfbfbf' }}>
            Configure PDF URL in the inspector panel
          </div>
        </div>
      )}
    </div>
  );
}
