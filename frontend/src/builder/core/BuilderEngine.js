/**
 * Builder Engine
 * Core engine for builder state management
 * Handles page state, widget state, layout state, and selection
 */

import builderEvents from './BuilderEvents';
import builderSerializer from './BuilderSerializer';
import builderDeserializer from './BuilderDeserializer';
import { NodeType, BuilderEventType } from '../utils/types';

const LAYOUT_TYPES = ['page', 'section', 'container', 'column', 'column-1', 'column-2', 'column-3', 'column-4'];
const WIDGET_SAFE_PARENTS = ['container', 'column', 'column-1', 'column-2', 'column-3', 'column-4'];

export function safeParseJsonContent(raw, fallback = {}) {
  if (raw == null) return fallback;
  if (typeof raw !== 'string') return raw;
  if (raw.trim() === '') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (_) {
    return fallback;
  }
}

const WIDGET_DEFAULT_CONTENT = {
  image: { url: '', alt: '', link: '' },
  table: { data: [['Header 1', 'Header 2', 'Header 3'], ['Cell 1', 'Cell 2', 'Cell 3']] },
  video: { url: '', poster: '', autoplay: false, loop: false, controls: true },
  pdf: { url: '', fileName: '' },
  button: { text: 'Click Me', link: '', variant: 'primary' },
  split_section: { layout: 'two-column', left: '', right: '' },
  form: { fields: [], submitLabel: 'Submit', action: '' },
  blockquote: { text: '', author: '' },
  code_block: { code: '', language: 'javascript' },
  html: { markup: '' },
  rich_text: { html: '' },
  bullet_list: { items: ['List item 1', 'List item 2'] },
  numbered_list: { items: ['First item', 'Second item'] },
  spacer: { height: 24 },
};

function getColumnCount(type) {
  if (type === 'column-1') return 1;
  if (type === 'column-2') return 2;
  if (type === 'column-3') return 3;
  if (type === 'column-4') return 4;
  return 1;
}

class BuilderEngine {
  constructor() {
    this.page = null;
    this.selection = {
      selectedNodeId: null,
      hoveredNodeId: null,
      draggedNodeId: null,
    };
    this.clipboard = {
      nodes: [],
      copiedAt: null,
    };
    
    // Future features
    this.history = {
      past: [],
      present: null,
      future: [],
    };
    
    this.responsiveMode = 'desktop';
    this.theme = null;
  }

  /**
   * Load a page into the engine
   * @param {Object} data - Page data from database
   */
  loadPage(data) {
    this.page = builderDeserializer.deserializePage(data);
    this.history.present = JSON.parse(JSON.stringify(this.page));
    this.history.past = [];
    this.history.future = [];
    
    builderEvents.emit(BuilderEventType.PAGE_LOADED, { page: this.page });
  }

  /**
   * Get current page
   * @returns {Object|null} Current page
   */
  getPage() {
    return this.page;
  }

  /**
   * Update page metadata
   * @param {Object} metadata - Metadata to update
   */
  updatePageMetadata(metadata) {
    if (!this.page) return;
    
    this.page.metadata = {
      ...this.page.metadata,
      ...metadata,
    };
    
    builderEvents.emit(BuilderEventType.NODE_UPDATED, {
      nodeId: this.page.root.id,
      metadata: this.page.metadata,
    });
  }

  /**
   * Select a node
   * @param {string} nodeId - Node ID to select
   */
  selectNode(nodeId) {
    this.selection.selectedNodeId = nodeId;
    builderEvents.emit(BuilderEventType.NODE_SELECTED, { nodeId });
    builderEvents.emit(BuilderEventType.SELECTION_CHANGED, this.selection);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selection.selectedNodeId = null;
    builderEvents.emit(BuilderEventType.SELECTION_CHANGED, this.selection);
  }

  /**
   * Get selected node
   * @returns {Object|null} Selected node
   */
  getSelectedNode() {
    if (!this.selection.selectedNodeId || !this.page) return null;
    return this.findNode(this.page.root, this.selection.selectedNodeId);
  }

