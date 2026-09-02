import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Select, Button, message, DatePicker,
  Upload, Space, Divider, Typography, Tooltip, Tag, Modal, ConfigProvider, Checkbox
} from 'antd';
import {
  UploadOutlined, SaveOutlined, SendOutlined, EyeOutlined,
  CalendarOutlined, ClockCircleOutlined, UserOutlined, TagOutlined,
  PictureOutlined, SettingOutlined, InfoCircleOutlined, ArrowLeftOutlined,
  FilePdfOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, MenuOutlined, ApiOutlined, CodeOutlined,
  BookOutlined, QuestionCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import TipTapEditor from '../common/TipTapEditor';
import HtmlEditor from '../editor/HtmlEditor';
import '../../prose-content.css';
// New builder architecture imports
import { BuilderProvider } from '../../builder/core/BuilderStore.jsx';
import { registerAllWidgets } from '../../builder/registry/registerWidgets';
import BuilderIntegration from '../../builder/components/BuilderIntegration';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import MediaLibraryModal from '../common/MediaLibraryModal';
import { EditorialGuidelines } from '../guidelines/EditorialGuidelines';
import { SubmissionInstructions } from '../guidelines/SubmissionInstructions';
import { TermsAndConditions } from '../guidelines/TermsAndConditions';

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
  { value: 'checkbox', label: 'Consent Checkbox' },
];

// Only these 4 sections are reorderable
const STANDARD_SECTIONS = [
  { key: 'meta',    label: 'Article Details' },
  { key: 'title',   label: 'Title & Description'},
  { key: 'banner',  label: 'Banner Image'     },
  { key: 'content', label: 'Content' },
];

const SECTION_TYPES = [
  { type: 'content_type_category', label: 'Content Type & Category' },
  { type: 'title_description',     label: 'Title & Description' },
  { type: 'banner_image',          label: 'Banner Image' },
  { type: 'pdf_attachment',        label: 'PDF Attachment' },
  { type: 'content',               label: 'Content' },
  { type: 'tags',                  label: 'Tags' },
  { type: 'schedule',              label: 'Schedule' },
  { type: 'reorder_layout',        label: 'Reorder Layout' },
  { type: 'seo',                   label: 'SEO Settings' },
];

