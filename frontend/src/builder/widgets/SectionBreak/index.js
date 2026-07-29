/**
 * Section Break Widget Registration
 */

import SectionBreakWidget from './SectionBreakWidget.jsx';
import SectionBreakRenderer from './SectionBreakRenderer.jsx';
import SectionBreakInspector from './SectionBreakInspector.jsx';

/**
 * HTML Generator
 */
function sectionBreakToHtml(node) {
  const settings = node.settings || {};
  
  const style = settings.style || 'line';
  const thickness = settings.thickness || 1;
  const color = settings.color || '#e8e8e8';
  const width = settings.width === 'custom' ? `${settings.customWidth || 200}px` : settings.width || '100%';
  const alignment = settings.alignment || 'center';
  const spacingAbove = settings.spacingAbove || 20;
  const spacingBelow = settings.spacingBelow || 20;
  
  const borderStyles = {
    line: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    space: 'none',
  };
  
  const justifyContent = alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center';
  
  if (style === 'space') {
    return `<div style="height: ${spacingAbove + spacingBelow}px;"></div>`;
  }
  
  return `<div style="display: flex; justify-content: ${justifyContent}; margin-top: ${spacingAbove}px; margin-bottom: ${spacingBelow}px;">
    <div style="width: ${width}; border-top: ${thickness}px ${borderStyles[style]} ${color};"></div>
  </div>`;
}

/**
 * Widget Registration
 */
export const sectionBreakWidgetRegistration = {
  type: 'section_break',
  name: 'Section Break',
  icon: '—',
  category: 'layout',
  component: SectionBreakWidget,
  renderer: SectionBreakRenderer,
  inspector: SectionBreakInspector,
  toHtml: sectionBreakToHtml,
  defaultSettings: {
    style: 'line',
    thickness: 1,
    color: '#e8e8e8',
    width: '100%',
    alignment: 'center',
    spacingAbove: 20,
    spacingBelow: 20,
  },
  defaultStyles: {},
  metadata: {
    label: 'Section Break',
    icon: '—',
    category: 'layout',
    description: 'Add a visual section break or divider',
  },
};
