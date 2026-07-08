import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Input, message, Avatar, Tooltip, Badge } from 'antd';
import {
  DownloadOutlined, SearchOutlined, ReloadOutlined,
  MailOutlined, PhoneOutlined, FileTextOutlined,
  FilePdfOutlined, UserOutlined, CalendarOutlined,
  FormOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    border: '1px solid #f0f0f0', flex: 1, minWidth: 160,
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: color + '15', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <span style={{ color, fontSize: 20 }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const getInitials = (first, last) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

const AVATAR_COLORS = ['#4a7cff', '#6c5ce7', '#00b894', '#e17055', '#fdcb6e', '#0984e3', '#e84393'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [allContents, setAllContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [contentFilter, setContentFilter] = useState(null);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  useEffect(() => { fetchSubmissions(); }, [page, contentFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (contentFilter) params.content_id = contentFilter;
      const res = await axios.get('/api/admin/submissions', { params });
      const data = res.data?.data || [];
      setSubmissions(data);
      setTotal(res.data?.total || 0);
      if (!contentFilter) {
        const unique = [...new Map(
          data.filter(s => s.content_id && s.content_title)
            .map(s => [s.content_id, { id: s.content_id, title: s.content_title }])
        ).values()];
        setAllContents(prev => {
          const merged = new Map([...prev, ...unique].map(c => [c.id, c]));
          return [...merged.values()];
        });
      }
    } catch {
      message.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = filtered.map(s => [
      s.id, s.first_name, s.last_name, s.email, s.contact_number,
      s.content_title || '-',
      s.extra_fields ? JSON.stringify(typeof s.extra_fields === 'string' ? JSON.parse(s.extra_fields) : s.extra_fields) : '-',
      moment(s.created_at).format('YYYY-MM-DD HH:mm')
    ]);
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Contact', 'Article', 'Extra Fields', 'Submitted At'];
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `submissions-${moment().format('YYYY-MM-DD')}.csv`
    });
    a.click();
  };

  const filtered = submissions.filter(s =>
    !search || `${s.first_name} ${s.last_name} ${s.email} ${s.contact_number || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const uniqueContents = allContents;

  const todayCount = submissions.filter(s =>
    moment(s.created_at).isSame(moment(), 'day')
  ).length;

  const accessGranted = submissions.filter(s => s.has_access).length;

  const columns = [
    {
      title: 'Subscriber',
      key: 'subscriber',
      width: 220,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={36}
            style={{ background: avatarColor(r.first_name), fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          >
            {getInitials(r.first_name, r.last_name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
              {r.first_name} {r.last_name}
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>ID #{r.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      width: 230,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href={`mailto:${r.email}`} style={{ fontSize: 12, color: '#4a7cff', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MailOutlined style={{ fontSize: 11 }} /> {r.email}
          </a>
          {r.contact_number && (
            <span style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 5 }}>
              <PhoneOutlined style={{ fontSize: 11, color: '#8c8c8c' }} /> {r.contact_number}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Article',
      dataIndex: 'content_title',
      width: 220,
      render: v => v ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <FileTextOutlined style={{ color: '#4a7cff', fontSize: 13, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#1a1a2e', lineHeight: 1.4 }}>{v}</span>
        </div>
      ) : <span style={{ color: '#d9d9d9', fontSize: 12 }}>—</span>,
    },
    {
      title: 'Extra Fields',
      dataIndex: 'extra_fields',
      width: 220,
      render: (val) => {
        if (!val) return <span style={{ color: '#d9d9d9', fontSize: 12 }}>—</span>;
        let data;
        try { data = typeof val === 'string' ? JSON.parse(val) : val; } catch { return <span style={{ color: '#d9d9d9' }}>—</span>; }
        const entries = Object.entries(data);
        if (!entries.length) return <span style={{ color: '#d9d9d9', fontSize: 12 }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.map(([k, v]) => (
              <div key={k} style={{ fontSize: 11 }}>
                <span style={{
                  display: 'inline-block', background: '#f0f5ff',
                  color: '#4a7cff', borderRadius: 4, padding: '1px 6px',
                  fontWeight: 600, marginRight: 4
                }}>{k}</span>
                <span style={{ color: '#1a1a2e' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'API URL',
      key: 'api_url',
      width: 80,
      align: 'center',
      render: (_, r) => {
        const apiUrl = `${window.location.origin}/api/public/submission/${r.id}`;
        return (
          <Tooltip title={apiUrl} placement="left">
            <Button
              size="small"
              type="text"
              icon={<span style={{ fontSize: 13 }}>🔗</span>}
              onClick={() => {
                navigator.clipboard.writeText(apiUrl);
                message.success('API URL copied!');
              }}
              style={{ height: 28, padding: '0 6px' }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'PDF',
      dataIndex: 'pdf_file',
      width: 80,
      align: 'center',
      render: v => v ? (
        <Tooltip title="Download PDF">
          <Button
            size="small" type="text"
            href={`/uploads/${v}`} target="_blank"
            icon={<FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />}
            style={{ height: 28, width: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Tooltip>
      ) : <span style={{ color: '#d9d9d9', fontSize: 12 }}>—</span>,
    },
    {
      title: 'Access',
      dataIndex: 'has_access',
      width: 100,
      align: 'center',
      render: v => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
          background: v ? '#f6ffed' : '#fafafa',
          color: v ? '#52c41a' : '#8c8c8c',
          border: `1px solid ${v ? '#b7eb8f' : '#e8e8e8'}`
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: v ? '#52c41a' : '#d9d9d9', display: 'inline-block' }} />
          {v ? 'Granted' : 'Pending'}
        </span>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      width: 130,
      render: v => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 500 }}>{moment(v).format('MMM D, YYYY')}</span>
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>{moment(v).format('h:mm A')}</span>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f7f8fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Landing Page Submissions</h1>
          <p style={{ fontSize: 13, color: '#8c8c8c', margin: '4px 0 0' }}>
            Track and manage all form submissions from your published content
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchSubmissions} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
          <Button
            icon={<DownloadOutlined />} onClick={exportCSV} type="primary"
            style={{ borderRadius: 8, background: '#4a7cff', borderColor: '#4a7cff' }}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon={<FormOutlined />} label="Total Submissions" value={total} color="#4a7cff" />
        <StatCard icon={<CalendarOutlined />} label="Today" value={todayCount} color="#6c5ce7" />
        <StatCard icon={<UserOutlined />} label="Access Granted" value={accessGranted} color="#00b894" />
        <StatCard icon={<FileTextOutlined />} label="Articles Tracked" value={uniqueContents.length} color="#e17055" />
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '16px 20px',
        border: '1px solid #f0f0f0', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <Input
          placeholder="Search by name, email or phone..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: 300, borderRadius: 8 }}
        />
        <Select
          placeholder="Filter by article"
          style={{ width: 280, borderRadius: 8 }}
          allowClear
          value={contentFilter}
          onChange={v => { setContentFilter(v); setPage(1); }}
          showSearch
          optionFilterProp="children"
        >
          {uniqueContents.map(c => <Option key={c.id} value={c.id}>{c.title}</Option>)}
        </Select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#8c8c8c' }}>
          Showing <strong style={{ color: '#1a1a2e' }}>{filtered.length}</strong> of <strong style={{ color: '#1a1a2e' }}>{total}</strong> results
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 12,
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: p => setPage(p),
            showSizeChanger: false,
            showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} submissions`,
            style: { padding: '12px 20px', margin: 0 }
          }}
          size="middle"
          rowClassName={() => 'submission-row'}
          style={{ fontSize: 13 }}
          onRow={() => ({
            style: { cursor: 'default' }
          })}
        />
      </div>

      <style>{`
        .submission-row:hover td { background: #fafbff !important; }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #8c8c8c !important;
          border-bottom: 1px solid #f0f0f0 !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid #f7f8fa !important;
          vertical-align: middle !important;
        }
        .ant-table-pagination { padding: 12px 20px !important; }
      `}</style>
    </div>
  );
};

export default AdminSubmissions;
