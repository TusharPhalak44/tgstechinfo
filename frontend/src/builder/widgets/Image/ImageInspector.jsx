/**
 * Image Inspector Component
 * Property panel inspector for image widget.
 * Three image sources: URL, device upload, and media library.
 */

import React, { useState } from 'react';
import { Input, Select, InputNumber, Switch, Slider, Button, Upload, Modal, Spin, message } from 'antd';
import { UploadOutlined, LinkOutlined, PictureOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useAuth } from '../../../context/AuthContext';

const { Option } = Select;

// ─── Media Library Modal ───────────────────────────────────────────────────────
function MediaLibraryPicker({ visible, onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    // Use appropriate endpoint based on user role
    // Admin sees all media, regular users see only their own
    const endpoint = user?.role === 'admin' ? '/api/media/all' : '/api/media/user/all';
    axios.get(endpoint, { params: { file_type: 'image' } })
      .then(res => {
        const files = res.data?.data || [];
        setItems(files.filter(f => f.type === 'image' || f.thumbnail));
      })
      .catch(() => {
        message.warning('Could not load media library');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [visible, user?.role]);

  return (
    <Modal
      title="Media Library"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      styles={{ body: { padding: 16 } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No images found in the media library yet.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          maxHeight: 460,
          overflowY: 'auto',
          padding: 4,
        }}>
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => { onSelect(item.url); onClose(); }}
              title={item.name}
              style={{
                cursor: 'pointer',
                border: '2px solid transparent',
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <img
                src={item.url}
                alt={item.name}
                style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                onError={e => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%23aaa"%3E?%3C/text%3E%3C/svg%3E';
                }}
              />
              <div style={{
                padding: '4px 6px',
                fontSize: 10,
                color: '#666',
                background: '#fafafa',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── Main Inspector ────────────────────────────────────────────────────────────
export default function ImageInspector({ node, onUpdate }) {
  let content = safeParseJsonContent(node.content, { url: '', alt: '', link: '' });

  if (!content.url && typeof node.content === 'string') {
    try {
      const parsed = JSON.parse(node.content);
      const keys = Object.keys(parsed);
      if (keys.length > 0 && (keys[0].startsWith('http://') || keys[0].startsWith('https://'))) {
        content = { url: keys[0], alt: parsed.alt || '', link: parsed.link || '' };
        onUpdate?.({ ...node, content: JSON.stringify(content) });
      }
    } catch (e) { /* keep default */ }
  }

  const settings = node.settings || {};
  const styles = node.styles || {};

  // 'url' | 'upload' | 'library'
  const [sourceTab, setSourceTab] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleContentChange = (field, value) => {
    onUpdate?.({ ...node, content: JSON.stringify({ ...content, [field]: value }) });
  };

  const handleSettingChange = (field, value) => {
    onUpdate?.({ ...node, settings: { ...settings, [field]: value } });
  };

  const handleStyleChange = (field, value) => {
    onUpdate?.({ ...node, styles: { ...styles, [field]: value } });
  };

  // Upload to /api/media/upload  →  { file: { path: '/uploads/...' } }
  const handleUpload = async ({ file }) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.file?.url || res.data?.file?.path || res.data?.url || res.data?.path || null;
      if (url) {
        handleContentChange('url', url);
        message.success('Image uploaded successfully');
      } else {
        throw new Error('No URL in response');
      }
    } catch {
      // Fallback: use browser object URL for preview
      const objectUrl = URL.createObjectURL(file);
      handleContentChange('url', objectUrl);
      message.warning('Upload failed — showing local preview only.');
    } finally {
      setUploading(false);
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
    gap: 4,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ padding: 16 }}>

      {/* ── Image Source ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Image Source
        </div>

        {/* Current image preview */}
        {content.url && (
          <div style={{
            marginBottom: 12,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e8e8e8',
            position: 'relative',
          }}>
            <img
              src={content.url}
              alt={content.alt || 'Preview'}
              style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block', background: '#f5f5f5' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleContentChange('url', '')}
              style={{ position: 'absolute', top: 6, right: 6, opacity: 0.9 }}
            />
          </div>
        )}

        {/* Three tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 12 }}>
          <button type="button" style={tabStyle('url')} onClick={() => setSourceTab('url')}>
            <LinkOutlined /> URL
          </button>
          <button type="button" style={tabStyle('upload')} onClick={() => setSourceTab('upload')}>
            <UploadOutlined /> Upload
          </button>
          <button type="button" style={tabStyle('library')} onClick={() => setSourceTab('library')}>
            <PictureOutlined /> Library
          </button>
        </div>

        {/* URL tab */}
        {sourceTab === 'url' && (
          <Input
            value={content.url || ''}
            onChange={e => handleContentChange('url', e.target.value)}
            placeholder="https://example.com/image.jpg"
            size="small"
            suffix={content.url ? <CheckOutlined style={{ color: '#52c41a', fontSize: 12 }} /> : null}
          />
        )}

        {/* Upload tab */}
        {sourceTab === 'upload' && (
          <Upload
            customRequest={handleUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              style={{ width: '100%' }}
              size="small"
            >
              {uploading ? 'Uploading…' : 'Choose file from device'}
            </Button>
          </Upload>
        )}

        {/* Library tab */}
        {sourceTab === 'library' && (
          <Button
            icon={<PictureOutlined />}
            onClick={() => setPickerVisible(true)}
            style={{ width: '100%' }}
            size="small"
          >
            Browse Media Library
          </Button>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Content
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Alt Text</label>
          <Input
            value={content.alt || ''}
            onChange={e => handleContentChange('alt', e.target.value)}
            placeholder="Image description for accessibility"
            size="small"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Caption</label>
          <Input
            value={content.caption || ''}
            onChange={e => handleContentChange('caption', e.target.value)}
            placeholder="Optional caption below image"
            size="small"
          />
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Link URL</label>
          <Input
            value={content.link || ''}
            onChange={e => handleContentChange('link', e.target.value)}
            placeholder="https://example.com"
            size="small"
          />
        </div>
      </div>

      {/* ── Settings ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Settings
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Image Size</label>
          <Select
            value={settings.size || 'responsive'}
            onChange={v => handleSettingChange('size', v)}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="responsive">Responsive (100%)</Option>
            <Option value="full">Full Width</Option>
            <Option value="custom">Custom</Option>
          </Select>
        </div>

        {settings.size === 'custom' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Width (px)</label>
              <InputNumber value={settings.width || 300} onChange={v => handleSettingChange('width', v)} style={{ width: '100%' }} size="small" min={1} max={2000} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Height (px)</label>
              <InputNumber value={settings.height || 200} onChange={v => handleSettingChange('height', v)} style={{ width: '100%' }} size="small" min={1} max={2000} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Object Fit</label>
          <Select
            value={settings.objectFit || 'cover'}
            onChange={v => handleSettingChange('objectFit', v)}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="cover">Cover</Option>
            <Option value="contain">Contain</Option>
            <Option value="fill">Fill</Option>
            <Option value="none">None</Option>
            <Option value="scale-down">Scale Down</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Open in New Tab</label>
          <Switch
            size="small"
            checked={settings.openInNewTab || false}
            onChange={v => handleSettingChange('openInNewTab', v)}
          />
        </div>
      </div>

      {/* ── Spacing ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Spacing
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>
            Border Radius — {parseInt(styles.borderRadius) || 0}px
          </label>
          <Slider
            value={parseInt(styles.borderRadius) || 0}
            onChange={v => handleStyleChange('borderRadius', `${v}px`)}
            min={0}
            max={50}
          />
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Margin (px)</label>
          <InputNumber
            value={parseInt(styles.margin) || 0}
            onChange={v => handleStyleChange('margin', `${v}px`)}
            style={{ width: '100%' }}
            size="small"
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* ── Border ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#4a7cff', fontSize: 13 }}>
          Border
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Border Width (px)</label>
          <InputNumber
            value={parseInt(styles.borderWidth) || 0}
            onChange={v => handleStyleChange('borderWidth', `${v}px`)}
            style={{ width: '100%' }}
            size="small"
            min={0}
            max={10}
          />
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666' }}>Border Style</label>
          <Select
            value={styles.borderStyle || 'solid'}
            onChange={v => handleStyleChange('borderStyle', v)}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="solid">Solid</Option>
            <Option value="dashed">Dashed</Option>
            <Option value="dotted">Dotted</Option>
            <Option value="double">Double</Option>
          </Select>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryPicker
        visible={pickerVisible}
        onSelect={url => handleContentChange('url', url)}
        onClose={() => setPickerVisible(false)}
      />

    </div>
  );
}
