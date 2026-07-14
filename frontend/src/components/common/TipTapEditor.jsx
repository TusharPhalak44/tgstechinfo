import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Space, Divider, Dropdown, Select, Modal, Input, Radio } from 'antd';

// Custom TwoColumn Node
const TwoColumnNode = Node.create({
  name: 'twoColumn',
  group: 'block',
  content: 'block+ block+',
  atom: false,
  parseHTML() {
    return [{ tag: 'div[data-two-col]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-two-col': 'true', style: 'display:flex;gap:24px;margin:16px 0;' }), 0];
  },
});

const TwoColumnLeft = Node.create({
  name: 'twoColumnLeft',
  group: 'block',
  content: 'block+',
  parseHTML() { return [{ tag: 'div[data-col="left"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-col': 'left', style: 'flex:1;min-width:0;' }), 0];
  },
});

const TwoColumnRight = Node.create({
  name: 'twoColumnRight',
  group: 'block',
  content: 'block+',
  parseHTML() { return [{ tag: 'div[data-col="right"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-col': 'right', style: 'flex:1;min-width:0;' }), 0];
  },
});
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined,
  OrderedListOutlined, UnorderedListOutlined, AlignLeftOutlined,
  AlignCenterOutlined, AlignRightOutlined, LinkOutlined, PictureOutlined,
  TableOutlined, CodeOutlined, UndoOutlined, RedoOutlined, ClearOutlined,
  ColumnWidthOutlined, UploadOutlined,
} from '@ant-design/icons';
import './TipTapEditor.css';

