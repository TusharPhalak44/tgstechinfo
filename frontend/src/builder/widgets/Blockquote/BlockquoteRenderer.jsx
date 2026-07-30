/**
 * Blockquote Renderer Component
 * Frontend renderer for blockquote widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function BlockquoteRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || {};
  const styles = node.styles || {};

  const alignment = settings.alignment || 'left';
  const style = settings.style || 'default';

  const baseStyles = {
    borderLeft: style === 'minimal' ? `2px solid ${darkMode ? '#475569' : '#ccc'}` : '4px solid #4a7cff',
    padding: style === 'minimal' ? '8px 12px' : '16px 20px',
    margin: '20px 0',
    backgroundColor: style === 'modern' ? (darkMode ? '#0f172a' : '#f5f5f5') : 'transparent',
    color: darkMode ? '#cbd5e1' : undefined,
    fontStyle: 'italic',
    textAlign: alignment,
    ...styles,
  };

  return (
    <blockquote style={baseStyles}>
      <p style={{ margin: 0, fontSize: '1.1em' }}>
        {content.text || ''}
      </p>
      {content.citation && (
        <cite style={{ display: 'block', marginTop: 8, fontSize: '0.9em', fontStyle: 'normal', color: darkMode ? '#94a3b8' : undefined }}>
          {content.citation}
        </cite>
      )}
    </blockquote>
  );
}
