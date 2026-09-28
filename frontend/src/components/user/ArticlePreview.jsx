import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Button, Tag, Space, Typography, Avatar, Divider, Skeleton, Badge, message } from 'antd';
import {
  UserOutlined, ClockCircleOutlined, ArrowLeftOutlined,
  TagOutlined, EditOutlined, SendOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import ContentRenderer from '../common/ContentRenderer';
import './ArticlePreview.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import StandaloneBuilderPage from '../../pages/StandaloneBuilderPage';

const { Title, Text } = Typography;

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

const statusColorMap = {
  draft: 'default', pending: 'processing', approved: 'success',
  published: 'success', rejected: 'error', changes_requested: 'warning'
};

const ArticlePreview = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Extract content type from URL parameter (remove -preview suffix)
  const contentType = type ? type.replace('-preview', '') : 'article';

  // Determine if user is admin based on role or previous route
  const isAdmin = user?.role === 'admin' || location.state?.fromAdmin || location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  useEffect(() => { fetchContent(); }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/user/content/${id}`);
      setContent(res.data);
    } catch {
      message.error('Failed to load article');
      navigate(isAdmin ? '/dashboard' : '/user-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/user/content/${id}/submit`);
      const typeName = content?.content_type_name || 'Content';
      message.success(`${typeName} submitted for review!`);
      fetchContent();
    } catch {
      message.error('Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 12 }} className="p-8" />;
  if (!content) return null;

  const tags = parseTags(content.tags);
  const canEdit = content.status === 'changes_requested' || content.status === 'draft';

  // Visual Builder content — render full canvas, no standard layout
  if (content.builder_page_data) {
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* Top bar for navigation and actions */}
        <div style={{ padding: '12px 24px', background: darkMode ? '#1e293b' : '#fff', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(isAdmin ? '/dashboard' : '/user-dashboard')} style={{ color: darkMode ? '#94a3b8' : undefined }}>
            Back to Dashboard
          </Button>
          {canEdit && (
            <Space size={8}>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/edit-content/${id}`)} style={{ color: darkMode ? '#cbd5e1' : undefined }}>
                Edit in Builder
              </Button>
            </Space>
          )}
        </div>
        <StandaloneBuilderPage content={content} />
      </div>
    );
  }

  return (
    <div className={`px-4 py-6 md:px-8 ${darkMode ? 'dark-mode' : ''}`} style={{ background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3 max-w-7xl mx-auto">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(isAdmin ? '/dashboard' : '/user-dashboard')} style={{ color: darkMode ? '#94a3b8' : undefined }}>
          Back to Dashboard
        </Button>
        {canEdit && (
          <Space className="flex-wrap" size={8}>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/edit-content/${id}`)} style={{ color: darkMode ? '#cbd5e1' : undefined }}>
              Edit Article
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={handleSubmitForReview} style={{ color: darkMode ? '#fff' : undefined }}>
              Submit for Review
            </Button>
          </Space>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-7xl mx-auto" style={{ background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : 'none' }}>

        {/* Status */}
        <div className="mb-3">
          <Badge
            status={statusColorMap[content.status] || 'default'}
            text={<span className="capitalize font-medium" style={{ color: darkMode ? '#cbd5e1' : '#111827' }}>{content.status?.replace('_', ' ')}</span>}
          />
        </div>

        {/* Admin Feedback - Changes Requested */}
        {content.status === 'changes_requested' && content.admin_comment && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3" style={{ background: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', borderColor: darkMode ? '#f59e0b' : '#fcd34d' }}>
            <div className="font-semibold text-amber-700 mb-1" style={{ color: darkMode ? '#fbbf24' : '#b45309' }}>
              <EditOutlined className="mr-1.5" /> Admin Feedback: Changes Required
            </div>
            <div style={{ color: darkMode ? '#fcd34d' : '#92400e' }}>{content.admin_comment}</div>
          </div>
        )}

        {/* Admin Feedback - Rejected */}
        {content.status === 'rejected' && content.admin_comment && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3" style={{ background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: darkMode ? '#ef4444' : '#fca5a5' }}>
            <div className="font-semibold text-red-700 mb-1" style={{ color: darkMode ? '#f87171' : '#b91c1c' }}>
              <CloseCircleOutlined className="mr-1.5" /> Rejection Reason
            </div>
            <div style={{ color: darkMode ? '#fca5a5' : '#991b1b' }}>{content.admin_comment}</div>
          </div>
        )}

        {/* Category & Type */}
        <div className="mb-3">
          {content.category_name && (
            <span style={{ display: 'inline-block', marginRight: '12px' }}>
              <Tag color="blue" style={{ color: darkMode ? '#60a5fa' : undefined }}>{content.category_name}</Tag>
            </span>
          )}
          {content.content_type_name && (
            <span style={{ display: 'inline-block' }}>
              <Tag color="purple" style={{ color: darkMode ? '#a78bfa' : undefined }}>{content.content_type_name}</Tag>
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4 pb-4 border-b border-gray-200" style={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} className="bg-primary-500" style={{ background: '#4a7cff' }} />
            <Text strong style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>{content.first_name} {content.last_name}</Text>
          </Space>
          <Space>
            <ClockCircleOutlined style={{ color: darkMode ? '#94a3b8' : '#9ca3af' }} />
            <Text type="secondary" style={{ color: darkMode ? '#94a3b8' : '#6b7280' }}>{content.reading_time || 1} min read</Text>
          </Space>
        </div>

        {/* Content rendered in saved layout order */}
        <ContentRenderer content={content} darkMode={darkMode} />
      </div>


    </div>
  );
};

export default ArticlePreview;