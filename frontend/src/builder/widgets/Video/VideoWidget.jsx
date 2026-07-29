/**
 * Video Widget Component
 * Builder component for video editing
 */

import React from 'react';
import { Input, Select, Switch, InputNumber } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function VideoWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { source: 'youtube', url: '' });
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
          Video Source
        </label>
        <Select
          value={content.source || 'youtube'}
          onChange={(value) => handleChange('source', value)}
          style={{ width: '100%' }}
        >
          <Option value="youtube">YouTube</Option>
          <Option value="vimeo">Vimeo</Option>
          <Option value="direct">Direct URL (MP4)</Option>
        </Select>
      </div>

      {content.source === 'youtube' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            YouTube Video ID or URL
          </label>
          <Input
            value={content.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID or VIDEO_ID"
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
            Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ
          </div>
        </div>
      )}

      {content.source === 'vimeo' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Vimeo Video ID or URL
          </label>
          <Input
            value={content.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://vimeo.com/VIDEO_ID or VIDEO_ID"
          />
        </div>
      )}

      {content.source === 'direct' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Video URL (MP4)
          </label>
          <Input
            value={content.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com/video.mp4"
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Width
        </label>
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
          style={{ width: '100%' }}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </div>

      {settings.width === 'custom' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Custom Width (px)
          </label>
          <InputNumber
            value={settings.customWidth || 640}
            onChange={(value) => handleSettingChange('customWidth', value)}
            style={{ width: '100%' }}
            min={200}
            max={1920}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Aspect Ratio
        </label>
        <Select
          value={settings.aspectRatio || '16:9'}
          onChange={(value) => handleSettingChange('aspectRatio', value)}
          style={{ width: '100%' }}
        >
          <Option value="16:9">16:9 (Widescreen)</Option>
          <Option value="4:3">4:3 (Standard)</Option>
          <Option value="1:1">1:1 (Square)</Option>
          <Option value="9:16">9:16 (Vertical)</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Autoplay
        </label>
        <Switch
          checked={settings.autoplay || false}
          onChange={(checked) => handleSettingChange('autoplay', checked)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Mute
        </label>
        <Switch
          checked={settings.mute || false}
          onChange={(checked) => handleSettingChange('mute', checked)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Show Controls
        </label>
        <Switch
          checked={settings.controls !== false}
          onChange={(checked) => handleSettingChange('controls', checked)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Loop
        </label>
        <Switch
          checked={settings.loop || false}
          onChange={(checked) => handleSettingChange('loop', checked)}
        />
      </div>
    </div>
  );
}
