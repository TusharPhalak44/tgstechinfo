/**
 * Spacer Widget Registration
 * Complete registration for Spacer widget
 */

import SpacerWidget from './SpacerWidget.jsx';
import SpacerRenderer from './SpacerRenderer.jsx';
import SpacerInspector from './SpacerInspector.jsx';

// Default settings for Spacer widget
const defaultSettings = {
  height: 20,
  width: '100%',
  customWidth: 100,
};

// Default styles for Spacer widget
const defaultStyles = {
  height: '20px',
  width: '100%',
  display: 'block',
};

// Validator function
function validateSpacer(node) {
  return {
    valid: true,
    errors: [],
  };
}

// Serializer function
function serializeSpacer(node) {
  return node;
}

// Deserializer function
function deserializeSpacer(data) {
  return data;
}

// HTML generation function
function toHtml(node) {
  const settings = node.settings || defaultSettings;
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  return `<div style="${styleString}"></div>`;
}

// Export registration object
export const spacerWidgetRegistration = {
  type: 'spacer',
  name: 'Spacer',
  icon: '↕️',
  category: 'basic',
  defaultSettings,
  defaultStyles,
  component: SpacerWidget,
  renderer: SpacerRenderer,
  inspector: SpacerInspector,
  toolbar: null, // Will use default toolbar
  validator: validateSpacer,
  serializer: serializeSpacer,
  deserializer: deserializeSpacer,
  preview: SpacerRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'A spacer element for adding vertical or horizontal space between elements',
    keywords: ['spacer', 'space', 'gap', 'margin', 'padding'],
  },
};

export default spacerWidgetRegistration;
