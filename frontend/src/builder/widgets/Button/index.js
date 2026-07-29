/**
 * Button Widget Registration
 * Complete registration for Button widget
 */

import ButtonWidget from './ButtonWidget.jsx';
import ButtonRenderer from './ButtonRenderer.jsx';
import ButtonInspector from './ButtonInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

// Default settings for Button widget
const defaultSettings = {
  style: 'primary',
  size: 'medium',
  target: '_self',
  fullWidth: false,
  backgroundColor: '#4a7cff',
  textColor: '#ffffff',
  hoverBackgroundColor: '#3a5fcc',
};

// Default styles for Button widget
const defaultStyles = {
  padding: '12px 24px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center',
};

// Validator function
function validateButton(node) {
  const errors = [];
  
  if (!node.content) {
    errors.push('Button content is required');
  } else {
    const content = safeParseJsonContent(node.content, {});
    if (!content.text) {
      errors.push('Button text is required');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Serializer function
function serializeButton(node) {
  return {
    ...node,
    content: typeof node.content === 'object' ? JSON.stringify(node.content) : node.content,
  };
}

// Deserializer function
function deserializeButton(data) {
  return {
    ...data,
    content: safeParseJsonContent(data.content, {}),
  };
}

// HTML generation function
function toHtml(node) {
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || defaultSettings;
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  return `<a href="${content.url || '#'}" target="${settings.target || '_self'}" style="${styleString}">${content.text || 'Button'}</a>`;
}

// Export registration object
export const buttonWidgetRegistration = {
  type: 'button',
  name: 'Button',
  icon: '🔘',
  category: 'basic',
  defaultSettings,
  defaultStyles,
  component: ButtonWidget,
  renderer: ButtonRenderer,
  inspector: ButtonInspector,
  toolbar: null, // Will use default toolbar
  validator: validateButton,
  serializer: serializeButton,
  deserializer: deserializeButton,
  preview: ButtonRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'A clickable button with customizable styles and links',
    keywords: ['button', 'link', 'cta', 'action'],
  },
};

export default buttonWidgetRegistration;
