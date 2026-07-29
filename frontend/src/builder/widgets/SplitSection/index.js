/**
 * Split Section Widget Registration
 */

import SplitSectionWidget from './SplitSectionWidget.jsx';
import SplitSectionRenderer from './SplitSectionRenderer.jsx';
import SplitSectionInspector from './SplitSectionInspector.jsx';

/**
 * HTML Generator
 */
function splitSectionToHtml(node) {
  const settings = node.settings || {};
  
  const layout = settings.layout || '50-50';
  const gap = settings.gap || 20;
  const verticalAlign = settings.verticalAlign || 'top';
  const backgroundColor = settings.backgroundColor || 'transparent';
  const padding = settings.padding || 40;
  
  const getColumns = () => {
    if (layout === 'custom') {
      return [settings.customLeftWidth || 50, settings.customRightWidth || 50];
    }
    const [left, right] = layout.split('-').map(Number);
    return [left, right];
  };
  
  const [leftWidth, rightWidth] = getColumns();
  
  return `<div style="display: flex; gap: ${gap}px; background-color: ${backgroundColor}; padding: ${padding}px; align-items: ${verticalAlign};">
    <div style="flex: 0 0 ${leftWidth}%; min-width: 0;">
      <!-- Left column content -->
    </div>
    <div style="flex: 0 0 ${rightWidth}%; min-width: 0;">
      <!-- Right column content -->
    </div>
  </div>`;
}

/**
 * Widget Registration
 */
export const splitSectionWidgetRegistration = {
  type: 'split_section',
  name: 'Split Section',
  icon: '⬌',
  category: 'layout',
  component: SplitSectionWidget,
  renderer: SplitSectionRenderer,
  inspector: SplitSectionInspector,
  toHtml: splitSectionToHtml,
  defaultSettings: {
    layout: '50-50',
    gap: 20,
    verticalAlign: 'top',
    reverseMobile: false,
    backgroundColor: 'transparent',
    padding: 40,
  },
  defaultStyles: {
    width: '100%',
  },
  metadata: {
    label: 'Split Section',
    icon: '⬌',
    category: 'layout',
    description: 'Create a two-column split section',
  },
};
