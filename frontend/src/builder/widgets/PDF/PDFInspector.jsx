/**
 * PDF Inspector Component
 * Property inspector for PDF widget
 */

import React, { useState } from 'react';
import { Input, Select, InputNumber, Switch, Button, Upload, message } from 'antd';
import { PictureOutlined, FilePdfOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import MediaLibraryModal from '../../../components/common/MediaLibraryModal';
import InspectorPanel, { InspectorFormItem } from '../../components/InspectorPanel';

const { Option } = Select;

export default function PDFInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    // Ensure value is a string (not an object from ColorPicker or other components)
    const stringValue = typeof value === 'object' && value !== null ? String(value) : value;
    const updatedContent = { ...content, [field]: stringValue };
    onUpdate({
      content: JSON.stringify(updatedContent),
    });
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  const handleMediaSelect = (mediaItem) => {
    // Handle both string URL and media object
    const url = typeof mediaItem === 'string' ? mediaItem : mediaItem?.url;
    if (url) {
      handleChange('url', url);
      message.success('PDF URL added!');
    } else {
      message.error('Invalid media item selected');
    }
  };

  const handleUpload = async ({ file }) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/admin/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.file?.path || res.data?.path || res.data?.url
        ? (res.data.file?.path || res.data.path || res.data.url)
        : null;
      if (url) {
        handleChange('url', url);
        message.success('PDF uploaded');
      } else {
        throw new Error('No URL in response');
      }
    } catch {
      const objectUrl = URL.createObjectURL(file);
      handleChange('url', objectUrl);
      message.warning('Upload endpoint unavailable — using local preview. Save the page to persist.');
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <InspectorPanel>
      <InspectorFormItem label="PDF Upload">
        <Upload
          beforeUpload={() => false}
          customRequest={handleUpload}
          showUploadList={false}
          accept=".pdf"
          style={{ width: '100%' }}
        >
          <div 
            style={{
              width: '100%',
              border: '2px dashed #d9d9d9',
              borderRadius: 8,
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#fafafa',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4a7cff';
              e.currentTarget.style.background = '#f0f7ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d9d9';
              e.currentTarget.style.background = '#fafafa';
            }}
          >
            <FilePdfOutlined style={{ fontSize: 32, color: '#4a7cff', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>
              {uploading ? 'Uploading PDF...' : 'Click to Upload PDF'}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              or drag and drop
            </div>
          </div>
        </Upload>
      </InspectorFormItem>

      <InspectorFormItem label="PDF URL">
        <Input
          value={content.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com/document.pdf"
        />
        <Button
          icon={<PictureOutlined />}
          onClick={() => setMediaLibraryVisible(true)}
          size="small"
          style={{ marginTop: 8 }}
        >
          Select from Media Library
        </Button>
      </InspectorFormItem>

      <InspectorFormItem label="Width">
        <Select
          value={settings.width || '100%'}
          onChange={(value) => handleSettingChange('width', value)}
        >
          <Option value="100%">Full Width</Option>
          <Option value="75%">75%</Option>
          <Option value="50%">50%</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </InspectorFormItem>

      {settings.width === 'custom' && (
        <InspectorFormItem label="Custom Width (px)">
          <InputNumber
            value={settings.customWidth || 800}
            onChange={(value) => handleSettingChange('customWidth', value)}
            min={200}
            max={1920}
            style={{ width: '100%' }}
          />
        </InspectorFormItem>
      )}

      <InspectorFormItem label="Height (px)">
        <InputNumber
          value={settings.height || 600}
          onChange={(value) => handleSettingChange('height', value)}
          min={200}
          max={2000}
          style={{ width: '100%' }}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Download Button">
        <Switch
          checked={settings.showDownload !== false}
          onChange={(checked) => handleSettingChange('showDownload', checked)}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Download Button Text">
        <Input
          value={settings.downloadText || 'Download PDF'}
          onChange={(e) => handleSettingChange('downloadText', e.target.value)}
        />
      </InspectorFormItem>

      <MediaLibraryModal
        visible={mediaLibraryVisible}
        onSelect={handleMediaSelect}
        onClose={() => setMediaLibraryVisible(false)}
      />
    </InspectorPanel>
  );
}
