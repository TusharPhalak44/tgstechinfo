import React from 'react';
import { PlusOutlined, MinusOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

export default function GlobeControls({
  onZoomIn = () => {},
  onZoomOut = () => {},
  onReset = () => {},
  isAutoRotating = true,
  onToggleAutoRotate = () => {},
  pointerMode = 'ALL',
  onChangePointerMode = () => {},
  darkMode = true
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 15,
        userSelect: 'none'
      }}
    >
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        aria-label="Zoom In"
        title="Zoom In (+)"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: darkMode ? 'rgba(8, 17, 34, 0.88)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: darkMode ? '1px solid rgba(30, 58, 102, 0.7)' : '1px solid rgba(226, 232, 240, 0.9)',
          color: darkMode ? '#F1F5F9' : '#0B1F4D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        <PlusOutlined style={{ fontSize: 13 }} />
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        aria-label="Zoom Out"
        title="Zoom Out (-)"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: darkMode ? 'rgba(8, 17, 34, 0.88)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: darkMode ? '1px solid rgba(30, 58, 102, 0.7)' : '1px solid rgba(226, 232, 240, 0.9)',
          color: darkMode ? '#F1F5F9' : '#0B1F4D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        <MinusOutlined style={{ fontSize: 13 }} />
      </button>

      {/* Auto-Rotate Toggle */}
      <button
        onClick={onToggleAutoRotate}
        aria-label="Toggle Auto Rotation"
        title={isAutoRotating ? 'Pause Rotation' : 'Start Auto-Rotation'}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: isAutoRotating ? 'rgba(10, 174, 239, 0.25)' : (darkMode ? 'rgba(8, 17, 34, 0.88)' : 'rgba(255, 255, 255, 0.95)'),
          backdropFilter: 'blur(10px)',
          border: isAutoRotating ? '1px solid rgba(10, 174, 239, 0.6)' : (darkMode ? '1px solid rgba(30, 58, 102, 0.7)' : '1px solid rgba(226, 232, 240, 0.9)'),
          color: isAutoRotating ? '#0AAEEF' : (darkMode ? '#94A3B8' : '#64748B'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        {isAutoRotating ? <PauseCircleOutlined style={{ fontSize: 14 }} /> : <PlayCircleOutlined style={{ fontSize: 14 }} />}
      </button>

      {/* Reset Globe View */}
      <button
        onClick={onReset}
        aria-label="Reset View"
        title="Reset Globe View"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: darkMode ? 'rgba(8, 17, 34, 0.88)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: darkMode ? '1px solid rgba(30, 58, 102, 0.7)' : '1px solid rgba(226, 232, 240, 0.9)',
          color: darkMode ? '#F1F5F9' : '#0B1F4D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        <ReloadOutlined style={{ fontSize: 13 }} />
      </button>
    </div>
  );
}
