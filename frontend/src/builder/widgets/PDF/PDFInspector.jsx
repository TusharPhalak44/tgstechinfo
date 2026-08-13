/**
 * PDF Inspector Component
 * Property inspector for PDF widget
 */

import React, { useState } from 'react';
import { Input, Select, InputNumber, Switch, Button, message } from 'antd';
import { PictureOutlined, FilePdfOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import MediaLibraryModal from '../../../components/common/MediaLibraryModal';

const { Option } = Select;

export default function PDFInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);

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

  const handleMediaSelect = (url) => {
    // Set the PDF URL directly
    handleChange('url', url);
    message.success('PDF URL added!');
  };

  return (
    <InspectorPanel>
      <InspectorFormItem label="PDF URL">
        <Input
          value={content.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com/document.pdf"
        />
        <Button
          icon={<FilePdfOutlined />}
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
