/**
 * Widget Error Boundary
 * Catches errors in widget rendering and displays fallback UI
 */

import React, { Component } from 'react';

class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 16,
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: 4,
          color: '#cf1322',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Widget Error
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {this.state.error?.message || 'An error occurred while rendering this widget'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
