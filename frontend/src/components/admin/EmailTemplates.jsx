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
  Select, 
  Switch, 
  ConfigProvider, 
  Tooltip,
  Popconfirm,
  Row,
  Col
} from 'antd';
import { 
  MailOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  SendOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

const { TextArea } = Input;
const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const emailStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .eml-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: emlFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes emlFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .eml-stagger-1 { animation: emlSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .eml-stagger-2 { animation: emlSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .eml-stagger-3 { animation: emlSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }

  @keyframes emlSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .eml-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #F59E0B;
    position: relative;
    display: inline-block;
  }
  .eml-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #F59E0B;
    animation: emlPulse 2s ease-out infinite;
  }
  @keyframes emlPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .eml-kpi-card {
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
  .eml-kpi-card:hover {
    transform: translateY(-3px);
  }
`;

const EmailTemplates = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    template_type: '',
    template_name: '',
    subject: '',
    html_body: '',
    is_active: true,
    include_logo: false
  });

  const templateTypes = [
    { value: 'registration', label: 'User Registration', color: 'blue', icon: '👤' },
    { value: 'content_submitted', label: 'Content Submitted', color: 'gold', icon: '📝' },
    { value: 'content_approved', label: 'Content Approved', color: 'green', icon: '✅' },
    { value: 'content_rejected', label: 'Content Rejected', color: 'red', icon: '❌' },
    { value: 'content_published', label: 'Content Published', color: 'purple', icon: '📢' }
  ];

  const availableVariables = {
    registration: ['first_name', 'last_name', 'email', 'login_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
    content_submitted: ['first_name', 'last_name', 'content_title', 'category', 'submitted_date', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
    content_approved: ['first_name', 'last_name', 'content_title', 'category', 'approved_date', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
    content_rejected: ['first_name', 'last_name', 'content_title', 'category', 'reviewed_date', 'feedback', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
    content_published: ['first_name', 'last_name', 'content_title', 'category', 'published_date', 'article_url', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year']
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch('/api/email-templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      template_type: '',
      template_name: '',
      subject: '',
      html_body: '',
      is_active: true,
      include_logo: false
    });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_type: template.template_type,
      template_name: template.template_name,
      subject: template.subject,
      html_body: template.html_body,
      is_active: template.is_active,
      include_logo: template.include_logo || false
    });
    setShowModal(true);
  };

  const handleView = async (template) => {
    setViewingTemplate(template);
    setPreviewHtml('');
    setPreviewLoading(true);
    try {
      const renderedHtml = await renderPreviewHtml(template);
      setPreviewHtml(renderedHtml);
    } catch (error) {
      setPreviewHtml('<div style="padding: 20px; text-align: center; color: red;">Error rendering preview</div>');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      await fetch(`/api/email-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      message.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      await fetch(`/api/email-templates/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Template status updated');
      fetchTemplates();
    } catch (error) {
      message.error('Failed to toggle template status');
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const url = editingTemplate 
        ? `/api/email-templates/${editingTemplate.id}`
        : '/api/email-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      message.success(editingTemplate ? 'Template updated' : 'Template created');
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      message.error('Failed to save template');
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      html_body: prev.html_body + `{{${variable}}}`
    }));
  };

  const renderPreviewHtml = async (template) => {
    let html = template.html_body;
    if (template.include_logo) {
      try {
        const response = await fetch('/api/site-settings');
        const data = await response.json();
        const settings = data.settings;
        const logoUrl = settings?.website_main_logo || settings?.website_logo || '';
        
        if (logoUrl) {
          const logoHtml = `<div style="text-align:center;margin-bottom:15px;"><img src="${logoUrl}" alt="Company Logo" style="max-width:150px;height:auto;display:block;margin:0 auto;" /></div>`;
          html = html
            .replace(/\{\{website_logo_html\}\}/g, logoHtml)
            .replace(/\{\{website_logo_img\}\}/g, `<img src="${logoUrl}" alt="Company Logo" style="max-width:180px;height:auto;display:block;margin:0 auto;" />`)
            .replace(/\{\{website_logo\}\}/g, logoUrl)
            .replace(/\{\{logo\}\}/g, logoUrl);
          
          if (!/\{\{(website_logo_html|website_logo_img|website_logo|logo)\}\}/i.test(template.html_body)) {
            html = `${logoHtml}${html}`;
          }
        }
      } catch (error) {}
    } else {
      html = html
        .replace(/\{\{website_logo_html\}\}/g, '')
        .replace(/\{\{website_logo_img\}\}/g, '')
        .replace(/\{\{website_logo\}\}/g, '')
        .replace(/\{\{logo\}\}/g, '');
    }
    
    return html
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{last_name\}\}/g, 'Doe')
      .replace(/\{\{email\}\}/g, 'john.doe@example.com')
      .replace(/\{\{site_name\}\}/g, 'TgsTechInfo')
      .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.template_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && template.is_active) ||
      (filterStatus === 'inactive' && !template.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const activeCount = templates.filter(t => t.is_active).length;
  const inactiveCount = templates.filter(t => !t.is_active).length;

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="eml-kpi-card"
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
      title: 'Template Type',
      dataIndex: 'template_type',
      key: 'template_type',
      render: (type) => {
        const info = templateTypes.find(t => t.value === type) || { label: type, color: 'default', icon: '📧' };
        return (
          <Tag color={info.color} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px', fontSize: '0.75rem' }}>
            {info.icon} {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'Template Name',
      dataIndex: 'template_name',
      key: 'template_name',
      render: (name) => <span style={{ fontWeight: 700, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem' }}>{name}</span>,
    },
    {
      title: 'Email Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => <span style={{ fontSize: '0.8rem', color: D ? '#CBD5E1' : '#334155' }}>{subject}</span>,
    },
    {
      title: 'Branding Logo',
      dataIndex: 'include_logo',
      key: 'include_logo',
      render: (inc) => inc ? <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>Attached</Tag> : <Tag style={{ borderRadius: 6, color: D ? '#64748B' : '#94A3B8' }}>None</Tag>,
    },
    {
      title: 'Active Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={() => handleToggleActive(record.id)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Preview Email">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ borderRadius: 8, color: '#3B82F6', background: D ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)' }} />
          </Tooltip>
          <Tooltip title="Edit Template">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ borderRadius: 8, color: '#F59E0B', background: D ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)' }} />
          </Tooltip>
          <Popconfirm title="Delete template?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
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
      <style>{emailStyles}</style>

      <div className="eml-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="eml-stagger-1"
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="eml-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F59E0B' }}>
                System Notification Engine
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {templates.length} Email Templates Configured
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MailOutlined style={{ color: '#F59E0B' }} /> Email Templates Manager
            </h1>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{
              background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              height: 42,
              padding: '0 20px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            }}
          >
            Create New Template
          </Button>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="eml-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Templates" value={templates.length} icon={<MailOutlined />} color="primary" accentColor="#F59E0B" subtitle="All Notification Mailers" />
          <StatCard title="Active Automated Mailers" value={activeCount} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Live Dispatch Enabled" />
          <StatCard title="Inactive / Draft Mailers" value={inactiveCount} icon={<CloseCircleOutlined />} color="warning" accentColor="#EF4444" subtitle="Disabled Templates" />
        </div>

        {/* ── MAIN TABLE CONTAINER ── */}
        <div
          className="eml-stagger-3"
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
                Notification Templates Registry
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Displaying {filteredTemplates.length} templates
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
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              <Select
                value={filterStatus}
                style={{ width: 140, borderRadius: 10 }}
                onChange={(val) => setFilterStatus(val)}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active Only</Option>
                <Option value="inactive">Inactive Only</Option>
              </Select>

              <Tooltip title="Reload Templates">
                <Button icon={<ReloadOutlined />} onClick={fetchTemplates} style={{ borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }} />
              </Tooltip>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredTemplates}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>

        {/* ── CREATE / EDIT MODAL ── */}
        <Modal
          title={
            <div style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
              {editingTemplate ? 'Edit Email Template' : 'Create New Email Template'}
            </div>
          }
          open={showModal}
          onCancel={() => setShowModal(false)}
          onOk={handleSubmit}
          okText={editingTemplate ? 'Update Template' : 'Create Template'}
          okButtonProps={{ style: { background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', border: 'none', borderRadius: 8, fontWeight: 700 } }}
          width={720}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <Row gutter={12}>
              <Col span={12}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4 }}>Template Event Type</label>
                <Select
                  style={{ width: '100%', borderRadius: 8 }}
                  value={formData.template_type}
                  onChange={(val) => setFormData({ ...formData, template_type: val })}
                  disabled={!!editingTemplate}
                >
                  {templateTypes.map(t => (
                    <Option key={t.value} value={t.value}>{t.icon} {t.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={12}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4 }}>Template Name</label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g. Welcome Registration Mailer"
                  style={{ borderRadius: 8 }}
                />
              </Col>
            </Row>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4 }}>Email Subject Line</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Subject with {{first_name}} dynamic variables..."
                style={{ borderRadius: 8 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4 }}>HTML Body Content</label>
              <TextArea
                rows={8}
                value={formData.html_body}
                onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem', borderRadius: 8 }}
              />
            </div>

            {formData.template_type && availableVariables[formData.template_type] && (
              <div style={{ background: D ? '#0F172A' : '#F1F5F9', padding: 12, borderRadius: 10, border: `1px solid ${D ? 'rgba(51,65,85,0.6)' : 'rgba(226,232,240,0.8)'}` }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: D ? '#94A3B8' : '#64748B', display: 'block', marginBottom: 6 }}>
                  Click to Insert Dynamic Variable:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {availableVariables[formData.template_type].map(v => (
                    <Tag
                      key={v}
                      color="blue"
                      onClick={() => insertVariable(v)}
                      style={{ cursor: 'pointer', borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' }}
                    >
                      {`{{${v}}}`}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* ── VIEW PREVIEW MODAL ── */}
        {viewingTemplate && (
          <Modal
            title={<div style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>Template Preview: {viewingTemplate.template_name}</div>}
            open={!!viewingTemplate}
            onCancel={() => setViewingTemplate(null)}
            footer={[<Button key="close" onClick={() => setViewingTemplate(null)} style={{ borderRadius: 8 }}>Close Preview</Button>]}
            width={720}
          >
            {previewLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Rendering mailer preview...</div>
            ) : (
              <div style={{ border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`, padding: 20, borderRadius: 10, background: '#FFF', color: '#111827', marginTop: 12 }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </Modal>
        )}
      </div>
    </ConfigProvider>
  );
};

export default EmailTemplates;