import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag, ConfigProvider, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const Categories = () => {
  const { darkMode } = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/public/categories');
      setCategories(res.data || []);
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
      console.error('Error deleting category:', error);
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
      console.error('Error saving category:', error);
      message.error('Failed to save category');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text) => <span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{text}</span>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <FolderOutlined style={{ color: darkMode ? '#60a5fa' : '#1890ff' }} />
          <span style={{ fontWeight: 500, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <Tag color="blue" style={{ color: darkMode ? '#60a5fa' : '#1890ff', borderColor: darkMode ? '#334155' : undefined }}>{text}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        if (!type) return <Tag color="default" style={{ color: darkMode ? '#94a3b8' : undefined, borderColor: darkMode ? '#334155' : undefined }}>General</Tag>;
        const colorMap = { technology: 'blue', industry: 'green' };
        return <Tag color={colorMap[type] || 'default'} style={{ color: darkMode ? '#60a5fa' : undefined, borderColor: darkMode ? '#334155' : undefined }}>{type}</Tag>;
      },
    },
    {
      title: 'Parent Category',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId) => {
        if (!parentId) return <Tag color="default" style={{ color: darkMode ? '#94a3b8' : undefined, borderColor: darkMode ? '#334155' : undefined }}>Root</Tag>;
        const parent = categories.find(c => c.id === parentId);
        return parent ? <Tag color="green" style={{ color: darkMode ? '#5BBD2B' : '#52c41a', borderColor: darkMode ? '#334155' : undefined }}>{parent.name}</Tag> : '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}
          />
          <Popconfirm
            title="Delete this category?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} style={{ color: darkMode ? '#ef4444' : undefined }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider 
      theme={{ 
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: darkMode ? '#1e293b' : '#fff',
          colorBorder: darkMode ? '#334155' : '#e5e7eb',
          colorText: darkMode ? '#cbd5e1' : '#1a1a2e',
          colorTextSecondary: darkMode ? '#94a3b8' : '#6b7280',
          colorBgElevated: darkMode ? '#0f172a' : '#f8fafc',
        }
      }}
    >
      <div 
        data-theme={darkMode ? 'dark' : 'light'}
        style={{ padding: window.innerWidth < 768 ? '16px' : '24px', background: darkMode ? '#0f172a' : '#f8fafc', minHeight: '100vh' }}
      >
        <Card
          title={<span style={{ fontSize: window.innerWidth < 768 ? 18 : 20, color: darkMode ? '#f1f5f9' : '#111827' }}>Categories</span>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ width: window.innerWidth < 768 ? '100%' : 'auto' }}>
              Add Category
            </Button>
          }
          style={{ borderRadius: 12, background: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
          headStyle={{ flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: window.innerWidth < 768 ? 12 : 0, alignItems: window.innerWidth < 768 ? 'flex-start' : 'center', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
        >
          <Table
            columns={columns}
            dataSource={categories}
            rowKey="id"
            loading={loading}
            scroll={{ x: window.innerWidth < 768 ? 600 : 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: window.innerWidth >= 768,
              showTotal: window.innerWidth >= 768 ? (total) => `Total ${total} categories` : false,
              size: window.innerWidth < 768 ? 'small' : 'default',
              style: { textAlign: 'center', marginTop: 16 }
            }}
            style={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
            rowClassName={(index) => index % 2 === 0 ? (darkMode ? 'dark-row-even' : '') : ''}
            styles={{
              header: { background: darkMode ? '#0f172a' : '#fafafa', color: darkMode ? '#f1f5f9' : '#1a1a2e' },
              body: { background: darkMode ? '#1e293b' : '#fff' }
            }}
          />
        </Card>

        <Modal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={window.innerWidth < 768 ? '100%' : 500}
          style={{ top: window.innerWidth < 768 ? 0 : 20 }}
          styles={{
            body: { background: darkMode ? '#1e293b' : '#fff' },
            header: { background: darkMode ? '#1e293b' : '#fff', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' },
            title: { color: darkMode ? '#f1f5f9' : '#111827' }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label={<span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Category Name</span>}
              rules={[{ required: true, message: 'Category name is required' }]}
            >
              <Input placeholder="Enter category name" style={{ background: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#334155' : '#d9d9d9', color: darkMode ? '#cbd5e1' : '#1a1a2e' }} />
            </Form.Item>

            <Form.Item
              name="slug"
              label={<span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Slug</span>}
              rules={[{ required: true, message: 'Slug is required' }]}
            >
              <Input placeholder="Enter URL-friendly slug" style={{ background: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#334155' : '#d9d9d9', color: darkMode ? '#cbd5e1' : '#1a1a2e' }} />
            </Form.Item>

            <Form.Item
              name="parent_id"
              label={<span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Parent Category</span>}
            >
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: darkMode ? '1px solid #334155' : '1px solid #d9d9d9', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>
                <option value="">None (Root Category)</option>
                {categories
                  .filter(c => !editingCategory || c.id !== editingCategory.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </Form.Item>

            <Form.Item
              name="type"
              label={<span style={{ color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Category Type</span>}
              initialValue=""
            >
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: darkMode ? '1px solid #334155' : '1px solid #d9d9d9', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>
                <option value="">None (General)</option>
                <option value="technology">Technology</option>
                <option value="industry">Industry</option>
              </select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Categories;
