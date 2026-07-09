import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Button, Tag, Space, Typography, Avatar, Divider, Skeleton, Badge, message } from 'antd';
import {
  UserOutlined, ClockCircleOutlined, ArrowLeftOutlined,
  TagOutlined, EditOutlined, SendOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

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
    <div className="mx-auto max-w-[900px] px-4 py-6 md:px-4">
      {/* Top Bar */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        {canEdit && (
          <Space className="flex-wrap" size={8}>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/edit-content/${id}`)}>
              Edit Article
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={handleSubmitForReview}>
              Submit for Review
            </Button>
          </Space>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">

        {/* Status */}
        <div className="mb-3">
          <Badge
            status={statusColorMap[content.status] || 'default'}
            text={<span className="capitalize font-medium">{content.status?.replace('_', ' ')}</span>}
          />
        </div>

        {/* Admin Feedback - Changes Requested */}
        {content.status === 'changes_requested' && content.admin_comment && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="font-semibold text-amber-700 mb-1">
              <EditOutlined className="mr-1.5" /> Admin Feedback: Changes Required
            </div>
            <div className="text-amber-800">{content.admin_comment}</div>
          </div>
        )}

        {/* Admin Feedback - Rejected */}
        {content.status === 'rejected' && content.admin_comment && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="font-semibold text-red-700 mb-1">
              <CloseCircleOutlined className="mr-1.5" /> Rejection Reason
            </div>
            <div className="text-red-800">{content.admin_comment}</div>
          </div>
        )}

        {/* Category & Type */}
        <Space className="mb-3">
          {content.category_name && <Tag color="blue">{content.category_name}</Tag>}
          {content.content_type_name && <Tag color="purple">{content.content_type_name}</Tag>}
        </Space>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {content.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 pb-4 border-b border-gray-200">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} className="bg-primary-500" />
            <Text strong>{content.first_name} {content.last_name}</Text>
          </Space>
          <Space>
            <ClockCircleOutlined className="text-gray-400" />
            <Text type="secondary">{content.reading_time || 1} min read</Text>
          </Space>
        </div>

        {/* Banner Image */}
        {content.banner_image && (
          <div className="mb-7 rounded-lg bg-gray-100" style={{ textAlign: 'center' }}>
            <img
              src={`/uploads/${content.banner_image}`}
              alt={content.title}
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8 }}
            />
          </div>
        )}

        {/* Short Description */}
        {content.short_description && (
          <div className="mb-6 rounded border-l-4 border-primary-500 bg-gray-50 p-4">
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

        {/* ✅ Content - Fixed with proper styles */}
        <div className="article-content-preview">
          <Divider orientation="left" plain>
            <span className="text-gray-500 text-sm font-medium">Content</span>
          </Divider>
          <div 
            className="article-content prose-content"
            dangerouslySetInnerHTML={{ __html: content.content || '<p>No content available</p>' }}
          />
        </div>

        {/* SEO */}
        {(content.seo_meta_title || content.seo_meta_description || content.seo_meta_keywords) && (
          <>
            <Divider />
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
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

      {/* ✅ Additional styles for content display */}
      <style jsx global>{`
        /* Article Content Styles */
        .article-content {
          font-size: 16px;
          line-height: 1.9;
          color: #333333;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Headings */
        .article-content h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 24px 0 16px;
          color: #1a1a2e;
          line-height: 1.3;
        }
        .article-content h2 {
          font-size: 28px;
          font-weight: 600;
          margin: 20px 0 14px;
          color: #1a1a2e;
          line-height: 1.3;
        }
        .article-content h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 18px 0 12px;
          color: #1a1a2e;
          line-height: 1.3;
        }
        .article-content h4 {
          font-size: 20px;
          font-weight: 500;
          margin: 16px 0 10px;
          color: #1a1a2e;
          line-height: 1.3;
        }
        .article-content h5 {
          font-size: 18px;
          font-weight: 500;
          margin: 14px 0 8px;
          color: #1a1a2e;
        }
        .article-content h6 {
          font-size: 16px;
          font-weight: 500;
          margin: 12px 0 6px;
          color: #1a1a2e;
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
          background: #f6f8fa;
          border-radius: 0 4px 4px 0;
          font-style: italic;
          color: #495057;
        }
        .article-content blockquote p {
          margin: 4px 0;
        }

        /* Code */
        .article-content code {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #d63384;
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
          border: 1px solid #d9d9d9;
          padding: 10px 14px;
          text-align: left;
        }
        .article-content table th {
          background: #fafafa;
          font-weight: 600;
        }
        .article-content table tr:nth-child(even) {
          background: #f8f9fa;
        }

        /* Horizontal Rule */
        .article-content hr {
          border: none;
          border-top: 2px solid #e9ecef;
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

        /* Dark Mode */
        @media (prefers-color-scheme: dark) {
          .article-content {
            color: #e8e8e8;
          }
          .article-content h1,
          .article-content h2,
          .article-content h3,
          .article-content h4,
          .article-content h5,
          .article-content h6 {
            color: #f0f0f0;
          }
          .article-content blockquote {
            background: #2a2a2a;
          }
          .article-content code {
            background: #2a2a2a;
            color: #e8e8e8;
          }
          .article-content table th {
            background: #2a2a2a;
          }
          .article-content table td {
            border-color: #333;
          }
          .article-content table tr:nth-child(even) {
            background: #222;
          }
          .article-content hr {
            border-color: #333;
          }
        }
      `}</style>
    </div>
  );
};

export default ArticlePreview;