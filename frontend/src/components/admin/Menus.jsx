import React, { useState } from 'react';
import { Card, Tree, Button, Typography, Modal, Form, Input, Select, Space, Popconfirm, message, Grid } from 'antd';
import {
  MenuUnfoldOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Menus = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  const [treeData, setTreeData] = useState([
    {
      title: 'Home',
      key: 'home',
      children: [
        { title: 'About Us', key: 'about' },
        { title: 'Services', key: 'services' },
      ],
    },
    {
      title: 'Blog',
      key: 'blog',
      children: [
        { title: 'All Posts', key: 'blog-all' },
        { title: 'Categories', key: 'blog-categories' },
      ],
    },
    {
      title: 'Contact',
      key: 'contact',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [form] = Form.useForm();

  const handleAdd = (parentKey = null) => {
    setEditingNode(null);
    form.resetFields();
    form.setFieldValue('parentKey', parentKey);
    setIsModalVisible(true);
  };

  const handleEdit = (node) => {
    setEditingNode(node);
    form.setFieldsValue({
      title: node.title,
      key: node.key,
      parentKey: node.parentKey || null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (key) => {
    const deleteNode = (nodes) => {
      return nodes.filter(node => {
        if (node.key === key) return false;
        if (node.children) {
          node.children = deleteNode(node.children);
        }
        return true;
      });
    };
    setTreeData(deleteNode(treeData));
    message.success('Menu item deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingNode) {
        // Update existing node
        const updateNode = (nodes) => {
          return nodes.map(node => {
            if (node.key === editingNode.key) {
              return { ...node, title: values.title, key: values.key };
            }
            if (node.children) {
              return { ...node, children: updateNode(node.children) };
            }
            return node;
          });
        };
        setTreeData(updateNode(treeData));
        message.success('Menu item updated successfully');
      } else {
        // Add new node
        const newNode = { title: values.title, key: values.key };
        if (values.parentKey) {
          const addToParent = (nodes) => {
            return nodes.map(node => {
              if (node.key === values.parentKey) {
                return { ...node, children: [...(node.children || []), newNode] };
              }
              if (node.children) {
                return { ...node, children: addToParent(node.children) };
              }
              return node;
            });
          };
          setTreeData(addToParent(treeData));
        } else {
          setTreeData([...treeData, newNode]);
        }
        message.success('Menu item added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            <MenuUnfoldOutlined /> Menus
          </Title>
          <Text style={{ fontSize: isMobile ? 13 : 15, color: '#6B7280' }}>
            Manage your website navigation menus
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => handleAdd()}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Add Menu Item
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
      >
        <Tree
          showLine
          draggable
          blockNode
          style={{ fontSize: isMobile ? 14 : 16 }}
          treeData={treeData.map(node => ({
            ...node,
            title: (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingRight: isMobile ? 4 : 8,
                gap: isMobile ? 8 : 0
              }}>
                <span style={{ fontSize: isMobile ? 14 : 16 }}>{node.title}</span>
                <Space size={isMobile ? 2 : 'small'}>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    size={isMobile ? 'small' : 'small'}
                    onClick={(e) => { e.stopPropagation(); handleAdd(node.key); }}
                    style={{ padding: isMobile ? '0 4px' : '0 8px' }}
                  />
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    size={isMobile ? 'small' : 'small'}
                    onClick={(e) => { e.stopPropagation(); handleEdit(node); }}
                    style={{ padding: isMobile ? '0 4px' : '0 8px' }}
                  />
                  <Popconfirm
                    title="Are you sure you want to delete this menu item?"
                    onConfirm={(e) => { e.stopPropagation(); handleDelete(node.key); }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      size={isMobile ? 'small' : 'small'}
                      danger
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: isMobile ? '0 4px' : '0 8px' }}
                    />
                  </Popconfirm>
                </Space>
              </div>
            ),
          }))}
          onDrop={(info) => {
            const dropKey = info.node.key;
            const dragKey = info.dragNode.key;
            const dropPos = info.node.pos.split('-');
            const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

            const loop = (data, key, callback) => {
              data.forEach((item, index, arr) => {
                if (item.key === key) {
                  return callback(item, index, arr);
                }
                if (item.children) {
                  return loop(item.children, key, callback);
                }
              });
            };
            const data = [...treeData];

            let dragObj;
            loop(data, dragKey, (item, index, arr) => {
              arr.splice(index, 1);
              dragObj = item;
            });

            if (dropPosition === 0) {
              loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.push(dragObj);
              });
            } else {
              let ar;
              let i;
              loop(data, dropKey, (item, index, arr) => {
                ar = arr;
                i = index;
              });
              if (dropPosition === -1) {
                ar.splice(i, 0, dragObj);
              } else {
                ar.splice(i + 1, 0, dragObj);
              }
            }

            setTreeData(data);
          }}
        />
      </Card>

      <Modal
        title={editingNode ? 'Edit Menu Item' : 'Add Menu Item'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isMobile ? '100%' : 500}
        style={{ top: isMobile ? 0 : 20 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Menu Title"
            rules={[{ required: true, message: 'Please enter menu title' }]}
          >
            <Input placeholder="Enter menu title" />
          </Form.Item>

          <Form.Item
            name="key"
            label="Menu Key/URL"
            rules={[{ required: true, message: 'Please enter menu key' }]}
          >
            <Input placeholder="Enter menu key or URL" />
          </Form.Item>

          <Form.Item
            name="parentKey"
            label="Parent Menu"
          >
            <Select placeholder="Select parent menu (optional)" allowClear>
              {treeData.map(node => (
                <Option key={node.key} value={node.key}>{node.title}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Menus;
