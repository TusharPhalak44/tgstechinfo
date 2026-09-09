import React, { Component } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #070C1E 0%, #0F172A 100%)',
          color: '#F8FAFC'
        }}>
          <Result
            status="error"
            title={<span style={{ color: '#F8FAFC', fontSize: '1.5rem', fontWeight: 800 }}>Component Rendering Error</span>}
            subTitle={
              <div style={{ color: '#94A3B8', maxWidth: 600, margin: '0 auto' }}>
                <p>An unexpected error occurred in this layout component.</p>
                {this.state.error && (
                  <div style={{
                    marginTop: 16,
                    padding: 14,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 10,
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#F87171',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {this.state.error.toString()}
                  </div>
                )}
              </div>
            }
            extra={[
              <Button
                key="retry"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleReset}
                style={{
                  background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
                  border: '1px solid rgba(247, 148, 29, 0.3)',
                  fontWeight: 700,
                  height: 40,
                  borderRadius: 10,
                }}
              >
                Reload Component
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                onClick={() => window.location.href = '/'}
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                Back to Home
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
