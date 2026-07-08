import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { MailOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Newsletter = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/public/newsletter', values);
      message.success('Successfully subscribed to newsletter!');
      form.resetFields();
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      message.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-10">
      <Card className="mx-auto max-w-[600px]">
        <div className="mb-6 text-center">
          <Title level={2}>Subscribe to Newsletter</Title>
          <Text type="secondary">
            Stay updated with the latest technology insights and industry trends
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              size="large" 
              prefix={<MailOutlined />} 
              placeholder="Enter your email address" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              icon={<SendOutlined />}
              loading={loading}
              className="border-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"
            >
              Subscribe Now
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text type="secondary" className="text-[12px]">
            We respect your privacy. Unsubscribe at any time.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Newsletter;