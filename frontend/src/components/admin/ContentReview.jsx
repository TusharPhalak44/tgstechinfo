import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Modal, 
  Tag, 
  Space, 
  Typography, 
  message, 
  Descriptions, 
  Badge, 
  Tabs, 
  Input,
  DatePicker,
  Select,
  Divider,
  Row,
  Col,
  Avatar,
  Tooltip,
  Popconfirm,
  Alert,
  Segmented,
  Grid,
  ConfigProvider,
  theme,
  Switch
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
  ExclamationCircleOutlined,
  RollbackOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ContentReview = () => {
  const { id: reviewId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  const [contents, setContents] = useState([]);
  const [allContents, setAllContents] = useState([]); // Store all contents for client-side filtering
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

  // Client-side search filtering
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
  }, [searchText, allContents,dateRange]);

  useEffect(() => {
    if (reviewId && contents.length > 0) {
      const found = contents.find(c => String(c.id) === String(reviewId));
      if (found) {
        setSelectedContent(found);
        setReviewModalVisible(true);
      }
    }
  }, [reviewId, contents]);

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try { return JSON.parse(tags); } catch { return []; }
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      // When searching, fetch all data without pagination for better client-side filtering
      const shouldFetchAll = searchText && searchText.trim();
      const params = shouldFetchAll ? {} : { limit: pageSize, offset: (currentPage - 1) * pageSize };
      const statusToFetch = filterStatus !== 'all' ? filterStatus : (activeTab !== 'all' ? activeTab : null);
      if (statusToFetch) params.status = statusToFetch;
      console.log('Fetching contents with params:', params);
      const response = await axios.get('/api/admin/content/pending', { params });
      const result = response.data?.data || response.data || [];
      setAllContents(Array.isArray(result) ? result : []);
      
      // Initial set without search filter (search filter is applied in separate useEffect)
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
      console.error('Review error:', error);
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
    // Stop event propagation to prevent triggering parent click handlers
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    console.log('Toggle visibility called:', { contentId, currentVisibility });
    setTogglingVisibility(contentId);
    
    try {
      const newVisibility = !currentVisibility;
      console.log('Sending request to:', `/api/admin/content/${contentId}/visibility`);
      console.log('Request body:', { is_visible_on_site: newVisibility });
      
      const response = await axios.put(`/api/admin/content/${contentId}/visibility`, { 
        is_visible_on_site: newVisibility 
      });
      
      console.log('Response:', response.data);
      
      message.success(
        newVisibility 
          ? 'Content is now visible on the website' 
          : 'Content is now hidden from website (direct URL still works)'
      );
      
      // Refresh the content list
      await fetchContents();
    } catch (error) {
      console.error('Toggle visibility error:', error);
      console.error('Error response:', error.response?.data);
      message.error(error.response?.data?.message || 'Failed to toggle visibility');
    } finally {
      setTogglingVisibility(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { color: 'default', text: 'Draft', icon: <FileTextOutlined /> },
      pending: { color: 'processing', text: 'Pending Review', icon: <ClockCircleOutlined /> },
      approved: { color: 'success', text: 'Approved', icon: <CheckCircleOutlined /> },
      published: { color: 'success', text: 'Published', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: 'Rejected', icon: <CloseCircleOutlined /> },
      changes_requested: { color: 'warning', text: 'Changes Requested', icon: <EditOutlined /> }
    };
    return statusMap[status] || { color: 'default', text: status, icon: null };
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: isMobile ? 150 : 250,
      render: (text, record) => (
        <div>
          <strong className="text-sm" style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{text}</strong>
        </div>
      )
    },
    {
      title: 'Author',
      key: 'author',
      width: isMobile ? 120 : 150,
      responsive: ['md'],
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div className="font-medium" style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{record.first_name} {record.last_name}</div>
            {!isMobile && <Text type="secondary" className="text-xs">{record.author_email}</Text>}
          </div>
        </Space>
      )
    },
    {
      title: 'Content Type',
      dataIndex: 'content_type_name',
      key: 'content_type_name',
      width: 120,
      render: (text) => <Tag color="blue" style={{ fontSize: 13 }}>{text || 'N/A'}</Tag>
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 120,
      render: (text) => <Tag color="geekblue" style={{ fontSize: 13 }}>{text || 'N/A'}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 100 : 160,
      render: (status) => {
        const map = {
          draft:             { color: 'default', text: 'Draft' },
          pending:           { color: 'orange',  text: 'Pending Review' },
          approved:          { color: 'green',   text: 'Approved' },
          published:         { color: 'blue',    text: 'Published' },
          rejected:          { color: 'red',     text: 'Rejected' },
          changes_requested: { color: 'gold',    text: 'Changes Requested' }
        };
        const s = map[status] || { color: 'default', text: status };
        return <Tag color={s.color} style={{ fontSize: isMobile ? 11 : 14 }}>{s.text}</Tag>;
      }
    },
    {
      title: 'Views',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      responsive: ['lg'],
      render: (views) => <span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{views || 0}</span>
    },
    {
      title: 'Visible',
      dataIndex: 'is_visible_on_site',
      key: 'is_visible_on_site',
      width: 100,
      responsive: ['md'],
      render: (isVisible, record) => {
        // Convert tinyint (0/1) to proper boolean
        const isVisibleBool = isVisible === 1 || isVisible === true;
        console.log(`Rendering visibility for content ${record.id}:`, { raw: isVisible, converted: isVisibleBool });
        return (
          <Tooltip title={isVisibleBool ? 'Content visible on website' : 'Hidden from website listings (direct URL still works)'}>
            <Switch
              checked={isVisibleBool}
              loading={togglingVisibility === record.id}
              onChange={(checked, event) => {
                console.log('Switch onChange triggered:', { checked, contentId: record.id });
                event.stopPropagation();
                handleToggleVisibility(record.id, isVisibleBool, event);
              }}
              onClick={(checked, event) => {
                console.log('Switch onClick triggered');
                event.stopPropagation();
              }}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
              size={isMobile ? 'small' : 'default'}
            />
          </Tooltip>
        );
      }
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Published Date</span>,
      dataIndex: 'published_date',
      key: 'published_date',
      width: 120,
      render: (date) => (
        <span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e', whiteSpace: 'nowrap' }}>
          {date ? moment(date).format('YYYY-MM-DD') : '-'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? 100 : 180,
      render: (_, record) => (
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '4px' : '8px',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap'
        }}>
          {record.status === 'pending' ? (
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/review/${record.id}`)}
              style={{ 
                flex: isMobile ? '1' : 'none',
                minWidth: isMobile ? '28px' : 'auto',
                padding: isMobile ? '0 4px' : '0 12px',
                height: isMobile ? '28px' : '32px',
                background: '#52c41a', 
                borderColor: '#52c41a',
                fontSize: isMobile ? '11px' : '14px',
                borderRadius: '6px'
              }}
            >
              {!isMobile && 'Review'}
            </Button>
          ) : record.status === 'approved' ? (
            <Button 
              type="primary" 
              size="small" 
              icon={<SendOutlined />}
              loading={publishingId === record.id}
              onClick={() => handleDirectPublish(record.id)}
              style={{ 
                flex: isMobile ? '1' : 'none',
                minWidth: isMobile ? '28px' : 'auto',
                padding: isMobile ? '0 4px' : '0 12px',
                height: isMobile ? '28px' : '32px',
                background: '#1890ff', 
                borderColor: '#1890ff',
                fontSize: isMobile ? '11px' : '14px',
                borderRadius: '6px'
              }}
            >
              {!isMobile && 'Publish'}
            </Button>
          ) : (
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/review/${record.id}`)}
              style={{ 
                flex: isMobile ? '1' : 'none',
                minWidth: isMobile ? '28px' : 'auto',
                padding: isMobile ? '0 4px' : '0 12px',
                height: isMobile ? '28px' : '32px',
                fontSize: isMobile ? '11px' : '14px',
                borderRadius: '6px'
              }}
            >
              {!isMobile && 'View'}
            </Button>
          )}
          <Popconfirm
            title="Delete permanently?"
            description="This cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete" 
            okButtonProps={{ danger: true }} 
            cancelText="Cancel"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              style={{ 
                flex: isMobile ? '1' : 'none',
                minWidth: isMobile ? '28px' : 'auto',
                padding: isMobile ? '0 4px' : '0 12px',
                height: isMobile ? '28px' : '32px',
                fontSize: isMobile ? '11px' : '14px',
                borderRadius: '6px'
              }}
            />
          </Popconfirm>
        </div>
      )
    }
  ];

  const renderReviewModal = () => {
    if (!selectedContent) return null;

    const statusInfo = getStatusBadge(selectedContent.status);
    const tags = parseTags(selectedContent.tags);
    const modalWidth = isMobile ? '100%' : isTablet ? 800 : 900;

    const ReviewContent = () => (
      <div className="max-h-[70vh] overflow-y-auto" style={{ padding: isMobile ? 0 : '0 4px' }}>
        {/* Content Preview */}
        <Card 
          size={isMobile ? 'small' : 'default'} 
          className="mb-4 rounded-lg shadow-sm"
          style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div style={{ marginBottom: 12 }}>
                <Tag color="blue">{selectedContent.content_type_name}</Tag>
                <Tag>{selectedContent.category_name}</Tag>
              </div>
              <Title level={isMobile ? 4 : 3} style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>{selectedContent.title}</Title>
            </Col>
          </Row>
          
          <Descriptions 
            bordered 
            column={isMobile ? 1 : 2} 
            size={isMobile ? 'small' : 'default'}
            style={{ background: darkMode ? '#1e293b' : '#fff' }}
          >
            <Descriptions.Item label="Author" span={1}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {selectedContent.first_name} {selectedContent.last_name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Created" span={1}>
              {moment(selectedContent.created_at).format('MMMM D, YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled Publish" span={1}>
              {selectedContent.scheduled_publish_date ? 
                moment(selectedContent.scheduled_publish_date).format('MMMM D, YYYY') : 
                'Not scheduled'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Reading Time" span={1}>
              {selectedContent.reading_time || 0} min read
            </Descriptions.Item>
          </Descriptions>

          {tags.length > 0 && (
            <div className="mt-3">
              <Text strong style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>Tags: </Text>
              {tags.map((tag, index) => (
                <Tag key={index} color="geekblue">{tag}</Tag>
              ))}
            </div>
          )}
        </Card>

        {/* Short Description */}
        <Card 
          size={isMobile ? 'small' : 'default'} 
          title="Short Description" 
          className="mb-4 rounded-lg shadow-sm"
          style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
        >
          <Paragraph style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{selectedContent.short_description}</Paragraph>
        </Card>

        {/* Banner Image */}
        {selectedContent.banner_image && (
          <div className="mb-4">
            <Text strong style={{ display: 'block', marginBottom: 8, color: darkMode ? '#f1f5f9' : '#111827' }}>Banner Image</Text>
            <img 
              src={`/uploads/${selectedContent.banner_image}`} 
              alt={selectedContent.title}
              style={{ 
                width: '100%', 
                height: isMobile ? 'auto' : 'auto',
                maxHeight: isMobile ? 300 : 500,
                objectFit: 'contain',
                display: 'block', 
                borderRadius: 8,
                background: darkMode ? '#0f172a' : '#f5f5f5'
              }}
            />
          </div>
        )}

        {/* Content Body */}
        <Card 
          size={isMobile ? 'small' : 'default'} 
          title="Content" 
          className="mb-4 rounded-lg shadow-sm"
          style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
        >
          <div 
            className="content-preview p-4 bg-gray-50 rounded-lg border border-gray-200 leading-relaxed"
            style={{ 
              maxHeight: isMobile ? 300 : 400,
              overflowY: 'auto',
              fontSize: isMobile ? 14 : 16,
              background: darkMode ? '#0f172a' : '#f9fafb',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              color: darkMode ? '#cbd5e1' : '#1a1a2e'
            }}
            dangerouslySetInnerHTML={{ 
              __html: selectedContent.content || 'No content available'
            }}
          />
        </Card>

        {/* SEO Settings */}
        {(selectedContent.seo_meta_title || selectedContent.seo_meta_description || selectedContent.seo_meta_keywords) && (
          <Card 
            size={isMobile ? 'small' : 'default'} 
            title="SEO Settings" 
            className="mb-4 rounded-lg shadow-sm"
            style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
          >
            <Descriptions bordered column={1} size={isMobile ? 'small' : 'default'} style={{ background: darkMode ? '#1e293b' : '#fff' }}>
              {selectedContent.seo_meta_title && (
                <Descriptions.Item label="Meta Title">
                  {selectedContent.seo_meta_title}
                </Descriptions.Item>
              )}
              {selectedContent.seo_meta_description && (
                <Descriptions.Item label="Meta Description">
                  {selectedContent.seo_meta_description}
                </Descriptions.Item>
              )}
              {selectedContent.seo_meta_keywords && (
                <Descriptions.Item label="Meta Keywords">
                  {selectedContent.seo_meta_keywords}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Visibility Control */}
        <Card 
          size={isMobile ? 'small' : 'default'} 
          title={
            <Space>
              <span>Website Visibility</span>
              <Tooltip title="Control whether this content appears in website listings. Direct URL access always works.">
                <ExclamationCircleOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }
          className="mb-4 rounded-lg shadow-sm"
          style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4, color: darkMode ? '#f1f5f9' : '#111827' }}>
                Show on Website
              </Text>
              <Text type="secondary" style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6b7280' }}>
                {(selectedContent.is_visible_on_site === 1 || selectedContent.is_visible_on_site === true)
                  ? 'Content is visible in website listings' 
                  : 'Content is hidden from listings (direct URL still works)'}
              </Text>
            </div>
            <Switch
              checked={selectedContent.is_visible_on_site === 1 || selectedContent.is_visible_on_site === true}
              loading={togglingVisibility === selectedContent.id}
              onChange={(checked, event) => {
                if (event) event.stopPropagation();
                const currentVisibility = selectedContent.is_visible_on_site === 1 || selectedContent.is_visible_on_site === true;
                handleToggleVisibility(selectedContent.id, currentVisibility, event);
                // Update local state to reflect change immediately
                setSelectedContent(prev => ({ 
                  ...prev, 
                  is_visible_on_site: currentVisibility ? 0 : 1 
                }));
              }}
              onClick={(checked, event) => {
                if (event) event.stopPropagation();
              }}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
              size="default"
            />
          </div>
          {(selectedContent.is_visible_on_site === 0 || selectedContent.is_visible_on_site === false) && (
            <Alert
              message="Hidden Content"
              description="This content won't appear in website listings or feeds, but can still be accessed via its direct URL."
              type="warning"
              showIcon
              style={{ marginTop: 12, fontSize: 12 }}
              icon={<EyeInvisibleOutlined />}
            />
          )}
        </Card>

        {/* Admin Comment */}
        <Card 
          size={isMobile ? 'small' : 'default'} 
          title="Admin Comment" 
          className="mb-4 rounded-lg shadow-sm"
          style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
        >
          <TextArea
            rows={isMobile ? 3 : 4}
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            placeholder="Add comment for the author (optional)..."
            className="rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#d1d5db' }}
          />
          {selectedContent.admin_comment && (
            <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200" style={{ background: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', borderColor: darkMode ? '#f59e0b' : '#fcd34d' }}>
              <Text strong className="text-yellow-600" style={{ color: darkMode ? '#fbbf24' : '#b45309' }}>Previous Comment: </Text>
              <Text style={{ color: darkMode ? '#fcd34d' : '#92400e' }}>{selectedContent.admin_comment}</Text>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <Divider />

        <div className="text-center">
          <Space 
            size={isMobile ? 'middle' : 'large'} 
            wrap 
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 8 : 16
            }}
          >
            <Popconfirm
              title="Approve Content"
              description="Are you sure you want to approve this content?"
              onConfirm={() => handleReview('approve', selectedContent.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                size={isMobile ? 'middle' : 'large'}
                className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 rounded-lg"
                style={{ 
                  width: isMobile ? '100%' : 'auto', 
                  minWidth: isMobile ? 'auto' : 120,
                  fontSize: isMobile ? 14 : 16
                }}
              >
                Approve
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Publish Content"
              description="Are you sure you want to publish this content?"
              onConfirm={() => handleReview('publish', selectedContent.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                size={isMobile ? 'middle' : 'large'}
                className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 rounded-lg"
                style={{ 
                  width: isMobile ? '100%' : 'auto', 
                  minWidth: isMobile ? 'auto' : 120,
                  fontSize: isMobile ? 14 : 16
                }}
              >
                Publish
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Request Changes"
              description="Are you sure you want to request changes?"
              onConfirm={() => handleReview('request_changes', selectedContent.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                size={isMobile ? 'middle' : 'large'}
                className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 rounded-lg"
                style={{ 
                  width: isMobile ? '100%' : 'auto', 
                  minWidth: isMobile ? 'auto' : 120,
                  fontSize: isMobile ? 14 : 16
                }}
              >
                Request Changes
              </Button>
            </Popconfirm>

            <Button 
              danger
              icon={<CloseOutlined />}
              size={isMobile ? 'middle' : 'large'}
              className="rounded-lg hover:bg-red-50"
              onClick={() => handleReview('reject', selectedContent.id)}
              style={{ 
                width: isMobile ? '100%' : 'auto', 
                minWidth: isMobile ? 'auto' : 120,
                fontSize: isMobile ? 14 : 16
              }}
            >
              Reject
            </Button>
          </Space>
        </div>
      </div>
    );

    return (
      <Modal
        title={
          <Space style={{ fontSize: isMobile ? 16 : 18 }}>
            <span className="font-semibold" style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>Review Content</span>
            <Badge status={statusInfo.color} text={statusInfo.text} />
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedContent(null);
          setAdminComment('');
        }}
        width={modalWidth}
        style={{ top: isMobile ? 0 : 20 }}
        footer={null}
        className="content-review-modal"
        bodyStyle={{ 
          padding: isMobile ? 12 : 24,
          maxHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
          overflowY: 'auto',
          background: darkMode ? '#1e293b' : '#fff'
        }}
        destroyOnClose
      >
        <ReviewContent />
      </Modal>
    );
  };

  const tabItems = [
    { key: 'pending', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'changes_requested', label: 'Changes Requested' },
    { key: 'all', label: 'All Content' }
  ];

  return (
    <ConfigProvider theme={{
      algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorBgContainer: darkMode ? '#1e293b' : '#fff',
        colorBorder: darkMode ? '#334155' : '#e5e7eb',
        colorText: darkMode ? '#cbd5e1' : '#1a1a2e',
        colorTextSecondary: darkMode ? '#94a3b8' : '#6b7280',
        colorBgElevated: darkMode ? '#1e293b' : '#fff',
        colorFillAlter: darkMode ? '#0f172a' : '#fafafa',
        colorFillContent: darkMode ? '#0f172a' : '#fff',
        colorFillQuaternary: darkMode ? '#0f172a' : '#f5f5f5',
      }
    }}>
      <div className="p-4 md:p-6 lg:p-8" style={{ background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}>
        <Card className="rounded-xl shadow-soft border border-gray-200" style={{ background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <Title level={isMobile ? 3 : 2} className="mb-1" style={{ fontSize: isMobile ? 20 : 24, color: darkMode ? '#f1f5f9' : '#111827' }}>
                Content Review
              </Title>
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#94a3b8' : '#6b7280' }}>
                Review, approve, reject, and manage content submissions
              </Text>
            </div>
            <div className="w-full sm:w-auto flex justify-start sm:justify-end">
              <Badge count={contents.filter(c => c.status === 'pending').length} overflowCount={99}>
                <Button 
                  type="primary" 
                  icon={<ClockCircleOutlined />} 
                  className="rounded-lg"
                  style={{ 
                    width: isMobile ? '100%' : 'auto',
                    background: darkMode ? '#4a7cff' : undefined
                  }}
                >
                  {!isMobile && 'Pending Items'}
                  {isMobile && `${contents.filter(c => c.status === 'pending').length} Pending`}
                </Button>
              </Badge>
            </div>
          </div>

        {/* Admin Info Alert */}
        <Alert
          message={
            <Space>
              <CheckCircleOutlined className="text-blue-500" />
              <Text strong style={{ color: darkMode ? '#f1f5f9' : '#111827' }}>Admin Review Mode</Text>
            </Space>
          }
          description="You can review, approve, reject, or request changes for content."
          type="info"
          showIcon
          closable
          className="mb-4 rounded-lg"
          style={{ 
            fontSize: isMobile ? 12 : 14,
            background: darkMode ? '#1e293b' : '#fff',
            borderColor: darkMode ? '#334155' : '#e5e7eb'
          }}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 items-center">
           <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input.Search
              placeholder="Search..."
              allowClear
              value={searchText}
              onSearch={(value) => { setSearchText(value); setCurrentPage(1); }}
              onChange={(e) => { setSearchText(e.target.value); }}
              onClear={() => { setSearchText(''); setCurrentPage(1); }}
              style={{ width: isMobile ? 200 : 250, background: darkMode ? '#0f172a' : '#fff' }}
            />
 <DatePicker.RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
              style={{
                background: darkMode ? '#0f172a' : '#fff',
                borderColor: darkMode ? '#334155' : '#e5e7eb'
              }}
            />
            <Button onClick={() => { setSearchText(''); setFilterStatus('all'); setActiveTab('all'); setCurrentPage(1); fetchContents(); setDateRange(null); }} icon={<RollbackOutlined />} className="rounded-lg">
               Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <style>{`.content-review-tabs .ant-tabs-nav { overflow: hidden !important; } .content-review-tabs .ant-tabs-nav-wrap { overflow: hidden !important; }`}</style>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setFilterStatus('all'); setCurrentPage(1); }}
          type={isMobile ? 'line' : 'card'}
          className="mb-4 content-review-tabs"
          style={{ 
            overflowX: isMobile ? 'auto' : 'visible',
            overflowY: 'hidden',
            fontSize: isMobile ? 12 : 14
          }}
          items={tabItems.map(tab => ({
            key: tab.key,
            label: (
              <span style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>
                {isMobile ? (
                  <Badge 
                    status={tab.key === 'pending' ? 'processing' : 'default'} 
                    text={tab.key === 'pending' ? 'Pending' : tab.label.split(' ')[0]}
                  />
                ) : (
                  <Badge status={tab.key === 'pending' ? 'processing' : 'default'} text={tab.label} />
                )}
              </span>
            )
          }))}
        />

        {/* View Toggle */}
        <div className="flex justify-end mb-4">
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'table', icon: <UnorderedListOutlined /> },
              { value: 'card', icon: <AppstoreOutlined /> },
            ]}
            size={isMobile ? 'small' : 'default'}
            style={{ background: darkMode ? '#1e293b' : '#f5f5f5' }}
          />
        </div>

        {/* Card View */}
        {viewMode === 'card' ? (
          <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
            {contents.map(record => {
              const s = getStatusBadge(record.status);
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={record.id}>
                  <Card 
                    hoverable 
                    styles={{ body: { padding: 0 } }} 
                    style={{ borderRadius: 12, background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
                    onClick={() => navigate(`/admin/review/${record.id}`)}
                  >
                    <div style={{ position: 'relative', lineHeight: 0 }}>
                      {record.banner_image ? (
                        <img 
                          src={`/uploads/${record.banner_image}`} 
                          alt={record.title}
                          style={{ 
                            width: '100%', 
                            height: isMobile ? 150 : 200, 
                            objectFit: 'cover', 
                            display: 'block', 
                            borderRadius: '8px 8px 0 0', 
                            background: '#f0f4ff' 
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          height: isMobile ? 150 : 200, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: darkMode ? '#0f172a' : 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', 
                          borderRadius: '8px 8px 0 0' 
                        }}>
                          <FileTextOutlined style={{ fontSize: 40, color: darkMode ? '#475569' : '#bfbfbf' }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255,255,255,0.95)', 
                          borderRadius: 6, 
                          padding: '3px 10px', 
                          fontSize: isMobile ? 10 : 12, 
                          fontWeight: 500, 
                          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                          color: darkMode ? '#f1f5f9' : '#111827'
                        }}>
                          <Badge status={s.color} />{s.text}
                        </span>
                      </div>
                      {(record.is_visible_on_site === 0 || record.is_visible_on_site === false) && (
                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                          <Tooltip title="Hidden from website listings">
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: darkMode ? 'rgba(239, 68, 68, 0.9)' : 'rgba(239, 68, 68, 0.9)', 
                              borderRadius: 6, 
                              padding: '4px 8px', 
                              fontSize: isMobile ? 10 : 12, 
                              fontWeight: 500, 
                              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                              color: '#fff'
                            }}>
                              <EyeInvisibleOutlined />
                            </span>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: isMobile ? '10px 12px' : '14px 16px' }}>
                      <div style={{ marginBottom: 6 }}>
                        <Tag color="blue" style={{ fontSize: isMobile ? 10 : 11, color: darkMode ? '#60a5fa' : undefined }}>{record.content_type_name}</Tag>
                        {!isMobile && <Tag style={{ fontSize: 11, color: darkMode ? '#a78bfa' : undefined }}>{record.category_name}</Tag>}
                      </div>
                      <div style={{ 
                        fontWeight: 700, 
                        fontSize: isMobile ? 13 : 14, 
                        lineHeight: 1.4, 
                        marginBottom: 8, 
                        color: darkMode ? '#f1f5f9' : '#1a1a1a', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}>
                        {record.title}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        borderTop: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', 
                        paddingTop: 10 
                      }}>
                        <Space size={4}>
                          <Avatar size={isMobile ? 20 : 22} icon={<UserOutlined />} />
                          <Text style={{ fontSize: isMobile ? 11 : 12, color: darkMode ? '#94a3b8' : '#595959' }}>
                            {record.first_name} {record.last_name}
                          </Text>
                        </Space>
                        <Space size={4}>
                          {record.status === 'approved' && (
                            <Button 
                              type="primary" 
                              size={isMobile ? 'small' : 'small'} 
                              icon={<SendOutlined />}
                              loading={publishingId === record.id}
                              onClick={e => { e.stopPropagation(); handleDirectPublish(record.id); }}
                              style={{ 
                                padding: isMobile ? '0 6px' : '0 12px',
                                fontSize: isMobile ? '11px' : '14px'
                              }}
                            >
                              {!isMobile && 'Publish'}
                            </Button>
                          )}
                          <Popconfirm
                            title="Delete permanently?"
                            description="This cannot be undone."
                            onConfirm={e => { handleDelete(record.id); }}
                            okText="Delete" 
                            okButtonProps={{ danger: true }} 
                            cancelText="Cancel"
                          >
                            <Button 
                              danger 
                              size={isMobile ? 'small' : 'small'} 
                              icon={<DeleteOutlined />}
                              onClick={e => e.stopPropagation()}
                              style={{ 
                                padding: isMobile ? '0 6px' : '0 12px',
                                fontSize: isMobile ? '11px' : '14px'
                              }}
                            />
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          /* Table View */
          <Table
            columns={columns}
            dataSource={contents}
            loading={loading}
            rowKey="id"
            scroll={{ x: isMobile ? 600 : 1000 }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: !isMobile ? (total) => <span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Total {total} items</span> : false,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              pageSizeOptions: ['10', '20', '50', '100'],
              size: isMobile ? 'small' : 'default',
              style: { textAlign: 'center', marginTop: 16 },
              simple: isMobile
            }}
            className="border border-gray-200 rounded-lg overflow-hidden"
            style={{ 
              fontSize: isMobile ? 12 : 14,
              background: darkMode ? '#1e293b' : '#fff',
              borderColor: darkMode ? '#334155' : '#e5e7eb'
            }}
            size={isMobile ? 'small' : 'middle'}
            rowClassName={(record, index) => index % 2 === 0 ? (darkMode ? 'bg-dark-even' : '') : ''}
          />
        )}
      </Card>

      {/* Review Modal */}
      {renderReviewModal()}
    </div>
    </ConfigProvider>
  );
};

export default ContentReview;