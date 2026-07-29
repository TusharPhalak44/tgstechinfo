/**
 * Numbered List Widget Registration
 */

import NumberedListWidget from './NumberedListWidget.jsx';
import NumberedListRenderer from './NumberedListRenderer.jsx';
import NumberedListInspector from './NumberedListInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function numberedListToHtml(node) {
  const content = safeParseJsonContent(node.content, { items: ['First item', 'Second item'] });
  const settings = node.settings || {};
  
  const items = content.items || [];
  const listStyle = settings.style || 'decimal';
  const start = settings.start || 1;
  
  let html = `<ol style="padding-left: 20px; margin: 16px 0; list-style-type: ${listStyle};" start="${start}">`;
  items.forEach(item => {
    html += `<li style="margin-bottom: 8px;">${item}</li>`;
  });
  html += '</ol>';
  return html;
}

/**
 * Widget Registration
 */
export const numberedListWidgetRegistration = {
  type: 'numbered_list',
  name: 'Numbered List',
  icon: '1.',
  category: 'text',
  component: NumberedListWidget,
  renderer: NumberedListRenderer,
  inspector: NumberedListInspector,
  toHtml: numberedListToHtml,
  defaultSettings: {
    style: 'decimal',
    start: 1,
  },
  defaultStyles: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  metadata: {
    label: 'Numbered List',
    icon: '1.',
    category: 'text',
    description: 'Add a numbered list',
  },
};
