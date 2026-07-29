/**
 * Form Widget Registration
 */

import FormWidget from './FormWidget.jsx';
import FormRenderer from './FormRenderer.jsx';
import FormInspector from './FormInspector.jsx';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

/**
 * HTML Generator
 */
function formToHtml(node) {
  const content = safeParseJsonContent(node.content, { fields: [], formName: 'Contact Form', submitText: 'Submit', successMessage: 'Thank you for your submission!' });
  const settings = node.settings || {};
  
  const fields = content.fields || [];
  const formName = content.formName || 'Contact Form';
  const submitText = content.submitText || 'Submit';
  
  let html = `<form style="padding: 24px; background: #fafafa; border-radius: 8px;">
    <h3 style="margin-bottom: 24px; margin-top: 0;">${formName}</h3>`;
  
  fields.forEach(field => {
    html += `<div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500;">${field.label}${field.required ? ' *' : ''}</label>`;
    
    switch (field.type) {
      case 'textarea':
        html += `<textarea name="${field.id}" placeholder="${field.placeholder}" style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;" ${field.required ? 'required' : ''}></textarea>`;
        break;
      case 'select':
        html += `<select name="${field.id}" style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;" ${field.required ? 'required' : ''}>`;
        field.options?.forEach(option => {
          html += `<option value="${option}">${option}</option>`;
        });
        html += '</select>';
        break;
      default:
        html += `<input type="${field.type}" name="${field.id}" placeholder="${field.placeholder}" style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;" ${field.required ? 'required' : ''} />`;
    }
    
    html += '</div>';
  });
  
  html += `<button type="submit" style="width: 100%; padding: 12px; background: #4a7cff; color: white; border: none; border-radius: 4px; cursor: pointer;">${submitText}</button>
  </form>`;
  
  return html;
}

/**
 * Widget Registration
 */
export const formWidgetRegistration = {
  type: 'form',
  name: 'Form',
  icon: '📋',
  category: 'forms',
  component: FormWidget,
  renderer: FormRenderer,
  inspector: FormInspector,
  toHtml: formToHtml,
  defaultSettings: {
    layout: 'vertical',
    buttonSize: 'default',
  },
  defaultStyles: {},
  metadata: {
    label: 'Form',
    icon: '📋',
    category: 'forms',
    description: 'Create a custom form with various field types',
  },
};
