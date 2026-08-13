/**
 * CanvasNode Component
 * Renders individual builder nodes on the visual canvas with selection and hover states.
 * Uses dragState singleton for reliable cross-browser drag data access.
 */

import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Tooltip } from 'antd';
import { NodeType } from '../utils/types';
import widgetRegistry from '../registry/WidgetRegistry';
import NodeToolbar from './NodeToolbar';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import FallbackRenderer from './FallbackRenderer';
import { useBuilderActions, useBuilderSelection } from '../core/BuilderStore.jsx';
import dragState from '../utils/dragState';
import { useTheme } from '../../context/ThemeContext';

const LAYOUT_TYPES = ['page', 'section', 'container', 'column', 'column-1', 'column-2', 'column-3', 'column-4'];
const WIDGET_SAFE_PARENTS = ['container', 'column'];

// ─── Validation helpers ───────────────────────────────────────────────────────
/**
 * Returns true when `widgetType` is allowed to be dropped into `parentType`.
 * Widgets (non-layout) must go into container or column.
 * Layout nodes can go into page, section, or other layout containers.
 */
function isDropAllowed(widgetType, parentType) {
  if (!widgetType) return false;
  const isLayout = LAYOUT_TYPES.includes(widgetType);
  if (isLayout) {
    // Sections go directly inside page; containers/columns inside sections or columns
    return true; // engine resolves exact placement; no hard block at this level
  }
  // Widgets must land in a widget-safe parent
  return WIDGET_SAFE_PARENTS.includes(parentType);
}

function getColumnWidthStyle(node, siblingCount) {
  // columnCount is set by _expandLayoutChildren on each individual column node
  // siblingCount is the fallback when columnCount isn't on the node itself
  const count = node?.settings?.columnCount || siblingCount || 1;
  const widthPct = 100 / count;
  return {
    flex: `0 0 ${widthPct}%`,
    maxWidth: `${widthPct}%`,
    width: `${widthPct}%`,
    boxSizing: 'border-box',
    padding: '0 8px',
  };
}

/** True when a node's children should be rendered as a flex row of columns */
function hasColumnChildren(node) {
  if (!node?.children?.length) return false;
  // isColumnWrapper (column-1/2/3/4) — explicit multi-col wrapper
  if (node.type === 'column-1' || node.type === 'column-2' ||
      node.type === 'column-3' || node.type === 'column-4') return true;
  // container whose every child is type 'column' — produced by _expandLayoutChildren
  if (node.type === 'container' || node.type === 'section') {
    return node.children.every(c => c.type === 'column');
  }
  return false;
}

function getLayoutContainerStyle(type, isDragOverInside, darkMode) {
  const base = {
    width: '100%',
    boxSizing: 'border-box',
  };
  if (type === 'section') {
    return {
      ...base,
      padding: '24px 16px',
      marginBottom: 16,
      background: isDragOverInside ? 'rgba(74, 124, 255, 0.08)' : (darkMode ? '#1e293b' : '#ffffff'),
      border: isDragOverInside ? '2px dashed #4a7cff' : `1px solid ${darkMode ? '#334155' : '#f0f0f0'}`,
      borderRadius: 12,
    };
  }
  if (type === 'container') {
    return {
      ...base,
      padding: '16px',
      background: isDragOverInside ? 'rgba(74, 124, 255, 0.08)' : (darkMode ? '#0f172a' : '#fafafa'),
      border: isDragOverInside ? '2px dashed #4a7cff' : `1px dashed ${darkMode ? '#334155' : '#e5e7eb'}`,
      borderRadius: 8,
      minHeight: 80,
    };
  }
  if (type === 'column' || type.startsWith('column-')) {
    return {
      ...base,
      background: isDragOverInside ? 'rgba(74, 124, 255, 0.08)' : 'transparent',
      border: isDragOverInside ? '2px dashed #4a7cff' : `1px dashed ${darkMode ? '#334155' : '#e5e7eb'}`,
      borderRadius: 6,
      minHeight: 80,
      padding: '12px 8px',
    };
  }
  return base;
}

function getLayoutLabelStyle(type, darkMode) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: darkMode ? '#94a3b8' : '#6b7280',
    background: darkMode ? '#0f172a' : '#f3f4f6',
    padding: '2px 8px',
    borderRadius: 4,
    marginBottom: 8,
    pointerEvents: 'none',
    userSelect: 'none',
  };
}

