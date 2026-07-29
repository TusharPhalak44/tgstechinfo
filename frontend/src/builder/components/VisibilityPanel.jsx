/**
 * VisibilityPanel Component
 * Panel for configuring widget visibility rules
 */

import React, { useState, useEffect } from 'react';
import { Form, Select, Switch, Collapse, Button, Space, Input, DatePicker, InputNumber, Tag, Popconfirm } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import visibilityManager from '../core/VisibilityManager';
import { visibilityRuleTypes } from '../utils/types';

/**
 * VisibilityPanel Component
 */
export default function VisibilityPanel({ node, onUpdate }) {
  const [rules, setRules] = useState([]);
  const [addRuleVisible, setAddRuleVisible] = useState(false);
  const [newRuleType, setNewRuleType] = useState('device');

  useEffect(() => {
    if (node) {
      setRules(visibilityManager.getRules(node.id));
    }
  }, [node]);

  const handleAddRule = () => {
    const ruleId = visibilityManager.addRule(node.id, {
      type: newRuleType,
      condition: getDefaultCondition(newRuleType),
      visible: true,
    });

    setRules(visibilityManager.getRules(node.id));
    setAddRuleVisible(false);
  };

  const handleUpdateRule = (ruleId, updates) => {
    visibilityManager.updateRule(node.id, ruleId, updates);
    setRules(visibilityManager.getRules(node.id));
  };

  const handleRemoveRule = (ruleId) => {
    visibilityManager.removeRule(node.id, ruleId);
    setRules(visibilityManager.getRules(node.id));
  };

  const getDefaultCondition = (type) => {
    switch (type) {
      case 'device':
        return { device: 'desktop', operator: 'equals' };
      case 'auth':
        return { authenticated: true };
      case 'pageType':
        return { pageType: 'landing', operator: 'equals' };
      case 'custom':
        return { variable: 'user.role', value: 'admin', operator: 'equals' };
      case 'dateRange':
        return { startDate: null, endDate: null };
      default:
        return {};
    }
  };

  return (
    <div className="visibility-panel">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <EyeOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 600 }}>Visibility Rules</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {rules.map(rule => (
            <div
              key={rule.id}
              style={{
                padding: 12,
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Space>
                  <Tag color="blue">{rule.type}</Tag>
                  <Switch
                    checked={rule.visible}
                    onChange={(checked) => handleUpdateRule(rule.id, { visible: checked })}
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                  />
                </Space>
                <Popconfirm
                  title="Remove this rule?"
                  onConfirm={() => handleRemoveRule(rule.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </div>
              <RuleEditor rule={rule} onUpdate={(updates) => handleUpdateRule(rule.id, updates)} />
            </div>
          ))}

          {rules.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              No visibility rules configured
            </div>
          )}
        </Space>
      </div>

      <div>
        <Select
          placeholder="Add visibility rule"
          style={{ width: '100%' }}
          onChange={(value) => {
            setNewRuleType(value);
            setAddRuleVisible(true);
          }}
        >
          <Select.Option value="device">Device Rule</Select.Option>
          <Select.Option value="auth">Authentication Rule</Select.Option>
          <Select.Option value="pageType">Page Type Rule</Select.Option>
          <Select.Option value="custom">Custom Variable Rule</Select.Option>
          <Select.Option value="dateRange">Date Range Rule</Select.Option>
        </Select>
      </div>
    </div>
  );
}

/**
 * RuleEditor Component
 * Internal component for editing individual rules
 */
function RuleEditor({ rule, onUpdate }) {
  switch (rule.type) {
    case 'device':
      return (
        <Space size="small">
          <Select
            value={rule.condition.device}
            onChange={(value) => onUpdate({ condition: { ...rule.condition, device: value } })}
            style={{ width: 120 }}
            size="small"
          >
            <Select.Option value="desktop">Desktop</Select.Option>
            <Select.Option value="tablet">Tablet</Select.Option>
            <Select.Option value="mobile">Mobile</Select.Option>
          </Select>
          <Select
            value={rule.condition.operator}
            onChange={(value) => onUpdate({ condition: { ...rule.condition, operator: value } })}
            style={{ width: 100 }}
            size="small"
          >
            <Select.Option value="equals">Equals</Select.Option>
            <Select.Option value="notEquals">Not Equals</Select.Option>
          </Select>
        </Space>
      );

    case 'auth':
      return (
        <Space size="small">
          <span>Show when user is:</span>
          <Select
            value={rule.condition.authenticated ? 'authenticated' : 'guest'}
            onChange={(value) => onUpdate({ condition: { ...rule.condition, authenticated: value === 'authenticated' } })}
            style={{ width: 120 }}
            size="small"
          >
            <Select.Option value="authenticated">Logged In</Select.Option>
            <Select.Option value="guest">Guest</Select.Option>
          </Select>
        </Space>
      );

    case 'pageType':
      return (
        <Space size="small">
          <Select
            value={rule.condition.pageType}
            onChange={(value) => onUpdate({ condition: { ...rule.condition, pageType: value } })}
            style={{ width: 120 }}
            size="small"
          >
            <Select.Option value="landing">Landing Page</Select.Option>
            <Select.Option value="blog">Blog Post</Select.Option>
            <Select.Option value="product">Product Page</Select.Option>
            <Select.Option value="home">Homepage</Select.Option>
          </Select>
          <Select
            value={rule.condition.operator}
            onChange={(value) => onUpdate({ condition: { ...rule.condition, operator: value } })}
            style={{ width: 100 }}
            size="small"
          >
            <Select.Option value="equals">Equals</Select.Option>
            <Select.Option value="notEquals">Not Equals</Select.Option>
          </Select>
        </Space>
      );

    case 'custom':
      return (
        <Space size="small" direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Variable (e.g., user.role)"
            value={rule.condition.variable}
            onChange={(e) => onUpdate({ condition: { ...rule.condition, variable: e.target.value } })}
            size="small"
          />
          <Space size="small">
            <Select
              value={rule.condition.operator}
              onChange={(value) => onUpdate({ condition: { ...rule.condition, operator: value } })}
              style={{ width: 100 }}
              size="small"
            >
              <Select.Option value="equals">Equals</Select.Option>
              <Select.Option value="notEquals">Not Equals</Select.Option>
              <Select.Option value="contains">Contains</Select.Option>
              <Select.Option value="greaterThan">Greater Than</Select.Option>
              <Select.Option value="lessThan">Less Than</Select.Option>
            </Select>
            <Input
              placeholder="Value"
              value={rule.condition.value}
              onChange={(e) => onUpdate({ condition: { ...rule.condition, value: e.target.value } })}
              size="small"
              style={{ width: 120 }}
            />
          </Space>
        </Space>
      );

    case 'dateRange':
      return (
        <Space size="small" direction="vertical">
          <div>
            <span style={{ fontSize: 12, marginRight: 4 }}>From:</span>
            <Input
              type="date"
              value={rule.condition.startDate}
              onChange={(e) => onUpdate({ condition: { ...rule.condition, startDate: e.target.value } })}
              size="small"
            />
          </div>
          <div>
            <span style={{ fontSize: 12, marginRight: 4 }}>To:</span>
            <Input
              type="date"
              value={rule.condition.endDate}
              onChange={(e) => onUpdate({ condition: { ...rule.condition, endDate: e.target.value } })}
              size="small"
            />
          </div>
        </Space>
      );

    default:
      return null;
  }
}

/**
 * Hook to use visibility rules
 */
export function useVisibility() {
  const addRule = (nodeId, rule) => {
    return visibilityManager.addRule(nodeId, rule);
  };

  const evaluateVisibility = (nodeId, context) => {
    return visibilityManager.evaluateVisibility(nodeId, context);
  };

  const getRules = (nodeId) => {
    return visibilityManager.getRules(nodeId);
  };

  return {
    addRule,
    evaluateVisibility,
    getRules,
  };
}
