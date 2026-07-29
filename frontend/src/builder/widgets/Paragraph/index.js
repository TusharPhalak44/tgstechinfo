/**
 * Paragraph Widget Registration
 * Complete registration for Paragraph widget
 */

import { ParagraphWidget } from './ParagraphWidget.jsx';
import ParagraphRenderer from './ParagraphRenderer.jsx';
import ParagraphInspector from './ParagraphInspector.jsx';

// Default settings for Paragraph widget
const defaultSettings = {
  alignment: 'left',
};

// Default styles for Paragraph widget
const defaultStyles = {
  color: '#262626',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '1.6',
  letterSpacing: '0',
  margin: '0 0 16px 0',
};

// Validator function
function validateParagraph(node) {
  const errors = [];
  
  if (!node.content || node.content.trim() === '') {
    errors.push('Paragraph content is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Serializer function
function serializeParagraph(node) {
  return {
    ...node,
    content: node.content || '',
    alignment: node.alignment || 'left',
  };
}

// Deserializer function
function deserializeParagraph(data) {
  return {
    ...data,
    alignment: data.alignment || 'left',
  };
}

// HTML generation function
function toHtml(node) {
  const content = node.content || 'Paragraph text goes here...';
  const styles = node.styles || defaultStyles;
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  
  return `<p style="${styleString}">${content}</p>`;
}

// Export registration object
export const paragraphWidgetRegistration = {
  type: 'paragraph',
  name: 'Paragraph',
  icon: '¶',
  category: 'basic',
  defaultSettings,
  defaultStyles,
  component: ParagraphWidget,
  renderer: ParagraphRenderer,
  inspector: ParagraphInspector,
  toolbar: null, // Will use default toolbar
  validator: validateParagraph,
  serializer: serializeParagraph,
  deserializer: deserializeParagraph,
  preview: ParagraphRenderer,
  toHtml,
  version: '1.0.0',
  metadata: {
    description: 'A paragraph element for text content',
    keywords: ['paragraph', 'text', 'content', 'p'],
  },
};

export default paragraphWidgetRegistration;
