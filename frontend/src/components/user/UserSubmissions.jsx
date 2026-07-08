import React, { useState, useEffect } from 'react';
import { Table, Select, Input, Button, message, Tooltip, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined, MailOutlined, PhoneOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const UserSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [contentFilter, setContentFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const pageSize = 20;

  useEffect(() => { fetchSubmissions(); }, [page, contentFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = { limit: pageSize, offset: (page - 1) * pageSize };
      if (contentFilter) params.content_id = contentFilter;
      const res = await axios.get('/api/user/submissions', { params });
      const data = res.data?.data || [];
      setSubmissions(data);
      setTotal(res.data?.total || 0);
      // Build article list for filter dropdown
      if (!contentFilter) {
        const unique = [...new Map(
          data.filter(s => s.content_id && s.content_title)
            .map(s => [s.content_id, { id: s.content_id, title: s.content_title }])
        ).values()];
        setArticles(prev => {
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

  const filtered = submissions.filter(s =>
    !search || `${s.first_name} ${s.last_name} ${s.email} ${s.contact_number || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Subscriber',
      key: 'subscriber',
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.first_name} {r.last_name}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>ID #{r.id}</div>
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
                <span style={{ display: 'inline-block', background: '#f0f5ff', color: '#4a7cff', borderRadius: 4, padding: '1px 6px', fontWeight: 600, marginRight: 4 }}>{k}</span>
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
              size="small" type="text"
              icon={<span style={{ fontSize: 13 }}>🔗</span>}
              onClick={() => { navigator.clipboard.writeText(apiUrl); message.success('API URL copied!'); }}
              style={{ height: 28, padding: '0 6px' }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Access',
      dataIndex: 'has_access',
      width: 100,
      align: 'center',
      render: v => (
        <Tag color={v ? 'success' : 'default'} style={{ fontSize: 11 }}>
          {v ? 'Granted' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      width: 130,
      render: v => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{moment(v).format('MMM D, YYYY')}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{moment(v).format('h:mm A')}</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f7f8fa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>My Article Submissions</h1>
          <p style={{ fontSize: 13, color: '#8c8c8c', margin: '4px 0 0' }}>
            Visitors who submitted the landing page form for your articles
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchSubmissions} style={{ borderRadius: 8 }}>Refresh</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Submissions', value: total, color: '#4a7cff' },
          { label: 'Articles Tracked', value: articles.length, color: '#e17055' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', border: '1px solid #f0f0f0', minWidth: 160 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0f0f0', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
          style={{ width: 280 }}
          allowClear
          value={contentFilter}
          onChange={v => { setContentFilter(v); setPage(1); }}
          showSearch
          optionFilterProp="children"
        >
          {articles.map(c => <Option key={c.id} value={c.id}>{c.title}</Option>)}
        </Select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#8c8c8c' }}>
          Showing <strong style={{ color: '#1a1a2e' }}>{filtered.length}</strong> of <strong style={{ color: '#1a1a2e' }}>{total}</strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
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
        />
      </div>
    </div>
  );
};

export default UserSubmissions;
