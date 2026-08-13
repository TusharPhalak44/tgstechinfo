/**
 * Rich Text Widget Component
 * Builder component for rich text editing - WYSIWYG editor in canvas
 */

import React, { useRef, useEffect } from 'react';
import { Button, Space } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

export default function RichTextWidget({ node, onUpdate, error }) {
  const editorRef = useRef(null);
  const content = safeParseJsonContent(node.content, { html: '' });
  const settings = node.settings || {};
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Only set innerHTML once when component mounts or node ID changes
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = content.html || '';
      isInitializedRef.current = true;
    }
  }, [node.id]);

  // Reset initialization flag when node ID changes
  useEffect(() => {
    isInitializedRef.current = false;
  }, [node.id]);

  const execCmd = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (onUpdate) {
      onUpdate({
        ...node,
        content: JSON.stringify({
          ...content,
          html: editorRef.current?.innerHTML || '',
        }),
      });
    }
  };

  const insertLink = () => {
    editorRef.current?.focus();
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
      const links = editorRef.current?.querySelectorAll('a');
      links?.forEach(a => a.setAttribute('target', '_blank'));
      if (onUpdate) {
        onUpdate({
          ...node,
          content: JSON.stringify({
            ...content,
            html: editorRef.current?.innerHTML || '',
          }),
        });
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      const linkText = link.textContent;
      link.replaceWith(document.createTextNode(linkText));
    });
    
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('font-family');
      el.removeAttribute('font-size');
      el.removeAttribute('color');
    });
    
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/<!--[\s\S]*?-->/g, '');
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/&nbsp;/g, ' ');
    
    const spans = tempDiv.querySelectorAll('span');
    spans.forEach(span => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    
    const cleanHtml = tempDiv.innerHTML;
    document.execCommand('insertHTML', false, cleanHtml || text);
    if (onUpdate) {
      onUpdate({
        ...node,
        content: JSON.stringify({
          ...content,
          html: editorRef.current?.innerHTML || '',
        }),
      });
    }
  };

  const btnStyle = {
    minWidth: 32,
    height: 28,
    borderRadius: 4,
    border: '1px solid #d9d9d9',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
  };

  if (error) {
    return <div style={{ padding: 16, color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: 6, 
        flexWrap: 'wrap', 
        padding: '10px 12px', 
        background: '#fafafa', 
        borderRadius: 8, 
        border: '1px solid #e8e8e8', 
        alignItems: 'center',
        marginBottom: 12
      }}>
        <button onClick={() => execCmd('bold')} title="Bold" style={{ ...btnStyle, fontWeight: 'bold' }}>B</button>
        <button onClick={() => execCmd('italic')} title="Italic" style={{ ...btnStyle, fontStyle: 'italic' }}>I</button>
        <button onClick={() => execCmd('underline')} title="Underline" style={{ ...btnStyle, textDecoration: 'underline' }}>U</button>
        <button onClick={() => execCmd('strikeThrough')} title="Strikethrough" style={{ ...btnStyle, textDecoration: 'line-through' }}>S</button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <button onClick={() => execCmd('formatBlock', 'h1')} title="Heading 1" style={btnStyle}>H1</button>
        <button onClick={() => execCmd('formatBlock', 'h2')} title="Heading 2" style={btnStyle}>H2</button>
        <button onClick={() => execCmd('formatBlock', 'h3')} title="Heading 3" style={btnStyle}>H3</button>
        <button onClick={() => execCmd('formatBlock', 'p')} title="Paragraph" style={btnStyle}>P</button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <button onClick={() => execCmd('justifyLeft')} title="Align Left" style={btnStyle}>←</button>
        <button onClick={() => execCmd('justifyCenter')} title="Align Center" style={btnStyle}>↔</button>
        <button onClick={() => execCmd('justifyRight')} title="Align Right" style={btnStyle}>→</button>
        <button onClick={() => execCmd('justifyFull')} title="Justify" style={btnStyle}>≡</button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <button onClick={() => execCmd('insertUnorderedList')} title="Bullet List" style={btnStyle}>•</button>
        <button onClick={() => execCmd('insertOrderedList')} title="Numbered List" style={btnStyle}>1.</button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <input 
          type="color" 
          onChange={(e) => execCmd('foreColor', e.target.value)} 
          title="Text Color"
          style={{ width: 36, height: 28, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, padding: 2 }} 
        />
        <button onClick={insertLink} title="Insert Link" style={{ ...btnStyle, minWidth: 50 }}>Link</button>
        <button onClick={() => execCmd('removeFormat')} title="Clear Formatting" style={{ ...btnStyle, minWidth: 50 }}>Clear</button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (onUpdate) {
            onUpdate({
              ...node,
              content: JSON.stringify({
                ...content,
                html: editorRef.current?.innerHTML || '',
              }),
            });
          }
        }}
        onPaste={handlePaste}
        style={{
          minHeight: 150,
          padding: '12px',
          fontSize: 14,
          lineHeight: 1.6,
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          background: '#fff',
          outline: 'none',
          wordBreak: 'break-word',
        }}
      >
        {!content.html && (
          <span style={{ color: '#999', pointerEvents: 'none', userSelect: 'none' }}>
            Enter rich text content...
          </span>
        )}
      </div>
    </div>
  );
}
