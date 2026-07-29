/**
 * Performance Utilities
 * Memoization, debouncing, and lazy loading utilities
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Debounce hook
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounce(func, delay = 300) {
  const timeoutRef = useRef(null);

  const debouncedFunc = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
}

/**
 * Throttle hook
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function useThrottle(func, limit = 100) {
  const inThrottle = useRef(false);

  return useCallback((...args) => {
    if (!inThrottle.current) {
      func(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [func, limit]);
}

/**
 * Memoize expensive computations
 * @param {Function} computeFn - Computation function
 * @param {Array} dependencies - Dependency array
 * @returns {any} Memoized result
 */
export function useMemoized(computeFn, dependencies) {
  return useMemo(computeFn, dependencies);
}

/**
 * Lazy load component
 * @param {Function} importFn - Import function
 * @param {Object} options - Loading options
 * @returns {React.Component} Lazy loaded component
 */
export function lazyLoad(importFn, options = {}) {
  return React.lazy(() => importFn().catch(() => {
    console.error('Failed to load component');
    return options.fallback || { default: () => null };
  }));
}

/**
 * Virtual list hook for large lists
 * @param {Array} items - Items to virtualize
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @returns {Object} Virtual list data
 */
export function useVirtualList(items, itemHeight = 50, containerHeight = 400) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 5, items.length);
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    containerRef,
  };
}

/**
 * Request animation frame hook
 * @param {Function} callback - Callback function
 * @returns {Function} Cancel function
 */
export function useRaf(callback) {
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      callback();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [callback]);

  return () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };
}

/**
 * Intersection observer hook for lazy loading
 * @param {Function} callback - Callback when element is visible
 * @param {Object} options - Intersection observer options
 * @returns {Object} Observer ref and isIntersecting
 */
export function useIntersectionObserver(callback, options = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && callback) {
        callback(entry);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [callback, options]);

  return { ref, isIntersecting };
}

/**
 * Batch updates hook
 * @param {Function} updateFn - Update function
 * @param {number} delay - Batch delay in milliseconds
 * @returns {Function} Batched update function
 */
export function useBatchUpdates(updateFn, delay = 100) {
  const batchRef = useRef([]);
  const timeoutRef = useRef(null);

  const batchUpdate = useCallback((item) => {
    batchRef.current.push(item);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (batchRef.current.length > 0) {
        updateFn(batchRef.current);
        batchRef.current = [];
      }
    }, delay);
  }, [updateFn, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (batchRef.current.length > 0) {
          updateFn(batchRef.current);
        }
      }
    };
  }, [updateFn]);

  return batchUpdate;
}

/**
 * Memoize component with custom comparison
 * @param {React.Component} Component - Component to memoize
 * @param {Function} areEqual - Custom comparison function
 * @returns {React.Component} Memoized component
 */
export function memoize(Component, areEqual) {
  return React.memo(Component, areEqual);
}

/**
 * Deep memoization for objects
 * @param {Function} computeFn - Computation function
 * @param {Array} dependencies - Dependency array
 * @returns {any} Deep memoized result
 */
export function useDeepMemo(computeFn, dependencies) {
  const prevDeps = useRef(dependencies);
  const prevResult = useRef(computeFn());

  const areDepsEqual = dependencies.every((dep, i) => {
    return JSON.stringify(dep) === JSON.stringify(prevDeps.current[i]);
  });

  if (!areDepsEqual) {
    prevDeps.current = dependencies;
    prevResult.current = computeFn();
  }

  return prevResult.current;
}

export default {
  useDebounce,
  useThrottle,
  useMemoized,
  lazyLoad,
  useVirtualList,
  useRaf,
  useIntersectionObserver,
  useBatchUpdates,
  memoize,
  useDeepMemo,
};
