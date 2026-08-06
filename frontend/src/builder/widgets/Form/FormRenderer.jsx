/**
 * Form Renderer Component
 * Frontend renderer for form widget
 */

import React, { useState, useContext } from 'react';
import { Form, Input, Button, Select, Radio, Checkbox, DatePicker, Upload, message as antMessage } from 'antd';
import axios from 'axios';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';
import { useTheme } from '../../../context/ThemeContext';
import { BuilderContentIdContext } from '../../components/VisualBuilder.jsx';

const { TextArea } = Input;
const { Option } = Select;

export default function FormRenderer({ node }) {
  const { darkMode } = useTheme();
  const contextContentId = useContext(BuilderContentIdContext);
  const content = safeParseJsonContent(node.content, {
    fields: [],
    formName: 'Contact Form',
    submitText: 'Submit',
    successMessage: 'Thank you for your submission!',
    apiUrl: '',
    contentId: '',
  });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fields = content.fields || [];
  const formName = content.formName || 'Contact Form';
  const submitText = content.submitText || 'Submit';
  const successMessage = content.successMessage || 'Thank you for your submission!';
  const apiUrl = content.apiUrl || '';
  // Priority: context (set by CreateContent when editing) > stored in node > empty (falls back to Referer slug on backend)
  const contentId = contextContentId || content.contentId || '';

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      // Save to backend database if a contentId is configured
      // Use apiKey as the field name if set, otherwise fall back to field.id
      if (contentId) {
        const dbFields = {};
        fields.forEach(field => {
          const rawValue = values[field.id];
          if (rawValue === undefined) return;
          const key = (field.apiKey && field.apiKey.trim()) ? field.apiKey.trim() : field.id;
          dbFields[key] = rawValue;
        });
        await axios.post('/api/public/landing-page', {
          content_id: contentId,
          extra_fields: dbFields,
        });
      }

      // Also forward to external API URL if configured (non-blocking)
      if (apiUrl) {
        try {
          // Remap field values using apiKey mappings if defined
          // e.g. { field_123: 'John' } → { first_name: 'John' } when apiKey = 'first_name'
          const mappedValues = {};
          fields.forEach(field => {
            const rawValue = values[field.id];
            if (rawValue === undefined) return;
            const key = (field.apiKey && field.apiKey.trim()) ? field.apiKey.trim() : field.id;
            mappedValues[key] = rawValue;
          });
          await axios.post(apiUrl, mappedValues, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          });
        } catch (webhookErr) {
          console.warn('External API submission failed (non-blocking):', webhookErr.message);
        }
      }

      if (!contentId && !apiUrl) {
        console.log('Form submitted (no backend configured):', values);
      }

      setSubmitted(true);
      form.resetFields();
      antMessage.success(successMessage);
    } catch (err) {
      console.error('Form submission error:', err);
      antMessage.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (field) => {
    switch (field.type) {
      case 'email':
        return <Input type="email" placeholder={field.placeholder || ''} />;
      case 'tel':
        return <Input type="tel" placeholder={field.placeholder || ''} />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder || ''} />;
      case 'textarea':
        return <TextArea rows={4} placeholder={field.placeholder || ''} />;
      case 'select':
        return (
          <Select placeholder={field.placeholder || 'Select an option'} style={{ width: '100%' }}>
            {(field.options || []).map((opt, idx) => (
              <Option key={idx} value={opt}>{opt}</Option>
            ))}
          </Select>
        );
      case 'radio':
        return (
          <Radio.Group>
            {(field.options || []).map((opt, idx) => (
              <Radio key={idx} value={opt}>{opt}</Radio>
            ))}
          </Radio.Group>
        );
      case 'checkbox':
        return (
          <Checkbox.Group>
            {(field.options || []).map((opt, idx) => (
              <Checkbox key={idx} value={opt}>{opt}</Checkbox>
            ))}
          </Checkbox.Group>
        );
      case 'date':
        return <DatePicker style={{ width: '100%' }} />;
      case 'file':
        return (
          <Upload beforeUpload={() => false} showUploadList={false}>
            <Button>Click to upload</Button>
          </Upload>
        );
      default:
        return <Input placeholder={field.placeholder || ''} />;
    }
  };

  const getRules = (field) => {
    const rules = [];
    if (field.required) {
      rules.push({ required: true, message: `${field.label || 'This field'} is required` });
    }
    if (field.type === 'email') {
      rules.push({ type: 'email', message: 'Please enter a valid email' });
    }
    return rules;
  };

  if (submitted) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: darkMode ? '#1e293b' : '#fafafa', borderRadius: 8, ...styles }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h3 style={{ marginBottom: 8, color: darkMode ? '#f1f5f9' : undefined }}>{successMessage}</h3>
        <Button onClick={() => setSubmitted(false)}>Submit another response</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: darkMode ? '#1e293b' : '#fafafa', borderRadius: '8px', ...styles }}>
      <h3 style={{ marginBottom: '24px', marginTop: 0, color: darkMode ? '#f1f5f9' : undefined }}>{formName}</h3>
      <Form
        form={form}
        layout={settings.layout || 'vertical'}
        onFinish={onFinish}
      >
        {fields.map((field) => (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label || field.id}
            rules={getRules(field)}
          >
            {renderInput(field)}
          </Form.Item>
        ))}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size={settings.buttonSize || 'default'}
            style={{ width: '100%' }}
          >
            {submitText}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
