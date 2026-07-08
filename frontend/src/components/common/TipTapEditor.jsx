import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
// ✅ Remove TextAlign import if not installed
// import { TextAlign } from '@tiptap/extension-text-align';
import { 
  Button, 
  Space, 
  Divider, 
  Dropdown, 
  Select
} from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  PictureOutlined,
  TableOutlined,
  CodeOutlined,
  UndoOutlined,
  RedoOutlined,
  ClearOutlined
} from '@ant-design/icons';
import './TipTapEditor.css';

const { Option } = Select;

const TipTapEditor = ({ value, onChange, placeholder = 'Write your content here...', initialContent }) => {
  const editorContainerRef = useRef(null);
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: false,
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      // ✅ Remove TextAlign from extensions
    ],
    content: initialContent || value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      updateEditorStates(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateEditorStates(editor);
    },
    onTransaction: ({ editor }) => {
      updateEditorStates(editor);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
  });

  // ✅ Function to update all editor states
  const updateEditorStates = (editorInstance) => {
    if (!editorInstance) return;
    
    // Update heading state
    let headingValue = 'paragraph';
    for (let i = 1; i <= 6; i++) {
      if (editorInstance.isActive('heading', { level: i })) {
        headingValue = `h${i}`;
        break;
      }
    }
    setCurrentHeading(headingValue);
    
    // ✅ Update all formatting states
    setIsBold(editorInstance.isActive('bold'));
    setIsItalic(editorInstance.isActive('italic'));
    setIsUnderline(editorInstance.isActive('underline'));
    setIsStrike(editorInstance.isActive('strike'));
    setIsBulletList(editorInstance.isActive('bulletList'));
    setIsOrderedList(editorInstance.isActive('orderedList'));
    setIsCode(editorInstance.isActive('code'));
    setIsBlockquote(editorInstance.isActive('blockquote'));
    setIsCodeBlock(editorInstance.isActive('codeBlock'));
    setIsLink(editorInstance.isActive('link'));
  };

  // Update editor content when value changes from parent
  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // ✅ Initialize editor states when editor loads
  useEffect(() => {
    if (editor) {
      updateEditorStates(editor);
    }
  }, [editor]);

  // ✅ Scroll to top when editor loads
  useEffect(() => {
    if (editorContainerRef.current) {
      const contentElement = editorContainerRef.current.querySelector('.tiptap-editor-content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
    }
  }, [editor]);

  if (!editor) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading editor...</div>;
  }

  // ✅ Toolbar Button Component with proper active state
  const ToolbarButton = ({ icon, onClick, active = false, disabled = false, title }) => (
    <Button
      type={active ? 'primary' : 'text'}
      icon={icon}
      onClick={() => {
        onClick();
        // ✅ Update states after click
        setTimeout(() => updateEditorStates(editor), 10);
      }}
      disabled={disabled}
      title={title}
      size="small"
      style={{ 
        padding: '4px 8px',
        height: 32,
        minWidth: 32,
        borderRadius: 4,
        border: active ? '1px solid #1890ff' : '1px solid transparent',
        background: active ? '#e6f7ff' : 'transparent',
        color: active ? '#1890ff' : '#333'
      }}
    />
  );

  // ✅ Handle heading change
  const handleHeadingChange = (value) => {
    setCurrentHeading(value);
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace('h', ''));
      editor.chain().focus().toggleHeading({ level }).run();
    }
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    const rows = prompt('Enter number of rows:', '3');
    const cols = prompt('Enter number of columns:', '3');
    if (rows && cols) {
      editor.chain().focus().insertTable({ rows: parseInt(rows), cols: parseInt(cols) }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('Enter link URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  // ✅ Toggle functions with state update
  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleStrike = () => {
    editor.chain().focus().toggleStrike().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleCode = () => {
    editor.chain().focus().toggleCode().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const toggleCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const unsetAllMarks = () => {
    editor.chain().focus().unsetAllMarks().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  // ✅ Alignment using inline styles (without TextAlign extension)
  const toggleAlign = (alignment) => {
    // Using execCommand for alignment
    document.execCommand(`justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`, false, null);
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const undo = () => {
    editor.chain().focus().undo().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  const redo = () => {
    editor.chain().focus().redo().run();
    setTimeout(() => updateEditorStates(editor), 10);
  };

  // Table operations
  const addColumnAfter = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const addColumnBefore = () => {
    editor.chain().focus().addColumnBefore().run();
  };

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
  };

  const addRowAfter = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const addRowBefore = () => {
    editor.chain().focus().addRowBefore().run();
  };

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run();
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
  };

  const mergeCells = () => {
    editor.chain().focus().mergeCells().run();
  };

  const splitCell = () => {
    editor.chain().focus().splitCell().run();
  };

  return (
    <div className="tiptap-editor-wrapper" ref={editorContainerRef}>
      {/* Toolbar - Fixed at top */}
      <div className="tiptap-toolbar">
        <Space size={4} wrap>
          {/* Undo/Redo */}
          <ToolbarButton
            icon={<UndoOutlined />}
            onClick={undo}
            disabled={!editor.can().undo()}
            title="Undo"
          />
          <ToolbarButton
            icon={<RedoOutlined />}
            onClick={redo}
            disabled={!editor.can().redo()}
            title="Redo"
          />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Text Formatting */}
          <ToolbarButton
            icon={<BoldOutlined />}
            onClick={toggleBold}
            active={isBold}
            title="Bold"
          />
          <ToolbarButton
            icon={<ItalicOutlined />}
            onClick={toggleItalic}
            active={isItalic}
            title="Italic"
          />
          <ToolbarButton
            icon={<UnderlineOutlined />}
            onClick={toggleUnderline}
            active={isUnderline}
            title="Underline"
          />
          <ToolbarButton
            icon={<StrikethroughOutlined />}
            onClick={toggleStrike}
            active={isStrike}
            title="Strikethrough"
          />
          <ToolbarButton
            icon={<CodeOutlined />}
            onClick={toggleCode}
            active={isCode}
            title="Code"
          />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Headings */}
          <Select
            size="small"
            style={{ width: 110 }}
            value={currentHeading}
            onChange={handleHeadingChange}
            popupMatchSelectWidth={false}
          >
            <Option value="paragraph">Paragraph</Option>
            <Option value="h1">Heading 1</Option>
            <Option value="h2">Heading 2</Option>
            <Option value="h3">Heading 3</Option>
            <Option value="h4">Heading 4</Option>
            <Option value="h5">Heading 5</Option>
            <Option value="h6">Heading 6</Option>
          </Select>

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Lists */}
          <ToolbarButton
            icon={<UnorderedListOutlined />}
            onClick={toggleBulletList}
            active={isBulletList}
            title="Bullet List"
          />
          <ToolbarButton
            icon={<OrderedListOutlined />}
            onClick={toggleOrderedList}
            active={isOrderedList}
            title="Numbered List"
          />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Alignment */}
          <ToolbarButton
            icon={<AlignLeftOutlined />}
            onClick={() => toggleAlign('left')}
            title="Align Left"
          />
          <ToolbarButton
            icon={<AlignCenterOutlined />}
            onClick={() => toggleAlign('center')}
            title="Align Center"
          />
          <ToolbarButton
            icon={<AlignRightOutlined />}
            onClick={() => toggleAlign('right')}
            title="Align Right"
          />
          <ToolbarButton
            icon={<span style={{ fontSize: 16 }}>≡</span>}
            onClick={() => toggleAlign('justify')}
            title="Justify"
          />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Links, Images, Tables */}
          <ToolbarButton
            icon={<LinkOutlined />}
            onClick={setLink}
            active={isLink}
            title="Insert Link"
          />
          <ToolbarButton
            icon={<PictureOutlined />}
            onClick={insertImage}
            title="Insert Image"
          />
          
          {/* Table Dropdown */}
          <Dropdown
            menu={{
              items: [
                { key: 'insert-table', label: 'Insert Table', onClick: insertTable },
                { key: 'add-column-before', label: 'Add Column Before', onClick: addColumnBefore },
                { key: 'add-column-after', label: 'Add Column After', onClick: addColumnAfter },
                { key: 'delete-column', label: 'Delete Column', onClick: deleteColumn, danger: true },
                { key: 'add-row-before', label: 'Add Row Before', onClick: addRowBefore },
                { key: 'add-row-after', label: 'Add Row After', onClick: addRowAfter },
                { key: 'delete-row', label: 'Delete Row', onClick: deleteRow, danger: true },
                { key: 'merge-cells', label: 'Merge Cells', onClick: mergeCells },
                { key: 'split-cell', label: 'Split Cell', onClick: splitCell },
                { key: 'delete-table', label: 'Delete Table', onClick: deleteTable, danger: true },
              ],
            }}
          >
            <Button size="small" icon={<TableOutlined />}>Table</Button>
          </Dropdown>

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Clear Formatting */}
          <ToolbarButton
            icon={<ClearOutlined />}
            onClick={unsetAllMarks}
            title="Clear Formatting"
          />

          {/* Code Block */}
          <ToolbarButton
            icon={<CodeOutlined />}
            onClick={toggleCodeBlock}
            active={isCodeBlock}
            title="Code Block"
          />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Blockquote */}
          <ToolbarButton
            icon={<span style={{ fontSize: 18 }}>“</span>}
            onClick={toggleBlockquote}
            active={isBlockquote}
            title="Blockquote"
          />

          <Divider style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />

          {/* Horizontal Rule */}
          <ToolbarButton
            icon={<span style={{ fontSize: 18 }}>—</span>}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Line"
          />

          {/* Hard Break */}
          <ToolbarButton
            icon={<span style={{ fontSize: 18 }}>↵</span>}
            onClick={() => editor.chain().focus().setHardBreak().run()}
            title="Line Break"
          />
        </Space>
      </div>

      {/* Editor Content - Scrollable */}
      <EditorContent editor={editor} className="tiptap-editor-content" />
    </div>
  );
};

export default TipTapEditor;