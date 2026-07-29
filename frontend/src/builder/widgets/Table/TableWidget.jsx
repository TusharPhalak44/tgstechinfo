/**
 * Table Widget Component
 * Builder component for table editing
 */

import React, { useState } from 'react';
import { Button, Input, InputNumber, Select, Space } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function TableWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { data: [['Header 1', 'Header 2', 'Header 3'], ['Cell 1', 'Cell 2', 'Cell 3']] });
  const settings = node.settings || {};

  const [rows, setRows] = useState(content.rows || 3);
  const [cols, setCols] = useState(content.cols || 3);
  const [tableData, setTableData] = useState(content.data || Array(rows).fill(null).map(() => Array(cols).fill('')));

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        data: newData,
      }),
    });
  };

  const handleResizeTable = (newRows, newCols) => {
    const newData = Array(newRows).fill(null).map((_, rowIndex) => {
      if (rowIndex < tableData.length) {
        return Array(newCols).fill(null).map((_, colIndex) => {
          if (colIndex < tableData[rowIndex].length) {
            return tableData[rowIndex][colIndex];
          }
          return '';
        });
      }
      return Array(newCols).fill('');
    });
    
    setRows(newRows);
    setCols(newCols);
    setTableData(newData);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        rows: newRows,
        cols: newCols,
        data: newData,
      }),
    });
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate?.({
      ...node,
      settings: updatedSettings,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Table Size
        </label>
        <Space>
          <div>
            <span style={{ marginRight: 8 }}>Rows:</span>
            <InputNumber
              value={rows}
              onChange={(value) => handleResizeTable(value, cols)}
              min={1}
              max={20}
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>Columns:</span>
            <InputNumber
              value={cols}
              onChange={(value) => handleResizeTable(rows, value)}
              min={1}
              max={10}
            />
          </div>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Table Style
        </label>
        <Select
          value={settings.style || 'default'}
          onChange={(value) => handleSettingChange('style', value)}
          style={{ width: '100%' }}
        >
          <Option value="default">Default</Option>
          <Option value="striped">Striped</Option>
          <Option value="bordered">Bordered</Option>
          <Option value="minimal">Minimal</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Header Row
        </label>
        <Select
          value={settings.hasHeader !== false}
          onChange={(value) => handleSettingChange('hasHeader', value)}
          style={{ width: '100%' }}
        >
          <Option value={true}>Yes</Option>
          <Option value={false}>No</Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '400px' }}>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      border: '1px solid #d9d9d9',
                      padding: '8px',
                      background: settings.hasHeader && rowIndex === 0 ? '#f5f5f5' : 'transparent',
                      fontWeight: settings.hasHeader && rowIndex === 0 ? '600' : 'normal',
                    }}
                  >
                    <Input
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      placeholder={settings.hasHeader && rowIndex === 0 ? `Header ${colIndex + 1}` : `Cell ${rowIndex + 1}-${colIndex + 1}`}
                      bordered={false}
                      style={{ background: 'transparent' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
