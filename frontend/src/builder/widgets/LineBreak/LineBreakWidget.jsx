/**
 * Line Break Widget Component
 * Builder component for line break editing
 */

import React from 'react';

export default function LineBreakWidget({ node, onUpdate }) {
  return (
    <div style={{ padding: 16 }}>
      <p style={{ color: '#666', fontSize: 12 }}>
        Line break element - adds a single line break between content.
      </p>
    </div>
  );
}
