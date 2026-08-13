/**
 * Button Renderer Component
 * Frontend renderer for button widget
 */

import React, { useState } from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function ButtonRenderer({ node }) {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || {};
  const styles = node.styles || {};

  const getBackgroundColor = () => {
    if (settings.style === 'outline' || settings.style === 'text') {
      return isHovered ? (settings.backgroundColor || '#4a7cff') : 'transparent';
    }
    return isHovered 
      ? (settings.hoverBackgroundColor || '#3a5fcc') 
      : (settings.backgroundColor || '#4a7cff');
  };

  const getTextColor = () => {
    if (settings.style === 'outline' || settings.style === 'text') {
      return isHovered ? '#ffffff' : (settings.textColor || (darkMode ? '#93c5fd' : '#4a7cff'));
    }
    return settings.textColor || '#ffffff';
  };

  const buttonStyles = {
    padding: settings.size === 'small' ? '8px 16px' : settings.size === 'large' ? '16px 32px' : '12px 24px',
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    border: settings.style === 'outline' ? `2px solid ${settings.backgroundColor || (darkMode ? '#93c5fd' : '#4a7cff')}` : 'none',
    borderRadius: styles.borderRadius || '4px',
    cursor: 'pointer',
    fontWeight: styles.fontWeight || '500',
    fontSize: styles.fontSize || '14px',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: settings.fullWidth ? 'block' : 'inline-block',
    width: settings.fullWidth ? '100%' : 'auto',
    textAlign: 'center',
    ...styles,
  };

  return (
    <a
      href={content.url || '#'}
      target={settings.target || '_self'}
      rel={settings.target === '_blank' ? 'noopener noreferrer' : undefined}
      style={buttonStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content.text || 'Button'}
    </a>
  );
}
