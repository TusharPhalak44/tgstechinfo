import React, { useState } from 'react';
import { useChat } from '../../../context/ChatContext';
import { Input, Button, message } from 'antd';

const { TextArea } = Input;

// List of free email providers to block
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'aol.com', 'ymail.com', 'mail.com', 'protonmail.com', 'icloud.com',
  'zoho.com', 'gmx.com', 'yandex.com', 'rediffmail.com', 'inbox.com'
];

// Validate business email
const isValidBusinessEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  const domain = email.split('@')[1].toLowerCase();
  return !FREE_EMAIL_DOMAINS.includes(domain);
};

const QuerySubmissionForm = () => {
  const { submitQuery, query, setShowQueryForm } = useChat();
  const [email, setEmail] = useState('');
  const [userQuery, setUserQuery] = useState(query || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !userQuery.trim()) {
      message.error('Please fill in all fields');
      return;
    }

    // Validate business email
    if (!isValidBusinessEmail(email.trim())) {
      message.error('Please enter a valid business email address. Free email providers are not allowed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuery(email.trim(), userQuery.trim());
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit query:', error);
      message.error('Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowQueryForm(false);
  };

  if (submitted) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        borderRadius: 12,
        border: '1px solid #a5d6a7',
        marginBottom: 20
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16
        }}>
          ✓
        </div>
        <h4 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#2e7d32',
          margin: '0 0 8px 0'
        }}>
          Thank You
        </h4>
        <p style={{
          fontSize: 14,
          color: '#388e3c',
          margin: '0 0 20px 0'
        }}>
          Your query has been submitted successfully.
          <br />
          Our support team will contact you soon.
        </p>
        <Button
          onClick={handleClose}
          style={{
            background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
            borderColor: 'transparent',
            color: '#fff'
          }}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '24px',
      marginBottom: 20,
      border: '1px solid #e8e8e8'
    }}>
      <h4 style={{
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--color-heading)',
        margin: '0 0 12px 0'
      }}>
        Submit Your Query
      </h4>
      
      <p style={{
        fontSize: 13,
        color: 'var(--color-muted)',
        margin: '0 0 20px 0',
        lineHeight: 1.5
      }}>
        Sorry, I couldn't find an answer. Would you like to send your query to our support team?
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 6
        }}>
          Business Email Address <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <Input
          type="email"
          placeholder="your@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          size="large"
        />
        <p style={{
          fontSize: 11,
          color: 'var(--color-muted)',
          margin: '4px 0 0 0'
        }}>
          Free email providers (Gmail, Yahoo, etc.) are not allowed
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-heading)',
          marginBottom: 6
        }}>
          Your Query <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <TextArea
          rows={4}
          placeholder="Describe your question or issue..."
          value={userQuery}
          onChange={e => setUserQuery(e.target.value)}
          maxLength={500}
          showCount
        />
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end'
      }}>
        <Button
          onClick={handleClose}
          style={{
            borderColor: '#d9d9d9'
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!email.trim() || !userQuery.trim()}
          style={{
            background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
            borderColor: 'transparent'
          }}
        >
          Submit Query
        </Button>
      </div>
    </div>
  );
};

export default QuerySubmissionForm;
