/**
 * Table Inspector Component
 * Property inspector for table widget
 */

import React from 'react';
import { InputNumber, Select, Switch, Input, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import InspectorPanel, { InspectorFormItem } from '../../components/InspectorPanel';

const { Option } = Select;

export default function TableInspector({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { data: [['Header 1', 'Header 2', 'Header 3'], ['Cell 1', 'Cell 2', 'Cell 3']] });
  const settings = node.settings || {};
  const tableData = Array.isArray(content.data) ? content.data : [['Header 1', 'Header 2', 'Header 3'], ['Cell 1', 'Cell 2', 'Cell 3']];

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate({
      settings: updatedSettings,
    });
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = tableData.map((row, rIdx) => 
      rIdx === rowIndex 
        ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
        : row
    );
    onUpdate({
      content: JSON.stringify({ data: newData }),
    });
  };

  const handleAddRow = () => {
    const colCount = tableData[0]?.length || 3;
    const newRow = Array(colCount).fill('New cell');
    const newData = [...tableData, newRow];
    onUpdate({
      content: JSON.stringify({ data: newData }),
    });
  };

  const handleRemoveRow = (rowIndex) => {
    if (tableData.length <= 1) return; // Keep at least one row
    const newData = tableData.filter((_, idx) => idx !== rowIndex);
    onUpdate({
      content: JSON.stringify({ data: newData }),
    });
  };

  const handleAddColumn = () => {
    const newData = tableData.map(row => [...row, 'New cell']);
    onUpdate({
      content: JSON.stringify({ data: newData }),
    });
  };

  const handleRemoveColumn = (colIndex) => {
    if (tableData[0]?.length <= 1) return; // Keep at least one column
    const newData = tableData.map(row => row.filter((_, idx) => idx !== colIndex));
    onUpdate({
      content: JSON.stringify({ data: newData }),
    });
  };

  return (
    <InspectorPanel>
      {/* Table Data Editor */}
      <InspectorFormItem label="Table Data">
        <div style={{ marginBottom: 12 }}>
          {tableData.map((row, rowIndex) => (
            <div key={rowIndex} style={{ marginBottom: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#666', minWidth: 60 }}>
                    Row {rowIndex + 1}
                  </span>
                  {tableData.length > 1 && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveRow(rowIndex)}
                      style={{ marginLeft: 'auto' }}
                    >
                      Remove Row
                    </Button>
                  )}
                </div>
                {row.map((cell, colIndex) => (
                  <Space.Compact key={colIndex} style={{ width: '100%' }}>
                    <Input
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      placeholder={`Cell ${rowIndex + 1},${colIndex + 1}`}
                      size="small"
                      style={{ flex: 1 }}
                    />
                    {rowIndex === 0 && row.length > 1 && (
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveColumn(colIndex)}
                        title="Remove Column"
                      />
                    )}
                  </Space.Compact>
                ))}
              </Space>
            </div>
          ))}
        </div>
        
        <Space style={{ width: '100%' }}>
          <Button
            type="dashed"
            onClick={handleAddRow}
            icon={<PlusOutlined />}
            size="small"
            style={{ flex: 1 }}
          >
            Add Row
          </Button>
          <Button
            type="dashed"
            onClick={handleAddColumn}
            icon={<PlusOutlined />}
            size="small"
            style={{ flex: 1 }}
          >
            Add Column
          </Button>
        </Space>
      </InspectorFormItem>

      {/* Table Style Settings */}
      <InspectorFormItem label="Table Style">
        <Select
          value={settings.style || 'default'}
          onChange={(value) => handleSettingChange('style', value)}
        >
          <Option value="default">Default</Option>
          <Option value="striped">Striped</Option>
          <Option value="bordered">Bordered</Option>
          <Option value="minimal">Minimal</Option>
        </Select>
      </InspectorFormItem>

      <InspectorFormItem label="Header Row">
        <Switch
          checked={settings.hasHeader !== false}
          onChange={(checked) => handleSettingChange('hasHeader', checked)}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Border Width">
        <InputNumber
          value={settings.borderWidth || 1}
          onChange={(value) => handleSettingChange('borderWidth', value)}
          min={0}
          max={5}
          style={{ width: '100%' }}
        />
      </InspectorFormItem>

      <InspectorFormItem label="Cell Padding">
        <InputNumber
          value={settings.cellPadding || 12}
          onChange={(value) => handleSettingChange('cellPadding', value)}
          min={0}
          max={50}
          style={{ width: '100%' }}
        />
      </InspectorFormItem>
    </InspectorPanel>
  );
}
