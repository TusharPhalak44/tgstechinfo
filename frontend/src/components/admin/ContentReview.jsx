import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Tag, 
  Space, 
  Typography, 
  message, 
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Avatar,
  Tooltip,
  Popconfirm,
  Segmented,
  ConfigProvider,
  Switch,
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  EditOutlined, 
  EyeOutlined, 
  SendOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeInvisibleOutlined,
  CheckSquareOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const reviewStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .rev-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: revFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes revFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .rev-stagger-1 { animation: revSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .rev-stagger-2 { animation: revSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .rev-stagger-3 { animation: revSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes revSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .rev-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    position: relative;
    display: inline-block;
  }
  .rev-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #10B981;
    animation: revPulse 2s ease-out infinite;
  }
  @keyframes revPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .rev-kpi-card {
    border-radius: 16px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .rev-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const ContentReview = () => {
  const { id: reviewId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const D = darkMode;

  const [contents, setContents] = useState([]);
  const [allContents, setAllContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [publishingId, setPublishingId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [togglingVisibility, setTogglingVisibility] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
    fetchContents();
  }, [activeTab, filterStatus]);

  useEffect(() => {
    fetchContents();
  }, [currentPage, pageSize]);

  useEffect(() => {
    let filtered = [...allContents];
    if (searchText && searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.first_name && item.first_name.toLowerCase().includes(searchLower)) ||
        (item.last_name && item.last_name.toLowerCase().includes(searchLower)) ||
        (item.content_type_name && item.content_type_name.toLowerCase().includes(searchLower)) ||
        (item.category_name && item.category_name.toLowerCase().includes(searchLower))
      );
    }
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(item => {
        if (!item.published_date) return false;
        const publishDate = moment(item.published_date);
        return publishDate.isAfter(startDate.subtract(1, 'day')) && publishDate.isBefore(endDate.add(1, 'day'));
      });
    }
    setContents(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchText, allContents, dateRange]);

  useEffect(() => {
    if (reviewId && contents.length > 0) {
      const found = contents.find(c => String(c.id) === String(reviewId));
      if (found) {
        setSelectedContent(found);
        setReviewModalVisible(true);
      }
    }
  }, [reviewId, contents]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const shouldFetchAll = searchText && searchText.trim();
      const params = shouldFetchAll ? {} : { limit: pageSize, offset: (currentPage - 1) * pageSize };
      const statusToFetch = filterStatus !== 'all' ? filterStatus : (activeTab !== 'all' ? activeTab : null);
      if (statusToFetch) params.status = statusToFetch;

      const response = await axios.get('/api/admin/content/pending', { params });
      const result = response.data?.data || response.data || [];
      setAllContents(Array.isArray(result) ? result : []);
      setContents(Array.isArray(result) ? result : []);
      setTotalItems(Array.isArray(result) ? result.length : 0);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to load contents');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action, contentId) => {
    try {
      await axios.put(`/api/admin/content/${contentId}/review`, {
        action,
        comment: adminComment
      });
      
      const actionMessages = {
        approve: 'Content approved successfully',
        publish: 'Content published successfully',
        reject: 'Content rejected',
        request_changes: 'Changes requested successfully'
      };
      
      message.success(actionMessages[action] || 'Action completed');
      setReviewModalVisible(false);
      setAdminComment('');
      setSelectedContent(null);
      fetchContents();
    } catch (error) {
      message.error('Failed to review content');
    }
  };

  const handleDirectPublish = async (contentId) => {
    setPublishingId(contentId);
    try {
      await axios.put(`/api/admin/content/${contentId}/review`, { action: 'publish', comment: '' });
      message.success('Content published successfully');
      fetchContents();
    } catch (error) {
      message.error('Failed to publish content');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (contentId) => {
    try {
      await axios.delete(`/api/admin/content/${contentId}`);
      message.success('Content deleted successfully');
      fetchContents();
    } catch {
      message.error('Failed to delete content');
    }
  };

  const handleToggleVisibility = async (contentId, currentVisibility, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    setTogglingVisibility(contentId);
    
    try {
      const newVisibility = !currentVisibility;
      await axios.put(`/api/admin/content/${contentId}/visibility`, { 
        is_visible_on_site: newVisibility 
      });
      
      message.success(
        newVisibility 
          ? 'Content is now visible on the website' 
          : 'Content is now hidden from website'
      );
      
      await fetchContents();
    } catch (error) {
      message.error('Failed to toggle visibility');
    } finally {
      setTogglingVisibility(null);
    }
  };

  const pendingCount = allContents.filter(c => c.status === 'pending').length;
  const approvedCount = allContents.filter(c => c.status === 'approved').length;
  const publishedCount = allContents.filter(c => c.status === 'published').length;
  const revisionCount = allContents.filter(c => c.status === 'changes_requested' || c.status === 'rejected').length;

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
      danger: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const c = colorMap[color] || colorMap.warning;

    return (
      <div
        className="rev-kpi-card"
        style={{
          background: D
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.65) 100%)'
            : 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
          boxShadow: D
            ? '0 10px 30px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 30px -5px rgba(11, 31, 77, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor || c.text }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: D ? '#94A3B8' : '#64748B' }}>
            {title}
          </span>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${c.border}` }}>
            {icon}
          </div>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: D ? '#F8FAFC' : '#0F172A', lineHeight: 1 }}>
          {value}
        </div>

        {subtitle && (
          <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: D ? '#64748B' : '#94A3B8' }}>
            {subtitle}
          </div>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: 'Article Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <span style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.86rem', display: 'block' }}>
            {text}
          </span>
          <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>
            {record.category_name || 'General'} • {record.content_type_name || 'Article'}
          </span>
        </div>
      ),
    },
    {
      title: 'Author',
      key: 'author',
      render: (_, record) => (
        <Space size={8}>
          <Avatar size={30} icon={<UserOutlined />} style={{ background: D ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)', color: '#3B82F6' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: D ? '#F8FAFC' : '#0F172A' }}>
              {record.first_name ? `${record.first_name} ${record.last_name || ''}` : 'Editorial Contributor'}
            </div>
            <div style={{ fontSize: '0.7rem', color: D ? '#64748B' : '#94A3B8' }}>{record.author_email || 'staff@tgstechinfo.com'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Review Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = {
          draft: { color: 'default', text: 'Draft' },
          pending: { color: 'gold', text: 'Pending Review' },
          approved: { color: 'green', text: 'Approved' },
          published: { color: 'blue', text: 'Published' },
          rejected: { color: 'red', text: 'Rejected' },
          changes_requested: { color: 'orange', text: 'Changes Requested' }
        };
        const s = map[status] || { color: 'default', text: status };
        return <Tag color={s.color} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px', fontSize: '0.72rem' }}>{s.text}</Tag>;
      },
    },
    {
      title: 'Visible On Site',
      dataIndex: 'is_visible_on_site',
      key: 'is_visible_on_site',
      render: (isVisible, record) => {
        const isVisibleBool = isVisible === 1 || isVisible === true;
        return (
          <Tooltip title={isVisibleBool ? 'Visible on platform' : 'Hidden from public feed'}>
            <Switch
              checked={isVisibleBool}
              loading={togglingVisibility === record.id}
              onChange={(checked, event) => handleToggleVisibility(record.id, isVisibleBool, event)}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Submission Date',
      dataIndex: 'published_date',
      key: 'published_date',
      render: (date) => (
        <span style={{ fontSize: '0.78rem', color: D ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
          {date ? moment(date).format('MMM DD, YYYY') : 'Draft'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          {record.status === 'pending' ? (
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedContent(record);
                setReviewModalVisible(true);
              }}
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                border: 'none',
                fontWeight: 700,
              }}
            >
              Review
            </Button>
          ) : record.status === 'approved' ? (
            <Button 
              type="primary" 
              size="small" 
              icon={<SendOutlined />}
              loading={publishingId === record.id}
              onClick={() => handleDirectPublish(record.id)}
              style={{ 
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                border: 'none',
                fontWeight: 700,
              }}
            >
              Publish
            </Button>
          ) : (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedContent(record);
                setReviewModalVisible(true);
              }}
              style={{ borderRadius: 8, background: D ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)', color: '#3B82F6' }}
            >
              Inspect
            </Button>
          )}

          <Popconfirm title="Delete item?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: D ? '#1E293B' : '#FFFFFF',
          colorText: D ? '#CBD5E1' : '#334155',
          colorBorder: D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)',
          colorBgElevated: D ? '#1E293B' : '#FFFFFF',
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        },
      }}
    >
      <style>{reviewStyles}</style>

      <div className="rev-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="rev-stagger-1"
          style={{
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            background: D
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.75) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: D ? '0 12px 32px -4px rgba(0, 0, 0, 0.4)' : '0 12px 32px -4px rgba(11, 31, 77, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="rev-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#10B981' }}>
                Editorial Quality Governance
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {pendingCount} Articles Awaiting Verification
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckSquareOutlined style={{ color: '#10B981' }} /> Editorial Review Queue
            </h1>
          </div>

          <Segmented
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { label: 'All Reviews', value: 'all' },
              { label: '🔥 Pending', value: 'pending' },
              { label: '✅ Approved', value: 'approved' },
              { label: '🚀 Published', value: 'published' },
            ]}
            style={{ padding: 4, borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }}
          />
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="rev-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Pending Review" value={pendingCount} icon={<ClockCircleOutlined />} color="warning" accentColor="#F59E0B" subtitle="Action Required" />
          <StatCard title="Approved Articles" value={approvedCount} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Ready to Publish" />
          <StatCard title="Published Live" value={publishedCount} icon={<SendOutlined />} color="info" accentColor="#3B82F6" subtitle="On Website" />
          <StatCard title="Revisions Requested" value={revisionCount} icon={<EditOutlined />} color="danger" accentColor="#EF4444" subtitle="Returned to Author" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="rev-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            overflow: 'hidden',
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          {/* Action Bar */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
                Editorial Review Registry
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Displaying {contents.length} articles
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: D ? '#1E293B' : '#F1F5F9',
                  border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                  borderRadius: 10,
                  padding: '6px 14px',
                  width: 220,
                }}
              >
                <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 14 }} />
                <input
                  type="text"
                  placeholder="Filter articles..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.82rem',
                    color: D ? '#F8FAFC' : '#0F172A',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Tooltip title="Reload Pending Reviews">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchContents}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                    background: D ? '#1E293B' : '#F1F5F9',
                    color: D ? '#F8FAFC' : '#0F172A',
                  }}
                />
              </Tooltip>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={contents}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showTotal: (total) => <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>Total {total} submissions</span>,
              onChange: (p, s) => { setCurrentPage(p); setPageSize(s); },
            }}
          />
        </div>

        {/* ── EDITORIAL REVIEW MODAL ── */}
        {selectedContent && (
          <Modal
            title={
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquareOutlined style={{ color: '#10B981' }} /> Editorial Inspection Panel
              </div>
            }
            open={reviewModalVisible}
            onCancel={() => { setReviewModalVisible(false); setSelectedContent(null); }}
            width={720}
            footer={[
              <Button key="reject" danger icon={<CloseOutlined />} onClick={() => handleReview('reject', selectedContent.id)} style={{ borderRadius: 8 }}>
                Reject
              </Button>,
              <Button key="changes" icon={<EditOutlined />} onClick={() => handleReview('request_changes', selectedContent.id)} style={{ borderRadius: 8 }}>
                Request Changes
              </Button>,
              <Button key="approve" icon={<CheckOutlined />} onClick={() => handleReview('approve', selectedContent.id)} style={{ borderRadius: 8, background: '#10B981', color: '#fff', border: 'none' }}>
                Approve
              </Button>,
              <Button key="publish" type="primary" icon={<SendOutlined />} onClick={() => handleReview('publish', selectedContent.id)} style={{ borderRadius: 8, background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)', border: 'none' }}>
                Approve & Publish
              </Button>,
            ]}
          >
            <div style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', marginBottom: 8 }}>
                {selectedContent.title}
              </h2>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Tag color="blue">{selectedContent.content_type_name || 'Article'}</Tag>
                <Tag color="geekblue">{selectedContent.category_name || 'General'}</Tag>
                <Tag color="gold">Pending Approval</Tag>
              </div>

              <div style={{ background: D ? '#0F172A' : '#F8FAFC', padding: 16, borderRadius: 12, border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`, marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                  Summary / Excerpt
                </div>
                <div style={{ fontSize: '0.88rem', color: D ? '#CBD5E1' : '#334155' }}>
                  {selectedContent.excerpt || selectedContent.summary || 'No excerpt available.'}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: D ? '#F8FAFC' : '#0F172A', display: 'block', marginBottom: 6 }}>
                  Reviewer Notes / Feedback to Author
                </label>
                <TextArea
                  rows={4}
                  placeholder="Provide detailed feedback or reasons for approval / requested revisions..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </ConfigProvider>
  );
};

export default ContentReview;