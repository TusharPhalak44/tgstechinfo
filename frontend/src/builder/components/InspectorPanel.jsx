/**
 * InspectorPanel Component
 * A wrapper for property inspectors that mimics Form layout without nesting forms
 * Use this instead of <Form> in inspector components to avoid nested form warnings
 */

import React from 'react';
import { Form } from 'antd';

/**
 * InspectorPanel - Provides Form.Item styling without creating a nested <form> element
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components (typically Form.Item elements)
 * @param {string} [props.layout='vertical'] - Layout direction ('vertical' or 'horizontal')
 * @param {string} [props.size='small'] - Size variant ('small', 'middle', or 'large')
 * @param {object} [props.style] - Additional styles
 */
export default function InspectorPanel({ children, layout = 'vertical', size = 'small', style = {} }) {
  return (
    <div 
      className={`ant-form ant-form-${layout} ant-form-${size}`}
      style={{ 
        display: 'flex', 
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        gap: layout === 'vertical' ? '12px' : '16px',
        ...style 
      }}
    >
      {children}
    </div>
  );
}

/**
 * InspectorFormItem - A Form.Item that adds standard bottom margin
 * Use this in inspector components to ensure consistent spacing
 */
export function InspectorFormItem({ children, style = {}, ...props }) {
  return (
    <Form.Item 
      {...props} 
      style={{ 
        marginBottom: 12,
        ...style 
      }}
    >
      {children}
    </Form.Item>
  );
}
