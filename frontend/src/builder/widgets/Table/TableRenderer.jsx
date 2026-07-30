/**
 * Table Renderer Component
 * Frontend renderer for table widget
 */

import React from 'react';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';

export default function TableRenderer({ node }) {
  const { darkMode } = useTheme();
  const content = safeParseJsonContent(node.content, { data: [] });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const tableData = content.data || [];
  const style = settings.style || 'default';
  const hasHeader = settings.hasHeader !== false;

  const tableStyles = {
    borderCollapse: 'collapse',
    width: '100%',
    color: darkMode ? '#cbd5e1' : undefined,
    ...styles,
  };

  const getCellStyles = (isHeader) => {
    const baseStyles = {
      padding: '12px 16px',
      border: style === 'bordered' ? `1px solid ${darkMode ? '#334155' : '#e8e8e8'}` : 'none',
    };

    if (style === 'striped' && !isHeader) {
      baseStyles.borderBottom = `1px solid ${darkMode ? '#1e293b' : '#f0f0f0'}`;
    }

    if (isHeader) {
      baseStyles.backgroundColor = darkMode ? '#0f172a' : '#f5f5f5';
      baseStyles.fontWeight = '600';
      baseStyles.textAlign = 'left';
    }

    return baseStyles;
  };

  return (
    <table style={tableStyles}>
      <tbody>
        {tableData.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            style={{
              backgroundColor: style === 'striped' && rowIndex % 2 === 1 && !(hasHeader && rowIndex === 0)
                ? (darkMode ? '#0f172a' : '#fafafa')
                : 'transparent',
            }}
          >
            {row.map((cell, colIndex) => {
              const isHeader = hasHeader && rowIndex === 0;
              const Tag = isHeader ? 'th' : 'td';
              return (
                <Tag key={colIndex} style={getCellStyles(isHeader)}>
                  {cell}
                </Tag>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
