/**
 * ClipboardManager
 * Manages clipboard operations for the builder
 */

class ClipboardManager {
  constructor() {
    this.clipboard = null;
    this.clipboardType = null; // 'node' or 'nodes'
  }

  /**
   * Copy a single node to clipboard
   */
  copyNode(node) {
    this.clipboard = JSON.parse(JSON.stringify(node));
    this.clipboardType = 'node';
    console.log('Node copied to clipboard:', node.id);
    return true;
  }

  /**
   * Copy multiple nodes to clipboard
   */
  copyNodes(nodes) {
    this.clipboard = nodes.map(node => JSON.parse(JSON.stringify(node)));
    this.clipboardType = 'nodes';
    console.log('Nodes copied to clipboard:', nodes.length);
    return true;
  }

  /**
   * Cut a node (copy and prepare for deletion)
   */
  cutNode(node) {
    this.clipboard = JSON.parse(JSON.stringify(node));
    this.clipboardType = 'node';
    console.log('Node cut to clipboard:', node.id);
    return true;
  }

  /**
   * Cut multiple nodes
   */
  cutNodes(nodes) {
    this.clipboard = nodes.map(node => JSON.parse(JSON.stringify(node)));
    this.clipboardType = 'nodes';
    console.log('Nodes cut to clipboard:', nodes.length);
    return true;
  }

  /**
   * Paste from clipboard
   */
  paste() {
    if (!this.clipboard) {
      console.warn('Clipboard is empty');
      return null;
    }

    // Generate new IDs for pasted content to avoid conflicts
    const generateNewId = (oldId) => {
      return `${oldId}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const regenerateIds = (node) => {
      const newNode = JSON.parse(JSON.stringify(node));
      newNode.id = generateNewId(newNode.id);
      
      if (newNode.children) {
        newNode.children = newNode.children.map(child => regenerateIds(child));
      }
      
      return newNode;
    };

    if (this.clipboardType === 'node') {
      return regenerateIds(this.clipboard);
    } else if (this.clipboardType === 'nodes') {
      return this.clipboard.map(node => regenerateIds(node));
    }

    return null;
  }

  /**
   * Check if clipboard has content
   */
  hasContent() {
    return this.clipboard !== null;
  }

  /**
   * Get clipboard type
   */
  getClipboardType() {
    return this.clipboardType;
  }

  /**
   * Clear clipboard
   */
  clear() {
    this.clipboard = null;
    this.clipboardType = null;
  }

  /**
   * Get clipboard info for debugging
   */
  getClipboardInfo() {
    return {
      hasContent: this.hasContent(),
      type: this.clipboardType,
      itemCount: this.clipboardType === 'nodes' ? this.clipboard.length : (this.clipboard ? 1 : 0),
    };
  }
}

// Singleton instance
const clipboardManager = new ClipboardManager();

export default clipboardManager;
export { ClipboardManager };
