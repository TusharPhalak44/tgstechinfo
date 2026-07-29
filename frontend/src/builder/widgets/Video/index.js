/**
 * Video Widget Registration
 */

import VideoWidget from './VideoWidget.jsx';
import VideoRenderer from './VideoRenderer.jsx';
import VideoInspector from './VideoInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function videoToHtml(node) {
  const content = safeParseJsonContent(node.content, { source: 'youtube', url: '' });
  const settings = node.settings || {};
  
  const source = content.source || 'youtube';
  const url = content.url || '';
  const width = settings.width === 'custom' ? `${settings.customWidth || 640}px` : settings.width || '100%';
  const aspectRatio = settings.aspectRatio || '16:9';
  
  const paddingBottom = {
    '16:9': '56.25%',
    '4:3': '75%',
    '1:1': '100%',
    '9:16': '177.78%',
  }[aspectRatio] || '56.25%';
  
  let html = `<div style="width: ${width}; position: relative; padding-bottom: ${paddingBottom}; height: 0; overflow: hidden;">`;
  
  if (source === 'youtube') {
    const getYouTubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    const videoId = getYouTubeId(url);
    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${settings.autoplay ? 1 : 0}&mute=${settings.mute ? 1 : 0}&controls=${settings.controls !== false ? 1 : 0}&loop=${settings.loop ? 1 : 0}&rel=0`;
      html += `<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="${embedUrl}" allowfullscreen></iframe>`;
    }
  } else if (source === 'vimeo') {
    const getVimeoId = (url) => {
      const regExp = /vimeo\.com\/(\d+)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    };
    const videoId = getVimeoId(url);
    if (videoId) {
      const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${settings.autoplay ? 1 : 0}&muted=${settings.mute ? 1 : 0}&controls=${settings.controls !== false ? 1 : 0}&loop=${settings.loop ? 1 : 0}`;
      html += `<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="${embedUrl}" allowfullscreen></iframe>`;
    }
  } else if (source === 'direct') {
    html += `<video style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" controls="${settings.controls !== false}" autoplay="${settings.autoplay}" muted="${settings.mute}" loop="${settings.loop}"><source src="${url}" type="video/mp4"></video>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Widget Registration
 */
export const videoWidgetRegistration = {
  type: 'video',
  name: 'Video',
  icon: '▶',
  category: 'media',
  component: VideoWidget,
  renderer: VideoRenderer,
  inspector: VideoInspector,
  toHtml: videoToHtml,
  defaultSettings: {
    source: 'youtube',
    width: '100%',
    aspectRatio: '16:9',
    autoplay: false,
    mute: false,
    controls: true,
    loop: false,
  },
  defaultStyles: {
    width: '100%',
  },
  metadata: {
    label: 'Video',
    icon: '▶',
    category: 'media',
    description: 'Add a video from YouTube, Vimeo, or direct URL',
  },
};
