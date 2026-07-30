/**
 * Rich Text Renderer Component
 * Frontend renderer for rich text widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function RichTextRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, { html: '' });
  const styles = node.styles || {};

  const containerStyles = {
    color: darkMode ? '#cbd5e1' : undefined,
    ...styles,
  };

  return (
    <div 
      style={containerStyles}
      dangerouslySetInnerHTML={{ __html: content.html || '' }}
    />
  );
}
