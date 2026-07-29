/**
 * Container Layout Component
 * Flexible container for widgets and nested layouts
 */

import React from 'react';
import { NodeType } from '../utils/types';

/**
 * Container Component
 * Renders a flexible container for widgets
 */
export function Container({ node, children, onUpdate }) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '200px',
    border: node.styles?.border || '1px solid #e8e8e8',
    borderRadius: node.styles?.borderRadius || '8px',
    padding: node.styles?.padding || '16px',
    background: node.styles?.background || '#fafafa',
    ...node.styles,
  };

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
}

/**
 * Container Renderer (Frontend)
 */
export function ContainerRenderer({ node, children }) {
  const containerStyle = {
    ...node.styles,
  };

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
}

/**
 * Widget Registration
 */
export const containerRegistration = {
  type: NodeType.CONTAINER,
  component: Container,
  renderer: ContainerRenderer,
  defaultProps: {
    children: [],
  },
  defaultStyles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '200px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    padding: '16px',
    background: '#fafafa',
  },
  metadata: {
    label: 'Container',
    icon: '📦',
    category: 'layout',
    description: 'Flexible container for widgets',
  },
};
