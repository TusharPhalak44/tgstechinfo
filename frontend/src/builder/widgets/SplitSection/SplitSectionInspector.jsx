/**
 * Split Section Inspector Component
 * Property inspector for split section widget
 */

import React from 'react';
import { Form, Select, InputNumber, Switch, ColorPicker } from 'antd';

const { Option } = Select;

export default function SplitSectionInspector({ node, onUpdate }) {
  const settings = node.settings || {};

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="Column Layout">
        <Select
          value={settings.layout || '50-50'}
          onChange={(value) => handleSettingChange('layout', value)}
        >
          <Option value="50-50">50% / 50%</Option>
          <Option value="60-40">60% / 40%</Option>
          <Option value="40-60">40% / 60%</Option>
          <Option value="70-30">70% / 30%</Option>
          <Option value="30-70">30% / 70%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </Form.Item>

      {settings.layout === 'custom' && (
        <>
          <Form.Item label="Left Column Width (%)">
            <InputNumber
              value={settings.customLeftWidth || 50}
              onChange={(value) => handleSettingChange('customLeftWidth', value)}
              min={10}
              max={90}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Right Column Width (%)">
            <InputNumber
              value={settings.customRightWidth || 50}
              onChange={(value) => handleSettingChange('customRightWidth', value)}
              min={10}
              max={90}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </>
      )}

      <Form.Item label="Gap Between Columns (px)">
        <InputNumber
          value={settings.gap || 20}
          onChange={(value) => handleSettingChange('gap', value)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Vertical Alignment">
        <Select
          value={settings.verticalAlign || 'top'}
          onChange={(value) => handleSettingChange('verticalAlign', value)}
        >
          <Option value="top">Top</Option>
          <Option value="center">Center</Option>
          <Option value="bottom">Bottom</Option>
          <Option value="stretch">Stretch</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Reverse on Mobile">
        <Switch
          checked={settings.reverseMobile || false}
          onChange={(checked) => handleSettingChange('reverseMobile', checked)}
        />
      </Form.Item>

      <Form.Item label="Background Color">
        <ColorPicker
          value={settings.backgroundColor || 'transparent'}
          onChange={(color) => handleSettingChange('backgroundColor', color.toHexString())}
          showText
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Padding (px)">
        <InputNumber
          value={settings.padding || 40}
          onChange={(value) => handleSettingChange('padding', value)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
}
