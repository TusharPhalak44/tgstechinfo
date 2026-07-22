import React from 'react';
import { Tag, Typography } from 'antd';
import { TagOutlined } from '@ant-design/icons';

const { Text } = Typography;

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
 */
const ContentRenderer = ({ content, renderBanner, contentHtml, extraAfter }) => {
  const tags = parseTags(content.tags);
  const order = getSectionOrder(content.builder_layout);

  // Default order if no layout saved
  const defaultOrder = ['meta', 'title', 'banner', 'tags', 'content'];
  const sectionOrder = order || defaultOrder;

  // Ensure tags are always included in the order (after banner, before content)
  const finalSectionOrder = sectionOrder.includes('tags') 
    ? sectionOrder 
    : [...sectionOrder.slice(0, sectionOrder.indexOf('content') !== -1 ? sectionOrder.indexOf('content') : sectionOrder.length), 'tags', ...sectionOrder.slice(sectionOrder.indexOf('content') !== -1 ? sectionOrder.indexOf('content') : sectionOrder.length)];

  const sections = {
    meta: content.category_name || content.content_type_name ? (
      <div key="meta" style={{ marginBottom: 12 }}>
        {content.category_name && <Tag color="blue">{content.category_name}</Tag>}
        {content.content_type_name && <Tag color="purple">{content.content_type_name}</Tag>}
      </div>
    ) : null,

    title: (
      <div key="title">
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', margin: '12px 0 16px', lineHeight: 1.3 }}>
          {content.title}
        </h1>
        {content.short_description && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8f9fa', borderLeft: '4px solid #1890ff', borderRadius: '0 8px 8px 0' }}>
            <Text style={{ fontSize: 15, color: '#374151', lineHeight: 1.7 }}>{content.short_description}</Text>
          </div>
        )}
      </div>
    ),

    banner: content.banner_image ? (
      <div key="banner" style={{ marginBottom: 24 }}>
        {renderBanner
          ? renderBanner(`/uploads/${content.banner_image}`, content.title)
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
        <TagOutlined style={{ color: '#8c8c8c' }} />
        {tags.map((tag, i) => (
          <Tag key={i} color="geekblue" style={{ borderRadius: 20, fontSize: 12 }}>{tag}</Tag>
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
