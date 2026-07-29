/**
 * AnimationPanel Component
 * Panel for configuring widget animations
 */

import React, { useState, useEffect } from 'react';
import { Form, Select, Slider, Switch, Collapse, Button, Space } from 'antd';
import { ThunderboltOutlined, PlayCircleOutlined } from '@ant-design/icons';
import animationManager from '../core/AnimationManager';
import { animationTypes, animationEasing } from '../utils/types';

/**
 * AnimationPanel Component
 */
export default function AnimationPanel({ node, onUpdate, onPreview }) {
  const [form] = Form.useForm();
  const [animation, setAnimation] = useState(null);

  useEffect(() => {
    if (node) {
      const nodeAnimation = animationManager.getAnimation(node.id);
      setAnimation(nodeAnimation);
      form.setFieldsValue({
        type: nodeAnimation?.type || 'none',
        duration: nodeAnimation?.duration || 600,
        delay: nodeAnimation?.delay || 0,
        easing: nodeAnimation?.easing || 'ease-out',
        iteration: nodeAnimation?.iteration || 1,
        trigger: nodeAnimation?.trigger || 'onLoad',
        scrollThreshold: nodeAnimation?.scrollThreshold || 0.2,
        hover: nodeAnimation?.hover || false,
      });
    }
  }, [node, form]);

  const handleValuesChange = (changedValues) => {
    const newAnimation = {
      ...animation,
      ...changedValues,
    };

    setAnimation(newAnimation);
    animationManager.registerAnimation(node.id, newAnimation);

    onUpdate({
      settings: {
        ...node.settings,
        animation: newAnimation,
      },
    });
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(node.id);
    }
  };

  const animationPresets = Object.entries(animationManager.getAllPresets()).map(([key, preset]) => ({
    value: key,
    label: preset.name,
  }));

  return (
    <div className="animation-panel">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 600 }}>Animation</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={handlePreview}
          disabled={!animation || animation.type === 'none'}
        >
          Preview
        </Button>
      </div>

      <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
        <Collapse defaultActiveKey={['entrance', 'timing', 'trigger']} size="small" ghost>
          <Collapse.Panel header="Entrance Animation" key="entrance">
            <Form.Item label="Animation Type" name="type">
              <Select>
                <Select.Option value="none">None</Select.Option>
                {animationPresets.map(preset => (
                  <Select.Option key={preset.value} value={preset.value}>
                    {preset.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel header="Timing" key="timing">
            <Form.Item label="Duration (ms)" name="duration">
              <Slider min={100} max={3000} step={100} marks={{ 100: '0.1s', 1000: '1s', 2000: '2s', 3000: '3s' }} />
            </Form.Item>

            <Form.Item label="Delay (ms)" name="delay">
              <Slider min={0} max={2000} step={100} marks={{ 0: '0s', 500: '0.5s', 1000: '1s', 2000: '2s' }} />
            </Form.Item>

            <Form.Item label="Easing" name="easing">
              <Select>
                <Select.Option value="linear">Linear</Select.Option>
                <Select.Option value="ease">Ease</Select.Option>
                <Select.Option value="ease-in">Ease In</Select.Option>
                <Select.Option value="ease-out">Ease Out</Select.Option>
                <Select.Option value="ease-in-out">Ease In Out</Select.Option>
                <Select.Option value="cubic-bezier(0.4, 0, 0.2, 1)">Cubic Ease</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Iteration" name="iteration">
              <Select>
                <Select.Option value={1}>Once</Select.Option>
                <Select.Option value={2}>Twice</Select.Option>
                <Select.Option value={3}>Three Times</Select.Option>
                <Select.Option value="infinite">Infinite</Select.Option>
              </Select>
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel header="Trigger" key="trigger">
            <Form.Item label="Animation Trigger" name="trigger">
              <Select>
                <Select.Option value="onLoad">On Load</Select.Option>
                <Select.Option value="onScroll">On Scroll</Select.Option>
                <Select.Option value="onHover">On Hover</Select.Option>
                <Select.Option value="manual">Manual</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Scroll Threshold"
              name="scrollThreshold"
              style={{ display: 'none' }}
            >
              <Slider min={0} max={1} step={0.1} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
            </Form.Item>

            <Form.Item label="Animate on Hover" name="hover">
              <Switch />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </div>
  );
}

/**
 * Hook to use animations
 */
export function useAnimations() {
  const registerAnimation = (nodeId, config) => {
    animationManager.registerAnimation(nodeId, config);
  };

  const getAnimation = (nodeId) => {
    return animationManager.getAnimation(nodeId);
  };

  const removeAnimation = (nodeId) => {
    animationManager.removeAnimation(nodeId);
  };

  const generateCSS = (nodeId) => {
    return animationManager.generateCSS(nodeId);
  };

  return {
    registerAnimation,
    getAnimation,
    removeAnimation,
    generateCSS,
    getPresets: animationManager.getAllPresets,
  };
}
