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

// Custom extension to preserve raw HTML blocks (two-col layout)
const RawHtmlBlock = Node.create({
  name: 'rawHtmlBlock',
  group: 'block',
  atom: true,
  parseHTML() {
    return [{ tag: 'div.two-col-layout' }];
  },
  addAttributes() {
    return {
      innerHTML: { default: '' },
    };
  },
  renderHTML({ node }) {
    // Render as a div; actual innerHTML injected via NodeView
    return ['div', {
      class: 'two-col-layout',
      style: 'display:flex;flex-direction:row;gap:24px;align-items:flex-start;margin:16px 0;',
      'data-raw-html': node.attrs.innerHTML,
    }];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'two-col-layout';
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

  // Two-column modal
  const [twoColModal, setTwoColModal] = useState(false);
  const [twoColText, setTwoColText] = useState('');
  const [twoColImgSrc, setTwoColImgSrc] = useState('');
  const [twoColImgPos, setTwoColImgPos] = useState('right'); // 'left' | 'right'

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

  const openTwoColModal = () => {
    setTwoColText('');
    setTwoColImgSrc('');
    setTwoColImgPos('right');
    setTwoColModal(true);
  };

  const handleTwoColImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setTwoColImgSrc(e.target.result);
    reader.readAsDataURL(file);
    return false; // prevent auto-upload
  };

  const insertTwoCol = () => {
    if (!twoColText && !twoColImgSrc) return;
    const colStyle = 'flex:1;min-width:0;';
    const textHtml = `<div class="two-col-text" style="${colStyle}font-size:15px;line-height:1.75;"><p>${twoColText.replace(/\n/g, '</p><p>')}</p></div>`;
    const imgHtml  = twoColImgSrc
      ? `<div class="two-col-img" style="${colStyle}"><img src="${twoColImgSrc}" style="width:100%;height:auto;border-radius:8px;display:block;" /></div>`
      : '';
    const innerHTML = twoColImgPos === 'left'
      ? `${imgHtml}${textHtml}`
      : `${textHtml}${imgHtml}`;
    editor.chain().focus().insertRawHtml(innerHTML).run();
    setTwoColModal(false);
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

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          <Button size="small" icon={<LayoutOutlined />} onClick={openTwoColModal} title="Insert Two-Column Layout">
            2-Col
          </Button>
        </Space>
      </div>

      <EditorContent editor={editor} className="tiptap-editor-content" />

      {/* Two-Column Modal */}
      <Modal
        title="Insert Two-Column Layout"
        open={twoColModal}
        onOk={insertTwoCol}
        onCancel={() => setTwoColModal(false)}
        okText="Insert"
        width={560}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Image Position</div>
            <Radio.Group value={twoColImgPos} onChange={e => setTwoColImgPos(e.target.value)}>
              <Radio value="right">Text Left, Image Right</Radio>
              <Radio value="left">Image Left, Text Right</Radio>
            </Radio.Group>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Text Content *</div>
            <Input.TextArea
              rows={5}
              placeholder="Enter paragraph text here..."
              value={twoColText}
              onChange={e => setTwoColText(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Image</div>
            <Upload beforeUpload={handleTwoColImage} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
            {twoColImgSrc && (
              <img src={twoColImgSrc} alt="preview" style={{ marginTop: 8, maxHeight: 120, borderRadius: 6, border: '1px solid #eee' }} />
            )}
          </div>
          {/* Preview */}
          {(twoColText || twoColImgSrc) && (
            <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 12, background: '#fafafa' }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>Preview</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {twoColImgPos === 'left' && twoColImgSrc && <img src={twoColImgSrc} alt="" style={{ flex: 1, maxWidth: '50%', borderRadius: 6 }} />}
                {twoColText && <p style={{ flex: 1, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{twoColText}</p>}
                {twoColImgPos === 'right' && twoColImgSrc && <img src={twoColImgSrc} alt="" style={{ flex: 1, maxWidth: '50%', borderRadius: 6 }} />}
              </div>
            </div>
          )}
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