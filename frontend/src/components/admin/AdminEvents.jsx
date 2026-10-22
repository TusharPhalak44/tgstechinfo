import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Drawer, 
  Form, 
  DatePicker, 
  Space, 
  Popconfirm, 
  message, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Switch, 
  InputNumber,
  Badge,
  Tooltip
} from 'antd';
import { 
  CalendarOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined, 
  DownloadOutlined, 
  EyeOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import eventService from '../../services/eventService';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;
const { TextArea } = Input;

export default function AdminEvents() {
  const { darkMode } = useTheme();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form Drawer (Create / Edit)
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [eventModeWatch, setEventModeWatch] = useState('online');
  const [regTypeWatch, setRegTypeWatch] = useState('tgs');

  // Attendees Drawer
  const [attendeesDrawerVisible, setAttendeesDrawerVisible] = useState(false);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getAdminEvents({
        search: searchTerm,
        status: statusFilter,
        type: typeFilter
      });
      if (res && res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load admin events:', err);
      message.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, typeFilter]);

  const handleSearch = () => {
    fetchEvents();
  };

  // Open Create Drawer
  const handleOpenCreate = () => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({
      event_type: 'webinar',
      event_mode: 'online',
      registration_type: 'tgs',
      ticket_type: 'free',
      ticket_price: 0,
      max_capacity: 0,
      status: 'published',
      featured: false,
      timezone: 'IST (UTC+5:30)',
      online_platform: 'Zoom'
    });
    setEventModeWatch('online');
    setRegTypeWatch('tgs');
    setDrawerVisible(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (record) => {
    setEditingEvent(record);
    form.resetFields();
    form.setFieldsValue({
      ...record,
      virtual_join_url: record.virtual_join_url || record.online_join_url || '',
      registration_type: record.registration_type || 'tgs',
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
      featured: Boolean(record.featured)
    });
    setEventModeWatch(record.event_mode || 'online');
    setRegTypeWatch(record.registration_type || 'tgs');
    setDrawerVisible(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (values) => {
    setSaving(true);
    try {
      const joinUrlValue = values.virtual_join_url || values.online_join_url || null;
      const payload = {
        ...values,
        online_join_url: joinUrlValue,
        virtual_join_url: joinUrlValue,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD HH:mm:ss') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD HH:mm:ss') : null,
        featured: values.featured ? 1 : 0
      };

      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, payload);
        message.success('Event updated successfully!');
      } else {
        await eventService.createEvent(payload);
        message.success('Event created and published successfully!');
      }

      setDrawerVisible(false);
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      message.error(err?.response?.data?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id) => {
    try {
      await eventService.deleteEvent(id);
      message.success('Event deleted successfully.');
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
      message.error('Failed to delete event.');
    }
  };

  // Open Attendees Drawer
  const handleOpenAttendees = async (event) => {
    setSelectedEventForAttendees(event);
    setAttendeesDrawerVisible(true);
    fetchAttendees(event.id);
  };

  const fetchAttendees = async (eventId, search = '') => {
    setLoadingAttendees(true);
    try {
      const res = await eventService.getEventAttendees(eventId, { search });
      if (res && res.success) {
        setAttendees(res.attendees || []);
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
      message.error('Failed to load attendees list.');
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Update Attendee Status
  const handleUpdateAttendeeStatus = async (registrationId, newStatus) => {
    try {
      await eventService.updateAttendeeStatus(registrationId, newStatus);
      message.success(`Status updated to ${newStatus}`);
      if (selectedEventForAttendees) {
        fetchAttendees(selectedEventForAttendees.id, attendeeSearch);
      }
      fetchEvents();
    } catch (err) {
      console.error('Failed to update status:', err);
      message.error('Failed to update attendee status.');
    }
  };

  // Compute Metrics
  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date()).length;
  const totalRegistrations = events.reduce((sum, e) => sum + (parseInt(e.total_registered, 10) || 0), 0);
  const totalAttended = events.reduce((sum, e) => sum + (parseInt(e.total_attended, 10) || 0), 0);

  // Table Columns
  const columns = [
    {
      title: 'Event Details',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={record.banner_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&auto=format&fit=crop&q=80'}
            alt=""
            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#F1F5F9' : '#0B1F4D' }}>
              {record.title}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 8, marginTop: 4 }}>
              <Tag color={record.event_mode === 'online' ? 'cyan' : 'purple'} style={{ fontSize: 11, margin: 0 }}>
                {record.event_mode}
              </Tag>
              <Tag color="orange" style={{ fontSize: 11, margin: 0, textTransform: 'uppercase' }}>
                {record.event_type}
              </Tag>
              {record.featured === 1 && <Tag color="gold" style={{ fontSize: 11, margin: 0 }}>Featured</Tag>}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Date & Time',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 180,
      render: (date, record) => {
        const isUpcoming = new Date(date) >= new Date();
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: isUpcoming ? '#0284c7' : '#64748b' }}>
              {dayjs(date).format('MMM D, YYYY')}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {dayjs(date).format('h:mm A')} {record.timezone}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Capacity & RSVPs',
      key: 'rsvps',
      width: 150,
      render: (_, record) => {
        const count = record.total_registered || 0;
        const cap = record.max_capacity;
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: count > 0 ? '#10B981' : '#64748B' }}>
              {count} {cap > 0 ? `/ ${cap}` : 'Registered'}
            </div>
            {cap > 0 && (
              <div style={{ fontSize: 11, color: count >= cap ? '#EF4444' : '#64748B' }}>
                {count >= cap ? 'Full Capacity' : `${cap - count} seats left`}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'default' : 'red';
        return <Tag color={color} style={{ textTransform: 'uppercase', fontWeight: 700 }}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View registered attendees & export CSV">
            <Button
              size="small"
              icon={<TeamOutlined />}
              onClick={() => handleOpenAttendees(record)}
              style={{ fontWeight: 600 }}
            >
              RSVPs ({record.total_registered || 0})
            </Button>
          </Tooltip>

          <Tooltip title="Edit Event">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>

          <Tooltip title="View Live Page">
            <a href={`/events/${record.slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="small" icon={<EyeOutlined />} />
            </a>
          </Tooltip>

          <Popconfirm
            title="Delete Event"
            description="Are you sure you want to delete this event? All attendee registrations will also be removed."
            onConfirm={() => handleDeleteEvent(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* ── TOP METRICS CARDS ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748B' }}>Total Events</span>}
              value={totalEvents}
              prefix={<CalendarOutlined style={{ color: '#0284C7' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748B' }}>Upcoming Events</span>}
              value={upcomingEvents}
              prefix={<ClockCircleOutlined style={{ color: '#F7941D' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748B' }}>Total Registered Leads</span>}
              value={totalRegistrations}
              prefix={<TeamOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748B' }}>Verified Attendees</span>}
              value={totalAttended}
              prefix={<CheckCircleOutlined style={{ color: '#8B5CF6' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ── ACTION BAR ── */}
      <div style={{
        background: darkMode ? '#152033' : '#FFFFFF',
        padding: '16px 20px',
        borderRadius: 12,
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search events or speakers..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260 }}
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
          >
            <Option value="all">All Status</Option>
            <Option value="published">Published</Option>
            <Option value="draft">Draft</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>

          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Formats</Option>
            <Option value="webinar">Webinar</Option>
            <Option value="workshop">Workshop</Option>
            <Option value="conference">Conference</Option>
            <Option value="hackathon">Hackathon</Option>
            <Option value="meetup">Meetup</Option>
          </Select>

          <Button type="default" onClick={handleSearch}>Filter</Button>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #0B1F4D 0%, #1E3A8A 100%)',
            fontWeight: 700,
            height: 40,
            borderRadius: 8
          }}
        >
          Create New Event
        </Button>
      </div>

      {/* ── EVENTS TABLE ── */}
      <Table
        columns={columns}
        dataSource={events}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{
          background: darkMode ? '#152033' : '#FFFFFF',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      />

      {/* ── CREATE / EDIT EVENT DRAWER ── */}
      <Drawer
        title={editingEvent ? `Edit Event: ${editingEvent.title}` : 'Create & Publish New Event'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            {editingEvent ? 'Save Changes' : 'Publish Event'}
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEvent}
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600 }}>Event Title</span>}
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input placeholder="e.g. Next-Gen Cloud Architecture & AI Summit 2026" size="large" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="slug"
              label={<span style={{ fontWeight: 600 }}>Custom URL Slug (optional)</span>}
              tooltip="Leave empty to auto-generate from title"
            >
              <Input placeholder="e.g. cloud-ai-summit-2026" />
            </Form.Item>

            <Form.Item
              name="event_type"
              label={<span style={{ fontWeight: 600 }}>Event Format</span>}
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="webinar">Webinar</Option>
                <Option value="workshop">Workshop</Option>
                <Option value="conference">Conference / Summit</Option>
                <Option value="hackathon">Hackathon</Option>
                <Option value="meetup">Meetup</Option>
                <Option value="panel">Panel Discussion</Option>
                <Option value="ama">Ask Me Anything (AMA)</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="event_mode"
              label={<span style={{ fontWeight: 600 }}>Location Mode</span>}
              rules={[{ required: true }]}
            >
              <Select onChange={(val) => setEventModeWatch(val)}>
                <Option value="online">Virtual / Online</Option>
                <Option value="offline">In-Person / Offline</Option>
                <Option value="hybrid">Hybrid (Both)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="timezone"
              label={<span style={{ fontWeight: 600 }}>Timezone</span>}
            >
              <Input placeholder="IST (UTC+5:30)" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="start_date"
              label={<span style={{ fontWeight: 600 }}>Start Date & Time</span>}
              rules={[{ required: true, message: 'Start date and time are required' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="end_date"
              label={<span style={{ fontWeight: 600 }}>End Date & Time</span>}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="source_url"
            label={<span style={{ fontWeight: 600 }}>Event Source URL</span>}
            tooltip="Official webpage or source page containing information about this event. Never used as join link."
            rules={[{ type: 'url', message: 'Must be a valid HTTP or HTTPS URL' }]}
          >
            <Input placeholder="https://example.com/event-page (Official event source page)" />
          </Form.Item>

          {/* Registration Section */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#10B981', marginBottom: 10 }}>
              📋 Registration Configuration
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: regTypeWatch === 'external' ? '1fr 1.5fr' : '1fr', gap: 12 }}>
              <Form.Item
                name="registration_type"
                label={<span style={{ fontWeight: 600 }}>Registration Type</span>}
                rules={[{ required: true }]}
                initialValue="tgs"
              >
                <Select onChange={(val) => setRegTypeWatch(val)}>
                  <Option value="tgs">TGS Registration (Built-in Form, Code & Emails)</Option>
                  <Option value="external">External Registration (Organizer Website)</Option>
                </Select>
              </Form.Item>

              {regTypeWatch === 'external' && (
                <Form.Item
                  name="registration_url"
                  label={<span style={{ fontWeight: 600 }}>Registration URL</span>}
                  tooltip="External page where visitors can register for this event."
                  rules={[
                    { required: true, message: 'Please provide external registration URL' },
                    { type: 'url', message: 'Must be a valid HTTP or HTTPS URL' }
                  ]}
                >
                  <Input placeholder="https://organizer.com/register" />
                </Form.Item>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {regTypeWatch === 'tgs' 
                ? '✓ Visitors register on TGS platform. Confirmation email and calendar invite (.ics) sent automatically upon registration.'
                : '✓ Visitors register directly on organizer website. TGS will not send registration emails.'}
            </div>
          </div>

          {/* Conditional Online / Offline fields */}
          {(eventModeWatch === 'online' || eventModeWatch === 'hybrid') && (
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0284c7' }}>
                  💻 Virtual Attendance & Join Link <span style={{ fontWeight: 'normal', color: '#64748B' }}>(Optional)</span>
                </span>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                  🔒 Kept Private Until Registration
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <Form.Item name="online_platform" label="Platform">
                  <Select>
                    <Option value="Zoom">Zoom</Option>
                    <Option value="Google Meet">Google Meet</Option>
                    <Option value="Microsoft Teams">Microsoft Teams</Option>
                    <Option value="YouTube Live">YouTube Live</Option>
                    <Option value="Webex">Cisco Webex</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
                <Form.Item 
                  name="virtual_join_url" 
                  label="Virtual Join URL (Optional)"
                  tooltip="Actual Zoom, Google Meet, Microsoft Teams, Webex, or other meeting URL used to attend the event. Can be added later."
                  rules={[{ type: 'url', message: 'Must be a valid HTTP or HTTPS URL' }]}
                >
                  <Input placeholder="https://zoom.us/j/... or https://meet.google.com/ (Optional)" />
                </Form.Item>
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                🛡️ Sensitive: Protected join URL. Never exposed publicly on event detail page. Attendees receive it securely via confirmation email.
              </div>
            </div>
          )}

          {(eventModeWatch === 'offline' || eventModeWatch === 'hybrid') && (
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#8B5CF6', marginBottom: 10 }}>
                🏢 Physical Venue Details
              </div>
              <Form.Item name="venue_name" label="Venue Name">
                <Input placeholder="e.g. Cyber City IT Park, Convention Hall A" />
              </Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Form.Item name="venue_address" label="Street Address">
                  <Input placeholder="Sector 5, MIDC..." />
                </Form.Item>
                <Form.Item name="venue_city" label="City">
                  <Input placeholder="Pune / Mumbai" />
                </Form.Item>
              </div>
              <Form.Item name="venue_map_url" label="Google Maps Link">
                <Input placeholder="https://maps.google.com/..." />
              </Form.Item>
            </div>
          )}

          <Form.Item
            name="short_description"
            label={<span style={{ fontWeight: 600 }}>Short Summary</span>}
            tooltip="Brief 2-3 sentence overview shown on cards and search results"
          >
            <TextArea rows={2} placeholder="Join leading architects as we discuss cloud scalability..." />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600 }}>Full Agenda & Content (HTML supported)</span>}
          >
            <TextArea rows={5} placeholder="<p>Full event agenda, session timings, and speaker details...</p>" />
          </Form.Item>

          <Form.Item
            name="banner_image"
            label={<span style={{ fontWeight: 600 }}>Banner Image URL</span>}
          >
            <Input placeholder="https://images.unsplash.com/... or /uploads/..." />
          </Form.Item>

          {/* Keynote Speaker Section */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#F7941D', marginBottom: 10 }}>
              🎤 Keynote Speaker Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="speaker_name" label="Speaker Name">
                <Input placeholder="e.g. Dr. Rajesh Sharma" />
              </Form.Item>
              <Form.Item name="speaker_role" label="Role / Designation">
                <Input placeholder="e.g. Principal Architect" />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="speaker_company" label="Organization / Company">
                <Input placeholder="e.g. Google Cloud / TCS" />
              </Form.Item>
              <Form.Item name="speaker_image" label="Speaker Photo URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </div>
            <Form.Item name="speaker_bio" label="Speaker Bio">
              <TextArea rows={2} placeholder="Brief background of the speaker..." />
            </Form.Item>
          </div>

          {/* Capacity & Ticket Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item
              name="ticket_type"
              label={<span style={{ fontWeight: 600 }}>Ticket Model</span>}
            >
              <Select>
                <Option value="free">Free Registration</Option>
                <Option value="paid">Paid Ticket</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="max_capacity"
              label={<span style={{ fontWeight: 600 }}>Max Capacity</span>}
              tooltip="0 means unlimited seating"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span style={{ fontWeight: 600 }}>Status</span>}
            >
              <Select>
                <Option value="published">Published</Option>
                <Option value="draft">Draft</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="completed">Completed</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="featured" valuePropName="checked">
            <Switch /> <span style={{ marginLeft: 8, fontWeight: 600 }}>Pin as Featured Event on Homepage & Events Hub</span>
          </Form.Item>
        </Form>
      </Drawer>

      {/* ── ATTENDEES DRAWER (RSVP MANAGEMENT) ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <span>RSVPs & Attendees: {selectedEventForAttendees?.title}</span>
            {selectedEventForAttendees && (
              <a href={eventService.getExportCsvUrl(selectedEventForAttendees.id)} download>
                <Button type="primary" icon={<FileExcelOutlined />} style={{ background: '#10B981', borderColor: '#10B981' }}>
                  Export CSV
                </Button>
              </a>
            )}
          </div>
        }
        width={850}
        open={attendeesDrawerVisible}
        onClose={() => setAttendeesDrawerVisible(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search attendee by name, email, code or company..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={attendeeSearch}
            onChange={(e) => {
              setAttendeeSearch(e.target.value);
              if (selectedEventForAttendees) {
                fetchAttendees(selectedEventForAttendees.id, e.target.value);
              }
            }}
            allowClear
          />
        </div>

        <Table
          dataSource={attendees}
          rowKey="id"
          loading={loadingAttendees}
          pagination={{ pageSize: 15 }}
          columns={[
            {
              title: 'Ticket Code',
              dataIndex: 'registration_code',
              key: 'code',
              width: 140,
              render: (code) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{code}</Tag>
            },
            {
              title: 'Attendee',
              key: 'name',
              render: (_, r) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div>
                  <div style={{ fontSize: 12, color: '#0284c7' }}>{r.email}</div>
                  {r.phone && <div style={{ fontSize: 11, color: '#64748b' }}>📞 {r.phone}</div>}
                </div>
              )
            },
            {
              title: 'Organization',
              key: 'org',
              render: (_, r) => (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.company_name || '—'}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{r.job_title || ''}</div>
                </div>
              )
            },
            {
              title: 'Registered At',
              dataIndex: 'registered_at',
              key: 'registered_at',
              width: 130,
              render: (d) => d ? dayjs(d).format('MMM D, h:mm A') : '—'
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              width: 130,
              render: (status, record) => (
                <Select
                  value={status}
                  size="small"
                  style={{ width: 110 }}
                  onChange={(newStatus) => handleUpdateAttendeeStatus(record.id, newStatus)}
                >
                  <Option value="confirmed">Confirmed</Option>
                  <Option value="attended">Attended</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              )
            }
          ]}
        />
      </Drawer>
    </div>
  );
}
