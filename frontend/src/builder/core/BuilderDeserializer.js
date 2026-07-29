/**
 * Builder Deserializer
 * Converts database JSON format to BuilderNode tree
 * Handles backward compatibility with existing data
 */

import { NodeType } from '../utils/types';

class BuilderDeserializer {
  /**
   * Deserialize database data to builder page
   * @param {Object} data - Database data
   * @returns {Object} Builder page
   */
  deserializePage(data) {
    if (!data) {
      return this.createEmptyPage();
    }

    // Check if data is in new format (version 2.0+)
    if (data.version && data.version.startsWith('2')) {
      return this.deserializeNewFormat(data);
    }

    // Otherwise, treat as legacy format
    return this.deserializeLegacyFormat(data);
  }

  /**
   * Deserialize new format data (v2.0)
   * @param {Object} data - New format data
   * @returns {Object} Builder page
   */
  deserializeNewFormat(data) {
    if (!data.layout) {
      return this.createEmptyPage();
    }

    const root = this.deserializeNode(data.layout);

    return {
      id: data.metadata?.id || this.generateId(),
      root,
      metadata: data.metadata || {},
    };
  }

  /**
   * Deserialize legacy format data
   * @param {Object} data - Legacy format data
   * @returns {Object} Builder page
   */
  deserializeLegacyFormat(data) {
    // Parse builder_layout if it's a string
    let layout = data.builder_layout;
    if (typeof layout === 'string') {
      try {
        layout = JSON.parse(layout);
      } catch (e) {
        console.error('Error parsing builder_layout:', e);
        layout = [];
      }
    }

    // Parse builder_content_elements if it's a string
    let contentElements = data.builder_content_elements;
    if (typeof contentElements === 'string') {
      try {
        contentElements = JSON.parse(contentElements);
      } catch (e) {
        console.error('Error parsing builder_content_elements:', e);
        contentElements = [];
      }
    }

    // Create root node
    const root = {
      id: this.generateId(),
      type: NodeType.PAGE,
      children: [],
    };

    // Add layout sections as children
    if (Array.isArray(layout)) {
      root.children = layout.map(section => this.deserializeLayoutSection(section));
    }

    // Add content elements to content section
    if (Array.isArray(contentElements) && contentElements.length > 0) {
      const contentSection = this.findOrCreateContentSection(root);
      contentSection.children = contentElements.map(el => this.deserializeContentElement(el));
    }

    return {
      id: this.generateId(),
      root,
      metadata: {
        title: data.title,
        contentType: data.content_type_name,
        category: data.category_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  }

  /**
   * Deserialize a single node
   * @param {Object} data - Node data
   * @returns {Object} Builder node
   */
  deserializeNode(data) {
    if (!data) return null;

    return {
      id: data.id || this.generateId(),
      type: data.type,
      label: data.label || data.type,
      parentId: data.parentId,
      content: data.content !== undefined ? data.content : '',
      settings: data.settings || {},
      styles: data.styles || {},
      responsive: data.responsive || {},
      metadata: data.metadata || {},
      children: data.children ? this.deserializeChildren(data.children) : [],
    };
  }

  /**
   * Deserialize an array of nodes
   * @param {Array} data - Array of node data
   * @returns {Array} Builder nodes
   */
  deserializeChildren(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => this.deserializeNode(item)).filter(Boolean);
  }

  /**
   * Deserialize a layout section from legacy format
   * @param {Object} section - Legacy section data
   * @returns {Object} Builder node
   */
  deserializeLayoutSection(section) {
    return {
      id: section.id || this.generateId(),
      type: section.type,
      children: [],
      settings: {},
      styles: {},
      responsive: {},
      metadata: {},
    };
  }

  /**
   * Deserialize a content element from legacy format
   * @param {Object} element - Legacy element data
   * @returns {Object} Builder node
   */
  deserializeContentElement(element) {
    return {
      id: element.id || this.generateId(),
      type: element.type,
      content: element.content,
      headingLevel: element.headingLevel,
      alignment: element.alignment,
      tag: element.tag,
      label: element.label,
      children: [],
      settings: {},
      styles: {},
      responsive: {},
      metadata: {},
    };
  }

  /**
   * Find or create content section in root
   * @param {Object} root - Root node
   * @returns {Object} Content section node
   */
  findOrCreateContentSection(root) {
    if (!root.children) {
      root.children = [];
    }

    let contentSection = root.children.find(child => child.type === NodeType.CONTENT);
    
    if (!contentSection) {
      contentSection = {
        id: this.generateId(),
        type: NodeType.CONTENT,
        children: [],
        settings: {},
        styles: {},
        responsive: {},
        metadata: {},
      };
      root.children.push(contentSection);
    }

    return contentSection;
  }

  /**
   * Create an empty builder page
   * @returns {Object} Empty builder page
   */
  createEmptyPage() {
    return {
      id: this.generateId(),
      root: {
        id: this.generateId(),
        type: NodeType.PAGE,
        children: [
          {
            id: this.generateId(),
            type: NodeType.CONTENT_TYPE_CATEGORY,
            children: [],
            settings: {},
            styles: {},
            responsive: {},
            metadata: {},
          },
          {
            id: this.generateId(),
            type: NodeType.TITLE_DESCRIPTION,
            children: [],
            settings: {},
            styles: {},
            responsive: {},
            metadata: {},
          },
          {
            id: this.generateId(),
            type: NodeType.BANNER_IMAGE,
            children: [],
            settings: {},
            styles: {},
            responsive: {},
            metadata: {},
          },
          {
            id: this.generateId(),
            type: NodeType.CONTENT,
            children: [],
            settings: {},
            styles: {},
            responsive: {},
            metadata: {},
          },
        ],
        settings: {},
        styles: {},
        responsive: {},
        metadata: {},
      },
      metadata: {},
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
const builderDeserializer = new BuilderDeserializer();

export default builderDeserializer;
export { BuilderDeserializer };
