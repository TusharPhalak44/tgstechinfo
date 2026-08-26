import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Select, Button, DatePicker,
  Upload, Space, Divider, Typography, Tooltip, App, ConfigProvider, Checkbox
} from 'antd';
import {
  UploadOutlined, SaveOutlined, ArrowLeftOutlined,
  PictureOutlined, SettingOutlined, InfoCircleOutlined,
  TagOutlined, CalendarOutlined, MailOutlined,
  BookOutlined, QuestionCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import TipTapEditor from '../common/TipTapEditor';
import { useTheme } from '../../context/ThemeContext';
import { EditorialGuidelines } from '../guidelines/EditorialGuidelines';
import { SubmissionInstructions } from '../guidelines/SubmissionInstructions';
import { TermsAndConditions } from '../guidelines/TermsAndConditions';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const AdminEditContent = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedContentType, setSelectedContentType] = useState(null);

  // Guidelines modals state
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
      // Visual Builder content — redirect to CreateContent which handles builder_page_data
      if (data.builder_page_data) {
        navigate(`/edit-content/${id}`, { replace: true });
        return;
      }
      
      // HTML Builder content — redirect to CreateContent with HTML editor mode
      const builderLayout = data.builder_layout ? (typeof data.builder_layout === 'string' ? JSON.parse(data.builder_layout) : data.builder_layout) : null;
      const isHtmlBuilder = Array.isArray(builderLayout) && builderLayout[0] === 'html';
      if (isHtmlBuilder) {
        navigate(`/edit-content/${id}`, { replace: true });
        return;
      }
      
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
    <div style={{ padding: window.innerWidth < 768 ? 20 : 40, textAlign: 'center', color: darkMode ? '#94a3b8' : '#8c8c8c' }}>Loading content...</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#0F172A' : '#f5f5f5' }}>

      {/* Top Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: darkMode ? '#1e293b' : '#fff', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e8e8e8',
        padding: window.innerWidth < 768 ? '0 16px' : '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 768 ? 8 : 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/admin/review/${id}`)}
            style={{ color: darkMode ? '#cbd5e1' : '#595959', padding: window.innerWidth < 768 ? '4px 8px' : '5px 15px' }}
          >
            {window.innerWidth < 768 ? '' : 'Back to Review'}
          </Button>
          {window.innerWidth >= 768 && (
            <>
              <Divider orientation="vertical" style={{ margin: 0 }} />
              <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13 }}>Admin Edit</Text>
            </>
          )}
        </div>
        <Space size={window.innerWidth < 768 ? 4 : 8}>
          {/* Guidelines Buttons */}
          <Space size={4}>
            <Tooltip title="Editorial Guidelines">
              <Button
                type="text"
                icon={<BookOutlined />}
                onClick={() => setGuidelinesVisible(true)}
                style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                size="small"
              >
                {window.innerWidth >= 768 && 'Guidelines'}
              </Button>
            </Tooltip>
            <Tooltip title="How to Submit">
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => setInstructionsVisible(true)}
                style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                size="small"
              >
                {window.innerWidth >= 768 && 'How to Submit'}
              </Button>
            </Tooltip>
            <Tooltip title="Terms & Conditions">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                onClick={() => setTermsVisible(true)}
                style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                size="small"
              >
                {window.innerWidth >= 768 && 'Terms'}
              </Button>
            </Tooltip>
          </Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={() => form.submit()}
            size={window.innerWidth < 768 ? 'small' : 'default'}
          >
            {window.innerWidth < 768 ? 'Save' : 'Save Changes'}
          </Button>
        </Space>
      </div>

      <ConfigProvider
        theme={{
          token: {
            colorBgContainer: darkMode ? '#1E293B' : '#fff',
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
            colorText: darkMode ? '#cbd5e1' : '#374151',
            colorBorder: darkMode ? '#475569' : '#d9d9d9',
            colorBgElevated: darkMode ? '#1E293B' : '#fff',
            colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
            colorPrimary: '#4a7cff',
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: window.innerWidth < 768 ? '16px' : '32px 24px', display: 'flex', gap: window.innerWidth < 768 ? 0 : 24, alignItems: 'flex-start', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>

          {/* Main Content Area */}
          <div style={{ flex: 1, minWidth: 0, width: window.innerWidth < 768 ? '100%' : 'auto' }}>

            {/* Article Meta */}
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : '24px 28px', marginBottom: window.innerWidth < 768 ? 16 : 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Article Details
              </Text>
              <div style={{ display: 'flex', gap: window.innerWidth < 768 ? 12 : 16, marginTop: 16, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
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
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : '24px 28px', marginBottom: window.innerWidth < 768 ? 16 : 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
              <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                <Input
                  placeholder="Article title..."
                  size={window.innerWidth < 768 ? 'default' : 'large'}
                  style={{ fontSize: window.innerWidth < 768 ? 20 : 26, fontWeight: 700, border: 'none', borderBottom: darkMode ? '2px solid #334155' : '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: darkMode ? '#f1f5f9' : '#1a1a1a', background: 'transparent' }}
                />
              </Form.Item>
              <Form.Item
                name="short_description"
                label={
                  <span>Short Description
                    <Tooltip title="A brief summary shown in article cards">
                      <InfoCircleOutlined style={{ marginLeft: 6, color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 12 }} />
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <TextArea rows={3} placeholder="Write a compelling summary..." style={{ resize: 'none', fontSize: 15, lineHeight: 1.7, color: darkMode ? '#f1f5f9' : '#000', background: darkMode ? '#0F172A' : '#fff' }} showCount maxLength={300} />
              </Form.Item>
            </div>

            {/* Banner Image */}
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : '24px 28px', marginBottom: window.innerWidth < 768 ? 16 : 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', alignItems: window.innerWidth < 768 ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16, flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: window.innerWidth < 768 ? 12 : 0 }}>
                <div>
                  <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#000' }}>
                    <PictureOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Banner Image
                  </Text>
                  <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>Recommended: 1200×630px</div>
                </div>
                <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
                  <Button icon={<UploadOutlined />} size="small">
                    {fileList.length > 0 ? 'Change Image' : 'Upload Image'}
                  </Button>
                </Upload>
              </div>
              {bannerImageUrl ? (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                  <img src={bannerImageUrl} alt="Banner" style={{ width: '100%', maxHeight: window.innerWidth < 768 ? 240 : 360, objectFit: 'contain', display: 'block' }} />
                </div>
              ) : (
                <div style={{ border: darkMode ? '2px dashed #475569' : '2px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', textAlign: 'center', background: darkMode ? '#0F172A' : '#fafafa' }}>
                  <PictureOutlined style={{ fontSize: 32, color: darkMode ? '#475569' : '#bfbfbf', marginBottom: 8, display: 'block' }} />
                  <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13 }}>No banner image</Text>
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', overflow: 'hidden', marginBottom: window.innerWidth < 768 ? 16 : 20 }}>
              <div style={{ padding: window.innerWidth < 768 ? '12px 20px' : '16px 28px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#000' }}>Content</Text>
              </div>
              <div style={{ padding: '0 4px 4px' }}>
                {editorReady ? (
                  <TipTapEditor value={content} initialContent={initialContent} onChange={setContent} placeholder="Start writing..." darkMode={darkMode} />
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: darkMode ? '#94a3b8' : '#8c8c8c' }}>Loading editor...</div>
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div style={{ width: window.innerWidth < 768 ? '100%' : 300, flexShrink: 0 }}>

            {/* Tags */}
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : 20, marginBottom: window.innerWidth < 768 ? 16 : 16, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#000' }}>
                <TagOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Tags
              </Text>
              <Form.Item name="tags" style={{ marginBottom: 0 }}>
                <Select mode="tags" placeholder="Add tags..." style={{ width: '100%' }} tokenSeparators={[',']} />
              </Form.Item>
            </div>

            {/* Schedule */}
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : 20, marginBottom: window.innerWidth < 768 ? 16 : 16, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#000' }}>
                <CalendarOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Schedule
              </Text>
              <Form.Item name="scheduled_publish_date" style={{ marginBottom: 0 }}>
                <DatePicker format="YYYY-MM-DD" placeholder="Select publish date" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            {/* SEO */}
            <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#000' }}>
                <SettingOutlined style={{ marginRight: 6, color: '#4a7cff' }} />SEO Settings
              </Text>
              <Form.Item name="seo_meta_title" label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#000' }}>Meta Title</Text>} style={{ marginBottom: 12 }}>
                <Input placeholder="SEO title" size="small" />
              </Form.Item>
              <Form.Item name="seo_meta_description" label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#000' }}>Meta Description</Text>} style={{ marginBottom: 12 }}>
                <TextArea rows={3} placeholder="SEO description" style={{ resize: 'none', fontSize: 12 }} />
              </Form.Item>
              <Form.Item name="seo_meta_keywords" label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#000' }}>Meta Keywords</Text>} style={{ marginBottom: 0 }}>
                <Input placeholder="keyword1, keyword2, ..." size="small" />
              </Form.Item>
            </div>

            {/* Email Template - only for case studies */}
            {selectedContentType && (() => {
              const contentType = contentTypes.find(t => t.id === selectedContentType);
              return contentType && contentType.slug === 'case-study';
            })() && (
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: window.innerWidth < 768 ? '16px 20px' : 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#000' }}>
                  <MailOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Email Template
                </Text>
                <Form.Item
                  name="email_subject"
                  label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#000' }}>Email Subject</Text>}
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
                  label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#000' }}>Email Body (HTML)</Text>}
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

        {/* Guidelines Modals */}
        <EditorialGuidelines
          visible={guidelinesVisible}
          onClose={() => setGuidelinesVisible(false)}
        />
        <SubmissionInstructions
          visible={instructionsVisible}
          onClose={() => setInstructionsVisible(false)}
        />
        <TermsAndConditions
          visible={termsVisible}
          onClose={() => setTermsVisible(false)}
          accepted={termsAccepted}
          onAccept={setTermsAccepted}
        />
      </ConfigProvider>
    </div>
  );
};

export default AdminEditContent;
