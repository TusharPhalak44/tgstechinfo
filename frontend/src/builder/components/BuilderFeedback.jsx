/**
 * BuilderFeedback Component
 * Provides visual feedback for selection, hover, drop, resize, and loading states
 */

import React, { useState, useEffect } from 'react';
import { Spin, notification } from 'antd';

export default function BuilderFeedback({ children, node, isSelected, isHovered, isDragging, isLoading }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const wrapperStyle = {
    position: 'relative',
    outline: isSelected ? '2px solid #1890ff' : 'none',
    outlineOffset: isSelected ? '2px' : '0',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    cursor: isHovered ? 'pointer' : 'default',
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : (isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'),
    transform: isDragging ? 'scale(1.02)' : (isHovered ? 'scale(1.01)' : 'scale(1)'),
    opacity: isDragging ? 0.8 : 1,
    background: isLoading ? 'rgba(255,255,255,0.8)' : 'transparent',
  };

  const hoverIndicatorStyle = {
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    border: '2px dashed #40a9ff',
    borderRadius: '4px',
    pointerEvents: 'none',
    opacity: isHovered && !isSelected ? 1 : 0,
    transition: 'opacity 0.2s',
  };

  const selectionIndicatorStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '24px',
    height: '24px',
    backgroundColor: '#1890ff',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 100,
  };

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Hover indicator */}
      <div style={hoverIndicatorStyle} />
      
      {/* Selection indicator badge */}
      {isSelected && (
        <div style={selectionIndicatorStyle}>
          ✓
        </div>
      )}
      
      {/* Loading skeleton */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '4px',
          zIndex: 50,
        }}>
          <Spin size="small" />
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && node && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#262626',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          {node.label || node.type}
        </div>
      )}
      
      {children}
    </div>
  );
}

/**
 * Toast notification helper
 */
export function showToast(type, message, description = null, duration = 3) {
  notification[type]({
    message,
    description,
    duration,
    placement: 'bottomRight',
  });
}

/**
 * Loading skeleton component
 */
export function LoadingSkeleton({ height = 100, width = '100%' }) {
  return (
    <div style={{
      height,
      width,
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite',
      }} />
      <style jsx>{`
        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Drop zone indicator
 */
export function DropZone({ isOver, children }) {
  return (
    <div style={{
      border: isOver ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
      borderRadius: '8px',
      padding: '24px',
      backgroundColor: isOver ? '#f0f7ff' : '#fafafa',
      transition: 'all 0.2s',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}
