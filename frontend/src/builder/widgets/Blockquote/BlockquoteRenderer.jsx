/**
 * Blockquote Renderer Component
 * Frontend renderer for blockquote widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function BlockquoteRenderer({ node }) {
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || {};
  const styles = node.styles || {};

  const alignment = settings.alignment || 'left';
  const style = settings.style || 'default';

  const baseStyles = {
    borderLeft: style === 'minimal' ? '2px solid #ccc' : '4px solid #4a7cff',
    padding: style === 'minimal' ? '8px 12px' : '16px 20px',
    margin: '20px 0',
    backgroundColor: style === 'modern' ? '#f5f5f5' : 'transparent',
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
        <cite style={{ display: 'block', marginTop: 8, fontSize: '0.9em', fontStyle: 'normal' }}>
          {content.citation}
        </cite>
      )}
    </blockquote>
  );
}
