/**
 * HTML Inspector Component
 * Property inspector for HTML widget
 */

import React from 'react';
import { Form, Input, Switch } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function HTMLInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { html: '', css: '', js: '' });
  const settings = node.settings || {};

  const handleChange = (field, value) => {
    const updatedContent = { ...content, [field]: value };
    onUpdate({
      content: JSON.stringify(updatedContent),
    });
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="HTML Code">
        <Input.TextArea
          value={content.html || ''}
          onChange={(e) => handleChange('html', e.target.value)}
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </Form.Item>

      <Form.Item label="CSS (Optional)">
        <Input.TextArea
          value={content.css || ''}
          onChange={(e) => handleChange('css', e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </Form.Item>

      <Form.Item label="JavaScript (Optional)">
        <Input.TextArea
          value={content.js || ''}
          onChange={(e) => handleChange('js', e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </Form.Item>

      <Form.Item label="Enable JavaScript">
        <Switch
          checked={settings.enableJS !== false}
          onChange={(checked) => handleSettingChange('enableJS', checked)}
        />
      </Form.Item>
    </Form>
  );
}
