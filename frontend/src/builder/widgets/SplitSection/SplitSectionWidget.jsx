/**
 * Split Section Widget Component
 * Builder component for split section (two-column layout)
 */

import React from 'react';
import { Select, InputNumber, Switch, ColorPicker } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function SplitSectionWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { layout: 'two-column', left: '', right: '' });
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
          Column Layout
        </label>
        <Select
          value={settings.layout || '50-50'}
          onChange={(value) => handleSettingChange('layout', value)}
          style={{ width: '100%' }}
        >
          <Option value="50-50">50% / 50%</Option>
          <Option value="60-40">60% / 40%</Option>
          <Option value="40-60">40% / 60%</Option>
          <Option value="70-30">70% / 30%</Option>
          <Option value="30-70">30% / 70%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </div>

      {settings.layout === 'custom' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Left Column Width (%)
            </label>
            <InputNumber
              value={settings.customLeftWidth || 50}
              onChange={(value) => handleSettingChange('customLeftWidth', value)}
              style={{ width: '100%' }}
              min={10}
              max={90}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Right Column Width (%)
            </label>
            <InputNumber
              value={settings.customRightWidth || 50}
              onChange={(value) => handleSettingChange('customRightWidth', value)}
              style={{ width: '100%' }}
              min={10}
              max={90}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Gap Between Columns (px)
        </label>
        <InputNumber
          value={settings.gap || 20}
          onChange={(value) => handleSettingChange('gap', value)}
          style={{ width: '100%' }}
          min={0}
          max={100}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Vertical Alignment
        </label>
        <Select
          value={settings.verticalAlign || 'top'}
          onChange={(value) => handleSettingChange('verticalAlign', value)}
          style={{ width: '100%' }}
        >
          <Option value="top">Top</Option>
          <Option value="center">Center</Option>
          <Option value="bottom">Bottom</Option>
          <Option value="stretch">Stretch</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Reverse on Mobile
        </label>
        <Switch
          checked={settings.reverseMobile || false}
          onChange={(checked) => handleSettingChange('reverseMobile', checked)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Background Color
        </label>
        <ColorPicker
          value={settings.backgroundColor || 'transparent'}
          onChange={(color) => handleSettingChange('backgroundColor', color.toHexString())}
          showText
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Padding (px)
        </label>
        <InputNumber
          value={settings.padding || 40}
          onChange={(value) => handleSettingChange('padding', value)}
          style={{ width: '100%' }}
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}
