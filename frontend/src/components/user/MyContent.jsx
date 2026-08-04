import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Space, Tag, Badge, message, Popconfirm, Typography, Tabs, Empty, Spin, Avatar, Pagination, Grid, ConfigProvider, theme } from 'antd';
import {
  EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  PlusOutlined, UserOutlined, CalendarOutlined, TagOutlined, FileTextOutlined,
  DownOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
};

const statusConfig = {
  draft:             { color: 'default',    text: 'Draft' },
  pending:           { color: 'processing', text: 'Pending Review' },
  approved:          { color: 'success',    text: 'Approved' },
  published:         { color: 'success',    text: 'Published' },
  rejected:          { color: 'error',      text: 'Rejected' },
  changes_requested: { color: 'warning',    text: 'Changes Requested' }
};

const CONTENT_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'article',    label: 'Articles' },
  { key: 'news',       label: 'News' },
  { key: 'blog',       label: 'Blogs' },
  { key: 'whitepaper', label: 'Whitepaper' },
  { key: 'interview',  label: 'Interview' },
  { key: 'webinar',    label: 'Webinar' },
  { key: 'event',      label: 'Event' },
];

const ITEMS_PER_PAGE = 24;
const INITIAL_SHOW = 16;
const LOAD_MORE_COUNT = 4;

