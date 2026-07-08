import React, { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input, Button, Tooltip } from 'antd';
import {
  HolderOutlined, DeleteOutlined, PlusOutlined,
  FontSizeOutlined, AlignLeftOutlined, PictureOutlined,
  MinusOutlined, CodeOutlined, MessageOutlined, AppstoreOutlined,
  OrderedListOutlined, UnorderedListOutlined
} from '@ant-design/icons';

const { TextArea } = Input;

// ── Block definitions ──────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'heading',    icon: <FontSizeOutlined />,       label: 'Heading',      color: '#4a7cff' },
  { type: 'paragraph', icon: <AlignLeftOutlined />,       label: 'Paragraph',    color: '#00b894' },
  { type: 'image',     icon: <PictureOutlined />,         label: 'Image',        color: '#e17055' },
  { type: 'quote',     icon: <MessageOutlined />,         label: 'Quote',        color: '#6c5ce7' },
  { type: 'divider',   icon: <MinusOutlined />,           label: 'Divider',      color: '#636e72' },
  { type: 'code',      icon: <CodeOutlined />,            label: 'Code Block',   color: '#fdcb6e' },
  { type: 'columns',   icon: <AppstoreOutlined />,        label: 'Two Columns',  color: '#0984e3' },
  { type: 'ul',        icon: <UnorderedListOutlined />,   label: 'Bullet List',  color: '#00cec9' },
  { type: 'ol',        icon: <OrderedListOutlined />,     label: 'Numbered List',color: '#fd79a8' },
];

const defaultData = (type) => {
  switch (type) {
    case 'heading':   return { text: 'Your Heading', level: 2 };
    case 'paragraph': return { text: 'Write your paragraph here...' };
    case 'image':     return { src: '', alt: '', caption: '' };
    case 'quote':     return { text: 'Your quote here...', author: '' };
    case 'divider':   return {};
    case 'code':      return { code: '// Your code here', language: 'javascript' };
    case 'columns':   return { left: 'Left column content...', right: 'Right column content...' };
    case 'ul':        return { items: ['Item 1', 'Item 2', 'Item 3'] };
    case 'ol':        return { items: ['Item 1', 'Item 2', 'Item 3'] };
    default:          return {};
  }
};

// ── Block → HTML ───────────────────────────────────────────────────
const blockToHtml = (block) => {
  const { type, data } = block;
  switch (type) {
    case 'heading':
      return `<h${data.level}>${data.text}</h${data.level}>`;
    case 'paragraph':
      return `<p>${data.text}</p>`;
    case 'image':
      return data.src
        ? `<figure><img src="${data.src}" alt="${data.alt || ''}" style="max-width:100%;border-radius:8px;" />${data.caption ? `<figcaption>${data.caption}</figcaption>` : ''}</figure>`
        : '';
    case 'quote':
      return `<blockquote><p>${data.text}</p>${data.author ? `<cite>— ${data.author}</cite>` : ''}</blockquote>`;
    case 'divider':
      return `<hr />`;
    case 'code':
      return `<pre><code class="language-${data.language}">${data.code}</code></pre>`;
    case 'columns':
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;"><div><p>${data.left}</p></div><div><p>${data.right}</p></div></div>`;
    case 'ul':
      return `<ul>${data.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol>${data.items.map(i => `<li>${i}</li>`).join('')}</ol>`;
    default: return '';
  }
};

