/**
 * Builder Serializer
 * Converts BuilderNode tree to database-compatible JSON format
 * Handles backward compatibility with existing data
 */

import { NodeType } from '../utils/types';

class BuilderSerializer {
  /**
   * Serialize a builder page to database format
   * @param {Object} page - Builder page with root node
   * @returns {Object} Serialized data for database
   */
  serializePage(page) {
    if (!page || !page.root) {
      return {
        version: '2.0',
        layout: null,
        metadata: {},
      };
    }

    return {
      version: '2.0',
      layout: this.serializeNode(page.root),
      metadata: page.metadata || {},
    };
  }

  /**
   * Serialize a single node
   * @param {Object} node - Builder node
   * @returns {Object} Serialized node
   */
  serializeNode(node) {
    if (!node) return null;

    return {
      id: node.id,
      type: node.type,
      parentId: node.parentId,
      content: node.content,
      settings: node.settings,
      styles: node.styles,
      responsive: node.responsive,
      metadata: node.metadata,
      // Serialize children recursively
      children: node.children ? this.serializeChildren(node.children) : [],
    };
  }

  /**
   * Serialize an array of nodes
   * @param {Array} nodes - Array of builder nodes
   * @returns {Array} Serialized nodes
   */
  serializeChildren(nodes) {
    if (!Array.isArray(nodes)) return [];
    return nodes.map(node => this.serializeNode(node)).filter(Boolean);
  }

  /**
   * Serialize to legacy format for backward compatibility
   * @param {Object} page - Builder page
   * @returns {Object} Legacy format data
   */
  serializeToLegacy(page) {
    if (!page || !page.root) {
      return {
        builder_layout: [],
        builder_content_elements: [],
        content: '',
      };
    }

    // Extract layout sections from root
    const layout = this.extractLayoutSections(page.root);
    
    // Extract content elements
    const contentElements = this.extractContentElements(page.root);
    
    // Generate HTML from content elements
    const content = this.generateHtmlFromElements(contentElements);

    return {
      builder_layout: JSON.stringify(layout),
      builder_content_elements: JSON.stringify(contentElements),
      content,
    };
  }

  /**
   * Extract layout sections from node tree
   * @param {Object} node - Root node
   * @returns {Array} Layout sections
   */
  extractLayoutSections(node) {
    if (!node || !node.children) return [];

    return node.children
      .filter(child => this.isLayoutSection(child.type))
      .map(child => ({
        id: child.id,
        type: child.type,
      }));
  }

  /**
   * Extract content elements from node tree
   * @param {Object} node - Root node
   * @returns {Array} Content elements
   */
  extractContentElements(node) {
    if (!node || !node.children) return [];

    const contentSection = node.children.find(child => child.type === NodeType.CONTENT);
    
    if (!contentSection || !contentSection.children) {
      return [];
    }

    return contentSection.children.map(child => this.serializeContentElement(child));
  }

  /**
   * Serialize a content element to legacy format
   * @param {Object} node - Content element node
   * @returns {Object} Legacy content element
   */
  serializeContentElement(node) {
    return {
      id: node.id,
      type: node.type,
      label: this.getElementLabel(node.type),
      content: node.content,
      headingLevel: node.headingLevel,
      alignment: node.alignment,
      tag: node.tag,
    };
  }

  /**
   * Check if a node type is a layout section
   * @param {string} type - Node type
   * @returns {boolean}
   */
  isLayoutSection(type) {
    return [
      NodeType.CONTENT_TYPE_CATEGORY,
      NodeType.TITLE_DESCRIPTION,
      NodeType.BANNER_IMAGE,
      NodeType.PDF_ATTACHMENT,
      NodeType.CONTENT,
      NodeType.TAGS,
      NodeType.SCHEDULE,
      NodeType.SEO,
    ].includes(type);
  }

  /**
   * Get element label for legacy format
   * @param {string} type - Element type
   * @returns {string} Label
   */
  getElementLabel(type) {
    const labels = {
      [NodeType.HEADING]: 'Heading',
      [NodeType.PARAGRAPH]: 'Paragraph',
      [NodeType.IMAGE]: 'Image',
      [NodeType.BUTTON]: 'Button',
      [NodeType.TABLE]: 'Table',
      [NodeType.DIVIDER]: 'Divider',
      [NodeType.BULLET_LIST]: 'Bullet List',
      [NodeType.NUMBERED_LIST]: 'Numbered List',
      [NodeType.BLOCKQUOTE]: 'Blockquote',
      [NodeType.CODE_BLOCK]: 'Code Block',
      [NodeType.LINE_BREAK]: 'Line Break',
      [NodeType.SECTION_BREAK]: 'Section Break',
      [NodeType.SPLIT_SECTION]: 'Split Section',
    };
    return labels[type] || type;
  }

  /**
   * Generate HTML from content elements (legacy compatibility)
   * @param {Array} elements - Content elements
   * @returns {string} HTML string
   */
  generateHtmlFromElements(elements) {
    if (!Array.isArray(elements)) return '';

    return elements.map(element => {
      switch (element.type) {
        case NodeType.HEADING:
          const level = element.headingLevel || 'h2';
          return `<${level} style="text-align: ${element.alignment || 'left'};">${element.content}</${level}>`;
        case NodeType.PARAGRAPH:
          return `<p style="text-align: ${element.alignment || 'left'};">${element.content}</p>`;
        case NodeType.BULLET_LIST:
          const bulletItems = element.content.split('\n').filter(Boolean);
          return `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
        case NodeType.NUMBERED_LIST:
          const numberedItems = element.content.split('\n').filter(Boolean);
          return `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
        case NodeType.IMAGE:
          return `<img src="${element.content}" alt="Image" />`;
        case NodeType.DIVIDER:
          return '<hr>';
        case NodeType.BLOCKQUOTE:
          return `<blockquote>${element.content}</blockquote>`;
        case NodeType.CODE_BLOCK:
          return `<pre><code>${element.content}</code></pre>`;
        case NodeType.LINE_BREAK:
          return '<br>';
        case NodeType.SECTION_BREAK:
          return '<br><br>';
        default:
          return '';
      }
    }).join('\n');
  }
}

// Singleton instance
const builderSerializer = new BuilderSerializer();

export default builderSerializer;
export { BuilderSerializer };
