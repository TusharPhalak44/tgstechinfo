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

// Only these 4 sections are reorderable
const STANDARD_SECTIONS = [
  { key: 'meta',    label: 'Article Details' },
  { key: 'title',   label: 'Title & Description'},
  { key: 'banner',  label: 'Banner Image'     },
  { key: 'content', label: 'Content' },
];

const CreateContent = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const layoutDragItem = useRef(null);
  const layoutDragOver = useRef(null);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [savedContentId, setSavedContentId] = useState(isEditMode ? id : null);
  const [contentStatus, setContentStatus] = useState('draft');
  const [draftSaved, setDraftSaved] = useState(isEditMode);
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
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'builder'
  const [builderContent, setBuilderContent] = useState('');
  const [builderSections, setBuilderSections] = useState([]);
  const [selectedTypeName, setSelectedTypeName] = useState('');
  const [standardLayout, setStandardLayout] = useState(STANDARD_SECTIONS.map(s => s.key));

  useEffect(() => {
    fetchCategoriesAndTypes().then(() => {
      if (isEditMode) fetchExistingContent();
    });
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
        seo_meta_keywords: data.seo_meta_keywords
          ? data.seo_meta_keywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
        scheduled_publish_date: data.scheduled_publish_date ? moment(data.scheduled_publish_date) : null
      });
      setInitialContent(data.content || '');
      setContent(data.content || '');
      setEditorReady(true);
      setContentStatus(data.status || 'draft');
      // Restore layout
      if (data.builder_layout) {
        try {
          const layout = typeof data.builder_layout === 'string' ? JSON.parse(data.builder_layout) : data.builder_layout;
          if (Array.isArray(layout) && layout.length > 0) {
            // Standard layout: array of strings like ['meta','title',...]
            if (typeof layout[0] === 'string') {
              setStandardLayout(layout);
            } else {
              // Builder layout: array of objects with id/type
              setBuilderSections(layout);
              setBuilderContent(data.content || '');
              setActiveTab('builder');
            }
          }
        } catch { /* ignore */ }
      }
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
      // Use content_type_name directly from API — don't depend on contentTypes state
      const typeName = (data.content_type_name || '').toLowerCase();
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
      return { categories: categoriesRes.data || [], contentTypes: typesRes.data || [] };
    } catch {
      const fallbackCategories = [{ id: 1, name: 'Technology' }, { id: 2, name: 'AI' }];
      const fallbackTypes = [{ id: 1, name: 'Article' }, { id: 2, name: 'Blog' }];
      setCategories(fallbackCategories);
      setContentTypes(fallbackTypes);
      return { categories: fallbackCategories, contentTypes: fallbackTypes };
    }
  };

  const buildFormData = (values) => {
    const formData = new FormData();
    const skip = ['banner_image', 'content', 'tags', 'scheduled_publish_date', 'pdf_file'];
    Object.keys(values).forEach(key => {
      if (!skip.includes(key) && values[key] !== undefined && values[key] !== null) {
        formData.append(key, values[key]);
      }
    });
    if (values.webhook_url !== undefined) formData.set('webhook_url', values.webhook_url || '');
    if (values.tags?.length) formData.append('tags', values.tags.join(','));
    if (values.seo_meta_keywords?.length) formData.set('seo_meta_keywords', values.seo_meta_keywords.join(','));
    if (values.scheduled_publish_date) formData.append('scheduled_publish_date', values.scheduled_publish_date.format('YYYY-MM-DD'));
    formData.append('content', (activeTab === 'builder' ? builderContent : content) || '');
    if (activeTab === 'builder' && builderSections.length > 0) {
      formData.append('builder_layout', JSON.stringify(builderSections));
    } else if (activeTab === 'standard') {
      formData.append('builder_layout', JSON.stringify(standardLayout));
    }
    if (fileList.length > 0 && fileList[0].originFileObj) formData.append('banner_image', fileList[0].originFileObj);
    if (pdfList.length > 0 && pdfList[0].originFileObj) formData.append('pdf_file', pdfList[0].originFileObj);
    if (customFields.length > 0) formData.append('custom_fields', JSON.stringify(customFields));
    return formData;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const formData = buildFormData(values);
      const typeName = contentTypes.find(t => t.id === values.content_type_id)?.name || 'Content';

      if (savedContentId) {
        const existing = (await axios.get(`/api/user/content/${savedContentId}`)).data;
        if (existing.status === 'published') {
          await axios.put(`/api/user/content/${savedContentId}/webhook`, {
            webhook_url: values.webhook_url || '',
            ...(customFields.length > 0 ? { custom_fields: JSON.stringify(customFields) } : {})
          });
          message.success('Settings updated successfully!');
        } else {
          await axios.put(`/api/user/content/${savedContentId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setContentStatus(existing.status);
          setDraftSaved(true);
          message.success(`${typeName} updated! Edit anytime before submitting.`);
        }
      } else {
        const response = await axios.post('/api/user/content', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSavedContentId(response.data.content.id);
        setContentStatus('draft');
        setDraftSaved(true);
        message.success(`${typeName} saved as draft! You can edit before submitting.`);
      }
    } catch (error) {
      if (error?.errorFields) return; // validation error, antd handles it
      message.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!savedContentId) return;
    setSubmitLoading(true);
    try {
      const typeName = contentTypes.find(t => t.id === form.getFieldValue('content_type_id'))?.name || 'Content';
      await axios.post(`/api/user/content/${savedContentId}/submit`);
      setContentStatus('pending');
      message.success(`${typeName} submitted for review!`);
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitLoading(false);
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

  // Standard layout drag handlers
  const onLayoutDragStart = (index) => { layoutDragItem.current = index; };
  const onLayoutDragEnter = (index) => { layoutDragOver.current = index; };
  const onLayoutDragEnd = () => {
    if (layoutDragItem.current === null || layoutDragOver.current === null) return;
    const items = [...standardLayout];
    const dragged = items.splice(layoutDragItem.current, 1)[0];
    items.splice(layoutDragOver.current, 0, dragged);
    layoutDragItem.current = null;
    layoutDragOver.current = null;
    setStandardLayout(items);
  };

  const LANDING_TYPES = ['webinar', 'whitepaper', 'event', 'ebook'];
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
              content: activeTab === 'builder' ? builderContent : content,
            });
            setPreviewVisible(true);
          }}>Preview</Button>
          <Button
            icon={<SaveOutlined />}
            loading={loading}
            disabled={contentStatus === 'pending'}
            onClick={handleSave}
          >
            {savedContentId ? 'Update Draft' : 'Save Draft'}
          </Button>
          <Tooltip title={
            !savedContentId ? 'Please save the content first' :
            contentStatus === 'pending' ? 'Already under review' : ''
          }>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitLoading}
              disabled={!savedContentId || contentStatus === 'pending'}
              onClick={handleSubmitForReview}
            >
              {contentStatus === 'pending' ? 'Under Review' : 'Submit for Review'}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {draftSaved && contentStatus !== 'published' && contentStatus !== 'pending' && (
        <div style={{
          background: '#f6ffed', borderBottom: '1px solid #b7eb8f',
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 16 }}>✏️</span>
          <span style={{ fontSize: 13, color: '#389e0d', fontWeight: 500 }}>
            {contentStatus === 'changes_requested'
              ? 'Admin has requested changes. Edit your content and save, then re-submit for review.'
              : 'Draft saved! You can freely edit — change title, structure, images, or any field. Save again to update, then submit for review.'}
          </span>
        </div>
      )}
      {contentStatus === 'pending' && (
        <div style={{
          background: '#fffbe6', borderBottom: '1px solid #ffe58f',
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 16 }}>⏳</span>
          <span style={{ fontSize: 13, color: '#d48806', fontWeight: 500 }}>
            Content is under review. Editing is locked until admin responds.
          </span>
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={{ status: 'draft' }}>

        {/* Page-level Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 }}>
            {[
              { key: 'standard', label: 'Standard Form', desc: 'Fill all fields directly' },
              { key: 'builder', label: 'Drag & Drop Builder', desc: 'Build structure by dragging blocks' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '14px 24px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? '#4a7cff' : '#595959',
                  borderBottom: activeTab === tab.key ? '2px solid #4a7cff' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: activeTab === 'builder' ? 1400 : 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* ── STANDARD FORM TAB ── */}
            {activeTab === 'standard' && (() => {
              const sectionMap = {
                meta: (
                  <div key="meta" style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
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
                ),
                title: (
                  <div key="title" style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                    <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                      <Input placeholder="Article title..." size="large"
                        style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: '#1a1a1a' }} />
                    </Form.Item>
                    <Form.Item name="short_description"
                      label={<span>Short Description <Tooltip title="Brief summary shown in article cards"><InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                      rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 0 }}>
                      <TextArea rows={3} placeholder="Write a compelling summary..." style={{ resize: 'none', fontSize: 15, lineHeight: 1.7 }} />
                    </Form.Item>
                  </div>
                ),
                banner: (
                  <div key="banner" style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
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
                ),
                content: (
                  <div key="content" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '14px 28px', borderBottom: '1px solid #f0f0f0' }}>
                      <Text strong style={{ fontSize: 14 }}>Content</Text>
                    </div>
                    <div style={{ padding: '0 4px 4px' }}>
                      {editorReady ? (
                        <TipTapEditor value={content} initialContent={initialContent} onChange={setContent} placeholder="Start writing your article..." />
                      ) : (
                        <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>Loading editor...</div>
                      )}
                    </div>
                  </div>
                ),
              };

              return (
                <>
                  {standardLayout.map(key => sectionMap[key] || null)}

                  {/* Fixed: PDF Attachment — always below reorderable sections */}
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

                  {/* Fixed: Landing + Webhook — only for webinar/whitepaper/event */}
                  {showLandingFields && (
                    <>
                      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                            <Text strong style={{ fontSize: 14 }}><MenuOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Landing Page Form Fields</Text>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Add all form fields with their label, API key, and type.</div>
                          </div>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addField} size="small">Add Field</Button>
                        </div>
                        {customFields.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c', fontSize: 13, border: '2px dashed #e8e8e8', borderRadius: 8 }}>
                            No fields added. Click "Add Field" to add form fields.
                          </div>
                        )}
                        {customFields.map((field, index) => (
                          <div key={field.id} draggable
                            onDragStart={() => onDragStart(index)} onDragEnter={() => onDragEnter(index)}
                            onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', marginBottom: 10, background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', cursor: 'grab' }}
                          >
                            <HolderOutlined style={{ color: '#bfbfbf', marginTop: 8, flexShrink: 0 }} />
                            <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <Input placeholder="Field Label (e.g. First Name)" value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} style={{ flex: '1 1 140px' }} size="small" />
                              <Input placeholder="API Key (e.g. firstname)" value={field.webhook_key || ''} onChange={e => updateField(field.id, 'webhook_key', e.target.value)} style={{ flex: '1 1 130px' }} size="small" />
                              <Select value={field.type} onChange={v => updateField(field.id, 'type', v)} style={{ width: 110 }} size="small">
                                {FIELD_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                              </Select>
                              <Input placeholder="Placeholder text" value={field.placeholder} onChange={e => updateField(field.id, 'placeholder', e.target.value)} style={{ flex: '1 1 130px' }} size="small" />
                              {field.type === 'select' && (
                                <Input placeholder="Options (comma separated)" value={field.options} onChange={e => updateField(field.id, 'options', e.target.value)} style={{ flex: '1 1 180px' }} size="small" />
                              )}
                            </div>
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeField(field.id)} style={{ flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginBottom: 20 }}>
                        <div style={{ marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 14 }}><ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL</Text>
                        </div>
                        <Form.Item name="webhook_url" style={{ marginBottom: 0 }} rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
                          <Input placeholder="https://client-api.example.com/webhook" prefix={<ApiOutlined style={{ color: '#bfbfbf' }} />} allowClear />
                        </Form.Item>
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            {/* ── DRAG & DROP BUILDER TAB ── */}
            {activeTab === 'builder' && (
              <DragDropBuilder
                sectionProps={{
                  form,
                  categories,
                  contentTypes,
                  setSelectedTypeName,
                  fileList,
                  setFileList,
                  pdfList,
                  setPdfList,
                  content: builderContent,
                  setContent: setBuilderContent,
                  initialContent,
                  editorReady,
                }}
                selectedTypeName={selectedTypeName}
                customFields={customFields}
                setCustomFields={setCustomFields}
                fieldTypes={FIELD_TYPES}
                sections={builderSections}
                onSectionsChange={setBuilderSections}
              />
            )}
          </div>

          {/* Sidebar — only for Standard Form tab */}
          <div style={{ width: 300, flexShrink: 0, display: activeTab === 'builder' ? 'none' : 'block' }}>

            {/* Layout Reorder Panel */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                <HolderOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Reorder Layout
              </Text>
              <Text style={{ fontSize: 11, color: '#8c8c8c', display: 'block', marginBottom: 12 }}>Drag sections to change order</Text>
              {standardLayout.map((key, index) => {
                const sec = STANDARD_SECTIONS.find(s => s.key === key);
                if (!sec) return null;
                // hide landing/webhook if not applicable
                if ((key === 'landing' || key === 'webhook') && !showLandingFields) return null;
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => onLayoutDragStart(index)}
                    onDragEnter={() => onLayoutDragEnter(index)}
                    onDragEnd={onLayoutDragEnd}
                    onDragOver={e => e.preventDefault()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', marginBottom: 6,
                      background: '#fafafa', borderRadius: 8,
                      border: '1px solid #e8e8e8', cursor: 'grab',
                      userSelect: 'none'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; e.currentTarget.style.background = '#f0f4ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#fafafa'; }}
                  >
                    <HolderOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                    <span style={{ fontSize: 14 }}>{sec.icon}</span>
                    <span style={{ fontSize: 12, color: '#1a1a2e', flex: 1 }}>{sec.label}</span>
                    <span style={{ fontSize: 10, color: '#bfbfbf', fontWeight: 600 }}>{index + 1}</span>
                  </div>
                );
              })}
            </div>
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
                <Select mode="tags" placeholder="Add keyword and press Enter..." style={{ width: '100%' }} size="small" tokenSeparators={[',']} />
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