/**
 * KeyboardShortcuts Component
 * Handles keyboard shortcuts for the builder
 */

import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useBuilderActions, useBuilderSelection, useBuilderPage } from '../core/BuilderStore.jsx';

export default function KeyboardShortcuts({ builderStore }) {
  const { selectedNodeId } = useBuilderSelection();
  const { deleteNode, duplicateNode, updateNode, loadPage } = useBuilderActions();
  const page = useBuilderPage();
  
  // Simple snapshot-based undo/redo stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const maxHistory = 50;
  const isUndoRedoAction = useRef(false); // Flag to prevent auto-save during undo/redo
  const lastSavedState = useRef(null);

  // Save current state as snapshot
  const saveSnapshot = () => {
    if (page?.root && !isUndoRedoAction.current) {
      const currentState = JSON.stringify(page.root);
      // Only save if different from last saved state
      if (currentState !== lastSavedState.current) {
        undoStack.current.push(JSON.parse(JSON.stringify(page.root)));
        lastSavedState.current = currentState;
        if (undoStack.current.length > maxHistory) {
          undoStack.current.shift();
        }
        redoStack.current = []; // Clear redo on new user action
        console.log('[Undo] Snapshot saved. Stack size:', undoStack.current.length);
      }
    }
  };

  // Save initial state on mount
  useEffect(() => {
    if (page?.root) {
      const initialState = JSON.parse(JSON.stringify(page.root));
      undoStack.current = [initialState];
      lastSavedState.current = JSON.stringify(page.root);
      console.log('[Undo] Initial state saved');
    }
  }, []); // Only run once on mount

  // Auto-save snapshot on page changes (debounced)
  useEffect(() => {
    // Skip auto-save if we're in an undo/redo operation
    if (isUndoRedoAction.current) {
      console.log('[Undo] Auto-save blocked during undo/redo');
      return;
    }

    const timeoutId = setTimeout(() => {
      if (page?.root && !isUndoRedoAction.current) {
        const currentState = JSON.stringify(page.root);
        // Only save if state actually changed from last saved
        if (currentState !== lastSavedState.current) {
          undoStack.current.push(JSON.parse(JSON.stringify(page.root)));
          lastSavedState.current = currentState;
          if (undoStack.current.length > maxHistory) {
            undoStack.current.shift();
          }
          // NEVER clear redo stack from auto-save
          // Redo should only be cleared on explicit user actions (drag, drop, edit)
          // Auto-save is just persistence, not a new user action
          console.log('[Undo] Auto-save. Stack:', undoStack.current.length, 'Redo:', redoStack.current.length, '(redo preserved)');
        }
      } else if (isUndoRedoAction.current) {
        console.log('[Undo] Auto-save skipped - undo/redo in progress');
      }
    }, 1000); // 1000ms debounce

    return () => clearTimeout(timeoutId);
  }, [page?.root]); // Watch for page changes

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if we're in an input field
      const isInputField = (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      );

      // Allow ALL keyboard shortcuts in input fields EXCEPT Delete/Backspace for node deletion
      // This allows Ctrl+C, Ctrl+V, Ctrl+Z, etc. to work normally in text fields
      if (isInputField) {
        // Only prevent these specific builder shortcuts in input fields:
        const ctrlKey = e.ctrlKey || e.metaKey;
        
        // Allow Delete/Backspace in input fields (don't prevent)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          return; // Let browser handle it normally
        }
        
        // Allow Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z for native undo/redo in inputs
        if (ctrlKey && (e.key === 'z' || e.key === 'y')) {
          return; // Let browser handle it normally
        }
        
        // Allow Ctrl+C, Ctrl+V, Ctrl+X for native copy/paste in inputs
        if (ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
          return; // Let browser handle it normally
        }
        
        // Block other builder-specific shortcuts when in input
        if (ctrlKey && e.key === 'd') {
          e.preventDefault();
          return;
        }
        
        return; // Allow all other keys in inputs
      }

      // Below this point: keyboard shortcuts for canvas/builder actions only
      const ctrlKey = e.ctrlKey || e.metaKey;
      const shiftKey = e.shiftKey;

      // Undo: Ctrl + Z (canvas-level only)
      if (ctrlKey && !shiftKey && e.key === 'z') {
        e.preventDefault();
        console.log('[Undo] Triggered. Stack:', undoStack.current.length, 'Redo:', redoStack.current.length);
        
        if (undoStack.current.length > 1) {
          // Set flag to prevent auto-save
          isUndoRedoAction.current = true;
          
          // Move current state to redo stack
          const currentState = undoStack.current.pop();
          redoStack.current.push(currentState);
          
          // Restore previous state
          const previousState = undoStack.current[undoStack.current.length - 1];
          loadPage({ root: JSON.parse(JSON.stringify(previousState)) });
          lastSavedState.current = JSON.stringify(previousState);
          
          message.success('Undo successful');
          console.log('[Undo] After undo. Stack:', undoStack.current.length, 'Redo:', redoStack.current.length);
          
          // Reset flag after sufficient delay to allow all effects to complete
          setTimeout(() => {
            isUndoRedoAction.current = false;
            console.log('[Undo] Flag reset');
          }, 1500); // Increased to 1500ms to prevent auto-save from clearing redo
        } else {
          message.info('Nothing to undo');
        }
      }

      // Redo: Ctrl + Shift + Z or Ctrl + Y
      if ((ctrlKey && shiftKey && e.key === 'z') || (ctrlKey && e.key === 'y')) {
        e.preventDefault();
        console.log('[Redo] Triggered. Stack:', undoStack.current.length, 'Redo:', redoStack.current.length);
        
        if (redoStack.current.length > 0) {
          // Set flag to prevent auto-save
          isUndoRedoAction.current = true;
          
          // Move state from redo to undo stack
          const nextState = redoStack.current.pop();
          undoStack.current.push(nextState);
          
          // Restore next state
          loadPage({ root: JSON.parse(JSON.stringify(nextState)) });
          lastSavedState.current = JSON.stringify(nextState);
          
          message.success('Redo successful');
          console.log('[Redo] After redo. Stack:', undoStack.current.length, 'Redo:', redoStack.current.length);
          
          // Reset flag after sufficient delay
          setTimeout(() => {
            isUndoRedoAction.current = false;
            console.log('[Redo] Flag reset');
          }, 1500); // Increased to 1500ms
        } else {
          message.info('Nothing to redo');
        }
      }

      // Copy: Ctrl + C
      if (ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (selectedNodeId) {
          const node = findNode(page.root, selectedNodeId);
          if (node) {
            clipboardManager.copyNode(node);
            message.success('Copied to clipboard');
          }
        }
      }

      // Paste: Ctrl + V
      if (ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (clipboardManager.hasContent()) {
          const pasted = clipboardManager.paste();
          if (pasted) {
            // Add pasted content to the page
            // This would need to be implemented in BuilderStore
            message.success('Pasted from clipboard');
          }
        } else {
          message.info('Clipboard is empty');
        }
      }

      // Duplicate: Ctrl + D
      if (ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (selectedNodeId) {
          duplicateNode(selectedNodeId);
          redoStack.current = []; // Clear redo on new action
          message.success('Duplicated');
        }
      }

      // Cut: Ctrl + X
      if (ctrlKey && e.key === 'x') {
        e.preventDefault();
        if (selectedNodeId) {
          const node = findNode(page.root, selectedNodeId);
          if (node) {
            clipboardManager.cutNode(node);
            deleteNode(selectedNodeId);
            redoStack.current = []; // Clear redo on new action
            message.success('Cut to clipboard');
          }
        }
      }

      // Delete: Delete or Backspace (only when NOT in input field)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
          redoStack.current = []; // Clear redo on new action
          message.success('Deleted');
        }
      }

      // Escape: Deselect
      if (e.key === 'Escape') {
        // Deselect current node
        // This would need to be implemented in BuilderStore
      }

      // Arrow keys: Navigate (placeholder for future implementation)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Navigate between nodes
        // This would need to be implemented in BuilderStore
      }

      // Tab: Navigate to next field/element
      if (e.key === 'Tab') {
        // Navigate to next element
        // This would need to be implemented in BuilderStore
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, page, builderStore]);

  // Helper function to find a node by ID
  const findNode = (node, id) => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  return null; // This component doesn't render anything
}

// Hook for using keyboard shortcuts
export function useKeyboardShortcuts(builderStore) {
  return <KeyboardShortcuts builderStore={builderStore} />;
}
