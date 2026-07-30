/**
 * Numbered List Renderer Component
 * Frontend renderer for numbered list widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function NumberedListRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, { items: ['First item', 'Second item'] });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const items = content.items || [];
  const listStyle = settings.style || 'decimal';
  const start = settings.start || 1;

  const listStyles = {
    paddingLeft: '20px',
    margin: '16px 0',
    listStyleType: listStyle,
    color: darkMode ? '#cbd5e1' : '#262626',
    ...styles,
  };

  return (
    <ol style={listStyles} start={start}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: '8px' }}>
          {item}
        </li>
      ))}
    </ol>
  );
}
