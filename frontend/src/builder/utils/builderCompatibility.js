/**
 * Builder Compatibility Wrapper
 * Bridges existing DragDropBuilder with new architecture
 * Ensures existing functionality continues working while using new backend
 */

import { convertLegacyContentElements, convertToLegacyContentElements } from './compatibility';
import builderEngine from '../core/BuilderEngine';
import builderSerializer from '../core/BuilderSerializer';

/**
 * Compatibility wrapper for content elements
 * Converts between legacy format and new BuilderNode format
 */
export class ContentElementsCompat {
  /**
   * Convert legacy content elements to builder nodes
   * @param {Array} legacyElements - Legacy content elements
   * @returns {Array} Builder nodes
   */
  static toBuilderNodes(legacyElements) {
    return convertLegacyContentElements(legacyElements);
  }

  /**
   * Convert builder nodes to legacy content elements
   * @param {Array} builderNodes - Builder nodes
   * @returns {Array} Legacy content elements
   */
  static toLegacyElements(builderNodes) {
    return convertToLegacyContentElements(builderNodes);
  }

  /**
   * Update content element in legacy format
   * @param {Array} elements - Current elements
   * @param {string} id - Element ID
   * @param {Object} updates - Updates to apply
   * @returns {Array} Updated elements
   */
  static updateElement(elements, id, updates) {
    return elements.map(el => {
      if (el.id === id) {
        return { ...el, ...updates };
      }
      return el;
    });
  }

  /**
   * Add content element in legacy format
   * @param {Array} elements - Current elements
   * @param {Object} newElement - New element to add
   * @returns {Array} Updated elements
   */
  static addElement(elements, newElement) {
    return [...elements, newElement];
  }

  /**
   * Remove content element in legacy format
   * @param {Array} elements - Current elements
   * @param {string} id - Element ID to remove
   * @returns {Array} Updated elements
   */
  static removeElement(elements, id) {
    return elements.filter(el => el.id !== id);
  }

  /**
   * Reorder content elements in legacy format
   * @param {Array} elements - Current elements
   * @param {number} fromIndex - Source index
   * @param {number} toIndex - Target index
   * @returns {Array} Updated elements
   */
  static reorderElements(elements, fromIndex, toIndex) {
    const newElements = [...elements];
    const [removed] = newElements.splice(fromIndex, 1);
    newElements.splice(toIndex, 0, removed);
    return newElements;
  }
}

/**
 * Compatibility wrapper for layout sections
 * Handles layout section operations in legacy format
 */
export class LayoutSectionsCompat {
  /**
   * Add layout section
   * @param {Array} sections - Current sections
   * @param {string} type - Section type
   * @returns {Array} Updated sections
   */
  static addSection(sections, type) {
    return [...sections, { id: `sec-${Date.now()}`, type }];
  }

  /**
   * Remove layout section
   * @param {Array} sections - Current sections
   * @param {string} id - Section ID to remove
   * @returns {Array} Updated sections
   */
  static removeSection(sections, id) {
    return sections.filter(s => s.id !== id);
  }

  /**
   * Reorder layout sections
   * @param {Array} sections - Current sections
   * @param {number} fromIndex - Source index
   * @param {number} toIndex - Target index
   * @returns {Array} Updated sections
   */
  static reorderSections(sections, fromIndex, toIndex) {
    const newSections = [...sections];
    const [removed] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, removed);
    return newSections;
  }

  /**
   * Update layout section
   * @param {Array} sections - Current sections
   * @param {string} id - Section ID
   * @param {Object} updates - Updates to apply
   * @returns {Array} Updated sections
   */
  static updateSection(sections, id, updates) {
    return sections.map(s => {
      if (s.id === id) {
        return { ...s, ...updates };
      }
      return s;
    });
  }
}

/**
 * Compatibility wrapper for HTML generation
 * Generates HTML from legacy content elements using new architecture
 */
