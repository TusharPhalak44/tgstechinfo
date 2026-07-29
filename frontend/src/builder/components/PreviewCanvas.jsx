/**
 * PreviewCanvas Component
 * Renders the current builder page tree in pure "published" output mode.
 * No drag handles, no selection outlines, no toolbars — just the rendered content.
 */

import React from 'react';
import { useBuilderPage } from '../core/BuilderStore.jsx';
import widgetRegistry from '../registry/WidgetRegistry';
import FallbackRenderer from './FallbackRenderer';
import WidgetErrorBoundary from './WidgetErrorBoundary';

const LAYOUT_TYPES = new Set(['page', 'section', 'container', 'column',
  'column-1', 'column-2', 'column-3', 'column-4']);

// ─── Column width computation (mirrors CanvasNode logic) ─────────────────────
function columnStyle(node, siblingCount) {
  const count = node?.settings?.columnCount || siblingCount || 1;
  return {
    flex: `0 0 ${100 / count}%`,
    maxWidth: `${100 / count}%`,
    boxSizing: 'border-box',
    padding: '0 8px',
  };
}

function hasColumnChildren(node) {
  if (!node?.children?.length) return false;
  if (['column-1','column-2','column-3','column-4'].includes(node.type)) return true;
  if (node.type === 'container' || node.type === 'section') {
    return node.children.every(c => c.type === 'column');
  }
  return false;
}

// ─── Recursive node renderer ─────────────────────────────────────────────────
function PreviewNode({ node }) {
  if (!node) return null;

  const isLayout = LAYOUT_TYPES.has(node.type);
  const widget   = isLayout ? null : widgetRegistry.get(node.type);
  const Renderer = widget?.renderer || widget?.component;

  // Layout containers — just a styled wrapper, children rendered recursively
  if (isLayout) {
    const wrapStyle = getLayoutStyle(node.type, node.styles);
    const asColumns = hasColumnChildren(node);

    return (
      <div style={wrapStyle} data-preview-type={node.type}>
        {asColumns ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -8px' }}>
            {node.children.map((child, idx) => (
              <div key={child.id} style={columnStyle(child, node.children.length)}>
                <PreviewNode node={child} />
              </div>
            ))}
          </div>
        ) : (
          (node.children || []).map(child => (
            <PreviewNode key={child.id} node={child} />
          ))
        )}
      </div>
    );
  }

  // Widget node
  if (!Renderer) {
    return <FallbackRenderer node={node} error={`Widget type "${node.type}" is not registered`} />;
  }

  return (
    <WidgetErrorBoundary>
      <Renderer node={node} />
    </WidgetErrorBoundary>
  );
}

function getLayoutStyle(type, extraStyles = {}) {
  const base = { width: '100%', boxSizing: 'border-box', ...extraStyles };
  switch (type) {
    case 'section':    return { ...base, padding: '32px 16px' };
    case 'container':  return { ...base, padding: '16px', maxWidth: 1100, margin: '0 auto' };
    case 'column':     return { ...base, padding: '8px' };
    default:           return base;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────
export default function PreviewCanvas() {
  const page = useBuilderPage();

  if (!page || !page.root) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        No content to preview. Add some widgets first.
      </div>
    );
  }

  const children = page.root.children || [];
  if (children.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        Empty page — add sections and widgets to see a preview.
      </div>
    );
  }

  return (
    <div className="preview-canvas" style={{ background: '#fff', minHeight: '60vh' }}>
      {children.map(node => (
        <PreviewNode key={node.id} node={node} />
      ))}
    </div>
  );
}
