import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Tag, Badge, Avatar, Empty, Spin, Space, message, Tabs } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined,
  PlusOutlined, UserOutlined, CalendarOutlined, EditOutlined,
  CloseCircleOutlined, SendOutlined, TagOutlined, FormOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

const statusConfig = {
  draft: { color: 'default', text: 'Draft' },
  pending: { color: 'processing', text: 'Pending Review' },
  approved: { color: 'success', text: 'Approved' },
  published: { color: 'success', text: 'Published' },
  rejected: { color: 'error', text: 'Rejected' },
  changes_requested: { color: 'warning', text: 'Changes Requested' }
};

// Tab order & labels — matched against content_type_name (case-insensitive)
const CONTENT_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'article',   label: 'Articles' },
  { key: 'news',      label: 'News' },
  { key: 'blog',      label: 'Blogs' },
  { key: 'whitepaper',label: 'Whitepaper' },
  { key: 'interview', label: 'Interview' },
  { key: 'webinar',   label: 'Webinar' },
  { key: 'event',     label: 'Event' },
];

const ITEMS_PER_PAGE = 18;
const INITIAL_SHOW = 12;
const LOAD_MORE_COUNT = 3;

const ArticleCard = ({ article, submitting, onSubmit, navigate }) => {
  const status = statusConfig[article.status] || { color: 'default', text: article.status };
  const tags = parseTags(article.tags);
  const canEdit = article.status === 'changes_requested' || article.status === 'draft';

  return (
    <Col xs={24} sm={12} lg={8} key={article.id}>
      <Card
        hoverable
        className="cursor-pointer"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
        onClick={() => navigate(`/article-preview/${article.id}`)}
      >
          {article.banner_image ? (
            <div style={{ position: 'relative', lineHeight: 0 }}>
              <img src={`/uploads/${article.banner_image}`} alt={article.title}
                style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block', borderRadius: '8px 8px 0 0', background: '#f0f4ff' }} />
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.95)', borderRadius: 6,
                  padding: '3px 10px', fontSize: 12, fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                }}>
                  <Badge status={status.color} />
                  {status.text}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', lineHeight: 0 }}>
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', borderRadius: '8px 8px 0 0' }}>
                <FileTextOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
              </div>
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.95)', borderRadius: 6,
                  padding: '3px 10px', fontSize: 12, fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                }}>
                  <Badge status={status.color} />
                  {status.text}
                </span>
              </div>
            </div>
          )}

        <div style={{ padding: '14px 16px' }}>
          {/* Category & Type */}
          <div style={{ marginBottom: 8 }}>
            {article.category_name && <Tag color="blue" style={{ fontSize: 11 }}>{article.category_name}</Tag>}
            {article.content_type_name && <Tag color="purple" style={{ fontSize: 11 }}>{article.content_type_name}</Tag>}
          </div>

          {/* Title */}
          <div style={{
            fontWeight: 700, fontSize: 15, lineHeight: 1.4, marginBottom: 8, color: '#1a1a1a',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {article.title}
          </div>

          {/* Short Description */}
          {article.short_description && (
            <div style={{
              fontSize: 13, color: '#595959', lineHeight: 1.6, marginBottom: 10,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {article.short_description}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <TagOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
              {tags.slice(0, 3).map((tag, i) => (
                <Tag key={i} color="geekblue" style={{ fontSize: 11, margin: 0 }}>{tag}</Tag>
              ))}
              {tags.length > 3 && <Text style={{ fontSize: 11, color: '#8c8c8c' }}>+{tags.length - 3}</Text>}
            </div>
          )}

          {/* Admin feedback */}
          {article.status === 'changes_requested' && article.admin_comment && (
            <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '7px 10px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#d46b08', marginBottom: 2 }}>
                <EditOutlined style={{ marginRight: 4 }} />Admin Feedback
              </div>
              <div style={{ fontSize: 12, color: '#614700' }}>{article.admin_comment}</div>
            </div>
          )}
          {article.status === 'rejected' && article.admin_comment && (
            <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, padding: '7px 10px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#cf1322', marginBottom: 2 }}>
                <CloseCircleOutlined style={{ marginRight: 4 }} />Rejection Reason
              </div>
              <div style={{ fontSize: 12, color: '#820014' }}>{article.admin_comment}</div>
            </div>
          )}

          {/* Edit + Submit */}
          {canEdit && (
            <div style={{ marginBottom: 10 }} onClick={e => e.stopPropagation()}>
              <Space size={6}>
                <Button size="small" icon={<EditOutlined />}
                  onClick={(e) => { e.stopPropagation(); navigate(`/edit-content/${article.id}`); }}>
                  Edit
                </Button>
                <Button size="small" type="primary" icon={<SendOutlined />}
                  loading={submitting === article.id}
                  onClick={(e) => onSubmit(e, article.id)}>
                  Submit for Review
                </Button>
              </Space>
            </div>
          )}

          {/* Author & Date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar size={22} icon={<UserOutlined />} style={{ background: '#4a7cff' }} />
              <Text style={{ fontSize: 12, color: '#595959' }}>{article.first_name} {article.last_name}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{moment(article.created_at).format('MMM D, YYYY')}</Text>
            </div>
          </div>
        </div>
      </Card>
    </Col>
  );
};

const Dashboard = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);
  const navigate = useNavigate();

  useEffect(() => { 
    fetchContents(); 
  }, []);

  // Reset page and visible count when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(INITIAL_SHOW);
  }, [activeTab]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/content');
      setContents(res.data);
    } catch {
      console.error('Error fetching contents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (e, articleId) => {
    e.stopPropagation();
    setSubmitting(articleId);
    try {
      await axios.post(`/api/user/content/${articleId}/submit`);
      const item = contents.find(c => c.id === articleId);
      const typeName = item?.content_type_name || 'Content';
      message.success(`${typeName} submitted for review!`);
      fetchContents();
    } catch {
      message.error('Failed to submit for review');
    } finally {
      setSubmitting(null);
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, ITEMS_PER_PAGE));
  };

  const stats = {
    total: contents.length,
    draft: contents.filter(c => c.status === 'draft').length,
    pending: contents.filter(c => c.status === 'pending').length,
    published: contents.filter(c => c.status === 'published').length
  };

  // Filter by tab — match content_type_name case-insensitively
  const filteredContents = activeTab === 'all'
    ? contents
    : contents.filter(c => (c.content_type_name || '').toLowerCase() === activeTab);

  // Pagination
  const totalItems = filteredContents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const currentPageItems = filteredContents.slice(startIndex, endIndex);
  
  // Visible items for current page with "Show More" logic
  const visibleItems = currentPageItems.slice(0, visibleCount);
  const hasMoreInPage = visibleCount < currentPageItems.length;
  const hasNextPage = currentPage < totalPages;

  // Build tab items with count badges
  const tabItems = CONTENT_TABS.map(tab => {
    const count = tab.key === 'all'
      ? contents.length
      : contents.filter(c => (c.content_type_name || '').toLowerCase() === tab.key).length;
    return {
      key: tab.key,
      label: (
        <span>
          {tab.label}
          {count > 0 && (
            <span style={{
              marginLeft: 6, 
              background: activeTab === tab.key ? '#4a7cff' : '#f0f0f0',
              color: activeTab === tab.key ? '#fff' : '#595959',
              borderRadius: 10, 
              padding: '1px 7px', 
              fontSize: 11, 
              fontWeight: 600
            }}>
              {count}
            </span>
          )}
        </span>
      )
    };
  });

  // Reset visible count when changing pages
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setVisibleCount(INITIAL_SHOW);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<FormOutlined />} onClick={() => navigate('/my-submissions')}>
            My Submissions
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create-content')}>
            Create Content
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Total Content" value={stats.total} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Drafts" value={stats.draft} prefix={<FileTextOutlined />} styles={{ content: { color: '#8c8c8c' } }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Pending Review" value={stats.pending} prefix={<ClockCircleOutlined />} styles={{ content: { color: '#faad14' } }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Published" value={stats.published} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#52c41a' } }} /></Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 20 }}
      />

      {/* Content Grid */}
      {loading ? (
        <div className="py-12 text-center"><Spin size="large" /></div>
      ) : filteredContents.length === 0 ? (
        <Empty
          description={activeTab === 'all' ? 'No content yet' : `No ${CONTENT_TABS.find(t => t.key === activeTab)?.label.toLowerCase() || 'content'} yet`}
          className="py-12"
        >
          <Button type="primary" onClick={() => navigate('/create-content')}>
            Create Your First {activeTab === 'all' ? 'Content' : CONTENT_TABS.find(t => t.key === activeTab)?.label.slice(0, -1) || 'Content'}
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {visibleItems.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                submitting={submitting}
                onSubmit={handleSubmitForReview}
                navigate={navigate}
              />
            ))}
          </Row>
          
          {/* Show More / Pagination Controls */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            marginTop: 32,
            padding: '16px 0',
            gap: 16
          }}>
            {/* Show More Button - Only show if there are more items in current page */}
            {hasMoreInPage && (
              <Button
                type="primary"
                icon={<DownOutlined />}
                onClick={handleShowMore}
                style={{
                  borderRadius: 24,
                  padding: '8px 32px',
                  height: 'auto',
                  minWidth: 200
                }}
              >
                Show More ({visibleCount}/{currentPageItems.length})
              </Button>
            )}

            {/* Pagination - Show when there are multiple pages or after all items in current page are shown */}
            {totalPages > 1 && !hasMoreInPage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{ borderRadius: 8 }}
                >
                  Previous
                </Button>
                
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        type={currentPage === pageNum ? 'primary' : 'default'}
                        onClick={() => handlePageChange(pageNum)}
                        style={{ 
                          borderRadius: 8,
                          minWidth: 36,
                          ...(currentPage === pageNum ? {} : { border: '1px solid #d9d9d9' })
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{ borderRadius: 8 }}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Show total items info */}
            {totalItems > 0 && (
              <div style={{ 
                fontSize: 13, 
                color: '#8c8c8c',
                textAlign: 'center'
              }}>
                Showing {startIndex + 1}-{Math.min(startIndex + visibleCount, endIndex)} of {totalItems} items
                {currentPage < totalPages && ` (Page ${currentPage} of ${totalPages})`}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;