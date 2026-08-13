/**
 * Image Widget Component
 * Builder editor for image — supports direct URL entry, file upload, and media library picker.
 */

import React, { useState } from 'react';
import { Input, Select, InputNumber, Switch, Button, Upload, Modal, message, Spin } from 'antd';
import { UploadOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useAuth } from '../../../context/AuthContext';

const { Option } = Select;

// ─── Media Library Picker Modal ───────────────────────────────────────────────
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
        const media = files.filter(f => f.type === 'image' || f.thumbnail).map(f => ({
          url: f.url,
          name: f.name,
          title: f.name,
        }));
        setItems(media);
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
      width={760}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No media found. Upload images via the admin Media Manager first.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxHeight: 480, overflowY: 'auto', padding: 4 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => { onSelect(item.url); onClose(); }}
              style={{
                cursor: 'pointer',
                border: '2px solid transparent',
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4a7cff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <img
                src={item.url}
                alt={item.title}
                style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3C/svg%3E'; }}
              />
              <div style={{ padding: '4px 6px', fontSize: 11, color: '#666', background: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── Main ImageWidget ─────────────────────────────────────────────────────────
export default function ImageWidget({ node, onUpdate }) {
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
          link: parsed.link || '',
          caption: parsed.caption || ''
        };
        // Auto-fix the data
        onUpdate?.({ ...node, content: JSON.stringify(content) });
      }
    } catch (e) {
      // Keep default content if parsing fails
    }
  }
  
  const settings = node.settings || {};
  const [pickerVisible, setPickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    const updated = { ...content, [field]: value };
    onUpdate?.({ ...node, content: JSON.stringify(updated) });
  };

  const handleSettingChange = (field, value) => {
    onUpdate?.({ ...node, settings: { ...settings, [field]: value } });
  };

  // Direct file upload — sends to the media upload endpoint and uses the returned URL
  const handleUpload = async ({ file }) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); // Backend expects 'file' field
      // Try the admin media upload endpoint; fall back to a local object URL on failure
      const res = await axios.post('/api/admin/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.file?.path || res.data?.path || res.data?.url
        ? (res.data.file?.path || res.data.path || res.data.url)
        : null;
      if (url) {
        handleChange('url', url);
        message.success('Image uploaded');
      } else {
        throw new Error('No URL in response');
      }
    } catch {
      // Fallback: create a temporary object URL so the image at least shows in the builder
      const objectUrl = URL.createObjectURL(file);
      handleChange('url', objectUrl);
      message.warning('Upload endpoint unavailable — using local preview. Save the page to persist.');
    } finally {
      setUploading(false);
    }
    return false; // prevent default Upload behaviour
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Preview */}
      {content.url && (
        <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8', position: 'relative' }}>
          <img
            src={content.url}
            alt={content.alt || 'Preview'}
            style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block', background: '#f5f5f5' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleChange('url', '')}
            style={{ position: 'absolute', top: 6, right: 6, opacity: 0.85 }}
          />
        </div>
      )}

      {/* Upload + Library buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Upload
          beforeUpload={() => false}
          customRequest={handleUpload}
          showUploadList={false}
          accept="image/*"
          style={{ flex: 1 }}
        >
          <Button icon={<UploadOutlined />} loading={uploading} style={{ width: '100%' }} size="small">
            Upload Image
          </Button>
        </Upload>
        <Button
          icon={<PictureOutlined />}
          onClick={() => setPickerVisible(true)}
          style={{ flex: 1 }}
          size="small"
        >
          Media Library
        </Button>
      </div>

      {/* URL field */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Image URL</label>
        <Input
          value={content.url || ''}
          onChange={e => handleChange('url', e.target.value)}
          placeholder="https://example.com/image.jpg"
          size="small"
        />
      </div>

      {/* Alt text */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Alt Text</label>
        <Input
          value={content.alt || ''}
          onChange={e => handleChange('alt', e.target.value)}
          placeholder="Describe this image"
          size="small"
        />
      </div>

      {/* Caption */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Caption</label>
        <Input
          value={content.caption || ''}
          onChange={e => handleChange('caption', e.target.value)}
          placeholder="Optional caption"
          size="small"
        />
      </div>

      {/* Link */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Link URL</label>
        <Input
          value={content.link || ''}
          onChange={e => handleChange('link', e.target.value)}
          placeholder="https://example.com"
          size="small"
        />
      </div>

      {/* Open in new tab */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 12, color: '#666' }}>Open in New Tab</label>
        <Switch
          size="small"
          checked={settings.openInNewTab || false}
          onChange={v => handleSettingChange('openInNewTab', v)}
        />
      </div>

      {/* Image size */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Size</label>
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
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Width (px)</label>
            <InputNumber value={settings.width || 300} onChange={v => handleSettingChange('width', v)} style={{ width: '100%' }} size="small" min={1} max={2000} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Height (px)</label>
            <InputNumber value={settings.height || 200} onChange={v => handleSettingChange('height', v)} style={{ width: '100%' }} size="small" min={1} max={2000} />
          </div>
        </div>
      )}

      {/* Lazy loading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 12, color: '#666' }}>Lazy Load</label>
        <Switch
          size="small"
          checked={settings.lazyLoad !== false}
          onChange={v => handleSettingChange('lazyLoad', v)}
        />
      </div>

      {/* Media Library Picker */}
      <MediaLibraryPicker
        visible={pickerVisible}
        onSelect={url => handleChange('url', url)}
        onClose={() => setPickerVisible(false)}
      />
    </div>
  );
}
