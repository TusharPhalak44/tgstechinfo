/**
 * Form Widget Component
 * Builder component for form creation — used as the Content tab in PropertyPanel
 */

import React, { useState, useContext } from 'react';
import { Button, Input, Select, Space, Modal, message, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, ApiOutlined } from '@ant-design/icons';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { BuilderContentIdContext } from '../../components/VisualBuilder.jsx';

const { Option } = Select;

export default function FormWidget({ node, onUpdate }) {
  const autoContentId = useContext(BuilderContentIdContext);
  const content = safeParseJsonContent(node.content, {
    fields: [],
    formName: 'Contact Form',
    submitText: 'Submit',
    successMessage: 'Thank you for your submission!',
    apiUrl: '',
    contentId: '',
  });

  const [fields, setFields] = useState(content.fields || []);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newFieldType, setNewFieldType] = useState('text');

  const updateContent = (updates) => {
    onUpdate?.({
      ...node,
      content: JSON.stringify({ ...content, ...updates }),
    });
  };

  const applyWhitePaperTemplate = () => {
    const t = Date.now();
    const templateFields = [
      { id: `field_${t}_1`, type: 'text',  label: 'First Name',    apiKey: 'first_name',    placeholder: 'Enter your first name',    required: true },
      { id: `field_${t}_2`, type: 'text',  label: 'Last Name',     apiKey: 'last_name',     placeholder: 'Enter your last name',     required: true },
      { id: `field_${t}_3`, type: 'email', label: 'Business Email',apiKey: 'email',         placeholder: 'your@company.com',         required: true },
      { id: `field_${t}_4`, type: 'text',  label: 'Country',       apiKey: 'country',       placeholder: 'Enter your country',       required: true },
      { id: `field_${t}_5`, type: 'text',  label: 'Company Name',  apiKey: 'company_name',  placeholder: 'Enter your company name',  required: true },
      { id: `field_${t}_6`, type: 'text',  label: 'Job Title',     apiKey: 'job_title',     placeholder: 'Enter your job title',     required: true },
    ];
    setFields(templateFields);
    updateContent({ fields: templateFields, formName: 'White Paper Download', submitText: 'DOWNLOAD THE WHITE PAPER' });
    message.success('White paper form template applied');
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: newFieldType,
      label: `${newFieldType.charAt(0).toUpperCase() + newFieldType.slice(1)} Field`,
      placeholder: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(newFieldType) ? ['Option 1', 'Option 2'] : [],
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    updateContent({ fields: updatedFields });
    setShowFieldModal(false);
  };

  const removeField = (fieldId) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    setFields(updatedFields);
    updateContent({ fields: updatedFields });
  };

  const updateField = (fieldId, updates) => {
    const updatedFields = fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    setFields(updatedFields);
    updateContent({ fields: updatedFields });
  };

  const sectionLabel = (text) => (
    <div style={{ fontWeight: 600, fontSize: 11, color: '#4a7cff', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {text}
    </div>
  );

  return (
    <div style={{ padding: 16 }}>

      {sectionLabel('Form Settings')}

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Form Name</label>
        <Input size="small" value={content.formName || ''} onChange={(e) => updateContent({ formName: e.target.value })} placeholder="Contact Form" />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Submit Button Text</label>
        <Input size="small" value={content.submitText || ''} onChange={(e) => updateContent({ submitText: e.target.value })} placeholder="Submit" />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>Success Message</label>
        <Input size="small" value={content.successMessage || ''} onChange={(e) => updateContent({ successMessage: e.target.value })} placeholder="Thank you for your submission!" />
      </div>

      {sectionLabel('Submission Config')}

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>
          Content ID <span style={{ color: '#aaa', fontWeight: 400 }}>(auto-detected)</span>
        </label>
        {autoContentId ? (
          <div style={{ padding: '4px 8px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, fontSize: 12, color: '#166534', fontWeight: 500 }}>
            ✓ Linked to content #{autoContentId} — submissions will be saved to database
          </div>
        ) : (
          <div style={{ padding: '4px 8px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, fontSize: 12, color: '#854d0e' }}>
            Save the content first to auto-link form submissions to the database
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>
          <ApiOutlined style={{ marginRight: 4, color: '#4a7cff' }} />
          External API URL <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
        </label>
        <Input size="small" value={content.apiUrl || ''} onChange={(e) => updateContent({ apiUrl: e.target.value })} placeholder="https://your-api.com/webhook" />
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>Form data will be POSTed as JSON on submit.</div>
      </div>

      {sectionLabel('Form Fields')}

      <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '14px 0', fontSize: 13 }}>No fields added yet</div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {fields.map((field) => (
              <div key={field.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {field.type}
                  </span>
                  <Button type="text" icon={<DeleteOutlined />} onClick={() => removeField(field.id)} danger size="small" />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Input Label</label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Field Label"
                    size="small"
                  />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>
                    API Key <span style={{ color: '#aaa', fontWeight: 400 }}>(maps to webhook field)</span>
                  </label>
                  <Input
                    value={field.apiKey || ''}
                    onChange={(e) => updateField(field.id, { apiKey: e.target.value })}
                    placeholder="e.g. f_name, email_address"
                    size="small"
                    style={{ fontFamily: 'monospace', fontSize: 11 }}
                  />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Placeholder</label>
                  <Input
                    value={field.placeholder}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Placeholder text"
                    size="small"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#555' }}>Required</span>
                  <Switch size="small" checked={field.required || false} onChange={(v) => updateField(field.id, { required: v })} />
                </div>
              </div>
            ))}
          </Space>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setShowFieldModal(true)} size="small" style={{ flex: 1 }}>
          Add Field
        </Button>
        <Button type="primary" onClick={applyWhitePaperTemplate} size="small" style={{ flex: 1 }}>
          White Paper Template
        </Button>
      </div>

      <Modal title="Add Form Field" open={showFieldModal} onOk={addField} onCancel={() => setShowFieldModal(false)} okText="Add">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Field Type</label>
          <Select value={newFieldType} onChange={setNewFieldType} style={{ width: '100%' }}>
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
