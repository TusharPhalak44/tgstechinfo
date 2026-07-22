import React from 'react';
import Editor from '@monaco-editor/react';

const HtmlEditor = ({ value, onChange, height = '600px' }) => {
  const handlePaste = (event) => {
    // Remove hyperlinks and clean HTML artifacts from pasted content
    const text = event.clipboardData.getData('text/plain');
    const html = event.clipboardData.getData('text/html');
    
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
    
    // Use cleaned HTML or plain text
    event.preventDefault();
    const cleanContent = cleanHtml || text;
    
    // Insert at cursor position
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(cleanContent);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Update the editor value
    if (onChange) {
      onChange(cleanContent);
    }
  };

  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }} onPaste={handlePaste}>
      <Editor
        height={height}
        defaultLanguage="html"
        value={value}
        onChange={(val) => onChange(val || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: false, // Disable default format to use our custom handler
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          matchBrackets: 'always',
          autoIndent: 'full',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          trimAutoWhitespace: true,
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
};

export default HtmlEditor;
