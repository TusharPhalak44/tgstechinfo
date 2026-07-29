/**
 * Code Block Widget Registration
 */

import CodeBlockWidget from './CodeBlockWidget.jsx';
import CodeBlockRenderer from './CodeBlockRenderer.jsx';
import CodeBlockInspector from './CodeBlockInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function codeBlockToHtml(node) {
  const content = safeParseJsonContent(node.content, { code: '', language: 'javascript' });
  const settings = node.settings || {};
  
  const language = settings.language || 'javascript';
  const theme = settings.theme || 'dark';
  const showLineNumbers = settings.showLineNumbers !== false;
  
  const bgColor = theme === 'dark' ? '#1e1e1e' : '#f5f5f5';
  const textColor = theme === 'dark' ? '#d4d4d4' : '#333333';
  
  let html = `<div style="background-color: ${bgColor}; color: ${textColor}; padding: 16px 20px; border-radius: 8px; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.6; overflow: auto;">`;
  
  if (showLineNumbers) {
    html += `<div style="display: flex; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid ${theme === 'dark' ? '#333' : '#ddd'}; font-size: 12px; color: ${theme === 'dark' ? '#888' : '#666'};">`;
    html += `<span style="font-weight: 600; margin-right: 8px;">${language}</span></div>`;
  }
  
  html += '<pre style="margin: 0; font-family: inherit;">';
  
  if (showLineNumbers) {
    const lines = (content.code || '').split('\n');
    lines.forEach((line, index) => {
      html += `<div style="display: flex;"><span style="color: ${theme === 'dark' ? '#666' : '#999'}; margin-right: 16px; min-width: 24px; text-align: right;">${index + 1}</span><span>${line || ' '}</span></div>`;
    });
  } else {
    html += content.code || '';
  }
  
  html += '</pre></div>';
  return html;
}

/**
 * Widget Registration
 */
export const codeBlockWidgetRegistration = {
  type: 'code_block',
  name: 'Code Block',
  icon: '</>',
  category: 'text',
  component: CodeBlockWidget,
  renderer: CodeBlockRenderer,
  inspector: CodeBlockInspector,
  toHtml: codeBlockToHtml,
  defaultSettings: {
    language: 'javascript',
    theme: 'dark',
    showLineNumbers: true,
  },
  defaultStyles: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  metadata: {
    label: 'Code Block',
    icon: '</>',
    category: 'text',
    description: 'Add a code block with syntax highlighting',
  },
};
