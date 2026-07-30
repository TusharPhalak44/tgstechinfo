/**
 * DraggableWidget Component
 * Draggable widget item for the sidebar.
 * Writes drag payload to both dataTransfer AND the dragState singleton
 * so that dragover handlers can read the type in all browsers.
 */

import React, { useState } from 'react';
import { Tooltip } from 'antd';
import dragState from '../utils/dragState';

export default function DraggableWidget({ type, label, icon, hint, disabled, darkMode = false }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    if (disabled) { e.preventDefault(); return; }

    setIsDragging(true);

    // Write to dataTransfer (works in Chrome/Edge at drop time)
    e.dataTransfer.setData('widget-type',  type);
    e.dataTransfer.setData('widget-label', label);
    e.dataTransfer.effectAllowed = 'copy';

    // Also write to module singleton (works in Firefox/Safari during dragover)
    dragState.set(type, label, null);

    // Custom drag image
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; top:-1000px; left:-1000px;
      padding:6px 14px; background:#4a7cff; color:#fff;
      border-radius:6px; font-size:12px; font-weight:600;
      display:flex; align-items:center; gap:6px;
      box-shadow:0 2px 8px rgba(0,0,0,0.2); pointer-events:none;
    `;
    el.innerHTML = `<span style="font-size:16px">${icon}</span><span>${label}</span>`;
    document.body.appendChild(el);
    e.dataTransfer.setDragImage(el, 60, 18);
    setTimeout(() => document.body.removeChild(el), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragState.clear();
  };

  const item = (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 4px',
        borderRadius: 8,
        border: `1px solid ${isDragging ? '#4a7cff' : (darkMode ? '#334155' : '#e8e8e8')}`,
        cursor: disabled ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
        background: isDragging ? (darkMode ? '#1e3a5f' : '#e8f0ff') : (darkMode ? '#0f172a' : '#fff'),
        fontSize: 12,
        textAlign: 'center',
        gap: 4,
        opacity: disabled ? 0.45 : 1,
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
        minHeight: 64,
      }}
      onMouseEnter={e => {
        if (!disabled && !isDragging) {
          e.currentTarget.style.borderColor = '#4a7cff';
          e.currentTarget.style.background  = darkMode ? '#1e293b' : '#f0f4ff';
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e8e8e8';
          e.currentTarget.style.background  = darkMode ? '#0f172a' : '#fff';
        }
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#595959', fontWeight: 500, lineHeight: 1.2 }}>{label}</span>
    </div>
  );

  if (hint) {
    return <Tooltip title={hint} placement="right">{item}</Tooltip>;
  }
  return item;
}
