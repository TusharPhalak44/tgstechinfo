/**
 * Heading Widget
 * Independent widget module for heading elements
 */

import React from 'react';
import { Input as AntInput, Select as AntSelect } from 'antd';
import { NodeType } from '../../utils/types';

/**
 * Heading Widget Component (Editor)
 * Renders the heading in the builder editor
 */
export function HeadingWidget({ node, onUpdate }) {
  const headingAlignment = node.alignment || 'left';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <AntSelect
          value={node.headingLevel || 'h2'}
          onChange={(value) => onUpdate({ headingLevel: value })}
          style={{ width: 80 }}
          size="small"
        >
          <AntSelect.Option value="h1">H1</AntSelect.Option>
          <AntSelect.Option value="h2">H2</AntSelect.Option>
          <AntSelect.Option value="h3">H3</AntSelect.Option>
          <AntSelect.Option value="h4">H4</AntSelect.Option>
          <AntSelect.Option value="h5">H5</AntSelect.Option>
          <AntSelect.Option value="h6">H6</AntSelect.Option>
        </AntSelect>
        <AntInput
          placeholder="Enter heading text"
          value={node.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          style={{ 
            flex: 1, 
            fontWeight: 600,
            textAlign: headingAlignment,
            fontSize: node.headingLevel === 'h1' ? '24px' : 
                   node.headingLevel === 'h2' ? '20px' : 
                   node.headingLevel === 'h3' ? '18px' : '14px'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <AlignmentButton 
          alignment="left" 
          current={headingAlignment} 
          onClick={() => onUpdate({ alignment: 'left' })}
        />
        <AlignmentButton 
          alignment="center" 
          current={headingAlignment} 
          onClick={() => onUpdate({ alignment: 'center' })}
        />
        <AlignmentButton 
          alignment="right" 
          current={headingAlignment} 
          onClick={() => onUpdate({ alignment: 'right' })}
        />
        <AlignmentButton 
          alignment="justify" 
          current={headingAlignment} 
          onClick={() => onUpdate({ alignment: 'justify' })}
        />
      </div>
    </div>
  );
}

/**
 * Alignment Button Component
 */
function AlignmentButton({ alignment, current, onClick }) {
  const icons = {
    left: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>,
    center: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 4h12v2H6V8zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>,
    right: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm6 4h12v2H9V8zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>,
    justify: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm2 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm-2 4h18v2H3v-2z"/></svg>,
  };

  return (
    <button 
      onClick={onClick}
      style={{
        minWidth: 32,
        height: 28,
        borderRadius: 4,
        border: current === alignment ? '2px solid #4a7cff' : '1px solid #d9d9d9',
        background: '#fff',
        paddingLeft: 8,
        cursor: 'pointer',
      }}
    >
      {icons[alignment]}
    </button>
  );
}

/**
 * Heading Renderer (Frontend)
 * Renders the heading for the frontend
 */
export function HeadingRenderer({ node }) {
  const level = node.headingLevel || 'h2';
  const alignment = node.alignment || 'left';
  const Tag = level;

  return (
    <Tag style={{ textAlign: alignment }}>
      {node.content || ''}
    </Tag>
  );
}

/**
 * HTML Generator
 * Converts heading node to HTML string
 */
export function headingToHtml(node) {
  const level = node.headingLevel || 'h2';
  const alignment = node.alignment || 'left';
  return `<${level} style="text-align: ${alignment};">${node.content || ''}</${level}>`;
}

/**
 * Widget Registration
 */
export const headingWidgetRegistration = {
  type: NodeType.HEADING,
  component: HeadingWidget,
  renderer: HeadingRenderer,
  toHtml: headingToHtml,
  defaultProps: {
    content: '',
    headingLevel: 'h2',
    alignment: 'left',
  },
  defaultStyles: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  metadata: {
    label: 'Heading',
    icon: 'H',
    category: 'text',
    description: 'Add a heading to your content',
  },
};
