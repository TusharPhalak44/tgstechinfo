/**
 * BuilderToolbar Component
 * Professional toolbar with all builder actions
 * Undo, Redo, Preview, Publish, Device Switcher, Zoom, Save, History, Theme, Page Settings
 */

import React, { useState, useCallback } from 'react';
import { Button, Space, Dropdown, Tooltip, Slider, Badge, Modal } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  SaveOutlined,
  HistoryOutlined,
  BgColorsOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  ScissorOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useBuilderActions, useBuilderPage, useBuilderSelection } from '../core/BuilderStore';
import DeviceToolbar from './DeviceToolbar';
import ThemeSettingsPanel from './ThemeSettingsPanel';
import PageSettingsPanel from './PageSettingsPanel';
import VersionHistoryPanel from './VersionHistoryPanel';

/**
 * BuilderToolbar Component
 */
export default function BuilderToolbar({ onSave, onPublish, onPreview }) {
  const { undo, redo, copyNodes, pasteNodes, deleteNode, clearSelection } = useBuilderActions();
  const page = useBuilderPage();
  const { selectedNodeId } = useBuilderSelection();
  
  const [zoom, setZoom] = useState(100);
  const [themeSettingsVisible, setThemeSettingsVisible] = useState(false);
  const [pageSettingsVisible, setPageSettingsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, unsaved

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleCopy = useCallback(() => {
    if (selectedNodeId) {
      copyNodes([selectedNodeId]);
    }
  }, [selectedNodeId, copyNodes]);

  const handlePaste = useCallback(() => {
    pasteNodes(page?.root?.id);
  }, [page, pasteNodes]);

  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      clearSelection();
    }
  }, [selectedNodeId, deleteNode, clearSelection]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      if (onSave) {
        await onSave();
      }
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('unsaved');
    }
  }, [onSave]);

  const handlePublish = useCallback(() => {
    if (onPublish) {
      onPublish();
    }
  }, [onPublish]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview();
    }
  }, [onPreview]);

  const moreMenuItems = [
    {
      key: 'theme',
      label: 'Theme Settings',
      icon: <BgColorsOutlined />,
      onClick: () => setThemeSettingsVisible(true),
    },
    {
      key: 'page',
      label: 'Page Settings',
      icon: <SettingOutlined />,
      onClick: () => setPageSettingsVisible(true),
    },
    {
      key: 'history',
      label: 'Version History',
      icon: <HistoryOutlined />,
      onClick: () => setHistoryVisible(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'global-components',
      label: 'Global Components',
      icon: <AppstoreOutlined />,
      onClick: () => {
        // This would open the global components panel
      },
    },
    {
      key: 'templates',
      label: 'Templates',
      icon: <ThunderboltOutlined />,
      onClick: () => {
        // This would open the template gallery
      },
    },
  ];

  return (
    <>
      <div className="builder-toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#fff',
        gap: 12,
      }}>
        {/* Left Section - History & Edit */}
        <Space size="small">
          <Tooltip title="Undo (Ctrl+Z)">
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={!page}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <Button
              type="text"
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={!page}
              size="small"
            />
          </Tooltip>
          <div style={{ width: 1, height: 24, backgroundColor: '#e8e8e8', margin: '0 4px' }} />
          <Tooltip title="Copy (Ctrl+C)">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!selectedNodeId}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Paste (Ctrl+V)">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handlePaste}
              disabled={!page}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete (Delete)">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              disabled={!selectedNodeId}
              size="small"
              danger
            />
          </Tooltip>
        </Space>

        {/* Center Section - Device & Zoom */}
        <Space size="small" align="center">
          <DeviceToolbar />
          <div style={{ width: 1, height: 24, backgroundColor: '#e8e8e8', margin: '0 8px' }} />
          <Space size="small" align="center">
            <Tooltip title="Zoom Out">
              <Button
                type="text"
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
                size="small"
              />
            </Tooltip>
            <div style={{ width: 80, textAlign: 'center' }}>
              Slider
            </div>
            <Tooltip title="Zoom In">
              <Button
                type="text"
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <Button
                type="text"
                onClick={handleZoomReset}
                size="small"
              >
                {zoom}%
              </Button>
            </Tooltip>
          </Space>
        </Space>

        {/* Right Section - Actions */}
        <Space size="small">
          <Badge dot={saveStatus === 'unsaved'} offset={[-5, 5]}>
            <Tooltip title="Save (Ctrl+S)">
              <Button
                type="text"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saveStatus === 'saving'}
                disabled={!page}
                size="small"
              >
                Save
              </Button>
            </Tooltip>
          </Badge>
          
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={handlePreview}
              disabled={!page}
              size="small"
            >
              Preview
            </Button>
          </Tooltip>
          
          <Tooltip title="Publish">
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={handlePublish}
              disabled={!page}
              size="small"
            >
              Publish
            </Button>
          </Tooltip>

          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
            <Button type="text" size="small">
              More
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* Theme Settings Panel */}
      <ThemeSettingsPanel
        visible={themeSettingsVisible}
        onClose={() => setThemeSettingsVisible(false)}
      />

      {/* Page Settings Panel */}
      <PageSettingsPanel
        visible={pageSettingsVisible}
        onClose={() => setPageSettingsVisible(false)}
      />

      {/* Version History Panel */}
      <VersionHistoryPanel
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </>
  );
}

/**
 * ZoomSlider Component
 * Internal component for zoom control
 */
function ZoomSlider({ value, onChange }) {
  return (
    <div style={{ width: 100 }}>
      <Slider
        min={50}
        max={200}
        value={value}
        onChange={onChange}
        tooltip={{ formatter: (val) => `${val}%` }}
        size="small"
      />
    </div>
  );
}
