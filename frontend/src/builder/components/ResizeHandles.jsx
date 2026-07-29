/**
 * ResizeHandles Component
 * Visual resize handles for Width, Height, Padding, Margin with live preview
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export default function ResizeHandles({ node, onUpdate, isSelected }) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  const styles = node.styles || {};

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeType(type);
    setStartPos({ x: e.clientX, y: e.clientY });
    
    const rect = containerRef.current?.getBoundingClientRect();
    setStartSize({
      width: rect?.width || 0,
      height: rect?.height || 0,
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    const updatedStyles = { ...styles };

    switch (resizeType) {
      case 'width-right':
        if (styles.width === 'custom' || !styles.width) {
          updatedStyles.customWidth = Math.max(50, (startSize.width + deltaX) / (window.devicePixelRatio || 1));
        }
        break;
      case 'width-left':
        if (styles.width === 'custom' || !styles.width) {
          updatedStyles.customWidth = Math.max(50, (startSize.width - deltaX) / (window.devicePixelRatio || 1));
        }
        break;
      case 'height-bottom':
        if (styles.height === 'custom' || !styles.height) {
          updatedStyles.customHeight = Math.max(50, (startSize.height + deltaY) / (window.devicePixelRatio || 1));
        }
        break;
      case 'height-top':
        if (styles.height === 'custom' || !styles.height) {
          updatedStyles.customHeight = Math.max(50, (startSize.height - deltaY) / (window.devicePixelRatio || 1));
        }
        break;
      case 'padding-right':
        updatedStyles.paddingRight = Math.max(0, (styles.paddingRight || 0) + deltaX);
        break;
      case 'padding-left':
        updatedStyles.paddingLeft = Math.max(0, (styles.paddingLeft || 0) - deltaX);
        break;
      case 'padding-bottom':
        updatedStyles.paddingBottom = Math.max(0, (styles.paddingBottom || 0) + deltaY);
        break;
      case 'padding-top':
        updatedStyles.paddingTop = Math.max(0, (styles.paddingTop || 0) - deltaY);
        break;
      case 'margin-right':
        updatedStyles.marginRight = Math.max(0, (styles.marginRight || 0) + deltaX);
        break;
      case 'margin-left':
        updatedStyles.marginLeft = Math.max(0, (styles.marginLeft || 0) - deltaX);
        break;
      case 'margin-bottom':
        updatedStyles.marginBottom = Math.max(0, (styles.marginBottom || 0) + deltaY);
        break;
      case 'margin-top':
        updatedStyles.marginTop = Math.max(0, (styles.marginTop || 0) - deltaY);
        break;
    }

    onUpdate({ styles: updatedStyles });
  }, [isResizing, resizeType, startPos, startSize, styles, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeType(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isSelected) return null;

  const handleStyle = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    backgroundColor: '#1890ff',
    border: '2px solid #fff',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'transform 0.1s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };

  const handleStyleHover = {
    ...handleStyle,
    transform: 'scale(1.5)',
    backgroundColor: '#40a9ff',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Width handles */}
      <div
        style={{ ...handleStyle, right: '-4px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'width-right')}
        title="Resize width"
      />
      <div
        style={{ ...handleStyle, left: '-4px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'width-left')}
        title="Resize width"
      />

      {/* Height handles */}
      <div
        style={{ ...handleStyle, bottom: '-4px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'height-bottom')}
        title="Resize height"
      />
      <div
        style={{ ...handleStyle, top: '-4px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'height-top')}
        title="Resize height"
      />

      {/* Corner handles (both width and height) */}
      <div
        style={{ ...handleStyle, top: '-4px', right: '-4px', cursor: 'nwse-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'height-top')}
        title="Resize"
      />
      <div
        style={{ ...handleStyle, top: '-4px', left: '-4px', cursor: 'nesw-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'height-top')}
        title="Resize"
      />
      <div
        style={{ ...handleStyle, bottom: '-4px', right: '-4px', cursor: 'nesw-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'height-bottom')}
        title="Resize"
      />
      <div
        style={{ ...handleStyle, bottom: '-4px', left: '-4px', cursor: 'nwse-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'height-bottom')}
        title="Resize"
      />

      {/* Padding handles (inner) */}
      <div
        style={{ ...handleStyle, right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', backgroundColor: '#52c41a', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'padding-right')}
        title="Adjust padding right"
      />
      <div
        style={{ ...handleStyle, left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', backgroundColor: '#52c41a', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'padding-left')}
        title="Adjust padding left"
      />
      <div
        style={{ ...handleStyle, bottom: '8px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize', backgroundColor: '#52c41a', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'padding-bottom')}
        title="Adjust padding bottom"
      />
      <div
        style={{ ...handleStyle, top: '8px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize', backgroundColor: '#52c41a', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'padding-top')}
        title="Adjust padding top"
      />

      {/* Margin handles (outer) */}
      <div
        style={{ ...handleStyle, right: '-12px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', backgroundColor: '#fa8c16', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'margin-right')}
        title="Adjust margin right"
      />
      <div
        style={{ ...handleStyle, left: '-12px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize', backgroundColor: '#fa8c16', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'margin-left')}
        title="Adjust margin left"
      />
      <div
        style={{ ...handleStyle, bottom: '-12px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize', backgroundColor: '#fa8c16', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'margin-bottom')}
        title="Adjust margin bottom"
      />
      <div
        style={{ ...handleStyle, top: '-12px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize', backgroundColor: '#fa8c16', opacity: 0.7 }}
        onMouseDown={(e) => handleMouseDown(e, 'margin-top')}
        title="Adjust margin top"
      />

      {/* Size tooltip */}
      {isResizing && (
        <div
          style={{
            position: 'fixed',
            top: startPos.y - 40,
            left: startPos.x,
            backgroundColor: '#262626',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1001,
            pointerEvents: 'none',
          }}
        >
          {resizeType}: {Math.round(startSize.width)}px × {Math.round(startSize.height)}px
        </div>
      )}
    </div>
  );
}
