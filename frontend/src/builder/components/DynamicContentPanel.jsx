/**
 * DynamicContentPanel Component
 * Panel for managing dynamic content bindings and variables
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Tag, Space, Tooltip, Card, Collapse, message } from 'antd';
import { LinkOutlined, ThunderboltOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dynamicContentManager from '../core/DynamicContentManager';

/**
 * DynamicContentPanel Component
 */
export default function DynamicContentPanel({ node, onUpdate }) {
  const [form] = Form.useForm();
  const [variables, setVariables] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = () => {
    setVariables(dynamicContentManager.getVariables());
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    onUpdate({ content: value });

    // Show suggestions if typing {{
    if (value.includes('{{')) {
      const lastOpenBrace = value.lastIndexOf('{{');
      const prefix = value.substring(lastOpenBrace + 2).trim();
      const newSuggestions = dynamicContentManager.getVariableSuggestions(prefix);
      setSuggestions(newSuggestions.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInsertVariable = (variableKey) => {
    const currentContent = node.content || '';
    const lastOpenBrace = currentContent.lastIndexOf('{{');
    
    if (lastOpenBrace > -1) {
      const before = currentContent.substring(0, lastOpenBrace);
      const after = currentContent.substring(currentContent.indexOf('}}', lastOpenBrace) + 2) || '';
      const newContent = `${before}{{${variableKey}}}${after}`;
      onUpdate({ content: newContent });
      setShowSuggestions(false);
    }
  };

  const handleAddCustomVariable = () => {
    // This would open a modal to add custom variables
    message.info('Custom variable management coming soon');
  };

  const detectedVariables = dynamicContentManager.parseVariables(node.content || '');

  return (
    <div className="dynamic-content-panel">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ThunderboltOutlined style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 600 }}>Dynamic Content</span>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          Use {'{{'}variable{'}'} syntax to bind dynamic content
        </p>
      </div>

      {/* Content Editor with Variable Suggestions */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Input.TextArea
          value={node.content || ''}
          onChange={handleContentChange}
          placeholder="Enter content with {{variable}} bindings..."
          rows={4}
          style={{ fontFamily: 'monospace' }}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <Card
            size="small"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              maxHeight: 200,
              overflow: 'auto',
              marginTop: 4,
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleInsertVariable(suggestion.key)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  ':hover': { backgroundColor: '#f0f7ff' },
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Space>
                  <Tag color={suggestion.type === 'builtin' ? 'blue' : 'green'} style={{ margin: 0 }}>
                    {suggestion.type}
                  </Tag>
                  <code style={{ fontSize: 12 }}>{suggestion.key}</code>
                </Space>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Detected Variables */}
      {detectedVariables.length > 0 && (
        <Collapse size="small" ghost style={{ marginBottom: 16 }}>
          <Collapse.Panel header={`Detected Variables (${detectedVariables.length})`} key="detected">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {detectedVariables.map((variable, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag icon={<LinkOutlined />} color="blue">
                    {variable.key}
                  </Tag>
                  <span style={{ fontSize: 11, color: '#999' }}>
                    {variable.type || 'unknown'}
                  </span>
                </div>
              ))}
            </Space>
          </Collapse.Panel>
        </Collapse>
      )}

      {/* Available Variables */}
      <Collapse size="small" ghost defaultActiveKey={['builtin']}>
        <Collapse.Panel header="Available Variables" key="available">
          <div style={{ marginBottom: 12 }}>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddCustomVariable}
              block
            >
              Add Custom Variable
            </Button>
          </div>

          <Collapse size="small" ghost>
            <Collapse.Panel header="Page Variables" key="page">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {['page.title', 'page.description', 'page.banner', 'page.tags', 'page.slug'].map(key => (
                  <Tag
                    key={key}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => {
                      const currentContent = node.content || '';
                      onUpdate({ content: `${currentContent} {{${key}}}` });
                    }}
                  >
                    {key}
                  </Tag>
                ))}
              </Space>
            </Collapse.Panel>

            <Collapse.Panel header="Author Variables" key="author">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {['author.name', 'author.email', 'author.bio', 'author.avatar'].map(key => (
                  <Tag
                    key={key}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => {
                      const currentContent = node.content || '';
                      onUpdate({ content: `${currentContent} {{${key}}}` });
                    }}
                  >
                    {key}
                  </Tag>
                ))}
              </Space>
            </Collapse.Panel>

            <Collapse.Panel header="User Variables" key="user">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {['user.name', 'user.email', 'user.id', 'user.role'].map(key => (
                  <Tag
                    key={key}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => {
                      const currentContent = node.content || '';
                      onUpdate({ content: `${currentContent} {{${key}}}` });
                    }}
                  >
                    {key}
                  </Tag>
                ))}
              </Space>
            </Collapse.Panel>

            <Collapse.Panel header="Site Variables" key="site">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {['site.name', 'site.url', 'site.description', 'site.logo'].map(key => (
                  <Tag
                    key={key}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => {
                      const currentContent = node.content || '';
                      onUpdate({ content: `${currentContent} {{${key}}}` });
                    }}
                  >
                    {key}
                  </Tag>
                ))}
              </Space>
            </Collapse.Panel>

            <Collapse.Panel header="Date Variables" key="date">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {['date.now', 'date.year', 'date.month', 'date.day', 'date.time'].map(key => (
                  <Tag
                    key={key}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => {
                      const currentContent = node.content || '';
                      onUpdate({ content: `${currentContent} {{${key}}}` });
                    }}
                  >
                    {key}
                  </Tag>
                ))}
              </Space>
            </Collapse.Panel>
          </Collapse>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
}

/**
 * Hook to use dynamic content
 */
export function useDynamicContent() {
  const resolveContent = (content, context) => {
    return dynamicContentManager.replaceVariables(content, context);
  };

  const parseVariables = (content) => {
    return dynamicContentManager.parseVariables(content);
  };

  const registerVariable = (variable) => {
    dynamicContentManager.registerVariable(variable);
  };

  return {
    resolveContent,
    parseVariables,
    registerVariable,
    getVariables: dynamicContentManager.getVariables,
  };
}
