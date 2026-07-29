/**
 * Backward Compatibility Layer
 * Ensures existing JSON schema continues working with new architecture
 * Handles conversion between legacy and new formats
 */

import builderDeserializer from '../core/BuilderDeserializer';
import builderSerializer from '../core/BuilderSerializer';
import { NodeType } from './types';

/**
 * Convert legacy content elements array to new BuilderNode format
 * @param {Array} legacyElements - Legacy content elements from database
 * @returns {Array} BuilderNode array
 */
export function convertLegacyContentElements(legacyElements) {
  if (!Array.isArray(legacyElements)) return [];

  return legacyElements.map((element, index) => ({
    id: element.id || `el-${Date.now()}-${index}`,
    type: element.type,
    content: element.content || '',
    headingLevel: element.headingLevel,
    alignment: element.alignment,
    tag: element.tag,
    label: element.label || getElementLabel(element.type),
    children: [],
    settings: {},
    styles: {},
    responsive: {},
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }));
}

/**
 * Convert new BuilderNode array to legacy content elements format
 * @param {Array} builderNodes - BuilderNode array
 * @returns {Array} Legacy content elements array
 */
export function convertToLegacyContentElements(builderNodes) {
  if (!Array.isArray(builderNodes)) return [];

  return builderNodes.map(node => ({
    id: node.id,
    type: node.type,
    content: node.content,
    headingLevel: node.headingLevel,
    alignment: node.alignment,
    tag: node.tag,
    label: node.label || getElementLabel(node.type),
  }));
}

/**
 * Convert legacy layout sections to new BuilderNode format
 * @param {Array} legacyLayout - Legacy layout sections from database
 * @returns {Array} BuilderNode array
 */
export function convertLegacyLayout(legacyLayout) {
  if (!Array.isArray(legacyLayout)) return [];

  return legacyLayout.map((section, index) => {
    // Handle both string and object formats
    if (typeof section === 'string') {
      return {
        id: `sec-${Date.now()}-${index}`,
        type: getSectionTypeFromString(section),
        children: [],
        settings: {},
        styles: {},
        responsive: {},
        metadata: {},
      };
    }

    return {
      id: section.id || `sec-${Date.now()}-${index}`,
      type: section.type,
      children: [],
      settings: {},
      styles: {},
      responsive: {},
      metadata: {},
    };
  });
}

/**
 * Convert new BuilderNode layout to legacy format
 * @param {Array} builderNodes - BuilderNode array
 * @returns {Array} Legacy layout sections
 */
export function convertToLegacyLayout(builderNodes) {
  if (!Array.isArray(builderNodes)) return [];

  return builderNodes.map(node => ({
    id: node.id,
    type: node.type,
  }));
}

/**
 * Get section type from legacy string format
 * @param {string} sectionString - Legacy section string
 * @returns {string} Node type
 */
function getSectionTypeFromString(sectionString) {
  const mapping = {
    'meta': NodeType.CONTENT_TYPE_CATEGORY,
    'title': NodeType.TITLE_DESCRIPTION,
    'banner': NodeType.BANNER_IMAGE,
    'content': NodeType.CONTENT,
    'tags': NodeType.TAGS,
    'schedule': NodeType.SCHEDULE,
    'seo': NodeType.SEO,
  };
  return mapping[sectionString] || sectionString;
}

/**
 * Get element label for legacy format
 * @param {string} type - Element type
 * @returns {string} Label
 */
function getElementLabel(type) {
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
 * Check if data is in legacy format
 * @param {Object} data - Data to check
 * @returns {boolean} True if legacy format
 */
export function isLegacyFormat(data) {
  if (!data) return false;
  
  // Check for legacy format indicators
  return (
    data.builder_layout !== undefined ||
    data.builder_content_elements !== undefined ||
    (Array.isArray(data.builder_layout) && data.builder_layout.length > 0 && typeof data.builder_layout[0] === 'string')
  );
}

/**
 * Convert database data to builder page format
 * @param {Object} data - Database data
 * @returns {Object} Builder page data
 */
export function convertDatabaseToBuilder(data) {
  if (isLegacyFormat(data)) {
    return builderDeserializer.deserializeLegacyFormat(data);
  }
  
  return builderDeserializer.deserializeNewFormat(data);
}

/**
 * Convert builder page to database format
 * @param {Object} page - Builder page
 * @param {boolean} useLegacyFormat - Use legacy format for backward compatibility
 * @returns {Object} Database data
 */
export function convertBuilderToDatabase(page, useLegacyFormat = true) {
  if (useLegacyFormat) {
    return builderSerializer.serializeToLegacy(page);
  }
  
  return builderSerializer.serializePage(page);
}

/**
 * Merge legacy content with new builder structure
 * @param {Object} legacyData - Legacy data from database
 * @param {Object} builderPage - Current builder page
 * @returns {Object} Merged builder page
 */
export function mergeLegacyWithBuilder(legacyData, builderPage) {
  if (!legacyData || !builderPage) return builderPage;

  const converted = convertDatabaseToBuilder(legacyData);
  
  // Merge content elements if they exist in legacy data
  if (legacyData.builder_content_elements && Array.isArray(legacyData.builder_content_elements)) {
    const contentSection = findContentSection(builderPage.root);
    if (contentSection) {
      contentSection.children = convertLegacyContentElements(legacyData.builder_content_elements);
    }
  }

  return builderPage;
}

/**
 * Find content section in builder tree
 * @param {Object} node - Root node
 * @returns {Object|null} Content section node
 */
function findContentSection(node) {
  if (!node || !node.children) return null;
  
  const contentSection = node.children.find(child => child.type === NodeType.CONTENT);
  if (contentSection) return contentSection;
  
  for (const child of node.children) {
    const found = findContentSection(child);
    if (found) return found;
  }
  
  return null;
}

/**
 * Validate builder node structure
 * @param {Object} node - Node to validate
 * @returns {boolean} True if valid
 */
export function validateBuilderNode(node) {
  if (!node) return false;
  if (!node.id) return false;
  if (!node.type) return false;
  
  return true;
}

/**
 * Validate builder page structure
 * @param {Object} page - Page to validate
 * @returns {boolean} True if valid
 */
export function validateBuilderPage(page) {
  if (!page) return false;
  if (!page.root) return false;
  
  return validateBuilderNode(page.root);
}