const CreateContent = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const layoutDragItem = useRef(null);
  const layoutDragOver = useRef(null);
  const builderLayoutDragItem = useRef(null);
  const builderLayoutDragOver = useRef(null);
  const builderPreviewTrigger = React.useRef(null);

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
  const [htmlPreviewVisible, setHtmlPreviewVisible] = useState(false);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'builder' | 'html'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [builderPageData, setBuilderPageData] = useState(null); // v2.0 full page tree from VisualBuilder
  const [builderContent, setBuilderContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [editContentType, setEditContentType] = useState(null); // Store content type for back navigation
  const [builderSections, setBuilderSections] = useState([
    { id: 'sec-1', type: 'content_type_category' },
    { id: 'sec-2', type: 'title_description' },
    { id: 'sec-3', type: 'banner_image' },
    { id: 'sec-4', type: 'content' }
  ]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [selectedTypeName, setSelectedTypeName] = useState('');
  const [standardLayout, setStandardLayout] = useState(STANDARD_SECTIONS.map(s => s.key));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Guidelines modals state
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

// Initialize new builder architecture - register widgets once globally
  useEffect(() => {
    if (!window.__widgetsRegistered) {
      registerAllWidgets();
      window.__widgetsRegistered = true;
      console.log('[CreateContent] Widgets registered');
    }
  }, []);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && activeTab === 'builder') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in the builder. Your work is auto-saved, but leaving now may lose very recent changes.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, activeTab]);

  useEffect(() => {
    fetchCategoriesAndTypes().then(() => {
      if (isEditMode) fetchExistingContent();
    });
  }, []);

  const fetchExistingContent = async () => {
    try {
      console.log('[CreateContent] fetchExistingContent - id:', id, 'isAdmin:', isAdmin);
      const apiBase = isAdmin ? '/api/admin' : '/api/user';
      console.log('[CreateContent] fetchExistingContent - apiBase:', apiBase);
      console.log('[CreateContent] fetchExistingContent - URL:', `${apiBase}/content/${id}`);
      
      const res = await axios.get(`${apiBase}/content/${id}`);
      const data = res.data;
      console.log('[CreateContent] fetchExistingContent - data received:', data);
      
      // Store content type for back navigation
      if (data.content_type_name) {
        const contentTypeSlug = data.content_type_name.toLowerCase().replace(/\s+/g, '-');
        setEditContentType(contentTypeSlug);
      }
      
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
        case_study_headline: data.case_study_headline || '',
        case_study_summary: data.case_study_summary || '',
        email_template: data.email_template || '',
        tags,
        seo_meta_title: data.seo_meta_title,
        seo_meta_description: data.seo_meta_description,
        seo_meta_keywords: data.seo_meta_keywords
          ? data.seo_meta_keywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
        scheduled_publish_date: data.scheduled_publish_date ? moment(data.scheduled_publish_date) : null
      });
      setContentStatus(data.status || 'draft');
      
      // Restore layout first to determine which tab to use
      if (data.builder_layout) {
        try {
          const layout = typeof data.builder_layout === 'string' ? JSON.parse(data.builder_layout) : data.builder_layout;
          
          // Check if this is HTML Builder content (layout === ['html'])
          if (Array.isArray(layout) && layout.length > 0 && layout[0] === 'html') {
            // HTML Builder mode
            setActiveTab('html');
            setHtmlContent(data.content || '');
            setInitialContent('');
            setContent('');
            setEditorReady(true);
          } else if (data.builder_page_data) {
            // v2.0 visual builder data — restore it directly
            let pageData = data.builder_page_data;
            if (typeof pageData === 'string') {
              try { pageData = JSON.parse(pageData); } catch { pageData = null; }
            }
            setBuilderPageData(pageData);
            setBuilderSections(Array.isArray(layout) && typeof layout[0] !== 'string'
              ? layout
              : [{ id: 'sec-1', type: 'content_type_category' }, { id: 'sec-2', type: 'title_description' }, { id: 'sec-3', type: 'banner_image' }, { id: 'sec-4', type: 'content' }]);
            setActiveTab('builder');
            setInitialContent('');
            setContent('');
            setEditorReady(true);
          } else if (Array.isArray(layout) && layout.length > 0) {
            // Standard layout: array of strings like ['meta','title',...]
            if (typeof layout[0] === 'string') {
              setStandardLayout(layout);
              setActiveTab('standard');
              setInitialContent(data.content || '');
              setContent(data.content || '');
              setEditorReady(true);
            } else {
              // Builder layout: array of objects with id/type — open in Visual Builder
              setBuilderSections(layout);
              setBuilderContent(data.content || '');
              setActiveTab('builder');
              setInitialContent('');
              setContent('');
              setEditorReady(true);
            }
          }
        } catch (e) { 
          console.error('Error parsing builder_layout:', e);
          setActiveTab('standard');
          setInitialContent(data.content || '');
          setContent(data.content || '');
          setEditorReady(true);
        }
      } else {
        // No builder_layout saved, default to standard
        setActiveTab('standard');
        setInitialContent(data.content || '');
        setContent(data.content || '');
        setEditorReady(true);
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
      
      // Clear any stale localStorage backup since we loaded fresh data from server
      if (id) {
        const storageKey = `builder_autosave_${id}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_timestamp`);
        console.log('[CreateContent] Cleared localStorage after loading content from server');
      }
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

  const checkDuplicateContent = async (title, shortDescription, tags) => {
    if (!title || title.length < 3) {
      setDuplicateWarning(null);
      return;
    }

    try {
      const response = await axios.get('/api/public/content', {
        params: {
          title: title.substring(0, 50),
          limit: 5
        }
      });

      const existingContent = response.data?.data || [];
      
      if (existingContent.length > 0) {
        const exactMatch = existingContent.find(content => {
          return content.title?.toLowerCase().trim() === title.toLowerCase().trim();
 

        });

       if (exactMatch) {
          setDuplicateWarning({
            found: true,
            isExact: true,
            title: exactMatch.title,
            status: exactMatch.status
          });
          message.error(`Content with title "${title}" already exists (Status: ${exactMatch.status}). Please use a different title.`);
        } else {
          setDuplicateWarning(null);
        }
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error('Error checking duplicate content:', error);
      setDuplicateWarning(null);
    }
  };

  const parseFormFieldsFromHtml = (html) => {
    if (!html) return [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const formElements = doc.querySelectorAll('input, select, textarea');
      const fields = [];
      const seenNames = new Set();

      formElements.forEach((el, index) => {
        const name = el.getAttribute('name') || el.getAttribute('id');
        if (name && !seenNames.has(name) && el.type !== 'submit' && el.type !== 'button') {
          seenNames.add(name);
          const label = el.getAttribute('placeholder') || el.getAttribute('name') || name;
          // Normalize field name to match column name requirements (lowercase alphanumeric and underscore)
          const normalizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^([0-9])/, '_$1').substring(0, 64);
          fields.push({
            id: Date.now() + index,
            name: normalizedName,
            label: label,
            type: el.tagName.toLowerCase() === 'textarea' ? 'textarea' : (el.getAttribute('type') || 'text'),
            placeholder: el.getAttribute('placeholder') || '',
            required: el.hasAttribute('required')
          });
        }
      });
      return fields;
    } catch (e) {
      console.error('Error parsing HTML form fields:', e);
      return [];
    }
  };

  // Walk the builder page tree and collect all Form widget field definitions.
  // These are saved as content.custom_fields so createDynamicTable runs on save.
  const extractBuilderFormFields = (pageData) => {
    const fields = [];
    const walk = (node) => {
      if (!node) return;
      if (node.type === 'form') {
        try {
          const formContent = typeof node.content === 'string' ? JSON.parse(node.content) : (node.content || {});
          const formFields = formContent.fields || [];
          formFields.forEach(f => {
            if (f.label || f.id) {
              // Use apiKey if set, otherwise generate from label
              const fieldName = f.apiKey && f.apiKey.trim() 
                ? f.apiKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_|_$/g, '').substring(0, 64)
                : (f.label || f.id).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').substring(0, 64) || f.id;
              
              fields.push({
                id: f.id,
                name: fieldName,
                label: f.label || f.id,
                type: f.type || 'text',
                required: f.required !== false,
                placeholder: f.placeholder || '',
              });
            }
          });
        } catch (e) { /* skip malformed nodes */ }
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
    };
    // v2.0 format: { version, layout: <rootNode> }  — layout IS the root node (type:'page')
    // Legacy format: { root: <rootNode> }
    const root = pageData?.layout || pageData?.root || pageData;
    walk(root);
    return fields;
  };

  // Extract the first Form widget's apiUrl from the Visual Builder tree.
  // Saved as content.webhook_url so the backend POSTs to it on form submission.
  const extractBuilderWebhookUrl = (pageData) => {
    let found = null;
    const walk = (node) => {
      if (found || !node) return;
      if (node.type === 'form') {
        try {
          const fc = typeof node.content === 'string' ? JSON.parse(node.content) : (node.content || {});
          if (fc.apiUrl && fc.apiUrl.trim()) found = fc.apiUrl.trim();
        } catch (e) { /* skip */ }
      }
      if (!found && Array.isArray(node.children)) node.children.forEach(walk);
    };
    const root = pageData?.layout || pageData?.root || pageData;
    walk(root);
    return found;
  };

  const buildFormData = (values) => {
    const formData = new FormData();
    const skip = ['banner_image', 'content', 'tags', 'scheduled_publish_date', 'pdf_file', 'status'];
    Object.keys(values).forEach(key => {
      if (!skip.includes(key) && values[key] !== undefined && values[key] !== null) {
        formData.append(key, values[key]);
      }
    });
    if (values.webhook_url !== undefined) formData.set('webhook_url', values.webhook_url || '');
    if (values.tags?.length) formData.append('tags', values.tags.join(','));
    if (values.seo_meta_keywords?.length) formData.set('seo_meta_keywords', values.seo_meta_keywords.join(','));
    if (values.scheduled_publish_date) formData.append('scheduled_publish_date', values.scheduled_publish_date.format('YYYY-MM-DD'));
    
    // Generate content based on active tab
    let finalContent = content;
    if (activeTab === 'builder') {
      finalContent = builderContent;
    } else if (activeTab === 'html') {
      finalContent = htmlContent;
    }
    
    formData.append('content', finalContent || '');
    if (activeTab === 'html') {
      formData.append('builder_layout', JSON.stringify(['html']));
    } else if (activeTab === 'builder' && builderSections.length > 0) {
      formData.append('builder_layout', JSON.stringify(builderSections));
      // Persist v2.0 page tree (Visual Builder)
      if (builderPageData) {
        const pageDataStr = typeof builderPageData === 'string'
          ? builderPageData
          : JSON.stringify(builderPageData);
        formData.append('builder_page_data', pageDataStr);
      }
    } else if (activeTab === 'standard') {
      formData.append('builder_layout', JSON.stringify(standardLayout));
    }
    if (fileList.length > 0 && fileList[0].originFileObj) formData.append('banner_image', fileList[0].originFileObj);
    if (pdfList.length > 0 && pdfList[0].originFileObj) formData.append('pdf_file', pdfList[0].originFileObj);
    
    // Determine custom fields
    let finalCustomFields = customFields;
    if (activeTab === 'html') {
      finalCustomFields = parseFormFieldsFromHtml(htmlContent);
    } else if (activeTab === 'builder' && builderPageData) {
      // Extract Form widget fields from the builder tree so createDynamicTable runs automatically
      const extractedFormFields = extractBuilderFormFields(builderPageData);
      if (extractedFormFields.length > 0) {
        finalCustomFields = extractedFormFields;
      }
    }
    if (finalCustomFields.length > 0) formData.append('custom_fields', JSON.stringify(finalCustomFields));

    // Visual Builder: extract webhook URL from Form widget's apiUrl only if manual field is empty
    // Priority: manual webhook_url field > Form widget apiUrl
    if (activeTab === 'builder' && builderPageData && !values.webhook_url) {
      const builderWebhookUrl = extractBuilderWebhookUrl(builderPageData);
      if (builderWebhookUrl) {
        formData.set('webhook_url', builderWebhookUrl);
      }
    }
    
    // HTML Builder: always use manual webhook_url field if provided
    // The backend will prioritize manual webhook_url over HTML-extracted URLs
    
    return formData;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const formData = buildFormData(values);
      const typeName = contentTypes.find(t => t.id === values.content_type_id)?.name || 'Content';

      const apiBase = isAdmin ? '/api/admin' : '/api/user';

      if (savedContentId) {
        const existing = (await axios.get(`${apiBase}/content/${savedContentId}`)).data;
        
        if (existing.status === 'published') {
          // For published content, only update webhook settings and custom fields
          let finalCustomFields = customFields;
          if (activeTab === 'html') {
            finalCustomFields = parseFormFieldsFromHtml(htmlContent);
          } else if (activeTab === 'builder' && builderPageData) {
            finalCustomFields = extractBuilderFormFields(builderPageData);
          }
          
          await axios.put(`${apiBase}/content/${savedContentId}/webhook`, {
            webhook_url: values.webhook_url || existing.webhook_url || '',
            ...(finalCustomFields.length > 0 ? { custom_fields: JSON.stringify(finalCustomFields) } : {})
          });
          message.success('Settings updated successfully!');
        } else {
-          // For draft/pending/changes_requested content, update full content and force status to 'draft'
          formData.append('status', 'draft'); // Explicitly set status to 'draft' on manual save
          await axios.put(`${apiBase}/content/${savedContentId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setContentStatus('draft'); // Update local state to reflect draft status
          setDraftSaved(true);
          message.success(`${typeName} updated! Edit anytime before submitting.`);
        }
      } else {
        // Creating new content - explicitly set status to 'draft'
        formData.append('status', 'draft');
        const response = await axios.post(`${apiBase}/content`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSavedContentId(response.data.content.id);
        setContentStatus('draft');
        setDraftSaved(true);
        message.success(`${typeName} saved! Edit anytime before submitting.`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      // Handle validation errors
      if (error.errorFields && error.errorFields.length > 0) {
        const missingFields = error.errorFields.map(field => {
          const fieldName = Array.isArray(field.name) ? field.name.join('.') : field.name;
          return field.errors[0] || fieldName;
        });
        message.error({
          content: (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Please complete the following required fields:</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {missingFields.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 5
        });
      } else {
        // Handle server errors
        message.error(error.response?.data?.message || 'Failed to save content');
      }
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const formData = buildFormData(values);
      const typeName = contentTypes.find(t => t.id === values.content_type_id)?.name || 'Content';

      const apiBase = isAdmin ? '/api/admin' : '/api/user';
      const redirectPath = isAdmin ? '/admin' : '/user-dashboard';

      let contentId = savedContentId;
      if (contentId) {
        await axios.put(`${apiBase}/content/${contentId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const createRes = await axios.post(`${apiBase}/content`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        contentId = createRes.data.content.id;
        setSavedContentId(contentId);
      }
      const response = await axios.post(`${apiBase}/content/${contentId}/submit`);
      setContentStatus(response.data.content.status);
      
      // Clear localStorage backup after successful submission
      const storageKey = `builder_autosave_${contentId || 'draft'}`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_timestamp`);
      
      message.success(`${typeName} submitted for review!`);
      navigate(redirectPath);
    } catch (error) {
      console.error('Error submitting content:', error);
      // Handle validation errors
      if (error.errorFields && error.errorFields.length > 0) {
        const missingFields = error.errorFields.map(field => {
          const fieldName = Array.isArray(field.name) ? field.name.join('.') : field.name;
          return field.errors[0] || fieldName;
        });
        message.error({
          content: (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Please complete the following required fields:</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {missingFields.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 5
        });
      } else {
        // Handle server errors
        message.error(error.response?.data?.message || 'Failed to submit content');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const calculateSEOScore = (title, description, content, tags, seoMetaTitle, seoMetaDescription, seoMetaKeywords) => {
    let score = 0;
    let maxScore = 100;
    let issues = [];

    // Title analysis (20 points)
    if (title && title.length >= 30 && title.length <= 60) {
      score += 20;
    } else if (title && title.length > 0) {
      score += 10;
      issues.push(title.length < 30 ? 'Title is too short (should be 30-60 characters)' : 'Title is too long (should be 30-60 characters)');
    } else {
      issues.push('Title is missing');
    }

    // Description analysis (15 points)
    if (description && description.length >= 120 && description.length <= 160) {
      score += 15;
    } else if (description && description.length > 0) {
      score += 8;
      issues.push(description.length < 120 ? 'Description is too short (should be 120-160 characters)' : 'Description is too long (should be 120-160 characters)');
    } else {
      issues.push('Description is missing');
    }

    // Content length analysis (25 points)
    const plainContent = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 300) {
      score += 25;
    } else if (wordCount >= 150) {
      score += 15;
      issues.push('Content is too short (should be at least 300 words)');
    } else {
      issues.push('Content is too short (should be at least 300 words)');
    }

    // Tags analysis (10 points)
    if (tags && tags.length >= 3) {
      score += 10;
    } else if (tags && tags.length > 0) {
      score += 5;
      issues.push('Add more tags (should have at least 3 tags)');
    } else {
      issues.push('Tags are missing');
    }

    // SEO Meta Title analysis (15 points)
    if (seoMetaTitle && seoMetaTitle.length >= 30 && seoMetaTitle.length <= 60) {
      score += 15;
    } else if (seoMetaTitle && seoMetaTitle.length > 0) {
      score += 8;
      issues.push(seoMetaTitle.length < 30 ? 'SEO meta title is too short (should be 30-60 characters)' : 'SEO meta title is too long (should be 30-60 characters)');
    } else {
      issues.push('SEO meta title is missing');
    }

    // SEO Meta Description analysis (15 points)
    if (seoMetaDescription && seoMetaDescription.length >= 120 && seoMetaDescription.length <= 160) {
      score += 15;
    } else if (seoMetaDescription && seoMetaDescription.length > 0) {
      score += 8;
      issues.push(seoMetaDescription.length < 120 ? 'SEO meta description is too short (should be 120-160 characters)' : 'SEO meta description is too long (should be 120-160 characters)');
    } else {
      issues.push('SEO meta description is missing');
    }

    return {
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      issues,
      wordCount
    };
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      const formData = buildFormData(values);

      // Generate content based on active tab
      let finalContent = content;
      if (activeTab === 'builder') {
        finalContent = builderContent;
      } else if (activeTab === 'html') {
        finalContent = htmlContent;
      }

      // Calculate SEO score
      const seoScore = calculateSEOScore(
        values.title,
        values.short_description,
        finalContent,
        values.tags,
        values.seo_meta_title,
        values.seo_meta_description,
        values.seo_meta_keywords
      );

      // Generate preview data
      const previewData = {
        title: values.title,
        description: values.short_description,
        content: finalContent,
        banner_image: values.banner_image,
        content_type_id: values.content_type_id,
        category_id: values.category_id,
        seoScore
      };

      setPreviewData(previewData);
      setPreviewVisible(true);
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Please fill in required fields');
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
      required: true,
       consent_text: '',
      redirect_link: ''
    }]);
  };

  const updateField = (id, key, value) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [key]: value };
      // Auto-generate a clean name from label
      if (key === 'label') {
        updated.name = (value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${id}`;
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

  // Builder layout drag handlers
  const onBuilderLayoutDragStart = (index) => { builderLayoutDragItem.current = index; };
  const onBuilderLayoutDragEnter = (index) => { builderLayoutDragOver.current = index; };
  const onBuilderLayoutDragEnd = () => {
    if (builderLayoutDragItem.current === null || builderLayoutDragOver.current === null) return;
    const items = [...builderSections];
    const dragged = items.splice(builderLayoutDragItem.current, 1)[0];
    items.splice(builderLayoutDragOver.current, 0, dragged);
    builderLayoutDragItem.current = null;
    builderLayoutDragOver.current = null;
    setBuilderSections(items);
  };

 const LANDING_TYPES = ['webinar', 'whitepaper', 'event', 'ebook', 'case study', 'case-study', 'landing page', 'landing-page'];
  const showLandingFields = LANDING_TYPES.includes(selectedTypeName.toLowerCase());
  const isCaseStudy = ['case study', 'case-study'].includes(selectedTypeName.toLowerCase());
const isLandingPageType = ['landing page', 'landing-page'].includes(selectedTypeName.toLowerCase());
 
  // Auto-switch to HTML Builder tab when Landing Page type is selected (new content only)
  useEffect(() => {
    if (isLandingPageType && !isEditMode) {
      setActiveTab('html');
    }
  }, [isLandingPageType]);
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
    <>
      <style>
        {`
          @keyframes propertiesIndicator {
            0%, 100% {
              transform: translateY(-50%) scaleY(1);
              opacity: 0.6;
            }
            50% {
              transform: translateY(-50%) scaleY(1.3);
              opacity: 1;
            }
          }
        `}
      </style>
      <ConfigProvider
        theme={{
          token: {
            colorBgContainer: darkMode ? '#1e293b' : '#fff',
            colorText: darkMode ? '#cbd5e1' : '#374151',
            colorBorder: darkMode ? '#334155' : '#e5e7eb',
            colorBgElevated: darkMode ? '#1e293b' : '#fff',
            colorTextPlaceholder: darkMode ? '#64748b' : '#bfbfbf',
          },
        }}
      >
      <div style={{ minHeight: '100vh', background: darkMode ? '#0f172a' : '#f5f5f5', paddingTop: '64px' }}>

        {/* Top Header */}
        <div style={{
          background: darkMode ? '#1e293b' : '#fff', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e8e8e8',
          padding: '0 clamp(12px, 2vw, 24px)', height: 'clamp(48px, 6vw, 56px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 16px)' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => {
                if (isEditMode && editContentType && id) {
                  navigate(`/dashboard/${editContentType}/${id}`);
                } else {
                  navigate(isAdmin ? '/admin' : '/user-dashboard');
                }
              }} 
              style={{ color: darkMode ? '#94a3b8' : '#595959', fontSize: 'clamp(12px, 0.9vw, 13px)' }} 
              size={window.innerWidth < 768 ? 'small' : 'middle'}
            >
              {window.innerWidth < 768 ? '' : (isEditMode ? 'Back to Content' : (isAdmin ? 'Dashboard' : 'Dashboard'))}
            </Button>
            {window.innerWidth >= 768 && <Divider orientation="vertical" style={{ margin: 0, borderColor: darkMode ? '#334155' : '#e8e8e8' }} />}
            <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 'clamp(11px, 0.85vw, 13px)' }}>{isEditMode ? 'Edit Article' : 'New Article'}</Text>
          </div>
        <Space size={window.innerWidth < 768 ? 4 : 8} wrap style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<EyeOutlined />} onClick={() => {
            const v = form.getFieldsValue();

            // When in builder mode, trigger the builder's own preview modal
            // (which renders PreviewCanvas inside its BuilderProvider)
            if (activeTab === 'builder') {
              if (builderPreviewTrigger.current) {
                builderPreviewTrigger.current();
              }
              return;
            }

            const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
            
            // Generate content based on active tab
            let previewContent = content;
            if (activeTab === 'html') {
              previewContent = htmlContent;
            }

            // Calculate SEO score
            const seoScore = calculateSEOScore(
              v.title,
              v.short_description,
              previewContent,
              v.tags,
              v.seo_meta_title,
              v.seo_meta_description,
              v.seo_meta_keywords
            );

            setPreviewData({
              content_type: contentTypes.find(t => t.id === v.content_type_id)?.name || '',
              category: categories.find(c => c.id === v.category_id)?.name || '',
              title: v.title || 'Untitled',
              scheduled_publish_date: v.scheduled_publish_date ? v.scheduled_publish_date.format('MMMM D, YYYY') : null,
              reading_time: Math.ceil(wordCount / 200) || 1,
              banner_image: bannerImageUrl,
              short_description: v.short_description || '',
              tags: v.tags || [],
              seo_meta_title: v.seo_meta_title || '',
              seo_meta_description: v.seo_meta_description || '',
              seo_meta_keywords: v.seo_meta_keywords || '',
              content: previewContent,
              seoScore,
            });
            setPreviewVisible(true);
          }} size="small" style={{ borderRadius: 6, fontSize: 13, height: 32, padding: '4px 12px', minWidth: 'auto' }}>Preview</Button>
          <Button
            icon={<SaveOutlined />}
            loading={loading}
            disabled={contentStatus === 'pending'}
            onClick={handleSave}
            size="small"
            style={{ borderRadius: 6, fontSize: 13, height: 32, padding: '4px 12px', minWidth: 'auto' }}
          >
            {window.innerWidth < 768 ? (savedContentId ? 'Update' : 'Save') : (savedContentId ? 'Update Draft' : 'Save Draft')}
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
              onClick={handleSubmit}
              size="small"
              style={{ borderRadius: 6, fontSize: 13, height: 32, padding: '4px 12px', minWidth: 'auto', color: darkMode ? '#fff' : undefined }}
            >
              {window.innerWidth < 768 ? (contentStatus === 'pending' ? 'Review' : 'Submit') : (contentStatus === 'pending' ? 'Under Review' : 'Submit for Review')}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {draftSaved && contentStatus !== 'published' && contentStatus !== 'pending' && (
        <div style={{
          background: darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f6ffed', borderBottom: darkMode ? '1px solid #22c55e' : '1px solid #b7eb8f',
          padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 24px)', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 10px)'
        }}>
          <span style={{ fontSize: 'clamp(14px, 1.8vw, 16px)' }}>✏️</span>
          <span style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#22c55e' : '#389e0d', fontWeight: 500 }}>
            {contentStatus === 'changes_requested'
              ? 'Admin has requested changes. Edit your content and save, then re-submit for review.'
              : 'Draft saved! You can freely edit — change title, structure, images, or any field. Save again to update, then submit for review.'}
          </span>
        </div>
      )}
      {contentStatus === 'pending' && (
        <div style={{
          background: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbe6', borderBottom: darkMode ? '1px solid #f59e0b' : '1px solid #ffe58f',
          padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 24px)', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 10px)'
        }}>
          <span style={{ fontSize: 'clamp(14px, 1.8vw, 16px)' }}>⏳</span>
          <span style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#f59e0b' : '#d48806', fontWeight: 500 }}>
            Content is under review. Editing is locked until admin responds.
          </span>
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={{ status: 'draft' }}>

        {/* Page-level Tabs */}
        <div style={{ 
          background: darkMode ? '#1e293b' : '#fff', 
          borderBottom: darkMode ? '1px solid #334155' : '1px solid #e8e8e8'
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(12px, 2vw, 24px)', display: 'flex', gap: 0, alignItems: 'center', justifyContent: 'space-between' }} className="create-content-tabs">
            {[
              { key: 'standard', label: 'Standard Form', desc: 'Fill all fields directly' },
              { key: 'builder', label: 'Drag & Drop Builder', desc: 'Build structure by dragging blocks' },
              { key: 'html', label: 'HTML Builder', desc: 'Create custom landing pages' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: 'clamp(10px, 1.5vw, 14px) clamp(16px, 2.5vw, 24px)', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 'clamp(12px, 0.9vw, 14px)', fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? '#4a7cff' : (darkMode ? '#94a3b8' : '#595959'),
                  borderBottom: activeTab === tab.key ? '2px solid #4a7cff' : '2px solid transparent',
                   transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab.label}
                {/* Pulse badge when Landing Page type forces HTML builder */}
                {tab.key === 'html' && isLandingPageType && activeTab !== 'html' && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6c5ce7', display: 'inline-block' }} />
                )}
                {tab.key === 'html' && isLandingPageType && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#6c5ce7', background: '#f0ecff', padding: '1px 6px', borderRadius: 10 }}>
                    ACTIVE
                  </span>
                )}
 
              </button>
            ))}

            {/* Guidelines Buttons */}
            <Space size={8} style={{ marginLeft: 16 }}>
              <Tooltip title="Editorial Guidelines">
                <button
                  type="button"
                  onClick={() => setGuidelinesVisible(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: 6,
                    background: darkMode ? '#1e293b' : '#f8fafc',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4a7cff';
                    e.currentTarget.style.color = '#4a7cff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                    e.currentTarget.style.color = darkMode ? '#94a3b8' : '#64748b';
                  }}
                >
                  <BookOutlined style={{ fontSize: 13 }} />
                  <span>Guidelines</span>
                </button>
              </Tooltip>
              <Tooltip title="How to Submit">
                <button
                  type="button"
                  onClick={() => setInstructionsVisible(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: 6,
                    background: darkMode ? '#1e293b' : '#f8fafc',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4a7cff';
                    e.currentTarget.style.color = '#4a7cff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                    e.currentTarget.style.color = darkMode ? '#94a3b8' : '#64748b';
                  }}
                >
                  <QuestionCircleOutlined style={{ fontSize: 13 }} />
                  <span>How to Submit</span>
                </button>
              </Tooltip>
              <Tooltip title="Terms & Conditions">
                <button
                  type="button"
                  onClick={() => setTermsVisible(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: 6,
                    background: darkMode ? '#1e293b' : '#f8fafc',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4a7cff';
                    e.currentTarget.style.color = '#4a7cff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                    e.currentTarget.style.color = darkMode ? '#94a3b8' : '#64748b';
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 13 }} />
                  <span>Terms</span>
                </button>
              </Tooltip>
            </Space>

            {/* Properties Panel Toggle — desktop only */}
            {window.innerWidth >= 768 && (
              <>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(o => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 14px',
                    border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: sidebarOpen
                      ? (darkMode ? '#1e3a5f' : '#eff6ff')
                      : (darkMode ? '#1e293b' : '#f8fafc'),
                    color: sidebarOpen ? '#4a7cff' : (darkMode ? '#94a3b8' : '#64748b'),
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    marginLeft: 'auto',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4a7cff';
                    e.currentTarget.style.color = '#4a7cff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                    e.currentTarget.style.color = sidebarOpen ? '#4a7cff' : (darkMode ? '#94a3b8' : '#64748b');
                  }}
                >
                {/* Animated indicator line on the left side */}
                {!sidebarOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      left: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: '80%',
                      background: 'linear-gradient(to bottom, transparent, #4a7cff, transparent)',
                      borderRadius: 2,
                      animation: 'propertiesIndicator 2s ease-in-out infinite',
                      pointerEvents: 'none',
                      boxShadow: '0 0 8px rgba(74, 124, 255, 0.6)',
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: '#4a7cff',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    opacity: 0.8,
                    animation: 'shimmer 2s ease-in-out infinite',
                    marginRight: 4,
                  }}
                >
                  {sidebarOpen ? 'Hide panel' : 'Show panel'}
                </span>
                <SettingOutlined style={{ fontSize: 13 }} />
                Properties
                <span style={{ fontSize: 11, opacity: 0.7 }}>{sidebarOpen ? '›' : '‹'}</span>
              </button>
              </>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px, 2vw, 32px) clamp(12px, 2vw, 24px)', paddingTop: 'clamp(24px, 3vw, 32px)', display: 'flex', gap: sidebarOpen ? 'clamp(16px, 2vw, 24px)' : 0, alignItems: 'flex-start', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0, width: window.innerWidth < 768 ? '100%' : 'auto', marginTop: '8px' }}>

            {/* Mobile Reorder Layout - Top on mobile */}
            {window.innerWidth < 768 && (
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: 'clamp(16px, 2vw, 20px)', marginBottom: 'clamp(12px, 2vw, 16px)', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', display: 'block', marginBottom: 'clamp(4px, 0.5vw, 4px)', color: darkMode ? '#f1f5f9' : '#111827' }}>
                  <HolderOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Reorder Layout
                </Text>
                <Text style={{ fontSize: 'clamp(10px, 0.8vw, 11px)', color: darkMode ? '#94a3b8' : '#8c8c8c', display: 'block', marginBottom: 'clamp(8px, 1vw, 12px)' }}>Drag sections to change order</Text>
                {(activeTab === 'builder' ? builderSections : standardLayout).map((item, index) => {
                  const sec = activeTab === 'builder' 
                    ? SECTION_TYPES.find(s => s.type === item.type)
                    : STANDARD_SECTIONS.find(s => s.key === item);
                  if (!sec) return null;
                  const key = activeTab === 'builder' ? item.id : item;
                  if (activeTab !== 'builder' && ((key === 'landing' || key === 'webhook') && !showLandingFields)) return null;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => activeTab === 'builder' ? onBuilderLayoutDragStart(index) : onLayoutDragStart(index)}
                      onDragEnter={() => activeTab === 'builder' ? onBuilderLayoutDragEnter(index) : onLayoutDragEnter(index)}
                      onDragEnd={activeTab === 'builder' ? onBuilderLayoutDragEnd : onLayoutDragEnd}
                      onDragOver={e => e.preventDefault()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)',
                        padding: 'clamp(6px, 1vw, 8px) clamp(8px, 1vw, 10px)', marginBottom: 'clamp(4px, 0.5vw, 6px)',
                        background: darkMode ? '#0f172a' : '#fafafa', borderRadius: 8,
                        border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', cursor: 'grab',
                        userSelect: 'none'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; e.currentTarget.style.background = darkMode ? '#1e293b' : '#f0f4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e8e8e8'; e.currentTarget.style.background = darkMode ? '#0f172a' : '#fafafa'; }}
                    >
                      <HolderOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf', fontSize: 'clamp(10px, 0.8vw, 12px)' }} />
                      <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: darkMode ? '#cbd5e1' : '#1a1a2e', flex: 1 }}>{sec.label}</span>
                      <span style={{ fontSize: 'clamp(9px, 0.7vw, 10px)', color: darkMode ? '#475569' : '#bfbfbf', fontWeight: 600 }}>{index + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── STANDARD FORM TAB ── */}
            {activeTab === 'standard' && (() => {
              const sectionMap = {
                meta: (
                  <div key="meta" style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                    <Text style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Article Details</Text>
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
                    {duplicateWarning && duplicateWarning.found && duplicateWarning.isExact && (
                      <div style={{ 
                        // background: '#FFF7ED', 
                        // border: '1px solid #FDBA74',
                         background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                        border: darkMode ? '1px solid #ef4444' : '1px solid #fecaca',
                        borderRadius: 8, 
                        padding: '12px 16px', 
                        marginBottom: 16 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {/* <InfoCircleOutlined style={{ color: '#F97316', fontSize: 16, marginTop: 2 }} /> */}
                          <InfoCircleOutlined style={{ color: '#ef4444', fontSize: 16, marginTop: 2 }} />
                          <div>
                             <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>
                              Duplicate content detected
                            </div>
                            <div style={{ fontSize: 13, color: '#991b1b' }}>
                              Content with title "{duplicateWarning.title}" already exists (Status: {duplicateWarning.status}). Please use a different title.While testing landing page on local from html builder and inserted the api the table created in backedn and also in html code and webhook input i have added url but its not working the data is not insrted in the table also not hit to the api
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                      <Input placeholder="Article title..." size="large"
                        onChange={(e) => {
                          const title = e.target.value;
                          const shortDesc = form.getFieldValue('short_description');
                          const tags = form.getFieldValue('tags');
                          checkDuplicateContent(title, shortDesc, tags);
                        }}
                        style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: darkMode ? '2px solid #334155' : '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: darkMode ? '#f1f5f9' : '#1a1a1a', background: 'transparent' }} />
                    </Form.Item>
                    <Form.Item name="short_description"
                      label={<span>Short Description <Tooltip title="Brief summary shown in article cards"><InfoCircleOutlined style={{ marginLeft: 6, color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                      rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 0 }}>
                      <TextArea rows={3} placeholder="Write a compelling summary..." 
                        onChange={(e) => {
                          const shortDesc = e.target.value;
                          const title = form.getFieldValue('title');
                          const tags = form.getFieldValue('tags');
                          checkDuplicateContent(title, shortDesc, tags);
                        }}
                        style={{ resize: 'none', fontSize: 15, lineHeight: 1.7, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                    </Form.Item>
                  </div>
                ),
                banner: (
                  <div key="banner" style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><PictureOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Banner Image</Text>
                        <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>Recommended: 1200×630px</div>
                      </div>
                      <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
                        <Button icon={<UploadOutlined />} size="small">{fileList.length > 0 ? 'Change Image' : 'Upload Image'}</Button>
                      </Upload>
                    </div>
                    {bannerImageUrl ? (
                      <div style={{ borderRadius: 8, overflow: 'hidden', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                        <img src={bannerImageUrl} alt="Banner" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
                      </div>
                    ) : (
                      <div style={{ border: darkMode ? '2px dashed #334155' : '2px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', textAlign: 'center', background: darkMode ? '#0f172a' : '#fafafa' }}>
                        <PictureOutlined style={{ fontSize: 32, color: darkMode ? '#475569' : '#bfbfbf', marginBottom: 8, display: 'block' }} />
                        <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13 }}>No banner image</Text>
                      </div>
                    )}
                  </div>
                ),
                content: (
                  <div key="content" style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', overflow: 'hidden', marginBottom: 40 }}>
                    <div style={{ padding: '14px 28px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                      <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}>Content</Text>
                    </div>
                    <div style={{ padding: '0 4px 4px' }}>
                      {editorReady ? (
                        <TipTapEditor value={content} initialContent={initialContent} onChange={setContent} placeholder="Start writing your article..." darkMode={darkMode} />
                      ) : (
                        <div style={{ padding: 40, textAlign: 'center', color: darkMode ? '#94a3b8' : '#8c8c8c' }}>Loading editor...</div>
                      )}
                    </div>
                  </div>
                ),
              };

              return (
                <>
                  {standardLayout.map(key => sectionMap[key] || null)}

                  {/* Fixed: PDF Attachment — always below reorderable sections */}
                  <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><FilePdfOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />PDF Attachment</Text>
                        <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>This PDF will be downloaded when user submits the access form</div>
                      </div>
                      <Upload beforeUpload={() => false} fileList={pdfList} onChange={({ fileList: fl }) => setPdfList(fl)} maxCount={1} showUploadList={false} accept=".pdf">
                        <Button icon={<UploadOutlined />} size="small">{pdfList.length > 0 ? 'Change PDF' : 'Upload PDF'}</Button>
                      </Upload>
                    </div>
                    {pdfList.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff2f0', borderRadius: 8, border: darkMode ? '1px solid #ef4444' : '1px solid #ffccc7' }}>
                        <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                        <Text style={{ flex: 1, fontSize: 13, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{pdfList[0].name}</Text>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setPdfList([])} />
                      </div>
                    ) : (
                      <div style={{ border: darkMode ? '2px dashed #ef4444' : '2px dashed #ffccc7', borderRadius: 8, padding: '20px', textAlign: 'center', background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff2f0' }}>
                        <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f', marginBottom: 4, display: 'block' }} />
                        <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13 }}>No PDF attached</Text>
                      </div>
                    )}
                  </div>

                  {isCaseStudy && (
                    <>
                      {/* Case Study: Headline */}
                      <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                        <Text style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 16 }}>Case Study Details</Text>
                        <Form.Item
                          name="case_study_headline"
                          label={<span>Headline <Tooltip title="Bold headline shown on the case study card"><InfoCircleOutlined style={{ marginLeft: 6, color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                          rules={[{ required: true, message: 'Headline is required for case studies' }]}
                          style={{ marginBottom: 16 }}
                        >
                          <Input placeholder="e.g. How Acme Corp reduced churn by 40%" size="large" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                        </Form.Item>
                        <Form.Item
                          name="case_study_summary"
                          label={<span>One-line Summary <Tooltip title="Single sentence shown under the headline on the card"><InfoCircleOutlined style={{ marginLeft: 6, color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                          rules={[{ required: true, message: 'Summary is required for case studies' }]}
                          style={{ marginBottom: 16 }}
                        >
                          <Input placeholder="e.g. A B2B SaaS company cuts customer churn in half within 6 months." size="large" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                        </Form.Item>
                        {/* Auto slug preview derived from the title field */}
                        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.title !== cur.title}>
                          {({ getFieldValue }) => {
                            const title = getFieldValue('title') || '';
                            const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            return slug ? (
                              <div style={{ padding: '10px 14px', background: darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f6ffed', border: darkMode ? '1px solid #22c55e' : '1px solid #b7eb8f', borderRadius: 8, fontSize: 13 }}>
                                <span style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontWeight: 500 }}>Auto slug: </span>
                                <span style={{ color: darkMode ? '#22c55e' : '#389e0d', fontWeight: 700 }}>/case-study/{slug}</span>
                              </div>
                            ) : null;
                          }}
                        </Form.Item>
                      </div>
 
                      {/* Case Study: Email Template */}
                      <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                        <div style={{ marginBottom: 12 }}>
                          <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}>
                            <span style={{ marginRight: 8 }}>✉️</span>Email Template
                          </Text>
                          <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 4 }}>
                            HTML email sent to the user after gate form submission. Use{' '}
                            {['{{name}}', '{{title}}', '{{email}}', '{{contact}}', '{{slug}}'].map(p => (
                              <code key={p} style={{ background: darkMode ? '#0f172a' : '#f0f4ff', padding: '1px 5px', borderRadius: 4, fontSize: 11, marginRight: 4, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{p}</code>
                            ))} as placeholders. Leave blank to use the default template.
                          </div>
                        </div>
                        <Form.Item name="email_template" style={{ marginBottom: 0 }}>
                          <TextArea
                            rows={14}
                            placeholder={`<!DOCTYPE html>\n<html>\n<body>\n  <h2>Hi {{name}},</h2>\n  <p>Thank you for downloading <strong>{{title}}</strong>.</p>\n  <p>Your case study is ready. Click below to view it.</p>\n  <p>— TGS Tech Info Team</p>\n</body>\n</html>`}
                            style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }}
                          />
                        </Form.Item>
                      </div>
                    </>
                  )}
 

                  {/* Fixed: Landing + Webhook — only for webinar/whitepaper/event */}
                  {showLandingFields && (
                    <>
                      <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', marginBottom: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                            <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><MenuOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Landing Page Form Fields</Text>
                            <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>Add all form fields with their label, API key, and type.</div>
                          </div>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addField} size="small">Add Field</Button>
                        </div>
                        {customFields.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13, border: darkMode ? '2px dashed #334155' : '2px dashed #e8e8e8', borderRadius: 8 }}>
                            No fields added. Click "Add Field" to add form fields.
                          </div>
                        )}
                        {customFields.map((field, index) => (
                          <div key={field.id} draggable
                            onDragStart={() => onDragStart(index)} onDragEnter={() => onDragEnter(index)}
                            onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', marginBottom: 10, background: darkMode ? '#0f172a' : '#fafafa', borderRadius: 8, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', cursor: 'grab' }}
                          >
                            <HolderOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf', marginTop: 8, flexShrink: 0 }} />
                            <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <Input placeholder="Field Label (e.g. First Name)" value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} style={{ flex: '1 1 140px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                              <Input placeholder="API Key (e.g. firstname)" value={field.webhook_key || ''} onChange={e => updateField(field.id, 'webhook_key', e.target.value)} style={{ flex: '1 1 130px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                              <Select value={field.type} onChange={v => updateField(field.id, 'type', v)} style={{ width: 110 }} size="small">
                                {FIELD_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                              </Select>
                              <Input placeholder="Placeholder text" value={field.placeholder} onChange={e => updateField(field.id, 'placeholder', e.target.value)} style={{ flex: '1 1 130px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                              {field.type === 'select' && (
                                <Input placeholder="Options (comma separated)" value={field.options} onChange={e => updateField(field.id, 'options', e.target.value)} style={{ flex: '1 1 180px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                              )}
                            </div>
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeField(field.id)} style={{ flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', marginBottom: 40 }}>
                        <div style={{ marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL</Text>
                        </div>
                        <Form.Item name="webhook_url" style={{ marginBottom: 0 }} rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
                          <Input placeholder="https://client-api.example.com/webhook" prefix={<ApiOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf' }} />} allowClear style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                        </Form.Item>
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            {/* ── DRAG & DROP BUILDER TAB ── */}
            {activeTab === 'builder' && (
              <>
                {/* Required Metadata Fields */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Article Details</Text>
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
                  {duplicateWarning && duplicateWarning.found && (
                    <div style={{ 
                      background: '#FFF7ED', 
                      border: '1px solid #FDBA74', 
                      borderRadius: 8, 
                      padding: '12px 16px', 
                      marginTop: 16,
                      marginBottom: 16 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <InfoCircleOutlined style={{ color: '#F97316', fontSize: 16, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#9A3412', marginBottom: 4 }}>
                            Similar content already exists
                          </div>
                          <div style={{ fontSize: 13, color: '#9A3412' }}>
                            Found {duplicateWarning.count} similar article(s): {duplicateWarning.titles.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginTop: 16, marginBottom: 0 }}>
                    <Input placeholder="Article title..." size="large"
                      onChange={(e) => {
                        const title = e.target.value;
                        const shortDesc = form.getFieldValue('short_description');
                        const tags = form.getFieldValue('tags');
                        checkDuplicateContent(title, shortDesc, tags);
                      }}
                      style={{ fontSize: 20, fontWeight: 600, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }}
                    />
                  </Form.Item>
                  <Form.Item name="short_description"
                    label={<span>Short Description <Tooltip title="Brief summary shown in article cards"><InfoCircleOutlined style={{ marginLeft: 6, color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                    rules={[{ required: true, message: 'Required' }]} style={{ marginTop: 16, marginBottom: 0 }}>
                    <TextArea rows={2} placeholder="Write a compelling summary..." 
                      onChange={(e) => {
                        const shortDesc = e.target.value;
                        const title = form.getFieldValue('title');
                        const tags = form.getFieldValue('tags');
                        checkDuplicateContent(title, shortDesc, tags);
                      }}
                      style={{ resize: 'none', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                  </Form.Item>
                </div>
 
                {/* Webhook URL for Visual Builder */}
                {showLandingFields && (
                  <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', marginBottom: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL</Text>
                      <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>Form data will be forwarded to this URL after submission</div>
                    </div>
                    <Form.Item name="webhook_url" style={{ marginBottom: 0 }} rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
                      <Input placeholder="https://client-api.example.com/webhook" prefix={<ApiOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf' }} />} allowClear style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                    </Form.Item>
                  </div>
                )}

                {/* BuilderIntegration — always Visual Builder */}
                <BuilderIntegration
                  darkMode={darkMode}
                  contentId={savedContentId}
                  triggerPreview={builderPreviewTrigger}
                  previewMeta={(() => {
                    const v = form.getFieldsValue();
                    const seoScore = calculateSEOScore(
                      v.title,
                      v.short_description,
                      '',
                      v.tags,
                      v.seo_meta_title,
                      v.seo_meta_description,
                      v.seo_meta_keywords
                    );
                    return {
                      content_type: contentTypes.find(t => t.id === v.content_type_id)?.name || '',
                      category: categories.find(c => c.id === v.category_id)?.name || '',
                      title: v.title || '',
                      banner_image: bannerImageUrl,
                      short_description: v.short_description || '',
                      tags: v.tags || [],
                      seoScore,
                    };
                  })()}
                  existingData={{
                    builder_page_data: builderPageData,
                    builder_layout: builderSections,
                    builder_content_elements: [],
                    content: builderContent,
                  }}
                  onSave={async (data, options) => {
                    console.log('[CreateContent] onSave callback triggered', { 
                      hasData: !!data, 
                      isAutoSync: options?.autoSync,
                      savedContentId,
                      builderPageDataSize: data.builder_page_data ? JSON.stringify(data.builder_page_data).length : 0
                    });

                    // Update local state for both auto-sync and manual saves
                    if (data.builder_page_data !== undefined) {
                      setBuilderPageData(data.builder_page_data);
                    }
                    if (data.builder_layout) {
                      setBuilderSections(data.builder_layout);
                    }
                    if (data.content) {
                      setBuilderContent(data.content);
                    }

                    // Auto-save to backend when auto-sync is triggered
                    if (options?.autoSync) {
                      // Mark as having unsaved changes (will be cleared after backend save)
                      setHasUnsavedChanges(true);

                      try {
                        const values = form.getFieldsValue();
                        
                        // Validate minimum required fields for auto-save
                        if (!values.title || !values.content_type_id) {
                          console.log('[CreateContent] Auto-save skipped - missing required fields (title or content_type_id)');
                          // Still mark as having unsaved changes
                          return;
                        }

                        const formData = buildFormData(values);
                        const apiBase = isAdmin ? '/api/admin' : '/api/user';
                        
                        if (savedContentId) {
                          // Update existing content - keep its current status (draft/published)
                          console.log('[CreateContent] Auto-saving to existing content:', savedContentId);
                          const response = await axios.put(`${apiBase}/content/${savedContentId}`, formData, { 
                            headers: { 'Content-Type': 'multipart/form-data' } 
                          });
                          console.log('[CreateContent] Auto-save SUCCESS');
                        } else {
                          // Create new draft automatically
                          console.log('[CreateContent] Auto-creating new draft content');
                          // Explicitly set status to 'draft' for auto-save
                          formData.append('status', 'draft');
                          const response = await axios.post(`${apiBase}/content`, formData, { 
                            headers: { 'Content-Type': 'multipart/form-data' } 
                          });
                          const newContentId = response.data.content?.id || response.data.id;
                          console.log('[CreateContent] Draft created with ID:', newContentId);
                          setSavedContentId(newContentId);
                          setContentStatus('draft');
                          setDraftSaved(true);
                          
                          // Update URL to edit mode without page reload
                          window.history.replaceState({}, '', isAdmin ? `/admin/edit-content/${newContentId}` : `/edit-content/${newContentId}`);
                        }
                        
                        // Clear unsaved changes flag after successful save
                        setHasUnsavedChanges(false);
                        
                        // Clear localStorage backup after successful backend save
                        const storageKey = `builder_autosave_${savedContentId || 'draft'}`;
                        localStorage.removeItem(storageKey);
                        localStorage.removeItem(`${storageKey}_timestamp`);
                        
                        console.log('[CreateContent] Auto-save complete - draft saved to database');
                      } catch (error) {
                        console.error('[CreateContent] Auto-save to backend failed:', error);
                        console.error('[CreateContent] Error details:', error.response?.data);
                        // Don't show error message to avoid disturbing user during editing
                        // Changes remain in localStorage as backup
                      }
                    }
                  }}
                  enableNewBuilder={true}
                />
              </>
            )}

            {/* ── HTML BUILDER TAB ── */}
            {activeTab === 'html' && (
              <>
{/* Landing Page type hint banner */}
                {isLandingPageType && (
                  <div style={{ background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f0f4ff', border: darkMode ? '1px solid #4a7cff' : '1px solid #4a7cff33', borderRadius: 12, padding: '14px 20px', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🚀</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#4a7cff' }}>HTML Builder mode active</div>
                      <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#595959', marginTop: 2 }}>
                        Your landing page will be published at <code style={{ background: '#e8eeff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>/content/<em>your-title-slug</em></code> — no Navbar or Footer, just your HTML.
                      </div>
                    </div>
                  </div>
                )}         
                       {/* Meta Section */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Landing Page Details</Text>
                  <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <Form.Item name="content_type_id" label="Content Type" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1, marginBottom: 0 }}>
                      <Select placeholder="Select type" size="large" onChange={val => {
                        const name = contentTypes.find(t => t.id === val)?.name?.toLowerCase() || '';
                        setSelectedTypeName(name);
                      }}>
                       {contentTypes.map(t => (
                          <Option key={t.id} value={t.id}>
                            {t.name}
                            {['landing page', 'landing-page'].includes(t.name.toLowerCase()) && (
                              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#6c5ce7', background: '#f0ecff', padding: '1px 7px', borderRadius: 10, textTransform: 'uppercase' }}>
                                HTML
                              </span>
                            )}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="category_id" label="Category" rules={[{ required: true, message: 'Required' }]} style={{ flex: 1, marginBottom: 0 }}>
                      <Select placeholder="Select category" size="large">
                        {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </div>
                </div>

                {/* Title & Description */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                  {duplicateWarning && duplicateWarning.found && (
                    <div style={{ 
                      background: '#FFF7ED', 
                      border: '1px solid #FDBA74', 
                      borderRadius: 8, 
                      padding: '12px 16px', 
                      marginBottom: 16 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <InfoCircleOutlined style={{ color: '#F97316', fontSize: 16, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#9A3412', marginBottom: 4 }}>
                            Similar content already exists
                          </div>
                          <div style={{ fontSize: 13, color: '#9A3412' }}>
                            Found {duplicateWarning.count} similar article(s): {duplicateWarning.titles.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                    <Input placeholder="Landing page title..." size="large"
                      onChange={(e) => {
                        const title = e.target.value;
                        const shortDesc = form.getFieldValue('short_description');
                        const tags = form.getFieldValue('tags');
                        checkDuplicateContent(title, shortDesc, tags);
                      }}
                      style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: darkMode ? '2px solid #334155' : '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: darkMode ? '#f1f5f9' : '#1a1a1a', background: 'transparent' }} />
                  </Form.Item>
                  <Form.Item name="short_description"
                    label={<span>Short Description <Tooltip title="Brief summary shown in listing cards"><InfoCircleOutlined style={{ marginLeft: 6, color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                    rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 16 }}>
                    <TextArea rows={3} placeholder="Write a compelling summary..." 
                      onChange={(e) => {
                        const shortDesc = e.target.value;
                        const title = form.getFieldValue('title');
                        const tags = form.getFieldValue('tags');
                        checkDuplicateContent(title, shortDesc, tags);
                      }}
                      style={{ resize: 'none', fontSize: 15, lineHeight: 1.7, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                  </Form.Item>
                  {/* Auto slug preview */}
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.title !== cur.title}>
                    {({ getFieldValue }) => {
                      const title = getFieldValue('title') || '';
                      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      return slug ? (
                        <div style={{ padding: '10px 14px', background: darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f6ffed', border: darkMode ? '1px solid #22c55e' : '1px solid #b7eb8f', borderRadius: 8, fontSize: 13 }}>
                          <span style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontWeight: 500 }}>Public URL: </span>
                          <span style={{ color: darkMode ? '#22c55e' : '#389e0d', fontWeight: 700 }}>/content/{slug}</span>
                        </div>
                      ) : null;
                    }}
                  </Form.Item>
                </div>

                {/* Banner Image */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><PictureOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Thumbnail Image</Text>
                      <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>This image will be displayed in the White Papers/Resources listing</div>
                    </div>
                    <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
                      <Button icon={<UploadOutlined />} size="small">{fileList.length > 0 ? 'Change Image' : 'Upload Image'}</Button>
                    </Upload>
                  </div>
                  {bannerImageUrl ? (
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                      <img src={bannerImageUrl} alt="Banner" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ border: darkMode ? '2px dashed #334155' : '2px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', textAlign: 'center', background: darkMode ? '#0f172a' : '#fafafa' }}>
                      <PictureOutlined style={{ fontSize: 32, color: darkMode ? '#475569' : '#bfbfbf', marginBottom: 8, display: 'block' }} />
                      <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13 }}>No thumbnail image</Text>
                    </div>
                  )}
                </div>

                {/* HTML Editor */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', overflow: 'hidden', marginBottom: 40 }}>
                  <div style={{ padding: '14px 28px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><CodeOutlined style={{ marginRight: 8, color: '#4a7cff' }} />HTML Content</Text>
                    <Space>
                      <Button 
                        size="small" 
                        icon={<PictureOutlined />} 
                        onClick={() => setMediaLibraryVisible(true)}
                      >
                        Media Library
                      </Button>
                      <Button size="small" icon={<EyeOutlined />} onClick={() => setHtmlPreviewVisible(true)}>Preview</Button>
                    </Space>
                  </div>
                  <div style={{ padding: '0 4px 4px' }}>
                    <HtmlEditor value={htmlContent} onChange={setHtmlContent} height="600px" />
                  </div>
                </div>

                {/* PDF Attachment */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 40, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><FilePdfOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />PDF Attachment (Optional)</Text>
                      <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>This PDF will be available for download on the landing page</div>
                    </div>
                    <Upload beforeUpload={() => false} fileList={pdfList} onChange={({ fileList: fl }) => setPdfList(fl)} maxCount={1} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadOutlined />} size="small">{pdfList.length > 0 ? 'Change PDF' : 'Upload PDF'}</Button>
                    </Upload>
                  </div>
                  {pdfList.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff2f0', borderRadius: 8, border: darkMode ? '1px solid #ef4444' : '1px solid #ffccc7' }}>
                      <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{pdfList[0].name}</Text>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setPdfList([])} />
                    </div>
                  ) : (
                    <div style={{ border: darkMode ? '2px dashed #ef4444' : '2px dashed #ffccc7', borderRadius: 8, padding: '20px', textAlign: 'center', background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fff2f0' }}>
                      <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f', marginBottom: 4, display: 'block' }} />
                      <Text style={{ color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13 }}>No PDF attached</Text>
                    </div>
                  )}
                </div>

                {/* Landing Page Form Fields */}
                {showLandingFields && (
                  <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><MenuOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Landing Page Form Fields</Text>
                        <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>Add form fields for lead capture</div>
                      </div>
                      <Button type="dashed" icon={<PlusOutlined />} onClick={addField} size="small">Add Field</Button>
                    </div>
                    {customFields.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 13, border: darkMode ? '2px dashed #334155' : '2px dashed #e8e8e8', borderRadius: 8 }}>
                        No fields added. Click "Add Field" to add form fields.
                      </div>
                    )}
                    {customFields.map((field, index) => (
                      <div key={field.id} draggable
                        onDragStart={() => onDragStart(index)} onDragEnter={() => onDragEnter(index)}
                        onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', marginBottom: 10, background: darkMode ? '#0f172a' : '#fafafa', borderRadius: 8, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', cursor: 'grab' }}
                      >
                        <HolderOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf', marginTop: 8, flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Input placeholder="Field Label (e.g. First Name)" value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} style={{ flex: '1 1 140px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                          <Input placeholder="API Key (e.g. firstname)" value={field.webhook_key || ''} onChange={e => updateField(field.id, 'webhook_key', e.target.value)} style={{ flex: '1 1 130px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                          <Select value={field.type} onChange={v => updateField(field.id, 'type', v)} style={{ width: 110 }} size="small">
                            {FIELD_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                          </Select>
                          <Input placeholder="Placeholder text" value={field.placeholder} onChange={e => updateField(field.id, 'placeholder', e.target.value)} style={{ flex: '1 1 130px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                          {field.type === 'select' && (
                            <Input placeholder="Options (comma separated)" value={field.options} onChange={e => updateField(field.id, 'options', e.target.value)} style={{ flex: '1 1 180px', background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} size="small" />
                          )}
                        </div>
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeField(field.id)} style={{ flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Webhook URL - Always visible in HTML Builder for form submissions */}
                <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: '24px 28px', border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', marginBottom: 40 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14, color: darkMode ? '#f1f5f9' : '#111827' }}><ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL</Text>
                    <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#8c8c8c', marginTop: 2 }}>Optional: Form data will be forwarded to this URL after submission</div>
                  </div>
                  <Form.Item name="webhook_url" style={{ marginBottom: 0 }} rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
                    <Input placeholder="https://client-api.example.com/webhook" prefix={<ApiOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf' }} />} allowClear style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                  </Form.Item>
                </div>
              </>
            )}
          </div>

          {/* Sidebar — for desktop only */}
          {window.innerWidth >= 768 && (
            <div style={{
              width: sidebarOpen ? 300 : 0,
              flexShrink: 0,
              overflow: 'hidden',
              transition: 'width 0.3s ease',
              opacity: sidebarOpen ? 1 : 0,
              pointerEvents: sidebarOpen ? 'auto' : 'none',
            }}>
              <div style={{ width: 300 }}>

              {/* Layout Reorder Panel */}
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4, color: darkMode ? '#f1f5f9' : '#111827' }}>
                  <HolderOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Reorder Layout
                </Text>
                <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#8c8c8c', display: 'block', marginBottom: 12 }}>Drag sections to change order</Text>
                {(activeTab === 'builder' ? builderSections : standardLayout).map((item, index) => {
                  const sec = activeTab === 'builder'
                    ? SECTION_TYPES.find(s => s.type === item.type)
                    : STANDARD_SECTIONS.find(s => s.key === item);
                  if (!sec) return null;
                  const key = activeTab === 'builder' ? item.id : item;
                  if (activeTab !== 'builder' && ((key === 'landing' || key === 'webhook') && !showLandingFields)) return null;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => activeTab === 'builder' ? onBuilderLayoutDragStart(index) : onLayoutDragStart(index)}
                      onDragEnter={() => activeTab === 'builder' ? onBuilderLayoutDragEnter(index) : onLayoutDragEnter(index)}
                      onDragEnd={activeTab === 'builder' ? onBuilderLayoutDragEnd : onLayoutDragEnd}
                      onDragOver={e => e.preventDefault()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', marginBottom: 6,
                        background: darkMode ? '#0f172a' : '#fafafa', borderRadius: 8,
                        border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8', cursor: 'grab',
                        userSelect: 'none'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; e.currentTarget.style.background = darkMode ? '#1e293b' : '#f0f4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e8e8e8'; e.currentTarget.style.background = darkMode ? '#0f172a' : '#fafafa'; }}
                    >
                      <HolderOutlined style={{ color: darkMode ? '#475569' : '#bfbfbf', fontSize: 12 }} />
                      <span style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#1a1a2e', flex: 1 }}>{sec.label}</span>
                      <span style={{ fontSize: 10, color: darkMode ? '#475569' : '#bfbfbf', fontWeight: 600 }}>{index + 1}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tags */}
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#111827' }}>
                  <TagOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Tags
                </Text>
                <Form.Item name="tags" style={{ marginBottom: 0 }}>
                  <Select mode="tags" placeholder="Add tags..." style={{ width: '100%' }} tokenSeparators={[',']}
                    onChange={(tags) => {
                      const title = form.getFieldValue('title');
                      const shortDesc = form.getFieldValue('short_description');
                      checkDuplicateContent(title, shortDesc, tags);
                    }}
                  />
                </Form.Item>
              </div>

              {/* Schedule */}
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#111827' }}>
                  <CalendarOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Schedule
                </Text>
                <Form.Item name="scheduled_publish_date" style={{ marginBottom: 0 }} help="Leave empty to publish after approval">
                  <DatePicker format="YYYY-MM-DD" placeholder="Select publish date" style={{ width: '100%' }} />
                </Form.Item>
              </div>

              {/* SEO */}
              <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: darkMode ? '#f1f5f9' : '#111827' }}>
                  <SettingOutlined style={{ marginRight: 6, color: '#4a7cff' }} />SEO Settings
                </Text>
                <Form.Item name="seo_meta_title" label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Meta Title</Text>} style={{ marginBottom: 12 }}>
                  <Input placeholder="SEO title" size="small" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                </Form.Item>
                <Form.Item name="seo_meta_description" label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Meta Description</Text>} style={{ marginBottom: 12 }}>
                  <TextArea rows={3} placeholder="SEO description" style={{ resize: 'none', fontSize: 12, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#1a1a2e', borderColor: darkMode ? '#334155' : '#e8e8e8' }} />
                </Form.Item>
                <Form.Item name="seo_meta_keywords" label={<Text style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Meta Keywords</Text>} style={{ marginBottom: 0 }}>
                  <Select mode="tags" placeholder="Add keyword and press Enter..." style={{ width: '100%' }} size="small" tokenSeparators={[',']} />
                </Form.Item>
              </div>

              <Form.Item name="status" hidden><Input /></Form.Item>
              </div>
            </div>
          )}
        </div>
      </Form>

      {/* Preview Modal */}
      {previewVisible && previewData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px, 2vw, 40px) clamp(12px, 2vw, 20px)', overflowY: 'auto' }}
          onClick={() => setPreviewVisible(false)}>
          <div style={{ background: darkMode ? '#1e293b' : '#fff', borderRadius: 12, width: '100%', maxWidth: 860, padding: 'clamp(20px, 3vw, 40px)', position: 'relative', border: darkMode ? '1px solid #334155' : 'none' }}
            onClick={e => e.stopPropagation()}>
            <Button type="text" onClick={() => setPreviewVisible(false)} style={{ position: 'absolute', top: 'clamp(12px, 1.5vw, 16px)', right: 'clamp(12px, 1.5vw, 16px)', color: darkMode ? '#94a3b8' : '#8c8c8c', fontSize: 'clamp(14px, 1.2vw, 16px)' }}>✕ Close</Button>

            {/* SEO Score Display */}
            {previewData.seoScore && (
              <div style={{
                marginBottom: 'clamp(16px, 2vw, 24px)',
                padding: 'clamp(12px, 1.5vw, 16px)',
                background: previewData.seoScore.percentage >= 80
                  ? darkMode ? 'rgba(91, 189, 43, 0.1)' : 'rgba(91, 189, 43, 0.1)'
                  : darkMode ? 'rgba(249, 148, 29, 0.1)' : 'rgba(249, 148, 29, 0.1)',
                border: `2px solid ${previewData.seoScore.percentage >= 80 ? '#5BBD2B' : '#F7941D'}`,
                borderRadius: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 'clamp(13px, 0.9vw, 15px)', color: darkMode ? '#f1f5f9' : '#1a1a1a' }}>
                    SEO Score: {previewData.seoScore.percentage}%
                  </Text>
                  <div style={{
                    width: 'clamp(80px, 10vw, 120px)',
                    height: 'clamp(8px, 1vw, 10px)',
                    background: darkMode ? '#334155' : '#e5e7eb',
                    borderRadius: 5,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${previewData.seoScore.percentage}%`,
                      height: '100%',
                      background: previewData.seoScore.percentage >= 80 ? '#5BBD2B' : '#F7941D',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#94a3b8' : '#6B7280' }}>
                  Word Count: {previewData.seoScore.wordCount}
                </div>
                {previewData.seoScore.issues.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#f1f5f9' : '#1a1a1a', fontWeight: 500 }}>
                      Issues to fix:
                    </Text>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: 'clamp(10px, 0.8vw, 12px)', color: darkMode ? '#94a3b8' : '#6B7280' }}>
                      {previewData.seoScore.issues.map((issue, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {previewData.category && <Tag color="blue" style={{ fontSize: 'clamp(11px, 0.85vw, 12px)', marginRight: 8 }}>{previewData.category}</Tag>}
            {previewData.content_type && <Tag color="purple" style={{ fontSize: 'clamp(11px, 0.85vw, 12px)' }}>{previewData.content_type}</Tag>}
            <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1a1a1a', margin: 'clamp(12px, 1.5vw, 16px) 0', lineHeight: 1.3 }}>{previewData.title}</h1>
            {previewData.banner_image && (
              <div style={{ marginBottom: 'clamp(16px, 2vw, 24px)', borderRadius: 10, overflow: 'hidden' }}>
                <img src={previewData.banner_image} alt={previewData.title} style={{ width: '100%', maxHeight: 'clamp(280px, 35vw, 420px)', objectFit: 'contain', display: 'block' }} />
              </div>
            )}
            {previewData.short_description && (
              <div style={{ marginBottom: 'clamp(16px, 2vw, 20px)', padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 1.5vw, 16px)', background: darkMode ? 'rgba(74, 124, 255, 0.1)' : '#f8f9fa', borderLeft: '4px solid #4a7cff', borderRadius: '0 8px 8px 0' }}>
                <Text style={{ fontSize: 'clamp(13px, 0.9vw, 15px)', color: darkMode ? '#cbd5e1' : '#495057', lineHeight: 1.7 }}>{previewData.short_description}</Text>
              </div>
            )}
            {previewData.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <TagOutlined style={{ color: darkMode ? '#94a3b8' : '#8c8c8c' }} />
                {previewData.tags.map((tag, i) => (
                  <Tag key={i} color="geekblue" style={{ borderRadius: 20 }}>{tag}</Tag>
                ))}
              </div>
            )}
            {previewData.scheduled_publish_date && (
              <div style={{ marginBottom: 'clamp(16px, 2vw, 20px)', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', color: darkMode ? '#94a3b8' : '#595959', fontSize: 'clamp(11px, 0.85vw, 13px)' }}>
                <CalendarOutlined style={{ color: '#4a7cff', fontSize: 'clamp(12px, 1vw, 14px)' }} />
                <Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>Scheduled: <strong>{previewData.scheduled_publish_date}</strong></Text>
              </div>
            )}
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: previewData.content || '<p>No content</p>' }} />
            {(previewData.seo_meta_title || previewData.seo_meta_description || previewData.seo_meta_keywords) && (
              <div style={{ marginTop: 'clamp(24px, 3vw, 32px)', padding: 'clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px)', background: darkMode ? '#0f172a' : '#f6f8fa', borderRadius: 10, border: darkMode ? '1px solid #334155' : '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: darkMode ? '#94a3b8' : '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'clamp(10px, 1.5vw, 12px)' }}>SEO Settings</Text>
                {previewData.seo_meta_title && (
                  <div style={{ marginBottom: 'clamp(6px, 1vw, 8px)' }}>
                    <Text type="secondary" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: darkMode ? '#94a3b8' : undefined }}>Meta Title</Text>
                    <div><Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{previewData.seo_meta_title}</Text></div>
                  </div>
                )}
                {previewData.seo_meta_description && (
                  <div style={{ marginBottom: 'clamp(6px, 1vw, 8px)' }}>
                    <Text type="secondary" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: darkMode ? '#94a3b8' : undefined }}>Meta Description</Text>
                    <div><Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{previewData.seo_meta_description}</Text></div>
                  </div>
                )}
                {previewData.seo_meta_keywords && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: darkMode ? '#94a3b8' : undefined }}>Keywords</Text>
                    <div><Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: darkMode ? '#cbd5e1' : '#1a1a2e' }}>{previewData.seo_meta_keywords}</Text></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HTML Preview Modal */}
      {htmlPreviewVisible && (
        <Modal
          title="HTML Landing Page Preview"
          open={htmlPreviewVisible}
          onCancel={() => setHtmlPreviewVisible(false)}
          footer={[
            <Button key="close" onClick={() => setHtmlPreviewVisible(false)}>Close</Button>
          ]}
          width={window.innerWidth < 768 ? '95%' : '90%'}
          style={{ top: 20 }}
        >
          <div style={{ minHeight: 'clamp(50vh, 70vh, 70vh)', background: darkMode ? '#0f172a' : '#f5f5f5', padding: 'clamp(12px, 2vw, 20px)' }}>
            <div style={{ background: darkMode ? '#1e293b' : '#fff', minHeight: 'clamp(40vh, 60vh, 60vh)', padding: 'clamp(12px, 2vw, 20px)', borderRadius: 8, border: darkMode ? '1px solid #334155' : 'none' }}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent || '<p>No HTML content</p>' }} />
            </div>
          </div>
        </Modal>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        visible={mediaLibraryVisible}
        onClose={() => setMediaLibraryVisible(false)}
        onSelect={(url) => {
          // URL is already copied to clipboard by the modal
          console.log('Selected media URL:', url);
        }}
      />

      <style>{`
        @keyframes shimmer {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .create-content-tabs {
            overflow-x: auto !important;
            white-space: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .create-content-tabs::-webkit-scrollbar {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .ant-space-item {
            margin-right: 4px !important;
          }
          .ant-btn {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

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
      </div>
    </ConfigProvider>
    </>
  );
};

export default CreateContent;