/**
 * WidgetSidebar Component
 * Left sidebar with collapsible widget categories.
 */

import React, { useState, useMemo } from 'react';
import { Collapse, Input, Empty, Tooltip, message } from 'antd';
import {
  LayoutOutlined, AppstoreOutlined, FileOutlined,
  PictureOutlined, CodeOutlined,
} from '@ant-design/icons';
import DraggableWidget from './DraggableWidget';
import { useBuilderActions } from '../core/BuilderStore.jsx';
import { NodeType } from '../utils/types';

const { Panel }  = Collapse;
const { Search } = Input;

const WIDGET_CATEGORIES = [
  {
    key: 'layouts',
    title: 'Layout',
    icon: <LayoutOutlined />,
    items: [
      { type: 'section',    label: 'Section',    icon: '▭',     hint: 'Full-width row' },
      { type: 'container',  label: 'Container',  icon: '⬜',    hint: 'Centered max-width wrapper' },
      { type: 'column-1',   label: '1 Column',   icon: '▭',     hint: 'Single column' },
      { type: 'column-2',   label: '2 Columns',  icon: '▭▭',   hint: 'Two equal columns' },
      { type: 'column-3',   label: '3 Columns',  icon: '▭▭▭',  hint: 'Three equal columns' },
      { type: 'column-4',   label: '4 Columns',  icon: '▭▭▭▭', hint: 'Four equal columns' },
    ],
  },
  {
    key: 'basic',
    title: 'Basic',
    icon: <AppstoreOutlined />,
    items: [
      { type: NodeType.HEADING,        label: 'Heading',       icon: 'H'   },
      { type: NodeType.PARAGRAPH,      label: 'Paragraph',     icon: '¶'   },
      { type: NodeType.RICH_TEXT,      label: 'Rich Text',     icon: '✍️'  },
      { type: NodeType.BUTTON,         label: 'Button',        icon: '🔘'  },
      { type: NodeType.DIVIDER,        label: 'Divider',       icon: '➖'  },
      { type: NodeType.SPACER,         label: 'Spacer',        icon: '↕️'  },
      { type: NodeType.BLOCKQUOTE,     label: 'Blockquote',    icon: '❝'   },
      { type: NodeType.CODE_BLOCK,     label: 'Code Block',    icon: '</>' },
      { type: NodeType.BULLET_LIST,    label: 'Bullet List',   icon: '•'   },
      { type: NodeType.NUMBERED_LIST,  label: 'Numbered List', icon: '1.'  },
      { type: NodeType.TABLE,          label: 'Table',         icon: '📊'  },
    ],
  },
  {
    key: 'media',
    title: 'Media',
    icon: <PictureOutlined />,
    items: [
      { type: NodeType.IMAGE,   label: 'Image',   icon: '🖼️'  },
      { type: NodeType.VIDEO,   label: 'Video',   icon: '🎬'  },
      { type: NodeType.PDF,     label: 'PDF',     icon: '📄'  },
    ],
  },
  {
    key: 'advanced',
    title: 'Advanced',
    icon: <CodeOutlined />,
    items: [
      { type: NodeType.HTML,          label: 'HTML Block',    icon: '<>' },
      { type: NodeType.SPLIT_SECTION, label: 'Split Section', icon: '⬛⬛' },
      { type: NodeType.FORM,          label: 'Form',          icon: '📝' },
    ],
  },
  {
    key: 'templates',
    title: 'Templates',
    icon: <FileOutlined />,
    items: [
      { type: 'template:blank',      label: 'Blank Page',         icon: '📄', isTemplate: true },
      { type: 'template:webinar',    label: 'Webinar Landing',    icon: '🎥', isTemplate: true },
      { type: 'template:whitepaper', label: 'Whitepaper Landing', icon: '📑', isTemplate: true },
      { type: 'template:ebook',      label: 'eBook Landing',      icon: '📚', isTemplate: true },
      { type: 'template:event',      label: 'Event Page',         icon: '📅', isTemplate: true },
      { type: 'template:product',    label: 'Product Launch',     icon: '🚀', isTemplate: true },
      { type: 'template:ai',         label: 'AI Landing',         icon: '🤖', isTemplate: true },
      { type: 'template:case',       label: 'Case Study',         icon: '📋', isTemplate: true },
      { type: 'template:contact',    label: 'Contact Page',       icon: '📞', isTemplate: true },
    ],
  },
];

