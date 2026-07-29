/**
 * Rich Text Renderer Component
 * Frontend renderer for rich text widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function RichTextRenderer({ node }) {
  const content = safeParseJsonContent(node.content, { html: '' });
  const styles = node.styles || {};

  const containerStyles = {
    ...styles,
  };

  return (
    <div 
      style={containerStyles}
      dangerouslySetInnerHTML={{ __html: content.html || '' }}
    />
  );
}
