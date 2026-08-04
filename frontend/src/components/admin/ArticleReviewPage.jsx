import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Button, Tag, Space, Typography, Avatar,
  Divider, Input, Popconfirm, message, Skeleton, Badge, Modal, ConfigProvider, theme
} from 'antd';
import {
  UserOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, EditOutlined, SendOutlined,
  ArrowLeftOutlined, EyeOutlined, TagOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import '../../prose-content.css';
import ContentRenderer from '../common/ContentRenderer';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

const statusColorMap = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  published: 'success',
  rejected: 'error',
  changes_requested: 'warning'
};

const ArticleReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesComment, setChangesComment] = useState('');

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/content/${id}`);
      setContent(res.data);
      if (res.data.admin_comment) setAdminComment(res.data.admin_comment);
    } catch (err) {
      message.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action, comment) => {
    setSubmitting(true);
    try {
      await axios.put(`/api/admin/content/${id}/review`, { action, comment: comment ?? adminComment });
      const msgs = {
        approve: 'Content approved!',
        publish: 'Content published!',
        reject: 'Content rejected.',
        request_changes: 'Changes requested.'
      };
      message.success(msgs[action]);
      navigate('/admin');
    } catch (err) {
      message.error('Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changesComment.trim()) {
      message.warning('Please enter a message for the author.');
      return;
    }
    setChangesModalOpen(false);
    await handleReview('request_changes', changesComment);
  };

  if (loading) return <Skeleton active paragraph={{ rows: 12 }} className="p-8" />;
  if (!content) return (
    <div className="p-8">
      <Title level={3}>Content not found</Title>
    </div>
  );

  const tags = parseTags(content.tags);

  return (
    <ConfigProvider theme={{
      algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorBgContainer: darkMode ? '#1e293b' : '#fff',
        colorBorder: darkMode ? '#334155' : '#e5e7eb',
        colorText: darkMode ? '#cbd5e1' : '#1a1a2e',
        colorTextSecondary: darkMode ? '#94a3b8' : '#6b7280',
        colorBgElevated: darkMode ? '#1e293b' : '#fff',
        colorFillAlter: darkMode ? '#0f172a' : '#fafafa',
        colorFillContent: darkMode ? '#0f172a' : '#fff',
        colorFillQuaternary: darkMode ? '#0f172a' : '#f5f5f5',
      }
    }}>
      <div className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${darkMode ? 'dark-mode' : ''}`} style={{ background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin')}
          className="mb-6"
          style={{ color: darkMode ? '#94a3b8' : undefined }}
        >
          Back to Dashboard
        </Button>

        <Row gutter={[24, 24]}>
          {/* Main Article Content */}
          <Col xs={24} lg={18}>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-soft border border-gray-200" style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>

            {/* Status Badge */}
            <div className="mb-3">
              <Badge 
                status={statusColorMap[content.status] || 'default'} 
                text={
                  <span className="capitalize font-medium" style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>
                    {content.status?.replace('_', ' ')}
                  </span>
                } 
              />
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4 pb-4 border-b border-gray-200" style={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} className="bg-primary-500" style={{ background: '#4a7cff' }} />
                <Text strong style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>{content.first_name} {content.last_name}</Text>
              </Space>
              <Space>
                <CalendarOutlined style={{ color: darkMode ? '#94a3b8' : '#9ca3af' }} />
                <Text type="secondary" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>
                  {content.scheduled_publish_date
                    ? moment(content.scheduled_publish_date).format('MMMM D, YYYY')
                    : moment(content.created_at).format('MMMM D, YYYY')}
                </Text>
              </Space>
              <Space>
                <ClockCircleOutlined style={{ color: darkMode ? '#94a3b8' : '#9ca3af' }} />
                <Text type="secondary" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>{content.reading_time || 1} min read</Text>
              </Space>
            </div>

            {/* Content Type and Category */}
            <div className="mb-4 flex flex-wrap gap-2">
              <Tag color="blue">{content.content_type_name}</Tag>
              <Tag>{content.category_name}</Tag>
            </div>

            {/* Content rendered in saved layout order */}
            <ContentRenderer
              content={content}
              darkMode={darkMode}
              extraAfter={
                (content.seo_meta_title || content.seo_meta_description || content.seo_meta_keywords) ? (
                  <div style={{ marginTop: 24, padding: '16px', background: darkMode ? '#0f172a' : '#f6f8fa', borderRadius: 8, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                    <Text strong style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>SEO Settings</Text>
                    {content.seo_meta_title && <div style={{ marginBottom: 6 }}><Text type="secondary" style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#6b7280' }}>Meta Title</Text><div><Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{content.seo_meta_title}</Text></div></div>}
                    {content.seo_meta_description && <div style={{ marginBottom: 6 }}><Text type="secondary" style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#6b7280' }}>Meta Description</Text><div><Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{content.seo_meta_description}</Text></div></div>}
                    {content.seo_meta_keywords && <div><Text type="secondary" style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#6b7280' }}>Meta Keywords</Text><div><Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{content.seo_meta_keywords}</Text></div></div>}
                  </div>
                ) : null
              }
            />
          </div>
        </Col>

        {/* Sidebar - Review Actions */}
        <Col xs={24} lg={6}>
          <div className="sticky top-20">
            <Card title="Review Actions" className="rounded-xl shadow-soft border border-gray-200" style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>

              {/* Article Info */}
              <div className="mb-4 space-y-2">
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>AUTHOR</Text>
                  <div><Text strong style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>{content.first_name} {content.last_name}</Text></div>
                  <div><Text type="secondary" className="text-sm" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>{content.author_email}</Text></div>
                </div>
                
                {content.scheduled_publish_date && (
                  <div>
                    <Text type="secondary" className="text-xs uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>SCHEDULED PUBLISH</Text>
                    <div><Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{moment(content.scheduled_publish_date).format('MMM D, YYYY')}</Text></div>
                  </div>
                )}
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>READING TIME</Text>
                  <div><Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{content.reading_time || 1} min</Text></div>
                </div>
              </div>

              <Divider className="my-3" style={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

              {/* Previous Admin Comment */}
              {content.admin_comment && (
                <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200 text-sm" style={{ background: darkMode ? 'rgba(234, 179, 8, 0.1)' : '#fef9c3', borderColor: darkMode ? '#eab308' : '#fde047' }}>
                  <Text type="warning" strong style={{ color: darkMode ? '#fde047' : '#b45309' }}>Previous Feedback: </Text>
                  <Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{content.admin_comment}</Text>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2" style={{ alignItems: 'flex-start' }}>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  className="border-indigo-500 text-indigo-500 hover:border-indigo-600 hover:text-indigo-600"
                  style={{ color: darkMode ? '#818cf8' : undefined, borderColor: darkMode ? '#6366f1' : undefined, height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}
                  onClick={() => navigate(`/admin/edit/${id}`)}
                >
                  Edit Content
                </Button>
                {content.status === 'published' && (
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    className="border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600"
                    style={{ color: darkMode ? '#60a5fa' : undefined, borderColor: darkMode ? '#3b82f6' : undefined, height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}
                    onClick={() => {
                      const contentType = content.content_type || 'article';
                      window.open(`/${contentType}/${content.slug}`, '_blank');
                    }}
                  >
                    View on Site
                  </Button>
                )}

                {content.status === 'approved' && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={submitting}
                    size="small"
                    className="bg-blue-500 hover:bg-blue-600 border-none"
                    style={{ background: darkMode ? '#3b82f6' : undefined, height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}
                    onClick={() => handleReview('publish')}
                  >
                    Publish
                  </Button>
                )}

                {content.status !== 'approved' && content.status !== 'published' && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={submitting}
                    size="small"
                    className="bg-green-500 hover:bg-green-600 border-none"
                    style={{ background: darkMode ? '#22c55e' : undefined, height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}
                    onClick={() => handleReview('approve')}
                  >
                    Approve
                  </Button>
                )}

                {content.status !== 'published' && (
                  <Button
                    icon={<EditOutlined />}
                    loading={submitting}
                    size="small"
                    className="border-orange-500 text-orange-500 hover:border-orange-600 hover:text-orange-600"
                    style={{ color: darkMode ? '#fb923c' : undefined, borderColor: darkMode ? '#f97316' : undefined, height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}
                    onClick={() => { setChangesComment(''); setChangesModalOpen(true); }}
                  >
                    Request Changes
                  </Button>
                )}

                {content.status !== 'published' && (
                  <Popconfirm
                    title="Reject this content?"
                    onConfirm={() => handleReview('reject')}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      loading={submitting}
                      size="small"
                      className="hover:bg-red-50"
                      style={{ background: darkMode ? 'rgba(239, 68, 68, 0.1)' : undefined, height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}
                    >
                      Reject
                    </Button>
                  </Popconfirm>
                )}

                <Divider className="my-2" style={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

                <Popconfirm
                  title="Delete this content permanently?"
                  description="This action cannot be undone."
                  onConfirm={async () => {
                    try {
                      await axios.delete(`/api/admin/content/${id}`);
                      message.success('Content deleted successfully');
                      navigate('/admin');
                    } catch { message.error('Failed to delete'); }
                  }}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <Button danger icon={<DeleteOutlined />} size="small" style={{ height: 28, padding: '2px 10px', fontSize: 12, minWidth: 'auto' }}>
                    Delete Permanently
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Request Changes Modal */}
      <Modal
        title="Request Changes"
        open={changesModalOpen}
        onOk={handleRequestChanges}
        onCancel={() => setChangesModalOpen(false)}
        okText="Send Request"
        cancelText="Cancel"
        okButtonProps={{ 
          loading: submitting, 
          className: "bg-orange-500 hover:bg-orange-600 border-orange-500" 
        }}
        confirmLoading={submitting}
        styles={{
          body: { background: darkMode ? '#1e293b' : '#fff' },
          header: { background: darkMode ? '#1e293b' : '#fff', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e5e7eb' }
        }}
      >
        <div className="mb-2">
          <Text style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Author ko kya changes karne hain? (required)</Text>
        </div>
        <TextArea
          rows={5}
          value={changesComment}
          onChange={(e) => setChangesComment(e.target.value)}
          placeholder="Describe the changes needed..."
          autoFocus
          className="rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          style={{ background: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}
        />
      </Modal>


    </div>
    </ConfigProvider>
  );
};

export default ArticleReviewPage;