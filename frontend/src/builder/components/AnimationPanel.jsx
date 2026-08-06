/**
 * AnimationPanel Component
 * Panel for configuring widget animations with working preview
 */

import React, { useState, useEffect } from 'react';
import { Form, Select, Slider, Switch, Collapse, Button } from 'antd';
import { ThunderboltOutlined, PlayCircleOutlined } from '@ant-design/icons';
import animationManager from '../core/AnimationManager';

// Keyframes map matching AnimationManager presets — used by Web Animations API
const KEYFRAMES = {
  fadeIn:     [{ opacity: 0, transform: 'translateY(0)' },     { opacity: 1, transform: 'translateY(0)' }],
  slideUp:    [{ opacity: 0, transform: 'translateY(30px)' },  { opacity: 1, transform: 'translateY(0)' }],
  slideDown:  [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'translateY(0)' }],
  slideLeft:  [{ opacity: 0, transform: 'translateX(30px)' },  { opacity: 1, transform: 'translateX(0)' }],
  slideRight: [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'translateX(0)' }],
  zoomIn:     [{ opacity: 0, transform: 'scale(0.8)' },        { opacity: 1, transform: 'scale(1)' }],
  zoomOut:    [{ opacity: 0, transform: 'scale(1.2)' },        { opacity: 1, transform: 'scale(1)' }],
  bounce: [
    { transform: 'translateY(0)' },
    { transform: 'translateY(-20px)' },
    { transform: 'translateY(0)' },
    { transform: 'translateY(-10px)' },
    { transform: 'translateY(0)' },
  ],
  rotate: [{ opacity: 0, transform: 'rotate(-180deg)' }, { opacity: 1, transform: 'rotate(0)' }],
  flip:   [{ transform: 'perspective(400px) rotateY(90deg)' }, { transform: 'perspective(400px) rotateY(0)' }],
  pulse:  [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
};

/**
 * Run animation preview directly on the DOM element using Web Animations API
 */
function runPreview(nodeId, config) {
  const el = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (!el) {
    console.warn('[AnimationPanel] Element not found for node:', nodeId);
    return;
  }
  const keyframes = KEYFRAMES[config.type];
  if (!keyframes) {
    console.warn('[AnimationPanel] No keyframes for type:', config.type);
    return;
  }

  const duration = config.duration || 600;
  const delay    = config.delay    || 0;
  const easing   = config.easing   || 'ease-out';
  const iterations = config.iteration === 'infinite' ? Infinity : (config.iteration || 1);

  // Cancel any running animation first
  el.getAnimations?.().forEach(a => a.cancel());

  el.animate(keyframes, {
    duration,
    delay,
    easing,
    iterations,
    fill: 'both',
  });
}

export default function AnimationPanel({ node, onUpdate }) {
  const [form] = Form.useForm();
  const [animation, setAnimation] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  // Sync from node.settings.animation (the source of truth) on node change
  useEffect(() => {
    if (!node) return;

    // Prefer settings stored in the node, fall back to animationManager
    const stored = node.settings?.animation || animationManager.getAnimation(node.id);

    const config = {
      type:            stored?.type            ?? 'none',
      duration:        stored?.duration        ?? 600,
      delay:           stored?.delay           ?? 0,
      easing:          stored?.easing          ?? 'ease-out',
      iteration:       stored?.iteration       ?? 1,
      trigger:         stored?.trigger         ?? 'onLoad',
      scrollThreshold: stored?.scrollThreshold ?? 0.2,
      hover:           stored?.hover           ?? false,
    };

    setAnimation(config);
    form.setFieldsValue(config);

    // Keep manager in sync
    if (config.type !== 'none') {
      animationManager.registerAnimation(node.id, config);
    }
  }, [node?.id]); // re-run only when selected node changes

  const handleValuesChange = (changedValues) => {
    const newAnimation = { ...animation, ...changedValues };
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
    if (!animation || animation.type === 'none') return;
    setPreviewing(true);
    runPreview(node.id, animation);
    // Re-enable button after animation completes
    const totalMs = (animation.duration || 600) + (animation.delay || 0) + 150;
    setTimeout(() => setPreviewing(false), totalMs);
  };

  const animationPresets = Object.entries(animationManager.getAllPresets()).map(([key, preset]) => ({
    value: key,
    label: preset.name,
  }));

  const hasAnimation = animation && animation.type && animation.type !== 'none';

  return (
    <div className="animation-panel" style={{ padding: '4px 0' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 600 }}>Animation</span>
        </div>
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={handlePreview}
          disabled={!hasAnimation || previewing}
          loading={previewing}
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

            <Form.Item label="Animate on Hover" name="hover">
              <Switch />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>

      {!hasAnimation && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          Select an animation type above, then click Preview
        </div>
      )}
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
