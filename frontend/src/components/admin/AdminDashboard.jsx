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
  const pageSize = 15;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData(currentPage);
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
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f8fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', minWidth: 260 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by title, author, type, status..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#1a1a2e', width: '100%', minWidth: 200 }}
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
                <thead className="bg-gray-50" style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200" style={{ display: 'block', maxHeight: '520px', overflowY: 'auto' }}>
                  {filteredContent.length === 0 ? (
                    <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        {searchQuery ? `No results found for "${searchQuery}"` : 'No content found'}
                      </td>
                    </tr>
                  ) : (
                    filteredContent.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors" style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
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
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            {record.status === 'pending' && (
                              <Button type="primary" size="small" icon={<EyeOutlined />}
                                onClick={() => navigate(`/admin/review/${record.id}`)}
                                className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600">
                                Review
                              </Button>
                            )}
                            {record.status === 'approved' && (
                              <Button type="primary" size="small" icon={<SendOutlined />}
                                loading={publishingId === record.id}
                                onClick={() => handleDirectPublish(record.id)}
                                className="bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600">
                                Publish
                              </Button>
                            )}
                            {record.status !== 'pending' && record.status !== 'approved' && (
                              <Button size="small" icon={<EyeOutlined />}
                                onClick={() => navigate(`/admin/review/${record.id}`)}>View</Button>
                            )}
                            <Popconfirm
                              title="Delete permanently?"
                              description="This cannot be undone."
                              onConfirm={() => handleDelete(record.id)}
                              okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
                            >
                              <Button danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-wrap gap-4">
                <span className="text-sm text-gray-500">
                  Showing {startIndex}-{endIndex} of {totalItems} submissions
                </span>
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
                  size="default"
                />
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
    </div>
  );
};

export default AdminDashboard;
