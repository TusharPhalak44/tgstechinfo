/**
 * UndoRedoManager
 * Manages command history for undo/redo operations in the builder
 */

class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
    this.listeners = [];
  }

  /**
   * Execute a command and add it to history
   * @param {Object} command - Command object with execute, undo, and description
   */
  execute(command) {
    try {
      // Execute the command
      command.execute();
      
      // Add to undo stack
      this.undoStack.push({
        ...command,
        timestamp: Date.now(),
      });
      
      // Clear redo stack on new command
      this.redoStack = [];
      
      // Limit history size
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Command execution failed:', error);
      return false;
    }
  }

  /**
   * Undo the last command
   */
  undo() {
    if (this.undoStack.length === 0) {
      return false;
    }

    const command = this.undoStack.pop();
    
    try {
      command.undo();
      
      // Add to redo stack
      this.redoStack.push(command);
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      // Put command back in undo stack if undo fails
      this.undoStack.push(command);
      return false;
    }
  }

  /**
   * Redo the last undone command
   */
  redo() {
    if (this.redoStack.length === 0) {
      return false;
    }

    const command = this.redoStack.pop();
    
    try {
      command.execute();
      
      // Add back to undo stack
      this.undoStack.push(command);
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      // Put command back in redo stack if redo fails
      this.redoStack.push(command);
      return false;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get the last command description
   */
  getLastCommandDescription() {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  /**
   * Add a listener for history changes
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of history changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        lastCommand: this.getLastCommandDescription(),
      });
    });
  }

  /**
   * Get history for debugging
   */
  getHistory() {
    return {
      undoStack: this.undoStack.map(cmd => ({
        description: cmd.description,
        timestamp: cmd.timestamp,
      })),
      redoStack: this.redoStack.map(cmd => ({
        description: cmd.description,
        timestamp: cmd.timestamp,
      })),
    };
  }
}

// Singleton instance
const undoRedoManager = new UndoRedoManager();

export default undoRedoManager;
export { UndoRedoManager };
