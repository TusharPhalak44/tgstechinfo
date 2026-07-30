/**
 * Button Renderer Component
 * Frontend renderer for button widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function ButtonRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || {};
  const styles = node.styles || {};

  const buttonStyles = {
    padding: settings.size === 'small' ? '8px 16px' : settings.size === 'large' ? '16px 32px' : '12px 24px',
    backgroundColor: settings.style === 'outline' || settings.style === 'text' ? 'transparent' : (settings.backgroundColor || '#4a7cff'),
    color: settings.textColor || (settings.style === 'outline' ? (darkMode ? '#93c5fd' : '#4a7cff') : '#ffffff'),
    border: settings.style === 'outline' ? `2px solid ${settings.backgroundColor || (darkMode ? '#93c5fd' : '#4a7cff')}` : 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center',
    ...styles,
  };

  const hoverStyles = {
    backgroundColor: settings.style === 'outline' ? (settings.backgroundColor || '#4a7cff') : '',
    color: settings.style === 'outline' ? '#ffffff' : '',
  };

  return (
    <a
      href={content.url || '#'}
      target={settings.target || '_self'}
      rel={settings.target === '_blank' ? 'noopener noreferrer' : undefined}
      style={buttonStyles}
      onMouseEnter={(e) => {
        if (settings.style === 'outline') {
          e.target.style.backgroundColor = settings.backgroundColor || '#4a7cff';
          e.target.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (settings.style === 'outline') {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = settings.textColor || '#ffffff';
        }
      }}
    >
      {content.text || 'Button'}
    </a>
  );
}
