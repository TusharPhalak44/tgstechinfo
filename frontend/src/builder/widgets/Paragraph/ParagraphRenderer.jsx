/**
 * Paragraph Renderer Component
 * Frontend renderer for paragraph widget
 */

import React from 'react';

export default function ParagraphRenderer({ node }) {
  const styles = node.styles || {};
  const content = node.content || 'Paragraph text goes here...';
  const alignment = node.alignment || 'left';

  const paragraphStyles = {
    textAlign: alignment,
    margin: styles.margin || '0 0 16px 0',
    color: styles.color || '#262626',
    fontSize: styles.fontSize || '16px',
    fontWeight: styles.fontWeight || '400',
    lineHeight: styles.lineHeight || '1.6',
    letterSpacing: styles.letterSpacing || '0',
    ...styles,
  };

  return <p style={paragraphStyles}>{content}</p>;
}
