/**
 * CommandFactory
 * Factory for creating builder commands for undo/redo
 */

export class CommandFactory {
  /**
   * Create a move node command
   */
  static createMoveCommand(builderStore, nodeId, fromParentId, fromIndex, toParentId, toIndex) {
    return {
      description: 'Move element',
      execute: () => {
        builderStore.moveNode(nodeId, toParentId, toIndex);
      },
      undo: () => {
        builderStore.moveNode(nodeId, fromParentId, fromIndex);
      },
    };
  }

  /**
   * Create a delete node command
   */
  static createDeleteCommand(builderStore, node, parentId, index) {
    return {
      description: 'Delete element',
      execute: () => {
        builderStore.deleteNode(node.id);
      },
      undo: () => {
        builderStore.addNode(node, parentId, index);
      },
    };
  }

  /**
   * Create a duplicate node command
   */
  static createDuplicateCommand(builderStore, originalNodeId, newNodeId, parentId, index) {
    return {
      description: 'Duplicate element',
      execute: () => {
        builderStore.duplicateNode(originalNodeId);
      },
      undo: () => {
        builderStore.deleteNode(newNodeId);
      },
    };
  }

  /**
   * Create an add node command
   */
  static createAddCommand(builderStore, node, parentId, index) {
    return {
      description: 'Add element',
      execute: () => {
        builderStore.addNode(node, parentId, index);
      },
      undo: () => {
        builderStore.deleteNode(node.id);
      },
    };
  }

  /**
   * Create a resize command
   */
  static createResizeCommand(builderStore, nodeId, oldStyles, newStyles) {
    return {
      description: 'Resize element',
      execute: () => {
        builderStore.updateNode(nodeId, { styles: newStyles });
      },
      undo: () => {
        builderStore.updateNode(nodeId, { styles: oldStyles });
      },
    };
  }

  /**
   * Create an edit content command
   */
  static createEditContentCommand(builderStore, nodeId, oldContent, newContent) {
    return {
      description: 'Edit content',
      execute: () => {
        builderStore.updateNode(nodeId, { content: newContent });
      },
      undo: () => {
        builderStore.updateNode(nodeId, { content: oldContent });
      },
    };
  }

  /**
   * Create a template load command
   */
  static createTemplateLoadCommand(builderStore, oldPage, newPage) {
    return {
      description: 'Load template',
      execute: () => {
        builderStore.setPage(newPage);
      },
      undo: () => {
        builderStore.setPage(oldPage);
      },
    };
  }

  /**
   * Create a property change command
   */
  static createPropertyChangeCommand(builderStore, nodeId, oldProperties, newProperties) {
    return {
      description: 'Change properties',
      execute: () => {
        builderStore.updateNode(nodeId, newProperties);
      },
      undo: () => {
        builderStore.updateNode(nodeId, oldProperties);
      },
    };
  }

  /**
   * Create a batch command (multiple operations)
   */
  static createBatchCommand(commands, description = 'Batch operation') {
    return {
      description,
      execute: () => {
        commands.forEach(cmd => cmd.execute());
      },
      undo: () => {
        // Undo in reverse order
        [...commands].reverse().forEach(cmd => cmd.undo());
      },
    };
  }
}

export default CommandFactory;
