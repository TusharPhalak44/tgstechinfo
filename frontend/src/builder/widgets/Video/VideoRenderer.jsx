/**
 * Video Renderer Component
 * Frontend renderer for video widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function VideoRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, { source: 'youtube', url: '' });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const source = content.source || 'youtube';
  const url = content.url || '';

  const width = settings.width === 'custom' ? `${settings.customWidth || 640}px` : settings.width || '100%';
  const aspectRatio = settings.aspectRatio || '16:9';

  // Spread user styles FIRST so the aspect-ratio trick (height:0, paddingBottom) always wins
  const containerStyles = {
    ...styles,
    width: width,
    position: 'relative',
    paddingBottom: getPaddingBottom(aspectRatio),
    height: 0,
    overflow: 'hidden',
  };

  const iframeStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    // Accept plain 11-char video IDs directly
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getVimeoId = (url) => {
    if (!url) return null;
    if (/^\d+$/.test(url.trim())) return url.trim();
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Empty state — no URL set yet
  if (!url) {
    return (
      <div style={{
        width: width,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkMode ? '#1e293b' : '#f8fafc',
        border: `2px dashed ${darkMode ? '#334155' : '#cbd5e1'}`,
        borderRadius: 8,
        gap: 8,
        padding: 20,
      }}>
        <span style={{ fontSize: 36 }}>🎬</span>
        <span style={{ fontSize: 13, color: darkMode ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
          No video selected
        </span>
        <span style={{ fontSize: 11, color: darkMode ? '#475569' : '#cbd5e1' }}>
          Click to set a video URL in the Properties panel
        </span>
      </div>
    );
  }

  const renderYouTube = () => {
    const videoId = getYouTubeId(url);
    if (!videoId) {
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#475569' : '#999', fontSize: 13, padding: 16, textAlign: 'center' }}>
          Invalid YouTube URL — paste a full YouTube link or video ID
        </div>
      );
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${settings.autoplay ? 1 : 0}&mute=${settings.mute ? 1 : 0}&controls=${settings.controls !== false ? 1 : 0}&loop=${settings.loop ? 1 : 0}&rel=0`;
    return (
      <iframe
        style={iframeStyles}
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    );
  };

  const renderVimeo = () => {
    const videoId = getVimeoId(url);
    if (!videoId) {
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#475569' : '#999', fontSize: 13, padding: 16, textAlign: 'center' }}>
          Invalid Vimeo URL — paste a full Vimeo link or video ID
        </div>
      );
    }
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${settings.autoplay ? 1 : 0}&muted=${settings.mute ? 1 : 0}&controls=${settings.controls !== false ? 1 : 0}&loop=${settings.loop ? 1 : 0}`;
    return (
      <iframe
        style={iframeStyles}
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo video"
      />
    );
  };

  const renderDirect = () => (
    <video
      style={iframeStyles}
      controls={settings.controls !== false}
      autoPlay={settings.autoplay}
      muted={settings.mute}
      loop={settings.loop}
    >
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );

  return (
    <div style={containerStyles}>
      {source === 'youtube' && renderYouTube()}
      {source === 'vimeo' && renderVimeo()}
      {source === 'direct' && renderDirect()}
    </div>
  );
}

function getPaddingBottom(aspectRatio) {
  const ratios = {
    '16:9': '56.25%',
    '4:3': '75%',
    '1:1': '100%',
    '9:16': '177.78%',
  };
  return ratios[aspectRatio] || '56.25%';
}
