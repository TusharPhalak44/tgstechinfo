import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Popconfirm,
  Tabs,
  Input,
  Select,
  Switch,
  Modal,
  Descriptions,
  Badge,
  Row,
  Col
} from 'antd';
import {
  DeleteOutlined,
  MailOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { formatDateForDisplay, DATE_FORMATS } from '../../utils/dateHelper';

const { Title, Text } = Typography;

const StatBox = ({ label, value, color, icon }) => (
  <Card style={{ borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }} bodyStyle={{ padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
          {value}
        </div>
      </div>
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: `${color}18`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20
      }}>
        {icon}
      </div>
    </div>
  </Card>
);

const NewsletterManagement = () => {
  const [activeTab, setActiveTab] = useState('subscribers');
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState({});

  // Queue stats state
  const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, processing: 0, sent: 0, failed: 0 });
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Detail Modal
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [subscriberDetailData, setSubscriberDetailData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchNotificationSettings();
    fetchQueueStats();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/newsletter');
      setSubscribers(response.data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      message.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await axios.get('/api/admin/newsletter/notification-settings');
      setNotificationSettings(response.data || []);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchQueueStats = async () => {
    setLoadingQueue(true);
    try {
      const response = await axios.get('/api/admin/newsletter/queue-stats');
      setQueueStats(response.data || { total: 0, pending: 0, processing: 0, sent: 0, failed: 0 });
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleToggleNotification = async (contentType, currentStatus) => {
    const nextStatus = !currentStatus;
    setUpdatingSettings(prev => ({ ...prev, [contentType]: true }));
    try {
      await axios.put('/api/admin/newsletter/notification-settings', {
        content_type: contentType,
        is_enabled: nextStatus
      });
      message.success(`Notifications for ${contentType} ${nextStatus ? 'enabled' : 'disabled'}`);
      setNotificationSettings(prev =>
        prev.map(item => item.content_type === contentType ? { ...item, is_enabled: nextStatus ? 1 : 0 } : item)
      );
    } catch (error) {
      console.error('Error updating notification setting:', error);
      message.error('Failed to update notification setting');
    } finally {
      setUpdatingSettings(prev => ({ ...prev, [contentType]: false }));
    }
  };

  const handleUnsubscribe = async (email) => {
    try {
      await axios.delete(`/api/admin/newsletter/${encodeURIComponent(email)}`);
      message.success('Subscriber unsubscribed');
      fetchSubscribers();
    } catch (error) {
      console.error('Error removing subscriber:', error);
      message.error('Failed to unsubscribe');
    }
  };

  const handleSubscribe = async (email) => {
    try {
      await axios.put(`/api/admin/newsletter/${encodeURIComponent(email)}/subscribe`);
      message.success('Subscriber re-activated successfully');
      fetchSubscribers();
    } catch (error) {
      console.error('Error subscribing member:', error);
      message.error('Failed to activate subscription');
    }
  };

  const openDetails = async (subscriberId) => {
    setSelectedSubscriber(subscriberId);
    setLoadingDetails(true);
    setSubscriberDetailData(null);
    try {
      const res = await axios.get(`/api/admin/newsletter/${subscriberId}/details`);
      setSubscriberDetailData(res.data);
    } catch (error) {
      console.error('Error loading details:', error);
      message.error('Failed to load subscriber details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter subscribers
  const filteredSubscribers = subscribers.filter(s => {
    if (statusFilter === 'active' && !s.is_active) return false;
    if (statusFilter === 'inactive' && s.is_active) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.email && s.email.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q));
  });

  const activeCount = subscribers.filter(s => s.is_active).length;
  const inactiveCount = subscribers.filter(s => !s.is_active).length;

  const subscriberColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{text || '—'}</span>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 240,
      render: (text) => (
        <a href={`mailto:${text}`} style={{ color: '#0284c7', fontWeight: 600 }}>
          {text}
        </a>
      )
    },
    {
      title: 'Source',
      dataIndex: 'last_active_source',
      key: 'source',
      width: 130,
      render: (src) => {
        const colorMap = {
          homepage: 'blue',
          footer: 'cyan',
          content_detail: 'purple',
          technology_page: 'geekblue',
          industry_page: 'green',
          articles: 'orange',
          whitepapers: 'magenta',
          case_studies: 'gold'
        };
        return (
          <Tag color={colorMap[src] || 'default'} style={{ borderRadius: 6, textTransform: 'capitalize' }}>
            {src ? src.replace(/_/g, ' ') : 'General'}
          </Tag>
        );
      }
    },
    {
      title: 'Topic Interests',
      dataIndex: 'active_interests',
      key: 'interests',
      width: 220,
      render: (v) => {
        if (!v) return <Tag color="default">General / All</Tag>;
        const list = v.split(',').map(s => s.trim()).filter(Boolean);
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {list.slice(0, 3).map((item, idx) => {
              const [type, val] = item.split(':');
              return (
                <Tag key={idx} color={type === 'industry' ? 'green' : (type === 'technology' ? 'blue' : 'orange')} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                  {val || type}
                </Tag>
              );
            })}
            {list.length > 3 && (
              <Tag style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>+{list.length - 3}</Tag>
            )}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'} style={{ borderRadius: 6, fontWeight: 700 }}>
          {isActive ? '● Active' : '○ Unsubscribed'}
        </Tag>
      )
    },
    {
      title: 'Subscribed On',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => formatDateForDisplay(date, 'MMM D, YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetails(record.id)}
            style={{ borderRadius: 6 }}
          >
            Details
          </Button>
          <Button 
            size="small"
            icon={<MailOutlined />} 
            onClick={() => window.location.href = `mailto:${record.email}`}
            style={{ borderRadius: 6 }}
          >
            Email
          </Button>
          {record.is_active ? (
            <Popconfirm
              title="Unsubscribe Member"
              description={`Unsubscribe ${record.email}?`}
              onConfirm={() => handleUnsubscribe(record.email)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger style={{ borderRadius: 6 }}>
                Unsub
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Reactivate Subscription"
              description={`Reactivate ${record.email}?`}
              onConfirm={() => handleSubscribe(record.email)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" type="primary" style={{ borderRadius: 6, background: '#10b981', borderColor: '#10b981' }}>
                Activate
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Title & Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
            Newsletter & Topic Notification Hub
          </Title>
          <Text type="secondary" style={{ fontSize: 13.5 }}>
            Manage subscriber database, topic interests, publication triggers, and delivery queue.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchSubscribers();
              fetchNotificationSettings();
              fetchQueueStats();
            }}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            Refresh All
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={4}>
          <StatBox label="Total Subscribers" value={subscribers.length} color="#0AAEEF" icon={<SendOutlined />} />
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <StatBox label="Active Members" value={activeCount} color="#10B981" icon={<CheckCircleOutlined />} />
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <StatBox label="Unsubscribed" value={inactiveCount} color="#EF4444" icon={<CloseCircleOutlined />} />
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <StatBox label="Queue Pending" value={queueStats.pending || 0} color="#F7941D" icon={<ClockCircleOutlined />} />
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <StatBox label="Emails Sent" value={queueStats.sent || 0} color="#6366F1" icon={<MailOutlined />} />
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <StatBox label="Failed / Errors" value={queueStats.failed || 0} color="#DC2626" icon={<ThunderboltOutlined />} />
        </Col>
      </Row>

      {/* Main Tabs Card */}
      <Card style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'subscribers',
              label: (
                <span>
                  <SendOutlined /> Subscribers ({subscribers.length})
                </span>
              ),
              children: (
                <div>
                  {/* Search and Filters */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                    <Input
                      placeholder="Search email or name..."
                      prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      allowClear
                      style={{ width: 300, borderRadius: 8 }}
                    />
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 170 }}
                      options={[
                        { value: 'all', label: 'All Statuses' },
                        { value: 'active', label: 'Active Only' },
                        { value: 'inactive', label: 'Unsubscribed Only' }
                      ]}
                    />
                  </div>

                  <Table
                    columns={subscriberColumns}
                    dataSource={filteredSubscribers}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                    scroll={{ x: 1000 }}
                  />
                </div>
              )
            },
            {
              key: 'notification_settings',
              label: (
                <span>
                  <SettingOutlined /> Publication Notification Settings
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      Automated Publication Notification Switches by Content Type
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                      When content of an enabled type is transitioned to <strong>Published</strong>, matching general and topic subscribers receive automated email briefings. Toggling off prevents email dispatch for that content type.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    {notificationSettings.map(setting => {
                      const isUpdating = updatingSettings[setting.content_type];
                      const isEnabled = Boolean(setting.is_enabled);
                      return (
                        <Col xs={24} sm={12} md={8} key={setting.content_type}>
                          <div style={{
                            background: '#FFFFFF',
                            border: isEnabled ? '1.5px solid #0AAEEF' : '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                          }}>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize', color: '#0F172A' }}>
                                {setting.content_type.replace(/-/g, ' ')}
                              </div>
                              <div style={{ fontSize: 12, color: isEnabled ? '#0284C7' : '#94A3B8', marginTop: 2 }}>
                                {isEnabled ? '● Active (Emails will trigger)' : '○ Disabled (No emails sent)'}
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              loading={isUpdating}
                              onChange={() => handleToggleNotification(setting.content_type, isEnabled)}
                            />
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )
            },
            {
              key: 'queue',
              label: (
                <span>
                  <ThunderboltOutlined /> Background Email Queue
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      Hostinger VPS Transactional Email Queue Worker
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                      Processes publication and welcome briefing emails asynchronously in batches of 15 with exponential backoff retries and RFC 8058 List-Unsubscribe compliance.
                    </p>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={6}>
                      <Card style={{ borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>PENDING DISPATCH</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#1E3A8A', marginTop: 4 }}>{queueStats.pending}</div>
                      </Card>
                    </Col>
                    <Col xs={24} md={6}>
                      <Card style={{ borderRadius: 10, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                        <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>IN-PROGRESS / SENDING</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#78350F', marginTop: 4 }}>{queueStats.processing}</div>
                      </Card>
                    </Col>
                    <Col xs={24} md={6}>
                      <Card style={{ borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: 12, color: '#065F46', fontWeight: 600 }}>SUCCESSFULLY SENT</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#064E3B', marginTop: 4 }}>{queueStats.sent}</div>
                      </Card>
                    </Col>
                    <Col xs={24} md={6}>
                      <Card style={{ borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>FAILED RETRIES</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#7F1D1D', marginTop: 4 }}>{queueStats.failed}</div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Subscriber Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 700 }}>
            <MailOutlined style={{ color: '#0AAEEF' }} />
            <span>Subscriber Profile Details</span>
          </div>
        }
        open={!!selectedSubscriber}
        onCancel={() => { setSelectedSubscriber(null); setSubscriberDetailData(null); }}
        footer={[
          <Button key="close" onClick={() => { setSelectedSubscriber(null); setSubscriberDetailData(null); }} style={{ borderRadius: 8 }}>
            Close
          </Button>,
          subscriberDetailData?.subscriber?.email && (
            <Button
              key="email"
              type="primary"
              icon={<SendOutlined />}
              href={`mailto:${subscriberDetailData.subscriber.email}`}
              style={{ borderRadius: 8, background: '#0AAEEF', borderColor: '#0AAEEF' }}
            >
              Compose Email
            </Button>
          )
        ]}
        width={780}
      >
        {loadingDetails ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ReloadOutlined spin style={{ fontSize: 28, color: '#0AAEEF' }} />
            <div style={{ marginTop: 12, color: '#64748b' }}>Loading subscriber data...</div>
          </div>
        ) : subscriberDetailData?.subscriber ? (
          <div style={{ marginTop: 16 }}>
            {/* Account Details */}
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Email">
                <strong>{subscriberDetailData.subscriber.email}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                {subscriberDetailData.subscriber.name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {subscriberDetailData.subscriber.is_active ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag color="red">Unsubscribed</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                <Tag color="blue" style={{ textTransform: 'capitalize' }}>
                  {subscriberDetailData.subscriber.last_active_source || 'general'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Subscribed At">
                {formatDateForDisplay(subscriberDetailData.subscriber.created_at, DATE_FORMATS.DATE_TIME)}
              </Descriptions.Item>
              <Descriptions.Item label="Unsubscribed At">
                {subscriberDetailData.subscriber.unsubscribed_at ? formatDateForDisplay(subscriberDetailData.subscriber.unsubscribed_at, DATE_FORMATS.DATE_TIME) : '—'}
              </Descriptions.Item>
              {subscriberDetailData.subscriber.unsubscribe_reason && (
                <Descriptions.Item label="Unsubscribe Reason" span={2}>
                  <span style={{ color: '#ef4444', fontStyle: 'italic' }}>
                    {subscriberDetailData.subscriber.unsubscribe_reason}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Notification Preferences */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Delivery Preferences
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Tag color={subscriberDetailData.subscriber.preferences_instant_alerts ? 'blue' : 'default'}>
                  Instant Alerts: {subscriberDetailData.subscriber.preferences_instant_alerts ? 'ON' : 'OFF'}
                </Tag>
                <Tag color={subscriberDetailData.subscriber.preferences_weekly_digest ? 'green' : 'default'}>
                  Weekly Digest: {subscriberDetailData.subscriber.preferences_weekly_digest ? 'ON' : 'OFF'}
                </Tag>
                <Tag color={subscriberDetailData.subscriber.preferences_general_alerts ? 'cyan' : 'default'}>
                  General Alerts: {subscriberDetailData.subscriber.preferences_general_alerts ? 'ON' : 'OFF'}
                </Tag>
                <Tag color={subscriberDetailData.subscriber.preferences_technology_alerts ? 'geekblue' : 'default'}>
                  Tech Alerts: {subscriberDetailData.subscriber.preferences_technology_alerts ? 'ON' : 'OFF'}
                </Tag>
                <Tag color={subscriberDetailData.subscriber.preferences_industry_alerts ? 'gold' : 'default'}>
                  Industry Alerts: {subscriberDetailData.subscriber.preferences_industry_alerts ? 'ON' : 'OFF'}
                </Tag>
              </div>
            </div>

            {/* Registered Topics & Interests */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Registered Topics & Interests ({subscriberDetailData.interests?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {subscriberDetailData.interests && subscriberDetailData.interests.length > 0 ? (
                  subscriberDetailData.interests.map((it, idx) => (
                    <Tag
                      key={idx}
                      color={it.interest_type === 'industry' ? 'green' : (it.interest_type === 'technology' ? 'blue' : 'orange')}
                      style={{ borderRadius: 4, padding: '3px 8px' }}
                    >
                      {it.interest_type.toUpperCase()}: <strong>{it.interest_value}</strong>
                    </Tag>
                  ))
                ) : (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>General / All content (No specific filters)</span>
                )}
              </div>
            </div>

            {/* Touchpoint Activity History */}
            {subscriberDetailData.activities && subscriberDetailData.activities.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Subscription Touchpoint History
                </h4>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={subscriberDetailData.activities}
                  rowKey="id"
                  columns={[
                    { title: 'Source', dataIndex: 'subscription_source', key: 'src', render: s => <Tag color="blue">{s}</Tag> },
                    { title: 'Page Title / Content', dataIndex: 'source_page_title', key: 'title', render: t => t || '—' },
                    { title: 'Interest', dataIndex: 'interest_value', key: 'val', render: (v, r) => `${r.interest_type}:${v}` },
                    { title: 'Date', dataIndex: 'created_at', key: 'dt', render: d => formatDateForDisplay(d, 'YYYY-MM-DD HH:mm') }
                  ]}
                />
              </div>
            )}

            {/* Notification Sent History */}
            {subscriberDetailData.notifications && subscriberDetailData.notifications.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Publications Dispatched to this Subscriber
                </h4>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={subscriberDetailData.notifications}
                  rowKey="id"
                  columns={[
                    { title: 'Content Title', dataIndex: 'content_title', key: 'title', render: t => t || 'Publication' },
                    { title: 'Notification Type', dataIndex: 'notification_type', key: 'type', render: nt => <Tag color="geekblue">{nt}</Tag> },
                    { title: 'Sent At', dataIndex: 'sent_at', key: 'sent', render: d => formatDateForDisplay(d, 'YYYY-MM-DD HH:mm') }
                  ]}
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default NewsletterManagement;
