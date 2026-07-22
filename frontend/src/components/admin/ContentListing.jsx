import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Typography, 
  Tag, 
  Button, 
  Dropdown, 
  Input, 
  Select, 
  Space, 
  Avatar, 
  Tooltip,
  Checkbox,
  Image
} from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  DownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  StarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ContentListing = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [contentType, setContentType] = useState('page');
  const [statusFilter, setStatusFilter] = useState('published');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });

  useEffect(() => {
    // Determine content type and status filter based on route
    const path = location.pathname;
    if (path.includes('/blogs')) {
      setContentType('blog');
      setStatusFilter('published');
    } else if (path.includes('/landing-pages')) {
      setContentType('landing_page');
      setStatusFilter('published');
    } else if (path.includes('/drafts')) {
      setContentType('all');
      setStatusFilter('draft');
    } else {
      setContentType('page');
      setStatusFilter('published');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchContent();
  }, [filters, pagination, contentType, statusFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const offset = (pagination.current - 1) * pagination.pageSize;
      const params = {
        limit: pagination.pageSize,
        offset,
      };
      // Only send content_type if it's not 'all'
      if (contentType !== 'all') {
        params.content_type = contentType;
      }
      // Use statusFilter from route, unless user has manually set a different filter
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      // For drafts, filter by current user's ID
      if (statusFilter === 'draft' && user?.id) {
        params.user_id = user.id;
      }
      if (filters.search) params.search = filters.search;

      const response = await axios.get('/api/admin/content/all', { params });
      setContent(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const generateMockContent = () => { return []; };

  const statusColors = {
    published: { color: '#10B981', bg: '#10B98115', icon: <CheckCircleOutlined /> },
    draft: { color: '#6B7280', bg: '#6B728015', icon: <EditOutlined /> },
    scheduled: { color: '#F59E0B', bg: '#F59E0B15', icon: <CalendarOutlined /> },
    pending: { color: '#0AAEEF', bg: '#0AAEEF15', icon: <ClockCircleOutlined /> },
  };

  const columns = [
    {
      title: '',
      dataIndex: 'selection',
      width: 48,
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, record.id]);
            } else {
              setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: 'Content',
      dataIndex: 'title',
      width: 300,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {record.thumbnail ? (
              <Image src={record.thumbnail} alt={text} width={48} height={48} preview={false} />
            ) : (
              <FileTextOutlined style={{ fontSize: 20, color: '#6B7280' }} />
            )}
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: '#111827', display: 'block' }}>
              {text}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {record.category}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      width: 150,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={28} icon={record.authorAvatar ? null : <span>{text?.charAt(0) || '?'}</span>} src={record.authorAvatar} />
          <Text style={{ fontSize: 13, color: '#111827' }}>{text || 'Unknown'}</Text>
        </div>
      ),
    },
    {
      title: 'SEO Score',
      dataIndex: 'seoScore',
      width: 100,
      render: (score) => {
        const displayScore = score ?? 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarOutlined 
              style={{ 
                color: displayScore >= 80 ? '#10B981' : displayScore >= 60 ? '#F59E0B' : '#EF4444',
                fontSize: 14 
              }} 
            />
            <Text 
              strong 
              style={{ 
                fontSize: 13, 
                color: displayScore >= 80 ? '#10B981' : displayScore >= 60 ? '#F59E0B' : '#EF4444' 
              }}
            >
              {displayScore}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Views',
      dataIndex: 'views',
      width: 100,
      render: (views) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <EyeOutlined style={{ color: '#6B7280', fontSize: 14 }} />
          <Text style={{ fontSize: 13, color: '#111827' }}>{views?.toLocaleString() || '0'}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (status) => {
        const displayStatus = status || 'draft';
        const config = statusColors[displayStatus] || statusColors.draft;
        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: config.bg,
              color: config.color,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {config.icon}
            <span style={{ textTransform: 'capitalize' }}>{displayStatus}</span>
          </div>
        );
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      width: 120,
      render: (date) => (
        <Text style={{ fontSize: 13, color: '#6B7280' }}>
          {date ? moment(date).fromNow() : 'N/A'}
        </Text>
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
              },
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: '#6B7280' }}
          />
        </Dropdown>
      ),
    },
  ];

  const bulkActions = [
    {
      key: 'publish',
      label: 'Publish Selected',
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'draft',
      label: 'Move to Draft',
      icon: <EditOutlined />,
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          Content
        </Title>
        <Text style={{ fontSize: 15, color: '#6B7280' }}>
          Manage all your pages, blogs, and landing pages
        </Text>
      </div>

      {/* Filters and Actions */}
      <div style={{
        marginBottom: 24,
        padding: '16px 20px',
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <Space size={12}>
          <Input
            placeholder="Search content..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            style={{ width: 280, borderRadius: 8 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="Status"
            style={{ width: 120, borderRadius: 8 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="all">All Status</Option>
            <Option value="published">Published</Option>
            <Option value="draft">Draft</Option>
            <Option value="scheduled">Scheduled</Option>
            <Option value="pending">Pending</Option>
          </Select>
          <Select
            placeholder="Category"
            style={{ width: 140, borderRadius: 8 }}
            value={filters.category}
            onChange={(value) => setFilters({ ...filters, category: value })}
          >
            <Option value="all">All Categories</Option>
            <Option value="Development">Development</Option>
            <Option value="Design">Design</Option>
            <Option value="DevOps">DevOps</Option>
            <Option value="Security">Security</Option>
            <Option value="Performance">Performance</Option>
          </Select>
        </Space>
        <Space size={12}>
          {selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: bulkActions }} trigger={['click']}>
              <Button>
                {selectedRowKeys.length} selected <DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Button type="primary" icon={<FileTextOutlined />} style={{ borderRadius: 8 }}>
            Create Content
          </Button>
        </Space>
      </div>

      {/* Content Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        <Table
          columns={columns}
          dataSource={content}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `${total} items`,
            style: { padding: '16px 24px' },
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          style={{
            '.ant-table': {
              fontSize: 13,
            },
          }}
          rowStyle={{ cursor: 'pointer' }}
          onRow={(record) => ({
            onClick: () => console.log('Row clicked:', record.id),
            style: {
              transition: 'background 0.2s',
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = '#F8FAFC';
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = 'transparent';
            },
          })}
        />
      </div>
    </div>
  );
};

export default ContentListing;
