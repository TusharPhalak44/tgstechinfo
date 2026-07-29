/**
 * Rich Text Inspector Component
 * Property inspector for rich text widget
 */

import React from 'react';
import { Form, Input } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function RichTextInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { html: '' });

  const handleChange = (field, value) => {
    const updatedContent = { ...content, [field]: value };
    onUpdate({
      content: JSON.stringify(updatedContent),
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="HTML Content">
        <Input.TextArea
          value={content.html || ''}
          onChange={(e) => handleChange('html', e.target.value)}
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </Form.Item>
    </Form>
  );
}
