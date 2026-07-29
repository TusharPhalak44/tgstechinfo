/**
 * Builder Store
 * Centralized state management using React Context
 * Provides builder state to all components
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import builderEngine from './BuilderEngine';
import builderEvents from './BuilderEvents';
import { BuilderEventType, defaultBuilderTheme } from '../utils/types';
import { blankTemplate } from '../templates/blank';
import { registerAllWidgets } from '../registry/registerWidgets';

const clonePage = (page) => (page ? JSON.parse(JSON.stringify(page)) : null);

// Initial state
const initialState = {
  page: null,
  selection: {
    selectedNodeId: null,
    hoveredNodeId: null,
    draggedNodeId: null,
  },
  clipboard: {
    nodes: [],
    copiedAt: null,
  },
  history: {
    past: [],
    present: null,
    future: [],
  },
  responsiveMode: 'desktop',
  theme: defaultBuilderTheme,
  isLoading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_PAGE: 'SET_PAGE',
  UPDATE_PAGE: 'UPDATE_PAGE',
  SELECT_NODE: 'SELECT_NODE',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_HOVERED_NODE: 'SET_HOVERED_NODE',
  SET_DRAGGED_NODE: 'SET_DRAGGED_NODE',
  CLEAR_DRAGGED_NODE: 'CLEAR_DRAGGED_NODE',
  COPY_NODES: 'COPY_NODES',
  PASTE_NODES: 'PASTE_NODES',
  SET_RESPONSIVE_MODE: 'SET_RESPONSIVE_MODE',
  SET_THEME: 'SET_THEME',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET',
};

// Reducer
function builderReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_PAGE:
      return {
        ...state,
        page: action.payload,
        history: {
          past: [],
          present: action.payload,
          future: [],
        },
      };
    
    case ActionTypes.UPDATE_PAGE:
      return {
        ...state,
        page: action.payload,
        history: {
          ...state.history,
          present: action.payload,
        },
      };
    
    case ActionTypes.SELECT_NODE:
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedNodeId: action.payload,
        },
      };
    
    case ActionTypes.CLEAR_SELECTION:
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedNodeId: null,
        },
      };
    
    case ActionTypes.SET_HOVERED_NODE:
      return {
        ...state,
        selection: {
          ...state.selection,
          hoveredNodeId: action.payload,
        },
      };
    
    case ActionTypes.SET_DRAGGED_NODE:
      return {
        ...state,
        selection: {
          ...state.selection,
          draggedNodeId: action.payload,
        },
      };
    
    case ActionTypes.CLEAR_DRAGGED_NODE:
      return {
        ...state,
        selection: {
          ...state.selection,
          draggedNodeId: null,
        },
      };
    
    case ActionTypes.COPY_NODES:
      return {
        ...state,
        clipboard: action.payload,
      };
    
    case ActionTypes.PASTE_NODES:
      return {
        ...state,
        clipboard: {
          ...state.clipboard,
          nodes: [],
          copiedAt: null,
        },
      };
    
    case ActionTypes.SET_RESPONSIVE_MODE:
      return {
        ...state,
        responsiveMode: action.payload,
      };
    
    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    
    case ActionTypes.RESET:
      return initialState;
    
    default:
      return state;
  }
}

// Create context
const BuilderContext = createContext(null);

// Provider component
export function BuilderProvider({ children }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  // Register widgets on provider mount (only once globally)
  useEffect(() => {
    if (!window.__widgetsRegistered) {
      registerAllWidgets();
      window.__widgetsRegistered = true;
      console.log('[BuilderProvider] Widgets registered');
    }
  }, []);

  // Sync selection from engine
  useEffect(() => {
    const unsubscribeNodeSelected = builderEvents.subscribe(
      BuilderEventType.NODE_SELECTED,
      (event) => {
        dispatch({ type: ActionTypes.SELECT_NODE, payload: event.payload.nodeId });
      }
    );

    const unsubscribePageLoaded = builderEvents.subscribe(
      BuilderEventType.PAGE_LOADED,
      () => {
        const page = builderEngine.getPage();
        if (page) {
          dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(page) });
        }
      }
    );

    return () => {
      unsubscribeNodeSelected();
      unsubscribePageLoaded();
    };
  }, []);

  // Actions
  const actions = {
    loadPage: useCallback((data) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        builderEngine.loadPage(data);
        const page = clonePage(builderEngine.getPage());
        dispatch({ type: ActionTypes.SET_PAGE, payload: page });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }, []),

    selectNode: useCallback((nodeId) => {
      builderEngine.selectNode(nodeId);
    }, []),

    clearSelection: useCallback(() => {
      builderEngine.clearSelection();
    }, []),

    setHoveredNode: useCallback((nodeId) => {
      builderEngine.setHoveredNode(nodeId);
      dispatch({ type: ActionTypes.SET_HOVERED_NODE, payload: nodeId });
    }, []),

    setDraggedNode: useCallback((nodeId) => {
      builderEngine.setDraggedNode(nodeId);
      dispatch({ type: ActionTypes.SET_DRAGGED_NODE, payload: nodeId });
    }, []),

    clearDraggedNode: useCallback(() => {
      builderEngine.clearDraggedNode();
      dispatch({ type: ActionTypes.CLEAR_DRAGGED_NODE });
    }, []),

    copyNodes: useCallback((nodeIds) => {
      builderEngine.copyNodes(nodeIds);
      dispatch({ type: ActionTypes.COPY_NODES, payload: builderEngine.clipboard });
    }, []),

    pasteNodes: useCallback((parentId, index) => {
      const newIds = builderEngine.pasteNodes(parentId, index);
      dispatch({ type: ActionTypes.PASTE_NODES });
      return newIds;
    }, []),

    ensurePage: useCallback(() => {
      if (!builderEngine.getPage()) {
        builderEngine.loadPage(JSON.parse(JSON.stringify(blankTemplate)));
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(builderEngine.getPage()) });
      }
      return builderEngine.getPage();
    }, []),

    duplicateNode: useCallback((nodeId) => {
      const newId = builderEngine.duplicateNode(nodeId);
      const page = builderEngine.getPage();
      if (page) {
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(page) });
      }
      return newId;
    }, []),

    deleteNode: useCallback((nodeId) => {
      builderEngine.deleteNode(nodeId);
      const page = builderEngine.getPage();
      if (page) {
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(page) });
      }
    }, []),

    updateNode: useCallback((nodeId, updates) => {
      builderEngine.updateNode(nodeId, updates);
      const page = builderEngine.getPage();
      if (page) {
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(page) });
      }
    }, []),

    addNode: useCallback((nodeData, parentId, index) => {
      const newId = builderEngine.addNode(nodeData, parentId, index);
      const page = builderEngine.getPage();
      if (page) {
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(page) });
      }
      return newId;
    }, []),

    moveNode: useCallback((nodeId, newParentId, newIndex) => {
      builderEngine.moveNode(nodeId, newParentId, newIndex);
      const page = builderEngine.getPage();
      if (page) {
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(page) });
      }
    }, []),

    setResponsiveMode: useCallback((mode) => {
      builderEngine.setResponsiveMode(mode);
      dispatch({ type: ActionTypes.SET_RESPONSIVE_MODE, payload: mode });
    }, []),

    setTheme: useCallback((theme) => {
      builderEngine.setTheme(theme);
      dispatch({ type: ActionTypes.SET_THEME, payload: theme });
    }, []),

    serialize: useCallback((useLegacyFormat = false) => {
      return builderEngine.serialize(useLegacyFormat);
    }, []),

    reset: useCallback(() => {
      builderEngine.reset();
      dispatch({ type: ActionTypes.RESET });
    }, []),

    loadTemplate: useCallback(async (templateId) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        await builderEngine.loadTemplate(templateId);
        const page = clonePage(builderEngine.getPage());
        dispatch({ type: ActionTypes.SET_PAGE, payload: page });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }, []),

    findNode: useCallback((nodeId) => {
      const page = builderEngine.getPage();
      if (!page || !page.root) return null;
      return builderEngine.findNode(page.root, nodeId);
    }, []),

    findParentNode: useCallback((nodeId) => {
      const page = builderEngine.getPage();
      if (!page || !page.root) return null;
      return builderEngine.findParentNode(page.root, nodeId);
    }, []),

    findNodeIndex: useCallback((nodeId) => {
      return builderEngine.findNodeIndex(nodeId);
    }, []),

    appendTemplate: useCallback(async (templateId) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const currentPage = builderEngine.getPage();
        const originalChildren = currentPage && currentPage.root && currentPage.root.children
          ? JSON.parse(JSON.stringify(currentPage.root.children))
          : [];
        await builderEngine.loadTemplate(templateId);
        const newPage = builderEngine.getPage();
        if (newPage && newPage.root) {
          newPage.root.children = [
            ...originalChildren,
            ...(newPage.root.children || []),
          ];
        }
        dispatch({ type: ActionTypes.SET_PAGE, payload: clonePage(newPage) });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }, []),
  };

  const value = {
    state,
    actions,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

// Hook to use builder store
export function useBuilderStore() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilderStore must be used within a BuilderProvider');
  }
  return context;
}

// Hook to use builder state
export function useBuilderState() {
  const { state } = useBuilderStore();
  return state;
}

// Hook to use builder actions
export function useBuilderActions() {
  const { actions } = useBuilderStore();
  return actions;
}

// Hook to use page
export function useBuilderPage() {
  const state = useBuilderState();
  return state.page;
}

// Hook to use selection
export function useBuilderSelection() {
  const state = useBuilderState();
  return state.selection;
}

// Hook to use responsive mode
export function useResponsiveMode() {
  const state = useBuilderState();
  return state.responsiveMode;
}

// Hook to use theme
export function useBuilderTheme() {
  const state = useBuilderState();
  return state.theme;
}
