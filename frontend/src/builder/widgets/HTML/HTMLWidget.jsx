/**
 * HTML Widget Component
 * Builder component for HTML editing
 */

import React from 'react';
import { Input, Alert } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function HTMLWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { html: '', css: '', js: '' });
  const settings = node.settings || {};

  const handleChange = (field, value) => {
    const updatedContent = { ...content, [field]: value };
    onUpdate?.({
      ...node,
      content: JSON.stringify(updatedContent),
    });
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate?.({
      ...node,
      settings: updatedSettings,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="Custom HTML"
          description="Add custom HTML code directly to your page. Be careful with scripts and external resources."
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          HTML Code
        </label>
        <Input.TextArea
          value={content.html || ''}
          onChange={(e) => handleChange('html', e.target.value)}
          placeholder="<div>Your HTML code here</div>"
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          CSS (Optional)
        </label>
        <Input.TextArea
          value={content.css || ''}
          onChange={(e) => handleChange('css', e.target.value)}
          placeholder=".custom-class { color: red; }"
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          JavaScript (Optional)
        </label>
        <Input.TextArea
          value={content.js || ''}
          onChange={(e) => handleChange('js', e.target.value)}
          placeholder="// Your JavaScript code"
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </div>
    </div>
  );
}
