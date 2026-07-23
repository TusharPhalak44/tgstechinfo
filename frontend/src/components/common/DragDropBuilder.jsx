import React, { useRef, useState, useEffect } from 'react';
import { Form, DatePicker, Upload, Select as AntSelect, Tooltip, Input as AntInput } from 'antd';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { GripVertical, Trash2, Plus, Menu, Webhook, Info, Upload as UploadIcon, FileText, Image } from 'lucide-react';
import TipTapEditor from './TipTapEditor';

const richEditorStyle = document.createElement('style');
richEditorStyle.textContent = `
  [data-placeholder]:empty:before { content: attr(data-placeholder); color: #bfbfbf; pointer-events: none; }
  [contenteditable] ul { list-style-type: disc; padding-left: 24px; margin: 4px 0; }
  [contenteditable] ol { list-style-type: decimal; padding-left: 24px; margin: 4px 0; }
  [contenteditable] li { display: list-item; margin: 2px 0; }
`;
if (!document.head.querySelector('[data-rich-editor-style]')) {
  richEditorStyle.setAttribute('data-rich-editor-style', '1');
  document.head.appendChild(richEditorStyle);
}


const SECTION_TYPES = [
  { type: 'content_type_category', label: 'Content Type & Category' },
  { type: 'title_description',     label: 'Title & Description' },
  { type: 'banner_image',          label: 'Banner Image' },
  { type: 'pdf_attachment',        label: 'PDF Attachment' },
  { type: 'content',               label: 'Content' },
  { type: 'tags',                  label: 'Tags' },
  { type: 'schedule',              label: 'Schedule' },
  { type: 'reorder_layout',        label: 'Reorder Layout' },
  { type: 'seo',                   label: 'SEO Settings' },
];

const CONTENT_ELEMENTS = [
  { type: 'heading', label: 'Heading', tag: 'h', icon: 'H' },
  { type: 'paragraph', label: 'Paragraph', tag: 'p', icon: '¶' },
  { type: 'bullet_list', label: 'Bullet List', tag: 'ul', icon: '•' },
  { type: 'numbered_list', label: 'Numbered List', tag: 'ol', icon: '1.' },
  { type: 'line_break', label: 'Line Break', tag: 'br', icon: '↵' },
  { type: 'image', label: 'Image', tag: 'img', icon: '🖼' },
  { type: 'divider', label: 'Divider', tag: 'hr', icon: '—' },
  { type: 'blockquote', label: 'Blockquote', tag: 'blockquote', icon: '"' },
  { type: 'code_block', label: 'Code Block', tag: 'pre', icon: '</>' },
  { type: 'table', label: 'Table', tag: 'table', icon: '▦' },
  { type: 'section_break', label: 'Section Break', tag: 'br', icon: '⏎' },
  { type: 'table_row', label: 'Table Row', tag: 'tr', icon: '▦' },
  { type: 'split_section', label: 'Split Section', tag: 'div', icon: '⚡' },
  { type: 'button', label: 'Button', tag: 'button', icon: '🔘' },
];