function TemplateItem({ item, onLoad, darkMode }) {
  return (
    <Tooltip title="Click to load template" placement="right">
      <div
        onClick={() => onLoad(item.type.replace('template:', ''))}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 4px',
          borderRadius: 8,
          border: `1px solid ${darkMode ? '#334155' : '#e8e8e8'}`,
          cursor: 'pointer',
          background: darkMode ? '#0f172a' : '#fff',
          fontSize: 12,
          textAlign: 'center',
          gap: 4,
          transition: 'border-color 0.15s, background 0.15s',
          userSelect: 'none',
          minHeight: 64,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#4a7cff';
          e.currentTarget.style.background  = darkMode ? '#1e293b' : '#f0f4ff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e8e8e8';
          e.currentTarget.style.background  = darkMode ? '#0f172a' : '#fff';
        }}
      >
        <span style={{ fontSize: 20 }}>{item.icon}</span>
        <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#595959', lineHeight: 1.2 }}>{item.label}</span>
      </div>
    </Tooltip>
  );
}

export default function WidgetSidebar({ collapsed, darkMode = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKeys, setActiveKeys]   = useState(['layouts', 'basic']);
  const actions = useBuilderActions();

  const handleLoadTemplate = async (templateId) => {
    try {
      await actions.loadTemplate(templateId);
      message.success(`Template "${templateId}" loaded`);
    } catch (err) {
      message.error(`Failed to load template: ${err.message}`);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return WIDGET_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return WIDGET_CATEGORIES
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  if (collapsed) return null;

  const hasAnyResults = filtered.some(c => c.items.length > 0);

  return (
    <div
      className={`widget-sidebar${darkMode ? ' widget-sidebar-dark' : ''}`}
      style={{
        padding: '10px 8px',
        background: darkMode ? '#1e293b' : '#fafafa',
        minHeight: '100%',
      }}
    >
      {darkMode && (
        <style>{`
          .widget-sidebar-dark .ant-collapse-content {
            background: #1e293b !important;
            border-top-color: #334155 !important;
          }
          .widget-sidebar-dark .ant-collapse-item {
            border-bottom-color: #334155 !important;
          }
          .widget-sidebar-dark .ant-collapse-header {
            color: #cbd5e1 !important;
          }
          .widget-sidebar-dark .ant-input-affix-wrapper,
          .widget-sidebar-dark .ant-input {
            background: #0f172a !important;
            border-color: #334155 !important;
            color: #cbd5e1 !important;
          }
          .widget-sidebar-dark .ant-input::placeholder {
            color: #475569 !important;
          }
          .widget-sidebar-dark .ant-input-clear-icon {
            color: #475569 !important;
          }
          .widget-sidebar-dark .ant-input-search-button {
            background: #0f172a !important;
            border-color: #334155 !important;
            color: #475569 !important;
          }
        `}</style>
      )}
      <div style={{ marginBottom: 10 }}>
        <Search
          placeholder="Search widgets…"
          allowClear
          size="small"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {!hasAnyResults && (
        <Empty
          description={<span style={{ color: darkMode ? '#94a3b8' : undefined }}>No widgets found</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 24 }}
        />
      )}

      <Collapse
        activeKey={searchQuery ? filtered.map(c => c.key) : activeKeys}
        onChange={setActiveKeys}
        size="small"
        ghost
      >
        {filtered.map(category => (
          <Panel
            key={category.key}
            header={
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600,
                color: darkMode ? '#cbd5e1' : '#1a1a2e',
              }}>
                {category.icon}
                {category.title}
                <span style={{ color: darkMode ? '#475569' : '#bbb', fontWeight: 400 }}>
                  ({category.items.length})
                </span>
              </span>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {category.items.map(item =>
                item.isTemplate ? (
                  <TemplateItem
                    key={item.type}
                    item={item}
                    onLoad={handleLoadTemplate}
                    darkMode={darkMode}
                  />
                ) : (
                  <DraggableWidget
                    key={item.type}
                    type={item.type}
                    label={item.label}
                    icon={item.icon}
                    darkMode={darkMode}
                  />
                )
              )}
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}
