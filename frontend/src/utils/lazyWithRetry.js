import React from 'react';

/**
 * Lazy load a component with automatic one-time retry on dynamic import failure.
 * Prevents broken states after new production deployments where chunk hashes change.
 * Will NOT reload endlessly if there is a genuine module error.
 */
export function lazyWithRetry(componentImport) {
  return React.lazy(async () => {
    const hasReloaded = sessionStorage.getItem('chunk_retry_' + window.location.pathname) === 'true';
    try {
      const component = await componentImport();
      sessionStorage.removeItem('chunk_retry_' + window.location.pathname);
      return component;
    } catch (error) {
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_retry_' + window.location.pathname, 'true');
        window.location.reload();
        return new Promise(() => {}); // Pause while reloading
      }
      sessionStorage.removeItem('chunk_retry_' + window.location.pathname);
      throw error;
    }
  });
}

export default lazyWithRetry;