export class HtmlGenerationCompat {
  /**
   * Generate HTML from content elements
   * @param {Array} elements - Content elements
   * @returns {string} HTML string
   */
  static generateHtml(elements) {
    if (!Array.isArray(elements) || elements.length === 0) {
      return '';
    }

    return elements.map(element => {
      switch (element.type) {
        case 'heading':
          const headingLevel = element.headingLevel || 'h2';
          const headingAlign = element.alignment || 'left';
          return `<${headingLevel} style="text-align: ${headingAlign};">${element.content}</${headingLevel}>`;
        
        case 'paragraph':
          let paragraphContent = element.content;
          const paragraphAlign = element.alignment || 'left';
          
          // Convert markdown-like syntax to HTML
          paragraphContent = paragraphContent.replace(/^• (.+)$/gm, '<li>$1</li>');
          paragraphContent = paragraphContent.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
          
          // Wrap consecutive list items
          paragraphContent = paragraphContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            const hasNumbers = match.match(/^\d+\./);
            const tag = hasNumbers ? 'ol' : 'ul';
            return `<${tag}>${match}</${tag}>`;
          });
          
          // Handle table rows
          const tableRows = paragraphContent.match(/^\| .+$/gm);
          if (tableRows && tableRows.length > 0) {
            const tableHtml = tableRows.map(row => {
              const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
              return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
            }).join('');
            return `<table>${tableHtml}</table>`;
          }
          
          // Handle section breaks
          const sections = paragraphContent.split(/\n\n+/);
          return sections.map(section => `<p style="text-align: ${paragraphAlign};">${section.trim()}</p>`).join('\n');
        
        case 'bullet_list':
          const bulletItems = element.content.split('\n').filter(Boolean);
          return `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
        
        case 'numbered_list':
          const numberedItems = element.content.split('\n').filter(Boolean);
          return `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
        
        case 'line_break':
          return '<br>';
        
        case 'image':
          return `<img src="${element.content}" alt="Image" />`;
        
        case 'divider':
          return '<hr>';
        
        case 'blockquote':
          return `<blockquote>${element.content}</blockquote>`;
        
        case 'code_block':
          return `<pre><code>${element.content}</code></pre>`;
        
        case 'table':
          try {
            const tableData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
            if (tableData && tableData.data && Array.isArray(tableData.data)) {
              const tableHtml = tableData.data.map(row => {
                return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
              }).join('');
              return `<table>${tableHtml}</table>`;
            }
          } catch (e) {
            console.error('Error parsing table data:', e);
          }
          return '';
        
        case 'section_break':
          return '<br><br>';
        
        case 'bullet_item':
          return `<ul><li>${element.content}</li></ul>`;
        
        case 'numbered_item':
          return `<ol><li>${element.content}</li></ol>`;
        
        case 'table_row':
          const cells = element.content.split('|').map(cell => cell.trim()).filter(Boolean);
          return `<table><tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr></table>`;
        
        case 'split_section':
          try {
            const splitData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
            if (splitData && splitData.sections && Array.isArray(splitData.sections)) {
              let html = '<div style="display: flex; gap: 20px; margin: 20px 0; align-items: center; flex-wrap: wrap;">';
              
              splitData.sections.forEach(section => {
                const layoutClass = section.layout || 'image-left';
                const sectionAlign = section.alignment || 'left';
                
                if (layoutClass === 'image-left' || layoutClass === 'image-right') {
                  html += '<div style="flex: 1; min-width: 200px; display: flex; gap: 20px; align-items: center;">';
                  if (section.image) {
                    html += `<div style="flex: 1;"><img src="${section.image}" alt="Section image" style="width: 100%; max-height: 300px; object-fit: contain;" /></div>`;
                  }
                  if (section.text) {
                    html += `<div style="flex: 1; text-align: ${sectionAlign};">${section.text}</div>`;
                  }
                  html += '</div>';
                } else if (layoutClass === 'text-only' && section.text) {
                  html += `<div style="flex: 1; min-width: 200px; text-align: ${sectionAlign};">${section.text}</div>`;
                } else if (layoutClass === 'image-only' && section.image) {
                  html += `<div style="flex: 1; min-width: 200px;"><img src="${section.image}" alt="Section image" style="width: 100%; max-height: 300px; object-fit: contain;" /></div>`;
                }
              });
              
              html += '</div>';
              return html;
            }
          } catch (e) {
            console.error('Error parsing split section:', e);
          }
          return '';
        
        case 'button':
          try {
            const buttonData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
            if (buttonData) {
              const actionAttr = buttonData.actionType === 'download' 
                ? `download href="${buttonData.url}"` 
                : `href="${buttonData.url}" target="_blank"`;
              
              return `<a ${actionAttr} style="
                display: inline-block;
                height: ${buttonData.height || '40px'};
                width: ${buttonData.width || 'auto'};
                background-color: ${buttonData.backgroundColor || '#4a7cff'};
                color: ${buttonData.textColor || '#ffffff'};
                border-radius: ${buttonData.borderRadius || '8px'};
                text-decoration: none;
                padding: 0 20px;
                line-height: ${buttonData.height || '40px'};
                text-align: center;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              ">${buttonData.text || 'Click Me'}</a>`;
            }
          } catch (e) {
            console.error('Error parsing button:', e);
          }
          return '';
        
        default:
          return '';
      }
    }).join('\n');
  }
}

