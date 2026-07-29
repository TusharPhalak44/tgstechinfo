/**
 * Bullet List Widget Registration
 */

import BulletListWidget from './BulletListWidget.jsx';
import BulletListRenderer from './BulletListRenderer.jsx';
import BulletListInspector from './BulletListInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function bulletListToHtml(node) {
  const content = safeParseJsonContent(node.content, { items: ['List item 1', 'List item 2'] });
  const settings = node.settings || {};
  
  const items = content.items || [];
  const listStyle = settings.style || 'disc';
  
  let html = `<ul style="padding-left: 20px; margin: 16px 0; list-style-type: ${listStyle};">`;
  items.forEach(item => {
    html += `<li style="margin-bottom: 8px;">${item}</li>`;
  });
  html += '</ul>';
  return html;
}

/**
 * Widget Registration
 */
export const bulletListWidgetRegistration = {
  type: 'bullet_list',
  name: 'Bullet List',
  icon: '•',
  category: 'text',
  component: BulletListWidget,
  renderer: BulletListRenderer,
  inspector: BulletListInspector,
  toHtml: bulletListToHtml,
  defaultSettings: {
    style: 'disc',
  },
  defaultStyles: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  metadata: {
    label: 'Bullet List',
    icon: '•',
    category: 'text',
    description: 'Add a bulleted list',
  },
};
