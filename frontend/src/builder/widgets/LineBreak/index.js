/**
 * Line Break Widget Registration
 * Complete registration for Line Break widget
 */

import LineBreakWidget from './LineBreakWidget.jsx';
import LineBreakRenderer from './LineBreakRenderer.jsx';
import LineBreakInspector from './LineBreakInspector.jsx';

// Default settings for Line Break widget
const defaultSettings = {};

// Default styles for Line Break widget
const defaultStyles = {
  display: 'block',
  height: '1em',
};

// Validator function
function validateLineBreak(node) {
  return {
    valid: true,
    errors: [],
  };
}

// Serializer function
function serializeLineBreak(node) {
  return node;
}

// Deserializer function
function deserializeLineBreak(data) {
  return data;
}

// HTML generation function
function toHtml(node) {
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  return `<br style="${styleString}" />`;
}

// Export registration object
export const lineBreakWidgetRegistration = {
  type: 'linebreak',
  name: 'Line Break',
  icon: '⏎',
  category: 'basic',
  defaultSettings,
  defaultStyles,
  component: LineBreakWidget,
  renderer: LineBreakRenderer,
  inspector: LineBreakInspector,
  toolbar: null, // Will use default toolbar
  validator: validateLineBreak,
  serializer: serializeLineBreak,
  deserializer: deserializeLineBreak,
  preview: LineBreakRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'A line break element for adding single line breaks between content',
    keywords: ['line break', 'br', 'newline', 'break'],
  },
};

export default lineBreakWidgetRegistration;
