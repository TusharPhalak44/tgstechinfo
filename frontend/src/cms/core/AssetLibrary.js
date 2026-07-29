/**
 * Asset Library Manager
 * Enterprise media library with images, videos, PDF, SVG, icons, folders, tags, search, versioning
 */

class AssetLibraryManager {
  constructor() {
    this.assets = new Map();
    this.folders = new Map();
    this.tags = new Map();
    this.listeners = [];
    
    // Initialize root folder
    this.folders.set('root', {
      id: 'root',
      name: 'Root',
      parentId: null,
      createdAt: Date.now(),
    });
  }

  /**
   * Upload an asset
   * @param {Object} asset - Asset configuration
   * @returns {string} Asset ID
   */
  uploadAsset(asset) {
    const id = asset.id || this.generateId();
    
    const newAsset = {
      id,
      name: asset.name,
      type: asset.type, // image, video, pdf, svg, icon, zip
      url: asset.url,
      size: asset.size,
      folderId: asset.folderId || 'root',
      tags: asset.tags || [],
      metadata: {
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        format: asset.format,
        ...asset.metadata,
      },
      usage: [],
      versions: [
        {
          id: this.generateId(),
          url: asset.url,
          uploadedAt: Date.now(),
          uploadedBy: asset.uploadedBy || 'current-user',
        },
      ],
      favorites: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: asset.uploadedBy || 'current-user',
    };

    this.assets.set(id, newAsset);
    this.notifyListeners('asset:uploaded', newAsset);
    return id;
  }

  /**
   * Get an asset
   * @param {string} id - Asset ID
   * @returns {Object|null} Asset or null
   */
  getAsset(id) {
    return this.assets.get(id) || null;
  }

