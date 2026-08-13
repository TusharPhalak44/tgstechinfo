import React from 'react';
import { Tag, Typography } from 'antd';
import { TagOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Lazy load BuilderPageRenderer to avoid circular dependencies
const BuilderPageRenderer = React.lazy(() => import('./BuilderPageRenderer'));

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

// Returns ordered list of section keys based on builder_layout
const getSectionOrder = (builderLayout) => {
  if (!builderLayout) return null;
  try {
    const layout = typeof builderLayout === 'string' ? JSON.parse(builderLayout) : builderLayout;
    if (!Array.isArray(layout) || layout.length === 0) return null;

    // Standard layout: array of strings ['meta','banner','title','content']
    if (typeof layout[0] === 'string') return layout;

    // Builder layout: array of objects [{id,type}, ...]
    // Map builder section types to render keys
    const typeMap = {
      content_type_category: 'meta',
      title_description: 'title',
      banner_image: 'banner',
      content: 'content',
      tags: 'tags',
    };
    return layout.map(s => typeMap[s.type]).filter(Boolean);
  } catch { return null; }
};

// Strip <a> tags but keep their inner text
const stripLinks = (html = '') =>
  html.replace(/<a\b[^>]*>(.*?)<\/a>/gis, '$1');

// Restore two-col layout: replace <div data-raw-html="..."> with actual innerHTML
const restoreRawHtml = (html = '') =>
  html.replace(
    /<div class="two-col-layout"[^>]*data-raw-html="([^"]*?)"[^>]*><\/div>/gi,
    (_, encoded) => {
      const inner = encoded.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      return `<div class="two-col-layout" style="display:flex;flex-direction:row;gap:24px;align-items:flex-start;margin:16px 0;">${inner}</div>`;
    }
  );

/**
 * Renders content sections in the order defined by builder_layout.
 * Falls back to default order if no layout saved.
 *
 * Props:
 *   content        — the content object from API
 *   renderBanner   — optional custom banner renderer (src, alt) => JSX
 *   contentHtml    — HTML string to render for content section
 *   extraAfter     — JSX to render after all sections (e.g. tags, share, comments)
 *   darkMode       — boolean for dark mode styling
 */
