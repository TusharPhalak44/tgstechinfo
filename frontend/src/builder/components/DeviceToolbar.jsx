/**
 * DeviceToolbar Component
 * Toolbar for switching between device preview modes (Desktop, Tablet, Mobile)
 */

import React from 'react';
import { Button, Radio } from 'antd';
import { DesktopOutlined, TabletOutlined, MobileOutlined } from '@ant-design/icons';
import { useResponsiveMode, useBuilderActions } from '../core/BuilderStore';
import { deviceConfig } from '../utils/types';

/**
 * DeviceToolbar Component
 */
export default function DeviceToolbar() {
  const responsiveMode = useResponsiveMode();
  const { setResponsiveMode } = useBuilderActions();

  return (
    <div className="device-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Radio.Group
        value={responsiveMode}
        onChange={(e) => setResponsiveMode(e.target.value)}
        size="small"
        buttonStyle="solid"
      >
        <Radio.Button value="desktop">
          <DesktopOutlined /> Desktop
        </Radio.Button>
        <Radio.Button value="tablet">
          <TabletOutlined /> Tablet
        </Radio.Button>
        <Radio.Button value="mobile">
          <MobileOutlined /> Mobile
        </Radio.Button>
      </Radio.Group>
    </div>
  );
}