const MyContent = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;
  
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);

  useEffect(() => {
    // Determine status filter based on route
    const path = location.pathname;
    if (path.includes('/drafts')) {
      setStatusFilter('draft');
    } else {
      setStatusFilter('published');
    }
  }, [location.pathname]);

  useEffect(() => { fetchContents(); }, [statusFilter]);

  useEffect(() => {
    setVisibleCount(INITIAL_SHOW);
  }, [currentPage, activeTab]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await axios.get('/api/user/content', { params });
      setContents(res.data || []);
    } catch {
      message.error('Failed to load your content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (e, contentId) => {
    e.stopPropagation();
    setSubmitting(contentId);
    try {
      await axios.post(`/api/user/content/${contentId}/submit`);
      const item = contents.find(c => c.id === contentId);
      const typeName = item?.content_type_name || 'Content';
      message.success(`${typeName} submitted for review!`);
      fetchContents();
    } catch {
      message.error('Failed to submit for review');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (contentId) => {
    try {
      await axios.delete(`/api/user/content/${contentId}`);
      message.success('Deleted successfully');
      fetchContents();
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, ITEMS_PER_PAGE));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setVisibleCount(INITIAL_SHOW);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredContents = activeTab === 'all'
    ? contents
    : contents.filter(c => (c.content_type_name || '').toLowerCase() === activeTab);

  const totalItems = filteredContents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const currentPageItems = filteredContents.slice(startIndex, endIndex);
  const visibleItems = currentPageItems.slice(0, visibleCount);
  const hasMoreInPage = visibleCount < currentPageItems.length;

  const tabItems = CONTENT_TABS.map(tab => {
    const count = tab.key === 'all'
      ? contents.length
      : contents.filter(c => (c.content_type_name || '').toLowerCase() === tab.key).length;
    return {
      key: tab.key,
      label: (
        <span style={{ fontSize: isMobile ? 12 : 14 }}>
          {isMobile ? tab.label.slice(0, 4) : tab.label}
          {count > 0 && (
            <span style={{
              marginLeft: 6,
              background: activeTab === tab.key ? '#4a7cff' : (darkMode ? '#334155' : '#f0f0f0'),
              color: activeTab === tab.key ? '#fff' : (darkMode ? '#94a3b8' : '#595959'),
              borderRadius: 10, 
              padding: isMobile ? '1px 5px' : '1px 7px', 
              fontSize: isMobile ? 10 : 11, 
              fontWeight: 600
            }}>
              {count}
            </span>
          )}
        </span>
      )
    };
  });

  const ArticleCard = ({ article, darkMode }) => {
    const status = statusConfig[article.status] || { color: 'default', text: article.status };
    const tags = parseTags(article.tags);
    const canEdit = article.status === 'draft' || article.status === 'changes_requested';
    const displayTags = tags.slice(0, 4);
    const hasMoreTags = tags.length > 4;

    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={article.id}>
        <Card
          hoverable
          style={{ 
            borderRadius: 12, 
            height: '100%',
            border: darkMode ? '1px solid #334155' : '1px solid #f0f0f0',
            boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: darkMode ? '#1e293b' : '#fff'
          }}
          bodyStyle={{ 
            padding: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => navigate(`/${article.content_type || 'article'}-preview/${article.id}`)}
        >
          {/* Banner Image */}
          <div style={{ position: 'relative', lineHeight: 0, flexShrink: 0, overflow: 'hidden' }}>
            {article.banner_image ? (
              <img
                src={`/uploads/${article.banner_image}`}
                alt={article.title}
                style={{
                  width: '100%',
                  height: isMobile ? 160 : 180,
                  objectFit: 'cover',
                  display: 'block',
                  background: darkMode ? '#1e293b' : '#f0f4ff',
                  transform: 'scale(0.95)',
                  transition: 'transform .3s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(0.95)'}
              />
            ) : (
              <div style={{
                height: isMobile ? 160 : 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: darkMode ? 'linear-gradient(135deg,#1e293b,#0f172a)' : 'linear-gradient(135deg,#e0e9ff,#f0f4ff)'
              }}>
                <FileTextOutlined style={{ fontSize: 40, color: darkMode ? '#64748b' : '#bfbfbf' }} />
              </div>
            )}
            <div style={{ 
              position: 'absolute', 
              top: 12, 
              left: 12,
              background: darkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
              padding: '4px 12px',
              borderRadius: 6,
              boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Badge status={status.color} />
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 500, color: darkMode ? '#e2e8f0' : '#1a1a1a' }}>{status.text}</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ 
            padding: isMobile ? '12px 14px' : '14px 16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Category & Type */}
            <div style={{ marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {article.category_name && (
                <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                  {article.category_name}
                </Tag>
              )}
              {article.content_type_name && (
                <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>
                  {article.content_type_name}
                </Tag>
              )}
            </div>

            {/* Title - 2 lines max */}
            <div style={{
              fontWeight: 700, 
              fontSize: isMobile ? 14 : 15, 
              lineHeight: 1.4, 
              marginBottom: 6, 
              color: darkMode ? '#f1f5f9' : '#1a1a1a',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: isMobile ? 40 : 42
            }}>
              {article.title}
            </div>

            {/* Short Description - 3 lines max */}
            {article.short_description && (
              <div style={{
                fontSize: 12, 
                color: darkMode ? '#94a3b8' : '#595959', 
                lineHeight: 1.6, 
                marginBottom: 8,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: 58
              }}>
                {article.short_description}
              </div>
            )}

            {/* Tags - Max 4 tags */}
            {displayTags.length > 0 && (
              <div style={{ 
                marginBottom: 8, 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 4, 
                alignItems: 'center',
                minHeight: 26
              }}>
                <TagOutlined style={{ fontSize: 11, color: darkMode ? '#64748b' : '#8c8c8c' }} />
                {displayTags.map((tag, i) => (
                  <Tag key={i} color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                    {tag.length > 15 ? tag.substring(0, 15) + '...' : tag}
                  </Tag>
                ))}
                {hasMoreTags && (
                  <Text style={{ fontSize: 11, color: darkMode ? '#64748b' : '#8c8c8c' }}>+{tags.length - 4}</Text>
                )}
              </div>
            )}

            {/* Admin feedback - Only show if present */}
            {article.status === 'changes_requested' && article.admin_comment && (
              <div style={{ background: darkMode ? '#451a03' : '#fff7e6', border: darkMode ? '1px solid #8c4b0a' : '1px solid #ffd591', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: darkMode ? '#fbbf24' : '#d46b08', marginBottom: 2 }}>
                  <EditOutlined style={{ marginRight: 4 }} />Feedback
                </div>
                <div style={{ fontSize: 11, color: darkMode ? '#fef3c7' : '#614700', 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.admin_comment}
                </div>
              </div>
            )}
            {article.status === 'rejected' && article.admin_comment && (
              <div style={{ background: darkMode ? '#450a0a' : '#fff2f0', border: darkMode ? '1px solid #7f1d1d' : '1px solid #ffccc7', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: darkMode ? '#f87171' : '#cf1322', marginBottom: 2 }}>
                  <CloseCircleOutlined style={{ marginRight: 4 }} />Rejected
                </div>
                <div style={{ fontSize: 11, color: darkMode ? '#fecaca' : '#820014',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.admin_comment}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginBottom: 8 }} onClick={e => e.stopPropagation()}>
              <Space size={isMobile ? 4 : 6} wrap>
                <Button 
                  size="small" 
                  icon={<EyeOutlined />}
                  onClick={(e) => { e.stopPropagation(); navigate(`/${article.content_type || 'article'}-preview/${article.id}`); }}
                  style={{ fontSize: isMobile ? 11 : 12 }}
                >
                  {!isMobile && 'View'}
                </Button>
                {canEdit && (
                  <>
                    <Button 
                      size="small" 
                      icon={<EditOutlined />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/edit-content/${article.id}`); }}
                      style={{ fontSize: isMobile ? 11 : 12 }}
                    >
                      {!isMobile && 'Edit'}
                    </Button>
                    <Button 
                      size="small" 
                      type="primary" 
                      icon={<SendOutlined />}
                      loading={submitting === article.id}
                      onClick={(e) => handleSubmitForReview(e, article.id)}
                      style={{ fontSize: isMobile ? 11 : 12 }}
                    >
                      {!isMobile && 'Submit'}
                    </Button>
                  </>
                )}
                {article.status === 'pending' && (
                  <Button 
                    size="small" 
                    disabled 
                    icon={<ClockCircleOutlined />}
                    style={{ fontSize: isMobile ? 11 : 12 }}
                  >
                    {!isMobile && 'Under Review'}
                  </Button>
                )}
                <Popconfirm
                  title="Delete this content?"
                  onConfirm={(e) => { handleDelete(article.id); }}
                  okText="Yes" 
                  cancelText="No"
                >
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    disabled={article.status === 'published'}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: isMobile ? 11 : 12 }}
                  >
                    {!isMobile && 'Delete'}
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            {/* Author & Date - Always at bottom */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', 
              paddingTop: 8,
              marginTop: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                <Avatar 
                  size={20} 
                  icon={<UserOutlined />} 
                  style={{ background: '#4a7cff', flexShrink: 0 }} 
                />
                <Text style={{ 
                  fontSize: 11, 
                  color: darkMode ? '#94a3b8' : '#595959',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {article.first_name} {article.last_name}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <CalendarOutlined style={{ fontSize: 10, color: darkMode ? '#64748b' : '#8c8c8c' }} />
                <Text style={{ fontSize: 11, color: darkMode ? '#64748b' : '#8c8c8c' }}>
                  {moment(article.created_at).format('MMM D, YYYY')}
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: darkMode ? '#1a1a1a' : '#ffffff',
          colorBorder: darkMode ? '#334155' : '#E5E7EB',
          colorText: darkMode ? '#e2e8f0' : '#1a1a1a',
          colorTextSecondary: darkMode ? '#94a3b8' : '#6B7280',
        },
      }}
    >
      <div style={{ 
        padding: isMobile ? '12px' : isTablet ? '16px' : '24px',
        width: '100%',
        background: darkMode ? '#0f172a' : '#F8FAFC',
        minHeight: '100vh'
      }}>
      {/* Header */}
      <div style={{ 
        marginBottom: isMobile ? '16px' : '24px', 
        display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
            fontWeight: 700,
            color: darkMode ? '#f1f5f9' : '#111827'
          }}>
            My Content
          </h2>
          <Text type="secondary" style={{ fontSize: isMobile ? 13 : 15 }}>
            Manage all your published and draft content
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/create-content')}
          size="small"
          style={{
            flex: isMobile ? 1 : 'none',
            borderRadius: 6,
            width: isMobile ? '100%' : 'auto',
            fontSize: 13,
            height: 32,
            padding: '4px 12px',
            minWidth: 'auto'
          }}
        >
          {isMobile ? 'Create' : 'Create New'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems} 
        style={{ marginBottom: isMobile ? 16 : 20 }}
        className="my-content-tabs"
        size={isMobile ? 'small' : 'middle'}
        tabBarStyle={{ 
          overflowX: isMobile ? 'auto' : 'visible',
          whiteSpace: isMobile ? 'nowrap' : 'normal'
        }}
      />

      {/* Grid */}
      {loading ? (
        <div style={{ padding: isMobile ? '40px 0' : '48px 0', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : filteredContents.length === 0 ? (
        <Empty
          description={activeTab === 'all' ? 'No content yet' : `No ${activeTab}s yet`}
          style={{ padding: isMobile ? '40px 0' : '48px 0' }}
        >
          <Button type="primary" onClick={() => navigate('/create-content')} size="small" style={{ borderRadius: 6, fontSize: 13, height: 32, padding: '4px 12px', minWidth: 'auto' }}>
            Create Now
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            {visibleItems.map(article => (
              <ArticleCard key={article.id} article={article} darkMode={darkMode} />
            ))}
          </Row>

          {/* Show More / Pagination */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            marginTop: isMobile ? 20 : 32,
            padding: isMobile ? '12px 0' : '16px 0',
            gap: isMobile ? 12 : 16
          }}>
            {hasMoreInPage && (
              <Button
                type="primary"
                icon={<DownOutlined />}
                onClick={handleShowMore}
                style={{
                  borderRadius: 24,
                  padding: isMobile ? '6px 16px' : '8px 32px',
                  height: 'auto',
                  minWidth: isMobile ? '140px' : '200px',
                  fontSize: isMobile ? 13 : 14,
                  background: '#4a7cff',
                  borderColor: '#4a7cff'
                }}
              >
                Show More ({visibleCount}/{ITEMS_PER_PAGE})
              </Button>
            )}

            {totalPages > 1 && !hasMoreInPage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: isMobile ? 8 : 16,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  size={isMobile ? 'small' : 'middle'}
                  style={{ borderRadius: 8 }}
                >
                  Previous
                </Button>
                
                <div style={{ display: 'flex', gap: isMobile ? 4 : 6 }}>
                  {Array.from({ length: Math.min(totalPages, isMobile ? 3 : 5) }, (_, i) => {
                    let pageNum;
                    const maxVisible = isMobile ? 3 : 5;
                    if (totalPages <= maxVisible) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - maxVisible + 1 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          type={currentPage === pageNum ? 'primary' : 'default'}
                          onClick={() => handlePageChange(pageNum)}
                          size={isMobile ? 'small' : 'middle'}
                          style={{ 
                            borderRadius: 8,
                            minWidth: isMobile ? 28 : 36
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  size={isMobile ? 'small' : 'middle'}
                  style={{ borderRadius: 8 }}
                >
                  Next
                </Button>
              </div>
            )}

            {totalItems > 0 && (
              <div style={{ 
                fontSize: isMobile ? 11 : 13, 
                color: darkMode ? '#64748b' : '#8c8c8c',
                textAlign: 'center'
              }}>
                Showing {startIndex + 1}-{Math.min(startIndex + visibleCount, endIndex)} of {totalItems} items
                {currentPage < totalPages && ` (Page ${currentPage} of ${totalPages})`}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .my-content-tabs .ant-tabs-nav {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          white-space: nowrap !important;
          -webkit-overflow-scrolling: touch;
        }
        
        .my-content-tabs .ant-tabs-nav::-webkit-scrollbar {
          height: 4px;
        }
        
        .my-content-tabs .ant-tabs-nav::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .my-content-tabs .ant-tabs-nav::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        
        .my-content-tabs .ant-tabs-tab {
          flex-shrink: 0 !important;
        }

        @media (max-width: 768px) {
          .my-content-tabs .ant-tabs-tab {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
        }

        @media (min-width: 1200px) {
          .ant-row > .ant-col {
            flex: 0 0 25% !important;
            max-width: 25% !important;
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .ant-row > .ant-col {
            flex: 0 0 33.33% !important;
            max-width: 33.33% !important;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .ant-row > .ant-col {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }

        @media (max-width: 767px) {
          .ant-row > .ant-col {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
        }

        .ant-card-hoverable:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
        }
      `}</style>
      </div>
    </ConfigProvider>
  );
};

export default MyContent;