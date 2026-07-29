/**
 * Form Inspector Component
 * Property inspector for form widget
 */

import React from 'react';
import { Form, Input, Select } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function FormInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { fields: [], formName: 'Contact Form', submitText: 'Submit', successMessage: 'Thank you for your submission!' });
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
      <Form.Item label="Form Name">
        <Input
          value={content.formName || 'Contact Form'}
          onChange={(e) => handleChange('formName', e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Submit Button Text">
        <Input
          value={content.submitText || 'Submit'}
          onChange={(e) => handleChange('submitText', e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Success Message">
        <Input
          value={content.successMessage || 'Thank you for your submission!'}
          onChange={(e) => handleChange('successMessage', e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Form Layout">
        <Select
          value={settings.layout || 'vertical'}
          onChange={(value) => handleSettingChange('layout', value)}
        >
          <Option value="vertical">Vertical</Option>
          <Option value="horizontal">Horizontal</Option>
          <Option value="inline">Inline</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Button Size">
        <Select
          value={settings.buttonSize || 'default'}
          onChange={(value) => handleSettingChange('buttonSize', value)}
        >
          <Option value="small">Small</Option>
          <Option value="default">Default</Option>
          <Option value="large">Large</Option>
        </Select>
      </Form.Item>
    </Form>
  );
}
