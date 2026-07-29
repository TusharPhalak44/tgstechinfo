/**
 * PDF Widget Registration
 */

import PDFWidget from './PDFWidget.jsx';
import PDFRenderer from './PDFRenderer.jsx';
import PDFInspector from './PDFInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function pdfToHtml(node) {
  const content = safeParseJsonContent(node.content, { url: '', fileName: '' });
  const settings = node.settings || {};
  
  const url = content.url || '';
  const width = settings.width === 'custom' ? `${settings.customWidth || 800}px` : settings.width || '100%';
  const height = settings.height || 600;
  const showDownload = settings.showDownload !== false;
  const downloadText = settings.downloadText || 'Download PDF';
  
  let html = `<iframe src="${url}" style="width: ${width}; height: ${height}px; border: none;"></iframe>`;
  
  if (showDownload && url) {
    html += `<div style="margin-top: 12px; text-align: center;">
      <a href="${url}" download style="display: inline-block; padding: 8px 16px; background-color: #4a7cff; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px;">${downloadText}</a>
    </div>`;
  }
  
  return html;
}

/**
 * Widget Registration
 */
export const pdfWidgetRegistration = {
  type: 'pdf',
  name: 'PDF',
  icon: '📄',
  category: 'media',
  component: PDFWidget,
  renderer: PDFRenderer,
  inspector: PDFInspector,
  toHtml: pdfToHtml,
  defaultSettings: {
    width: '100%',
    height: 600,
    showDownload: true,
    downloadText: 'Download PDF',
  },
  defaultStyles: {},
  metadata: {
    label: 'PDF',
    icon: '📄',
    category: 'media',
    description: 'Embed a PDF document',
  },
};
