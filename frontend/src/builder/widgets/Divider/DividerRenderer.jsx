/**
 * Divider Renderer Component
 * Frontend renderer for divider widget
 */

import React from 'react';

export default function DividerRenderer({ node }) {
  const settings = node.settings || {};
  const styles = node.styles || {};

  const dividerStyles = {
    border: 'none',
    borderTop: `${settings.thickness || 1}px ${settings.style || 'solid'} ${settings.color || '#e8e8e8'}`,
    margin: styles.margin || '20px 0',
    width: '100%',
    ...styles,
  };

  return <hr style={dividerStyles} />;
}
