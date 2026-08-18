/**
 * Video Inspector Component
 * Property inspector for video widget.
 * Two video sources: URL/embed and device upload.
 */

import React, { useState } from 'react';
import { Input, Select, Switch, InputNumber, Button, Upload, message } from 'antd';
import { LinkOutlined, UploadOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import InspectorPanel, { InspectorFormItem } from '../../components/InspectorPanel';

const { Option } = Select;

export default function VideoInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { source: 'youtube', url: '' });
  const settings = node.settings || {};

  const [sourceTab, setSourceTab] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (field, value) => {
    onUpdate?.({ ...node, content: JSON.stringify({ ...content, [field]: value }) });
  };

  const handleSettingChange = (field, value) => {
    onUpdate?.({ ...node, settings: { ...settings, [field]: value } });
  };

  const handleUpload = async ({ file }) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total || file.size));
          setUploadProgress(pct);
        },
      });
      const url = res.data?.file?.url || res.data?.file?.path || res.data?.url || res.data?.path || null;
      if (url) {
        handleChange('url', url);
        handleChange('source', 'direct');
        message.success('Video uploaded successfully');
      } else {
        throw new Error('Server returned no file URL');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Upload failed';
      console.error('Video upload error:', err);
      message.error(`Upload failed: ${errMsg}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const tabStyle = (key) => ({
    flex: 1,
    padding: '7px 0',
    border: 'none',
    borderBottom: sourceTab === key ? '2px solid #4a7cff' : '2px solid transparent',
    background: 'transparent',
    color: sourceTab === key ? '#4a7cff' : '#888',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: sourceTab === key ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    transition: 'all 0.15s',
  });

  const urlPlaceholder =
    content.source === 'youtube' ? 'https://www.youtube.com/watch?v=VIDEO_ID'
    : content.source === 'vimeo' ? 'https://vimeo.com/VIDEO_ID'
    : 'https://example.com/video.mp4';

  return (
    <div style={{ padding: 16 }}>

      {/* ── Video Source ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Video Source
        </div>

        {/* Current video preview */}
        {content.url && (
          <div style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: 8,
            border: '1px solid #e8e8e8',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>🎬</span>
            <span style={{ fontSize: 12, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {content.url}
            </span>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleChange('url', '')}
              style={{ flexShrink: 0 }}
            />
          </div>
        )}

        {/* Tabs: URL | Upload */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 12 }}>
          <button type="button" style={tabStyle('url')} onClick={() => setSourceTab('url')}>
            <LinkOutlined /> URL / Embed
          </button>
          <button type="button" style={tabStyle('upload')} onClick={() => setSourceTab('upload')}>
            <UploadOutlined /> Upload
          </button>
        </div>

        {/* URL tab */}
        {sourceTab === 'url' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#666' }}>Platform</label>
              <Select
                value={content.source || 'youtube'}
                onChange={v => handleChange('source', v)}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value="youtube">YouTube</Option>
                <Option value="vimeo">Vimeo</Option>
                <Option value="direct">Direct URL (MP4)</Option>
              </Select>
            </div>
            <Input
              value={content.url || ''}
              onChange={e => handleChange('url', e.target.value)}
              placeholder={urlPlaceholder}
              size="small"
              suffix={content.url ? <CheckOutlined style={{ color: '#52c41a', fontSize: 12 }} /> : null}
            />
            {content.source === 'youtube' && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                Paste a YouTube URL or just the video ID
              </div>
            )}
          </>
        )}

        {/* Upload tab */}
        {sourceTab === 'upload' && (
          <Upload
            customRequest={handleUpload}
            showUploadList={false}
            accept="video/*"
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              style={{ width: '100%' }}
              size="small"
            >
              {uploading
                ? `Uploading… ${uploadProgress > 0 ? uploadProgress + '%' : ''}`
                : 'Choose video file from device'}
            </Button>
          </Upload>
        )}
      </div>

      {/* ── Playback Settings ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Playback
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#666' }}>Aspect Ratio</label>
          <Select
            value={settings.aspectRatio || '16:9'}
            onChange={v => handleSettingChange('aspectRatio', v)}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="16:9">16:9 (Widescreen)</Option>
            <Option value="4:3">4:3 (Standard)</Option>
            <Option value="1:1">1:1 (Square)</Option>
            <Option value="9:16">9:16 (Vertical)</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Autoplay</label>
          <Switch size="small" checked={settings.autoplay || false} onChange={v => handleSettingChange('autoplay', v)} />
        </div>

        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Mute</label>
          <Switch size="small" checked={settings.mute || false} onChange={v => handleSettingChange('mute', v)} />
        </div>

        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Show Controls</label>
          <Switch size="small" checked={settings.controls !== false} onChange={v => handleSettingChange('controls', v)} />
        </div>

        <div style={{ marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Loop</label>
          <Switch size="small" checked={settings.loop || false} onChange={v => handleSettingChange('loop', v)} />
        </div>
      </div>

      {/* ── Size ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Size
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#666' }}>Width</label>
          <Select
            value={settings.width || '100%'}
            onChange={v => handleSettingChange('width', v)}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="100%">Full Width</Option>
            <Option value="75%">75%</Option>
            <Option value="50%">50%</Option>
            <Option value="custom">Custom</Option>
          </Select>
        </div>

        {settings.width === 'custom' && (
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#666' }}>Custom Width (px)</label>
            <InputNumber
              value={settings.customWidth || 640}
              onChange={v => handleSettingChange('customWidth', v)}
              min={200}
              max={1920}
              style={{ width: '100%' }}
              size="small"
            />
          </div>
        )}
      </div>

    </div>
  );
}
