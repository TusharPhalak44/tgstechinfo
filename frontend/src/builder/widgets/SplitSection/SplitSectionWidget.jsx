/**
 * Split Section Widget Component
 * Builder component for split section (two-column layout) - shows visual preview
 */

import React from 'react';
import { LayoutOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function SplitSectionWidget({ node }) {
  const settings = node.settings || {};
  
  const layout = settings.layout || '50-50';
  const gap = settings.gap || 20;
  const backgroundColor = settings.backgroundColor || 'transparent';
  const padding = settings.padding || 40;

  const getColumns = () => {
    if (layout === 'custom') {
      return [settings.customLeftWidth || 50, settings.customRightWidth || 50];
    }
    const [left, right] = layout.split('-').map(Number);
    return [left, right];
  };

  const [leftWidth, rightWidth] = getColumns();

  return (
    <div style={{ padding: 16, minHeight: 200 }}>
      {/* Visual preview of the split section */}
      <div style={{
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        padding: padding / 2, // Scale down for preview
        background: backgroundColor === 'transparent' ? '#fafafa' : backgroundColor,
        minHeight: 160,
      }}>
        <div style={{
          display: 'flex',
          gap: `${gap / 2}px`, // Scale down for preview
          height: '100%',
          minHeight: 140,
        }}>
          {/* Left Column Preview */}
          <div style={{
            flex: `0 0 ${leftWidth}%`,
            border: '2px dashed #4a7cff',
            borderRadius: 6,
            padding: 16,
            background: 'rgba(74, 124, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <LayoutOutlined style={{ fontSize: 32, color: '#4a7cff', marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: '#4a7cff', fontWeight: 600 }}>Left Column</div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{leftWidth}%</div>
            <div style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              fontSize: 10,
              color: '#999',
              textAlign: 'center',
            }}>
              Drop widgets here
            </div>
          </div>

          {/* Right Column Preview */}
          <div style={{
            flex: `0 0 ${rightWidth}%`,
            border: '2px dashed #52c41a',
            borderRadius: 6,
            padding: 16,
            background: 'rgba(82, 196, 26, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <LayoutOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: '#52c41a', fontWeight: 600 }}>Right Column</div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{rightWidth}%</div>
            <div style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              fontSize: 10,
              color: '#999',
              textAlign: 'center',
            }}>
              Drop widgets here
            </div>
          </div>
        </div>

        {/* Layout info badge */}
        <div style={{
          marginTop: 12,
          textAlign: 'center',
          fontSize: 11,
          color: '#666',
          background: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          display: 'inline-block',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          Layout: {layout} • Gap: {gap}px
        </div>
      </div>

      {/* Instruction */}
      <div style={{
        marginTop: 12,
        padding: 12,
        background: '#f0f5ff',
        border: '1px solid #d6e4ff',
        borderRadius: 6,
        fontSize: 12,
        color: '#0958d9',
      }}>
        <strong>Tip:</strong> Configure column widths, gap, and styling in the inspector panel. Drop widgets into left or right columns.
      </div>
    </div>
  );
}
