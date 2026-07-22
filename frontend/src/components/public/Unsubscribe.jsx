import React, { useState, useEffect } from 'react';
import { Result, Button, Spin, Alert } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'success', 'error', 'invalid'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('invalid');
      setMessage('Invalid unsubscribe link. No token provided.');
      setLoading(false);
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await axios.get(`/api/public/newsletter/unsubscribe?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Successfully unsubscribed from newsletter.');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to unsubscribe. Please try again or contact support.');
      } finally {
        setLoading(false);
      }
    };

    unsubscribe();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size="large" tip="Processing unsubscribe request..." />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%',
        background: '#fff',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {status === 'success' && (
          <Result
            status="success"
            title="Successfully Unsubscribed"
            subTitle={message}
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/')}>
                Return to Home
              </Button>,
            ]}
          />
        )}
        
        {status === 'error' && (
          <Result
            status="error"
            title="Unsubscribe Failed"
            subTitle={message}
            extra={[
              <Button type="primary" key="retry" onClick={() => navigate('/')}>
                Return to Home
              </Button>,
              <Button key="contact" onClick={() => window.location.href = 'mailto:info@tgstechinfo.com'}>
                Contact Support
              </Button>,
            ]}
          />
        )}
        
        {status === 'invalid' && (
          <Result
            status="warning"
            title="Invalid Link"
            subTitle={message}
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/')}>
                Return to Home
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
