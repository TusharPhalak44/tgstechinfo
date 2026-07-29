/**
 * Code Block Widget Component
 * Builder component for code block editing
 */

import React from 'react';
import { Input, Select } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function CodeBlockWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { code: '', language: 'javascript' });
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
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Code
        </label>
        <Input.TextArea
          value={content.code || ''}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder="Enter your code here"
          rows={10}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Language
        </label>
        <Select
          value={settings.language || 'javascript'}
          onChange={(value) => handleSettingChange('language', value)}
          style={{ width: '100%' }}
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
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Theme
        </label>
        <Select
          value={settings.theme || 'dark'}
          onChange={(value) => handleSettingChange('theme', value)}
          style={{ width: '100%' }}
        >
          <Option value="dark">Dark</Option>
          <Option value="light">Light</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Show Line Numbers
        </label>
        <Select
          value={settings.showLineNumbers !== false}
          onChange={(value) => handleSettingChange('showLineNumbers', value)}
          style={{ width: '100%' }}
        >
          <Option value={true}>Yes</Option>
          <Option value={false}>No</Option>
        </Select>
      </div>
    </div>
  );
}
