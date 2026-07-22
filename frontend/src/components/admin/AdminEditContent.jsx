import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Select, Button, DatePicker,
  Upload, Space, Divider, Typography, Tooltip, App
} from 'antd';
import {
  UploadOutlined, SaveOutlined, ArrowLeftOutlined,
  PictureOutlined, SettingOutlined, InfoCircleOutlined,
  TagOutlined, CalendarOutlined, MailOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import TipTapEditor from '../common/TipTapEditor';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const AdminEditContent = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedContentType, setSelectedContentType] = useState(null);

  useEffect(() => {
    Promise.all([fetchMeta(), fetchContent()]);
  }, []);

  const fetchMeta = async () => {
    try {
      const [catRes, typeRes] = await Promise.all([
        axios.get('/api/public/categories'),
        axios.get('/api/public/content-types')
      ]);
      setCategories(catRes.data || []);
      setContentTypes(typeRes.data || []);
    } catch {
      message.error('Failed to load categories/types');
    }
  };

  const handleContentTypeChange = (value) => {
    setSelectedContentType(value);
  };

  const fetchContent = async () => {
    try {
      const res = await axios.get(`/api/admin/content/${id}`);
      const data = res.data;
      const tags = (() => {
        if (!data.tags) return [];
        if (Array.isArray(data.tags)) return data.tags;
        try { return JSON.parse(data.tags); } catch { return []; }
      })();
      form.setFieldsValue({
        content_type_id: data.content_type_id,
        category_id: data.category_id,
        title: data.title,
        short_description: data.short_description,
        tags,
        seo_meta_title: data.seo_meta_title,
        seo_meta_description: data.seo_meta_description,
        seo_meta_keywords: data.seo_meta_keywords,
        scheduled_publish_date: data.scheduled_publish_date ? moment(data.scheduled_publish_date) : null
      });
      setInitialContent(data.content || '');
      setContent(data.content || '');
      setEditorReady(true);
      if (data.banner_image) {
        setFileList([{ uid: '-1', name: data.banner_image, status: 'done', url: `/uploads/${data.banner_image}` }]);
      }
    } catch {
      message.error('Failed to load content');
      navigate(`/admin/review/${id}`);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const skip = ['banner_image', 'tags', 'scheduled_publish_date', 'content'];
      Object.keys(values).forEach(key => {
        if (!skip.includes(key) && values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      if (values.tags?.length) formData.append('tags', values.tags.join(','));
      if (values.scheduled_publish_date) formData.append('scheduled_publish_date', values.scheduled_publish_date.format('YYYY-MM-DD'));
      formData.append('content', content || '');
      if (fileList.length > 0 && fileList[0].originFileObj) formData.append('banner_image', fileList[0].originFileObj);

      await axios.put(`/api/admin/content/${id}/edit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Content updated successfully!');
      navigate(`/admin/review/${id}`);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (file) => {
    if (!file) return null;
    if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
    if (file.url) return file.url;
    return null;
  };

  const bannerImageUrl = fileList.length > 0 ? getImageUrl(fileList[0]) : null;

  if (fetching) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>Loading content...</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Top Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/admin/review/${id}`)}
            style={{ color: '#595959' }}
          >
            Back to Review
          </Button>
          <Divider orientation="vertical" style={{ margin: 0 }} />
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>Admin Edit</Text>
        </div>
        <Space size={8}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Main Content Area */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Article Meta */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Article Details
              </Text>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <Form.Item name="content_type_id" label="Content Type" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Select placeholder="Select type" size="large" onChange={handleContentTypeChange}>
                    {contentTypes.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="category_id" label="Category" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Select placeholder="Select category" size="large">
                    {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Title + Description */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                <Input
                  placeholder="Article title..."
                  size="large"
                  style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: '#1a1a1a' }}
                />
              </Form.Item>
              <Form.Item
                name="short_description"
                label={
                  <span>Short Description
                    <Tooltip title="A brief summary shown in article cards">
                      <InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c', fontSize: 12 }} />
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <TextArea rows={3} placeholder="Write a compelling summary..." style={{ resize: 'none', fontSize: 15, lineHeight: 1.7 }} showCount maxLength={300} />
              </Form.Item>
            </div>

            {/* Banner Image */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    <PictureOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Banner Image
                  </Text>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Recommended: 1200×630px</div>
                </div>
                <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
                  <Button icon={<UploadOutlined />} size="small">
                    {fileList.length > 0 ? 'Change Image' : 'Upload Image'}
                  </Button>
                </Upload>
              </div>
              {bannerImageUrl ? (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                  <img src={bannerImageUrl} alt="Banner" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
                </div>
              ) : (
                <div style={{ border: '2px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', textAlign: 'center', background: '#fafafa' }}>
                  <PictureOutlined style={{ fontSize: 32, color: '#bfbfbf', marginBottom: 8, display: 'block' }} />
                  <Text style={{ color: '#8c8c8c', fontSize: 13 }}>No banner image</Text>
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '16px 28px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong style={{ fontSize: 14 }}>Content</Text>
              </div>
              <div style={{ padding: '0 4px 4px' }}>
                {editorReady ? (
                  <TipTapEditor value={content} initialContent={initialContent} onChange={setContent} placeholder="Start writing..." />
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>Loading editor...</div>
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div style={{ width: 300, flexShrink: 0 }}>

            {/* Tags */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                <TagOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Tags
              </Text>
              <Form.Item name="tags" style={{ marginBottom: 0 }}>
                <Select mode="tags" placeholder="Add tags..." style={{ width: '100%' }} tokenSeparators={[',']} />
              </Form.Item>
            </div>

            {/* Schedule */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                <CalendarOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Schedule
              </Text>
              <Form.Item name="scheduled_publish_date" style={{ marginBottom: 0 }}>
                <DatePicker format="YYYY-MM-DD" placeholder="Select publish date" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            {/* SEO */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                <SettingOutlined style={{ marginRight: 6, color: '#4a7cff' }} />SEO Settings
              </Text>
              <Form.Item name="seo_meta_title" label={<Text style={{ fontSize: 12 }}>Meta Title</Text>} style={{ marginBottom: 12 }}>
                <Input placeholder="SEO title" size="small" />
              </Form.Item>
              <Form.Item name="seo_meta_description" label={<Text style={{ fontSize: 12 }}>Meta Description</Text>} style={{ marginBottom: 12 }}>
                <TextArea rows={3} placeholder="SEO description" style={{ resize: 'none', fontSize: 12 }} />
              </Form.Item>
              <Form.Item name="seo_meta_keywords" label={<Text style={{ fontSize: 12 }}>Meta Keywords</Text>} style={{ marginBottom: 0 }}>
                <Input placeholder="keyword1, keyword2, ..." size="small" />
              </Form.Item>
            </div>

            {/* Email Template - only for case studies */}
            {selectedContentType && (() => {
              const contentType = contentTypes.find(t => t.id === selectedContentType);
              return contentType && contentType.slug === 'case-study';
            })() && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                  <MailOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Email Template
                </Text>
                <Form.Item
                  name="email_subject"
                  label={<Text style={{ fontSize: 12 }}>Email Subject</Text>}
                  style={{ marginBottom: 12 }}
                  tooltip="Subject line for the email sent to users who fill the case study form. Use placeholders: {{name}}, {{title}}"
                >
                  <Input
                    placeholder="Enter email subject..."
                    size="small"
                  />
                </Form.Item>
                <Form.Item
                  name="email_template"
                  label={<Text style={{ fontSize: 12 }}>Email Body (HTML)</Text>}
                  style={{ marginBottom: 0 }}
                  tooltip="Custom HTML email body sent to users who fill the case study form. Use placeholders: {{name}}, {{title}}, {{email}}, {{contact}}, {{slug}}"
                >
                  <TextArea
                    rows={10}
                    placeholder="Enter custom HTML email body..."
                    style={{ resize: 'none', fontSize: 12, fontFamily: 'monospace' }}
                  />
                </Form.Item>
              </div>
            )}

          </div>
        </div>
      </Form>
    </div>
  );
};

export default AdminEditContent;
