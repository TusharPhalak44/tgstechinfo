import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Select, Button, message, DatePicker,
  Upload, Space, Divider, Typography, Tooltip, Tag
} from 'antd';
import {
  UploadOutlined, SaveOutlined, SendOutlined, EyeOutlined,
  CalendarOutlined, ClockCircleOutlined, UserOutlined, TagOutlined,
  PictureOutlined, SettingOutlined, InfoCircleOutlined, ArrowLeftOutlined,
  FilePdfOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, MenuOutlined, ApiOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import TipTapEditor from '../common/TipTapEditor';
import DragDropBuilder from '../common/DragDropBuilder';
import '../../prose-content.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown' },
];

const CreateContent = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const submitActionRef = useRef('draft');
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [editorReady, setEditorReady] = useState(!isEditMode);
  const [fileList, setFileList] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'builder'
  const [selectedTypeName, setSelectedTypeName] = useState('');

  useEffect(() => {
    fetchCategoriesAndTypes();
    if (isEditMode) fetchExistingContent();
  }, []);

  const fetchExistingContent = async () => {
    try {
      const res = await axios.get(`/api/user/content/${id}`);
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
      if (data.pdf_file) {
        setPdfList([{ uid: '-1', name: data.pdf_file, status: 'done', url: `/uploads/${data.pdf_file}` }]);
      }
      if (data.custom_fields) {
          try {
            const cf = typeof data.custom_fields === 'string' ? JSON.parse(data.custom_fields) : data.custom_fields;
            setCustomFields(cf || []);
          } catch { setCustomFields([]); }
        }
      if (data.webhook_url) form.setFieldsValue({ webhook_url: data.webhook_url });
      // Set selected type name for conditional rendering
      const typeName = contentTypes.find(t => t.id === data.content_type_id)?.name?.toLowerCase() || '';
      setSelectedTypeName(typeName);
    } catch {
      message.error('Failed to load article');
    }
  };

  const fetchCategoriesAndTypes = async () => {
    try {
      const [categoriesRes, typesRes] = await Promise.all([
        axios.get('/api/public/categories'),
        axios.get('/api/public/content-types')
      ]);
      setCategories(categoriesRes.data || []);
      setContentTypes(typesRes.data || []);
    } catch {
      setCategories([{ id: 1, name: 'Technology' }, { id: 2, name: 'AI' }]);
      setContentTypes([{ id: 1, name: 'Article' }, { id: 2, name: 'Blog' }]);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const skip = ['banner_image', 'content', 'tags', 'scheduled_publish_date', 'pdf_file'];
      Object.keys(values).forEach(key => {
        if (!skip.includes(key) && values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      if (values.webhook_url !== undefined) formData.set('webhook_url', values.webhook_url || '');
      if (values.tags?.length) formData.append('tags', values.tags.join(','));
      if (values.scheduled_publish_date) formData.append('scheduled_publish_date', values.scheduled_publish_date.format('YYYY-MM-DD'));
      formData.append('content', content || '');
      if (fileList.length > 0 && fileList[0].originFileObj) formData.append('banner_image', fileList[0].originFileObj);
      if (pdfList.length > 0 && pdfList[0].originFileObj) formData.append('pdf_file', pdfList[0].originFileObj);
      if (customFields.length > 0) formData.append('custom_fields', JSON.stringify(customFields));

      const typeName = contentTypes.find(t => t.id === values.content_type_id)?.name || 'Content';
      let contentId = id;

      if (isEditMode) {
        await axios.put(`/api/user/content/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success(`${typeName} updated successfully!`);
      } else {
        const response = await axios.post('/api/user/content', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        contentId = response.data.content.id;
        message.success(`${typeName} created successfully!`);
      }

      if (submitActionRef.current === 'submit') {
        await axios.post(`/api/user/content/${contentId}/submit`);
        message.success(`${typeName} submitted for review!`);
      }
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // ── Custom Fields Drag & Drop ──
  const addField = () => {
    setCustomFields(prev => [...prev, {
      id: Date.now(),
      name: `field_${Date.now()}`,
      label: '',
      type: 'text',
      placeholder: '',
      options: '',
      required: true
    }]);
  };

  const updateField = (id, key, value) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [key]: value };
      // Auto-generate a clean name from label
      if (key === 'label') {
        updated.name = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${id}`;
      }
      return updated;
    }));
  };

  const removeField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const onDragStart = (index) => { dragItem.current = index; };
  const onDragEnter = (index) => { dragOver.current = index; };
  const onDragEnd = () => {
    const fields = [...customFields];
    const dragged = fields.splice(dragItem.current, 1)[0];
    fields.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    setCustomFields(fields);
  };

  const LANDING_TYPES = ['webinar', 'whitepaper', 'event'];
  const showLandingFields = LANDING_TYPES.includes(selectedTypeName.toLowerCase());

  const getImageUrl = (file) => {
    if (!file) return null;
    if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
    return file.url || null;
  };

  const getUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Author';
    } catch { return 'Author'; }
  };

  const bannerImageUrl = fileList.length > 0 ? getImageUrl(fileList[0]) : null;

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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} style={{ color: '#595959' }}>
            Dashboard
          </Button>
          <Divider orientation="vertical" style={{ margin: 0 }} />
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>{isEditMode ? 'Edit Article' : 'New Article'}</Text>
        </div>
        <Space size={8}>
          <Button icon={<EyeOutlined />} onClick={() => {
            const v = form.getFieldsValue();
            const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
            setPreviewData({
              content_type: contentTypes.find(t => t.id === v.content_type_id)?.name || 'Article',
              category: categories.find(c => c.id === v.category_id)?.name || 'Category',
              title: v.title || 'Untitled',
              scheduled_publish_date: v.scheduled_publish_date ? v.scheduled_publish_date.format('MMMM D, YYYY') : null,
              reading_time: Math.ceil(wordCount / 200) || 1,
              banner_image: bannerImageUrl,
              short_description: v.short_description || '',
              tags: v.tags || [],
              seo_meta_title: v.seo_meta_title || '',
              seo_meta_description: v.seo_meta_description || '',
              seo_meta_keywords: v.seo_meta_keywords || '',
              content,
            });
            setPreviewVisible(true);
          }}>Preview</Button>
          <Button icon={<SaveOutlined />} loading={loading} onClick={() => { submitActionRef.current = 'draft'; form.submit(); }}>
            Save Draft
          </Button>
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => { submitActionRef.current = 'submit'; form.submit(); }}>
            Submit for Review
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'draft' }}>
        <div style={{ maxWidth: editorMode === 'builder' ? 1400 : 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Article Meta */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Article Details</Text>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <Form.Item name="content_type_id" label="Content Type" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Select placeholder="Select type" size="large" onChange={val => {
                    const name = contentTypes.find(t => t.id === val)?.name?.toLowerCase() || '';
                    setSelectedTypeName(name);
                  }}>
                    {contentTypes.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="category_id" label="Category" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Select placeholder="Select category" size="large">
                    {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Title + Description */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                <Input placeholder="Article title..." size="large"
                  style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: '#1a1a1a' }} />
              </Form.Item>
              <Form.Item name="short_description"
                label={<span>Short Description <Tooltip title="Brief summary shown in article cards"><InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 0 }}>
                <TextArea rows={3} placeholder="Write a compelling summary..." style={{ resize: 'none', fontSize: 15, lineHeight: 1.7 }} showCount maxLength={300} />
              </Form.Item>
            </div>

            {/* Banner Image */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}><PictureOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Banner Image</Text>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Recommended: 1200×630px</div>
                </div>
                <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
                  <Button icon={<UploadOutlined />} size="small">{fileList.length > 0 ? 'Change Image' : 'Upload Image'}</Button>
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

            {/* PDF Upload */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}><FilePdfOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />PDF Attachment</Text>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>This PDF will be downloaded when user submits the access form</div>
                </div>
                <Upload beforeUpload={() => false} fileList={pdfList} onChange={({ fileList: fl }) => setPdfList(fl)} maxCount={1} showUploadList={false} accept=".pdf">
                  <Button icon={<UploadOutlined />} size="small">{pdfList.length > 0 ? 'Change PDF' : 'Upload PDF'}</Button>
                </Upload>
              </div>
              {pdfList.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff2f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
                  <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                  <Text style={{ flex: 1, fontSize: 13 }}>{pdfList[0].name}</Text>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setPdfList([])} />
                </div>
              ) : (
                <div style={{ border: '2px dashed #ffccc7', borderRadius: 8, padding: '20px', textAlign: 'center', background: '#fff2f0' }}>
                  <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f', marginBottom: 4, display: 'block' }} />
                  <Text style={{ color: '#8c8c8c', fontSize: 13 }}>No PDF attached</Text>
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden', marginBottom: 20 }}>
              {/* Mode Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong style={{ fontSize: 14 }}>Content</Text>
                <div style={{ display: 'flex', gap: 0 }}>
                  {[{ key: 'write', label: '✍️ Write' }, { key: 'builder', label: '🧩 Drag & Drop' }].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setEditorMode(tab.key)}
                      style={{
                        padding: '14px 20px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: 13, fontWeight: editorMode === tab.key ? 600 : 400,
                        color: editorMode === tab.key ? '#4a7cff' : '#8c8c8c',
                        borderBottom: editorMode === tab.key ? '2px solid #4a7cff' : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Write Mode */}
              {editorMode === 'write' && (
                <div style={{ padding: '0 4px 4px' }}>
                  {editorReady ? (
                    <TipTapEditor value={content} initialContent={initialContent} onChange={setContent} placeholder="Start writing your article..." />
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>Loading editor...</div>
                  )}
                </div>
              )}

              {/* Drag & Drop Builder Mode */}
              {editorMode === 'builder' && (
                <div style={{ padding: 20 }}>
                  <DragDropBuilder onChange={setContent} />
                </div>
              )}
            </div>

            {/* Builder mode mein Tags/SEO inline show karo */}
            {editorMode === 'builder' && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e8e8e8' }}>
                  <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                    <TagOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Tags
                  </Text>
                  <Form.Item name="tags" style={{ marginBottom: 0 }}>
                    <Select mode="tags" placeholder="Add tags..." style={{ width: '100%' }} tokenSeparators={[',']} />
                  </Form.Item>
                </div>
                <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e8e8e8' }}>
                  <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                    <CalendarOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Schedule
                  </Text>
                  <Form.Item name="scheduled_publish_date" style={{ marginBottom: 0 }} help="Leave empty to publish after approval">
                    <DatePicker format="YYYY-MM-DD" placeholder="Select publish date" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div style={{ flex: 2, minWidth: 300, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e8e8e8' }}>
                  <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                    <SettingOutlined style={{ marginRight: 6, color: '#4a7cff' }} />SEO Settings
                  </Text>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Form.Item name="seo_meta_title" label={<Text style={{ fontSize: 12 }}>Meta Title</Text>} style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                      <Input placeholder="SEO title" size="small" />
                    </Form.Item>
                    <Form.Item name="seo_meta_keywords" label={<Text style={{ fontSize: 12 }}>Keywords</Text>} style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                      <Input placeholder="keyword1, keyword2" size="small" />
                    </Form.Item>
                    <Form.Item name="seo_meta_description" label={<Text style={{ fontSize: 12 }}>Meta Description</Text>} style={{ marginBottom: 0, width: '100%' }}>
                      <TextArea rows={2} placeholder="SEO description" style={{ resize: 'none', fontSize: 12 }} />
                    </Form.Item>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields Builder — only for webinar/whitepaper/event */}
            {showLandingFields && <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    <MenuOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Landing Page Form Fields
                  </Text>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                    These fields will appear in the access form. First Name, Last Name, Email, Mobile are always included.
                  </div>
                </div>
                <Button type="dashed" icon={<PlusOutlined />} onClick={addField} size="small">Add Field</Button>
              </div>

              {/* Default fields preview */}
              <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                <Text style={{ fontSize: 12, color: '#52c41a' }}>
                  ✓ Default fields (always shown): First Name · Last Name · Email Address · Mobile Number
                </Text>
              </div>

              {customFields.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c', fontSize: 13, border: '2px dashed #e8e8e8', borderRadius: 8 }}>
                  No extra fields added. Click "Add Field" to add custom fields.
                </div>
              )}

              {customFields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragEnter={() => onDragEnter(index)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => e.preventDefault()}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '12px 14px', marginBottom: 10,
                    background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8',
                    cursor: 'grab'
                  }}
                >
                  <HolderOutlined style={{ color: '#bfbfbf', marginTop: 8, cursor: 'grab', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Input
                      placeholder="Field Label (e.g. Company Name)"
                      value={field.label}
                      onChange={e => updateField(field.id, 'label', e.target.value)}
                      style={{ flex: '1 1 160px' }}
                      size="small"
                    />
                    <Select
                      value={field.type}
                      onChange={v => updateField(field.id, 'type', v)}
                      style={{ width: 120 }}
                      size="small"
                    >
                      {FIELD_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                    </Select>
                    <Input
                      placeholder="Placeholder text"
                      value={field.placeholder}
                      onChange={e => updateField(field.id, 'placeholder', e.target.value)}
                      style={{ flex: '1 1 140px' }}
                      size="small"
                    />
                    {field.type === 'select' && (
                      <Input
                        placeholder="Options (comma separated)"
                        value={field.options}
                        onChange={e => updateField(field.id, 'options', e.target.value)}
                        style={{ flex: '1 1 180px' }}
                        size="small"
                      />
                    )}
                  </div>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeField(field.id)} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>}

            {/* Webhook URL — only for webinar/whitepaper/event */}
            {showLandingFields && <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginTop: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>
                  <ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL
                </Text>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                  Jab bhi koi visitor is article ka form submit kare, form data is URL pe bhi POST hoga (client ki external API).
                </div>
              </div>
              <Form.Item name="webhook_url" style={{ marginBottom: 0 }}
                rules={[{ type: 'url', message: 'Valid URL enter karo (https://...)' }]}>
                <Input
                  placeholder="https://client-api.example.com/webhook"
                  prefix={<ApiOutlined style={{ color: '#bfbfbf' }} />}
                  allowClear
                />
              </Form.Item>
            </div>}

          </div>
          <div style={{ width: 300, flexShrink: 0, display: editorMode === 'builder' ? 'none' : 'block' }}>

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
              <Form.Item name="scheduled_publish_date" style={{ marginBottom: 0 }} help="Leave empty to publish after approval">
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

            <Form.Item name="status" hidden><Input /></Form.Item>
          </div>
        </div>
      </Form>

      {/* Preview Modal */}
      {previewVisible && previewData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
          onClick={() => setPreviewVisible(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 860, padding: 40, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <Button type="text" onClick={() => setPreviewVisible(false)} style={{ position: 'absolute', top: 16, right: 16, color: '#8c8c8c' }}>✕ Close</Button>
            <Tag color="blue">{previewData.category}</Tag>
            <Tag color="purple">{previewData.content_type}</Tag>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', margin: '16px 0', lineHeight: 1.3 }}>{previewData.title}</h1>
            {previewData.banner_image && (
              <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden' }}>
                <img src={previewData.banner_image} alt={previewData.title} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }} />
              </div>
            )}
            {previewData.short_description && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8f9fa', borderLeft: '4px solid #4a7cff', borderRadius: '0 8px 8px 0' }}>
                <Text style={{ fontSize: 15, color: '#495057', lineHeight: 1.7 }}>{previewData.short_description}</Text>
              </div>
            )}
            {previewData.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <TagOutlined style={{ color: '#8c8c8c' }} />
                {previewData.tags.map((tag, i) => (
                  <Tag key={i} color="geekblue" style={{ borderRadius: 20 }}>{tag}</Tag>
                ))}
              </div>
            )}
            {previewData.scheduled_publish_date && (
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#595959', fontSize: 13 }}>
                <CalendarOutlined style={{ color: '#4a7cff' }} />
                <Text>Scheduled: <strong>{previewData.scheduled_publish_date}</strong></Text>
              </div>
            )}
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: previewData.content || '<p>No content</p>' }} />
            {(previewData.seo_meta_title || previewData.seo_meta_description || previewData.seo_meta_keywords) && (
              <div style={{ marginTop: 32, padding: '16px 20px', background: '#f6f8fa', borderRadius: 10, border: '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>SEO Settings</Text>
                {previewData.seo_meta_title && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Meta Title</Text>
                    <div><Text>{previewData.seo_meta_title}</Text></div>
                  </div>
                )}
                {previewData.seo_meta_description && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Meta Description</Text>
                    <div><Text>{previewData.seo_meta_description}</Text></div>
                  </div>
                )}
                {previewData.seo_meta_keywords && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Keywords</Text>
                    <div><Text>{previewData.seo_meta_keywords}</Text></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateContent;
