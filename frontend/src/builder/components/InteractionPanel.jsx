/**
 * InteractionPanel Component
 * Panel for configuring widget interactions (click, hover, scroll, viewport)
 */

import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Switch, Collapse, Button, Space, InputNumber } from 'antd';
import { ThunderboltOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import interactionManager from '../core/InteractionManager';

/**
 * InteractionPanel Component
 */
export default function InteractionPanel({ node, onUpdate }) {
  const [interactions, setInteractions] = useState([]);
  const [addInteractionVisible, setAddInteractionVisible] = useState(false);
  const [newInteractionType, setNewInteractionType] = useState('click');

  useEffect(() => {
    if (node) {
      setInteractions(interactionManager.getInteractions(node.id));
    }
  }, [node]);

  const handleAddInteraction = () => {
    const interactionId = interactionManager.addInteraction(node.id, {
      type: newInteractionType,
      action: 'navigate',
      config: {},
      enabled: true,
    });

    setInteractions(interactionManager.getInteractions(node.id));
    setAddInteractionVisible(false);
  };

  const handleUpdateInteraction = (interactionId, updates) => {
    interactionManager.updateInteraction(node.id, interactionId, updates);
    setInteractions(interactionManager.getInteractions(node.id));
  };

  const handleRemoveInteraction = (interactionId) => {
    interactionManager.removeInteraction(node.id, interactionId);
    setInteractions(interactionManager.getInteractions(node.id));
  };

  return (
    <div className="interaction-panel">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ThunderboltOutlined style={{ color: '#f59e0b' }} />
        <span style={{ fontWeight: 600 }}>Interactions</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {interactions.map(interaction => (
            <div
              key={interaction.id}
              style={{
                padding: 12,
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Space>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{interaction.type}</span>
                  <Switch
                    checked={interaction.enabled}
                    onChange={(checked) => handleUpdateInteraction(interaction.id, { enabled: checked })}
                    size="small"
                  />
                </Space>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => handleRemoveInteraction(interaction.id)}
                />
              </div>
              <InteractionEditor interaction={interaction} onUpdate={(updates) => handleUpdateInteraction(interaction.id, updates)} />
            </div>
          ))}

          {interactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              No interactions configured
            </div>
          )}
        </Space>
      </div>

      <div>
        <Select
          placeholder="Add interaction"
          style={{ width: '100%' }}
          onChange={(value) => {
            setNewInteractionType(value);
            setAddInteractionVisible(true);
          }}
        >
          <Select.Option value="click">Click</Select.Option>
          <Select.Option value="hover">Hover</Select.Option>
          <Select.Option value="scroll">Scroll</Select.Option>
          <Select.Option value="viewport">Viewport</Select.Option>
        </Select>
      </div>
    </div>
  );
}

/**
 * InteractionEditor Component
 * Internal component for editing individual interactions
 */
function InteractionEditor({ interaction, onUpdate }) {
  const [actionType, setActionType] = useState(interaction.action);

  const handleActionChange = (value) => {
    setActionType(value);
    onUpdate({ action: value, config: getDefaultConfig(value) });
  };

  const handleConfigChange = (key, value) => {
    onUpdate({ config: { ...interaction.config, [key]: value } });
  };

  const getDefaultConfig = (action) => {
    switch (action) {
      case 'navigate':
        return { url: '#' };
      case 'scrollTo':
        return { selector: '#' };
      case 'openPopup':
        return { popupId: '' };
      case 'playVideo':
        return { videoSelector: '' };
      case 'downloadPDF':
        return { url: '', filename: 'document.pdf' };
      case 'toggleClass':
        return { selector: '', className: '' };
      case 'showElement':
      case 'hideElement':
        return { selector: '' };
      case 'copyToClipboard':
        return { text: '' };
      case 'customAction':
        return { code: '' };
      default:
        return {};
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#666' }}>Action</label>
        <Select
          value={actionType}
          onChange={handleActionChange}
          style={{ width: '100%' }}
          size="small"
        >
          <Select.Option value="navigate">Navigate to URL</Select.Option>
          <Select.Option value="scrollTo">Scroll to Element</Select.Option>
          <Select.Option value="openPopup">Open Popup</Select.Option>
          <Select.Option value="playVideo">Play Video</Select.Option>
          <Select.Option value="downloadPDF">Download PDF</Select.Option>
          <Select.Option value="toggleClass">Toggle Class</Select.Option>
          <Select.Option value="showElement">Show Element</Select.Option>
          <Select.Option value="hideElement">Hide Element</Select.Option>
          <Select.Option value="copyToClipboard">Copy to Clipboard</Select.Option>
          <Select.Option value="customAction">Custom JavaScript</Select.Option>
        </Select>
      </div>

      {actionType === 'navigate' && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>URL</label>
          <Input
            value={interaction.config.url || ''}
            onChange={(e) => handleConfigChange('url', e.target.value)}
            placeholder="https://example.com"
            size="small"
          />
        </div>
      )}

      {actionType === 'scrollTo' && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Element Selector</label>
          <Input
            value={interaction.config.selector || ''}
            onChange={(e) => handleConfigChange('selector', e.target.value)}
            placeholder="#section-id"
            size="small"
          />
        </div>
      )}

      {actionType === 'openPopup' && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Popup ID</label>
          <Input
            value={interaction.config.popupId || ''}
            onChange={(e) => handleConfigChange('popupId', e.target.value)}
            placeholder="popup-modal"
            size="small"
          />
        </div>
      )}

      {actionType === 'playVideo' && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Video Selector</label>
          <Input
            value={interaction.config.videoSelector || ''}
            onChange={(e) => handleConfigChange('videoSelector', e.target.value)}
            placeholder="#video-player"
            size="small"
          />
        </div>
      )}

      {actionType === 'downloadPDF' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: '#666' }}>PDF URL</label>
            <Input
              value={interaction.config.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              placeholder="https://example.com/document.pdf"
              size="small"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666' }}>Filename</label>
            <Input
              value={interaction.config.filename || ''}
              onChange={(e) => handleConfigChange('filename', e.target.value)}
              placeholder="document.pdf"
              size="small"
            />
          </div>
        </>
      )}

      {actionType === 'toggleClass' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: '#666' }}>Element Selector</label>
            <Input
              value={interaction.config.selector || ''}
              onChange={(e) => handleConfigChange('selector', e.target.value)}
              placeholder=".element-class"
              size="small"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666' }}>Class Name</label>
            <Input
              value={interaction.config.className || ''}
              onChange={(e) => handleConfigChange('className', e.target.value)}
              placeholder="active"
              size="small"
            />
          </div>
        </>
      )}

      {(actionType === 'showElement' || actionType === 'hideElement') && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Element Selector</label>
          <Input
            value={interaction.config.selector || ''}
            onChange={(e) => handleConfigChange('selector', e.target.value)}
            placeholder=".element-class"
            size="small"
          />
        </div>
      )}

      {actionType === 'copyToClipboard' && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Text to Copy</label>
          <Input
            value={interaction.config.text || ''}
            onChange={(e) => handleConfigChange('text', e.target.value)}
            placeholder="Text to copy"
            size="small"
          />
        </div>
      )}

      {actionType === 'customAction' && (
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>JavaScript Code</label>
          <Input.TextArea
            value={interaction.config.code || ''}
            onChange={(e) => handleConfigChange('code', e.target.value)}
            placeholder="// Your custom code"
            rows={4}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
            size="small"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Hook to use interactions
 */
export function useInteractions() {
  const addInteraction = (nodeId, interaction) => {
    return interactionManager.addInteraction(nodeId, interaction);
  };

  const getInteractions = (nodeId) => {
    return interactionManager.getInteractions(nodeId);
  };

  const generateEventListeners = (nodeId) => {
    return interactionManager.generateEventListeners(nodeId);
  };

  return {
    addInteraction,
    getInteractions,
    generateEventListeners,
  };
}
