/**
 * Bullet List Renderer Component
 * Frontend renderer for bullet list widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function BulletListRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, { items: ['List item 1', 'List item 2'] });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const items = content.items || [];
  const listStyle = settings.style || 'disc';

  const listStyles = {
    paddingLeft: '20px',
    margin: '16px 0',
    listStyleType: listStyle,
    color: darkMode ? '#cbd5e1' : '#262626',
    ...styles,
  };

  return (
    <ul style={listStyles}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: '8px' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