const ContentRenderer = ({ content, renderBanner, contentHtml, extraAfter, darkMode = false }) => {
  const tags = parseTags(content.tags);
  const order = getSectionOrder(content.builder_layout);

  // Check if this is HTML Builder content (full HTML page or builder_layout with 'html')
  const builderLayout = content.builder_layout ? (typeof content.builder_layout === 'string' ? JSON.parse(content.builder_layout) : content.builder_layout) : null;
  const isHtmlBuilderLayout = Array.isArray(builderLayout) && builderLayout[0] === 'html';
  const isHtmlBuilderContent = content.content && content.content.trim().startsWith('<!DOCTYPE html>');
  const isHtmlBuilder = isHtmlBuilderLayout || isHtmlBuilderContent;

  // For HTML Builder: render the full HTML page as-is
  if (isHtmlBuilder) {
    return (
      <div key="html-builder-content" style={{ width: '100%', minHeight: '400px' }}>
        <iframe
          srcDoc={content.content}
          style={{
            width: '100%',
            minHeight: '600px',
            border: 'none',
            borderRadius: '8px',
            background: '#fff'
          }}
          title="HTML Builder Content"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
        {extraAfter}
      </div>
    );
  }

  // Check for builder_page_data (new Visual Builder v2.0 format) - Priority check
  // Render using BuilderProvider and PreviewCanvas
  if (content.builder_page_data) {
    return (
      <div key="visual-builder-v2-content">
        <React.Suspense fallback={
          <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#8c8c8c' }}>
            <Text type="secondary">Loading visual builder content...</Text>
          </div>
        }>
          <BuilderPageRenderer 
            content={content} 
            darkMode={darkMode}
          />
        </React.Suspense>
        {extraAfter}
      </div>
    );
  }

  // For legacy Visual Builder: render from builder_content_elements JSON
  if (content.builder_content_elements && content.builder_content_elements.length > 0) {
    try {
      const elements = typeof content.builder_content_elements === 'string' 
        ? JSON.parse(content.builder_content_elements) 
        : content.builder_content_elements;
      
      return (
        <div key="visual-builder-content">
          <div style={{ padding: '20px', background: darkMode ? '#1e293b' : '#fff', borderRadius: '8px' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: darkMode ? '#0f172a' : '#f0f9ff', borderRadius: '8px', borderLeft: `4px solid ${darkMode ? '#3b82f6' : '#0ea5e9'}` }}>
              <Text strong style={{ color: darkMode ? '#60a5fa' : '#0369a1' }}>Visual Builder Content</Text>
              <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                This page was created with the drag-and-drop visual builder. Preview rendering coming soon.
              </div>
            </div>
            <pre style={{ background: darkMode ? '#0f172a' : '#f8f9fa', padding: '16px', borderRadius: '8px', overflow: 'auto', color: darkMode ? '#cbd5e1' : '#1a1a2e', maxHeight: '500px' }}>
              {JSON.stringify(elements, null, 2)}
            </pre>
          </div>
          {extraAfter}
        </div>
      );
    } catch (error) {
      console.error('Failed to parse visual builder elements:', error);
    }
  }

  // Default order if no layout saved
  const defaultOrder = ['meta', 'title', 'banner', 'tags', 'content'];
  const sectionOrder = order || defaultOrder;

  // Ensure tags are always included in the order (after banner, before content)
  const finalSectionOrder = sectionOrder.includes('tags') 
    ? sectionOrder 
    : [...sectionOrder.slice(0, sectionOrder.indexOf('content') !== -1 ? sectionOrder.indexOf('content') : sectionOrder.length), 'tags', ...sectionOrder.slice(sectionOrder.indexOf('content') !== -1 ? sectionOrder.indexOf('content') : sectionOrder.length)];

  const sections = {
    meta: null, // Removed as requested

    title: (
      <div key="title">
        <h1 style={{ fontSize: 32, fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a1a', margin: '12px 0 16px', lineHeight: 1.3 }}>
          {content.title}
        </h1>
        {content.short_description && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#f8f9fa', borderLeft: darkMode ? '4px solid #4a7cff' : '4px solid #1890ff', borderRadius: '0 8px 8px 0' }}>
            <Text style={{ fontSize: 15, color: darkMode ? '#cbd5e1' : '#374151', lineHeight: 1.7 }}>{content.short_description}</Text>
          </div>
        )}
      </div>
    ),

    banner: content.banner_image ? (
      <div key="banner" style={{ marginBottom: 24 }}>
        {renderBanner
          ? renderBanner(`/uploads/${content.banner_image}`, content.title, darkMode)
          : (
            <div style={{ borderRadius: 10, overflow: 'hidden' }}>
              <img
                src={`/uploads/${content.banner_image}`}
                alt={content.title}
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 420, objectFit: 'contain' }}
              />
            </div>
          )
        }
      </div>
    ) : null,

    tags: tags.length > 0 ? (
      <div key="tags" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <TagOutlined style={{ color: darkMode ? '#94a3b8' : '#8c8c8c' }} />
        {tags.map((tag, i) => (
          <Tag key={i} color="geekblue" style={{ borderRadius: 20, fontSize: 12, color: darkMode ? '#60a5fa' : undefined }}>{tag}</Tag>
        ))}
      </div>
    ) : null,

    content: (
      <div key="content">
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: restoreRawHtml(stripLinks(contentHtml || content.content || '<p>No content available</p>')) }}
        />
      </div>
    ),
  };

  return (
    <>
      {finalSectionOrder.map(key => sections[key] || null)}

      {extraAfter}
    </>
  );
};

export default ContentRenderer;
