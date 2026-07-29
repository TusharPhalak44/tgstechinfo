/**
 * Blockquote Widget Registration
 */

import BlockquoteWidget from './BlockquoteWidget.jsx';
import BlockquoteRenderer from './BlockquoteRenderer.jsx';
import BlockquoteInspector from './BlockquoteInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function blockquoteToHtml(node) {
  const content = safeParseJsonContent(node.content, {});
  const settings = node.settings || {};
  
  const alignment = settings.alignment || 'left';
  const style = settings.style || 'default';
  
  const borderStyle = style === 'minimal' ? '2px solid #ccc' : '4px solid #4a7cff';
  const padding = style === 'minimal' ? '8px 12px' : '16px 20px';
  const bgColor = style === 'modern' ? '#f5f5f5' : 'transparent';
  
  let html = `<blockquote style="border-left: ${borderStyle}; padding: ${padding}; margin: 20px 0; background-color: ${bgColor}; font-style: italic; text-align: ${alignment};">`;
  html += `<p style="margin: 0; font-size: 1.1em;">${content.text || ''}</p>`;
  
  if (content.citation) {
    html += `<cite style="display: block; margin-top: 8px; font-size: 0.9em; font-style: normal;">${content.citation}</cite>`;
  }
  
  html += '</blockquote>';
  return html;
}

/**
 * Widget Registration
 */
export const blockquoteWidgetRegistration = {
  type: 'blockquote',
  name: 'Blockquote',
  icon: '❝',
  category: 'text',
  component: BlockquoteWidget,
  renderer: BlockquoteRenderer,
  inspector: BlockquoteInspector,
  toHtml: blockquoteToHtml,
  defaultSettings: {
    alignment: 'left',
    style: 'default',
  },
  defaultStyles: {
    fontSize: '16px',
    lineHeight: '1.6',
  },
  metadata: {
    label: 'Blockquote',
    icon: '❝',
    category: 'text',
    description: 'Add a blockquote with citation',
  },
};
