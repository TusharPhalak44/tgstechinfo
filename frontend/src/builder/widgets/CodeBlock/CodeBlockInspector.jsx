/**
 * Code Block Inspector Component
 * Property inspector for code block widget
 */

import React from 'react';
import { Form, Input, Select } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function CodeBlockInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { code: '', language: 'javascript' });
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
      <Form.Item label="Code">
        <Input.TextArea
          value={content.code || ''}
          onChange={(e) => handleChange('code', e.target.value)}
          rows={10}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </Form.Item>

      <Form.Item label="Language">
        <Select
          value={settings.language || 'javascript'}
          onChange={(value) => handleSettingChange('language', value)}
        >
          <Option value="javascript">JavaScript</Option>
          <Option value="html">HTML</Option>
          <Option value="css">CSS</Option>
          <Option value="python">Python</Option>
          <Option value="java">Java</Option>
          <Option value="cpp">C++</Option>
          <Option value="php">PHP</Option>
          <Option value="ruby">Ruby</Option>
          <Option value="go">Go</Option>
          <Option value="rust">Rust</Option>
          <Option value="sql">SQL</Option>
          <Option value="bash">Bash</Option>
          <Option value="json">JSON</Option>
          <Option value="xml">XML</Option>
          <Option value="text">Plain Text</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Theme">
        <Select
          value={settings.theme || 'dark'}
          onChange={(value) => handleSettingChange('theme', value)}
        >
          <Option value="dark">Dark</Option>
          <Option value="light">Light</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Show Line Numbers">
        <Select
          value={settings.showLineNumbers !== false}
          onChange={(value) => handleSettingChange('showLineNumbers', value)}
        >
          <Option value={true}>Yes</Option>
          <Option value={false}>No</Option>
        </Select>
      </Form.Item>
    </Form>
  );
}
