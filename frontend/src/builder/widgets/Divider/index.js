/**
 * Divider Widget Registration
 * Complete registration for Divider widget
 */

import DividerWidget from './DividerWidget.jsx';
import DividerRenderer from './DividerRenderer.jsx';
import DividerInspector from './DividerInspector.jsx';

// Default settings for Divider widget
const defaultSettings = {
  style: 'solid',
  thickness: 1,
  color: '#e8e8e8',
};

// Default styles for Divider widget
const defaultStyles = {
  border: 'none',
  borderTop: '1px solid #e8e8e8',
  margin: '20px 0',
  width: '100%',
};

// Validator function
function validateDivider(node) {
  return {
    valid: true,
    errors: [],
  };
}

// Serializer function
function serializeDivider(node) {
  return node;
}

// Deserializer function
function deserializeDivider(data) {
  return data;
}

// HTML generation function
function toHtml(node) {
  const settings = node.settings || defaultSettings;
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  return `<hr style="${styleString}" />`;
}

// Export registration object
export const dividerWidgetRegistration = {
  type: 'divider',
  name: 'Divider',
  icon: '➖',
  category: 'basic',
  defaultSettings,
  defaultStyles,
  component: DividerWidget,
  renderer: DividerRenderer,
  inspector: DividerInspector,
  toolbar: null, // Will use default toolbar
  validator: validateDivider,
  serializer: serializeDivider,
  deserializer: deserializeDivider,
  preview: DividerRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'A horizontal divider line with customizable style and spacing',
    keywords: ['divider', 'separator', 'line', 'hr'],
  },
};

export default dividerWidgetRegistration;
