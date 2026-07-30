/**
 * HTML Renderer Component
 * Frontend renderer for HTML widget
 */

import React, { useEffect, useRef } from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function HTMLRenderer({ node }) {
  const { darkMode } = useTheme();
  const containerRef = useRef(null);
  const content = safeParseJsonContent(node.content, { html: '', css: '', js: '' });
  const settings = node.settings || {};
  const styles = node.styles || {};

  useEffect(() => {
    if (containerRef.current) {
      // Inject HTML
      if (content.html) {
        containerRef.current.innerHTML = content.html;
      }

      // Inject CSS
      if (content.css) {
        const styleId = `html-widget-css-${node.id}`;
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = content.css;
      }

      // Inject JavaScript
      if (content.js) {
        try {
          // eslint-disable-next-line no-new-func
          new Function(content.js)();
        } catch (error) {
          console.error('HTML Widget JavaScript error:', error);
        }
      }
    }

    return () => {
      // Cleanup CSS
      const styleId = `html-widget-css-${node.id}`;
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [content, node.id]);

  const containerStyles = {
    color: darkMode ? '#cbd5e1' : undefined,
    ...styles,
  };

  return (
    <div
      ref={containerRef}
      style={containerStyles}
      data-html-widget-id={node.id}
    />
  );
}
