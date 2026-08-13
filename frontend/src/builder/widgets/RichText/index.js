/**
 * Rich Text Widget Registration
 */

import RichTextWidget from './RichTextWidget.jsx';
import RichTextRenderer from './RichTextRenderer.jsx';
import RichTextInspector from './RichTextInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function richTextToHtml(node) {
  const content = safeParseJsonContent(node.content, { html: '' });
  return content.html || '';
}

/**
 * Widget Registration
 * Note: Using RichTextWidget as renderer so WYSIWYG editor shows in canvas.
 * RichTextRenderer is only used for final output/preview.
 */
export const richTextWidgetRegistration = {
  type: 'rich_text',
  name: 'Rich Text',
  icon: '📝',
  category: 'text',
  component: RichTextWidget,
  renderer: RichTextWidget, // Use Widget in canvas for editing
  inspector: RichTextInspector,
  toHtml: richTextToHtml,
  defaultSettings: {},
  defaultStyles: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  metadata: {
    label: 'Rich Text',
    icon: '📝',
    category: 'text',
    description: 'Add rich text with full formatting options',
  },
};