const { Option } = Select;

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

  // Two-column modal
  const [colModal, setColModal] = useState(false);
  const [colLayout, setColLayout] = useState('text-text');
  const [colLeftText, setColLeftText] = useState('');
  const [colRightText, setColRightText] = useState('');
  const [colLeftImage, setColLeftImage] = useState(null);
  const [colRightImage, setColRightImage] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        heading: { levels: [1, 2, 3, 4, 5, 6] }, 
        link: false 
      }),
      Image.configure({ 
        allowBase64: true, 
        inline: false 
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
      TwoColumnNode, TwoColumnLeft, TwoColumnRight,
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

  const openColModal = () => {
    setColLayout('text-text');
    setColLeftText(''); 
    setColRightText('');
    setColLeftImage(null); 
    setColRightImage(null);
    setColModal(true);
  };

  const readImageAsBase64 = (file) => new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result);
    r.readAsDataURL(file);
  });

  const insertTwoColumn = () => {
    const isTextLeft = colLayout === 'text-text' || colLayout === 'text-image';
    const isTextRight = colLayout === 'text-text' || colLayout === 'image-text';

    const makeCol = (isText, text, imgSrc) => isText
      ? [{ type: 'paragraph', content: [{ type: 'text', text: text || (isText ? 'Column content...' : '') }] }]
      : [{ type: 'image', attrs: { src: imgSrc || '', alt: '' } }];

    editor.chain().focus().insertContent({
      type: 'twoColumn',
      content: [
        { type: 'twoColumnLeft',  content: makeCol(isTextLeft,  colLeftText,  colLeftImage)  },
        { type: 'twoColumnRight', content: makeCol(isTextRight, colRightText, colRightImage) },
      ],
    }).run();

    setColModal(false);
  };

  const insertTable = () => {
    const rows = prompt('Enter number of rows:', '3');
    const cols = prompt('Enter number of columns:', '3');
    if (rows && cols) {
      editor.chain().focus().insertTable({ rows: parseInt(rows), cols: parseInt(cols) }).run();
    }
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

          <Button size="small" icon={<ColumnWidthOutlined />} onClick={openColModal} title="Insert 2-Column Layout">
            2 Columns
          </Button>

          <Dropdown menu={{ items: [
            { key: 'insert', label: 'Insert Table', onClick: insertTable },
            { key: 'add-col-before', label: 'Add Column Before', onClick: () => editor.chain().focus().addColumnBefore().run() },
            { key: 'add-col-after', label: 'Add Column After', onClick: () => editor.chain().focus().addColumnAfter().run() },
            { key: 'del-col', label: 'Delete Column', onClick: () => editor.chain().focus().deleteColumn().run(), danger: true },
            { key: 'add-row-before', label: 'Add Row Before', onClick: () => editor.chain().focus().addRowBefore().run() },
            { key: 'add-row-after', label: 'Add Row After', onClick: () => editor.chain().focus().addRowAfter().run() },
            { key: 'del-row', label: 'Delete Row', onClick: () => editor.chain().focus().deleteRow().run(), danger: true },
            { key: 'merge', label: 'Merge Cells', onClick: () => editor.chain().focus().mergeCells().run() },
            { key: 'split', label: 'Split Cell', onClick: () => editor.chain().focus().splitCell().run() },
            { key: 'del-table', label: 'Delete Table', onClick: () => editor.chain().focus().deleteTable().run(), danger: true },
          ]}}>
            <Button size="small" icon={<TableOutlined />}>Table</Button>
          </Dropdown>

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <TB icon={<span style={{ fontSize: 16 }}>"</span>} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={isBlockquote} title="Blockquote" />
          <TB icon={<CodeOutlined />} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={isCodeBlock} title="Code Block" />
          <TB icon={<span style={{ fontSize: 16 }}>—</span>} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule" />
          <TB icon={<ClearOutlined />} onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Formatting" />
        </Space>
      </div>

      <EditorContent editor={editor} className="tiptap-editor-content" />

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

      {/* Two-Column Modal */}
      <Modal
        title="Insert 2-Column Layout"
        open={colModal}
        onOk={insertTwoColumn}
        onCancel={() => setColModal(false)}
        okText="Insert"
        width={700}
        style={{ top: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>Layout Type</div>
            <Radio.Group value={colLayout} onChange={e => { 
              setColLayout(e.target.value); 
              setColLeftImage(null); 
              setColRightImage(null); 
            }}>
              <Radio.Button value="text-text">📝 Text | Text</Radio.Button>
              <Radio.Button value="text-image">📝 Text | 🖼 Image</Radio.Button>
              <Radio.Button value="image-text">🖼 Image | 📝 Text</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left Column */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 6 }}>Left Column</div>
              {(colLayout === 'text-text' || colLayout === 'text-image') ? (
                <Input.TextArea rows={5} placeholder="Enter text for left column..." value={colLeftText}
                  onChange={e => setColLeftText(e.target.value)} style={{ resize: 'none' }} />
              ) : (
                <div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} id="col-left-img"
                    onChange={async (e) => { 
                      if (e.target.files[0]) { 
                        const b = await readImageAsBase64(e.target.files[0]); 
                        setColLeftImage(b); 
                        e.target.value = ''; 
                      } 
                    }} />
                  {colLeftImage ? (
                    <div style={{ position: 'relative' }}>
                      <img src={colLeftImage} style={{ width: '100%', borderRadius: 6, maxHeight: 150, objectFit: 'cover' }} />
                      <Button size="small" danger style={{ position: 'absolute', top: 4, right: 4 }} onClick={() => setColLeftImage(null)}>✕</Button>
                    </div>
                  ) : (
                    <label htmlFor="col-left-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d9d9d9', borderRadius: 8, padding: '24px 12px', cursor: 'pointer', background: '#fafafa' }}>
                      <UploadOutlined style={{ fontSize: 24, color: '#bfbfbf', marginBottom: 6 }} />
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>Click to upload image</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 6 }}>Right Column</div>
              {(colLayout === 'text-text' || colLayout === 'image-text') ? (
                <Input.TextArea rows={5} placeholder="Enter text for right column..." value={colRightText}
                  onChange={e => setColRightText(e.target.value)} style={{ resize: 'none' }} />
              ) : (
                <div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} id="col-right-img"
                    onChange={async (e) => { 
                      if (e.target.files[0]) { 
                        const b = await readImageAsBase64(e.target.files[0]); 
                        setColRightImage(b); 
                        e.target.value = ''; 
                      } 
                    }} />
                  {colRightImage ? (
                    <div style={{ position: 'relative' }}>
                      <img src={colRightImage} style={{ width: '100%', borderRadius: 6, maxHeight: 150, objectFit: 'cover' }} />
                      <Button size="small" danger style={{ position: 'absolute', top: 4, right: 4 }} onClick={() => setColRightImage(null)}>✕</Button>
                    </div>
                  ) : (
                    <label htmlFor="col-right-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d9d9d9', borderRadius: 8, padding: '24px 12px', cursor: 'pointer', background: '#fafafa' }}>
                      <UploadOutlined style={{ fontSize: 24, color: '#bfbfbf', marginBottom: 6 }} />
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>Click to upload image</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#8c8c8c', background: '#f5f5f5', borderRadius: 6, padding: '8px 12px' }}>
            💡 Content will appear side-by-side (left and right columns) with text and/or images.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TipTapEditor;