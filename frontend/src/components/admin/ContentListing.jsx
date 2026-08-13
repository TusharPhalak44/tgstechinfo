import React, { useState, useEffect } from 'react';
import {
  Table, Typography, Tag, Button, Dropdown,
  Input, Select, Space, Avatar, Checkbox, message,
  Card, Row, Col, ConfigProvider
} from 'antd';
import {
  EditOutlined, EyeOutlined, DeleteOutlined, MoreOutlined,
  SearchOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CalendarOutlined, FileTextOutlined, StarOutlined,
  PlusOutlined, UserOutlined, EyeOutlined as EyeIcon
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ContentListing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [contentType, setContentType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('draft');
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      // Use appropriate endpoint based on user role
      // Admin sees all content, regular users see only their own
      const endpoint = user?.role === 'admin' 
        ? '/api/admin/content/all' 
        : '/api/user/content';
      
      const response = await axios.get(endpoint, { params });
      
      // Handle different response formats
      if (user?.role === 'admin') {
        setContent(response.data.data || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      } else {
        // User endpoint returns array directly
        const contentArray = response.data || [];
        setContent(contentArray);
        setPagination(prev => ({ ...prev, total: contentArray.length }));
      }
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
      const apiBase = user?.role === 'admin' ? '/api/admin' : '/api/user';
      await axios.delete(`${apiBase}/content/${id}`);
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
      responsive: ['lg'],
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
      width: isMobile ? 200 : isTablet ? 280 : 340,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 8, flexShrink: 0,
            background: darkMode ? '#0f172a' : '#F1F5F9', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {record.banner_image
              ? <img src={`/uploads/${record.banner_image}`} alt={text}
                  style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, objectFit: 'cover' }} />
              : <FileTextOutlined style={{ fontSize: isMobile ? 18 : 20, color: darkMode ? '#475569' : '#6B7280' }} />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{
              fontSize: isMobile ? 12 : 13, color: darkMode ? '#f1f5f9' : '#111827', display: 'block',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 140 : isTablet ? 200 : 240
            }}>
              {text}
            </Text>
            <Text style={{ fontSize: isMobile ? 11 : 12, color: darkMode ? '#94a3b8' : '#6B7280' }}>
              {record.category_name || '—'}
              {record.content_type_name && !isMobile && (
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
      responsive: ['md', 'lg', 'xl'],
      render: (_, record) => {
        const name = [record.first_name, record.last_name].filter(Boolean).join(' ') || 'Unknown';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={26} icon={<UserOutlined />} style={{ background: '#4a7cff', flexShrink: 0 }} />
            <Text style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#111827' }}>{name}</Text>
          </div>
        );
      },
    },
    {
      title: 'SEO Score',
      dataIndex: 'seo_meta_title',
      width: 100,
      responsive: ['lg', 'xl'],
      render: (_, record) => {
        // Use the same SEO calculation logic as CreateContent
        const calculateSEOScore = (title, description, content, tags, seoMetaTitle, seoMetaDescription, seoMetaKeywords) => {
          let score = 0;
          let maxScore = 100;

          // Title analysis (20 points)
          if (title && title.length >= 30 && title.length <= 60) {
            score += 20;
          } else if (title && title.length > 0) {
            score += 10;
          }

          // Description analysis (15 points)
          if (description && description.length >= 120 && description.length <= 160) {
            score += 15;
          } else if (description && description.length > 0) {
            score += 8;
          }

          // Content length analysis (25 points)
          const plainContent = content ? content.replace(/<[^>]*>/g, '').trim() : '';
          const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
          if (wordCount >= 300) {
            score += 25;
          } else if (wordCount >= 150) {
            score += 15;
          }

          // Tags analysis (10 points)
          const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
          if (parsedTags && parsedTags.length >= 3) {
            score += 10;
          } else if (parsedTags && parsedTags.length > 0) {
            score += 5;
          }

          // SEO Meta Title analysis (15 points)
          if (seoMetaTitle && seoMetaTitle.length >= 30 && seoMetaTitle.length <= 60) {
            score += 15;
          } else if (seoMetaTitle && seoMetaTitle.length > 0) {
            score += 8;
          }

          // SEO Meta Description analysis (15 points)
          if (seoMetaDescription && seoMetaDescription.length >= 120 && seoMetaDescription.length <= 160) {
            score += 15;
          } else if (seoMetaDescription && seoMetaDescription.length > 0) {
            score += 8;
          }

          return Math.round((score / maxScore) * 100);
        };

        const score = calculateSEOScore(
          record.title,
          record.short_description,
          record.content,
          record.tags,
          record.seo_meta_title,
          record.seo_meta_description,
          record.seo_meta_keywords
        );

        // Don't show SEO warning for published content - it's already been approved
        const shouldShowWarning = record.status !== 'published';
        const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarOutlined style={{ color, fontSize: 14 }} />
            <Text strong style={{ fontSize: 13, color }}>{score}%</Text>
            {shouldShowWarning && score < 80 && (
              <Text style={{ fontSize: 11, color: '#F59E0B' }}>(Low)</Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Views',
      dataIndex: 'view_count',
      width: 90,
      responsive: ['md', 'lg', 'xl'],
      render: (views) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <EyeIcon style={{ color: '#6B7280', fontSize: 14 }} />
          <Text style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#111827' }}>{(views || 0).toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: isMobile ? 100 : 140,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (status) => {
        const s = status || 'draft';
        const cfg = statusColors[s] || statusColors.draft;
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: isMobile ? '3px 8px' : '4px 12px', borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            fontSize: isMobile ? 11 : 12, fontWeight: 500,
          }}>
            {cfg.icon}
            <span style={{ textTransform: 'capitalize', display: isMobile ? 'none' : 'inline' }}>{s.replace('_', ' ')}</span>
          </div>
        );
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      width: 120,
      responsive: ['lg', 'xl'],
      render: (date) => (
        <Text style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6B7280' }}>
          {date ? moment(date).fromNow() : '—'}
        </Text>
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 60,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
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
                onClick: async ({ domEvent }) => {
                  domEvent.stopPropagation();
                  try {
                    // Increment view count when content is clicked (use session-based deduplication)
                    const viewKey = `content-viewed-${record.id}`;
                    const sessionViewed = sessionStorage.getItem(viewKey);

                    // Only increment if not already viewed in this session
                    if (!sessionViewed) {
                      console.log('👁️ Incrementing view for content:', record.id);
                      await axios.post(`/api/public/content/${record.id}/view`);
                      sessionStorage.setItem(viewKey, 'true');
                      console.log('✅ View incremented and marked as viewed');
                    } else {
                      console.log('⏭️ Content already viewed in this session, skipping increment');
                    }
                  } catch (error) {
                    console.error('Error incrementing view count:', error);
                  }
                  navigate(`/${record.content_type || 'article'}-preview/${record.id}`);
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
            style={{ color: darkMode ? '#94a3b8' : '#6B7280' }}
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // Render card view for mobile
  const renderMobileCard = (record) => {
    const s = record.status || 'draft';
    const cfg = statusColors[s] || statusColors.draft;
    const name = [record.first_name, record.last_name].filter(Boolean).join(' ') || 'Unknown';

    return (
      <Card
        key={record.id}
        style={{
          marginBottom: 12,
          borderRadius: 8,
          border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: darkMode ? '#1e293b' : '#fff',
        }}
        hoverable
        onClick={() => handleEdit(record)}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 8, flexShrink: 0,
            background: darkMode ? '#0f172a' : '#F1F5F9', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {record.banner_image
              ? <img src={`/uploads/${record.banner_image}`} alt={record.title}
                  style={{ width: 60, height: 60, objectFit: 'cover' }} />
              : <FileTextOutlined style={{ fontSize: 24, color: darkMode ? '#475569' : '#6B7280' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{
              fontSize: 13, color: darkMode ? '#f1f5f9' : '#111827', display: 'block',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginBottom: 4
            }}>
              {record.title}
            </Text>
            <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6B7280', display: 'block', marginBottom: 4 }}>
              {record.category_name || '—'}
            </Text>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 12,
              background: cfg.bg, color: cfg.color,
              fontSize: 10, fontWeight: 500,
            }}>
              {cfg.icon}
              <span style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6B7280' }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {name}
          </Text>
          <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6B7280' }}>
            <EyeIcon style={{ marginRight: 4 }} />
            {(record.view_count || 0).toLocaleString()}
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6B7280' }}>
            {record.updated_at ? moment(record.updated_at).fromNow() : '—'}
          </Text>
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
                    navigate(`/${record.content_type || 'article'}-preview/${record.id}`);
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
              style={{ color: darkMode ? '#94a3b8' : '#6B7280', padding: '4px 8px' }}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      </Card>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#d9d9d9',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
      }}
    >
      <div style={{ padding: isMobile ? '16px' : '24px', background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Title level={2} style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 4 }}>
          Content
        </Title>
        <Text style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#94a3b8' : '#6B7280' }}>
          Manage all your pages, blogs, and landing pages
        </Text>
      </div>

      {/* Filters */}
      <div style={{
        marginBottom: 24, padding: isMobile ? '12px 16px' : '16px 20px',
        background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
        display: 'flex', justifyContent: isMobile ? 'flex-start' : 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center', 
        flexWrap: 'wrap', gap: isMobile ? 12 : 16,
      }}>
        <Space size={isMobile ? 8 : 12} wrap>
          <Input
            placeholder="Search content..."
            prefix={<SearchOutlined style={{ color: darkMode ? '#64748b' : '#9CA3AF' }} />}
            style={{ width: isMobile ? '100%' : 260, borderRadius: 8 }}
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            allowClear
          />
          <Select
            style={{ width: isMobile ? '100%' : 150 }}
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
        <Space size={isMobile ? 8 : 12} style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
          {selectedRowKeys.length > 0 && (
            <Text style={{ color: darkMode ? '#94a3b8' : '#6B7280', fontSize: 13 }}>{selectedRowKeys.length} selected</Text>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/create-post')}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {isMobile ? 'Create' : 'Create Content'}
          </Button>
        </Space>
      </div>

      {/* Table/Card */}
      <div style={{
        background: darkMode ? '#1e293b' : '#fff', borderRadius: 12,
        border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB', overflow: 'hidden',
      }}>
        {isMobile ? (
          <div style={{ padding: '12px 16px' }}>
            {content.map(renderMobileCard)}
            {content.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: darkMode ? '#94a3b8' : '#6B7280' }}>
                No content found
              </div>
            )}
            {pagination.total > pagination.pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <Button
                  disabled={pagination.current === 1}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, current: prev.current - 1 }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ marginRight: 8 }}
                >
                  Previous
                </Button>
                <Text style={{ padding: '0 12px', alignSelf: 'center' }}>
                  {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                </Text>
                <Button
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, current: prev.current + 1 }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={content}
            loading={loading}
            rowKey="id"
            scroll={{ x: isMobile ? 600 : 'max-content' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: !isMobile,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: isMobile ? undefined : (total) => `${total} items`,
              simple: isMobile,
              style: isMobile ? { padding: '12px 16px' } : { padding: '16px 24px' },
              onChange: (page, size) => {
                setPagination(prev => ({ ...prev, current: page, pageSize: size }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            }}
            onRow={(record) => ({
              onClick: () => handleEdit(record),
              style: { cursor: 'pointer', transition: 'background 0.15s' },
              onMouseEnter: (e) => { e.currentTarget.style.background = darkMode ? '#334155' : '#F8FAFC'; },
              onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
            })}
          />
        )}
      </div>
    </div>
    </ConfigProvider>
  );
};

export default ContentListing;
