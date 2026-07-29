/**
 * Table Widget Registration
 */

import TableWidget from './TableWidget.jsx';
import TableRenderer from './TableRenderer.jsx';
import TableInspector from './TableInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function tableToHtml(node) {
  const content = safeParseJsonContent(node.content, { data: [['Header 1', 'Header 2', 'Header 3'], ['Cell 1', 'Cell 2', 'Cell 3']] });
  const settings = node.settings || {};
  
  const tableData = content.data || [];
  const style = settings.style || 'default';
  const hasHeader = settings.hasHeader !== false;
  
  let html = '<table style="border-collapse: collapse; width: 100%;">';
  
  tableData.forEach((row, rowIndex) => {
    const isHeader = hasHeader && rowIndex === 0;
    const rowBg = style === 'striped' && rowIndex % 2 === 1 && !isHeader ? '#fafafa' : 'transparent';
    
    html += `<tr style="background-color: ${rowBg};">`;
    
    row.forEach((cell, colIndex) => {
      const cellStyle = style === 'bordered' ? 'border: 1px solid #e8e8e8;' : 'border: none;';
      const padding = `padding: ${settings.cellPadding || 12}px 16px;`;
      const headerStyle = isHeader ? 'background-color: #f5f5f5; font-weight: 600;' : '';
      
      const Tag = isHeader ? 'th' : 'td';
      html += `<${Tag} style="${cellStyle} ${padding} ${headerStyle}">${cell}</${Tag}>`;
    });
    
    html += '</tr>';
  });
  
  html += '</table>';
  return html;
}

/**
 * Widget Registration
 */
export const tableWidgetRegistration = {
  type: 'table',
  name: 'Table',
  icon: '▦',
  category: 'content',
  component: TableWidget,
  renderer: TableRenderer,
  inspector: TableInspector,
  toHtml: tableToHtml,
  defaultSettings: {
    style: 'default',
    hasHeader: true,
    borderWidth: 1,
    cellPadding: 12,
  },
  defaultStyles: {
    width: '100%',
  },
  metadata: {
    label: 'Table',
    icon: '▦',
    category: 'content',
    description: 'Add a table with rows and columns',
  },
};
