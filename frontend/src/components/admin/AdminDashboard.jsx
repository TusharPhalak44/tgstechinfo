import React, { useState, useEffect } from 'react';
import { Button, Tag, message, Popconfirm, Pagination, Tabs, Card, Row, Col, Statistic, Space, Badge } from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  EyeOutlined,
  DeleteOutlined,
  SafetyOutlined,
  TeamOutlined,
  LockOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
  AlertOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RBACManagement from './RBACManagement';
import SecurityDashboard from '../user/SecurityDashboard';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ 
    totalContent: 0, 
    pendingReview: 0, 
    published: 0, 
    totalUsers: 0 
  });
  const [allContent, setAllContent] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [visibleCards, setVisibleCards] = useState(9);
  const pageSize = 15;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setVisibleCards(9);
  }, [currentPage]);

  const fetchDashboardData = async (page = 1) => {
    setLoading(true);
    try {
      const [statsRes, contentRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/content/pending', { params: { page, limit: pageSize } })
      ]);
      setStats(statsRes.data);
      const res = contentRes.data;
      setAllContent(res?.data || []);
      setTotalItems(res?.total ?? 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPublish = async (id) => {
    setPublishingId(id);
    try {
      await axios.put(`/api/admin/content/${id}/review`, { action: 'publish', comment: '' });
      message.success('Content published successfully');
      fetchDashboardData(currentPage);
    } catch {
      message.error('Failed to publish content');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/content/${id}`);
      message.success('Content deleted successfully');
      const newTotal = totalItems - 1;
      const maxPage = Math.ceil(newTotal / pageSize) || 1;
      const goToPage = currentPage > maxPage ? maxPage : currentPage;
      if (goToPage !== currentPage) setCurrentPage(goToPage);
      else fetchDashboardData(currentPage);
    } catch {
      message.error('Failed to delete content');
    }
  };

  const handleShowMore = () => {
    setVisibleCards(prev => Math.min(prev + 3, pageSize));
  };

  const statusTagMap = {
    pending:           { color: 'orange', text: 'Pending Review' },
    approved:          { color: 'green',  text: 'Approved' },
    published:         { color: 'blue',   text: 'Published' },
    rejected:          { color: 'red',    text: 'Rejected' },
    changes_requested: { color: 'gold',   text: 'Changes Requested' },
    draft:             { color: 'default', text: 'Draft' }
  };

  const StatCard = ({ title, value, icon, color = 'primary', valueColor }) => {
    const colorMap = {
      primary: 'text-primary-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      danger: 'text-red-500',
      info: 'text-blue-500'
    };
    return (
      <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-200 hover:shadow-medium transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${valueColor || 'text-gray-900'}`}>{value}</p>
          </div>
          <div className={`text-3xl ${colorMap[color]}`}>{icon}</div>
        </div>
      </div>
    );
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const filteredContent = searchQuery.trim()
    ? allContent.filter(r => {
        const q = searchQuery.toLowerCase();
        return (
          (r.title || '').toLowerCase().includes(q) ||
          (`${r.first_name || ''} ${r.last_name || ''}`).toLowerCase().includes(q) ||
          (r.content_type_name || '').toLowerCase().includes(q) ||
          (statusTagMap[r.status]?.text || r.status || '').toLowerCase().includes(q)
        );
      })
    : allContent;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-soft p-6 border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-soft border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="p-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" style={{ padding: window.innerWidth < 768 ? 0 : 'clamp(16px, 2vw, 24px)' }}>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', marginBottom: 'clamp(16px, 2vw, 24px)', padding: window.innerWidth < 768 ? '16px' : 0 }}>Admin Dashboard</h1>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="admin-dashboard-tabs">
        <Tabs.TabPane tab={<span><DashboardOutlined /> Content Management</span>} key="content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Content" value={stats.totalContent} icon={<FileTextOutlined />} color="primary" />
            <StatCard title="Pending Review" value={stats.pendingReview} icon={<ClockCircleOutlined />} color="warning" valueColor="text-yellow-500" />
            <StatCard title="Published" value={stats.published} icon={<CheckCircleOutlined />} color="success" valueColor="text-green-500" />
            <StatCard title="Total Users" value={stats.totalUsers} icon={<UserOutlined />} color="primary" />
          </div>

          <div className="bg-white rounded-lg shadow-soft border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Content Submissions</h2>
                  <span className="text-sm text-gray-500">Total: {stats.totalContent} submissions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f8fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 'clamp(6px, 1vw, 12px)', minWidth: window.innerWidth < 768 ? 'auto' : 260, flex: window.innerWidth < 768 ? 1 : 'auto' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by title, author, type, status..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 'clamp(12px, 0.9vw, 13px)', color: '#1a1a2e', width: '100%', minWidth: window.innerWidth < 768 ? 120 : 200 }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  )}
                </div>
              </div>
              {searchQuery && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Showing <strong style={{ color: '#1a1a2e' }}>{filteredContent.length}</strong> result{filteredContent.length !== 1 ? 's' : ''} for "<strong style={{ color: '#4a7cff' }}>{searchQuery}</strong>"
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" style={{ display: 'block' }}>
                <thead className="bg-gray-50" style={{ display: window.innerWidth < 768 ? 'none' : 'table-header-group' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200" style={{ display: window.innerWidth < 768 ? 'block' : 'table-row-group', maxHeight: window.innerWidth < 768 ? 'none' : '520px', overflowY: window.innerWidth < 768 ? 'visible' : 'auto' }}>
                  {filteredContent.length === 0 ? (
                    <tr style={{ display: window.innerWidth < 768 ? 'block' : 'table-row' }}>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500" style={{ display: 'block', textAlign: 'center', padding: '32px 16px' }}>
                        {searchQuery ? `No results found for "${searchQuery}"` : 'No content found'}
                      </td>
                    </tr>
                  ) : (
                    filteredContent.slice(0, visibleCards).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors" style={{ display: window.innerWidth < 768 ? 'block' : 'table-row', marginBottom: window.innerWidth < 768 ? 16 : 0, border: window.innerWidth < 768 ? '1px solid #e5e7eb' : 'none', borderRadius: window.innerWidth < 768 ? 8 : 0, padding: window.innerWidth < 768 ? 12 : 0, background: window.innerWidth < 768 ? '#fff' : 'transparent' }}>
                        {window.innerWidth >= 768 ? (
                          <>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {record.banner_image && (
                                  <img
                                    src={`/uploads/${record.banner_image}`}
                                    alt=""
                                    style={{ width: 48, height: 36, objectFit: 'contain', borderRadius: 4, flexShrink: 0, border: '1px solid #e5e7eb', background: '#f0f4ff' }}
                                  />
                                )}
                                <span
                                  className="text-primary-500 cursor-pointer hover:text-primary-600 transition-colors"
                                  onClick={() => navigate(`/admin/review/${record.id}`)}
                                >
                                  {record.title}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.first_name} {record.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Tag color="blue">{record.content_type_name}</Tag>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Tag color={statusTagMap[record.status]?.color || 'default'}>
                                {statusTagMap[record.status]?.text || record.status}
                              </Tag>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
                                {record.status === 'pending' && (
                                  <Button type="primary" size="small" icon={<EyeOutlined />}
                                    onClick={() => navigate(`/admin/review/${record.id}`)}
                                    className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
                                    style={{ minWidth: 80 }}>
                                    Review
                                  </Button>
                                )}
                                {record.status === 'approved' && (
                                  <Button type="primary" size="small" icon={<SendOutlined />}
                                    loading={publishingId === record.id}
                                    onClick={() => handleDirectPublish(record.id)}
                                    className="bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
                                    style={{ minWidth: 80 }}>
                                    Publish
                                  </Button>
                                )}
                                {record.status !== 'pending' && record.status !== 'approved' && (
                                  <Button size="small" icon={<EyeOutlined />}
                                    onClick={() => navigate(`/admin/review/${record.id}`)}
                                    style={{ minWidth: 60 }}>View</Button>
                                )}
                                <Popconfirm
                                  title="Delete permanently?"
                                  description="This cannot be undone."
                                  onConfirm={() => handleDelete(record.id)}
                                  okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
                                >
                                  <Button danger size="small" icon={<DeleteOutlined />} style={{ minWidth: 40 }} />
                                </Popconfirm>
                              </div>
                            </td>
                          </>
                        ) : (
                          <td style={{ display: 'block', padding: 0 }}>
                            <div style={{ marginBottom: 12 }}>
                              {record.banner_image && (
                                <img
                                  src={`/uploads/${record.banner_image}`}
                                  alt=""
                                  style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8, marginBottom: 8, border: '1px solid #e5e7eb', background: '#f0f4ff' }}
                                />
                              )}
                              <span
                                className="text-primary-500 cursor-pointer hover:text-primary-600 transition-colors"
                                onClick={() => navigate(`/admin/review/${record.id}`)}
                                style={{ fontSize: 15, fontWeight: 600, display: 'block', marginBottom: 8 }}
                              >
                                {record.title}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                              <div>
                                <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Author</span>
                                <div style={{ fontSize: 13, color: '#1a1a2e' }}>{record.first_name} {record.last_name}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
                                <div style={{ marginTop: 4 }}><Tag color="blue" style={{ fontSize: 12 }}>{record.content_type_name}</Tag></div>
                              </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                              <div style={{ marginTop: 4 }}>
                                <Tag color={statusTagMap[record.status]?.color || 'default'} style={{ fontSize: 12 }}>
                                  {statusTagMap[record.status]?.text || record.status}
                                </Tag>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                              {record.status === 'pending' && (
                                <Button type="primary" size="small" icon={<EyeOutlined />}
                                  onClick={() => navigate(`/admin/review/${record.id}`)}
                                  className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
                                  style={{ minWidth: 80, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto' }}>
                                  Review
                                </Button>
                              )}
                              {record.status === 'approved' && (
                                <Button type="primary" size="small" icon={<SendOutlined />}
                                  loading={publishingId === record.id}
                                  onClick={() => handleDirectPublish(record.id)}
                                  className="bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
                                  style={{ minWidth: 80, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto' }}>
                                  Publish
                                </Button>
                              )}
                              {record.status !== 'pending' && record.status !== 'approved' && (
                                <Button size="small" icon={<EyeOutlined />}
                                  onClick={() => navigate(`/admin/review/${record.id}`)}
                                  style={{ minWidth: 60, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto' }}>View</Button>
                              )}
                              <Popconfirm
                                title="Delete permanently?"
                                description="This cannot be undone."
                                onConfirm={() => handleDelete(record.id)}
                                okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
                              >
                                <Button danger size="small" icon={<DeleteOutlined />} style={{ minWidth: 40, flex: window.innerWidth < 768 ? '1 1 auto' : 'auto' }} />
                              </Popconfirm>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-wrap gap-4" style={{ padding: 'clamp(12px, 2vw, 24px)', flexDirection: window.innerWidth < 768 ? 'column' : 'row', alignItems: window.innerWidth < 768 ? 'stretch' : 'center' }}>
                <span className="text-sm text-gray-500" style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', textAlign: window.innerWidth < 768 ? 'center' : 'left' }}>
                  Showing {startIndex}-{endIndex} of {totalItems} submissions
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: window.innerWidth < 768 ? 'center' : 'flex-end', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
                  {visibleCards < pageSize && visibleCards < filteredContent.length && (
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
                      total={totalItems}
                      pageSize={pageSize}
                      onChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      showSizeChanger={false}
                      showQuickJumper={totalItems > 100}
                      size={window.innerWidth < 768 ? 'small' : 'default'}
                      style={{ width: window.innerWidth < 768 ? '100%' : 'auto', display: 'flex', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><SafetyOutlined /> Security Overview</span>} key="security">
          <SecurityDashboard />
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><TeamOutlined /> RBAC Management</span>} key="rbac">
          <RBACManagement />
        </Tabs.TabPane>
      </Tabs>
      <style>{`
        @media (max-width: 768px) {
          .admin-dashboard-tabs .ant-tabs-nav {
            overflow-x: auto !important;
            white-space: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .admin-dashboard-tabs .ant-tabs-nav::-webkit-scrollbar {
            display: none;
          }
          .admin-dashboard-tabs .ant-tabs-tab {
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
