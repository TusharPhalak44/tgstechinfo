/**
 * Paragraph Widget
 * Independent widget module for paragraph elements
 */

import React, { useRef, useEffect } from 'react';
import { NodeType } from '../../utils/types';

/**
 * Paragraph Widget Component (Editor)
 * Renders the paragraph in the builder editor with rich text support
 */
export function ParagraphWidget({ node, onUpdate }) {
  const paraRef = useRef(null);
  const alignment = node.alignment || 'left';

  useEffect(() => {
    if (paraRef.current && paraRef.current.innerHTML !== (node.content || '')) {
      paraRef.current.innerHTML = node.content || '';
    }
  }, [node.id]);

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
    onUpdate({ content: paraRef.current?.innerHTML || '' });
  };

  const insertList = (tag) => {
    paraRef.current?.focus();
    document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false, null);
    onUpdate({ content: paraRef.current?.innerHTML || '' });
  };

  const btnStyle = (active) => ({
    minWidth: 32,
    height: 28,
    borderRadius: 4,
    border: active ? '2px solid #4a7cff' : '1px solid #d9d9d9',
    background: '#fff',
    paddingLeft: 8,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ 
        display: 'flex', 
        gap: 6, 
        flexWrap: 'wrap', 
        padding: '10px 12px', 
        background: '#fafafa', 
        borderRadius: 8, 
        border: '1px solid #e8e8e8', 
        alignItems: 'center' 
      }}>
        <button 
          onClick={() => execCmd('bold')} 
          style={{ fontWeight: 'bold', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}
        >
          B
        </button>
        <button 
          onClick={() => execCmd('italic')} 
          style={{ fontStyle: 'italic', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}
        >
          I
        </button>
        <button 
          onClick={() => execCmd('underline')} 
          style={{ textDecoration: 'underline', minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}
        >
          U
        </button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <input 
          type="color" 
          onChange={(e) => execCmd('foreColor', e.target.value)} 
          style={{ width: 36, height: 28, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, padding: 2 }} 
        />
        <button 
          onClick={insertLink} 
          style={{ minWidth: 50, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}
        >
          Link
        </button>
        <button 
          onClick={() => insertList('ul')} 
          style={{ minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}
        >
          • List
        </button>
        <button 
          onClick={() => insertList('ol')} 
          style={{ minWidth: 32, height: 28, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}
        >
          1. List
        </button>
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <button 
          onClick={() => onUpdate({ alignment: 'left' })} 
          style={btnStyle(alignment === 'left')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
        </button>
        <button 
          onClick={() => onUpdate({ alignment: 'center' })} 
          style={btnStyle(alignment === 'center')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 4h12v2H6V8zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
        </button>
        <button 
          onClick={() => onUpdate({ alignment: 'right' })} 
          style={btnStyle(alignment === 'right')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm6 4h12v2H9V8zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
        </button>
        <button 
          onClick={() => onUpdate({ alignment: 'justify' })} 
          style={btnStyle(alignment === 'justify')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm2 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm-2 4h18v2H3v-2z"/></svg>
        </button>
      </div>
      <div
        ref={paraRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onUpdate({ content: paraRef.current?.innerHTML || '' })}
        onPaste={handlePaste}
        style={{
          minHeight: 80,
          padding: '8px 11px',
          fontSize: 13,
          lineHeight: 1.6,
          textAlign: alignment,
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          background: '#fff',
          outline: 'none',
          wordBreak: 'break-word'
        }}
        data-placeholder="Enter paragraph text"
      />
    </div>
  );
}

/**
 * Paragraph Renderer (Frontend)
 */
export function ParagraphRenderer({ node }) {
  const alignment = node.alignment || 'left';
  return (
    <p style={{ textAlign: alignment }}>
      <div dangerouslySetInnerHTML={{ __html: node.content || '' }} />
    </p>
  );
}

/**
 * HTML Generator
 */
export function paragraphToHtml(node) {
  const alignment = node.alignment || 'left';
  return `<p style="text-align: ${alignment};">${node.content || ''}</p>`;
}

/**
 * Widget Registration
 */
export const paragraphWidgetRegistration = {
  type: NodeType.PARAGRAPH,
  component: ParagraphWidget,
  renderer: ParagraphRenderer,
  toHtml: paragraphToHtml,
  defaultProps: {
    content: '',
    alignment: 'left',
  },
  defaultStyles: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  metadata: {
    label: 'Paragraph',
    icon: '¶',
    category: 'text',
    description: 'Add a paragraph with rich text formatting',
  },
};
