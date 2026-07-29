/**
 * Form Renderer Component
 * Frontend renderer for form widget
 */

import React, { useState } from 'react';
import { Form, Input, Button, Select, Radio, Checkbox, DatePicker, Upload, message } from 'antd';
import { safeParseJsonContent } from '../../core/BuilderEngine.js';

const { TextArea } = Input;
const { Option } = Select;

export default function FormRenderer({ node }) {
  const content = safeParseJsonContent(node.content, { fields: [], formName: 'Contact Form', submitText: 'Submit', successMessage: 'Thank you for your submission!' });
  const settings = node.settings || {};
  const styles = node.styles || {};

  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);

  const fields = content.fields || [];
  const formName = content.formName || 'Contact Form';
  const submitText = content.submitText || 'Submit';
  const successMessage = content.successMessage || 'Thank you for your submission!';

  const onFinish = (values) => {
    console.log('Form submitted:', values);
    setSubmitted(true);
    message.success(successMessage);
    
    // Here you would typically send the form data to your backend
    // Example: axios.post('/api/forms/submit', { formName, data: values })
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.id,
      label: field.label,
      placeholder: field.placeholder,
      rules: field.required ? [{ required: true, message: `${field.label} is required` }] : [],
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />;
      
      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
            rules={[
              ...(field.required ? [{ required: true, message: `${field.label} is required` }] : []),
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          />
        );
      
      case 'tel':
        return <Input {...commonProps} type="tel" />;
      
      case 'number':
        return <Input {...commonProps} type="number" />;
      
      case 'textarea':
        return <TextArea {...commonProps} rows={4} />;
      
      case 'select':
        return (
          <Select {...commonProps} placeholder={field.placeholder || 'Select an option'}>
            {field.options?.map((option, idx) => (
              <Option key={idx} value={option}>{option}</Option>
            ))}
          </Select>
        );
      
      case 'radio':
        return (
          <Radio.Group {...commonProps}>
            {field.options?.map((option, idx) => (
              <Radio key={idx} value={option}>{option}</Radio>
            ))}
          </Radio.Group>
        );
      
      case 'checkbox':
        return (
          <Checkbox.Group {...commonProps}>
            {field.options?.map((option, idx) => (
              <Checkbox key={idx} value={option}>{option}</Checkbox>
            ))}
          </Checkbox.Group>
        );
      
      case 'date':
        return <DatePicker {...commonProps} style={{ width: '100%' }} />;
      
      case 'file':
        return (
          <Upload {...commonProps}>
            <Button>Click to upload</Button>
          </Upload>
        );
      
      default:
        return <Input {...commonProps} />;
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', ...styles }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
        <h3 style={{ marginBottom: '8px' }}>{successMessage}</h3>
        <Button onClick={() => setSubmitted(false)}>Submit another response</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#fafafa', borderRadius: '8px', ...styles }}>
      <h3 style={{ marginBottom: '24px', marginTop: 0 }}>{formName}</h3>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        {fields.map((field) => (
          <Form.Item key={field.id} {...renderField(field)}>
            {renderField(field)}
          </Form.Item>
        ))}
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            {submitText}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
