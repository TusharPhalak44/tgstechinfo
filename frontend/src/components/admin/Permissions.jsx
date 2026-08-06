import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, message, Grid, ConfigProvider, Tag } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Permissions = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/rbac/permissions');
        setPermissions(Array.isArray(response.data?.permissions) ? response.data.permissions : []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        message.error('Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 120 : 180,
      render: (text) => <Text strong style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{text}</Text>,
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      width: isMobile ? 90 : 140,
      render: (text) => <Tag color="blue" style={{ fontSize: isMobile ? 11 : 13 }}>{text}</Tag>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: isMobile ? 80 : 120,
      render: (text) => <Tag color="purple" style={{ fontSize: isMobile ? 11 : 13 }}>{text}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <Text style={{ fontSize: isMobile ? 11 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>{text || '-'}</Text>,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#e5e7eb',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
      }}
    >
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
              <LockOutlined /> Permissions
            </Title>
            <Text style={{ fontSize: isMobile ? 13 : 15, color: darkMode ? '#94a3b8' : '#6B7280' }}>
              View system permissions
            </Text>
          </div>
        </div>

        <Card
          style={{
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: isMobile ? 12 : 20 }}
        >
          <Table
            columns={columns}
            dataSource={permissions}
            rowKey={(row) => row?.id ?? `${row?.resource || 'unknown'}.${row?.action || 'unknown'}.${row?.name || 'unknown'}`}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={isMobile ? { x: 520 } : undefined}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default Permissions;

