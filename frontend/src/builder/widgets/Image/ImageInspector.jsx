/**
 * Image Inspector Component
 * Property panel inspector for image widget
 */

import React from 'react';
import { Input, Select, InputNumber, Switch, Slider } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function ImageInspector({ node, onUpdate }) {
  // Handle malformed data where URL is stored as a key instead of value
  let content = safeParseJsonContent(node.content, { url: '', alt: '', link: '' });
  
  // Migration: if URL is stored as key (e.g., {"https://...":"","alt":"","link":""})
  // extract the URL from the keys and fix the structure
  if (!content.url && typeof node.content === 'string') {
    try {
      const parsed = JSON.parse(node.content);
      const keys = Object.keys(parsed);
      // Check if first key looks like a URL
      if (keys.length > 0 && (keys[0].startsWith('http://') || keys[0].startsWith('https://'))) {
        content = {
          url: keys[0],
          alt: parsed.alt || '',
          link: parsed.link || ''
        };
        // Auto-fix the data
        onUpdate?.({
          ...node,
          content: JSON.stringify(content),
        });
      }
    } catch (e) {
      // Keep default content if parsing fails
    }
  }
  
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
            Image URL
          </label>
          <Input
            value={content.url || ''}
            onChange={(e) => handleContentChange('url', e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Alt Text
          </label>
          <Input
            value={content.alt || ''}
            onChange={(e) => handleContentChange('alt', e.target.value)}
            placeholder="Image description for accessibility"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Link URL
          </label>
          <Input
            value={content.link || ''}
            onChange={(e) => handleContentChange('link', e.target.value)}
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
            Image Size
          </label>
          <Select
            value={settings.size || 'responsive'}
            onChange={(value) => handleSettingChange('size', value)}
            style={{ width: '100%' }}
          >
            <Option value="responsive">Responsive</Option>
            <Option value="full">Full Width</Option>
            <Option value="custom">Custom</Option>
          </Select>
        </div>

        {settings.size === 'custom' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
                Width (px)
              </label>
              <InputNumber
                value={settings.width || 300}
                onChange={(value) => handleSettingChange('width', value)}
                style={{ width: '100%' }}
                min={1}
                max={2000}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
                Height (px)
              </label>
              <InputNumber
                value={settings.height || 200}
                onChange={(value) => handleSettingChange('height', value)}
                style={{ width: '100%' }}
                min={1}
                max={2000}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Object Fit
          </label>
          <Select
            value={settings.objectFit || 'cover'}
            onChange={(value) => handleSettingChange('objectFit', value)}
            style={{ width: '100%' }}
          >
            <Option value="cover">Cover</Option>
            <Option value="contain">Contain</Option>
            <Option value="fill">Fill</Option>
            <Option value="none">None</Option>
            <Option value="scale-down">Scale Down</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Open in New Tab
          </label>
          <Switch
            checked={settings.openInNewTab || false}
            onChange={(checked) => handleSettingChange('openInNewTab', checked)}
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
            Border Radius
          </label>
          <Slider
            value={parseInt(styles.borderRadius) || 0}
            onChange={(value) => handleStyleChange('borderRadius', `${value}px`)}
            min={0}
            max={50}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Margin
          </label>
          <InputNumber
            value={parseInt(styles.margin) || 0}
            onChange={(value) => handleStyleChange('margin', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Border Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#4a7cff' }}>
          Border
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Border Width
          </label>
          <InputNumber
            value={parseInt(styles.borderWidth) || 0}
            onChange={(value) => handleStyleChange('borderWidth', `${value}px`)}
            style={{ width: '100%' }}
            min={0}
            max={10}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#666' }}>
            Border Style
          </label>
          <Select
            value={styles.borderStyle || 'solid'}
            onChange={(value) => handleStyleChange('borderStyle', value)}
            style={{ width: '100%' }}
          >
            <Option value="solid">Solid</Option>
            <Option value="dashed">Dashed</Option>
            <Option value="dotted">Dotted</Option>
            <Option value="double">Double</Option>
          </Select>
        </div>
      </div>
    </div>
  );
}
