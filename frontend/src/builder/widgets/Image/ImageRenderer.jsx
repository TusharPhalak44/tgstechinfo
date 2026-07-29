/**
 * Image Renderer Component
 * Canvas + frontend renderer for the image widget.
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function ImageRenderer({ node }) {
  // Handle malformed data where URL is stored as a key instead of value
  let content = safeParseJsonContent(node.content, { url: '', alt: '', link: '', caption: '' });
  
  // Migration: if URL is stored as key (e.g., {"https://...":"","alt":"","link":""})
  // extract the URL from the keys
  if (!content.url && typeof node.content === 'string') {
    try {
      const parsed = JSON.parse(node.content);
      const keys = Object.keys(parsed);
      // Check if first key looks like a URL
      if (keys.length > 0 && (keys[0].startsWith('http://') || keys[0].startsWith('https://'))) {
        content = {
          url: keys[0],
          alt: parsed.alt || '',
          link: parsed.link || '',
          caption: parsed.caption || ''
        };
      }
    } catch (e) {
      // Keep default content if parsing fails
    }
  }
  
  const settings = node.settings || {};
  const styles = node.styles || {};

  // If no URL yet, show a placeholder so the widget is visible in the canvas
  if (!content.url) {
    return (
      <div style={{
        width: '100%', minHeight: 120, background: '#f5f5f5',
        border: '2px dashed #d9d9d9', borderRadius: 8,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: '#bfbfbf', fontSize: 13,
        padding: 16,
      }}>
        <span style={{ fontSize: 32, marginBottom: 8 }}>🖼️</span>
        <span>No image selected</span>
        <span style={{ fontSize: 11, marginTop: 4 }}>Click to set image URL or pick from Media Library</span>
      </div>
    );
  }

  const imgStyle = {
    maxWidth: settings.size === 'full' ? '100%' : settings.size === 'custom' ? `${settings.width || 300}px` : '100%',
    height: settings.size === 'custom' ? `${settings.height || 200}px` : 'auto',
    display: 'block',
    borderRadius: styles.borderRadius || 0,
    objectFit: settings.objectFit || 'cover',
    ...styles,
  };

  const imgEl = (
    <img
      src={content.url}
      alt={content.alt || ''}
      title={content.alt || undefined}
      style={imgStyle}
      loading={settings.lazyLoad !== false ? 'lazy' : 'eager'}
      onError={e => {
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3EImage not found%3C/text%3E%3C/svg%3E';
      }}
    />
  );

  const wrapped = content.link ? (
    <a
      href={content.link}
      target={settings.openInNewTab ? '_blank' : '_self'}
      rel={settings.openInNewTab ? 'noopener noreferrer' : undefined}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {imgEl}
    </a>
  ) : imgEl;

  if (!content.caption) return wrapped;

  return (
    <figure style={{ margin: 0, padding: 0 }}>
      {wrapped}
      <figcaption style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>
        {content.caption}
      </figcaption>
    </figure>
  );
}