  /**
   * Find a node by ID in the tree
   * @param {Object} node - Root node to search from
   * @param {string} nodeId - Node ID to find
   * @returns {Object|null} Found node or null
   */
  findNode(node, nodeId) {
    if (!node) return null;
    
    if (node.id === nodeId) return node;
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNode(child, nodeId);
        if (found) return found;
      }
    }
    
    return null;
  }

  /**
   * Update a node
   * @param {string} nodeId - Node ID to update
   * @param {Object} updates - Updates to apply
   */
  updateNode(nodeId, updates) {
    if (!this.page) return;
    
    const node = this.findNode(this.page.root, nodeId);
    if (!node) return;
    
    Object.assign(node, updates);
    node.metadata = {
      ...node.metadata,
      updatedAt: Date.now(),
    };
    
    // Don't emit event here to avoid circular updates
  }

  /**
   * Find the index of a node within its parent's children array
   * @param {string} nodeId - Node ID to find index for
   * @returns {number} Index or -1 if not found
   */
  findNodeIndex(nodeId) {
    if (!this.page) return -1;
    const parent = this.findParentNode(this.page.root, nodeId);
    if (!parent || !parent.children) return -1;
    return parent.children.findIndex(child => child.id === nodeId);
  }

  /**
   * Resolve the effective parent ID for adding a node, walking down to the
   * nearest widget-safe container when the given parent can't hold widgets.
   * @param {string} parentId - Initial parent ID
   * @param {boolean} isLayoutNode - True if the node being added is a layout
   * @returns {{ parentId: string, indexBias: number }}
   */
  resolveEffectiveParent(parentId, isLayoutNode) {
    if (!this.page) return { parentId: this.page?.root?.id || null, indexBias: -1 };
    let parent = parentId ? this.findNode(this.page.root, parentId) : this.page.root;
    if (!parent) parent = this.page.root;

    if (isLayoutNode) {
      if (parent.type === 'page') return { parentId: parent.id, indexBias: -1 };
      if (parent.type === 'section') return { parentId: parent.id, indexBias: -1 };
      if (WIDGET_SAFE_PARENTS.includes(parent.type)) return { parentId: parent.id, indexBias: -1 };
      return { parentId: parent.id, indexBias: -1 };
    }

    let guard = 0;
    while (parent && !WIDGET_SAFE_PARENTS.includes(parent.type) && guard < 20) {
      guard += 1;
      if (parent.type === 'page') {
        const firstSection = parent.children?.find(c => c.type === 'section');
        if (firstSection) {
          parent = firstSection;
          continue;
        }
        const section = this._buildAutoChild(parent, 'section', `auto-section-${Date.now()}`);
        parent = section;
        continue;
      }
      if (parent.type === 'section') {
        const firstContainer = parent.children?.find(c => c.type === 'container');
        if (firstContainer) {
          parent = firstContainer;
          continue;
        }
        const container = this._buildAutoChild(parent, 'container', `auto-container-${Date.now()}`);
        parent = container;
        continue;
      }
      break;
    }

    return { parentId: parent.id, indexBias: -1 };
  }

  _buildAutoChild(parent, type, id) {
    const child = {
      id,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      children: [],
      settings: {},
      styles: {},
      responsive: {},
      metadata: { createdAt: Date.now(), updatedAt: Date.now() },
      parentId: parent.id,
    };
    if (!parent.children) parent.children = [];
    parent.children.push(child);
    this._expandLayoutChildren(child);
    return child;
  }

  _expandLayoutChildren(node) {
    if (!node || !LAYOUT_TYPES.includes(node.type)) return;
    if (!node.children) node.children = [];

    if (node.type === 'section' && node.children.length === 0) {
      node.children.push({
        id: `container-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'container',
        label: 'Container',
        children: [],
        settings: {},
        styles: {},
        responsive: {},
        metadata: { createdAt: Date.now(), updatedAt: Date.now() },
        parentId: node.id,
      });
      return;
    }

    if ((node.type === 'column' || node.type.startsWith('column-')) && node.children.length === 0) {
      const count = getColumnCount(node.type);
      for (let i = 0; i < count; i += 1) {
        node.children.push({
          id: `col-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 4)}`,
          type: 'column',
          label: `Column ${i + 1}`,
          children: [],
          settings: { columnIndex: i, columnCount: count },
          styles: {},
          responsive: {},
          metadata: { createdAt: Date.now(), updatedAt: Date.now() },
          parentId: node.id,
        });
      }
      // Mark the wrapper itself with the count too (used by CanvasNode getLayoutContainerStyle)
      node.settings = { ...node.settings, columnCount: count };
    }
  }

  /**
   * Add a node to the tree
   * @param {Object} nodeData - Node data to add
   * @param {string} parentId - Parent node ID
   * @param {number} index - Index to insert at
   * @returns {string} New node ID
   */
  addNode(nodeData, parentId = null, index = -1) {
    if (!this.page) return null;

    const isLayoutNode = LAYOUT_TYPES.includes(nodeData.type);

    const effective = this.resolveEffectiveParent(parentId, isLayoutNode);
    const resolvedParentId = effective.parentId || (this.page.root ? this.page.root.id : null);
    let insertIndex = index;

    const rawContent = nodeData.content;
    let defaultedContent = rawContent;
    if (defaultedContent == null || defaultedContent === '') {
      const typeDefaults = WIDGET_DEFAULT_CONTENT[nodeData.type];
      if (typeDefaults) {
        defaultedContent = JSON.stringify(typeDefaults);
      } else {
        defaultedContent = '';
      }
    }

    const newNode = {
      id: nodeData.id || this.generateId(),
      type: nodeData.type,
      label: nodeData.label || nodeData.type,
      content: defaultedContent,
      settings: nodeData.settings || {},
      styles: nodeData.styles || {},
      responsive: nodeData.responsive || {},
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...nodeData.metadata,
      },
      children: nodeData.children ? JSON.parse(JSON.stringify(nodeData.children)) : [],
    };

    this._expandLayoutChildren(newNode);

    const targetParent = resolvedParentId
      ? this.findNode(this.page.root, resolvedParentId)
      : this.page.root;

    if (!targetParent) return null;
    if (!targetParent.children) targetParent.children = [];

    if (insertIndex >= 0 && insertIndex < targetParent.children.length) {
      targetParent.children.splice(insertIndex, 0, newNode);
    } else {
      targetParent.children.push(newNode);
    }
    newNode.parentId = targetParent.id;

    return newNode.id;
  }

  /**
   * Delete a node
   * @param {string} nodeId - Node ID to delete
   */
  deleteNode(nodeId) {
    if (!this.page) return;
    
    const parent = this.findParentNode(this.page.root, nodeId);
    if (!parent) return;
    
    const index = parent.children.findIndex(child => child.id === nodeId);
    if (index > -1) {
      const deletedNode = parent.children.splice(index, 1)[0];
      
      if (this.selection.selectedNodeId === nodeId) {
        this.clearSelection();
      }
    }
    
    // Don't emit event here to avoid circular updates
  }

  /**
   * Move a node to a new parent/position
   * @param {string} nodeId - Node ID to move
   * @param {string|'up'|'down'} newParentId - New parent node ID OR direction 'up' / 'down'
   * @param {number} newIndex - New index (ignored when direction is used)
   */
  moveNode(nodeId, newParentId, newIndex) {
    if (!this.page) return;

    const node = this.findNode(this.page.root, nodeId);
    if (!node) return;

    const oldParent = this.findParentNode(this.page.root, nodeId);
    if (!oldParent) return;

    if (newParentId === 'up' || newParentId === 'down') {
      const oldIndex = oldParent.children.findIndex(child => child.id === nodeId);
      if (oldIndex < 0) return;
      const targetIndex = newParentId === 'up' ? oldIndex - 1 : oldIndex + 1;
      if (targetIndex < 0 || targetIndex >= oldParent.children.length) return;
      oldParent.children.splice(oldIndex, 1);
      oldParent.children.splice(targetIndex, 0, node);
      node.parentId = oldParent.id;
      return;
    }

    const oldIndex = oldParent.children.findIndex(child => child.id === nodeId);
    if (oldIndex > -1) {
      oldParent.children.splice(oldIndex, 1);
    }

    const newParent = newParentId ? this.findNode(this.page.root, newParentId) : this.page.root;
    if (!newParent) return;

    if (!newParent.children) newParent.children = [];

    let insertAt = newIndex;
    if (oldParent.id === newParent.id && oldIndex < newIndex) {
      insertAt = newIndex - 1;
    }

    if (insertAt >= 0 && insertAt < newParent.children.length) {
      newParent.children.splice(insertAt, 0, node);
    } else {
      newParent.children.push(node);
    }

    node.parentId = newParentId || this.page.root.id;
  }

  /**
   * Find parent node of a given node
   * @param {Object} node - Root node to search from
   * @param {string} childId - Child node ID
   * @returns {Object|null} Parent node or null
   */
  findParentNode(node, childId) {
    if (!node || !node.children) return null;
    
    for (const child of node.children) {
      if (child.id === childId) return node;
      
      const found = this.findParentNode(child, childId);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Copy nodes to clipboard
   * @param {Array<string>} nodeIds - Node IDs to copy
   */
  copyNodes(nodeIds) {
    if (!this.page || !Array.isArray(nodeIds)) return;
    
    const nodes = nodeIds.map(id => this.findNode(this.page.root, id)).filter(Boolean);
    
    this.clipboard = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      copiedAt: Date.now(),
    };
  }

  /**
   * Paste nodes from clipboard
   * @param {string} parentId - Parent node ID to paste into
   * @param {number} index - Index to paste at
   * @returns {Array<string>} New node IDs
   */
  pasteNodes(parentId = null, index = -1) {
    if (!this.clipboard.nodes || this.clipboard.nodes.length === 0) return [];
    
    const newIds = [];
    
    this.clipboard.nodes.forEach(nodeData => {
      const newId = this.addNode(nodeData, parentId, index);
      if (newId) newIds.push(newId);
    });
    
    return newIds;
  }

  /**
   * Duplicate a node
   * @param {string} nodeId - Node ID to duplicate
   * @returns {string|null} New node ID
   */
  duplicateNode(nodeId) {
    if (!this.page) return null;
    
    const node = this.findNode(this.page.root, nodeId);
    if (!node) return null;
    
    const parent = this.findParentNode(this.page.root, nodeId);
    if (!parent) return null;
    
    const index = parent.children.findIndex(child => child.id === nodeId);
    const newIndex = index + 1;
    
    return this.addNode(node, parent.id, newIndex);
  }

  /**
   * Set hovered node
   * @param {string} nodeId - Node ID to hover
   */
  setHoveredNode(nodeId) {
    this.selection.hoveredNodeId = nodeId;
  }

  /**
   * Set dragged node
   * @param {string} nodeId - Node ID being dragged
   */
  setDraggedNode(nodeId) {
    this.selection.draggedNodeId = nodeId;
  }

  /**
   * Clear dragged node
   */
  clearDraggedNode() {
    this.selection.draggedNodeId = null;
  }

  /**
   * Set responsive mode
   * @param {string} mode - Responsive mode ('desktop', 'tablet', 'mobile')
   */
  setResponsiveMode(mode) {
    this.responsiveMode = mode;
  }

  /**
   * Get responsive mode
   * @returns {string} Current responsive mode
   */
  getResponsiveMode() {
    return this.responsiveMode;
  }

  /**
   * Set theme
   * @param {Object} theme - Theme object
   */
  setTheme(theme) {
    this.theme = theme;
  }

  /**
   * Get theme
   * @returns {Object|null} Current theme
   */
  getTheme() {
    return this.theme;
  }

  /**
   * Serialize current page to database format
   * @param {boolean} useLegacyFormat - Use legacy format for backward compatibility
   * @returns {Object} Serialized data
   */
  serialize(useLegacyFormat = false) {
    if (!this.page) return null;
    
    if (useLegacyFormat) {
      return builderSerializer.serializeToLegacy(this.page);
    }
    
    return builderSerializer.serializePage(this.page);
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load a template into the engine
   * @param {string} templateId - Template ID to load
   */
  async loadTemplate(templateId) {
    // Import template dynamically using ES6 dynamic imports
    let templateData;
    
    try {
      let templateModule;
      
      switch (templateId) {
        case 'blank':
          templateModule = await import('../templates/blank');
          templateData = templateModule.blankTemplate;
          break;
        case 'webinar':
          templateModule = await import('../templates/webinar');
          templateData = templateModule.webinarTemplate;
          break;
        case 'product':
          templateModule = await import('../templates/product');
          templateData = templateModule.productTemplate;
          break;
        case 'contact':
          templateModule = await import('../templates/contact');
          templateData = templateModule.contactTemplate;
          break;
        case 'whitepaper':
          templateModule = await import('../templates/whitepaper');
          templateData = templateModule.whitepaperTemplate;
          break;
        case 'ebook':
          templateModule = await import('../templates/ebook');
          templateData = templateModule.ebookTemplate;
          break;
        case 'event':
          templateModule = await import('../templates/event');
          templateData = templateModule.eventTemplate;
          break;
        case 'ai':
          templateModule = await import('../templates/ai');
          templateData = templateModule.aiTemplate;
          break;
        case 'case':
          templateModule = await import('../templates/case');
          templateData = templateModule.caseTemplate;
          break;
        default:
          console.warn(`Template "${templateId}" not found, using blank template`);
          templateModule = await import('../templates/blank');
          templateData = templateModule.blankTemplate;
      }
      
      this.page = JSON.parse(JSON.stringify(templateData));
      this.history.present = JSON.parse(JSON.stringify(this.page));
      this.history.past = [];
      this.history.future = [];
      
      builderEvents.emit(BuilderEventType.PAGE_LOADED, { page: this.page });
    } catch (error) {
      console.error('Error loading template:', error);
      // Fallback to blank template
      try {
        const templateModule = await import('../templates/blank');
        templateData = templateModule.blankTemplate;
        this.page = JSON.parse(JSON.stringify(templateData));
        this.history.present = JSON.parse(JSON.stringify(this.page));
        this.history.past = [];
        this.history.future = [];
        
        builderEvents.emit(BuilderEventType.PAGE_LOADED, { page: this.page });
      } catch (fallbackError) {
        console.error('Error loading fallback blank template:', fallbackError);
        // Create minimal blank template as ultimate fallback
        this.page = {
          root: {
            id: 'root',
            type: 'page',
            label: 'Page',
            children: [],
            settings: {},
            styles: {},
            responsive: {},
            metadata: {
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          },
        };
        this.history.present = JSON.parse(JSON.stringify(this.page));
        this.history.past = [];
        this.history.future = [];
        
        builderEvents.emit(BuilderEventType.PAGE_LOADED, { page: this.page });
      }
    }
  }

  /**
   * Reset the engine
   */
  reset() {
    this.page = null;
    this.selection = {
      selectedNodeId: null,
      hoveredNodeId: null,
      draggedNodeId: null,
    };
    this.clipboard = {
      nodes: [],
      copiedAt: null,
    };
    this.history = {
      past: [],
      present: null,
      future: [],
    };
    this.responsiveMode = 'desktop';
    this.theme = null;
  }
}

// Singleton instance
const builderEngine = new BuilderEngine();

export default builderEngine;
export { BuilderEngine };
