import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Modal, 
  Form, 
  message, 
  Popconfirm, 
  Select, 
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
  ConfigProvider,
  theme
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  TagsOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { Search } = Input;
const { Option } = Select;

const Tags = () => {
  const { darkMode } = useTheme();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('usage_count');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [stats, setStats] = useState({
    totalTags: 0,
    totalUsage: 0,
    avgUsage: 0
  });

  const fetchTags = async (page = 1, search = '', sortField = 'usage_count', sortDir = 'DESC') => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tags', {
        params: {
          page,
          limit: pagination.pageSize,
          search,
          sortBy: sortField,
          sortOrder: sortDir
        }
      });

      if (response.data.success) {
        setTags(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total
        });

        // Calculate stats using backend data
        const totalTags = response.data.pagination.total;
        const totalUsage = response.data.stats?.totalUsage || 0;
        const avgUsage = totalTags > 0 ? Math.round(totalUsage / totalTags) : 0;

        setStats({
          totalTags,
          totalUsage,
          avgUsage
        });
      }
    } catch (error) {
      message.error('Failed to fetch tags');
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSearch = (value) => {
    setSearchQuery(value);
    fetchTags(1, value, sortBy, sortOrder);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const sortField = sorter.field || 'usage_count';
    const sortDir = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    setSortBy(sortField);
    setSortOrder(sortDir);
    fetchTags(pagination.current, searchQuery, sortField, sortDir);
  };

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      slug: tag.slug
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/tags/${id}`);
      message.success('Tag deleted successfully');
      fetchTags(pagination.current, searchQuery, sortBy, sortOrder);
    } catch (error) {
      message.error('Failed to delete tag');
      console.error('Error deleting tag:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingTag) {
        await axios.put(`/api/tags/${editingTag.id}`, values);
        message.success('Tag updated successfully');
      } else {
        await axios.post('/api/tags', values);
        message.success('Tag created successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchTags(pagination.current, searchQuery, sortBy, sortOrder);
    } catch (error) {
      if (error.errorFields) {
        return; // Validation error
      }
      message.error(editingTag ? 'Failed to update tag' : 'Failed to create tag');
      console.error('Error saving tag:', error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingTag(null);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true
    },
    {
      title: 'Tag Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name) => (
        <Tag color={darkMode ? 'cyan' : 'blue'} style={{ fontSize: '14px', padding: '4px 12px' }}>
          {name}
        </Tag>
      )
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      sorter: true,
      render: (slug) => (
        <code style={{ 
          background: darkMode ? '#334155' : '#f5f5f5', 
          padding: '2px 6px', 
          borderRadius: '3px',
          color: darkMode ? '#e2e8f0' : '#1a1a1a'
        }}>
          {slug}
        </code>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ color: darkMode ? '#60a5fa' : '#1890ff' }}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this tag?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: darkMode ? '#1a1a1a' : '#ffffff',
          colorBorder: darkMode ? '#334155' : '#E5E7EB',
          colorText: darkMode ? '#e2e8f0' : '#1a1a1a',
          colorTextSecondary: darkMode ? '#94a3b8' : '#6B7280',
        },
      }}
    >
      <div style={{ padding: '24px', background: darkMode ? '#1a1a1a' : '#f5f5f5', minHeight: '100vh' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card style={{ 
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Statistic
              title="Total Tags"
              value={stats.totalTags}
              prefix={<TagsOutlined />}
              valueStyle={{ color: darkMode ? '#4ade80' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ 
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Statistic
              title="Total Usage"
              value={stats.totalUsage}
              valueStyle={{ color: darkMode ? '#60a5fa' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ 
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
            boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Statistic
              title="Avg Usage"
              value={stats.avgUsage}
              suffix="times"
              valueStyle={{ color: darkMode ? '#a78bfa' : '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Tags Management"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchTags(pagination.current, searchQuery, sortBy, sortOrder)}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              Add Tag
            </Button>
          </Space>
        }
        style={{
          borderRadius: 12,
          border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Space style={{ marginBottom: 16 }} size="middle">
          <Search
            placeholder="Search tags..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                setSearchQuery('');
                fetchTags(1, '', sortBy, sortOrder);
              }
            }}
          />
          <Select
            value={`${sortBy}-${sortOrder}`}
            style={{ width: 200 }}
            onChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
              fetchTags(pagination.current, searchQuery, field, order);
            }}
          >
            <Option value="usage_count-DESC">Most Used</Option>
            <Option value="usage_count-ASC">Least Used</Option>
            <Option value="name-ASC">Name (A-Z)</Option>
            <Option value="name-DESC">Name (Z-A)</Option>
            <Option value="created_at-DESC">Newest First</Option>
            <Option value="created_at-ASC">Oldest First</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tags`,
            onShowSizeChange: (current, size) => {
              setPagination({ ...pagination, pageSize: size });
              fetchTags(current, searchQuery, sortBy, sortOrder);
            }
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingTag ? 'Edit Tag' : 'Add New Tag'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingTag ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tag Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter tag name' },
              { min: 1, max: 255, message: 'Tag name must be between 1 and 255 characters' }
            ]}
          >
            <Input placeholder="Enter tag name" />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[
              { required: true, message: 'Please enter slug' },
              { pattern: /^[a-z0-9-]+$/, message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
            ]}
            tooltip="URL-friendly version of the tag name"
          >
            <Input placeholder="tag-slug" />
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Tags;
