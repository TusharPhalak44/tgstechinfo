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
  Segmented
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
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ContentReview = () => {
  const { id: reviewId } = useParams();
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
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

  useEffect(() => {
    fetchContents();
  }, [activeTab, currentPage, pageSize, filterStatus]);

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
      const params = { limit: pageSize, offset: (currentPage - 1) * pageSize };
      const statusToFetch = filterStatus !== 'all' ? filterStatus : (activeTab !== 'all' ? activeTab : null);
      if (statusToFetch) params.status = statusToFetch;
      const response = await axios.get('/api/admin/content/pending', { params });
      const result = response.data?.data || response.data || [];
      setContents(Array.isArray(result) ? result : []);
      setTotalItems(response.data?.total || result.length || 0);
    } catch (error) {
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
      width: 250,
      render: (text, record) => (
        <div>
          <strong className="text-sm">{text}</strong>
          <div className="mt-1 flex flex-wrap gap-1">
            <Tag color="blue" className="text-xs">{record.content_type_name}</Tag>
            <Tag className="text-xs">{record.category_name}</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Author',
      key: 'author',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.first_name} {record.last_name}</div>
            <Text type="secondary" className="text-xs">{record.author_email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
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
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: 'Views',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      render: (views) => views || 0
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {record.status === 'pending' ? (
            <Button type="primary" size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/review/${record.id}`)}
              className="rounded-lg bg-green-500 hover:bg-green-600 border-green-500">
              Review
            </Button>
          ) : record.status === 'approved' ? (
            <Button type="primary" size="small" icon={<SendOutlined />}
              loading={publishingId === record.id}
              onClick={() => handleDirectPublish(record.id)}
              className="rounded-lg bg-blue-500 hover:bg-blue-600 border-blue-500">
              Publish
            </Button>
          ) : (
            <Button size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/review/${record.id}`)}
              className="rounded-lg">
              View
            </Button>
          )}
          <Popconfirm
            title="Delete permanently?"
            description="This cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const renderReviewModal = () => {
    if (!selectedContent) return null;

    const statusInfo = getStatusBadge(selectedContent.status);
    const tags = parseTags(selectedContent.tags);

    return (
      <Modal
        title={
          <Space>
            <span className="text-lg font-semibold">Review Content</span>
            <Badge status={statusInfo.color} text={statusInfo.text} />
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedContent(null);
          setAdminComment('');
        }}
        width={900}
        footer={null}
        className="content-review-modal"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Content Preview */}
          <Card size="small" className="mb-4 rounded-lg shadow-sm">
            <Row gutter={16}>
              <Col span={24}>
                <Title level={4}>{selectedContent.title}</Title>
              </Col>
            </Row>
            
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Content Type" span={1}>
                <Tag color="blue">{selectedContent.content_type_name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category" span={1}>
                <Tag>{selectedContent.category_name}</Tag>
              </Descriptions.Item>
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
                <Text strong>Tags: </Text>
                {tags.map((tag, index) => (
                  <Tag key={index} color="geekblue">{tag}</Tag>
                ))}
              </div>
            )}
          </Card>

          {/* Short Description */}
          <Card size="small" title="Short Description" className="mb-4 rounded-lg shadow-sm">
            <Paragraph>{selectedContent.short_description}</Paragraph>
          </Card>

          {/* Banner Image */}
          {selectedContent.banner_image && (
            <div className="mb-4">
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Banner Image</Text>
              <img 
                src={`/uploads/${selectedContent.banner_image}`} 
                alt={selectedContent.title}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
              />
            </div>
          )}

          {/* Content Body */}
          <Card size="small" title="Content" className="mb-4 rounded-lg shadow-sm">
            <div 
              className="content-preview max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: selectedContent.content || 'No content available'
              }}
            />
          </Card>

          {/* SEO Settings */}
          {(selectedContent.seo_meta_title || selectedContent.seo_meta_description || selectedContent.seo_meta_keywords) && (
            <Card size="small" title="SEO Settings" className="mb-4 rounded-lg shadow-sm">
              <Descriptions bordered column={1} size="small">
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

          {/* Admin Comment */}
          <Card size="small" title="Admin Comment" className="mb-4 rounded-lg shadow-sm">
            <TextArea
              rows={3}
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Add comment for the author (optional)..."
              className="rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
            {selectedContent.admin_comment && (
              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <Text strong className="text-yellow-600">Previous Comment: </Text>
                <Text>{selectedContent.admin_comment}</Text>
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <Divider />

          <div className="text-center">
            <Space size="middle" wrap>
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
                  size="large"
                  className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 rounded-lg min-w-[120px]"
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
                  size="large"
                  className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 rounded-lg min-w-[120px]"
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
                  size="large"
                  className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 rounded-lg min-w-[120px]"
                >
                  Request Changes
                </Button>
              </Popconfirm>

              <Button 
                danger
                icon={<CloseOutlined />}
                size="large"
                className="rounded-lg min-w-[120px] hover:bg-red-50"
                onClick={() => handleReview('reject', selectedContent.id)}
              >
                Reject
              </Button>
            </Space>
          </div>
        </div>
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
    <div className="p-6">
      <Card className="rounded-xl shadow-soft border border-gray-200">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <Title level={2} className="mb-1">Content Review</Title>
            <Text type="secondary">
              Review, approve, reject, and manage content submissions
            </Text>
          </div>
          <div>
            <Badge count={contents.filter(c => c.status === 'pending').length} overflowCount={99}>
              <Button type="primary" icon={<ClockCircleOutlined />} className="rounded-lg">
                Pending Items
              </Button>
            </Badge>
          </div>
        </div>

        {/* Admin Info Alert */}
        <Alert
          message={
            <Space>
              <CheckCircleOutlined className="text-blue-500" />
              <Text strong>Admin Review Mode</Text>
            </Space>
          }
          description="You can review, approve, reject, or request changes for content."
          type="info"
          showIcon
          closable
          className="mb-4 rounded-lg"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <Input.Search
            placeholder="Search content..."
            allowClear
            onSearch={setSearchText}
            className="w-64"
          />
          <Select
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setActiveTab('all'); setCurrentPage(1); }}
            className="w-40"
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="published">Published</Option>
            <Option value="rejected">Rejected</Option>
            <Option value="changes_requested">Changes Requested</Option>
          </Select>
          <Button onClick={fetchContents} icon={<RollbackOutlined />} className="rounded-lg">
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setFilterStatus('all'); setCurrentPage(1); }}
          type="card"
          className="mb-4"
          items={tabItems.map(tab => ({
            key: tab.key,
            label: (
              <span>
                <Badge status={tab.key === 'pending' ? 'processing' : 'default'} text={tab.label} />
              </span>
            )
          }))}
        />

        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'table', icon: <UnorderedListOutlined /> },
              { value: 'card', icon: <AppstoreOutlined /> },
            ]}
          />
        </div>

        {/* Card View */}
        {viewMode === 'card' ? (
          <Row gutter={[20, 20]}>
            {contents.map(record => {
              const s = getStatusBadge(record.status);
              return (
                <Col xs={24} sm={12} lg={8} key={record.id}>
                  <Card hoverable styles={{ body: { padding: 0 } }} style={{ borderRadius: 12 }}
                    onClick={() => navigate(`/admin/review/${record.id}`)}>
                    <div style={{ position: 'relative', lineHeight: 0 }}>
                      {record.banner_image ? (
                        <img src={`/uploads/${record.banner_image}`} alt={record.title}
                          style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block', borderRadius: '8px 8px 0 0', background: '#f0f4ff' }} />
                      ) : (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', borderRadius: '8px 8px 0 0' }}>
                          <FileTextOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.95)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                          <Badge status={s.color} />{s.text}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ marginBottom: 6 }}>
                        <Tag color="blue" style={{ fontSize: 11 }}>{record.content_type_name}</Tag>
                        <Tag style={{ fontSize: 11 }}>{record.category_name}</Tag>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 8, color: '#1a1a1a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {record.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                        <Space size={4}>
                          <Avatar size={22} icon={<UserOutlined />} />
                          <Text style={{ fontSize: 12, color: '#595959' }}>{record.first_name} {record.last_name}</Text>
                        </Space>
                        <Space size={4}>
                          {record.status === 'approved' && (
                            <Button type="primary" size="small" icon={<SendOutlined />}
                              loading={publishingId === record.id}
                              onClick={e => { e.stopPropagation(); handleDirectPublish(record.id); }}>
                              Publish
                            </Button>
                          )}
                          <Popconfirm
                            title="Delete permanently?"
                            description="This cannot be undone."
                            onConfirm={e => { handleDelete(record.id); }}
                            okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel"
                          >
                            <Button danger size="small" icon={<DeleteOutlined />}
                              onClick={e => e.stopPropagation()} />
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
          scroll={{ x: 1000 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          className="border border-gray-200 rounded-lg overflow-hidden"
        />
        )}
      </Card>

      {/* Review Modal */}
      {renderReviewModal()}
    </div>
  );
};

export default ContentReview;