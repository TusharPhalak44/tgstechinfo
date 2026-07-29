/**
 * Section Break Renderer Component
 * Frontend renderer for section break widget
 */

import React from 'react';

export default function SectionBreakRenderer({ node }) {
  const settings = node.settings || {};
  const styles = node.styles || {};

  const style = settings.style || 'line';
  const thickness = settings.thickness || 1;
  const color = settings.color || '#e8e8e8';
  const width = settings.width === 'custom' ? `${settings.customWidth || 200}px` : settings.width || '100%';
  const alignment = settings.alignment || 'center';
  const spacingAbove = settings.spacingAbove || 20;
  const spacingBelow = settings.spacingBelow || 20;

  const borderStyles = {
    line: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    space: 'none',
  };

  const containerStyles = {
    display: 'flex',
    justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
    marginTop: `${spacingAbove}px`,
    marginBottom: `${spacingBelow}px`,
    ...styles,
  };

  const lineStyles = {
    width: width,
    borderTop: `${thickness}px ${borderStyles[style]} ${color}`,
    borderStyle: style === 'space' ? 'none' : borderStyles[style],
  };

  if (style === 'space') {
    return <div style={{ height: `${spacingAbove + spacingBelow}px`, ...styles }} />;
  }

  return (
    <div style={containerStyles}>
      <div style={lineStyles} />
    </div>
  );
}
