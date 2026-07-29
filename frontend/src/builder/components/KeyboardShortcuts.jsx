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

  // Save current state as snapshot
  const saveSnapshot = () => {
    if (page?.root) {
      undoStack.current.push(JSON.parse(JSON.stringify(page.root)));
      if (undoStack.current.length > maxHistory) {
        undoStack.current.shift();
      }
      redoStack.current = []; // Clear redo on new action
    }
  };

  // Save initial state on mount
  useEffect(() => {
    if (page?.root) {
      undoStack.current.push(JSON.parse(JSON.stringify(page.root)));
    }
  }, []); // Only run once on mount

  // Auto-save snapshot on page changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page?.root) {
        const currentState = JSON.stringify(page.root);
        const lastState = undoStack.current.length > 0
          ? JSON.stringify(undoStack.current[undoStack.current.length - 1])
          : null;
        // Only save if state actually changed
        if (currentState !== lastState) {
          undoStack.current.push(JSON.parse(JSON.stringify(page.root)));
          if (undoStack.current.length > maxHistory) {
            undoStack.current.shift();
          }
          redoStack.current = []; // Clear redo on new action
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [page?.root]); // Watch for page changes

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      const ctrlKey = e.ctrlKey || e.metaKey;
      const shiftKey = e.shiftKey;

      // Undo: Ctrl + Z
      if (ctrlKey && !shiftKey && e.key === 'z') {
        e.preventDefault();
        if (undoStack.current.length > 1) {
          // Save current state to redo stack
          redoStack.current.push(undoStack.current.pop());
          // Restore previous state
          const previousState = undoStack.current[undoStack.current.length - 1];
          loadPage({ root: JSON.parse(JSON.stringify(previousState)) });
          message.success('Undo successful');
        } else {
          message.info('Nothing to undo');
        }
      }

      // Redo: Ctrl + Shift + Z or Ctrl + Y
      if ((ctrlKey && shiftKey && e.key === 'z') || (ctrlKey && e.key === 'y')) {
        e.preventDefault();
        if (redoStack.current.length > 0) {
          const nextState = redoStack.current.pop();
          undoStack.current.push(nextState);
          loadPage({ root: JSON.parse(JSON.stringify(nextState)) });
          message.success('Redo successful');
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
            message.success('Cut to clipboard');
          }
        }
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
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
