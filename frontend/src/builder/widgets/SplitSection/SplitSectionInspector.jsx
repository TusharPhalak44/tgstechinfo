/**
 * Split Section Inspector Component
 * Property inspector for split section widget
 */

import React from 'react';
import { Select, InputNumber, Switch, ColorPicker, Alert } from 'antd';
import InspectorPanel, { InspectorFormItem } from '../../components/InspectorPanel';

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
    <InspectorPanel>
      <Alert
        message="How to use Split Section"
        description="This widget creates a two-column layout. After dragging it to the canvas, drag other widgets into the left or right column areas shown in the preview."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <InspectorFormItem label="Column Layout">
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
      </InspectorFormItem>

      {settings.layout === 'custom' && (
        <>
          <InspectorFormItem label="Left Column Width (%)">
            <InputNumber
              value={settings.customLeftWidth || 50}
              onChange={(value) => handleSettingChange('customLeftWidth', value)}
              min={10}
              max={90}
              style={{ width: '100%' }}
            />
          </InspectorFormItem>
          <InspectorFormItem label="Right Column Width (%)">
            <InputNumber
              value={settings.customRightWidth || 50}
              onChange={(value) => handleSettingChange('customRightWidth', value)}
              min={10}
              max={90}
              style={{ width: '100%' }}
            />
          </InspectorFormItem>
        </>
      )}

      <InspectorFormItem label="Gap Between Columns (px)">
        <InputNumber
          value={settings.gap || 20}
          onChange={(value) => handleSettingChange('gap', value)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Vertical Alignment">
        <Select
          value={settings.verticalAlign || 'top'}
          onChange={(value) => handleSettingChange('verticalAlign', value)}
        >
          <Option value="top">Top</Option>
          <Option value="center">Center</Option>
          <Option value="bottom">Bottom</Option>
          <Option value="stretch">Stretch</Option>
        </Select>
      </InspectorFormItem>

      <InspectorFormItem label="Reverse on Mobile">
        <Switch
          checked={settings.reverseMobile || false}
          onChange={(checked) => handleSettingChange('reverseMobile', checked)}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Background Color">
        <ColorPicker
          value={settings.backgroundColor || 'transparent'}
          onChange={(color) => handleSettingChange('backgroundColor', color.toHexString())}
          showText
          style={{ width: '100%' }}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Padding (px)">
        <InputNumber
          value={settings.padding || 40}
          onChange={(value) => handleSettingChange('padding', value)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      </InspectorFormItem>
    </InspectorPanel>
  );
}
