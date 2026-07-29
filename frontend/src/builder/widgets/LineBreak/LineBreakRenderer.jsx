/**
 * Line Break Renderer Component
 * Frontend renderer for line break widget
 */

import React from 'react';

export default function LineBreakRenderer({ node }) {
  const styles = node.styles || {};

  const lineBreakStyles = {
    display: 'block',
    height: styles.height || '1em',
    ...styles,
  };

  return <br style={lineBreakStyles} />;
}
