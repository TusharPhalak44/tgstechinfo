import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { useChat } from '../../../context/ChatContext';

const { TextArea } = Input;

const BusinessInquiryForm = () => {
  const { submitQuery, setShowQueryForm, addUserMessage, addBotMessage, endChat } = useChat();
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    requirement: '',
    country: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.companyName.trim() || !formData.email.trim() || !formData.requirement.trim()) {
      message.error('Please fill in all required fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      message.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit as a query with business inquiry metadata
      const queryText = `Business Inquiry - ${formData.companyName}: ${formData.requirement}`;
      await submitQuery(formData.email, queryText);
      
      // Add success message to chat
      addBotMessage('✅ Thank you for your business inquiry.\n\nYour request has been submitted successfully.\n\nOur team will contact you shortly to discuss your requirements.', 'query_success', {
        onContinueChat: () => {
          setShowQueryForm(false);
        },
        onStopChat: () => {
          setShowQueryForm(false);
          endChat();
        }
      });
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      message.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowQueryForm(false);
  };

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 12,
      padding: '20px',
      marginBottom: 16,
      border: '1px solid var(--color-border)'
    }}>
      <h4 style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--color-heading)',
        margin: '0 0 16px 0'
      }}>
        Business Inquiry
      </h4>
      
      <div style={{ marginBottom: 12 }}>
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 4
        }}>
          Company Name <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <Input
          placeholder="Your company name"
          value={formData.companyName}
          onChange={e => handleChange('companyName', e.target.value)}
          size="small"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 4
        }}>
          Email Address <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <Input
          type="email"
          placeholder="your@company.com"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
          size="small"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 4
        }}>
          Requirement <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <TextArea
          rows={3}
          placeholder="Describe your requirement..."
          value={formData.requirement}
          onChange={e => handleChange('requirement', e.target.value)}
          maxLength={500}
          showCount
          style={{ fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 4
        }}>
          Country
        </label>
        <Input
          placeholder="Your country"
          value={formData.country}
          onChange={e => handleChange('country', e.target.value)}
          size="small"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 4
        }}>
          Phone Number
        </label>
        <Input
          type="tel"
          placeholder="+1 234 567 890"
          value={formData.phone}
          onChange={e => handleChange('phone', e.target.value)}
          size="small"
        />
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'flex-end'
      }}>
        <Button
          onClick={handleClose}
          size="small"
          style={{
            borderColor: 'var(--color-border)'
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!formData.companyName.trim() || !formData.email.trim() || !formData.requirement.trim()}
          size="small"
          style={{
            background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
            borderColor: 'transparent'
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default BusinessInquiryForm;
