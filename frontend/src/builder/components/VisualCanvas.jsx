/**
 * VisualCanvas Component
 * Center panel for visual page building with drag-and-drop support.
 * Uses dragState singleton for reliable cross-browser drag data.
 */

import React, { useCallback, useRef, memo, useState, useEffect } from 'react';
import { Empty, Button, Card, Row, Col, Modal } from 'antd';
import { PlusOutlined, AppstoreOutlined, ThunderboltOutlined, RocketOutlined } from '@ant-design/icons';
import { useBuilderPage, useBuilderActions, useBuilderSelection, useResponsiveMode } from '../core/BuilderStore.jsx';
import CanvasNode from './CanvasNode';
import TemplateGallery from './TemplateGallery';
import { deviceConfig } from '../utils/types';
import dragState from '../utils/dragState';
import { useTheme } from '../../context/ThemeContext';

const LAYOUT_TYPES = ['page', 'section', 'container', 'column', 'column-1', 'column-2', 'column-3', 'column-4'];

/**
 * VisualCanvas Component
 * Memoized to prevent unnecessary re-renders
 */
const VisualCanvas = memo(function VisualCanvas() {
  const page = useBuilderPage();
  const { darkMode } = useTheme();
  const {
    selectNode, clearSelection, addNode, loadTemplate, appendTemplate,
    ensurePage, findNode, findParentNode, findNodeIndex, moveNode,
  } = useBuilderActions();
  const { selectedNodeId } = useBuilderSelection();
  const responsiveMode = useResponsiveMode();
  const canvasRef = useRef(null);
  const [templateGalleryVisible, setTemplateGalleryVisible] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const autoScrollRef = useRef(null);

  const getCanvasWidth = () => deviceConfig[responsiveMode]?.width || 1200;

  const getCanvasScale = () => {
    const canvasContainerWidth = canvasRef.current?.clientWidth || 0;
    if (!canvasContainerWidth) return 1;
    if (responsiveMode === 'desktop') return 1;
    const targetWidth = getCanvasWidth();
    const rawRatio = canvasContainerWidth / targetWidth;
    return Math.max(0.6, Math.min(1, rawRatio));
  };

  const getContentWidth = () => {
    const target = getCanvasWidth();
    if (responsiveMode === 'desktop') return target;
    return target;
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const scrollThreshold = 50;
      const scrollSpeed = 10;

      if (e.clientY - canvasRect.top < scrollThreshold) {
        canvasRef.current.scrollTop -= scrollSpeed;
      } else if (canvasRect.bottom - e.clientY < scrollThreshold) {
        canvasRef.current.scrollTop += scrollSpeed;
      }
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDragOverIndex(null);

    // Prefer dataTransfer values (guaranteed in drop handler), fall back to dragState
    const widgetType    = e.dataTransfer.getData('widget-type')  || dragState.widgetType  || '';
    const widgetLabel   = e.dataTransfer.getData('widget-label') || dragState.widgetLabel || widgetType;
    const draggedNodeId = e.dataTransfer.getData('node-id')      || dragState.nodeId      || '';

    dragState.clear();

    if (!widgetType && !draggedNodeId) return;

    // Template drop — load it
    if (widgetType && widgetType.startsWith('template-')) {
      loadTemplate(widgetType.replace('template-', ''));
      return;
    }

    const currentPage = ensurePage();
    if (!currentPage?.root) return;

    // Reorder existing node within canvas root
    if (draggedNodeId) {
      const parentNode    = currentPage.root;
      const currentIndex  = findNodeIndex(draggedNodeId);
      const targetIndex   = dragOverIndex !== null ? dragOverIndex : (parentNode.children?.length || 0);
      const sameParent    = findParentNode(draggedNodeId)?.id === parentNode.id;
      const finalIndex    = (sameParent && currentIndex >= 0 && targetIndex > currentIndex)
        ? targetIndex - 1
        : targetIndex;
      moveNode(draggedNodeId, parentNode.id, finalIndex);
      return;
    }

    // New widget from sidebar
    if (widgetType) {
      const isLayout = LAYOUT_TYPES.includes(widgetType);

      let targetParentId;
      let insertIndex;

      if (isLayout) {
        targetParentId = currentPage.root.id;
        insertIndex    = dragOverIndex !== null ? dragOverIndex : (currentPage.root.children?.length || 0);
      } else {
        // Try to find a container to drop into
        let firstContainerId = null;
        const firstSection = currentPage.root.children?.find(c => c.type === 'section');
        if (firstSection) {
          const firstContainer = firstSection.children?.find(c => c.type === 'container');
          if (firstContainer) firstContainerId = firstContainer.id;
        }
        if (firstContainerId) {
          targetParentId = firstContainerId;
          const container = findNode(firstContainerId);
          insertIndex    = container?.children?.length || 0;
        } else {
          // No container yet — engine will auto-create one
          targetParentId = currentPage.root.id;
          insertIndex    = currentPage.root.children?.length || 0;
        }
      }

      addNode(
        {
          id:       `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type:     widgetType,
          label:    widgetLabel,
          content:  '',
          children: [],
          settings: {},
          styles:   {},
          responsive: {},
          metadata: { createdAt: Date.now(), updatedAt: Date.now() },
        },
        targetParentId,
        insertIndex,
      );
    }
  }, [addNode, dragOverIndex, ensurePage, loadTemplate, moveNode, findNode, findNodeIndex, findParentNode]);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList?.contains('canvas-content')) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleDragLeave = useCallback((e) => {
    if (e && e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
    setIsDraggingOver(false);
    setDragOverIndex(null);
  }, []);

  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, []);

  const handleAddSection = useCallback(async () => {
    console.log('[VisualCanvas] Adding section (blank template)');
    await loadTemplate('blank');
  }, [loadTemplate]);

  const handleLoadTemplate = useCallback(async (templateId) => {
    console.log('[VisualCanvas] Loading template:', templateId);
    await loadTemplate(templateId);
    setTemplateGalleryVisible(false);
  }, [loadTemplate]);

  const handleAppendTemplate = useCallback(async (templateId) => {
    console.log('[VisualCanvas] Appending template:', templateId);
    await appendTemplate(templateId);
    setTemplateGalleryVisible(false);
  }, [appendTemplate]);

  if (!page || !page.root) {
    return (
      <>
        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            background: darkMode ? '#0f172a' : undefined,
          }}
        >
          <Card style={{ maxWidth: 600, width: '100%', textAlign: 'center', background: darkMode ? '#1e293b' : undefined, borderColor: darkMode ? '#334155' : undefined }}>
            <div style={{ marginBottom: 24 }}>
              <AppstoreOutlined style={{ fontSize: 64, color: darkMode ? '#475569' : '#d9d9d9' }} />
            </div>
            <h2 style={{ marginBottom: 8, color: darkMode ? '#f1f5f9' : undefined }}>Start Building Your Page</h2>
            <p style={{ color: darkMode ? '#94a3b8' : '#666', marginBottom: 24 }}>
              Choose a template to get started quickly, or drag widgets from the sidebar to build from scratch
            </p>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Button
                  type="primary"
                  size="large"
                  icon={<AppstoreOutlined />}
                  onClick={() => setTemplateGalleryVisible(true)}
                  style={{ width: '100%', height: 48 }}
                >
                  Choose Template
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleAddSection}
                  style={{ width: '100%', height: 48 }}
                >
                  Start Blank
                </Button>
              </Col>
            </Row>
            <div style={{ 
              borderTop: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`, 
              paddingTop: 16, 
              marginTop: 16 
            }}>
              <p style={{ color: darkMode ? '#94a3b8' : '#999', fontSize: 13, marginBottom: 12 }}>Quick Start Templates</p>
              <Row gutter={8}>
                <Col span={8}>
                  <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleLoadTemplate('webinar')}
                    style={{ width: '100%' }}
                  >
                    Webinar
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    size="small"
                    icon={<RocketOutlined />}
                    onClick={() => handleLoadTemplate('product')}
                    style={{ width: '100%' }}
                  >
                    Product
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    size="small"
                    icon={<AppstoreOutlined />}
                    onClick={() => handleLoadTemplate('contact')}
                    style={{ width: '100%' }}
                  >
                    Contact
                  </Button>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
        
        <TemplateGallery
          visible={templateGalleryVisible}
          onClose={() => setTemplateGalleryVisible(false)}
          onLoadTemplate={handleLoadTemplate}
          onReplaceTemplate={handleLoadTemplate}
          onAppendTemplate={handleAppendTemplate}
        />
      </>
    );
  }

  const canvasWidth = getContentWidth();
  const canvasScale = getCanvasScale();

  const hasChildren = page.root.children && page.root.children.length > 0;

  return (
    <div
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onClick={handleCanvasClick}
      style={{
        height: '100%',
        padding: '24px',
        overflow: 'auto',
        transition: 'background-color 0.2s',
        backgroundColor: isDraggingOver ? (darkMode ? 'rgba(24,144,255,0.08)' : '#f0f7ff') : 'transparent',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div 
        className="canvas-content" 
        style={{ 
          width: responsiveMode === 'desktop' ? '100%' : canvasWidth,
          maxWidth: responsiveMode === 'desktop' ? Math.min(1100, canvasWidth) : canvasWidth,
          margin: '0 auto',
          transform: responsiveMode === 'desktop' ? 'none' : `scale(${canvasScale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.3s ease',
          minHeight: hasChildren ? 'auto' : 400,
        }}
      >
        {!hasChildren && (
          <div
            style={{
              minHeight: 360,
              border: isDraggingOver ? '2px dashed #1890ff' : `2px dashed ${darkMode ? '#334155' : '#d9d9d9'}`,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDraggingOver ? (darkMode ? 'rgba(24,144,255,0.1)' : '#f0f7ff') : (darkMode ? '#0f172a' : '#fafafa'),
              padding: 40,
              marginBottom: 16,
            }}
          >
            <AppstoreOutlined style={{ fontSize: 48, color: darkMode ? '#475569' : '#d9d9d9', marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8, color: darkMode ? '#94a3b8' : '#666' }}>Empty Canvas</h3>
            <p style={{ color: darkMode ? '#64748b' : '#999', marginBottom: 16, textAlign: 'center' }}>
              Drag widgets from the sidebar or choose a template to get started
            </p>
            <Button
              icon={<AppstoreOutlined />}
              onClick={() => setTemplateGalleryVisible(true)}
            >
              Choose Template
            </Button>
          </div>
        )}

        {page.root.children.map((node, index) => (
          <div key={node.id} style={{ position: 'relative', marginBottom: 16 }}>
            {dragOverIndex === index && (
              <div style={{
                height: '4px',
                background: '#1890ff',
                borderRadius: '2px',
                margin: '8px 0',
                animation: 'pulse 1s infinite',
                boxShadow: '0 0 8px rgba(24, 144, 255, 0.5)',
              }} />
            )}
            
            <CanvasNode
              node={node}
              parentId={page.root.id}
              ownIndex={index}
              isSelected={node.id === selectedNodeId}
              onSelect={() => selectNode(node.id)}
              onRootDragOverIndex={(i) => setDragOverIndex(i)}
            />
          </div>
        ))}
        
        {dragOverIndex === page.root.children.length && (
          <div style={{
            height: '4px',
            background: '#1890ff',
            borderRadius: '2px',
            margin: '8px 0',
            animation: 'pulse 1s infinite',
            boxShadow: '0 0 8px rgba(24, 144, 255, 0.5)',
          }} />
        )}
      </div>

      <TemplateGallery
        visible={templateGalleryVisible}
        onClose={() => setTemplateGalleryVisible(false)}
        onLoadTemplate={handleLoadTemplate}
        onReplaceTemplate={handleLoadTemplate}
        onAppendTemplate={handleAppendTemplate}
      />
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
});

export default VisualCanvas;