const SplitContentEditor = ({ section, onUpdate }) => {
  const ref = React.useRef(null);
  const [align, setAlign] = useState(section.alignment || 'left');

  useEffect(() => { setAlign(section.alignment || 'left'); }, [section.alignment]);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (section.text || '')) {
      ref.current.innerHTML = section.text || '';
    }
  }, [section.id]);

  const exec = (cmd, val = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onUpdate({ text: ref.current?.innerHTML || '' });
  };

  const insertLink = () => {
    ref.current?.focus();
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
      ref.current?.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'));
      onUpdate({ text: ref.current?.innerHTML || '' });
    }
  };

  const handlePaste = (e) => {
    // Remove hyperlinks and clean HTML artifacts from pasted content
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    
    // Remove all <a> tags from HTML, keeping only the text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove all anchor tags
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      const linkText = link.textContent;
      link.replaceWith(document.createTextNode(linkText));
    });
    
    // Remove inline styles from all elements
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('font-family');
      el.removeAttribute('font-size');
      el.removeAttribute('color');
    });
    
    // Remove HTML comments (StartFragment, EndFragment)
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove &nbsp; and replace with regular space
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/&nbsp;/g, ' ');
    
    // Remove unnecessary span tags (keeping only text content)
    const spans = tempDiv.querySelectorAll('span');
    spans.forEach(span => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    
    const cleanHtml = tempDiv.innerHTML;
    
    // Insert cleaned content
    document.execCommand('insertHTML', false, cleanHtml || text);
    onUpdate({ text: ref.current?.innerHTML || '' });
  };

  const btnStyle = (active) => ({ minWidth: 32, height: 28, borderRadius: 4, border: active ? '2px solid #4a7cff' : '1px solid #d9d9d9', background: '#fff', paddingLeft: 8 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', alignItems: 'center' }}>
        <Button size="small" onClick={() => exec('bold')} style={{ fontWeight: 'bold', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>B</Button>
        <Button size="small" onClick={() => exec('italic')} style={{ fontStyle: 'italic', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>I</Button>
        <Button size="small" onClick={() => exec('underline')} style={{ textDecoration: 'underline', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>U</Button>
        <input type="color" onChange={(e) => exec('foreColor', e.target.value)} style={{ width: 36, height: 28, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, padding: 2 }} />
        <Button size="small" onClick={insertLink} style={{ minWidth: 50, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>Link</Button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 2px' }} />
        <Button size="small" onClick={() => { setAlign('left'); onUpdate({ alignment: 'left' }); }} style={btnStyle(align === 'left')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
        </Button>
        <Button size="small" onClick={() => { setAlign('center'); onUpdate({ alignment: 'center' }); }} style={btnStyle(align === 'center')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 4h12v2H6V8zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
        </Button>
        <Button size="small" onClick={() => { setAlign('right'); onUpdate({ alignment: 'right' }); }} style={btnStyle(align === 'right')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm6 4h12v2H9V8zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
        </Button>
        <Button size="small" onClick={() => { setAlign('justify'); onUpdate({ alignment: 'justify' }); }} style={btnStyle(align === 'justify')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm2 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm-2 4h18v2H3v-2z"/></svg>
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onUpdate({ text: ref.current?.innerHTML || '' })}
        onPaste={handlePaste}
        style={{
          minHeight: 80, padding: '8px 11px', fontSize: 13, lineHeight: 1.6,
          textAlign: align, border: '1px solid #d9d9d9', borderRadius: 6,
          background: '#fff', outline: 'none', wordBreak: 'break-word'
        }}
      />
    </div>
  );
};

const ContentElementEditor = ({ element, onUpdate }) => {
  // State for table initial setup (outside switch to avoid hook rules)
  const [tableRowCount, setTableRowCount] = useState(2);
  const [tableColCount, setTableColCount] = useState(2);
  const [showAddFields, setShowAddFields] = useState(false);
  const [showRemoveFields, setShowRemoveFields] = useState(false);
  const [addRowCount, setAddRowCount] = useState(1);
  const [addColCount, setAddColCount] = useState(1);
  const [removeRowCount, setRemoveRowCount] = useState(1);
  const [removeColCount, setRemoveColCount] = useState(1);

  // State for split section initial setup
  const [splitTextCount, setSplitTextCount] = useState(1);
  const [splitImageCount, setSplitImageCount] = useState(1);

  // State for paragraph alignment — sync with element.alignment
  const [alignment, setAlignment] = useState(element.alignment || 'left');
  useEffect(() => { setAlignment(element.alignment || 'left'); }, [element.alignment]);

  switch (element.type) {
    case 'heading':
      const headingAlignment = element.alignment || 'left';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AntSelect
              value={element.headingLevel || 'h2'}
              onChange={(value) => onUpdate({ headingLevel: value })}
              style={{ width: 80 }}
              size="small"
            >
              <AntSelect.Option value="h1">H1</AntSelect.Option>
              <AntSelect.Option value="h2">H2</AntSelect.Option>
              <AntSelect.Option value="h3">H3</AntSelect.Option>
              <AntSelect.Option value="h4">H4</AntSelect.Option>
              <AntSelect.Option value="h5">H5</AntSelect.Option>
              <AntSelect.Option value="h6">H6</AntSelect.Option>
            </AntSelect>
            <AntInput
              placeholder="Enter heading text"
              value={element.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              style={{ 
                flex: 1, 
                fontWeight: 600,
                textAlign: headingAlignment,
                fontSize: element.headingLevel === 'h1' ? '24px' : 
                       element.headingLevel === 'h2' ? '20px' : 
                       element.headingLevel === 'h3' ? '18px' : '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button 
              size="small" 
              onClick={() => onUpdate({ alignment: 'left' })}
              style={{ 
                minWidth: 32, height: 28, borderRadius: 4,
                border: headingAlignment === 'left' ? '2px solid #4a7cff' : '1px solid #d9d9d9',
                background: '#fff', paddingLeft: 8
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
            </Button>
            <Button 
              size="small" 
              onClick={() => onUpdate({ alignment: 'center' })}
              style={{ 
                minWidth: 32, height: 28, borderRadius: 4,
                border: headingAlignment === 'center' ? '2px solid #4a7cff' : '1px solid #d9d9d9',
                background: '#fff', paddingLeft: 8
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 4h12v2H6V8zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
            </Button>
            <Button 
              size="small" 
              onClick={() => onUpdate({ alignment: 'right' })}
              style={{ 
                minWidth: 32, height: 28, borderRadius: 4,
                border: headingAlignment === 'right' ? '2px solid #4a7cff' : '1px solid #d9d9d9',
                background: '#fff', paddingLeft: 8
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm6 4h12v2H9V8zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
            </Button>
            <Button 
              size="small" 
              onClick={() => onUpdate({ alignment: 'justify' })}
              style={{ 
                minWidth: 32, height: 28, borderRadius: 4,
                border: headingAlignment === 'justify' ? '2px solid #4a7cff' : '1px solid #d9d9d9',
                background: '#fff', paddingLeft: 8
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm2 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm-2 4h18v2H3v-2z"/></svg>
            </Button>
          </div>
        </div>
      );
    case 'paragraph': {
      const paraRef = React.useRef(null);
      useEffect(() => {
        if (paraRef.current && paraRef.current.innerHTML !== (element.content || '')) {
          paraRef.current.innerHTML = element.content || '';
        }
      }, [element.id]);

      const execCmd = (cmd, val = null) => {
        paraRef.current?.focus();
        document.execCommand(cmd, false, val);
        onUpdate({ content: paraRef.current?.innerHTML || '' });
      };

      const insertLink = () => {
        paraRef.current?.focus();
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
          const links = paraRef.current?.querySelectorAll('a');
          links?.forEach(a => a.setAttribute('target', '_blank'));
          onUpdate({ content: paraRef.current?.innerHTML || '' });
        }
      };

      const handlePaste = (e) => {
        // Remove hyperlinks and clean HTML artifacts from pasted content
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');
        
        // Remove all <a> tags from HTML, keeping only the text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove all anchor tags
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
          const linkText = link.textContent;
          link.replaceWith(document.createTextNode(linkText));
        });
        
        // Remove inline styles from all elements
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
          el.removeAttribute('style');
          el.removeAttribute('class');
          el.removeAttribute('font-family');
          el.removeAttribute('font-size');
          el.removeAttribute('color');
        });
        
        // Remove HTML comments (StartFragment, EndFragment)
        tempDiv.innerHTML = tempDiv.innerHTML.replace(/<!--[\s\S]*?-->/g, '');
        
        // Remove &nbsp; and replace with regular space
        tempDiv.innerHTML = tempDiv.innerHTML.replace(/&nbsp;/g, ' ');
        
        // Remove unnecessary span tags (keeping only text content)
        const spans = tempDiv.querySelectorAll('span');
        spans.forEach(span => {
          const parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        });
        
        const cleanHtml = tempDiv.innerHTML;
        
        // Insert cleaned content
        document.execCommand('insertHTML', false, cleanHtml || text);
        onUpdate({ content: paraRef.current?.innerHTML || '' });
      };

      const insertList = (tag) => {
        paraRef.current?.focus();
        document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false, null);
        onUpdate({ content: paraRef.current?.innerHTML || '' });
      };

      const btnStyle = (active) => ({
        minWidth: 32, height: 28, borderRadius: 4,
        border: active ? '2px solid #4a7cff' : '1px solid #d9d9d9',
        background: '#fff', paddingLeft: 8
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', alignItems: 'center' }}>
            <Button size="small" onClick={() => execCmd('bold')} style={{ fontWeight: 'bold', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>B</Button>
            <Button size="small" onClick={() => execCmd('italic')} style={{ fontStyle: 'italic', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>I</Button>
            <Button size="small" onClick={() => execCmd('underline')} style={{ textDecoration: 'underline', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>U</Button>
            <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
            <AntSelect size="small" style={{ width: 90, height: 28 }} defaultValue="13" onChange={(v) => execCmd('fontSize', v === '13' ? '3' : v === '12' ? '2' : v === '14' ? '3' : v === '16' ? '4' : v === '18' ? '5' : '6')}>
              <AntSelect.Option value="12">12px</AntSelect.Option>
              <AntSelect.Option value="13">13px</AntSelect.Option>
              <AntSelect.Option value="14">14px</AntSelect.Option>
              <AntSelect.Option value="16">16px</AntSelect.Option>
              <AntSelect.Option value="18">18px</AntSelect.Option>
              <AntSelect.Option value="20">20px</AntSelect.Option>
            </AntSelect>
            <input type="color" onChange={(e) => execCmd('foreColor', e.target.value)} style={{ width: 36, height: 28, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, padding: 2 }} />
            <Button size="small" onClick={insertLink} style={{ minWidth: 50, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>Link</Button>
            <Button size="small" onClick={() => insertList('ul')} style={{ minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>• List</Button>
            <Button size="small" onClick={() => insertList('ol')} style={{ minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>1. List</Button>
            <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
            <Button size="small" onClick={() => { setAlignment('left'); onUpdate({ alignment: 'left' }); }} style={btnStyle(alignment === 'left')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
            </Button>
            <Button size="small" onClick={() => { setAlignment('center'); onUpdate({ alignment: 'center' }); }} style={btnStyle(alignment === 'center')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 4h12v2H6V8zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
            </Button>
            <Button size="small" onClick={() => { setAlignment('right'); onUpdate({ alignment: 'right' }); }} style={btnStyle(alignment === 'right')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm6 4h12v2H9V8zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
            </Button>
            <Button size="small" onClick={() => { setAlignment('justify'); onUpdate({ alignment: 'justify' }); }} style={btnStyle(alignment === 'justify')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm2 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm-2 4h18v2H3v-2z"/></svg>
            </Button>
          </div>
          <div
            ref={paraRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => onUpdate({ content: paraRef.current?.innerHTML || '' })}
            onPaste={handlePaste}
            style={{
              minHeight: 80, padding: '8px 11px', fontSize: 13, lineHeight: 1.6,
              textAlign: alignment, border: '1px solid #d9d9d9', borderRadius: 6,
              background: '#fff', outline: 'none', wordBreak: 'break-word'
            }}
            data-placeholder="Enter paragraph text"
          />
        </div>
      );
    }
    case 'bullet_list':
    case 'numbered_list':
      return (
        <AntInput.TextArea
          placeholder={`Enter ${element.label} items (one per line)`}
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={4}
          style={{ fontSize: 13 }}
        />
      );
    case 'line_break':
      return (
        <div style={{ fontSize: 12, color: '#bfbfbf', fontStyle: 'italic' }}>
          Line break element - no content needed
        </div>
      );
    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Upload 
            beforeUpload={() => false} 
            showUploadList={false}
            onChange={(info) => {
              if (info.fileList && info.fileList.length > 0) {
                const file = info.fileList[0];
                if (file.originFileObj) {
                  const reader = new FileReader();
                  reader.onload = (e) => onUpdate({ content: e.target.result });
                  reader.readAsDataURL(file.originFileObj);
                }
              }
            }}
          >
            <Button size="small">
              <UploadIcon style={{ width: 14, height: 14 }} />
              Upload Image
            </Button>
          </Upload>
          {element.content && (
            <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
              <img 
                src={element.content} 
                alt="Preview" 
                style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} 
              />
            </div>
          )}
        </div>
      );
    case 'divider':
      return (
        <div style={{ fontSize: 12, color: '#bfbfbf', fontStyle: 'italic' }}>
          Divider element - no content needed
        </div>
      );
    case 'blockquote':
      return (
        <AntInput.TextArea
          placeholder="Enter quote text"
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={2}
          style={{ fontSize: 13, fontStyle: 'italic' }}
        />
      );
    case 'code_block':
      return (
        <AntInput.TextArea
          placeholder="Enter code"
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={4}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      );
    case 'table':
      // Parse table content from string or initialize with default
      const parseTableData = (content) => {
        if (!content) {
          return null; // Return null to show initial setup
        }
        try {
          const parsed = JSON.parse(content);
          return parsed;
        } catch {
          return null;
        }
      };

      const tableData = parseTableData(element.content);

      const createTable = () => {
        const data = Array(tableRowCount).fill(null).map(() => Array(tableColCount).fill(''));
        onUpdate({ content: JSON.stringify({
          rows: tableRowCount,
          cols: tableColCount,
          data: data
        }) });
      };

      const updateCell = (rowIndex, colIndex, value) => {
        if (!tableData) return;
        const newData = [...tableData.data];
        newData[rowIndex][colIndex] = value;
        onUpdate({ content: JSON.stringify({
          rows: tableData.rows,
          cols: tableData.cols,
          data: newData
        }) });
      };

      const addRows = (count) => {
        if (!tableData || count <= 0) return;
        const newRows = Array(count).fill(null).map(() => Array(tableData.cols).fill(''));
        const newData = [...tableData.data, ...newRows];
        onUpdate({ content: JSON.stringify({
          rows: tableData.rows + count,
          cols: tableData.cols,
          data: newData
        }) });
      };

      const removeRows = (count) => {
        if (!tableData || count <= 0 || tableData.rows - count < 1) return;
        const newData = tableData.data.slice(0, tableData.rows - count);
        onUpdate({ content: JSON.stringify({
          rows: tableData.rows - count,
          cols: tableData.cols,
          data: newData
        }) });
      };

      const addColumns = (count) => {
        if (!tableData || count <= 0) return;
        const newData = tableData.data.map(row => [...row, ...Array(count).fill('')]);
        onUpdate({ content: JSON.stringify({
          rows: tableData.rows,
          cols: tableData.cols + count,
          data: newData
        }) });
      };

      const removeColumns = (count) => {
        if (!tableData || count <= 0 || tableData.cols - count < 1) return;
        const newData = tableData.data.map(row => row.slice(0, tableData.cols - count));
        onUpdate({ content: JSON.stringify({
          rows: tableData.rows,
          cols: tableData.cols - count,
          data: newData
        }) });
      };

      // Initial setup state
      if (!tableData) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Rows</label>
                <AntInput
                  type="number"
                  min="1"
                  max="20"
                  value={tableRowCount}
                  onChange={(e) => setTableRowCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of rows"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Columns</label>
                <AntInput
                  type="number"
                  min="1"
                  max="10"
                  value={tableColCount}
                  onChange={(e) => setTableColCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of columns"
                />
              </div>
            </div>
            <Button type="primary" onClick={createTable} style={{ width: '100%' }}>
              Create Table
            </Button>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Table Controls */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button 
              size="small" 
              onClick={() => setShowAddFields(!showAddFields)}
              type={showAddFields ? 'primary' : 'default'}
            >
              + Add
            </Button>
            <Button 
              size="small" 
              onClick={() => setShowRemoveFields(!showRemoveFields)}
              type={showRemoveFields ? 'primary' : 'default'}
            >
              - Remove
            </Button>
          </div>

          {/* Add Fields */}
          {showAddFields && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Rows to Add</label>
                <AntInput
                  type="number"
                  min="1"
                  value={addRowCount}
                  onChange={(e) => setAddRowCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of rows"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Columns to Add</label>
                <AntInput
                  type="number"
                  min="1"
                  value={addColCount}
                  onChange={(e) => setAddColCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of columns"
                />
              </div>
              <Button type="primary" onClick={() => {
                // Combine both operations into a single update
                const newData = [...tableData.data];
                // Add rows
                const newRows = Array(addRowCount).fill(null).map(() => Array(tableData.cols).fill(''));
                newData.push(...newRows);
                // Add columns to all rows (including newly added ones)
                const finalData = newData.map(row => [...row, ...Array(addColCount).fill('')]);
                onUpdate({ content: JSON.stringify({
                  rows: tableData.rows + addRowCount,
                  cols: tableData.cols + addColCount,
                  data: finalData
                }) });
                setShowAddFields(false);
              }}>
                Apply
              </Button>
            </div>
          )}

          {/* Remove Fields */}
          {showRemoveFields && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Rows to Remove</label>
                <AntInput
                  type="number"
                  min="1"
                  max={tableData.rows - 1}
                  value={removeRowCount}
                  onChange={(e) => setRemoveRowCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of rows"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Columns to Remove</label>
                <AntInput
                  type="number"
                  min="1"
                  max={tableData.cols - 1}
                  value={removeColCount}
                  onChange={(e) => setRemoveColCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number of columns"
                />
              </div>
              <Button type="primary" danger onClick={() => {
                // Combine both operations into a single update
                let newData = [...tableData.data];
                // Remove rows
                if (tableData.rows - removeRowCount >= 1) {
                  newData = newData.slice(0, tableData.rows - removeRowCount);
                }
                // Remove columns from all remaining rows
                if (tableData.cols - removeColCount >= 1) {
                  newData = newData.map(row => row.slice(0, tableData.cols - removeColCount));
                }
                onUpdate({ content: JSON.stringify({
                  rows: Math.max(1, tableData.rows - removeRowCount),
                  cols: Math.max(1, tableData.cols - removeColCount),
                  data: newData
                }) });
                setShowRemoveFields(false);
              }}>
                Apply
              </Button>
            </div>
          )}

          {/* Table */}
          <div style={{ overflow: 'auto', border: '1px solid #e8e8e8', borderRadius: 4 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 400 }}>
              <tbody>
                {tableData.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} style={{ border: '1px solid #e8e8e8', padding: 0 }}>
                        <AntInput
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          placeholder={`Cell ${rowIndex + 1}-${colIndex + 1}`}
                          style={{ 
                            border: 'none', 
                            borderRadius: 0,
                            width: '100%',
                            height: 40
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: '#8c8c8c' }}>Click + Add or - Remove to show input fields, then enter counts and click Apply.</p>
        </div>
      );
    case 'section_break':
      return (
        <div style={{ fontSize: 12, color: '#bfbfbf', fontStyle: 'italic' }}>
          Section break - adds double line break
        </div>
      );
    case 'table_row':
      return (
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8c8c8c' }}>|</span>
          <AntInput
            placeholder="Enter table row (| Cell1 | Cell2 |)"
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            style={{ paddingLeft: 24 }}
          />
        </div>
      );
    case 'split_section':
      // Parse split section data - now supports multiple sections
      const parseSplitData = (content) => {
        if (!content) {
          return null; // Return null to show initial setup
        }
        try {
          return JSON.parse(content);
        } catch {
          return null;
        }
      };

      const splitData = parseSplitData(element.content);

      const generateSections = () => {
        const sections = [];
        let sectionId = 1;
        
        // Add text sections
        for (let i = 0; i < splitTextCount; i++) {
          sections.push({
            id: sectionId++,
            layout: 'text-only',
            image: '',
            text: ''
          });
        }
        
        // Add image sections
        for (let i = 0; i < splitImageCount; i++) {
          sections.push({
            id: sectionId++,
            layout: 'image-only',
            image: '',
            text: ''
          });
        }
        
        onUpdate({ content: JSON.stringify({ sections }) });
      };

      const removeSection = (sectionId) => {
        if (splitData.sections.length <= 1) return;
        const newSections = splitData.sections.filter(section => section.id !== sectionId);
        onUpdate({ content: JSON.stringify({ sections: newSections }) });
      };

      const updateSection = (sectionId, updates) => {
        const newSections = splitData.sections.map(section => 
          section.id === sectionId ? { ...section, ...updates } : section
        );
        onUpdate({ content: JSON.stringify({ sections: newSections }) });
      };

      const handleDragStart = (e, index) => {
        e.dataTransfer.setData('sectionIndex', index);
      };

      const handleDragOver = (e) => {
        e.preventDefault();
      };

      const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('sectionIndex'));
        if (dragIndex === dropIndex) return;
        
        const newSections = [...splitData.sections];
        const [draggedSection] = newSections.splice(dragIndex, 1);
        newSections.splice(dropIndex, 0, draggedSection);
        
        onUpdate({ content: JSON.stringify({ sections: newSections }) });
      };

      // Initial setup state
      if (!splitData) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Text Sections</label>
                <AntInput
                  type="number"
                  min="0"
                  max="10"
                  value={splitTextCount}
                  onChange={(e) => setSplitTextCount(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of text sections"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Image Sections</label>
                <AntInput
                  type="number"
                  min="0"
                  max="10"
                  value={splitImageCount}
                  onChange={(e) => setSplitImageCount(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of image sections"
                />
              </div>
            </div>
            <Button type="primary" onClick={generateSections} style={{ width: '100%' }}>
              Generate Sections
            </Button>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Render Sections */}
          {splitData.sections.map((section, index) => (
            <div 
              key={section.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{ 
                padding: 16, 
                background: '#fafafa', 
                borderRadius: 8, 
                border: '1px solid #e8e8e8',
                position: 'relative',
                cursor: 'move',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1890ff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8e8e8'}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GripVertical style={{ width: 16, height: 16, color: '#8c8c8c', cursor: 'grab' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#595959' }}>Section {index + 1}</span>
                </div>
                {splitData.sections.length > 1 && (
                  <Button 
                    type="text" 
                    danger 
                    size="small"
                    onClick={() => removeSection(section.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Layout Selection */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Layout</label>
                <AntSelect
                  value={section.layout}
                  onChange={(value) => updateSection(section.id, { layout: value })}
                  style={{ width: '100%' }}
                  size="small"
                >
                  <AntSelect.Option value="image-left">Image Left + Text Right</AntSelect.Option>
                  <AntSelect.Option value="image-right">Text Left + Image Right</AntSelect.Option>
                  <AntSelect.Option value="text-only">Text Only</AntSelect.Option>
                  <AntSelect.Option value="image-only">Image Only</AntSelect.Option>
                </AntSelect>
              </div>

              {/* Image Section */}
              {section.layout !== 'text-only' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Image</label>
                  <Upload 
                    beforeUpload={() => false} 
                    showUploadList={false}
                    onChange={(info) => {
                      if (info.fileList && info.fileList.length > 0) {
                        const file = info.fileList[0];
                        if (file.originFileObj) {
                          const reader = new FileReader();
                          reader.onload = (e) => updateSection(section.id, { image: e.target.result });
                          reader.readAsDataURL(file.originFileObj);
                        }
                      }
                    }}
                  >
                    <Button size="small">
                      <UploadIcon style={{ width: 14, height: 14 }} />
                      Upload Image
                    </Button>
                  </Upload>
                  {section.image && (
                    <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                      <img 
                        src={section.image} 
                        alt="Preview" 
                        style={{ width: '100%', maxHeight: 150, objectFit: 'contain', display: 'block' }} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Text Section */}
              {section.layout !== 'image-only' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Content</label>
                  <SplitContentEditor
                    section={section}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    case 'button':
      // Parse button data
      const parseButtonData = (content) => {
        if (!content) {
          return {
            text: 'Click Me',
            actionType: 'redirect',
            url: '',
            height: '40px',
            width: 'auto',
            backgroundColor: '#4a7cff',
            textColor: '#ffffff',
            borderRadius: '8px'
          };
        }
        try {
          return typeof content === 'string' ? JSON.parse(content) : content;
        } catch {
          return {
            text: 'Click Me',
            actionType: 'redirect',
            url: '',
            height: '40px',
            width: 'auto',
            backgroundColor: '#4a7cff',
            textColor: '#ffffff',
            borderRadius: '8px'
          };
        }
      };

      const buttonData = parseButtonData(element.content);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Button Text */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Button Text</label>
            <AntInput
              placeholder="Enter button text"
              value={buttonData.text}
              onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, text: e.target.value }) })}
              style={{ width: '100%' }}
            />
          </div>

          {/* Action Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Action Type</label>
            <AntSelect
              value={buttonData.actionType}
              onChange={(value) => onUpdate({ content: JSON.stringify({ ...buttonData, actionType: value }) })}
              style={{ width: '100%' }}
            >
              <AntSelect.Option value="redirect">Redirect to URL</AntSelect.Option>
              <AntSelect.Option value="download">Download File</AntSelect.Option>
            </AntSelect>
          </div>

          {/* URL/Path */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>
              {buttonData.actionType === 'redirect' ? 'Redirect URL' : 'Download URL/Path'}
            </label>
            <AntInput
              placeholder={buttonData.actionType === 'redirect' ? 'https://example.com' : '/uploads/file.pdf'}
              value={buttonData.url}
              onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, url: e.target.value }) })}
              style={{ width: '100%' }}
            />
          </div>

          {/* CSS Properties */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Height</label>
              <AntInput
                placeholder="40px"
                value={buttonData.height}
                onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, height: e.target.value }) })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Width</label>
              <AntInput
                placeholder="auto"
                value={buttonData.width}
                onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, width: e.target.value }) })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Border Radius</label>
              <AntInput
                placeholder="8px"
                value={buttonData.borderRadius}
                onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, borderRadius: e.target.value }) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Background Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={buttonData.backgroundColor}
                  onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, backgroundColor: e.target.value }) })}
                  style={{ width: 40, height: 32, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4 }}
                />
                <AntInput
                  value={buttonData.backgroundColor}
                  onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, backgroundColor: e.target.value }) })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Text Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={buttonData.textColor}
                  onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, textColor: e.target.value }) })}
                  style={{ width: 40, height: 32, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4 }}
                />
                <AntInput
                  value={buttonData.textColor}
                  onChange={(e) => onUpdate({ content: JSON.stringify({ ...buttonData, textColor: e.target.value }) })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 4 }}>Preview</label>
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', textAlign: 'center' }}>
              <button
                style={{
                  height: buttonData.height,
                  width: buttonData.width,
                  backgroundColor: buttonData.backgroundColor,
                  color: buttonData.textColor,
                  borderRadius: buttonData.borderRadius,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '0 20px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {buttonData.text}
              </button>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <AntInput
          placeholder="Enter content"
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
        />
      );
  }
};

const SectionRenderer = ({ type, props }) => {
  const {
    form, categories, contentTypes, setSelectedTypeName,
    fileList, setFileList, pdfList, setPdfList,
    content, setContent, initialContent, editorReady,
    onAddContentElement, contentElements, onRemoveContentElement, onUpdateContentElement
  } = props;

  const sectionStyle = { background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' };

  switch (type) {
    case 'content_type_category':
      return (
        <div style={sectionStyle}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Article Details</span>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <Form.Item name="content_type_id" label="Content Type" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1, marginBottom: 0 }}>
              <AntSelect placeholder="Select type" size="large" onChange={val => {
                const name = contentTypes.find(t => t.id === val)?.name?.toLowerCase() || '';
                setSelectedTypeName(name);
              }}>
                {contentTypes.map(t => <AntSelect.Option key={t.id} value={t.id}>{t.name}</AntSelect.Option>)}
              </AntSelect>
            </Form.Item>
            <Form.Item name="category_id" label="Category" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1, marginBottom: 0 }}>
              <AntSelect placeholder="Select category" size="large">
                {categories.map(c => <AntSelect.Option key={c.id} value={c.id}>{c.name}</AntSelect.Option>)}
              </AntSelect>
            </Form.Item>
          </div>
        </div>
      );

    case 'title_description':
      return (
        <div style={sectionStyle}>
          <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
            <AntInput placeholder="Article title..." size="large"
              style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: '#1a1a1a' }} />
          </Form.Item>
          <Form.Item name="short_description"
            label={<span>Short Description <Tooltip title="Brief summary shown in article cards"><Info className="ml-2" style={{ color: '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
            rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 0 }}>
            <AntInput.TextArea rows={3} placeholder="Write a compelling summary..." style={{ resize: 'none', fontSize: 15, lineHeight: 1.7 }} />
          </Form.Item>
        </div>
      );

    case 'banner_image': {
      const bannerUrl = fileList.length > 0
        ? (fileList[0].originFileObj ? URL.createObjectURL(fileList[0].originFileObj) : fileList[0].url)
        : null;
      return (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}><Image className="inline mr-2" style={{ color: '#4a7cff' }} />Banner Image</span>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Recommended: 1200×630px</div>
            </div>
            <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
              <Button size="small" icon={<UploadIcon className="w-4 h-4" />}>{fileList.length > 0 ? 'Change Image' : 'Upload Image'}</Button>
            </Upload>
          </div>
          {bannerUrl ? (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
              <img src={bannerUrl} alt="Banner" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
            </div>
          ) : (
            <div style={{ border: '2px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', textAlign: 'center', background: '#fafafa' }}>
              <Image style={{ fontSize: 32, color: '#bfbfbf', marginBottom: 8, display: 'block' }} />
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>No banner image</span>
            </div>
          )}
        </div>
      );
    }

    case 'pdf_attachment':
      return (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}><FileText className="inline mr-2" style={{ color: '#ff4d4f' }} />PDF Attachment</span>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>This PDF will be downloaded when user submits the access form</div>
            </div>
            <Upload beforeUpload={() => false} fileList={pdfList} onChange={({ fileList: fl }) => setPdfList(fl)} maxCount={1} showUploadList={false} accept=".pdf">
              <Button size="small" icon={<UploadIcon className="w-4 h-4" />}>{pdfList.length > 0 ? 'Change PDF' : 'Upload PDF'}</Button>
            </Upload>
          </div>
          {pdfList.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff2f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
              <FileText style={{ color: '#ff4d4f', fontSize: 20 }} />
              <span style={{ flex: 1, fontSize: 13 }}>{pdfList[0].name}</span>
              <Button type="text" size="small" danger icon={<Trash2 className="w-4 h-4" />} onClick={() => setPdfList([])} />
            </div>
          ) : (
            <div style={{ border: '2px dashed #ffccc7', borderRadius: 8, padding: '20px', textAlign: 'center', background: '#fff2f0' }}>
              <FileText style={{ fontSize: 24, color: '#ff4d4f', marginBottom: 4, display: 'block' }} />
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>No PDF attached</span>
            </div>
          )}
        </div>
      );

    case 'content':
      console.log('SectionRenderer content - contentElements:', contentElements);
      console.log('SectionRenderer content - props.contentElements:', props.contentElements);
      const isMobile = window.innerWidth < 768;
      return (
        <div style={sectionStyle}>
          <div style={{ padding: '14px 28px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Content</span>
          </div>
          <div style={{ display: 'flex', gap: 16, padding: '16px 28px', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Left sidebar for content elements */}
            <div style={{ width: isMobile ? '100%' : 180, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Content Blocks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1fr', gap: isMobile ? 8 : 0 }}>
                {CONTENT_ELEMENTS.map(el => (
                  <div
                    key={el.type}
                    draggable={!isMobile}
                    onClick={() => isMobile && props.onAddContentElement?.(el.type, el.label)}
                    onDragStart={(e) => {
                      if (!isMobile) {
                        e.dataTransfer.setData('elementType', el.type);
                        e.dataTransfer.setData('elementLabel', el.label);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', marginBottom: 6,
                      background: '#fff', borderRadius: 8,
                      border: '1px solid #e8e8e8', cursor: isMobile ? 'pointer' : 'grab',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; e.currentTarget.style.background = '#f0f4ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: '#e6f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a7cff', fontSize: 11, fontWeight: 600 }}>
                      {el.icon}
                    </span>
                    <span style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 500, flex: 1 }}>
                      {el.label}
                    </span>
                  </div>
                ))}
              </div>
              {isMobile && (
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 8, fontStyle: 'italic' }}>
                  Tap blocks to add them
                </div>
              )}
            </div>

            {/* Main content area (canvas) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {props.contentElements && props.contentElements.length > 0 ? (
                <div 
                  style={{ minHeight: 200, border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: '#fafafa' }}
                  onDragOver={e => !isMobile && e.preventDefault()}
                  onDrop={(e) => {
                    if (isMobile) return;
                    e.preventDefault();
                    const elementType = e.dataTransfer.getData('elementType');
                    const elementLabel = e.dataTransfer.getData('elementLabel');
                    if (elementType && elementLabel) {
                      props.onAddContentElement?.(elementType, elementLabel);
                    }
                  }}
                >
                  {props.contentElements.map((element, index) => (
                    <div
                      key={element.id}
                      onDragEnter={() => !isMobile && props.onContentDragEnter?.(index)}
                      onDragEnd={!isMobile ? props.onContentDragEnd : undefined}
                      onDragOver={e => !isMobile && e.preventDefault()}
                      style={{
                        marginBottom: 12, padding: 12, background: '#fff',
                        borderRadius: 8, border: '1px solid #e8e8e8', cursor: 'default'
                      }}
                    >
                      <div
                        draggable={!isMobile}
                        onDragStart={() => !isMobile && props.onContentDragStart?.(index)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: isMobile ? 'default' : 'grab' }}
                      >
                        {!isMobile && <GripVertical style={{ color: '#bfbfbf', width: 16, height: 16 }} />}
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {element.label}
                        </span>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 style={{ width: 14, height: 14 }} />}
                          onClick={() => props.onRemoveContentElement?.(element.id)}
                          style={{ marginLeft: 'auto', cursor: 'pointer' }}
                        />
                      </div>
                      <ContentElementEditor element={element} onUpdate={(updates) => props.onUpdateContentElement?.(element.id, updates)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  style={{
                    minHeight: 200, border: '2px dashed #e8e8e8', borderRadius: 8,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, background: '#fafafa'
                  }}
                  onDragOver={e => !isMobile && e.preventDefault()}
                  onDrop={(e) => {
                    if (isMobile) return;
                    e.preventDefault();
                    const elementType = e.dataTransfer.getData('elementType');
                    const elementLabel = e.dataTransfer.getData('elementLabel');
                    if (elementType && elementLabel) {
                      props.onAddContentElement?.(elementType, elementLabel);
                    }
                  }}
                >
                  <div style={{ fontSize: 32 }}>📝</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#595959' }}>
                    {isMobile ? 'Tap blocks above to add them' : 'Drag blocks from the left panel to add them'}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {isMobile ? 'Use desktop to drag and reorder' : 'Drag to reorder after adding'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'tags':
      return (
        <div style={sectionStyle}>
          <Form.Item name="tags" label="Tags" style={{ marginBottom: 0 }}>
            <AntSelect mode="tags" placeholder="Add tags and press Enter..." />
          </Form.Item>
        </div>
      );

    case 'schedule':
      return (
        <div style={sectionStyle}>
          <Form.Item name="scheduled_publish_date" label="Schedule" style={{ marginBottom: 0 }} help="Leave empty to publish after approval">
            <DatePicker format="YYYY-MM-DD" placeholder="Select publish date" style={{ width: '100%' }} />
          </Form.Item>
        </div>
      );

    case 'reorder_layout':
      return (
        <div style={sectionStyle}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Reorder Layout</span>
          <div style={{ marginTop: 16, padding: '16px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', color: '#8c8c8c', fontSize: 13 }}>
            Layout reordering functionality - drag sections to reorder
          </div>
        </div>
      );

    case 'seo':
      return (
        <div style={sectionStyle}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SEO Settings</span>
          <div style={{ marginTop: 16 }}>
            <Form.Item name="seo_meta_title" label="Meta Title" style={{ marginBottom: 16 }}>
              <AntInput placeholder="SEO title" />
            </Form.Item>
            <Form.Item name="seo_meta_description" label="Meta Description" style={{ marginBottom: 16 }}>
              <AntInput.TextArea rows={3} placeholder="SEO description" style={{ resize: 'none' }} />
            </Form.Item>
            <Form.Item name="seo_meta_keywords" label="Meta Keywords" style={{ marginBottom: 0 }}>
              <AntSelect mode="tags" placeholder="Add keyword and press Enter..." />
            </Form.Item>
          </div>
        </div>
      );

    default: return null;
  }
};

const LANDING_TYPES = ['webinar', 'whitepaper', 'event', 'ebook'];

const DragDropBuilder = ({ sectionProps, selectedTypeName = '', customFields = [], setCustomFields, fieldTypes = [], sections, onSectionsChange, onContentElementsChange, contentElements: externalContentElements, onAddContentElement: externalAddElement, onRemoveContentElement: externalRemoveElement, onUpdateContentElement: externalUpdateElement }) => {
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const [internalContentElements, setInternalContentElements] = useState([]);
  const contentDragItem = useRef(null);
  const contentDragOver = useRef(null);

  // Use external elements if provided (edit mode), otherwise use internal state
  const contentElements = externalContentElements !== undefined ? externalContentElements : internalContentElements;
  const setContentElements = (updater) => {
    if (externalContentElements !== undefined) return; // managed externally
    setInternalContentElements(updater);
  };

  // Sync internal state when external elements are provided (e.g. on edit load)
  useEffect(() => {
    if (externalContentElements !== undefined && externalContentElements.length > 0) {
      setInternalContentElements(externalContentElements);
    }
  }, []);

  // Update parent when internal content elements change
  useEffect(() => {
    if (externalContentElements === undefined && onContentElementsChange) {
      onContentElementsChange(internalContentElements);
    }
  }, [internalContentElements, onContentElementsChange]);

  const addedTypes = sections.map(s => s.type);
  const availableSections = SECTION_TYPES.filter(s => !addedTypes.includes(s.type));

  const addSection = (type) => {
    onSectionsChange([...sections, { id: `sec-${Date.now()}`, type }]);
  };

  const removeSection = (id) => {
    onSectionsChange(sections.filter(s => s.id !== id));
  };

  const onDragStart = (index) => { dragItem.current = index; };
  const onDragEnter = (index) => { dragOver.current = index; };
  const onDragEnd = () => {
    const items = [...sections];
    const dragged = items.splice(dragItem.current, 1)[0];
    items.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    onSectionsChange(items);
  };

  const showLandingFields = LANDING_TYPES.includes((selectedTypeName || '').toLowerCase());

  // Auto-add PDF attachment section for landing types
  useEffect(() => {
    const isLandingType = LANDING_TYPES.includes((selectedTypeName || '').toLowerCase());
    const hasPdfSection = sections.some(s => s.type === 'pdf_attachment');
    
    if (isLandingType && !hasPdfSection) {
      onSectionsChange([...sections, { id: `sec-${Date.now()}`, type: 'pdf_attachment' }]);
    } else if (!isLandingType && hasPdfSection) {
      onSectionsChange(sections.filter(s => s.type !== 'pdf_attachment'));
    }
  }, [selectedTypeName]);

  const addField = () => {
    setCustomFields(prev => [...prev, {
      id: Date.now(), name: `field_${Date.now()}`, label: '',
      type: 'text', placeholder: '', options: '', required: true,
      consent_text: '', redirect_link: ''
 
    }]);
  };

  const updateField = (id, key, value) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [key]: value };
      if (key === 'label') updated.name = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${id}`;
      return updated;
    }));
  };

  const removeField = (id) => setCustomFields(prev => prev.filter(f => f.id !== id));

  // Content element drag and drop handlers
  const addContentElement = (elementType, elementLabel) => {
    if (externalAddElement) {
      externalAddElement(elementType, elementLabel);
      return;
    }
    const element = CONTENT_ELEMENTS.find(e => e.type === elementType);
    setInternalContentElements(prev => [...prev, {
      id: `el-${Date.now()}`,
      type: elementType,
      tag: element.tag,
      label: elementLabel || element.label,
      content: '',
      headingLevel: elementType === 'heading' ? 'h2' : undefined
    }]);
  };

  const removeContentElement = (id) => {
    if (externalRemoveElement) {
      externalRemoveElement(id);
      return;
    }
    setInternalContentElements(prev => prev.filter(e => e.id !== id));
  };

  const updateContentElement = (id, updates) => {
    if (externalUpdateElement) {
      externalUpdateElement(id, updates);
      return;
    }
    setInternalContentElements(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (typeof updates === 'string') return { ...e, content: updates };
      return { ...e, ...updates };
    }));
  };

  const onContentDragStart = (index) => { contentDragItem.current = index; };
  const onContentDragEnter = (index) => { contentDragOver.current = index; };
  const onContentDragEnd = () => {
    const elements = [...contentElements];
    const dragged = elements.splice(contentDragItem.current, 1)[0];
    elements.splice(contentDragOver.current, 0, dragged);
    contentDragItem.current = null;
    contentDragOver.current = null;
    if (externalContentElements !== undefined && onContentElementsChange) {
      onContentElementsChange(elements);
    } else {
      setInternalContentElements(elements);
    }
  };

  // Convert content elements to HTML
  const generateContentHtml = () => {
    return contentElements.map(element => {
      switch (element.type) {
        case 'heading':
          const headingLevel = element.headingLevel || 'h2';
          return `<${headingLevel}>${element.content}</${headingLevel}>`;
        case 'paragraph':
          return element.content ? `<p style="text-align:${element.alignment||'left'}">${element.content}</p>` : '';
        case 'bullet_list':
          const bulletItems = element.content.split('\n').filter(Boolean);
          return `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
        case 'numbered_list':
          const numberedItems = element.content.split('\n').filter(Boolean);
          return `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
        case 'line_break':
          return '<br>';
        case 'image':
          return `<img src="${element.content}" alt="Image" />`;
        case 'divider':
          return '<hr>';
        case 'blockquote':
          return `<blockquote>${element.content}</blockquote>`;
        case 'code_block':
          return `<pre><code>${element.content}</code></pre>`;
        case 'table':
          try {
            const tableData = JSON.parse(element.content);
            if (tableData.data && Array.isArray(tableData.data)) {
              const tableHtml = tableData.data.map(row => {
                return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
              }).join('');
              return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">${tableHtml}</table>`;
            }
          } catch (e) {
            // Fallback to pipe-separated format
            const rows = element.content.split('\n').filter(Boolean);
            const tableHtml = rows.map(row => {
              const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
              return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
            }).join('');
            return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">${tableHtml}</table>`;
          }
          return '';
        case 'section_break':
          return '<br><br>';
        case 'bullet_item':
          return `<ul><li>${element.content}</li></ul>`;
        case 'numbered_item':
          return `<ol><li>${element.content}</li></ol>`;
        case 'table_row':
          const cells = element.content.split('|').map(cell => cell.trim()).filter(Boolean);
          return `<table><tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr></table>`;
        case 'split_section':
          try {
            const splitData = JSON.parse(element.content);
            if (splitData.sections && Array.isArray(splitData.sections)) {
              return splitData.sections.map(section => {
                const layout = section.layout || 'text-only';
                const imageHtml = section.image ? `<img src="${section.image}" alt="Section Image" style="max-width: 100%; height: auto;" />` : '';
                const textHtml = section.text ? `<div style="text-align:${section.alignment||'left'}">${section.text}</div>` : '';
                
                switch (layout) {
                  case 'image-left':
                    return `<div style="display: flex; gap: 20px; margin: 20px 0; align-items: flex-start;">
                      <div style="flex: 1;">${imageHtml}</div>
                      <div style="flex: 1;">${textHtml}</div>
                    </div>`;
                  case 'image-right':
                    return `<div style="display: flex; gap: 20px; margin: 20px 0; align-items: flex-start;">
                      <div style="flex: 1;">${textHtml}</div>
                      <div style="flex: 1;">${imageHtml}</div>
                    </div>`;
                  case 'text-only':
                    return `<div style="margin: 20px 0;">${textHtml}</div>`;
                  case 'image-only':
                    return `<div style="margin: 20px 0;">${imageHtml}</div>`;
                  default:
                    return `<div style="margin: 20px 0;">${textHtml}</div>`;
                }
              }).join('\n');
            }
          } catch (e) {
            console.error('Error parsing split section:', e, 'Content:', element.content);
          }
          return '';
        case 'button':
          try {
            const buttonData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
            if (buttonData) {
              const actionAttr = buttonData.actionType === 'download' 
                ? `download href="${buttonData.url}"` 
                : `href="${buttonData.url}" target="_blank"`;
              
              return `<a ${actionAttr} style="
                display: inline-block;
                height: ${buttonData.height || '40px'};
                width: ${buttonData.width || 'auto'};
                background-color: ${buttonData.backgroundColor || '#4a7cff'};
                color: ${buttonData.textColor || '#ffffff'};
                border-radius: ${buttonData.borderRadius || '8px'};
                text-decoration: none;
                padding: 0 20px;
                line-height: ${buttonData.height || '40px'};
                text-align: center;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              ">${buttonData.text || 'Click Me'}</a>`;
            }
          } catch (e) {
            console.error('Error parsing button:', e);
          }
          return '';
        default:
          return '';
      }
    }).join('\n');
  };

  const fieldDragItem = useRef(null);
  const fieldDragOver = useRef(null);
  const onFieldDragStart = (index) => { fieldDragItem.current = index; };
  const onFieldDragEnter = (index) => { fieldDragOver.current = index; };
  const onFieldDragEnd = () => {
    const fields = [...customFields];
    const dragged = fields.splice(fieldDragItem.current, 1)[0];
    fields.splice(fieldDragOver.current, 0, dragged);
    fieldDragItem.current = null;
    fieldDragOver.current = null;
    setCustomFields(fields);
  };

  console.log('DragDropBuilder render - contentElements:', contentElements);
  console.log('DragDropBuilder render - sections:', sections);

  return (
    <>
      {sections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No sections added yet</p>
          <p className="text-gray-400 text-sm mt-2">Sections will be added automatically based on your content type</p>
        </div>
      ) : (
        sections.map((sec, index) => (
          <SectionRenderer 
            key={sec.id}
            type={sec.type} 
            props={{
              ...sectionProps,
              onAddContentElement: addContentElement,
              contentElements,
              onRemoveContentElement: removeContentElement,
              onUpdateContentElement: updateContentElement,
              onContentDragStart,
              onContentDragEnter,
              onContentDragEnd
            }} 
          />
        ))
      )}

      {/* Landing Page Form Fields — auto shown for webinar/whitepaper/event */}
      {showLandingFields && (
        <>
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}><Menu className="inline mr-2" style={{ color: '#4a7cff' }} />Client Webhook URL</span>
              </div>
            </div>
            <Form.Item name="webhook_url" className="mb-0"
              rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
              <div className="relative">
                <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="https://client-api.example.com/webhook"
                  className="pl-10 transition-shadow focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </Form.Item>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}><Menu className="inline mr-2" style={{ color: '#4a7cff' }} />Landing Page Form Fields</span>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Add all form fields with their label, API key, and type.</div>
              </div>
              <Button size="small" variant="outline" className="gap-2" onClick={addField}>
                <Plus className="w-4 h-4" />
                Add Field
              </Button>
            </div>
            {customFields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c', fontSize: 13, border: '2px dashed #e8e8e8', borderRadius: 8 }}>
                No fields added. Click "Add Field" to add form fields.
              </div>
            )}
            {customFields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => onFieldDragStart(index)}
                onDragEnter={() => onFieldDragEnter(index)}
                onDragEnd={onFieldDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', marginBottom: 10, background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', cursor: 'grab' }}
              >
                <GripVertical className="text-gray-300 mt-2 cursor-grab flex-shrink-0 w-4 h-4" />
                <div className="flex-1 flex gap-2 flex-wrap">
                  <Input placeholder="Field Label (e.g. First Name)" value={field.label}
                    onChange={e => updateField(field.id, 'label', e.target.value)}
                    className="flex-[1_1_140px]" />
                  <Input placeholder="API Key (e.g. firstname)" value={field.webhook_key || ''}
                    onChange={e => updateField(field.id, 'webhook_key', e.target.value)}
                    className="flex-[1_1_130px]" />
                  <Select value={field.type} onValueChange={v => updateField(field.id, 'type', v)}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Placeholder text" value={field.placeholder}
                    onChange={e => updateField(field.id, 'placeholder', e.target.value)}
                    className="flex-[1_1_130px]" />
                  {field.type === 'select' && (
                    <Input placeholder="Options (comma separated)" value={field.options}
                      onChange={e => updateField(field.id, 'options', e.target.value)}
                      className="flex-[1_1_180px]" />
                  )}
                </div>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0" onClick={() => removeField(field.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default DragDropBuilder;