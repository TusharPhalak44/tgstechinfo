/**
 * HTML Inspector Component
 * Property inspector for HTML widget
 */

import React, { useState } from 'react';
import { Input, Switch, Button, message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import MediaLibraryModal from '../../../components/common/MediaLibraryModal';
import InspectorPanel, { InspectorFormItem } from '../../components/InspectorPanel';

export default function HTMLInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { html: '', css: '', js: '' });
  const settings = node.settings || {};
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);

  const handleChange = (field, value) => {
    const updatedContent = { ...content, [field]: value };
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
    // Copy URL to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        message.success('Image URL copied to clipboard! You can now paste it in your HTML code.');
      }).catch(() => {
        message.info(`Image URL: ${url}`);
      });
    } else {
      message.info(`Image URL: ${url}`);
    }
  };

  return (
    <InspectorPanel>
      <InspectorFormItem label="HTML Code">
        <Input.TextArea
          value={content.html || ''}
          onChange={(e) => handleChange('html', e.target.value)}
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
        <Button
          icon={<PictureOutlined />}
          onClick={() => setMediaLibraryVisible(true)}
          size="small"
          style={{ marginTop: 8 }}
        >
          Insert Image from Media Library
        </Button>
      </InspectorFormItem>

      <InspectorFormItem label="CSS (Optional)">
        <Input.TextArea
          value={content.css || ''}
          onChange={(e) => handleChange('css', e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </InspectorFormItem>

      <InspectorFormItem label="JavaScript (Optional)">
        <Input.TextArea
          value={content.js || ''}
          onChange={(e) => handleChange('js', e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Enable JavaScript">
        <Switch
          checked={settings.enableJS !== false}
          onChange={(checked) => handleSettingChange('enableJS', checked)}
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
