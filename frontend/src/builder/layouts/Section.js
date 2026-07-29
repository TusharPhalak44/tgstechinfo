/**
 * Section Layout Component
 * Container for layout sections in the builder
 */

import React from 'react';
import { NodeType } from '../utils/types';

/**
 * Section Component
 * Renders a layout section with its children
 */
export function Section({ node, children, onUpdate }) {
  const sectionStyle = {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    marginBottom: 20,
    border: '1px solid #e8e8e8',
    ...node.styles,
  };

  return (
    <div style={sectionStyle}>
      {children}
    </div>
  );
}

/**
 * Section Renderer (Frontend)
 */
export function SectionRenderer({ node, children }) {
  const sectionStyle = {
    ...node.styles,
  };

  return (
    <div style={sectionStyle}>
      {children}
    </div>
  );
}

/**
 * Widget Registration
 */
export const sectionRegistration = {
  type: NodeType.SECTION,
  component: Section,
  renderer: SectionRenderer,
  defaultProps: {
    children: [],
  },
  defaultStyles: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px 28px',
    marginBottom: '20px',
    border: '1px solid #e8e8e8',
  },
  metadata: {
    label: 'Section',
    icon: '📦',
    category: 'layout',
    description: 'Container for layout sections',
  },
};
