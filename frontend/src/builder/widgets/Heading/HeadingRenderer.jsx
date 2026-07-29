/**
 * Heading Renderer Component
 * Frontend renderer for heading widget
 */

import React from 'react';

export default function HeadingRenderer({ node }) {
  const styles = node.styles || {};
  const headingLevel = node.headingLevel || 'h2';
  const content = node.content || 'Heading';
  const alignment = node.alignment || 'left';

  const headingStyles = {
    textAlign: alignment,
    margin: styles.margin || '0 0 16px 0',
    color: styles.color || '#262626',
    fontSize: styles.fontSize || (headingLevel === 'h1' ? '32px' : headingLevel === 'h2' ? '24px' : headingLevel === 'h3' ? '20px' : '16px'),
    fontWeight: styles.fontWeight || '600',
    lineHeight: styles.lineHeight || '1.2',
    ...styles,
  };

  const HeadingTag = headingLevel;

  return <HeadingTag style={headingStyles}>{content}</HeadingTag>;
}
