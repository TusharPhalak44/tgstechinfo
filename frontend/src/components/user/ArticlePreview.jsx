import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Button, Tag, Space, Typography, Avatar, Divider, Skeleton, Badge, message } from 'antd';
import {
  UserOutlined, ClockCircleOutlined, ArrowLeftOutlined,
  TagOutlined, EditOutlined, SendOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import ContentRenderer from '../common/ContentRenderer';
import { useTheme } from '../../context/ThemeContext';

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
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchContent(); }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/user/content/${id}`);
      setContent(res.data);
    } catch {
      message.error('Failed to load article');
      navigate('/dashboard');
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

  return (
    <div className="px-4 py-6 md:px-8" style={{ background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3 max-w-7xl mx-auto">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} style={{ color: darkMode ? '#94a3b8' : undefined }}>
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

      {/* ✅ Additional styles for content display */}
      <style jsx global>{`
        /* Article Content Styles */
        .article-content {
          font-size: 16px;
          line-height: 1.9;
          color: ${darkMode ? '#cbd5e1' : '#333333'};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Headings */
        .article-content h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 24px 0 16px;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
          line-height: 1.3;
        }
        .article-content h2 {
          font-size: 28px;
          font-weight: 600;
          margin: 20px 0 14px;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
          line-height: 1.3;
        }
        .article-content h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 18px 0 12px;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
          line-height: 1.3;
        }
        .article-content h4 {
          font-size: 20px;
          font-weight: 500;
          margin: 16px 0 10px;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
          line-height: 1.3;
        }
        .article-content h5 {
          font-size: 18px;
          font-weight: 500;
          margin: 14px 0 8px;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
        }
        .article-content h6 {
          font-size: 16px;
          font-weight: 500;
          margin: 12px 0 6px;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
        }

        /* Paragraphs */
        .article-content p {
          margin: 12px 0;
          line-height: 1.9;
        }

        /* ✅ Lists - Bullet Points with Proper Spacing */
        .article-content ul {
          padding-left: 32px !important;
          margin: 12px 0;
          list-style-type: disc;
        }
        .article-content ol {
          padding-left: 32px !important;
          margin: 12px 0;
          list-style-type: decimal;
        }
        .article-content li {
          margin: 6px 0;
          line-height: 1.9;
        }
        .article-content ul ul,
        .article-content ol ol,
        .article-content ul ol,
        .article-content ol ul {
          padding-left: 32px !important;
          margin: 4px 0;
        }

        /* Blockquotes */
        .article-content blockquote {
          border-left: 4px solid #4a7cff;
          padding: 12px 20px;
          margin: 16px 0;
          background: ${darkMode ? '#1e293b' : '#f6f8fa'};
          border-radius: 0 4px 4px 0;
          font-style: italic;
          color: ${darkMode ? '#94a3b8' : '#495057'};
        }
        .article-content blockquote p {
          margin: 4px 0;
        }

        /* Code */
        .article-content code {
          background: ${darkMode ? '#1e293b' : '#f0f0f0'};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: ${darkMode ? '#f87171' : '#d63384'};
        }
        .article-content pre {
          background: #1a1a1a;
          color: #f8f8f8;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
        }
        .article-content pre code {
          background: transparent;
          color: #f8f8f8;
          padding: 0;
          font-size: 14px;
        }

        /* Links */
        .article-content a {
          color: #4a7cff;
          text-decoration: underline;
          transition: color 0.3s;
        }
        .article-content a:hover {
          color: #3b5fd9;
        }

        /* Images */
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }

        /* Tables */
        .article-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .article-content table th,
        .article-content table td {
          border: 1px solid ${darkMode ? '#334155' : '#d9d9d9'};
          padding: 10px 14px;
          text-align: left;
          color: ${darkMode ? '#cbd5e1' : '#1a1a2e'};
        }
        .article-content table th {
          background: ${darkMode ? '#1e293b' : '#fafafa'};
          font-weight: 600;
          color: ${darkMode ? '#f1f5f9' : '#1a1a2e'};
        }
        .article-content table tr:nth-child(even) {
          background: ${darkMode ? '#0f172a' : '#f8f9fa'};
        }

        /* Horizontal Rule */
        .article-content hr {
          border: none;
          border-top: 2px solid ${darkMode ? '#334155' : '#e9ecef'};
          margin: 24px 0;
        }

        /* ✅ Gap between lines - preserve spacing */
        .article-content p + p {
          margin-top: 16px;
        }

        .article-content br {
          display: block;
          content: "";
          margin: 8px 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .article-content {
            font-size: 15px;
          }
          .article-content ul,
          .article-content ol {
            padding-left: 24px !important;
          }
          .article-content h1 {
            font-size: 26px;
          }
          .article-content h2 {
            font-size: 22px;
          }
          .article-content h3 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .article-content {
            font-size: 14px;
          }
          .article-content ul,
          .article-content ol {
            padding-left: 20px !important;
          }
          .article-content h1 {
            font-size: 22px;
          }
          .article-content h2 {
            font-size: 19px;
          }
          .article-content h3 {
            font-size: 17px;
          }
        }
      `}</style>
    </div>
  );
};

export default ArticlePreview;