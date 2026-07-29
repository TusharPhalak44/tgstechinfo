/**
 * Spacer Renderer Component
 * Frontend renderer for spacer widget
 */

import React from 'react';

export default function SpacerRenderer({ node }) {
  const settings = node.settings || {};
  const styles = node.styles || {};

  const spacerStyles = {
    height: `${settings.height || 20}px`,
    width: settings.width === 'custom' ? `${settings.customWidth || 100}px` : settings.width || '100%',
    display: 'block',
    ...styles,
  };

  return <div style={spacerStyles} />;
}
