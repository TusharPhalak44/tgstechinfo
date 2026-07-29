/**
 * HTML Widget Registration
 */

import HTMLWidget from './HTMLWidget.jsx';
import HTMLRenderer from './HTMLRenderer.jsx';
import HTMLInspector from './HTMLInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function htmlToHtml(node) {
  const content = safeParseJsonContent(node.content, { html: '', css: '', js: '' });
  
  let html = '';
  
  if (content.css) {
    html += `<style>${content.css}</style>`;
  }
  
  if (content.html) {
    html += content.html;
  }
  
  if (content.js) {
    html += `<script>${content.js}<\/script>`;
  }
  
  return html;
}

/**
 * Widget Registration
 */
export const htmlWidgetRegistration = {
  type: 'html',
  name: 'HTML',
  icon: '</>',
  category: 'advanced',
  component: HTMLWidget,
  renderer: HTMLRenderer,
  inspector: HTMLInspector,
  toHtml: htmlToHtml,
  defaultSettings: {
    enableJS: true,
  },
  defaultStyles: {},
  metadata: {
    label: 'HTML',
    icon: '</>',
    category: 'advanced',
    description: 'Add custom HTML, CSS, and JavaScript',
  },
};
