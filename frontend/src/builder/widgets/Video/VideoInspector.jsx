/**
 * Video Inspector Component
 * Property inspector for video widget
 */

import React from 'react';
import { Form, Select, Switch, InputNumber } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function VideoInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { source: 'youtube', url: '' });
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
      <Form.Item label="Video Source">
        <Select
          value={content.source || 'youtube'}
          onChange={(value) => handleChange('source', value)}
        >
          <Option value="youtube">YouTube</Option>
          <Option value="vimeo">Vimeo</Option>
          <Option value="direct">Direct URL (MP4)</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Width">
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </Form.Item>

      {settings.width === 'custom' && (
        <Form.Item label="Custom Width (px)">
          <InputNumber
            value={settings.customWidth || 640}
            onChange={(value) => handleSettingChange('customWidth', value)}
            min={200}
            max={1920}
            style={{ width: '100%' }}
          />
        </Form.Item>
      )}

      <Form.Item label="Aspect Ratio">
        <Select
          value={settings.aspectRatio || '16:9'}
          onChange={(value) => handleSettingChange('aspectRatio', value)}
        >
          <Option value="16:9">16:9 (Widescreen)</Option>
          <Option value="4:3">4:3 (Standard)</Option>
          <Option value="1:1">1:1 (Square)</Option>
          <Option value="9:16">9:16 (Vertical)</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Autoplay">
        <Switch
          checked={settings.autoplay || false}
          onChange={(checked) => handleSettingChange('autoplay', checked)}
        />
      </Form.Item>

      <Form.Item label="Mute">
        <Switch
          checked={settings.mute || false}
          onChange={(checked) => handleSettingChange('mute', checked)}
        />
      </Form.Item>

      <Form.Item label="Show Controls">
        <Switch
          checked={settings.controls !== false}
          onChange={(checked) => handleSettingChange('controls', checked)}
        />
      </Form.Item>

      <Form.Item label="Loop">
        <Switch
          checked={settings.loop || false}
          onChange={(checked) => handleSettingChange('loop', checked)}
        />
      </Form.Item>
    </Form>
  );
}
