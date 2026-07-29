/**
 * Fallback Renderer
 * Displays when a widget is not registered or fails to render
 */

import React from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';

export default function FallbackRenderer({ node, error, onRetry, onDelete }) {
  const isRegistrationError = error?.includes('not registered') || error?.includes('not found');
  
  return (
    <div style={{
      padding: 20,
      background: '#fafafa',
      border: '2px dashed #d9d9d9',
      borderRadius: 8,
      textAlign: 'center',
      color: '#8c8c8c',
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
      
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#262626' }}>
        {isRegistrationError ? 'Widget Not Registered' : 'Render Error'}
      </div>
      
      <div style={{ fontSize: 12, marginBottom: 8, color: '#595959' }}>
        Type: {node.type || 'Unknown'}
      </div>
      
      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 12 }}>
        ID: {node.id || 'Unknown'}
      </div>
      
      {error && (
        <Alert
          message="Error Details"
          description={error}
          type="error"
          showIcon
          style={{ 
            textAlign: 'left', 
            marginBottom: 12,
            fontSize: 11
          }}
        />
      )}
      
      <div style={{ 
        fontSize: 11, 
        color: '#999', 
        marginBottom: 12,
        maxWidth: 300,
        margin: '0 auto 12px'
      }}>
        {isRegistrationError 
          ? 'This widget type is not registered in the widget registry. It may have been removed or not loaded properly.'
          : 'This widget encountered an error while rendering. You can try to reload it or remove it from the page.'}
      </div>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {onRetry && (
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={() => onRetry(node.id)}
          >
            Retry
          </Button>
        )}
        
        {onDelete && (
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(node.id)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
