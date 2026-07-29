/**
 * Section Break Inspector Component
 * Property inspector for section break widget
 */

import React from 'react';
import { Form, Select, InputNumber, ColorPicker } from 'antd';

const { Option } = Select;

export default function SectionBreakInspector({ node, onUpdate }) {
  const settings = node.settings || {};

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="Break Style">
        <Select
          value={settings.style || 'line'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="line">Line</Option>
          <Option value="dashed">Dashed Line</Option>
          <Option value="dotted">Dotted Line</Option>
          <Option value="double">Double Line</Option>
          <Option value="space">Space Only</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Thickness (px)">
        <InputNumber
          value={settings.thickness || 1}
          onChange={(value) => handleSettingChange('thickness', value)}
          min={1}
          max={10}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Color">
        <ColorPicker
          value={settings.color || '#e8e8e8'}
          onChange={(color) => handleSettingChange('color', color.toHexString())}
          showText
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Width">
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="25%">25%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </Form.Item>

      {settings.width === 'custom' && (
        <Form.Item label="Custom Width (px)">
          <InputNumber
            value={settings.customWidth || 200}
            onChange={(value) => handleSettingChange('customWidth', value)}
            min={50}
            max={1200}
            style={{ width: '100%' }}
          />
        </Form.Item>
      )}

      <Form.Item label="Alignment">
        <Select
          value={settings.alignment || 'center'}
          onChange={(value) => handleSettingChange('alignment', value)}
        >
          <Option value="left">Left</Option>
          <Option value="center">Center</Option>
          <Option value="right">Right</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Spacing Above (px)">
        <InputNumber
          value={settings.spacingAbove || 20}
          onChange={(value) => handleSettingChange('spacingAbove', value)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Spacing Below (px)">
        <InputNumber
          value={settings.spacingBelow || 20}
          onChange={(value) => handleSettingChange('spacingBelow', value)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
}