// ── Block Editor (inline editing per block) ────────────────────────
const BlockEditor = ({ block, onChange }) => {
  const { type, data } = block;

  const update = (key, val) => onChange({ ...data, [key]: val });
  const updateItem = (i, val) => {
    const items = [...data.items];
    items[i] = val;
    onChange({ ...data, items });
  };
  const addItem = () => onChange({ ...data, items: [...data.items, 'New item'] });
  const removeItem = (i) => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) });

  const inputStyle = {
    border: 'none', borderBottom: '1px dashed #d9d9d9', borderRadius: 0,
    padding: '4px 0', background: 'transparent', boxShadow: 'none', width: '100%'
  };

  switch (type) {
    case 'heading':
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={data.level}
            onChange={e => update('level', parseInt(e.target.value))}
            style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#595959' }}
          >
            {[1,2,3,4].map(l => <option key={l} value={l}>H{l}</option>)}
          </select>
          <Input
            value={data.text}
            onChange={e => update('text', e.target.value)}
            style={{ ...inputStyle, fontSize: data.level === 1 ? 28 : data.level === 2 ? 22 : data.level === 3 ? 18 : 15, fontWeight: 700 }}
            placeholder="Heading text..."
          />
        </div>
      );

    case 'paragraph':
      return (
        <TextArea
          value={data.text}
          onChange={e => update('text', e.target.value)}
          autoSize={{ minRows: 2 }}
          style={{ ...inputStyle, fontSize: 15, lineHeight: 1.7, resize: 'none' }}
          placeholder="Paragraph text..."
        />
      );

    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input value={data.src} onChange={e => update('src', e.target.value)} placeholder="Image URL (https://...)" style={inputStyle} />
          {data.src && (
            <img src={data.src} alt={data.alt} style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, border: '1px solid #e8e8e8' }} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={data.alt} onChange={e => update('alt', e.target.value)} placeholder="Alt text" style={{ ...inputStyle, flex: 1 }} />
            <Input value={data.caption} onChange={e => update('caption', e.target.value)} placeholder="Caption (optional)" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
      );

    case 'quote':
      return (
        <div style={{ borderLeft: '3px solid #6c5ce7', paddingLeft: 16 }}>
          <TextArea value={data.text} onChange={e => update('text', e.target.value)} autoSize={{ minRows: 2 }} style={{ ...inputStyle, fontStyle: 'italic', fontSize: 15 }} placeholder="Quote text..." />
          <Input value={data.author} onChange={e => update('author', e.target.value)} style={{ ...inputStyle, fontSize: 12, color: '#8c8c8c', marginTop: 6 }} placeholder="Author name (optional)" />
        </div>
      );

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '2px solid #e8e8e8', margin: '8px 0' }} />;

    case 'code':
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <select
              value={data.language}
              onChange={e => update('language', e.target.value)}
              style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#595959' }}
            >
              {['javascript','python','html','css','sql','bash','json','typescript'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <TextArea
            value={data.code}
            onChange={e => update('code', e.target.value)}
            autoSize={{ minRows: 3 }}
            style={{ fontFamily: 'monospace', fontSize: 13, background: '#1e1e2e', color: '#cdd6f4', borderRadius: 6, padding: 12, resize: 'none', border: 'none' }}
          />
        </div>
      );

    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TextArea value={data.left} onChange={e => update('left', e.target.value)} autoSize={{ minRows: 3 }} style={{ ...inputStyle, resize: 'none', padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }} placeholder="Left column..." />
          <TextArea value={data.right} onChange={e => update('right', e.target.value)} autoSize={{ minRows: 3 }} style={{ ...inputStyle, resize: 'none', padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }} placeholder="Right column..." />
        </div>
      );

    case 'ul':
    case 'ol':
      return (
        <div>
          {data.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ color: '#8c8c8c', fontSize: 12, minWidth: 20 }}>{type === 'ol' ? `${i + 1}.` : '•'}</span>
              <Input value={item} onChange={e => updateItem(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(i)} style={{ flexShrink: 0 }} />
            </div>
          ))}
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: 4, fontSize: 12 }}>Add item</Button>
        </div>
      );

    default: return null;
  }
};

// ── Sortable Block Card ────────────────────────────────────────────
const SortableBlock = ({ block, onUpdate, onDelete, isDraggingOver }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = BLOCK_TYPES.find(b => b.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: '#fff',
        border: `1px solid ${isDragging ? '#4a7cff' : '#e8e8e8'}`,
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
        boxShadow: isDragging ? '0 4px 20px rgba(74,124,255,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Block Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: '#fafafa',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#bfbfbf', display: 'flex', alignItems: 'center' }}>
          <HolderOutlined />
        </span>
        <span style={{
          width: 22, height: 22, borderRadius: 5, background: meta?.color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: meta?.color, fontSize: 12
        }}>
          {meta?.icon}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
          {meta?.label}
        </span>
        <Tooltip title="Delete block">
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(block.id)} />
        </Tooltip>
      </div>

      {/* Block Content */}
      <div style={{ padding: '14px 16px' }}>
        <BlockEditor block={block} onChange={(newData) => onUpdate(block.id, newData)} />
      </div>
    </div>
  );
};

