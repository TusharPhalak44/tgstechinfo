/**
 * Split Section Renderer Component
 * Frontend renderer for split section widget
 */

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

export default function SplitSectionRenderer({ node, children }) {
  const { darkMode } = useTheme();
  const settings = node.settings || {};
  const styles = node.styles || {};

  const layout = settings.layout || '50-50';
  const gap = settings.gap || 20;
  const verticalAlign = settings.verticalAlign || 'top';
  const reverseMobile = settings.reverseMobile || false;
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

  const containerStyles = {
    display: 'flex',
    gap: `${gap}px`,
    backgroundColor: backgroundColor === 'transparent' ? (darkMode ? '#1e293b' : 'transparent') : backgroundColor,
    padding: `${padding}px`,
    alignItems: verticalAlign === 'stretch' ? 'stretch' : verticalAlign,
    color: darkMode ? '#cbd5e1' : undefined,
    ...styles,
  };

  const leftColumnStyles = {
    flex: `0 0 ${leftWidth}%`,
    minWidth: 0,
  };

  const rightColumnStyles = {
    flex: `0 0 ${rightWidth}%`,
    minWidth: 0,
  };

  const leftChildren = children?.filter(child => child.props?.position === 'left');
  const rightChildren = children?.filter(child => child.props?.position === 'right');

  return (
    <div style={containerStyles}>
      <div style={leftColumnStyles}>
        {leftChildren}
      </div>
      <div style={rightColumnStyles}>
        {rightChildren}
      </div>
    </div>
  );
}
