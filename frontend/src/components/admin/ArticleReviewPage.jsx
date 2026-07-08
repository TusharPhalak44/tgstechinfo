import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Button, Tag, Space, Typography, Avatar,
  Divider, Input, Popconfirm, message, Skeleton, Badge, Modal
} from 'antd';
import {
  UserOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, EditOutlined, SendOutlined,
  ArrowLeftOutlined, EyeOutlined, TagOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import '../../prose-content.css';

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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin')}
        className="mb-6"
      >
        Back to Dashboard
      </Button>

      <Row gutter={[24, 24]}>
        {/* Main Article Content */}
        <Col xs={24} lg={16}>
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-soft border border-gray-200">

            {/* Status Badge */}
            <div className="mb-3">
              <Badge 
                status={statusColorMap[content.status] || 'default'} 
                text={
                  <span className="capitalize font-medium">
                    {content.status?.replace('_', ' ')}
                  </span>
                } 
              />
            </div>

            {/* Category & Content Type */}
            <Space className="mb-3">
              {content.category_name && <Tag color="blue">{content.category_name}</Tag>}
              {content.content_type_name && <Tag color="purple">{content.content_type_name}</Tag>}
            </Space>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {content.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 pb-4 border-b border-gray-200">
              <Space>
                <Avatar size="small" icon={<UserOutlined />} className="bg-primary-500" />
                <Text strong>{content.first_name} {content.last_name}</Text>
              </Space>
              <Space>
                <CalendarOutlined className="text-gray-400" />
                <Text type="secondary">
                  {content.scheduled_publish_date
                    ? moment(content.scheduled_publish_date).format('MMMM D, YYYY')
                    : moment(content.created_at).format('MMMM D, YYYY')}
                </Text>
              </Space>
              <Space>
                <ClockCircleOutlined className="text-gray-400" />
                <Text type="secondary">{content.reading_time || 1} min read</Text>
              </Space>
            </div>

            {/* Banner Image */}
            {content.banner_image && (
              <div className="mb-7 rounded-xl bg-gray-100" style={{ textAlign: 'center' }}>
                <img
                  src={`/uploads/${content.banner_image}`}
                  alt={content.title}
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 12 }}
                />
              </div>
            )}

            {/* Short Description */}
            {content.short_description && (
              <div className="mb-6 p-4 bg-gray-50 border-l-4 border-primary-500 rounded-r">
                <Text className="text-base text-gray-700 leading-relaxed">
                  {content.short_description}
                </Text>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <TagOutlined className="text-gray-400" />
                {tags.map((tag, i) => (
                  <Tag key={i} color="geekblue" className="rounded-full">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            {/* ✅ Article Content - Fixed Display */}
            <div className="article-content-wrapper">
              <Divider titlePlacement="left" plain>
                <span className="text-gray-500 text-sm font-medium">Content</span>
              </Divider>
              <div 
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: content.content || '<p>No content available</p>' }}
              />
            </div>

            {/* SEO Section */}
            {(content.seo_meta_title || content.seo_meta_description || content.seo_meta_keywords) && (
              <>
                <Divider />
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <Text strong className="text-xs text-gray-400 uppercase tracking-wider">
                    SEO Settings
                  </Text>
                  {content.seo_meta_title && (
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs">Meta Title</Text>
                      <div><Text>{content.seo_meta_title}</Text></div>
                    </div>
                  )}
                  {content.seo_meta_description && (
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs">Meta Description</Text>
                      <div><Text>{content.seo_meta_description}</Text></div>
                    </div>
                  )}
                  {content.seo_meta_keywords && (
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs">Meta Keywords</Text>
                      <div><Text>{content.seo_meta_keywords}</Text></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Col>

        {/* Sidebar - Review Actions */}
        <Col xs={24} lg={8}>
          <div className="sticky top-20">
            <Card title="Review Actions" className="rounded-xl shadow-soft border border-gray-200">

              {/* Article Info */}
              <div className="mb-4 space-y-2">
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider">AUTHOR</Text>
                  <div><Text strong>{content.first_name} {content.last_name}</Text></div>
                  <div><Text type="secondary" className="text-sm">{content.author_email}</Text></div>
                </div>
                
                {content.scheduled_publish_date && (
                  <div>
                    <Text type="secondary" className="text-xs uppercase tracking-wider">SCHEDULED PUBLISH</Text>
                    <div><Text>{moment(content.scheduled_publish_date).format('MMM D, YYYY')}</Text></div>
                  </div>
                )}
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider">READING TIME</Text>
                  <div><Text>{content.reading_time || 1} min</Text></div>
                </div>
              </div>

              <Divider className="my-3" />

              {/* Previous Admin Comment */}
              {content.admin_comment && (
                <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  <Text type="warning" strong>Previous Feedback: </Text>
                  <Text>{content.admin_comment}</Text>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  icon={<EditOutlined />}
                  block
                  size="large"
                  className="border-indigo-500 text-indigo-500 hover:border-indigo-600 hover:text-indigo-600"
                  onClick={() => navigate(`/admin/edit/${id}`)}
                >
                  Edit Content
                </Button>
                {content.status === 'published' && (
                  <Button
                    icon={<EyeOutlined />} 
                    block 
                    size="large"
                    className="border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600"
                    onClick={() => window.open(`/article/${content.slug}`, '_blank')}
                  >
                    View on Site
                  </Button>
                )}

                {content.status === 'approved' && (
                  <Button
                    type="primary" 
                    icon={<SendOutlined />} 
                    block 
                    loading={submitting} 
                    size="large"
                    className="bg-blue-500 hover:bg-blue-600 border-none"
                    onClick={() => handleReview('publish')}
                  >
                    Publish
                  </Button>
                )}

                {content.status !== 'approved' && content.status !== 'published' && (
                  <Button
                    type="primary" 
                    icon={<CheckOutlined />} 
                    block 
                    loading={submitting} 
                    size="large"
                    className="bg-green-500 hover:bg-green-600 border-none"
                    onClick={() => handleReview('approve')}
                  >
                    Approve
                  </Button>
                )}

                {content.status !== 'published' && (
                  <Button
                    icon={<EditOutlined />} 
                    block 
                    loading={submitting} 
                    size="large"
                    className="border-orange-500 text-orange-500 hover:border-orange-600 hover:text-orange-600"
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
                      block 
                      loading={submitting} 
                      size="large"
                      className="hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </Popconfirm>
                )}

                <Divider className="my-2" />

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
                  <Button danger icon={<DeleteOutlined />} block size="large">
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
      >
        <div className="mb-2">
          <Text>Author ko kya changes karne hain? (required)</Text>
        </div>
        <TextArea
          rows={5}
          value={changesComment}
          onChange={(e) => setChangesComment(e.target.value)}
          placeholder="Describe the changes needed..."
          autoFocus
          className="rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
        />
      </Modal>


    </div>
  );
};

export default ArticleReviewPage;