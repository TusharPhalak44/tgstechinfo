/**
 * VisualBuilder Component
 * Professional three-panel visual page builder interface.
 * Left: Widgets sidebar | Center: Visual Canvas | Right: Properties panel
 * Header: responsive-mode switcher + preview toggle + save/cancel
 */

import React, { useState, useCallback } from 'react';
import { Layout, Button, Tooltip, Modal, ConfigProvider, theme, Alert } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import {
  DesktopOutlined, TabletOutlined, MobileOutlined,
  EyeOutlined, EditOutlined, MenuOutlined, SaveOutlined, CloseOutlined,
  CheckCircleOutlined, SyncOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { BuilderProvider, useBuilderActions, useBuilderState } from '../core/BuilderStore.jsx';
import WidgetSidebar from './WidgetSidebar';
import VisualCanvas from './VisualCanvas';
import PropertyPanel from './PropertyPanel';
import Navigator from './Navigator';
import PreviewCanvas from './PreviewCanvas';
import KeyboardShortcuts from './KeyboardShortcuts';

const { Sider, Content } = Layout;

// ─── Error Boundary Component ────────────────────────────────────────────────
class VisualBuilderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[VisualBuilder] Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
          <Alert
            message="Visual Builder Error"
            description={
              <div>
                <p>Something went wrong with the visual builder. This is usually caused by:</p>
                <ul>
                  <li>Corrupted localStorage data</li>
                  <li>Missing required dependencies</li>
                  <li>Browser compatibility issues</li>
                </ul>
                <p><strong>Try these fixes:</strong></p>
                <ol>
                  <li>Refresh the page</li>
                  <li>Clear browser cache and reload</li>
                  <li>Try a different browser</li>
                </ol>
                {this.state.error && (
                  <details style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical Details</summary>
                    <pre style={{ marginTop: 8, fontSize: 12, overflow: 'auto' }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            }
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <VisualBuilderErrorBoundary>
      <BuilderContentIdContext.Provider value={contentId}>
        <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
          <BuilderProvider>
            <VisualBuilderContent
              initialData={initialData}
              onSave={onSave}
              onCancel={onCancel}
              embedded={embedded}
              darkMode={darkMode}
              contentId={contentId}
              triggerPreview={triggerPreview}
              previewMeta={previewMeta}
            />
          </BuilderProvider>
        </ConfigProvider>
      </BuilderContentIdContext.Provider>
    </VisualBuilderErrorBoundary>
  );
}

// ─── Inner component (has access to builder context) ─────────────────────────
function VisualBuilderContent({ initialData, onSave, onCancel, embedded = false, darkMode = false, contentId = null, triggerPreview = null, previewMeta = null }) {
  const actions = useBuilderActions();
  const state   = useBuilderState();
  
  // Use refs to store actions and callbacks to avoid infinite loops
  const actionsRef = React.useRef(actions);
  const onSaveRef = React.useRef(onSave);
  
  React.useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);
  
  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const [sidebarCollapsed,       setSidebarCollapsed]       = useState(false);
  const [propertyPanelCollapsed, setPropertyPanelCollapsed] = useState(false); // Start open by default
  const [navigatorCollapsed,     setNavigatorCollapsed]     = useState(true); // Start collapsed
  const [previewMode,            setPreviewMode]            = useState(false);
  const [previewDevice,          setPreviewDevice]          = useState('desktop');
  const [previewModalOpen,       setPreviewModalOpen]       = useState(false);
  const [autoSaveStatus,         setAutoSaveStatus]         = useState('saved'); // 'saving', 'saved', 'error'
  const lastSavedDataRef = React.useRef(null); // Track last saved data to prevent duplicate saves
  const isInitializedRef = React.useRef(false); // Track if builder is initialized

  // Wire external preview trigger — allows parent (CreateContent) to open this modal
  React.useEffect(() => {
    if (triggerPreview) {
      triggerPreview.current = () => setPreviewModalOpen(true);
    }
    return () => {
      if (triggerPreview) triggerPreview.current = null;
    };
  }, [triggerPreview]);

  // Load data once on mount - check for unsaved localStorage data first
  React.useEffect(() => {
    // Prevent running multiple times
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const storageKey = `builder_autosave_${contentId || 'draft'}`;

    try {
      const savedData = localStorage.getItem(storageKey);
      const savedTimestamp = localStorage.getItem(`${storageKey}_timestamp`);

      // If we have initialData from server, prefer that and clear localStorage
      if (initialData && initialData.layout) {
        console.log('[VisualBuilder] Loading from server data, clearing localStorage backup');
        actionsRef.current.loadPage(initialData);
        // Clear localStorage since we have fresh server data
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_timestamp`);
        return;
      }

      // Check if there's recent unsaved data (within last 24 hours)
      if (savedData && savedTimestamp) {
        const timestamp = parseInt(savedTimestamp, 10);
        const hoursSinceLastSave = (Date.now() - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24) {
          // Ask user if they want to restore
          const shouldRestore = window.confirm(
            'We found unsaved changes from your previous session. Would you like to restore them?'
          );
          
          if (shouldRestore) {
            try {
              const parsedData = JSON.parse(savedData);
              actionsRef.current.loadPage(parsedData);
              console.log('[VisualBuilder] Previous session restored successfully');
              return;
            } catch (err) {
              console.error('[VisualBuilder] Failed to restore from localStorage:', err);
              // Clear corrupted data
              localStorage.removeItem(storageKey);
              localStorage.removeItem(`${storageKey}_timestamp`);
            }
          } else {
            // User declined, clear the saved data
            localStorage.removeItem(storageKey);
            localStorage.removeItem(`${storageKey}_timestamp`);
          }
        } else {
          // Data is too old, clear it
          localStorage.removeItem(storageKey);
          localStorage.removeItem(`${storageKey}_timestamp`);
        }
      }

      // Normal load path
      if (initialData) {
        actionsRef.current.loadPage(initialData);
      } else {
        actionsRef.current.ensurePage();
      }
    } catch (err) {
      console.error('[VisualBuilder] Error in mount effect:', err);
      // Fallback to normal load
      try {
        if (initialData) {
          actionsRef.current.loadPage(initialData);
        } else {
          actionsRef.current.ensurePage();
        }
        // Clear localStorage on error to prevent repeated issues
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_timestamp`);
      } catch (fallbackErr) {
        console.error('[VisualBuilder] Fallback load failed:', fallbackErr);
      }
    }
  }, []); // Empty deps - run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    const data = actionsRef.current.serialize();
    onSaveRef.current?.(data);
    
    // Clear localStorage backup after successful manual save
    const storageKey = `builder_autosave_${contentId || 'draft'}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_timestamp`);
  }, [contentId]);

  // Auto-save to localStorage for crash recovery
  React.useEffect(() => {
    if (!state.page?.root || !embedded) return;
    
    // Skip if this is the initial load
    if (!isInitializedRef.current) return;

    const timeoutId = setTimeout(() => {
      try {
        const data = actionsRef.current.serialize();
        const dataStr = JSON.stringify(data);
        
        // Avoid saving if data hasn't changed
        if (lastSavedDataRef.current === dataStr) return;
        
        // Save to localStorage for crash recovery (backup only)
        const storageKey = `builder_autosave_${contentId || 'draft'}`;
        localStorage.setItem(storageKey, dataStr);
        localStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());
        lastSavedDataRef.current = dataStr;
        console.log('[VisualBuilder] Backup saved to localStorage');
      } catch (err) {
        console.error('[VisualBuilder] Auto-save to localStorage failed:', err);
      }
    }, 500); // 500ms debounce for localStorage (faster than server sync)

    return () => clearTimeout(timeoutId);
  }, [state.page, embedded, contentId]); // Stable dependencies only

  // Auto-sync to parent when page changes (for embedded mode) - debounced
  React.useEffect(() => {
    if (!embedded || !state.page?.root) return;
    
    // Skip if this is the initial load (no changes made yet)
    if (!isInitializedRef.current) return;

    setAutoSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        const data = actionsRef.current.serialize();
        // Only sync if data has actually changed
        const dataStr = JSON.stringify(data);
        if (window.__lastBuilderData === dataStr) {
          setAutoSaveStatus('saved');
          return;
        }
        window.__lastBuilderData = dataStr;
        
        console.log('[VisualBuilder] Auto-syncing changes to database...');
        await onSaveRef.current?.(data, { autoSync: true }); // Flag to indicate auto-sync
        setAutoSaveStatus('saved');
        console.log('[VisualBuilder] Auto-sync complete');
      } catch (err) {
        console.error('[VisualBuilder] Auto-sync failed:', err);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('saved'), 2000);
      }
    }, 1500); // 1.5 second debounce for server sync (slightly longer to batch changes)

    return () => clearTimeout(timeoutId);
  }, [state.page, embedded]); // Stable dependencies only

  // Device frame widths for preview modal
  const DEVICE_WIDTHS = { desktop: '100%', tablet: 768, mobile: 390 };

  // Show loading state if page isn't ready yet
  if (!state.page) {
    return (
      <div
        style={{
          height: embedded ? '100%' : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: darkMode ? '#0f172a' : '#f0f2f5',
          minHeight: embedded ? 600 : undefined,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <SyncOutlined spin style={{ fontSize: 32, color: darkMode ? '#94a3b8' : '#999', marginBottom: 16 }} />
          <div style={{ color: darkMode ? '#94a3b8' : '#666', fontSize: 14 }}>Loading builder...</div>
        </div>
      </div>
    );
  }

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
        {/* Left: title + auto-save status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>
            Page Builder
          </div>
          {embedded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              {autoSaveStatus === 'saving' && (
                <>
                  <SyncOutlined spin style={{ color: '#1890ff' }} />
                  <span style={{ color: '#1890ff' }}>Auto-saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span style={{ color: '#52c41a' }}>All changes saved</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span style={{ color: '#ff4d4f' }}>Save failed (backup in localStorage)</span>
                </>
              )}
            </div>
          )}
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
            position: 'relative',
          }}
          title={propertyPanelCollapsed ? 'Show properties' : 'Hide properties'}
        >
          {propertyPanelCollapsed ? '‹' : '›'}
          
          {/* Visual indicator line on the left side */}
          {propertyPanelCollapsed && (
            <div
              style={{
                position: 'absolute',
                left: -4,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 50,
                background: 'linear-gradient(to bottom, transparent, #1890ff, transparent)',
                borderRadius: 2,
                animation: 'slideIndicator 2s ease-in-out infinite',
                pointerEvents: 'none',
                boxShadow: '0 0 8px rgba(24, 144, 255, 0.5)',
              }}
            />
          )}
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

      {/* ── Bottom Navigator Panel ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: 'transform 0.3s ease',
          transform: navigatorCollapsed ? 'translateY(100%)' : 'translateY(0)',
        }}
      >
        <div
          style={{
            height: embedded ? 200 : 250,
            borderTop: `2px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
            background: darkMode ? '#1e293b' : '#fff',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Navigator Header */}
          <div
            style={{
              height: 44,
              borderBottom: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              background: darkMode ? '#0f172a' : '#fafafa',
              cursor: 'pointer',
            }}
            onClick={() => setNavigatorCollapsed(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MenuOutlined style={{ fontSize: 16, color: darkMode ? '#94a3b8' : '#666' }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>
                Navigator
              </span>
              <span style={{ fontSize: 12, color: darkMode ? '#64748b' : '#999' }}>
                {state.page?.root?.children?.length || 0} sections
              </span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              style={{ color: darkMode ? '#94a3b8' : '#666' }}
            />
          </div>

          {/* Navigator Content */}
          <div style={{ flex: 1, overflow: 'auto', background: darkMode ? '#1e293b' : '#fff' }}>
            <Navigator />
          </div>
        </div>
      </div>

      {/* Floating Navigator Toggle Button (when collapsed) */}
      {navigatorCollapsed && (
        <Button
          icon={<MenuOutlined />}
          onClick={() => setNavigatorCollapsed(false)}
          size="large"
          type="primary"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            height: 48,
            width: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <span style={{ fontSize: 12, marginLeft: 8, display: 'none' }}>Navigator</span>
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
      
      <style>{`
        @keyframes slideIndicator {
          0%, 100% {
            transform: translateY(-50%) scaleY(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50%) scaleY(1.3);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
