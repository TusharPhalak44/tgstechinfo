/**
 * ErrorBoundary Component
 * Catches JavaScript errors in component tree and displays fallback UI
 */

import React, { Component } from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Optionally send to error tracking service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <Alert
            message="Something went wrong"
            description={
              <div>
                <p>An error occurred while rendering this component.</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details style={{ marginTop: 16 }}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                      Error Details
                    </summary>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: 12, 
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 12
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReset}
                  style={{ marginTop: 16 }}
                >
                  Try Again
                </Button>
              </div>
            }
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}
