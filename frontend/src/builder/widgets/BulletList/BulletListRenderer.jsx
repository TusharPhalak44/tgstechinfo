/**
 * Bullet List Renderer Component
 * Frontend renderer for bullet list widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function BulletListRenderer({ node }) {
  const content = safeParseJsonContent(node.content, { items: ['List item 1', 'List item 2'] });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const items = content.items || [];
  const listStyle = settings.style || 'disc';

  const listStyles = {
    paddingLeft: '20px',
    margin: '16px 0',
    listStyleType: listStyle,
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
