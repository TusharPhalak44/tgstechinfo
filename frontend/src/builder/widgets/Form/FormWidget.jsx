/**
 * Form Widget Component
 * Builder component for form creation
 */

import React, { useState } from 'react';
import { Button, Input, Select, Space, Modal, message, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { Option } = Select;

export default function FormWidget({ node, onUpdate }) {
  const content = safeParseJsonContent(node.content, { fields: [], formName: 'Contact Form', submitText: 'Submit', successMessage: 'Thank you for your submission!' });
  const settings = node.settings || {};

  const [fields, setFields] = useState(content.fields || []);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newFieldType, setNewFieldType] = useState('text');

  // Quick template for white paper download form
  const applyWhitePaperTemplate = () => {
    const templateFields = [
      { id: `field_${Date.now()}_1`, type: 'text', label: 'First Name', placeholder: 'Enter your first name', required: true },
      { id: `field_${Date.now()}_2`, type: 'text', label: 'Last Name', placeholder: 'Enter your last name', required: true },
      { id: `field_${Date.now()}_3`, type: 'email', label: 'Business Email', placeholder: 'your@company.com', required: true },
      { id: `field_${Date.now()}_4`, type: 'text', label: 'Country', placeholder: 'Enter your country', required: true },
      { id: `field_${Date.now()}_5`, type: 'text', label: 'Company Name', placeholder: 'Enter your company name', required: true },
      { id: `field_${Date.now()}_6`, type: 'text', label: 'Job Title', placeholder: 'Enter your job title', required: true },
    ];
    
    setFields(templateFields);
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        fields: templateFields,
        formName: 'White Paper Download',
        submitText: 'DOWNLOAD THE WHITE PAPER',
      }),
    });
    message.success('White paper form template applied');
  };

  const handleSettingChange = (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    onUpdate?.({
      ...node,
      settings: updatedSettings,
    });
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: newFieldType,
      label: `${newFieldType.charAt(0).toUpperCase() + newFieldType.slice(1)} Field`,
      placeholder: '',
      required: false,
      options: newFieldType === 'select' || newFieldType === 'radio' || newFieldType === 'checkbox' ? ['Option 1', 'Option 2'] : [],
    };

    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        fields: updatedFields,
      }),
    });

    setShowFieldModal(false);
  };

  const removeField = (fieldId) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    setFields(updatedFields);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        fields: updatedFields,
      }),
    });
  };

  const updateField = (fieldId, updates) => {
    const updatedFields = fields.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    );
    setFields(updatedFields);
    
    onUpdate?.({
      ...node,
      content: JSON.stringify({
        ...content,
        fields: updatedFields,
      }),
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Form Name
        </label>
        <Input
          value={content.formName || 'Contact Form'}
          onChange={(e) => onUpdate?.({
            ...node,
            content: JSON.stringify({
              ...content,
              formName: e.target.value,
            }),
          })}
          placeholder="Contact Form"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Submit Button Text
        </label>
        <Input
          value={content.submitText || 'Submit'}
          onChange={(e) => onUpdate?.({
            ...node,
            content: JSON.stringify({
              ...content,
              submitText: e.target.value,
            }),
          })}
          placeholder="Submit"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Success Message
        </label>
        <Input
          value={content.successMessage || 'Thank you for your submission!'}
          onChange={(e) => onUpdate?.({
            ...node,
            content: JSON.stringify({
              ...content,
              successMessage: e.target.value,
            }),
          })}
          placeholder="Thank you for your submission!"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Form Fields
        </label>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 12 }}>
          {fields.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
              No fields added yet
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  style={{
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 6,
                    border: '1px solid #e8e8e8',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{field.label}</span>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => removeField(field.id)}
                      danger
                      size="small"
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    Type: {field.type}
                  </div>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Field Label"
                    size="small"
                    style={{ marginBottom: 8 }}
                  />
                  <Input
                    value={field.placeholder}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Placeholder"
                    size="small"
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12 }}>Required</span>
                    <Switch
                      size="small"
                      checked={field.required || false}
                      onChange={(checked) => updateField(field.id, { required: checked })}
                    />
                  </div>
                </div>
              ))}
            </Space>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setShowFieldModal(true)}
          style={{ flex: 1 }}
        >
          Add Field
        </Button>
        <Button
          type="primary"
          onClick={applyWhitePaperTemplate}
          style={{ flex: 1 }}
        >
          White Paper Template
        </Button>
      </div>

      <Modal
        title="Add Form Field"
        open={showFieldModal}
        onOk={addField}
        onCancel={() => setShowFieldModal(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Field Type
          </label>
          <Select
            value={newFieldType}
            onChange={setNewFieldType}
            style={{ width: '100%' }}
          >
            <Option value="text">Text Input</Option>
            <Option value="email">Email</Option>
            <Option value="tel">Phone</Option>
            <Option value="number">Number</Option>
            <Option value="textarea">Text Area</Option>
            <Option value="select">Dropdown</Option>
            <Option value="radio">Radio Buttons</Option>
            <Option value="checkbox">Checkbox</Option>
            <Option value="date">Date</Option>
            <Option value="file">File Upload</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
