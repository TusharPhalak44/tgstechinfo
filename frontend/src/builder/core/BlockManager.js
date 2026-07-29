/**
 * Block Manager
 * Manages saved blocks with categories, search, and preview
 * Blocks are reusable sections that can be inserted into pages
 */

class BlockManager {
  constructor() {
    this.blocks = new Map();
    this.categories = new Map();
    this.listeners = [];
  }

  /**
   * Save a block
   * @param {Object} block - Block data
   * @param {string} block.id - Block ID
   * @param {string} block.name - Block name
   * @param {string} block.category - Block category
   * @param {Object} block.data - Block node data
   * @param {string} block.thumbnail - Block thumbnail URL
   * @param {Object} block.metadata - Additional metadata
   * @returns {string} Block ID
   */
  saveBlock(block) {
    const id = block.id || this.generateId();
    
    const savedBlock = {
      id,
      name: block.name || 'Untitled Block',
      category: block.category || 'general',
      data: block.data,
      thumbnail: block.thumbnail || null,
      description: block.description || '',
      tags: block.tags || [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'current-user',
        version: '1.0.0',
        ...block.metadata,
      },
    };

    this.blocks.set(id, savedBlock);

    // Register category
    if (!this.categories.has(savedBlock.category)) {
      this.categories.set(savedBlock.category, []);
    }
    const categoryBlocks = this.categories.get(savedBlock.category);
    if (!categoryBlocks.includes(id)) {
      categoryBlocks.push(id);
    }

    this.notifyListeners('block:saved', savedBlock);
    return id;
  }

  /**
   * Get a block by ID
   * @param {string} id - Block ID
   * @returns {Object|null} Block or null
   */
  getBlock(id) {
    return this.blocks.get(id) || null;
  }

  /**
   * Get all blocks
   * @returns {Array} Array of blocks
   */
  getAllBlocks() {
    return Array.from(this.blocks.values());
  }

  /**
   * Get blocks by category
   * @param {string} category - Category name
   * @returns {Array} Array of blocks
   */
  getBlocksByCategory(category) {
    const blockIds = this.categories.get(category) || [];
    return blockIds.map(id => this.blocks.get(id)).filter(Boolean);
  }

  /**
   * Get all categories
   * @returns {Array} Array of category names
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Update a block
   * @param {string} id - Block ID
   * @param {Object} updates - Updates to apply
   */
  updateBlock(id, updates) {
    const block = this.blocks.get(id);
    if (!block) return;

    Object.assign(block, updates);
    block.metadata.updatedAt = Date.now();
    block.metadata.version = this.incrementVersion(block.metadata.version);

    // Handle category change
    if (updates.category && updates.category !== block.category) {
      const oldCategoryBlocks = this.categories.get(block.category);
      if (oldCategoryBlocks) {
        const index = oldCategoryBlocks.indexOf(id);
        if (index > -1) {
          oldCategoryBlocks.splice(index, 1);
        }
      }

      if (!this.categories.has(updates.category)) {
        this.categories.set(updates.category, []);
      }
      const newCategoryBlocks = this.categories.get(updates.category);
      if (!newCategoryBlocks.includes(id)) {
        newCategoryBlocks.push(id);
      }
    }

    this.notifyListeners('block:updated', block);
  }

  /**
   * Delete a block
   * @param {string} id - Block ID
   */
  deleteBlock(id) {
    const block = this.blocks.get(id);
    if (!block) return;

    // Remove from category
    const categoryBlocks = this.categories.get(block.category);
    if (categoryBlocks) {
      const index = categoryBlocks.indexOf(id);
      if (index > -1) {
        categoryBlocks.splice(index, 1);
      }
    }

    // Remove from registry
    this.blocks.delete(id);

    this.notifyListeners('block:deleted', { id });
  }

  /**
   * Rename a block
   * @param {string} id - Block ID
   * @param {string} newName - New name
   */
  renameBlock(id, newName) {
    this.updateBlock(id, { name: newName });
  }

  /**
   * Change block category
   * @param {string} id - Block ID
   * @param {string} newCategory - New category
   */
  changeCategory(id, newCategory) {
    this.updateBlock(id, { category: newCategory });
  }

  /**
   * Update block thumbnail
   * @param {string} id - Block ID
   * @param {string} thumbnailUrl - Thumbnail URL
   */
  updateThumbnail(id, thumbnailUrl) {
    this.updateBlock(id, { thumbnail: thumbnailUrl });
  }

  /**
   * Search blocks by name, description, or tags
   * @param {string} query - Search query
   * @returns {Array} Array of matching blocks
   */
  searchBlocks(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllBlocks().filter(block =>
      block.name.toLowerCase().includes(lowerQuery) ||
      block.description.toLowerCase().includes(lowerQuery) ||
      block.category.toLowerCase().includes(lowerQuery) ||
      block.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Search blocks by tags
   * @param {string} tag - Tag to search
   * @returns {Array} Array of matching blocks
   */
  searchByTag(tag) {
    const lowerTag = tag.toLowerCase();
    return this.getAllBlocks().filter(block =>
      block.tags.some(t => t.toLowerCase().includes(lowerTag))
    );
  }

  /**
   * Duplicate a block
   * @param {string} id - Block ID
   * @returns {string} New block ID
   */
  duplicateBlock(id) {
    const block = this.blocks.get(id);
    if (!block) return null;

    return this.saveBlock({
      name: `${block.name} (Copy)`,
      category: block.category,
      data: JSON.parse(JSON.stringify(block.data)),
      thumbnail: block.thumbnail,
      description: block.description,
      tags: [...block.tags],
      metadata: {
        ...block.metadata,
        duplicatedFrom: id,
      },
    });
  }

  /**
   * Export block as JSON
   * @param {string} id - Block ID
   * @returns {Object} Exported block data
   */
  exportBlock(id) {
    const block = this.blocks.get(id);
    if (!block) return null;

    return {
      id: block.id,
      name: block.name,
      category: block.category,
      data: block.data,
      thumbnail: block.thumbnail,
      description: block.description,
      tags: block.tags,
      metadata: block.metadata,
      exportedAt: Date.now(),
    };
  }

  /**
   * Import block from JSON
   * @param {Object} data - Imported block data
   * @returns {string} Block ID
   */
  importBlock(data) {
    return this.saveBlock({
      id: data.id,
      name: data.name,
      category: data.category,
      data: data.data,
      thumbnail: data.thumbnail,
      description: data.description,
      tags: data.tags,
      metadata: {
        ...data.metadata,
        importedAt: Date.now(),
      },
    });
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Increment version string
   * @param {string} version - Current version
   * @returns {string} New version
   */
  incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  /**
   * Subscribe to block events
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      listener(event, data);
    });
  }

  /**
   * Clear all blocks
   */
  clear() {
    this.blocks.clear();
    this.categories.clear();
    this.notifyListeners('blocks:cleared', {});
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalBlocks: this.blocks.size,
      totalCategories: this.categories.size,
      blocksByCategory: this.getBlocksByCategoryCount(),
    };
  }

  /**
   * Get block count by category
   * @returns {Object} Block count by category
   */
  getBlocksByCategoryCount() {
    const count = {};
    this.categories.forEach((blockIds, category) => {
      count[category] = blockIds.length;
    });
    return count;
  }
}

// Singleton instance
const blockManager = new BlockManager();

export default blockManager;
export { BlockManager };