const CanvasNode = memo(function CanvasNode({
  node,
  isSelected,
  onSelect,
  level = 0,
  parentId = null,
  ownIndex = 0,
  onRootDragOverIndex,
}) {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPosition, setDropPosition] = useState(null);
  const widget = LAYOUT_TYPES.includes(node.type) ? null : widgetRegistry.get(node.type);
  const { addNode, moveNode, selectNode } = useBuilderActions();
  const { selectedNodeId } = useBuilderSelection();
  const nodeRef = useRef(null);
  const isLayoutNode = LAYOUT_TYPES.includes(node.type);
  const isWidgetSafeParent = WIDGET_SAFE_PARENTS.includes(node.type);
  const isColumnWrapper = node.type === 'column-1' || node.type === 'column-2' || node.type === 'column-3' || node.type === 'column-4';
  const renderAsColumns = hasColumnChildren(node);

  // Apply animations when node is rendered
  useEffect(() => {
    if (!nodeRef.current || !node.settings?.animation) return;
    
    const animation = node.settings.animation;
    
    // Only apply if animation is enabled and has a type
    if (!animation.type || animation.type === 'none') return;
    
    // Keyframes matching AnimationPanel presets
    const KEYFRAMES = {
      fadeIn:     [{ opacity: 0, transform: 'translateY(0)' },     { opacity: 1, transform: 'translateY(0)' }],
      slideUp:    [{ opacity: 0, transform: 'translateY(30px)' },  { opacity: 1, transform: 'translateY(0)' }],
      slideDown:  [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'translateY(0)' }],
      slideLeft:  [{ opacity: 0, transform: 'translateX(30px)' },  { opacity: 1, transform: 'translateX(0)' }],
      slideRight: [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'translateX(0)' }],
      zoomIn:     [{ opacity: 0, transform: 'scale(0.8)' },        { opacity: 1, transform: 'scale(1)' }],
      zoomOut:    [{ opacity: 0, transform: 'scale(1.2)' },        { opacity: 1, transform: 'scale(1)' }],
      bounce: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-20px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' },
      ],
      rotate: [{ opacity: 0, transform: 'rotate(-180deg)' }, { opacity: 1, transform: 'rotate(0)' }],
      flip:   [{ transform: 'perspective(400px) rotateY(90deg)' }, { transform: 'perspective(400px) rotateY(0)' }],
      pulse:  [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
    };
    
    const keyframes = KEYFRAMES[animation.type];
    if (!keyframes) return;
    
    const duration = animation.duration || 600;
    const delay    = animation.delay    || 0;
    const easing   = animation.easing   || 'ease-out';
    const iterations = animation.iteration === 'infinite' ? Infinity : (animation.iteration || 1);
    
    // Apply animation based on trigger
    const trigger = animation.trigger || 'onLoad';
    
    if (trigger === 'onLoad') {
      // Apply immediately
      const anim = nodeRef.current.animate(keyframes, {
        duration,
        delay,
        easing,
        iterations,
        fill: 'both',
      });
    } else if (trigger === 'onScroll') {
      // Use Intersection Observer for scroll-triggered animations
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.animate(keyframes, {
              duration,
              delay,
              easing,
              iterations,
              fill: 'both',
            });
          }
        });
      }, { threshold: animation.scrollThreshold || 0.2 });
      
      observer.observe(nodeRef.current);
      
      return () => observer.disconnect();
    } else if (trigger === 'onHover' || animation.hover) {
      // Hover animations are handled by CSS or event listeners
      const handleMouseEnterAnim = () => {
        nodeRef.current.animate(keyframes, {
          duration,
          delay: 0,
          easing,
          iterations: 1,
          fill: 'both',
        });
      };
      
      nodeRef.current.addEventListener('mouseenter', handleMouseEnterAnim);
      
      return () => {
        nodeRef.current?.removeEventListener('mouseenter', handleMouseEnterAnim);
      };
    }
  }, [node.settings?.animation, node.id]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsDragOver(false);
    setDropPosition(null);
  }, []);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('node-id',      node.id);
      e.dataTransfer.setData('widget-type',  node.type);
      e.dataTransfer.setData('widget-label', node.label || node.type);
      // Write to module singleton for cross-browser reliability
      dragState.set(node.type, node.label || node.type, node.id);
      if (nodeRef.current) {
        try { e.dataTransfer.setDragImage(nodeRef.current, 16, 16); } catch (_) {}
      }
    } catch (err) {
      console.warn('DragStart failed', err);
    }
  }, [node]);

  const handleDragEnd = useCallback(() => {
    setIsDragOver(false);
    setDropPosition(null);
    dragState.clear();
  }, []);

  const resolveDropParentForWidget = useCallback((dropPos) => {
    if (!isLayoutNode) return { parentId, index: ownIndex };
    if (dropPos === 'inside') {
      if (isWidgetSafeParent) return { parentId: node.id, index: node.children?.length || 0 };
      let target = node;
      let guard = 0;
      while (target && !WIDGET_SAFE_PARENTS.includes(target.type) && guard < 10) {
        guard += 1;
        const firstContainer = target.children?.find(c => c.type === 'container');
        if (firstContainer) { target = firstContainer; continue; }
        const firstSection = target.children?.find(c => c.type === 'section');
        if (firstSection) { target = firstSection; continue; }
        if (target.children && target.children.length > 0 && LAYOUT_TYPES.includes(target.children[0].type)) {
          target = target.children[0];
          continue;
        }
        break;
      }
      if (WIDGET_SAFE_PARENTS.includes(target.type)) {
        return { parentId: target.id, index: target.children?.length || 0 };
      }
      return { parentId: node.id, index: node.children?.length || 0 };
    }
    return { parentId, index: dropPos === 'before' ? ownIndex : ownIndex + 1 };
  }, [isLayoutNode, isWidgetSafeParent, node, parentId, ownIndex]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Read from dragState singleton (works in all browsers during dragover)
    const activeType = dragState.widgetType || e.dataTransfer.types?.includes('widget-type') && 'unknown';
    const activeNodeId = dragState.nodeId;
    if (!activeType && !activeNodeId) return;

    setIsDragOver(true);

    if (level === 0 && onRootDragOverIndex) {
      onRootDragOverIndex(ownIndex);
    }

    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const h = rect.height || 1;
      if (relativeY < h * 0.25) setDropPosition('before');
      else if (relativeY > h * 0.75) setDropPosition('after');
      else setDropPosition('inside');
    }
  }, [level, onRootDragOverIndex, ownIndex]);

  const handleDragLeave = useCallback((e) => {
    if (e && e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prefer dataTransfer (available in drop handler), fall back to dragState
    const widgetType   = e.dataTransfer.getData('widget-type')  || dragState.widgetType  || '';
    const widgetLabel  = e.dataTransfer.getData('widget-label') || dragState.widgetLabel || widgetType;
    const draggedNodeId = e.dataTransfer.getData('node-id')     || dragState.nodeId      || '';

    setIsDragOver(false);
    setDropPosition(null);
    dragState.clear();

    if (!widgetType && !draggedNodeId) return;

    const pos      = dropPosition || 'inside';
    const isLayout = LAYOUT_TYPES.includes(widgetType);

    // ── Reorder existing node ─────────────────────────────────────────────
    if (draggedNodeId && draggedNodeId !== node.id) {
      let targetParentId;
      let targetIndex;

      if (pos === 'inside') {
        if (isWidgetSafeParent) {
          targetParentId = node.id;
          targetIndex    = node.children?.length || 0;
        } else {
          const resolved = resolveDropParentForWidget('inside');
          targetParentId = resolved.parentId;
          targetIndex    = resolved.index;
        }
      } else {
        targetParentId = parentId;
        targetIndex    = pos === 'before' ? ownIndex : ownIndex + 1;
      }

      if (targetParentId) moveNode(draggedNodeId, targetParentId, targetIndex);
      return;
    }

    // ── Drop new widget from sidebar ──────────────────────────────────────
    if (widgetType) {
      // Validation: non-layout widgets can only go into a widget-safe parent
      if (!isLayout && pos === 'inside' && !isWidgetSafeParent) {
        // Engine will auto-resolve — let it handle it silently
      }

      const newNode = {
        id:       `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type:     widgetType,
        label:    widgetLabel,
        content:  '',
        children: [],
        settings: {},
        styles:   {},
        responsive: {},
        metadata: { createdAt: Date.now(), updatedAt: Date.now() },
      };

      let finalParentId;
      let finalIndex;

      if (isLayout) {
        if (pos === 'inside' && node.type === 'page') {
          finalParentId = node.id;
          finalIndex    = node.children?.length || 0;
        } else if (pos === 'inside') {
          finalParentId = parentId || node.id;
          finalIndex    = ownIndex + 1;
        } else {
          finalParentId = parentId;
          finalIndex    = pos === 'before' ? ownIndex : ownIndex + 1;
        }
      } else {
        const resolved = resolveDropParentForWidget(pos);
        finalParentId  = resolved.parentId;
        finalIndex     = resolved.index;
      }

      if (finalParentId) addNode(newNode, finalParentId, finalIndex);
    }
  }, [node, dropPosition, parentId, ownIndex, isWidgetSafeParent, addNode, moveNode, resolveDropParentForWidget]);

  const WidgetComponent = !isLayoutNode ? (widget?.renderer || widget?.component || FallbackRenderer) : null;
  const rendererError = !isLayoutNode && !widget ? `Widget type "${node.type}" is not registered` : null;

  const nodeStyle = {
    ...(node.styles || {}),
    outline: isSelected ? '2px solid #4a7cff' : isHovered ? '1px solid #4a7cff' : 'none',
    outlineOffset: isSelected ? '-2px' : isHovered ? '-1px' : '0',
    transition: 'outline 0.2s, outline-offset 0.2s',
    cursor: 'pointer',
    position: 'relative',
  };

  const dropIndicatorStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '4px',
    background: '#4a7cff',
    zIndex: 1000,
    pointerEvents: 'none',
    borderRadius: 2,
  };

  const beforeDropStyle = { ...dropIndicatorStyle, top: '-2px' };
  const afterDropStyle = { ...dropIndicatorStyle, bottom: '-2px' };
  const insideDropStyle = {
    background: 'rgba(74, 124, 255, 0.06)',
    border: '2px dashed #4a7cff',
  };

  const layoutWrapStyle = isLayoutNode
    ? getLayoutContainerStyle(node.type, isDragOver && dropPosition === 'inside', darkMode)
    : {};

  const draggableAttr = true;

  return (
    <div
      ref={nodeRef}
      className={`canvas-node canvas-node-${node.type}`}
      draggable={draggableAttr}
      style={{
        ...nodeStyle,
        ...layoutWrapStyle,
        ...(isDragOver && dropPosition === 'inside' && !isLayoutNode ? insideDropStyle : {}),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-node-id={node.id}
      data-node-type={node.type}
    >
      {isDragOver && dropPosition === 'before' && <div style={beforeDropStyle} />}
      {isDragOver && dropPosition === 'after' && <div style={afterDropStyle} />}

      {(isSelected || isHovered) && (
        <NodeToolbar node={node} isSelected={isSelected} />
      )}

      {isLayoutNode && (
        <div style={getLayoutLabelStyle(node.type, darkMode)}>
          <span>{node.label || node.type}</span>
        </div>
      )}

      {!isLayoutNode && (
        <WidgetErrorBoundary>
          <WidgetComponent node={node} error={rendererError} onUpdate={() => {}} />
        </WidgetErrorBoundary>
      )}

      {renderAsColumns && node.children && node.children.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -8px', width: '100%' }}>
          {node.children.map((child, idx) => (
            <div key={child.id} style={getColumnWidthStyle(child, node.children.length)}>
              <CanvasNode
                node={child}
                isSelected={child.id === selectedNodeId}
                onSelect={() => selectNode(child.id)}
                level={level + 1}
                parentId={node.id}
                ownIndex={idx}
              />
            </div>
          ))}
        </div>
      ) : (
        node.children && node.children.length > 0 && (
          <div className="node-children" style={{ marginTop: isLayoutNode ? 0 : 16 }}>
            {node.children.map((child, idx) => (
              <CanvasNode
                key={child.id}
                node={child}
                isSelected={child.id === selectedNodeId}
                onSelect={() => selectNode(child.id)}
                level={level + 1}
                parentId={node.id}
                ownIndex={idx}
              />
            ))}
          </div>
        )
      )}

      {isLayoutNode && (!node.children || node.children.length === 0) && (
        <div
          className="empty-container"
          style={{
            minHeight: 100,
            border: isDragOver && dropPosition === 'inside' ? '2px dashed #4a7cff' : `2px dashed ${darkMode ? '#334155' : '#d9d9d9'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragOver && dropPosition === 'inside' ? '#4a7cff' : (darkMode ? '#475569' : '#9ca3af'),
            fontSize: 13,
            background: isDragOver && dropPosition === 'inside' ? 'rgba(74, 124, 255, 0.05)' : (darkMode ? '#0f172a' : '#fafafa'),
            fontWeight: 500,
          }}
        >
          Drop {isWidgetSafeParent ? 'widgets' : 'elements'} here
        </div>
      )}
    </div>
  );
});

export default CanvasNode;
