/**
 * Image Widget Registration
 * Complete registration for Image widget
 */

import ImageWidget from './ImageWidget.jsx';
import ImageRenderer from './ImageRenderer.jsx';
import ImageInspector from './ImageInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

// Default settings for Image widget
const defaultSettings = {
  size: 'responsive',
  width: 300,
  height: 200,
  objectFit: 'cover',
  openInNewTab: false,
  borderRadius: 0,
};

// Default styles for Image widget
const defaultStyles = {
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
  borderRadius: '0px',
  objectFit: 'cover',
};

// Validator function
function validateImage(node) {
  const errors = [];
  
  if (!node.content) {
    errors.push('Image content is required');
  } else {
    const content = safeParseJsonContent(node.content, { url: '', alt: '', link: '' });
    if (!content.url) {
      errors.push('Image URL is required');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Serializer function
function serializeImage(node) {
  return {
    ...node,
    content: typeof node.content === 'object' ? JSON.stringify(node.content) : node.content,
  };
}

// Deserializer function
function deserializeImage(data) {
  return {
    ...data,
    content: safeParseJsonContent(data.content, { url: '', alt: '', link: '' }),
  };
}

// HTML generation function
function toHtml(node) {
  const content = safeParseJsonContent(node.content, { url: '', alt: '', link: '' });
  const settings = node.settings || defaultSettings;
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  const imgTag = `<img src="${content.url || ''}" alt="${content.alt || ''}" style="${styleString}" />`;
  
  if (content.link) {
    return `<a href="${content.link}" target="${settings.openInNewTab ? '_blank' : '_self'}">${imgTag}</a>`;
  }
  
  return imgTag;
}

// Export registration object
export const imageWidgetRegistration = {
  type: 'image',
  name: 'Image',
  icon: '🖼️',
  category: 'media',
  defaultSettings,
  defaultStyles,
  component: ImageWidget,
  renderer: ImageRenderer,
  inspector: ImageInspector,
  toolbar: null, // Will use default toolbar
  validator: validateImage,
  serializer: serializeImage,
  deserializer: deserializeImage,
  preview: ImageRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'An image with customizable size, styling, and optional link',
    keywords: ['image', 'photo', 'picture', 'media'],
  },
};

export default imageWidgetRegistration;
