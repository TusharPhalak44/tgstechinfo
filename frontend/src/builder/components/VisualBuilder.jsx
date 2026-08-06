/**
 * VisualBuilder Component
 * Professional three-panel visual page builder interface.
 * Left: Widgets sidebar | Center: Visual Canvas | Right: Properties panel
 * Header: responsive-mode switcher + preview toggle + save/cancel
 */

import React, { useState, useCallback } from 'react';
import { Layout, Button, Tooltip, Modal, ConfigProvider, theme } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import {
  DesktopOutlined, TabletOutlined, MobileOutlined,
  EyeOutlined, EditOutlined, MenuOutlined, SaveOutlined, CloseOutlined,
} from '@ant-design/icons';
import { BuilderProvider, useBuilderActions, useBuilderState } from '../core/BuilderStore.jsx';
import WidgetSidebar from './WidgetSidebar';
import VisualCanvas from './VisualCanvas';
import PropertyPanel from './PropertyPanel';
import Navigator from './Navigator';
import PreviewCanvas from './PreviewCanvas';
import KeyboardShortcuts from './KeyboardShortcuts';

const { Sider, Content } = Layout;

// ─── Responsive-mode button group ────────────────────────────────────────────
function ResponsiveButtons({ mode, onChange, darkMode = false }) {
  const btn = (icon, value, label) => (
    <Tooltip title={label} key={value}>
      <Button
        type={mode === value ? 'primary' : 'default'}
        icon={icon}
        size="small"
        onClick={() => onChange(value)}
        style={{ borderRadius: 0 }}
      />
    </Tooltip>
  );
  return (
    <div style={{ display: 'flex', border: `1px solid ${darkMode ? '#334155' : '#d9d9d9'}`, borderRadius: 6, overflow: 'hidden' }}>
      {btn(<DesktopOutlined />, 'desktop', 'Desktop')}
      {btn(<TabletOutlined />,  'tablet',  'Tablet')}
      {btn(<MobileOutlined />,  'mobile',  'Mobile')}
    </div>
  );
}

// ─── Outer wrapper that provides context ─────────────────────────────────────
// Context to share contentId with all widgets inside the builder
export const BuilderContentIdContext = React.createContext(null);

export default function VisualBuilder({ initialData, onSave, onCancel, embedded = false, contentId = null, triggerPreview = null, previewMeta = null }) {
  const { darkMode } = useTheme();
  return (
    <BuilderContentIdContext.Provider value={contentId}>
      <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <BuilderProvider>
          <VisualBuilderContent
            initialData={initialData}
            onSave={onSave}
            onCancel={onCancel}
            embedded={embedded}
            darkMode={darkMode}
            triggerPreview={triggerPreview}
            previewMeta={previewMeta}
          />
        </BuilderProvider>
      </ConfigProvider>
    </BuilderContentIdContext.Provider>
  );
}

