/**
 * Column Layout Component
 * Column container for responsive layouts
 */

import React from 'react';
import { NodeType } from '../utils/types';

/**
 * Column Component
 * Renders a column within a container
 */
export function Column({ node, children, onUpdate }) {
  const columnStyle = {
    flex: node.settings?.flex || 1,
    minWidth: node.settings?.minWidth || '200px',
    padding: node.styles?.padding || '12px',
    background: node.styles?.background || 'transparent',
    border: node.styles?.border || 'none',
    borderRadius: node.styles?.borderRadius || '0',
    ...node.styles,
  };

  return (
    <div style={columnStyle}>
      {children}
    </div>
  );
}

/**
 * Column Renderer (Frontend)
 */
export function ColumnRenderer({ node, children }) {
  const columnStyle = {
    flex: node.settings?.flex || 1,
    minWidth: node.settings?.minWidth || '200px',
    ...node.styles,
  };

  return (
    <div style={columnStyle}>
      {children}
    </div>
  );
}

/**
 * Widget Registration
 */
export const columnRegistration = {
  type: NodeType.COLUMN,
  component: Column,
  renderer: ColumnRenderer,
  defaultProps: {
    children: [],
  },
  defaultStyles: {
    flex: 1,
    minWidth: '200px',
    padding: '12px',
  },
  metadata: {
    label: 'Column',
    icon: '📊',
    category: 'layout',
    description: 'Column for responsive layouts',
  },
};
