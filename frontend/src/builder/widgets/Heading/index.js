/**
 * Heading Widget Registration
 * Complete registration for Heading widget
 */

import { HeadingWidget } from './HeadingWidget.jsx';
import HeadingRenderer from './HeadingRenderer.jsx';
import HeadingInspector from './HeadingInspector.jsx';

// Default settings for Heading widget
const defaultSettings = {
  headingLevel: 'h2',
  alignment: 'left',
};

// Default styles for Heading widget
const defaultStyles = {
  color: '#262626',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.2',
  margin: '0 0 16px 0',
};

// Validator function
function validateHeading(node) {
  const errors = [];
  
  if (!node.content || node.content.trim() === '') {
    errors.push('Heading content is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Serializer function
function serializeHeading(node) {
  return {
    ...node,
    content: node.content || '',
    headingLevel: node.headingLevel || 'h2',
    alignment: node.alignment || 'left',
  };
}

// Deserializer function
function deserializeHeading(data) {
  return {
    ...data,
    headingLevel: data.headingLevel || 'h2',
    alignment: data.alignment || 'left',
  };
}

// HTML generation function
function toHtml(node) {
  const headingLevel = node.headingLevel || 'h2';
  const content = node.content || 'Heading';
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  return `<${headingLevel} style="${styleString}">${content}</${headingLevel}>`;
}

// Export registration object
export const headingWidgetRegistration = {
  type: 'heading',
  name: 'Heading',
  icon: 'H',
  category: 'basic',
  defaultSettings,
  defaultStyles,
  component: HeadingWidget,
  renderer: HeadingRenderer,
  inspector: HeadingInspector,
  toolbar: null, // Will use default toolbar
  validator: validateHeading,
  serializer: serializeHeading,
  deserializer: deserializeHeading,
  preview: HeadingRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'A heading element for titles and subtitles',
    keywords: ['heading', 'title', 'h1', 'h2', 'h3', 'header'],
  },
};

export default headingWidgetRegistration;
