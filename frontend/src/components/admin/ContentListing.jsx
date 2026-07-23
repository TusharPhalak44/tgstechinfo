import React, { useState, useEffect } from 'react';
import {
  Table, Typography, Tag, Button, Dropdown,
  Input, Select, Space, Avatar, Checkbox, message
} from 'antd';
import {
  EditOutlined, EyeOutlined, DeleteOutlined, MoreOutlined,
  SearchOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CalendarOutlined, FileTextOutlined, StarOutlined,
  PlusOutlined, UserOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ContentListing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [contentType, setContentType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('draft');
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Determine filter based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/blogs')) {
      setContentType('blog');
      setStatusFilter('published');
    } else if (path.includes('/landing-pages')) {
      setContentType('landing-page');
      setStatusFilter('published');
    } else if (path.includes('/drafts')) {
      setContentType('all');
      setStatusFilter('draft');
    } else {
      setContentType('all');
      setStatusFilter('published');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchContent();
  }, [filters, pagination.current, pagination.pageSize, contentType, statusFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const offset = (pagination.current - 1) * pagination.pageSize;
      const params = { limit: pagination.pageSize, offset };

      if (contentType !== 'all') params.content_type = contentType;

      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (filters.search) params.search = filters.search;

      const response = await axios.get('/api/admin/content/all', { params });
      setContent(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record, e) => {
    e?.stopPropagation();
    const canUserEdit = record.status === 'draft' || record.status === 'changes_requested';
    if (canUserEdit) {
      navigate(`/edit-content/${record.id}`);
    } else {
      navigate(`/admin/edit/${record.id}`);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await axios.delete(`/api/admin/content/${id}`);
      message.success('Deleted successfully');
      fetchContent();
    } catch {
      message.error('Failed to delete');
    }
  };

  const statusColors = {
    published:         { color: '#10B981', bg: '#10B98115', icon: <CheckCircleOutlined /> },
    draft:             { color: '#6B7280', bg: '#6B728015', icon: <EditOutlined /> },
    scheduled:         { color: '#F59E0B', bg: '#F59E0B15', icon: <CalendarOutlined /> },
    pending:           { color: '#0AAEEF', bg: '#0AAEEF15', icon: <ClockCircleOutlined /> },
    changes_requested: { color: '#F59E0B', bg: '#F59E0B15', icon: <EditOutlined /> },
    rejected:          { color: '#EF4444', bg: '#EF444415', icon: <DeleteOutlined /> },
    approved:          { color: '#10B981', bg: '#10B98115', icon: <CheckCircleOutlined /> },
  };

  const columns = [
    {
      title: '',
      dataIndex: 'selection',
      width: 40,
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedRowKeys(prev =>
              e.target.checked ? [...prev, record.id] : prev.filter(k => k !== record.id)
            );
          }}
          onClick={e => e.stopPropagation()}
        />
      ),
    },
    {
      title: 'Content',
      dataIndex: 'title',
      width: 340,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: '#F1F5F9', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {record.banner_image
              ? <img src={`/uploads/${record.banner_image}`} alt={text}
                  style={{ width: 48, height: 48, objectFit: 'cover' }} />
              : <FileTextOutlined style={{ fontSize: 20, color: '#6B7280' }} />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{
              fontSize: 13, color: '#111827', display: 'block',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240
            }}>
              {text}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {record.category_name || '—'}
              {record.content_type_name && (
                <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>
                  {record.content_type_name}
                </Tag>
              )}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'first_name',
      width: 150,
      render: (_, record) => {
        const name = [record.first_name, record.last_name].filter(Boolean).join(' ') || 'Unknown';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={26} icon={<UserOutlined />} style={{ background: '#4a7cff', flexShrink: 0 }} />
            <Text style={{ fontSize: 13, color: '#111827' }}>{name}</Text>
          </div>
        );
      },
    },
    {
      title: 'SEO Score',
      dataIndex: 'seo_meta_title',
      width: 100,
      render: (_, record) => {
        let score = 0;
        if (record.seo_meta_title) score += 20;
        if (record.seo_meta_description) score += 20;
        if (record.seo_meta_keywords) score += 20;
        if (record.content) score += 20;
        if (record.banner_image) score += 20;
        const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarOutlined style={{ color, fontSize: 14 }} />
            <Text strong style={{ fontSize: 13, color }}>{score}</Text>
          </div>
        );
      },
    },
    {
      title: 'Views',
      dataIndex: 'view_count',
      width: 90,
      render: (views) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <EyeOutlined style={{ color: '#6B7280', fontSize: 14 }} />
          <Text style={{ fontSize: 13, color: '#111827' }}>{(views || 0).toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (status) => {
        const s = status || 'draft';
        const cfg = statusColors[s] || statusColors.draft;
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            fontSize: 12, fontWeight: 500,
          }}>
            {cfg.icon}
            <span style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
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
          {date ? moment(date).fromNow() : '—'}
        </Text>
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 60,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: ({ domEvent }) => handleEdit(record, domEvent),
              },
              {
                key: 'preview',
                icon: <EyeOutlined />,
                label: 'Preview',
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  navigate(`/article-preview/${record.id}`);
                },
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: ({ domEvent }) => handleDelete(record.id, domEvent),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: '#6B7280' }}
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          Content
        </Title>
        <Text style={{ fontSize: 14, color: '#6B7280' }}>
          Manage all your pages, blogs, and landing pages
        </Text>
      </div>

      {/* Filters */}
      <div style={{
        marginBottom: 24, padding: '16px 20px',
        background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <Space size={12} wrap>
          <Input
            placeholder="Search content..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            style={{ width: 260, borderRadius: 8 }}
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            allowClear
          />
          <Select
            style={{ width: 150 }}
            value={filters.status}
            onChange={(v) => setFilters(f => ({ ...f, status: v }))}
          >
            <Option value="all">All Status</Option>
            <Option value="published">Published</Option>
            <Option value="draft">Draft</Option>
            <Option value="pending">Pending</Option>
            <Option value="changes_requested">Changes Requested</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
        </Space>
        <Space size={12}>
          {selectedRowKeys.length > 0 && (
            <Text style={{ color: '#6B7280', fontSize: 13 }}>{selectedRowKeys.length} selected</Text>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/create-post')}
          >
            Create Content
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 12,
        border: '1px solid #E5E7EB', overflow: 'hidden',
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
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `${total} items`,
            style: { padding: '16px 24px' },
            onChange: (page, size) =>
              setPagination(prev => ({ ...prev, current: page, pageSize: size })),
          }}
          onRow={(record) => ({
            onClick: () => handleEdit(record),
            style: { cursor: 'pointer', transition: 'background 0.15s' },
            onMouseEnter: (e) => { e.currentTarget.style.background = '#F8FAFC'; },
            onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
          })}
        />
      </div>
    </div>
  );
};

export default ContentListing;
