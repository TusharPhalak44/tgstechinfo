import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Space, Divider, Dropdown, Select, Modal, Input, Radio, Upload } from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined,
  OrderedListOutlined, UnorderedListOutlined, AlignLeftOutlined,
  AlignCenterOutlined, AlignRightOutlined, LinkOutlined, PictureOutlined,
  TableOutlined, CodeOutlined, UndoOutlined, RedoOutlined, ClearOutlined,
  LayoutOutlined, UploadOutlined,
} from '@ant-design/icons';
import './TipTapEditor.css';

const { Option } = Select;

// Custom extension to preserve raw HTML blocks (multi-col layout)
const RawHtmlBlock = Node.create({
  name: 'rawHtmlBlock',
  group: 'block',
  atom: true,
  parseHTML() {
    return [{ tag: 'div.multi-col-layout' }, { tag: 'div.two-col-layout' }];
  },
  addAttributes() {
    return {
      innerHTML: { default: '' },
    };
  },
  renderHTML({ node }) {
    // Render as a div; actual innerHTML injected via NodeView
    return ['div', {
      class: 'multi-col-layout',
      style: 'display:flex;flex-direction:row;gap:24px;align-items:flex-start;margin:16px 0;',
      'data-raw-html': node.attrs.innerHTML,
    }];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'multi-col-layout';
      dom.style.cssText = 'display:flex;flex-direction:row;gap:24px;align-items:flex-start;margin:16px 0;border:1px dashed #d0e8ff;border-radius:8px;padding:12px;background:#f8fbff;';
      dom.innerHTML = node.attrs.innerHTML || '';
      return { dom };
    };
  },
  addCommands() {
    return {
      insertRawHtml: (html) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { innerHTML: html },
        });
      },
    };
  },
});