/**
 * Main compatibility wrapper
 * Provides unified interface for legacy DragDropBuilder to use new architecture
 */
export class BuilderCompatWrapper {
  /**
   * Initialize builder with legacy data
   * @param {Object} legacyData - Legacy data from database
   */
  static initialize(legacyData) {
    builderEngine.loadPage(legacyData);
  }

  /**
   * Get current content elements in legacy format
   * @returns {Array} Legacy content elements
   */
  static getContentElements() {
    const page = builderEngine.getPage();
    if (!page || !page.root) return [];

    // Find content section
    const contentSection = this.findContentSection(page.root);
    if (!contentSection || !contentSection.children) return [];

    return ContentElementsCompat.toLegacyElements(contentSection.children);
  }

  /**
   * Update content elements
   * @param {Array} elements - New content elements in legacy format
   */
  static setContentElements(elements) {
    const page = builderEngine.getPage();
    if (!page || !page.root) return;

    const contentSection = this.findContentSection(page.root);
    if (contentSection) {
      contentSection.children = ContentElementsCompat.toBuilderNodes(elements);
    }
  }

  /**
   * Get current layout sections in legacy format
   * @returns {Array} Legacy layout sections
   */
  static getLayoutSections() {
    const page = builderEngine.getPage();
    if (!page || !page.root) return [];

    return page.root.children
      .filter(child => this.isLayoutSection(child.type))
      .map(child => ({ id: child.id, type: child.type }));
  }

  /**
   * Update layout sections
   * @param {Array} sections - New layout sections in legacy format
   */
  static setLayoutSections(sections) {
    const page = builderEngine.getPage();
    if (!page || !page.root) return;

    // Update layout sections while preserving content section
    const contentSection = this.findContentSection(page.root);
    const layoutSections = sections.map(section => ({
      id: section.id,
      type: section.type,
      children: [],
      settings: {},
      styles: {},
      responsive: {},
      metadata: {},
    }));

    if (contentSection) {
      page.root.children = [...layoutSections, contentSection];
    } else {
      page.root.children = layoutSections;
    }
  }

  /**
   * Serialize to legacy format for database
   * @returns {Object} Legacy format data
   */
  static serializeToLegacy() {
    const page = builderEngine.getPage();
    if (!page) return null;

    return builderSerializer.serializeToLegacy(page);
  }

  /**
   * Find content section in tree
   * @param {Object} node - Root node
   * @returns {Object|null} Content section
   */
  static findContentSection(node) {
    if (!node || !node.children) return null;

    const contentSection = node.children.find(child => child.type === 'content');
    if (contentSection) return contentSection;

    for (const child of node.children) {
      const found = this.findContentSection(child);
      if (found) return found;
    }

    return null;
  }

  /**
   * Check if node type is a layout section
   * @param {string} type - Node type
   * @returns {boolean}
   */
  static isLayoutSection(type) {
    const layoutTypes = [
      'content_type_category',
      'title_description',
      'banner_image',
      'pdf_attachment',
      'tags',
      'schedule',
      'seo',
    ];
    return layoutTypes.includes(type);
  }
}
