import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, message, Popconfirm, Select, Tag, Tooltip, ConfigProvider } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TagsOutlined,
  ReloadOutlined,
  TagOutlined,
  FileTextOutlined,
  LinkOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const tagStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .tag-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: tagFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes tagFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tag-stagger-1 { animation: tagSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .tag-stagger-2 { animation: tagSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .tag-stagger-3 { animation: tagSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes tagSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tag-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #8B5CF6;
    position: relative;
    display: inline-block;
  }
  .tag-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #8B5CF6;
    animation: tagPulse 2s ease-out infinite;
  }
  @keyframes tagPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .tag-kpi-card {
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
  .tag-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const Tags = () => {
  const { darkMode } = useTheme();
  const D = darkMode;
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('usage_count');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [stats, setStats] = useState({
    total: 0,
    mostUsed: 0,
    unused: 0,
    avgUsage: 0
  });

  const fetchTags = async (page = 1, search = '', sortField = 'usage_count', sortDir = 'DESC') => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tags', {
        params: { page, limit: pagination.pageSize, search, sortBy: sortField, sortOrder: sortDir },
      });
      if (response.data.success) {
        const data = response.data.data;
        setTags(data);
        setPagination({
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total,
        });
        
        const totalUsage = data.reduce((sum, tag) => sum + (tag.usage_count || 0), 0);
        const mostUsedTag = data.length > 0 ? Math.max(...data.map(t => t.usage_count || 0)) : 0;
        const unusedTags = data.filter(t => (t.usage_count || 0) === 0).length;
        const avgUsage = data.length > 0 ? Math.round(totalUsage / data.length) : 0;
        
        setStats({
          total: response.data.pagination.total,
          mostUsed: mostUsedTag,
          unused: unusedTags,
          avgUsage: avgUsage
        });
      }
    } catch (error) {
      message.error('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchTags(1, val, sortBy, sortOrder);
  };

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    form.setFieldsValue(tag);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/tags/${id}`);
      message.success('Tag deleted successfully');
      fetchTags(pagination.current, searchQuery, sortBy, sortOrder);
    } catch (error) {
      message.error('Failed to delete tag');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTag) {
        await axios.put(`/api/tags/${editingTag.id}`, values);
        message.success('Tag updated successfully');
      } else {
        await axios.post('/api/tags', values);
        message.success('Tag created successfully');
      }
      setModalVisible(false);
      fetchTags(pagination.current, searchQuery, sortBy, sortOrder);
    } catch (error) {
      message.error('Failed to save tag');
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      purple: { bg: D ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
    };
    const c = colorMap[color] || colorMap.purple;

    return (
      <div
        className="tag-kpi-card"
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
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id) => <span style={{ fontWeight: 700, color: D ? '#64748B' : '#94A3B8', fontSize: '0.78rem' }}>#{id}</span>,
    },
    {
      title: 'Tag Identifier',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space size={10}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: D ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
            <TagOutlined />
          </div>
          <span style={{ fontWeight: 700, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.86rem' }}>
            #{text}
          </span>
        </Space>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => (
        <code style={{ background: D ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9', color: '#8B5CF6', padding: '3px 9px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${D ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}` }}>
          /{slug}
        </code>
      ),
    },
    {
      title: 'Publications Linked',
      dataIndex: 'usage_count',
      key: 'usage_count',
      render: (count) => (
        <Tag 
          color={count > 0 ? 'green' : 'default'} 
          style={{ borderRadius: 6, fontWeight: 700, padding: '2px 9px', fontSize: '0.75rem' }}
          icon={<LinkOutlined />}
        >
          {count || 0} Articles
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit Tag">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ borderRadius: 8, color: '#8B5CF6', background: D ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.06)' }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this tag?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Tag">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                style={{ borderRadius: 8, background: D ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)' }}
              />
            </Tooltip>
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
      <style>{tagStyles}</style>

      <div className="tag-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="tag-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="tag-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8B5CF6' }}>
                Content Indexing & Topics
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Indexed Tags
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TagsOutlined style={{ color: '#8B5CF6' }} /> Tags & Topic Indexing
            </h1>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{
              background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Create New Tag
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="tag-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Topic Tags" value={stats.total} icon={<TagsOutlined />} color="purple" accentColor="#8B5CF6" subtitle="Registered Topic Keys" />
          <StatCard title="Peak Linking Density" value={stats.mostUsed} icon={<FireOutlined />} color="success" accentColor="#10B981" subtitle="Top Linked Articles" />
          <StatCard title="Unreferenced Tags" value={stats.unused} icon={<TagOutlined />} color="warning" accentColor="#F59E0B" subtitle="Pending Usage" />
          <StatCard title="Average Density" value={stats.avgUsage} icon={<LinkOutlined />} color="info" accentColor="#3B82F6" subtitle="Links Per Tag" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="tag-stagger-3"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            overflow: 'hidden',
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          {/* Table Action Bar */}
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
                Topic Index Directory
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Displaying {tags.length} of {stats.total} tags
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
                  placeholder="Filter tags..."
                  value={searchQuery}
                  onChange={handleSearch}
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
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); fetchTags(1, '', sortBy, sortOrder); }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: D ? '#64748B' : '#94A3B8', fontSize: 14 }}
                  >
                    ×
                  </button>
                )}
              </div>

              <Select
                value={`${sortBy}-${sortOrder}`}
                style={{ width: 160, borderRadius: 10 }}
                onChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  fetchTags(1, searchQuery, field, order);
                }}
              >
                <Option value="usage_count-DESC">🔥 Most Linked</Option>
                <Option value="usage_count-ASC">Least Linked</Option>
                <Option value="name-ASC">Name (A-Z)</Option>
                <Option value="created_at-DESC">Newest First</Option>
              </Select>

              <Tooltip title="Reload Tags">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchTags(pagination.current, searchQuery, sortBy, sortOrder)}
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
            dataSource={tags}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showTotal: (total) => <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>Total {total} tags</span>,
              onChange: (p) => fetchTags(p, searchQuery, sortBy, sortOrder),
            }}
          />
        </div>

        {/* ── CREATE / EDIT MODAL ── */}
        <Modal
          title={
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
              {editingTag ? 'Edit Tag Identifier' : 'Create New Topic Tag'}
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          okText={editingTag ? 'Save Changes' : 'Create Tag'}
          okButtonProps={{
            style: {
              background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
            },
          }}
          cancelButtonProps={{ style: { borderRadius: 8 } }}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Tag Label</span>}
              rules={[{ required: true, message: 'Please enter tag name' }]}
            >
              <Input placeholder="e.g. cloud-native" style={{ borderRadius: 8, height: 40 }} prefix={<TagOutlined style={{ color: '#8B5CF6' }} />} />
            </Form.Item>

            <Form.Item
              name="slug"
              label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>URL Identifier (Slug)</span>}
              rules={[{ required: true, message: 'Please enter slug' }]}
            >
              <Input placeholder="e.g. cloud-native" style={{ borderRadius: 8, height: 40 }} prefix={<LinkOutlined style={{ color: '#8B5CF6' }} />} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Tags;