const TipTapEditor = ({ value, onChange, placeholder = 'Write your content here...', initialContent }) => {
  const editorContainerRef = useRef(null);
  const imageInputRef = useRef(null);
  const [currentHeading, setCurrentHeading] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isBlockquote, setIsBlockquote] = useState(false);
  const [isCodeBlock, setIsCodeBlock] = useState(false);
  const [isLink, setIsLink] = useState(false);

  // Link modal
  const [linkModal, setLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Multi-column modal
  const [multiColModal, setMultiColModal] = useState(false);
  const [columnCount, setColumnCount] = useState(2); // 2, 3, 4, etc.
  const [sections, setSections] = useState([
    { id: 1, type: 'text', content: '', imageSrc: '' }
  ]);

  // Table dropdown
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [tableRowCount, setTableRowCount] = useState(2);
  const [tableColCount, setTableColCount] = useState(2);
  const [tableEditDropdownOpen, setTableEditDropdownOpen] = useState(false);
  const [addTableRowCount, setAddTableRowCount] = useState(1);
  const [addTableColCount, setAddTableColCount] = useState(1);
  const [removeTableRowCount, setRemoveTableRowCount] = useState(1);
  const [removeTableColCount, setRemoveTableColCount] = useState(1);
  const [isInTable, setIsInTable] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        heading: { levels: [1, 2, 3, 4, 5, 6] }, 
        link: false,
        paragraph: { HTMLAttributes: {} },
      }),
      Image.configure({ 
        allowBase64: true, 
        inline: true,
        HTMLAttributes: { style: '' },
      }),
      Link.configure({ 
        openOnClick: false, 
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } 
      }),
      Placeholder.configure({ 
        placeholder, 
        emptyEditorClass: 'is-editor-empty' 
      }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      RawHtmlBlock,
    ],
    content: initialContent || value || '',
    onUpdate: ({ editor }) => { 
      onChange(editor.getHTML()); 
      updateStates(editor); 
    },
    onSelectionUpdate: ({ editor }) => updateStates(editor),
    onTransaction: ({ editor }) => updateStates(editor),
    editorProps: { 
      attributes: { class: 'tiptap-editor-content' } 
    },
  });

  const updateStates = (ed) => {
    if (!ed) return;
    let h = 'paragraph';
    for (let i = 1; i <= 6; i++) { 
      if (ed.isActive('heading', { level: i })) { 
        h = `h${i}`; 
        break; 
      } 
    }
    setCurrentHeading(h);
    setIsBold(ed.isActive('bold'));
    setIsItalic(ed.isActive('italic'));
    setIsUnderline(ed.isActive('underline'));
    setIsStrike(ed.isActive('strike'));
    setIsBulletList(ed.isActive('bulletList'));
    setIsOrderedList(ed.isActive('orderedList'));
    setIsCode(ed.isActive('code'));
    setIsBlockquote(ed.isActive('blockquote'));
    setIsCodeBlock(ed.isActive('codeBlock'));
    setIsLink(ed.isActive('link'));
    
    // Check if cursor is in a table
    const inTable = ed.isActive('table') || 
      (ed.state.selection.$from.node.parent?.type?.name === 'tableRow') ||
      (ed.state.selection.$from.node.type?.name === 'tableCell') ||
      (ed.state.selection.$to.node.parent?.type?.name === 'tableRow') ||
      (ed.state.selection.$to.node.type?.name === 'tableCell');
    setIsInTable(inTable);
  };

  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => { 
    if (editor) updateStates(editor); 
  }, [editor]);

  if (!editor) return <div style={{ padding: 20, textAlign: 'center' }}>Loading editor...</div>;

  const run = (fn) => { 
    fn(); 
    setTimeout(() => updateStates(editor), 10); 
  };

  const TB = ({ icon, onClick, active = false, disabled = false, title }) => (
    <Button type={active ? 'primary' : 'text'} icon={icon} onClick={() => run(onClick)}
      disabled={disabled} title={title} size="small"
      style={{ padding: '4px 8px', height: 32, minWidth: 32, borderRadius: 4,
        border: active ? '1px solid #1890ff' : '1px solid transparent',
        background: active ? '#e6f7ff' : 'transparent', color: active ? '#1890ff' : '#333' }} />
  );

  const handleImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor.chain().focus().setImage({ src: e.target.result }).run();
    };
    reader.readAsDataURL(file);
  };

  const openLinkModal = () => {
    const existing = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '');
    setLinkUrl(existing);
    setLinkText(selectedText);
    setLinkModal(true);
  };

  const applyLink = () => {
    if (!linkUrl) { 
      editor.chain().focus().unsetLink().run(); 
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      if (linkText && editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
    setLinkModal(false);
    setTimeout(() => updateStates(editor), 10);
  };

  const openMultiColModal = () => {
    setColumnCount(2);
    setSections([
      { id: 1, type: 'text', content: '', imageSrc: '' },
      { id: 2, type: 'text', content: '', imageSrc: '' }
    ]);
    setMultiColModal(true);
  };

  const handleSectionImage = (file, sectionId) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, imageSrc: e.target.result } : s
      ));
    };
    reader.readAsDataURL(file);
    return false; // prevent auto-upload
  };

  const updateSection = (sectionId, updates) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  const handleColumnCountChange = (count) => {
    setColumnCount(count);
    const currentSections = sections;
    const newSections = [];
    
    for (let i = 0; i < count; i++) {
      if (i < currentSections.length) {
        newSections.push(currentSections[i]);
      } else {
        newSections.push({
          id: Date.now() + i,
          type: 'text',
          content: '',
          imageSrc: ''
        });
      }
    }
    
    setSections(newSections);
  };

  const onSectionDragStart = (index) => {
    window.draggedSectionIndex = index;
  };

  const onSectionDragOver = (e) => {
    e.preventDefault();
  };

  const onSectionDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = window.draggedSectionIndex;
    if (dragIndex === null || dragIndex === dropIndex) return;
    
    const newSections = [...sections];
    const [draggedSection] = newSections.splice(dragIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);
    
    setSections(newSections);
    window.draggedSectionIndex = null;
  };

  const insertMultiCol = () => {
    const colStyle = 'flex:1;min-width:0;';
    const columnHtmls = sections.map(section => {
      if (section.type === 'image' && section.imageSrc) {
        return `<div class="multi-col-img" style="${colStyle}"><img src="${section.imageSrc}" style="width:100%;height:auto;border-radius:8px;display:block;" /></div>`;
      } else {
        const textContent = section.content || '';
        return `<div class="multi-col-text" style="${colStyle}font-size:15px;line-height:1.75;"><p>${textContent.replace(/\n/g, '</p><p>')}</p></div>`;
      }
    });
    
    const innerHTML = columnHtmls.join('');
    editor.chain().focus().insertRawHtml(innerHTML).run();
    setMultiColModal(false);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: tableRowCount, cols: tableColCount }).run();
    setTableDropdownOpen(false);
  };

  return (
    <div className="tiptap-editor-wrapper" ref={editorContainerRef}>
      {/* Toolbar */}
      <div className="tiptap-toolbar">
        <Space size={4} wrap>
          <TB icon={<UndoOutlined />} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" />
          <TB icon={<RedoOutlined />} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <TB icon={<BoldOutlined />} onClick={() => editor.chain().focus().toggleBold().run()} active={isBold} title="Bold" />
          <TB icon={<ItalicOutlined />} onClick={() => editor.chain().focus().toggleItalic().run()} active={isItalic} title="Italic" />
          <TB icon={<UnderlineOutlined />} onClick={() => editor.chain().focus().toggleUnderline().run()} active={isUnderline} title="Underline" />
          <TB icon={<StrikethroughOutlined />} onClick={() => editor.chain().focus().toggleStrike().run()} active={isStrike} title="Strikethrough" />
          <TB icon={<CodeOutlined />} onClick={() => editor.chain().focus().toggleCode().run()} active={isCode} title="Inline Code" />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <Select size="small" style={{ width: 110 }} value={currentHeading}
            onChange={(v) => {
              setCurrentHeading(v);
              if (v === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(v.replace('h', '')) }).run();
              }
              setTimeout(() => updateStates(editor), 10);
            }} popupMatchSelectWidth={false}>
            <Option value="paragraph">Paragraph</Option>
            {[1,2,3,4,5,6].map(i => <Option key={i} value={`h${i}`}>Heading {i}</Option>)}
          </Select>

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <TB icon={<UnorderedListOutlined />} onClick={() => editor.chain().focus().toggleBulletList().run()} active={isBulletList} title="Bullet List" />
          <TB icon={<OrderedListOutlined />} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={isOrderedList} title="Numbered List" />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <TB icon={<AlignLeftOutlined />} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left" />
          <TB icon={<AlignCenterOutlined />} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center" />
          <TB icon={<AlignRightOutlined />} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right" />
          <TB icon={<span style={{ fontSize: 14, fontWeight: 700 }}>≡</span>} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify" />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <TB icon={<LinkOutlined />} onClick={openLinkModal} active={isLink} title="Insert / Edit Link" />

          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files[0]) { handleImageFile(e.target.files[0]); e.target.value = ''; } }} />
          <Button size="small" icon={<PictureOutlined />} onClick={() => imageInputRef.current.click()} title="Insert Image (upload)">
            Image
          </Button>

          <Dropdown 
            open={tableDropdownOpen}
            onOpenChange={setTableDropdownOpen}
            dropdownRender={() => (
              <div style={{ padding: 12, minWidth: 200 }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Rows</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRowCount}
                    onChange={(e) => setTableRowCount(parseInt(e.target.value) || 1)}
                    placeholder="Rows"
                    size="small"
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Columns</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={tableColCount}
                    onChange={(e) => setTableColCount(parseInt(e.target.value) || 1)}
                    placeholder="Columns"
                    size="small"
                  />
                </div>
                <Button type="primary" size="small" onClick={insertTable} style={{ width: '100%' }}>
                  Insert Table
                </Button>
              </div>
            )}
            trigger={['click']}
          >
            <Button size="small" icon={<TableOutlined />}>Table</Button>
          </Dropdown>

          {editor && isInTable && (
            <Dropdown 
              open={tableEditDropdownOpen}
              onOpenChange={setTableEditDropdownOpen}
              dropdownRender={() => (
                <div style={{ padding: 12, minWidth: 280 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>Add Rows</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={addTableRowCount}
                      onChange={(e) => setAddTableRowCount(parseInt(e.target.value) || 1)}
                      placeholder="Count"
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => {
                        for (let i = 0; i < addTableRowCount; i++) {
                          editor.chain().focus().addRowAfter().run();
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>Add Columns</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={addTableColCount}
                      onChange={(e) => setAddTableColCount(parseInt(e.target.value) || 1)}
                      placeholder="Count"
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => {
                        for (let i = 0; i < addTableColCount; i++) {
                          editor.chain().focus().addColumnAfter().run();
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>Delete Rows</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={removeTableRowCount}
                      onChange={(e) => setRemoveTableRowCount(parseInt(e.target.value) || 1)}
                      placeholder="Count"
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <Button 
                      size="small" 
                      danger
                      onClick={() => {
                        for (let i = 0; i < removeTableRowCount; i++) {
                          editor.chain().focus().deleteRow().run();
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>Delete Columns</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={removeTableColCount}
                      onChange={(e) => setRemoveTableColCount(parseInt(e.target.value) || 1)}
                      placeholder="Count"
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <Button 
                      size="small" 
                      danger
                      onClick={() => {
                        for (let i = 0; i < removeTableColCount; i++) {
                          editor.chain().focus().deleteColumn().run();
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>

                  <Button size="small" danger block onClick={() => editor.chain().focus().deleteTable().run()}>
                    Delete Table
                  </Button>
                </div>
              )}
              trigger={['click']}
            >
              <Button size="small" type="primary">Edit Table</Button>
            </Dropdown>
          )}

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <TB icon={<span style={{ fontSize: 16 }}>"</span>} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={isBlockquote} title="Blockquote" />
          <TB icon={<CodeOutlined />} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={isCodeBlock} title="Code Block" />
          <TB icon={<span style={{ fontSize: 16 }}>—</span>} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule" />
          <TB icon={<ClearOutlined />} onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Formatting" />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <Button size="small" icon={<LayoutOutlined />} onClick={openMultiColModal} title="Insert Multi-Column Layout">
            Multi-Col
          </Button>
        </Space>
      </div>

      <EditorContent editor={editor} className="tiptap-editor-content" />

      {/* Multi-Column Modal */}
      <Modal
        title="Insert Multi-Column Layout"
        open={multiColModal}
        onOk={insertMultiCol}
        onCancel={() => setMultiColModal(false)}
        okText="Insert"
        width={700}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Number of Columns</div>
            <Select 
              value={columnCount} 
              onChange={handleColumnCountChange}
              style={{ width: '100%' }}
            >
              <Option value={2}>2 Columns</Option>
              <Option value={3}>3 Columns</Option>
              <Option value={4}>4 Columns</Option>
              <Option value={5}>5 Columns</Option>
              <Option value={6}>6 Columns</Option>
            </Select>
          </div>

          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
            Drag sections to reorder. Each section can be text or image.
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => onSectionDragStart(index)}
                onDragOver={onSectionDragOver}
                onDrop={(e) => onSectionDrop(e, index)}
                style={{
                  padding: 12,
                  background: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #e8e8e8',
                  cursor: 'move',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#595959' }}>
                    Column {index + 1}
                  </span>
                  <Radio.Group
                    value={section.type}
                    onChange={(e) => updateSection(section.id, { type: e.target.value })}
                    size="small"
                  >
                    <Radio value="text">Text</Radio>
                    <Radio value="image">Image</Radio>
                  </Radio.Group>
                </div>

                {section.type === 'text' ? (
                  <Input.TextArea
                    rows={3}
                    placeholder="Enter text content..."
                    value={section.content}
                    onChange={(e) => updateSection(section.id, { content: e.target.value })}
                    style={{ fontSize: 13 }}
                  />
                ) : (
                  <div>
                    <Upload
                      beforeUpload={(file) => handleSectionImage(file, section.id)}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button size="small" icon={<UploadOutlined />}>
                        Upload Image
                      </Button>
                    </Upload>
                    {section.imageSrc && (
                      <img
                        src={section.imageSrc}
                        alt="preview"
                        style={{ marginTop: 8, maxHeight: 100, borderRadius: 6, border: '1px solid #eee' }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Preview */}
          <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 12, background: '#fafafa' }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>Preview ({columnCount} columns)</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {sections.map((section, index) => (
                <div key={section.id} style={{ flex: 1, minWidth: 0 }}>
                  {section.type === 'image' && section.imageSrc ? (
                    <img
                      src={section.imageSrc}
                      alt=""
                      style={{ width: '100%', borderRadius: 6 }}
                    />
                  ) : (
                    <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6, opacity: section.content ? 1 : 0.5 }}>
                      {section.content || 'Empty text column'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Link Modal */}
      <Modal title="Insert Link" open={linkModal} onOk={applyLink} onCancel={() => setLinkModal(false)}
        okText="Apply" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Link Text (optional)</div>
            <Input placeholder="e.g. Click here" value={linkText} onChange={e => setLinkText(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>URL *</div>
            <Input placeholder="https://example.com" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              onPressEnter={applyLink} prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />} />
          </div>
          {linkUrl && (
            <Button type="link" danger size="small" style={{ alignSelf: 'flex-start', padding: 0 }}
              onClick={() => { editor.chain().focus().unsetLink().run(); setLinkModal(false); }}>
              Remove Link
            </Button>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default TipTapEditor;