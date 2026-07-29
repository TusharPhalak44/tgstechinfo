/**
 * Code Block Renderer Component
 * Frontend renderer for code block widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function CodeBlockRenderer({ node }) {
  const content = safeParseJsonContent(node.content, { code: '', language: 'javascript' });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const language = settings.language || 'javascript';
  const theme = settings.theme || 'dark';
  const showLineNumbers = settings.showLineNumbers !== false;

  const bgColors = {
    dark: '#1e1e1e',
    light: '#f5f5f5',
  };

  const textColors = {
    dark: '#d4d4d4',
    light: '#333333',
  };

  const codeStyles = {
    backgroundColor: bgColors[theme],
    color: textColors[theme],
    padding: '16px 20px',
    borderRadius: '8px',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    overflow: 'auto',
    whiteSpace: 'pre',
    ...styles,
  };

  const lines = (content.code || '').split('\n');

  return (
    <div style={codeStyles}>
      {showLineNumbers && (
        <div style={{ 
          display: 'flex',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
          fontSize: '12px',
          color: theme === 'dark' ? '#888' : '#666',
        }}>
          <span style={{ fontWeight: 600, marginRight: '8px' }}>{language}</span>
        </div>
      )}
      <pre style={{ margin: 0, fontFamily: 'inherit' }}>
        {showLineNumbers ? (
          lines.map((line, index) => (
            <div key={index} style={{ display: 'flex' }}>
              <span style={{ 
                color: theme === 'dark' ? '#666' : '#999',
                marginRight: '16px',
                userSelect: 'none',
                minWidth: '24px',
                textAlign: 'right',
              }}>
                {index + 1}
              </span>
              <span>{line || ' '}</span>
            </div>
          ))
        ) : (
          content.code || ''
        )}
      </pre>
    </div>
  );
}
