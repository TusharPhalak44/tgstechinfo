import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import axios from 'axios';

const Categories = () => {
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
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <FolderOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Parent Category',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId) => {
        if (!parentId) return <Tag color="default">Root</Tag>;
        const parent = categories.find(c => c.id === parentId);
        return parent ? <Tag color="green">{parent.name}</Tag> : '-';
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
          />
          <Popconfirm
            title="Delete this category?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: window.innerWidth < 768 ? '16px' : '24px' }}>
      <Card
        title={<span style={{ fontSize: window.innerWidth < 768 ? 18 : 20 }}>Categories</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ width: window.innerWidth < 768 ? '100%' : 'auto' }}>
            Add Category
          </Button>
        }
        style={{ borderRadius: 12 }}
        headStyle={{ flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: window.innerWidth < 768 ? 12 : 0, alignItems: window.innerWidth < 768 ? 'flex-start' : 'center' }}
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
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '100%' : 500}
        style={{ top: window.innerWidth < 768 ? 0 : 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Category name is required' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Slug is required' }]}
          >
            <Input placeholder="Enter URL-friendly slug" />
          </Form.Item>

          <Form.Item
            name="parent_id"
            label="Parent Category"
          >
            <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
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

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