// ─── Inner component (has access to builder context) ─────────────────────────
function VisualBuilderContent({ initialData, onSave, onCancel, embedded = false, darkMode = false, triggerPreview = null, previewMeta = null }) {
  const actions = useBuilderActions();
  const state   = useBuilderState();

  const [sidebarCollapsed,       setSidebarCollapsed]       = useState(false);
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(false);
  const [navigatorCollapsed,     setNavigatorCollapsed]     = useState(false);
  const [previewMode,            setPreviewMode]            = useState(false);
  const [previewDevice,          setPreviewDevice]          = useState('desktop');
  const [previewModalOpen,       setPreviewModalOpen]       = useState(false);

  // Wire external preview trigger — allows parent (CreateContent) to open this modal
  React.useEffect(() => {
    if (triggerPreview) {
      triggerPreview.current = () => setPreviewModalOpen(true);
    }
    return () => {
      if (triggerPreview) triggerPreview.current = null;
    };
  }, [triggerPreview]);

  // Load data once on mount
  React.useEffect(() => {
    if (initialData) {
      actions.loadPage(initialData);
    } else {
      actions.ensurePage();
    }
  }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    const data = actions.serialize();
    onSave?.(data);
  }, [actions, onSave]);

  // Auto-sync to parent when page changes (for embedded mode) - debounced
  React.useEffect(() => {
    if (!embedded || !state.page?.root) return;

    const timeoutId = setTimeout(() => {
      const data = actions.serialize();
      // Only sync if data has actually changed
      const dataStr = JSON.stringify(data);
      if (window.__lastBuilderData === dataStr) return;
      window.__lastBuilderData = dataStr;
      onSave?.(data, { autoSync: true }); // Flag to indicate auto-sync
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.page?.root, embedded, actions, onSave]);

  // Device frame widths for preview modal
  const DEVICE_WIDTHS = { desktop: '100%', tablet: 768, mobile: 390 };

  return (
    <div
      className="visual-builder"
      style={{
        height: embedded ? '100%' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        minHeight: embedded ? 600 : undefined,
        background: darkMode ? '#0f172a' : '#f0f2f5',
      }}
    >
      <KeyboardShortcuts />
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="builder-header"
        style={{
          height: 52,
          borderBottom: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: darkMode ? '#1e293b' : '#fff',
          flexShrink: 0,
          gap: 8,
          zIndex: 10,
        }}
      >
        {/* Left: title */}
        <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#1a1a2e', minWidth: 80 }}>
          Page Builder
        </div>

        {/* Center: responsive-mode switcher */}
        <ResponsiveButtons
          mode={state.responsiveMode}
          onChange={actions.setResponsiveMode}
          darkMode={darkMode}
        />

        {/* Right: preview + save/cancel */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tooltip title="Preview page">
            <Button
              icon={previewMode ? <EditOutlined /> : <EyeOutlined />}
              size="small"
              type={previewMode ? 'primary' : 'default'}
              onClick={() => {
                // Open preview in a modal so editing state is preserved
                setPreviewModalOpen(true);
              }}
            >
              Preview
            </Button>
          </Tooltip>
          {!embedded && onCancel && (
            <Button size="small" icon={<CloseOutlined />} onClick={onCancel}>
              Cancel
            </Button>
          )}
          {!embedded && (
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              Save
            </Button>
          )}
        </div>
      </div>

      {/* ── Three-panel layout ──────────────────────────────────────────── */}
      <Layout style={{ flex: 1, overflow: 'hidden', background: darkMode ? '#0f172a' : '#f0f2f5' }}>
        {/* Left sidebar — widgets */}
        {!sidebarCollapsed && (
          <Sider
            width={260}
            theme="light"
            style={{
              borderRight: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
              overflow: 'auto',
              background: darkMode ? '#1e293b' : '#fafafa',
              flexShrink: 0,
            }}
          >
            <WidgetSidebar collapsed={false} darkMode={darkMode} />
          </Sider>
        )}

        {/* Sidebar toggle tab */}
        <div
          onClick={() => setSidebarCollapsed(c => !c)}
          style={{
            width: 16,
            background: darkMode ? '#334155' : '#f0f0f0',
            borderRight: `1px solid ${darkMode ? '#475569' : '#e8e8e8'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: darkMode ? '#94a3b8' : '#999',
            userSelect: 'none',
            flexShrink: 0,
          }}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </div>

        {/* Center — canvas */}
        <Content style={{ flex: 1, overflow: 'auto', background: darkMode ? '#0f172a' : '#f0f2f5', position: 'relative' }}>
          <VisualCanvas />
        </Content>

        {/* Right panel toggle tab */}
        <div
          onClick={() => setPropertyPanelCollapsed(c => !c)}
          style={{
            width: 16,
            background: darkMode ? '#334155' : '#f0f0f0',
            borderLeft: `1px solid ${darkMode ? '#475569' : '#e8e8e8'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: darkMode ? '#94a3b8' : '#999',
            userSelect: 'none',
            flexShrink: 0,
          }}
          title={propertyPanelCollapsed ? 'Show properties' : 'Hide properties'}
        >
          {propertyPanelCollapsed ? '‹' : '›'}
        </div>

        {/* Right sidebar — properties */}
        {!propertyPanelCollapsed && (
          <Sider
            width={300}
            theme="light"
            style={{
              borderLeft: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
              overflow: 'auto',
              background: darkMode ? '#1e293b' : '#fafafa',
              flexShrink: 0,
            }}
          >
            <PropertyPanel collapsed={false} darkMode={darkMode} />
          </Sider>
        )}
      </Layout>

      {/* ── Bottom Navigator ────────────────────────────────────────────── */}
      {!navigatorCollapsed && (
        <div
          style={{
            height: embedded ? 120 : 180,
            borderTop: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
            background: darkMode ? '#1e293b' : '#fff',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: 36,
              borderBottom: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontWeight: 600,
              fontSize: 13,
              color: darkMode ? '#f1f5f9' : '#1a1a2e',
            }}
          >
            <span>Navigator</span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setNavigatorCollapsed(true)}
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            <Navigator />
          </div>
        </div>
      )}

      {/* Floating navigator toggle when collapsed */}
      {navigatorCollapsed && (
        <Button
          icon={<MenuOutlined />}
          onClick={() => setNavigatorCollapsed(false)}
          size="small"
          style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1000 }}
        >
          Navigator
        </Button>
      )}

      {/* ── Preview Modal ───────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Page Preview</span>
            {/* Device switcher inside modal */}
            <div style={{ display: 'flex', border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
              {[
                { icon: <DesktopOutlined />, value: 'desktop', label: 'Desktop' },
                { icon: <TabletOutlined />,  value: 'tablet',  label: 'Tablet'  },
                { icon: <MobileOutlined />,  value: 'mobile',  label: 'Mobile'  },
              ].map(({ icon, value, label }) => (
                <Tooltip title={label} key={value}>
                  <Button
                    type={previewDevice === value ? 'primary' : 'default'}
                    icon={icon}
                    size="small"
                    onClick={() => setPreviewDevice(value)}
                    style={{ borderRadius: 0 }}
                  />
                </Tooltip>
              ))}
            </div>
          </div>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalOpen(false)}>Close</Button>,
        ]}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, background: '#e8e8e8', minHeight: '70vh' }}
        destroyOnClose={false}
      >
        {/* Device frame wrapper */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 24,
            minHeight: '65vh',
            background: '#e8e8e8',
          }}
        >
          <div
            style={{
              width: DEVICE_WIDTHS[previewDevice],
              maxWidth: '100%',
              background: '#fff',
              borderRadius: previewDevice === 'desktop' ? 0 : 12,
              boxShadow: previewDevice === 'desktop'
                ? 'none'
                : '0 4px 24px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              transition: 'width 0.3s ease',
              minHeight: '60vh',
            }}
          >
            {/* Article metadata header — shown when triggered from CreateContent */}
            {previewMeta && (
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #e8e8e8', background: '#fff' }}>
                {/* SEO Score */}
                {previewMeta.seoScore && (
                  <div style={{
                    marginBottom: 16,
                    padding: 12,
                    background: previewMeta.seoScore.percentage >= 80 ? 'rgba(91,189,43,0.08)' : 'rgba(249,148,29,0.08)',
                    border: `1.5px solid ${previewMeta.seoScore.percentage >= 80 ? '#5BBD2B' : '#F7941D'}`,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>SEO Score: {previewMeta.seoScore.percentage}%</span>
                    <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${previewMeta.seoScore.percentage}%`, height: '100%', background: previewMeta.seoScore.percentage >= 80 ? '#5BBD2B' : '#F7941D' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#666' }}>{previewMeta.seoScore.wordCount} words</span>
                  </div>
                )}
                {/* Content type + category tags */}
                <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {previewMeta.content_type && <span style={{ padding: '2px 10px', background: '#f0ecff', color: '#6c5ce7', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{previewMeta.content_type}</span>}
                  {previewMeta.category && <span style={{ padding: '2px 10px', background: '#e0f0ff', color: '#2563eb', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{previewMeta.category}</span>}
                </div>
                {/* Title */}
                {previewMeta.title && (
                  <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', margin: '0 0 10px 0', lineHeight: 1.3 }}>{previewMeta.title}</h1>
                )}
                {/* Banner image */}
                {previewMeta.banner_image && (
                  <div style={{ marginBottom: 14, borderRadius: 8, overflow: 'hidden' }}>
                    <img src={previewMeta.banner_image} alt={previewMeta.title} style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block', background: '#f5f5f5' }} />
                  </div>
                )}
                {/* Short description */}
                {previewMeta.short_description && (
                  <div style={{ padding: '10px 14px', background: 'rgba(74,124,255,0.07)', borderLeft: '4px solid #4a7cff', borderRadius: '0 8px 8px 0', marginBottom: 12, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                    {previewMeta.short_description}
                  </div>
                )}
                {/* Tags */}
                {previewMeta.tags && previewMeta.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {previewMeta.tags.map((tag, i) => (
                      <span key={i} style={{ padding: '2px 10px', background: '#e0e7ff', color: '#4338ca', borderRadius: 20, fontSize: 11 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <PreviewCanvas />
          </div>
        </div>
      </Modal>
    </div>
  );
}