// ── Droppable Canvas ───────────────────────────────────────────────
const DroppableCanvas = ({ children, isEmpty }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 400,
        background: isOver ? '#f0f5ff' : '#fafafa',
        border: `2px dashed ${isOver ? '#4a7cff' : '#e0e0e0'}`,
        borderRadius: 12,
        padding: isEmpty ? 0 : 16,
        transition: 'all 0.2s',
      }}
    >
      {isEmpty ? (
        <div style={{
          height: 400, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12
        }}>
          <div style={{ fontSize: 40 }}>🧩</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#595959' }}>Drag blocks here to build your content</div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>Or click any block from the left panel</div>
        </div>
      ) : children}
    </div>
  );
};

// ── Sidebar Block Pill ─────────────────────────────────────────────
const SidebarBlock = ({ type, icon, label, color, onAdd }) => (
  <div
    onClick={() => onAdd(type)}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
      border: '1px solid #e8e8e8', background: '#fff', marginBottom: 6,
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + '08'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#fff'; }}
  >
    <span style={{
      width: 28, height: 28, borderRadius: 6, background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 14, flexShrink: 0
    }}>
      {icon}
    </span>
    <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{label}</span>
    <PlusOutlined style={{ marginLeft: 'auto', color: '#bfbfbf', fontSize: 11 }} />
  </div>
);

// ── Main DragDropBuilder ───────────────────────────────────────────
const DragDropBuilder = ({ onChange }) => {
  const [blocks, setBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeSidebarType, setActiveSidebarType] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const generateHtml = useCallback((blockList) => {
    return blockList.map(blockToHtml).filter(Boolean).join('\n');
  }, []);

  const addBlock = (type) => {
    const newBlock = { id: `block-${Date.now()}`, type, data: defaultData(type) };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    onChange(generateHtml(updated));
  };

  const updateBlock = (id, newData) => {
    const updated = blocks.map(b => b.id === id ? { ...b, data: newData } : b);
    setBlocks(updated);
    onChange(generateHtml(updated));
  };

  const deleteBlock = (id) => {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    onChange(generateHtml(updated));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveSidebarType(null);

    if (!over) return;

    // Reorder existing blocks
    if (active.id !== over.id && blocks.find(b => b.id === active.id)) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = arrayMove(blocks, oldIndex, newIndex);
        setBlocks(updated);
        onChange(generateHtml(updated));
      }
    }
  };

  const activeBlock = blocks.find(b => b.id === activeId);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* Left Sidebar — Block Palette */}
      <div style={{
        width: 200, flexShrink: 0, background: '#fff',
        borderRadius: 12, border: '1px solid #e8e8e8',
        padding: 16, position: 'sticky', top: 80
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Content Blocks
        </div>
        {BLOCK_TYPES.map(b => (
          <SidebarBlock key={b.type} {...b} onAdd={addBlock} />
        ))}
        {blocks.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</div>
            <Button
              size="small" danger type="text"
              onClick={() => { setBlocks([]); onChange(''); }}
              style={{ fontSize: 12, padding: '0 4px' }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <DroppableCanvas isEmpty={blocks.length === 0}>
              {blocks.map(block => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                />
              ))}
            </DroppableCanvas>
          </SortableContext>

          <DragOverlay>
            {activeBlock && (
              <div style={{
                background: '#fff', border: '2px solid #4a7cff', borderRadius: 10,
                padding: '10px 16px', boxShadow: '0 8px 24px rgba(74,124,255,0.2)',
                fontSize: 13, fontWeight: 600, color: '#4a7cff'
              }}>
                {BLOCK_TYPES.find(b => b.type === activeBlock.type)?.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default DragDropBuilder;
