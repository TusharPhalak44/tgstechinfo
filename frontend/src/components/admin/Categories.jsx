import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Tooltip, ConfigProvider } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  TagsOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const categoryStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .cat-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: catFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes catFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cat-stagger-1 { animation: catSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .cat-stagger-2 { animation: catSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .cat-stagger-3 { animation: catSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
  .cat-stagger-4 { animation: catSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both; }

  @keyframes catSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cat-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    position: relative;
    display: inline-block;
  }
  .cat-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #10B981;
    animation: catPulse 2s ease-out infinite;
  }
  @keyframes catPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .cat-kpi-card {
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
  .cat-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const Categories = () => {
  const { darkMode } = useTheme();
  const D = darkMode;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    technology: 0,
    industry: 0,
    general: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/public/categories');
      const data = res.data || [];
      setCategories(data);
      
      const statsData = {
        total: data.length,
        technology: data.filter(c => c.type === 'technology').length,
        industry: data.filter(c => c.type === 'industry').length,
        general: data.filter(c => c.type === 'general' || !c.type).length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/categories/${id}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete category');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await axios.put(`/api/admin/categories/${editingCategory.id}`, values);
        message.success('Category updated successfully');
      } else {
        await axios.post('/api/admin/categories', values);
        message.success('Category created successfully');
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error('Failed to save category');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const nameMatch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const slugMatch = (c.slug || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matches = nameMatch || slugMatch;
    console.log('Filtering category:', { name: c.name, slug: c.slug, searchQuery, nameMatch, slugMatch, matches });
    return matches;
  });

  console.log('Search debug:', { searchQuery, totalCategories: categories.length, filteredCount: filteredCategories.length, filteredCategories });

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      purple: { bg: D ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="cat-kpi-card"
        style={{
          background: D
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.65) 100%)'
            : 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
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
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space size={10}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: D ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
            <FolderOutlined />
          </div>
          <span style={{ fontWeight: 700, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.86rem' }}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: 'URL Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => (
        <code style={{ background: D ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9', color: '#6366F1', padding: '3px 9px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${D ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'}` }}>
          /{slug}
        </code>
      ),
    },
    {
      title: 'Category Domain',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeConfig = {
          technology: { color: 'blue', icon: '💻' },
          industry: { color: 'orange', icon: '🏭' },
          general: { color: 'default', icon: '📁' }
        };
        const config = typeConfig[type] || typeConfig.general;
        return (
          <Tag
            color={config.color}
            style={{ borderRadius: 6, fontWeight: 700, padding: '2px 9px', textTransform: 'capitalize', fontSize: '0.75rem' }}
          >
            {config.icon} {type || 'General'}
          </Tag>
        );
      },
    },
    {
      title: 'Parent Level',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId) => {
        if (!parentId) return <Tag style={{ borderRadius: 6, color: D ? '#64748B' : '#94A3B8', fontWeight: 600, fontSize: '0.72rem' }}>Root Level</Tag>;
        const parent = categories.find((c) => c.id === parentId);
        return parent ? (
          <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' }}>
            {parent.name}
          </Tag>
        ) : '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit Category">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ borderRadius: 8, color: '#3B82F6', background: D ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)' }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this category?"
            description="Articles in this category will be uncategorized."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Category">
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
      <style>{categoryStyles}</style>

      <div className="cat-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="cat-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="cat-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#3B82F6' }}>
                Content Taxonomy Hub
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {stats.total} Active Categories
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AppstoreOutlined style={{ color: '#3B82F6' }} /> Categories & Hierarchy
            </h1>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{
              background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Create Category
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="cat-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Categories" value={stats.total} icon={<AppstoreOutlined />} color="primary" accentColor="#3B82F6" subtitle="All Taxonomy Nodes" />
          <StatCard title="Technology Hubs" value={stats.technology} icon={<FileTextOutlined />} color="success" accentColor="#10B981" subtitle="Tech & IT Topics" />
          <StatCard title="Industry Verticals" value={stats.industry} icon={<TagsOutlined />} color="warning" accentColor="#F59E0B" subtitle="Market Sectors" />
          <StatCard title="General Categories" value={stats.general} icon={<FolderOutlined />} color="purple" accentColor="#A855F7" subtitle="Core Taxonomies" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="cat-stagger-3"
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
                Categories Registry
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Showing {filteredCategories.length} categories
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: D ? '#1E293B' : '#F1F5F9',
                  border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                  borderRadius: 10,
                  padding: '6px 14px',
                  width: 240,
                }}
              >
                <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 14 }} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    console.log('Search input changed:', e.target.value);
                    setSearchQuery(e.target.value);
                  }}
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
                    onClick={() => setSearchQuery('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: D ? '#64748B' : '#94A3B8', fontSize: 14 }}
                  >
                    ×
                  </button>
                )}
              </div>

              <Tooltip title="Reload Categories">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchCategories}
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
            dataSource={filteredCategories}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>Total {total} categories</span>,
            }}
          />
        </div>

        {/* ── CREATE / EDIT MODAL ── */}
        <Modal
          title={
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
              {editingCategory ? 'Edit Category Node' : 'Create New Category'}
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          okText={editingCategory ? 'Save Changes' : 'Create Category'}
          okButtonProps={{
            style: {
              background: 'linear-gradient(135deg, #0B1F4D 0%, #2563EB 100%)',
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
              label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Category Name</span>}
              rules={[{ required: true, message: 'Please enter category name' }]}
            >
              <Input placeholder="e.g. Artificial Intelligence" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="slug"
              label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Slug (URL Path)</span>}
              rules={[{ required: true, message: 'Please enter slug' }]}
            >
              <Input placeholder="e.g. artificial-intelligence" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="type"
              label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Category Type</span>}
              initialValue="technology"
            >
              <Select style={{ height: 40, borderRadius: 8 }}>
                <Option value="technology">💻 Technology</Option>
                <Option value="industry">🏭 Industry</Option>
                <Option value="general">📁 General</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="parent_id"
              label={<span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Parent Category</span>}
            >
              <Select
                placeholder="Select parent category (or leave blank for root)"
                allowClear
                style={{ height: 40, borderRadius: 8 }}
              >
                {categories
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Categories;