  /**
   * Get all assets
   * @returns {Array} Array of assets
   */
  getAllAssets() {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by folder
   * @param {string} folderId - Folder ID
   * @returns {Array} Array of assets
   */
  getAssetsByFolder(folderId) {
    return Array.from(this.assets.values()).filter(
      asset => asset.folderId === folderId
    );
  }

  /**
   * Get assets by type
   * @param {string} type - Asset type
   * @returns {Array} Array of assets
   */
  getAssetsByType(type) {
    return Array.from(this.assets.values()).filter(
      asset => asset.type === type
    );
  }

  /**
   * Get assets by tags
   * @param {Array} tags - Array of tags
   * @returns {Array} Array of assets
   */
  getAssetsByTags(tags) {
    return Array.from(this.assets.values()).filter(
      asset => tags.some(tag => asset.tags.includes(tag))
    );
  }

  /**
   * Search assets
   * @param {string} query - Search query
   * @returns {Array} Array of matching assets
   */
  searchAssets(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.assets.values()).filter(
      asset =>
        asset.name.toLowerCase().includes(lowerQuery) ||
        asset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get favorite assets
   * @returns {Array} Array of favorite assets
   */
  getFavoriteAssets() {
    return Array.from(this.assets.values()).filter(
      asset => asset.favorites
    );
  }

  /**
   * Get recently uploaded assets
   * @param {number} limit - Number of assets to return
   * @returns {Array} Array of recent assets
   */
  getRecentAssets(limit = 20) {
    return Array.from(this.assets.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Update asset
   * @param {string} id - Asset ID
   * @param {Object} updates - Updates to apply
   */
  updateAsset(id, updates) {
    const asset = this.assets.get(id);
    if (!asset) return;

    Object.assign(asset, updates);
    asset.updatedAt = Date.now();
    this.assets.set(id, asset);
    this.notifyListeners('asset:updated', asset);
  }

  /**
   * Replace asset
   * @param {string} id - Asset ID
   * @param {string} newUrl - New asset URL
   * @param {Object} metadata - New metadata
   */
  replaceAsset(id, newUrl, metadata = {}) {
    const asset = this.assets.get(id);
    if (!asset) return;

    // Add new version
    asset.versions.push({
      id: this.generateId(),
      url: newUrl,
      uploadedAt: Date.now(),
      uploadedBy: 'current-user',
    });

    asset.url = newUrl;
    asset.metadata = { ...asset.metadata, ...metadata };
    asset.updatedAt = Date.now();

    this.assets.set(id, asset);
    this.notifyListeners('asset:replaced', asset);
  }

  /**
   * Delete asset
   * @param {string} id - Asset ID
   */
  deleteAsset(id) {
    this.assets.delete(id);
    this.notifyListeners('asset:deleted', { id });
  }

  /**
   * Toggle favorite
   * @param {string} id - Asset ID
   */
  toggleFavorite(id) {
    const asset = this.assets.get(id);
    if (!asset) return;

    asset.favorites = !asset.favorites;
    asset.updatedAt = Date.now();
    this.assets.set(id, asset);
    this.notifyListeners('asset:favorite_toggled', asset);
  }

  /**
   * Add tag to asset
   * @param {string} id - Asset ID
   * @param {string} tag - Tag to add
   */
  addTag(id, tag) {
    const asset = this.assets.get(id);
    if (!asset) return;

    if (!asset.tags.includes(tag)) {
      asset.tags.push(tag);
      asset.updatedAt = Date.now();
      this.assets.set(id, asset);
      this.notifyListeners('asset:tag_added', asset);
    }
  }

  /**
   * Remove tag from asset
   * @param {string} id - Asset ID
   * @param {string} tag - Tag to remove
   */
  removeTag(id, tag) {
    const asset = this.assets.get(id);
    if (!asset) return;

    const index = asset.tags.indexOf(tag);
    if (index > -1) {
      asset.tags.splice(index, 1);
      asset.updatedAt = Date.now();
      this.assets.set(id, asset);
      this.notifyListeners('asset:tag_removed', asset);
    }
  }

  /**
   * Record asset usage
   * @param {string} id - Asset ID
   * @param {string} pageId - Page ID
   * @param {string} context - Usage context
   */
  recordUsage(id, pageId, context = '') {
    const asset = this.assets.get(id);
    if (!asset) return;

    asset.usage.push({
      pageId,
      context,
      timestamp: Date.now(),
    });

    asset.updatedAt = Date.now();
    this.assets.set(id, asset);
    this.notifyListeners('asset:usage_recorded', asset);
  }

  /**
   * Get asset usage
   * @param {string} id - Asset ID
   * @returns {Array} Array of usage records
   */
  getAssetUsage(id) {
    const asset = this.assets.get(id);
    return asset ? asset.usage : [];
  }

  /**
   * Check for duplicate assets
   * @param {string} hash - Asset hash
   * @returns {Array} Array of duplicate assets
   */
  checkDuplicates(hash) {
    return Array.from(this.assets.values()).filter(
      asset => asset.metadata.hash === hash
    );
  }

  /**
   * Create folder
   * @param {Object} folder - Folder configuration
   * @returns {string} Folder ID
   */
  createFolder(folder) {
    const id = folder.id || this.generateId();
    
    const newFolder = {
      id,
      name: folder.name,
      parentId: folder.parentId || 'root',
      createdAt: Date.now(),
    };

    this.folders.set(id, newFolder);
    this.notifyListeners('folder:created', newFolder);
    return id;
  }

  /**
   * Get folder
   * @param {string} id - Folder ID
   * @returns {Object|null} Folder or null
   */
  getFolder(id) {
    return this.folders.get(id) || null;
  }

  /**
   * Get all folders
   * @returns {Array} Array of folders
   */
  getAllFolders() {
    return Array.from(this.folders.values());
  }

  /**
   * Get folder children
   * @param {string} parentId - Parent folder ID
   * @returns {Object} Object with folders and assets
   */
  getFolderChildren(parentId) {
    return {
      folders: Array.from(this.folders.values()).filter(
        folder => folder.parentId === parentId
      ),
      assets: this.getAssetsByFolder(parentId),
    };
  }

  /**
   * Update folder
   * @param {string} id - Folder ID
   * @param {Object} updates - Updates to apply
   */
  updateFolder(id, updates) {
    const folder = this.folders.get(id);
    if (!folder) return;

    Object.assign(folder, updates);
    this.folders.set(id, folder);
    this.notifyListeners('folder:updated', folder);
  }

  /**
   * Delete folder
   * @param {string} id - Folder ID
   */
  deleteFolder(id) {
    if (id === 'root') {
      throw new Error('Cannot delete root folder');
    }

    // Move assets to parent folder
    const folder = this.folders.get(id);
    if (folder) {
      const assets = this.getAssetsByFolder(id);
      assets.forEach(asset => {
        this.updateAsset(asset.id, { folderId: folder.parentId });
      });
    }

    this.folders.delete(id);
    this.notifyListeners('folder:deleted', { id });
  }

  /**
   * Get all tags
   * @returns {Array} Array of unique tags
   */
  getAllTags() {
    const tagSet = new Set();
    this.assets.forEach(asset => {
      asset.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }

  /**
   * Get asset statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const assets = Array.from(this.assets.values());
    
    return {
      totalAssets: assets.length,
      byType: {
        image: assets.filter(a => a.type === 'image').length,
        video: assets.filter(a => a.type === 'video').length,
        pdf: assets.filter(a => a.type === 'pdf').length,
        svg: assets.filter(a => a.type === 'svg').length,
        icon: assets.filter(a => a.type === 'icon').length,
        zip: assets.filter(a => a.type === 'zip').length,
      },
      totalFolders: this.folders.size,
      totalTags: this.getAllTags().length,
      favorites: assets.filter(a => a.favorites).length,
      totalSize: assets.reduce((sum, asset) => sum + (asset.size || 0), 0),
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Subscribe to events
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
   * Notify listeners of events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      listener(event, data);
    });
  }
}

// Singleton instance
const assetLibraryManager = new AssetLibraryManager();

export default assetLibraryManager;
export { AssetLibraryManager };
