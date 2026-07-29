/**
 * Button Inspector Component
 * Property panel inspector for button widget
 */

import React from 'react';
import { Input, Select, ColorPicker, InputNumber, Switch } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function ButtonInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || {};
  const styles = node.styles || {};

  const handleContentChange = (field, value) => {
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

  const handleStyleChange = (field, value) => {
    const updatedStyles = { ...styles, [field]: value };
    onUpdate?.({
      ...node,
      styles: updatedStyles,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Content Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Content
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Button Text
          </label>
          <Input
            value={content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            placeholder="Click me"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Link URL
          </label>
          <Input
            value={content.url || ''}
            onChange={(e) => handleContentChange('url', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Settings Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Settings
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Button Style
          </label>
          <Select
            value={settings.style || 'primary'}
            onChange={(value) => handleSettingChange('style', value)}
            style={{ width: '100%' }}
          >
            <Option value="primary">Primary</Option>
            <Option value="secondary">Secondary</Option>
            <Option value="outline">Outline</Option>
            <Option value="text">Text</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Button Size
          </label>
          <Select
            value={settings.size || 'medium'}
            onChange={(value) => handleSettingChange('size', value)}
            style={{ width: '100%' }}
          >
            <Option value="small">Small</Option>
            <Option value="medium">Medium</Option>
            <Option value="large">Large</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Open in New Tab
          </label>
          <Select
            value={settings.target || '_self'}
            onChange={(value) => handleSettingChange('target', value)}
            style={{ width: '100%' }}
          >
            <Option value="_self">Same Tab</Option>
            <Option value="_blank">New Tab</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Full Width
          </label>
          <Switch
            checked={settings.fullWidth || false}
            onChange={(checked) => handleSettingChange('fullWidth', checked)}
          />
        </div>
      </div>

      {/* Colors Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Colors
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Background Color
          </label>
          <ColorPicker
            value={settings.backgroundColor || '#4a7cff'}
            onChange={(color) => handleSettingChange('backgroundColor', color.toHexString())}
            showText
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Text Color
          </label>
          <ColorPicker
            value={settings.textColor || '#ffffff'}
            onChange={(color) => handleSettingChange('textColor', color.toHexString())}
            showText
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Hover Background Color
          </label>
          <ColorPicker
            value={settings.hoverBackgroundColor || '#3a5fcc'}
            onChange={(color) => handleSettingChange('hoverBackgroundColor', color.toHexString())}
            showText
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Spacing Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Spacing
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Padding
          </label>
          <InputNumber
            value={parseInt(styles.padding) || 12}
            onChange={(value) => handleStyleChange('padding', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={100}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Border Radius
          </label>
          <InputNumber
            value={parseInt(styles.borderRadius) || 4}
            onChange={(value) => handleStyleChange('borderRadius', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={50}
          />
        </div>
      </div>

      {/* Typography Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Typography
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Font Size
          </label>
          <InputNumber
            value={parseInt(styles.fontSize) || 14}
            onChange={(value) => handleStyleChange('fontSize', `${value}px`)}
            style={{ width: '100%' }}
            min={10}
            max={36}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Font Weight
          </label>
          <Select
            value={styles.fontWeight || '500'}
            onChange={(value) => handleStyleChange('fontWeight', value)}
            style={{ width: '100%' }}
          >
            <Option value="400">Normal</Option>
            <Option value="500">Medium</Option>
            <Option value="600">Semibold</Option>
            <Option value="700">Bold</Option>
          </Select>
        </div>
      </div>
    </div>
  );
}
