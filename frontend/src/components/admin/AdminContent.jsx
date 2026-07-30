import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Space, Tag, Badge, message, Popconfirm, Typography, Tabs, Empty, Spin, Avatar, Pagination, ConfigProvider } from 'antd';
import {
  EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  PlusOutlined, UserOutlined, CalendarOutlined, TagOutlined, FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const { Text } = Typography;

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
  { key: 'news',       label: 'News' },
  { key: 'article',    label: 'Articles' },
  { key: 'blog',       label: 'Blogs' },
  { key: 'whitepaper', label: 'Whitepaper' },
  { key: 'interview',  label: 'Interview' },
  { key: 'webinar',    label: 'Webinar' },
  { key: 'event',      label: 'Event' },
  { key: 'ebook',      label: 'eBooks' },
  { key: 'guide',      label: 'Guides' },
  { key: 'report',     label: 'Reports' },
  { key: 'case-study', label: 'Case Studies' },
];

const AdminContent = () => {
  const { darkMode } = useTheme();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCards, setVisibleCards] = useState(9);
  const pageSize = 15;
  const navigate = useNavigate();

  useEffect(() => { fetchContents(); }, [activeTab]);

  useEffect(() => {
    setVisibleCards(9);
  }, [currentPage]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') {
        params.content_type = activeTab;
      }
      const res = await axios.get('/api/admin/content/all', { params });
      setContents(res.data.data || []);
    } catch {
      message.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (e, contentId) => {
    e.stopPropagation();
    setSubmitting(contentId);
    try {
      await axios.post(`/api/admin/content/${contentId}/submit`);
      message.success('Content submitted for review!');
      fetchContents();
      navigate('/admin/dashboard');
    } catch {
      message.error('Failed to submit for review');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (contentId) => {
    try {
      await axios.delete(`/api/admin/content/${contentId}`);
      message.success('Deleted successfully');
      fetchContents();
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleShowMore = () => {
    setVisibleCards(prev => Math.min(prev + 3, pageSize));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredContents = activeTab === 'all'
    ? contents
    : contents.filter(c => (c.content_type_name || '').toLowerCase() === activeTab);

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
              borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600
            }}>
              {count}
            </span>
          )}
        </span>
      )
    };
  });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorText: darkMode ? '#cbd5e1' : '#374151',
          colorBorder: darkMode ? '#334155' : '#e5e7eb',
          colorBgElevated: darkMode ? '#1e293b' : '#fff',
          colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
        },
        components: {
          Tabs: {
            itemActiveColor: darkMode ? '#0AAEEF' : '#0AAEEF',
            itemSelectedColor: darkMode ? '#0AAEEF' : '#0AAEEF',
            inkBarColor: darkMode ? '#0AAEEF' : '#0AAEEF',
          },
        },
      }}
    >
      <div style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(18px, 2.2vw, 22px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#111827' }}>All Content</h2>
            <Text type="secondary" style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6b7280' }}>Manage all uploaded content</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/create-post')}>
            Create New
          </Button>
        </div>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 20, marginTop: 16 }} />

        {/* Grid */}
        {loading ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}><Spin size="large" /></div>
        ) : filteredContents.length === 0 ? (
          <Empty
            description={activeTab === 'all' ? 'No content yet' : `No ${activeTab}s yet`}
            style={{ padding: '64px 0' }}
          />
        ) : (
          <>
            <Row gutter={[20, 20]}>
              {filteredContents.slice(0, visibleCards).map(item => {
              const status = statusConfig[item.status] || { color: 'default', text: item.status };
              const tags = parseTags(item.tags);
              const canEdit = item.status === 'draft' || item.status === 'changes_requested';

              return (
                <Col xs={24} sm={12} lg={8} key={item.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, cursor: 'pointer', background: darkMode ? '#1e293b' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb' }}
                    styles={{ body: { padding: 0 } }}
                    className="h-full"
                    onClick={() => navigate(`/article-preview/${item.id}`)}
                  >
                    {/* Banner Image */}
                    {item.banner_image ? (
                      <div style={{ position: 'relative', lineHeight: 0 }}>
                        <img src={`/uploads/${item.banner_image}`} alt={item.title}
                          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', borderRadius: '8px 8px 0 0' }} />
                        <div style={{ position: 'absolute', top: 8, left: 8 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255,255,255,0.95)', borderRadius: 6,
                            padding: '3px 9px', fontSize: 11, fontWeight: 500,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)', color: darkMode ? '#f1f5f9' : '#111827'
                          }}>
                            <Badge status={status.color} />
                            {status.text}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', lineHeight: 0 }}>
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#0f172a' : 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', borderRadius: '8px 8px 0 0' }}>
                          <FileTextOutlined style={{ fontSize: 40, color: darkMode ? '#475569' : '#bfbfbf' }} />
                        </div>
                        <div style={{ position: 'absolute', top: 8, left: 8 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255,255,255,0.95)', borderRadius: 6,
                            padding: '3px 9px', fontSize: 11, fontWeight: 500,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)', color: darkMode ? '#f1f5f9' : '#111827'
                          }}>
                            <Badge status={status.color} />
                            {status.text}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div style={{ padding: '12px 14px' }}>
                      {/* Type & Category */}
                      <div style={{ marginBottom: 7, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.content_type_name && <Tag color="purple" style={{ fontSize: 11 }}>{item.content_type_name}</Tag>}
                        {item.category_name && <Tag color="blue" style={{ fontSize: 11 }}>{item.category_name}</Tag>}
                      </div>

                      {/* Title */}
                      <div style={{
                        fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 6, color: darkMode ? '#f1f5f9' : '#1a1a1a',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {item.title}
                      </div>

                      {/* Short Description */}
                      {item.short_description && (
                        <div style={{
                          fontSize: 12, color: darkMode ? '#94a3b8' : '#595959', lineHeight: 1.6, marginBottom: 8,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {item.short_description}
                        </div>
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                          <TagOutlined style={{ fontSize: 11, color: darkMode ? '#64748b' : '#8c8c8c' }} />
                          {tags.slice(0, 3).map((tag, i) => (
                            <Tag key={i} color="geekblue" style={{ fontSize: 11, margin: 0 }}>{tag}</Tag>
                          ))}
                          {tags.length > 3 && <Text style={{ fontSize: 11, color: darkMode ? '#64748b' : '#8c8c8c' }}>+{tags.length - 3}</Text>}
                        </div>
                      )}

                      {/* Admin feedback */}
                      {item.status === 'changes_requested' && item.admin_comment && (
                        <div style={{ background: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fff7e6', border: darkMode ? '1px solid #f59e0b' : '1px solid #ffd591', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#f59e0b' : '#d46b08', marginBottom: 2 }}>
                            <EditOutlined style={{ marginRight: 4 }} />Admin Feedback
                          </div>
                          <div style={{ fontSize: 11, color: darkMode ? '#cbd5e1' : '#614700' }}>{item.admin_comment}</div>
                        </div>
                      )}
                      {item.status === 'rejected' && item.admin_comment && (
                        <div style={{ background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff2f0', border: darkMode ? '1px solid #ef4444' : '1px solid #ffccc7', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#ef4444' : '#cf1322', marginBottom: 2 }}>
                            <CloseCircleOutlined style={{ marginRight: 4 }} />Rejection Reason
                          </div>
                          <div style={{ fontSize: 11, color: darkMode ? '#cbd5e1' : '#820014' }}>{item.admin_comment}</div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ marginBottom: 8 }} onClick={e => e.stopPropagation()}>
                        <Space size={4} wrap>
                          <Button size="small" icon={<EyeOutlined />}
                            onClick={(e) => { e.stopPropagation(); navigate(`/article-preview/${item.id}`); }}>
                            View
                          </Button>
                          {canEdit && (
                            <>
                              <Button size="small" icon={<EditOutlined />}
                                onClick={(e) => { e.stopPropagation(); navigate(`/edit-content/${item.id}`); }}>
                                Edit
                              </Button>
                              <Button size="small" type="primary" icon={<SendOutlined />}
                                loading={submitting === item.id}
                                onClick={(e) => handleSubmitForReview(e, item.id)}>
                                Submit
                              </Button>
                            </>
                          )}
                          {item.status === 'pending' && (
                            <Button size="small" disabled icon={<ClockCircleOutlined />}>Under Review</Button>
                          )}
                          <Popconfirm
                            title="Delete this content?"
                            onConfirm={(e) => { handleDelete(item.id); }}
                            okText="Yes" cancelText="No"
                          >
                            <Button 
                              size="small" 
                              danger 
                              icon={<DeleteOutlined />}
                              disabled={item.status === 'published'}
                              onClick={e => e.stopPropagation()}
                              style={{ color: darkMode ? '#ef4444' : undefined }}
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', paddingTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Avatar size={20} icon={<UserOutlined />} style={{ background: '#4a7cff' }} />
                          <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#595959' }}>{item.first_name} {item.last_name}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarOutlined style={{ fontSize: 10, color: darkMode ? '#64748b' : '#8c8c8c' }} />
                          <Text style={{ fontSize: 11, color: darkMode ? '#64748b' : '#8c8c8c' }}>{moment(item.created_at).format('MMM D, YYYY')}</Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
          <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            {visibleCards < pageSize && visibleCards < filteredContents.length && (
              <Button
                type="default"
                onClick={handleShowMore}
                style={{ borderRadius: 8 }}
              >
                Show More ({pageSize - visibleCards} more)
              </Button>
            )}
            {visibleCards >= pageSize && (
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredContents.length}
                showSizeChanger={false}
                showTotal={(total) => `${total} items`}
                onChange={handlePageChange}
              />
            )}
          </div>
          </>
        )}
      </div>
      <style>{`
        /* Hide scrollbar for all scrollable elements */
        *::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .ant-tabs-content,
        .ant-tabs-content-holder,
        .ant-card-body,
        .ant-row,
        .ant-col,
        .ant-space,
        .ant-space-item {
          overflow: visible !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .ant-tabs-content::-webkit-scrollbar,
        .ant-tabs-content-holder::-webkit-scrollbar,
        .ant-card-body::-webkit-scrollbar,
        .ant-row::-webkit-scrollbar,
        .ant-col::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default AdminContent;
