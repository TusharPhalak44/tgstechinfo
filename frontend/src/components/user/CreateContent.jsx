import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Select, Button, message, DatePicker,
  Upload, Space, Divider, Typography, Tooltip, Tag, Modal
} from 'antd';
import {
  UploadOutlined, SaveOutlined, SendOutlined, EyeOutlined,
  CalendarOutlined, ClockCircleOutlined, UserOutlined, TagOutlined,
  PictureOutlined, SettingOutlined, InfoCircleOutlined, ArrowLeftOutlined,
  FilePdfOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, MenuOutlined, ApiOutlined, CodeOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import TipTapEditor from '../common/TipTapEditor';
import DragDropBuilder from '../common/DragDropBuilder';
import HtmlEditor from '../editor/HtmlEditor';
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
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const layoutDragItem = useRef(null);
  const layoutDragOver = useRef(null);
  const builderLayoutDragItem = useRef(null);
  const builderLayoutDragOver = useRef(null);

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
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'builder' | 'html'
  const [builderContent, setBuilderContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [builderSections, setBuilderSections] = useState([
    { id: 'sec-1', type: 'content_type_category' },
    { id: 'sec-2', type: 'title_description' },
    { id: 'sec-3', type: 'banner_image' },
    { id: 'sec-4', type: 'content' }
  ]);
  const [contentElements, setContentElements] = useState([]);
  const contentElementsRef = React.useRef([]);

  // Keep ref in sync with state for use in closures (preview, save)
  useEffect(() => {
    contentElementsRef.current = contentElements;
  }, [contentElements]);
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
          if (Array.isArray(layout) && layout.length > 0) {
            // Standard layout: array of strings like ['meta','title',...]
            if (typeof layout[0] === 'string') {
              setStandardLayout(layout);
              setActiveTab('standard');
              setInitialContent(data.content || '');
              setContent(data.content || '');
              setEditorReady(true);
            } else {
              // Builder layout: array of objects with id/type
              setBuilderSections(layout);
              setBuilderContent(data.content || '');
              setActiveTab('builder');
              // Restore contentElements if available
              if (data.builder_content_elements) {
                try {
                  const elements = typeof data.builder_content_elements === 'string' 
                    ? JSON.parse(data.builder_content_elements) 
                    : data.builder_content_elements;
                  console.log('Loaded builder_content_elements:', elements);
                  if (Array.isArray(elements) && elements.length > 0) {
                    setContentElements(elements);
                    console.log('Set contentElements with', elements.length, 'elements');
                  } else {
                    console.log('builder_content_elements is empty or not an array');
                  }
                } catch (e) {
                  console.error('Error parsing builder_content_elements:', e);
                }
              } else {
                console.log('No builder_content_elements found in data');
              }
              // Don't set content for standard editor when in builder mode
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
    
    // Generate content from content elements if using drag-drop builder
    let finalContent = content;
    if (activeTab === 'builder' && contentElementsRef.current.length > 0) {
      finalContent = contentElementsRef.current.map(element => {
        switch (element.type) {
          case 'heading':
            const headingLevel = element.headingLevel || 'h2';
            const headingAlign = element.alignment || 'left';
            return `<${headingLevel} style="text-align: ${headingAlign};">${element.content}</${headingLevel}>`;
          case 'paragraph':
            // Handle paragraph with nested content (bullets, numbers, tables)
            let paragraphContent = element.content;
            const paragraphAlign = element.alignment || 'left';
            // Convert markdown-like syntax to HTML
            paragraphContent = paragraphContent.replace(/^• (.+)$/gm, '<li>$1</li>');
            paragraphContent = paragraphContent.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
            // Wrap consecutive list items
            paragraphContent = paragraphContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
              const hasNumbers = match.match(/^\d+\./);
              const tag = hasNumbers ? 'ol' : 'ul';
              return `<${tag}>${match}</${tag}>`;
            });
            // Handle table rows
            const tableRows = paragraphContent.match(/^\| .+$/gm);
            if (tableRows && tableRows.length > 0) {
              const tableHtml = tableRows.map(row => {
                const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
                return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
              }).join('');
              return `<table>${tableHtml}</table>`;
            }
            // Handle section breaks
            const sections = paragraphContent.split(/\n\n+/);
            return sections.map(section => `<p style="text-align: ${paragraphAlign};">${section.trim()}</p>`).join('\n');
          case 'bullet_list':
            const bulletItems = element.content.split('\n').filter(Boolean);
            return `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
          case 'numbered_list':
            const numberedItems = element.content.split('\n').filter(Boolean);
            return `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
          case 'line_break':
            return '<br>';
          case 'image':
            return `<img src="${element.content}" alt="Image" />`;
          case 'divider':
            return '<hr>';
          case 'blockquote':
            return `<blockquote>${element.content}</blockquote>`;
          case 'code_block':
            return `<pre><code>${element.content}</code></pre>`;
          case 'table':
            try {
              const tableData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
              if (tableData && tableData.data && Array.isArray(tableData.data)) {
                const tableHtml = tableData.data.map(row => {
                  return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                }).join('');
                return `<table>${tableHtml}</table>`;
              }
            } catch (e) {
              console.error('Error parsing table data:', e);
            }
            return '';
          case 'section_break':
            return '<br><br>';
          case 'bullet_item':
            return `<ul><li>${element.content}</li></ul>`;
          case 'numbered_item':
            return `<ol><li>${element.content}</li></ol>`;
          case 'table_row':
            const cells = element.content.split('|').map(cell => cell.trim()).filter(Boolean);
            return `<table><tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr></table>`;
          case 'split_section':
            try {
              const splitData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
              if (splitData && splitData.sections && Array.isArray(splitData.sections)) {
                let html = '<div style="display: flex; gap: 20px; margin: 20px 0; align-items: center; flex-wrap: wrap;">';
                
                splitData.sections.forEach(section => {
                  const layoutClass = section.layout || 'image-left';
                  const sectionAlign = section.alignment || 'left';
                  
                  if (layoutClass === 'image-left' || layoutClass === 'image-right') {
                    html += '<div style="flex: 1; min-width: 200px; display: flex; gap: 20px; align-items: center;">';
                    if (section.image) {
                      html += `<div style="flex: 1;"><img src="${section.image}" alt="Section image" style="width: 100%; max-height: 300px; object-fit: contain;" /></div>`;
                    }
                    if (section.text) {
                      html += `<div style="flex: 1; text-align: ${sectionAlign};">${section.text}</div>`;
                    }
                    html += '</div>';
                  } else if (layoutClass === 'text-only' && section.text) {
                    html += `<div style="flex: 1; min-width: 200px; text-align: ${sectionAlign};">${section.text}</div>`;
                  } else if (layoutClass === 'image-only' && section.image) {
                    html += `<div style="flex: 1; min-width: 200px;"><img src="${section.image}" alt="Section image" style="width: 100%; max-height: 300px; object-fit: contain;" /></div>`;
                  }
                });
                
                html += '</div>';
                return html;
              }
            } catch (e) {
              console.error('Error parsing split section:', e);
            }
            return '';
          case 'button':
            try {
              const buttonData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
              if (buttonData) {
                const actionAttr = buttonData.actionType === 'download' 
                  ? `download href="${buttonData.url}"` 
                  : `href="${buttonData.url}" target="_blank"`;
                
                return `<a ${actionAttr} style="
                  display: inline-block;
                  height: ${buttonData.height || '40px'};
                  width: ${buttonData.width || 'auto'};
                  background-color: ${buttonData.backgroundColor || '#4a7cff'};
                  color: ${buttonData.textColor || '#ffffff'};
                  border-radius: ${buttonData.borderRadius || '8px'};
                  text-decoration: none;
                  padding: 0 20px;
                  line-height: ${buttonData.height || '40px'};
                  text-align: center;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                ">${buttonData.text || 'Click Me'}</a>`;
              }
            } catch (e) {
              console.error('Error parsing button:', e);
            }
            return '';
          default:
            return '';
        }
      }).join('\n');
    } else if (activeTab === 'builder') {
      // Convert contentElements to HTML for saving
      if (contentElementsRef.current.length > 0) {
        finalContent = contentElementsRef.current.map(element => {
          switch (element.type) {
            case 'heading':
              const headingLevel = element.headingLevel || 'h2';
              const headingAlign = element.alignment || 'left';
              return `<${headingLevel} style="text-align: ${headingAlign};">${element.content}</${headingLevel}>`;
            case 'paragraph':
              let paragraphContent = element.content;
              const paragraphAlign = element.alignment || 'left';
              paragraphContent = paragraphContent.replace(/^• (.+)$/gm, '<li>$1</li>');
              paragraphContent = paragraphContent.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
              paragraphContent = paragraphContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
                const hasNumbers = match.match(/^\d+\./);
                const tag = hasNumbers ? 'ol' : 'ul';
                return `<${tag}>${match}</${tag}>`;
              });
              const tableRows = paragraphContent.match(/^\| .+$/gm);
              if (tableRows && tableRows.length > 0) {
                const tableHtml = tableRows.map(row => {
                  const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
                  return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                }).join('');
                return `<table>${tableHtml}</table>`;
              }
              const sections = paragraphContent.split(/\n\n+/);
              return sections.map(section => `<p style="text-align: ${paragraphAlign};">${section.trim()}</p>`).join('\n');
            case 'bullet_list':
              const bulletItems = element.content.split('\n').filter(Boolean);
              return `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
            case 'numbered_list':
              const numberedItems = element.content.split('\n').filter(Boolean);
              return `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
            case 'line_break':
              return '<br>';
            case 'image':
              return `<img src="${element.content}" alt="Image" />`;
            case 'divider':
              return '<hr>';
            case 'blockquote':
              return `<blockquote>${element.content}</blockquote>`;
            case 'code_block':
              return `<pre><code>${element.content}</code></pre>`;
            case 'table':
              try {
                const tableData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
                if (tableData && tableData.data && Array.isArray(tableData.data)) {
                  const tableHtml = tableData.data.map(row => {
                    return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                  }).join('');
                  return `<table>${tableHtml}</table>`;
                }
              } catch (e) {
                console.error('Error parsing table data:', e);
              }
              return '';
            case 'section_break':
              return '<br><br>';
            case 'bullet_item':
              return `<ul><li>${element.content}</li></ul>`;
            case 'numbered_item':
              return `<ol><li>${element.content}</li></ol>`;
            case 'table_row':
              const cells = element.content.split('|').map(cell => cell.trim()).filter(Boolean);
              return `<table><tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr></table>`;
            case 'split_section':
              try {
                const splitData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
                if (splitData && splitData.sections && Array.isArray(splitData.sections)) {
                  let html = '<div style="display: flex; gap: 20px; margin: 20px 0; align-items: center; flex-wrap: wrap;">';
                  
                  splitData.sections.forEach(section => {
                    const layoutClass = section.layout || 'image-left';
                    const alignStyle = section.alignment ? `text-align: ${section.alignment};` : '';
                    
                    if (layoutClass === 'image-left') {
                      html += `
                        <div style="flex: 1; min-width: 200px;">
                          ${section.image ? `<img src="${section.image}" alt="${section.imageAlt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" />` : ''}
                        </div>
                        <div style="flex: 1; min-width: 200px; ${alignStyle}">
                          ${section.text || ''}
                        </div>
                      `;
                    } else {
                      html += `
                        <div style="flex: 1; min-width: 200px; ${alignStyle}">
                          ${section.text || ''}
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                          ${section.image ? `<img src="${section.image}" alt="${section.imageAlt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" />` : ''}
                        </div>
                      `;
                    }
                  });
                  
                  html += '</div>';
                  return html;
                }
              } catch (e) {
                console.error('Error parsing split section:', e);
              }
              return '';
            case 'button':
              try {
                const buttonData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
                if (buttonData) {
                  const actionAttr = buttonData.actionType === 'download' 
                    ? `download href="${buttonData.url}"` 
                    : `href="${buttonData.url}" target="_blank"`;
                  
                  return `<a ${actionAttr} style="
                    display: inline-block;
                    height: ${buttonData.height || '40px'};
                    width: ${buttonData.width || 'auto'};
                    background-color: ${buttonData.backgroundColor || '#4a7cff'};
                    color: ${buttonData.textColor || '#ffffff'};
                    border-radius: ${buttonData.borderRadius || '8px'};
                    text-decoration: none;
                    padding: 0 20px;
                    line-height: ${buttonData.height || '40px'};
                    text-align: center;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                  ">${buttonData.text || 'Click Me'}</a>`;
                }
              } catch (e) {
                console.error('Error parsing button:', e);
              }
              return '';
            default:
              return '';
          }
        }).join('\n');
      } else {
        finalContent = builderContent;
      }
    } else if (activeTab === 'html') {
      finalContent = htmlContent;
    }
    
    formData.append('content', finalContent || '');
    if (activeTab === 'html') {
      formData.append('builder_layout', JSON.stringify(['html']));
    } else if (activeTab === 'builder' && builderSections.length > 0) {
      formData.append('builder_layout', JSON.stringify(builderSections));
      // Save contentElements array for restoration when editing
      if (contentElementsRef.current.length > 0) {
        formData.append('builder_content_elements', JSON.stringify(contentElementsRef.current));
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
    }
    if (finalCustomFields.length > 0) formData.append('custom_fields', JSON.stringify(finalCustomFields));
    
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
          const finalCustomFields = activeTab === 'html' ? parseFormFieldsFromHtml(htmlContent) : customFields;
          await axios.put(`/api/user/content/${savedContentId}/webhook`, {
            webhook_url: values.webhook_url || '',
            ...(finalCustomFields.length > 0 ? { custom_fields: JSON.stringify(finalCustomFields) } : {})
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Top Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        padding: '0 clamp(12px, 2vw, 24px)', height: 'clamp(48px, 6vw, 56px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 16px)' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} style={{ color: '#595959', fontSize: 'clamp(12px, 0.9vw, 13px)' }} size={window.innerWidth < 768 ? 'small' : 'middle'}>
            {window.innerWidth < 768 ? '' : 'Dashboard'}
          </Button>
          {window.innerWidth >= 768 && <Divider orientation="vertical" style={{ margin: 0 }} />}
          <Text style={{ color: '#8c8c8c', fontSize: 'clamp(11px, 0.85vw, 13px)' }}>{isEditMode ? 'Edit Article' : 'New Article'}</Text>
        </div>
        <Space size={window.innerWidth < 768 ? 4 : 8} wrap style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<EyeOutlined />} onClick={() => {
            const v = form.getFieldsValue();
            const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
            
            // Generate content from content elements if using drag-drop builder
            const currentElements = contentElementsRef.current;
            let previewContent = content;
            if (activeTab === 'builder' && currentElements.length > 0) {
              previewContent = currentElements.map(element => {
                switch (element.type) {
                  case 'heading':
                    const headingLevel = element.headingLevel || 'h2';
                    const headingAlign = element.alignment || 'left';
                    return `<${headingLevel} style="text-align: ${headingAlign};">${element.content}</${headingLevel}>`;
                  case 'paragraph':
                    let paragraphContent = element.content;
                    const paragraphAlign = element.alignment || 'left';
                    paragraphContent = paragraphContent.replace(/^• (.+)$/gm, '<li>$1</li>');
                    paragraphContent = paragraphContent.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
                    paragraphContent = paragraphContent.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
                      const hasNumbers = match.match(/^\d+\./);
                      const tag = hasNumbers ? 'ol' : 'ul';
                      return `<${tag}>${match}</${tag}>`;
                    });
                    const tableRows = paragraphContent.match(/^\| .+$/gm);
                    if (tableRows && tableRows.length > 0) {
                      const tableHtml = tableRows.map(row => {
                        const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
                        return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                      }).join('');
                      return `<table>${tableHtml}</table>`;
                    }
                    const sections = paragraphContent.split(/\n\n+/);
                    return sections.map(section => `<p style="text-align: ${paragraphAlign};">${section.trim()}</p>`).join('\n');
                  case 'bullet_list':
                    const bulletItems = element.content.split('\n').filter(Boolean);
                    return `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
                  case 'numbered_list':
                    const numberedItems = element.content.split('\n').filter(Boolean);
                    return `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
                  case 'line_break':
                    return '<br>';
                  case 'image':
                    return `<img src="${element.content}" alt="Image" />`;
                  case 'divider':
                    return '<hr>';
                  case 'blockquote':
                    return `<blockquote>${element.content}</blockquote>`;
                  case 'code_block':
                    return `<pre><code>${element.content}</code></pre>`;
                  case 'table':
                    try {
                      const tableData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
                      if (tableData && tableData.data && Array.isArray(tableData.data)) {
                        const tableHtml = tableData.data.map(row => {
                          return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                        }).join('');
                        return `<table>${tableHtml}</table>`;
                      }
                    } catch (e) {
                      console.error('Error parsing table data:', e);
                    }
                    return '';
                  case 'section_break':
                    return '<br><br>';
                  case 'bullet_item':
                    return `<ul><li>${element.content}</li></ul>`;
                  case 'numbered_item':
                    return `<ol><li>${element.content}</li></ol>`;
                  case 'table_row':
                    const cells = element.content.split('|').map(cell => cell.trim()).filter(Boolean);
                    return `<table><tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr></table>`;
                  case 'split_section':
                    try {
                      const splitData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
                      if (splitData && splitData.sections && Array.isArray(splitData.sections)) {
                        let html = '<div style="display: flex; gap: 20px; margin: 20px 0; align-items: center; flex-wrap: wrap;">';
                        
                        splitData.sections.forEach(section => {
                          const layoutClass = section.layout || 'image-left';
                          const sectionAlign = section.alignment || 'left';
                          
                          if (layoutClass === 'image-left' || layoutClass === 'image-right') {
                            html += '<div style="flex: 1; min-width: 200px; display: flex; gap: 20px; align-items: center;">';
                            if (section.image) {
                              html += `<div style="flex: 1;"><img src="${section.image}" alt="Section image" style="width: 100%; max-height: 300px; object-fit: contain;" /></div>`;
                            }
                            if (section.text) {
                              html += `<div style="flex: 1; text-align: ${sectionAlign};">${section.text}</div>`;
                            }
                            html += '</div>';
                          } else if (layoutClass === 'text-only' && section.text) {
                            html += `<div style="flex: 1; min-width: 200px; text-align: ${sectionAlign};">${section.text}</div>`;
                          } else if (layoutClass === 'image-only' && section.image) {
                            html += `<div style="flex: 1; min-width: 200px;"><img src="${section.image}" alt="Section image" style="width: 100%; max-height: 300px; object-fit: contain;" /></div>`;
                          }
                        });
                        
                        html += '</div>';
                        return html;
                      }
                    } catch (e) {
                      console.error('Error parsing split section:', e);
                    }
                    return '';
                  case 'button':
                    try {
                      const buttonData = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
                      if (buttonData) {
                        const actionAttr = buttonData.actionType === 'download' 
                          ? `download href="${buttonData.url}"` 
                          : `href="${buttonData.url}" target="_blank"`;
                        
                        return `<a ${actionAttr} style="
                          display: inline-block;
                          height: ${buttonData.height || '40px'};
                          width: ${buttonData.width || 'auto'};
                          background-color: ${buttonData.backgroundColor || '#4a7cff'};
                          color: ${buttonData.textColor || '#ffffff'};
                          border-radius: ${buttonData.borderRadius || '8px'};
                          text-decoration: none;
                          padding: 0 20px;
                          line-height: ${buttonData.height || '40px'};
                          text-align: center;
                          font-size: 14px;
                          font-weight: 500;
                          cursor: pointer;
                          transition: all 0.2s;
                        ">${buttonData.text || 'Click Me'}</a>`;
                      }
                    } catch (e) {
                      console.error('Error parsing button:', e);
                    }
                    return '';
                  default:
                    return '';
                }
              }).join('\n');
            } else if (activeTab === 'builder') {
              previewContent = builderContent;
            } else if (activeTab === 'html') {
              previewContent = htmlContent;
            }
            
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
              content: previewContent,
            });
            setPreviewVisible(true);
          }} size={window.innerWidth < 768 ? 'small' : 'middle'}>Preview</Button>
          <Button
            icon={<SaveOutlined />}
            loading={loading}
            disabled={contentStatus === 'pending'}
            onClick={handleSave}
            size={window.innerWidth < 768 ? 'small' : 'middle'}
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
              onClick={handleSubmitForReview}
              size={window.innerWidth < 768 ? 'small' : 'middle'}
            >
              {window.innerWidth < 768 ? (contentStatus === 'pending' ? 'Review' : 'Submit') : (contentStatus === 'pending' ? 'Under Review' : 'Submit for Review')}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {draftSaved && contentStatus !== 'published' && contentStatus !== 'pending' && (
        <div style={{
          background: '#f6ffed', borderBottom: '1px solid #b7eb8f',
          padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 24px)', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 10px)'
        }}>
          <span style={{ fontSize: 'clamp(14px, 1.8vw, 16px)' }}>✏️</span>
          <span style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: '#389e0d', fontWeight: 500 }}>
            {contentStatus === 'changes_requested'
              ? 'Admin has requested changes. Edit your content and save, then re-submit for review.'
              : 'Draft saved! You can freely edit — change title, structure, images, or any field. Save again to update, then submit for review.'}
          </span>
        </div>
      )}
      {contentStatus === 'pending' && (
        <div style={{
          background: '#fffbe6', borderBottom: '1px solid #ffe58f',
          padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 24px)', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 10px)'
        }}>
          <span style={{ fontSize: 'clamp(14px, 1.8vw, 16px)' }}>⏳</span>
          <span style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', color: '#d48806', fontWeight: 500 }}>
            Content is under review. Editing is locked until admin responds.
          </span>
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={{ status: 'draft' }}>

        {/* Page-level Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(12px, 2vw, 24px)', display: 'flex', gap: 0, overflowX: 'auto' }} className="create-content-tabs">
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
                  color: activeTab === tab.key ? '#4a7cff' : '#595959',
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
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px, 2vw, 32px) clamp(12px, 2vw, 24px)', display: 'flex', gap: 'clamp(16px, 2vw, 24px)', alignItems: 'flex-start', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0, width: window.innerWidth < 768 ? '100%' : 'auto' }}>

            {/* Mobile Reorder Layout - Top on mobile */}
            {window.innerWidth < 768 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 'clamp(16px, 2vw, 20px)', marginBottom: 'clamp(12px, 2vw, 16px)', border: '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 'clamp(11px, 0.85vw, 13px)', display: 'block', marginBottom: 'clamp(4px, 0.5vw, 4px)' }}>
                  <HolderOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Reorder Layout
                </Text>
                <Text style={{ fontSize: 'clamp(10px, 0.8vw, 11px)', color: '#8c8c8c', display: 'block', marginBottom: 'clamp(8px, 1vw, 12px)' }}>Drag sections to change order</Text>
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
                        background: '#fafafa', borderRadius: 8,
                        border: '1px solid #e8e8e8', cursor: 'grab',
                        userSelect: 'none'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; e.currentTarget.style.background = '#f0f4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#fafafa'; }}
                    >
                      <HolderOutlined style={{ color: '#bfbfbf', fontSize: 'clamp(10px, 0.8vw, 12px)' }} />
                      <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#1a1a2e', flex: 1 }}>{sec.label}</span>
                      <span style={{ fontSize: 'clamp(9px, 0.7vw, 10px)', color: '#bfbfbf', fontWeight: 600 }}>{index + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}

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

                  {isCaseStudy && (
                    <>
                      {/* Case Study: Headline */}
                      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                        <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 16 }}>Case Study Details</Text>
                        <Form.Item
                          name="case_study_headline"
                          label={<span>Headline <Tooltip title="Bold headline shown on the case study card"><InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                          rules={[{ required: true, message: 'Headline is required for case studies' }]}
                          style={{ marginBottom: 16 }}
                        >
                          <Input placeholder="e.g. How Acme Corp reduced churn by 40%" size="large" />
                        </Form.Item>
                        <Form.Item
                          name="case_study_summary"
                          label={<span>One-line Summary <Tooltip title="Single sentence shown under the headline on the card"><InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                          rules={[{ required: true, message: 'Summary is required for case studies' }]}
                          style={{ marginBottom: 16 }}
                        >
                          <Input placeholder="e.g. A B2B SaaS company cuts customer churn in half within 6 months." size="large" />
                        </Form.Item>
                        {/* Auto slug preview derived from the title field */}
                        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.title !== cur.title}>
                          {({ getFieldValue }) => {
                            const title = getFieldValue('title') || '';
                            const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            return slug ? (
                              <div style={{ padding: '10px 14px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 13 }}>
                                <span style={{ color: '#8c8c8c', fontWeight: 500 }}>Auto slug: </span>
                                <span style={{ color: '#389e0d', fontWeight: 700 }}>/case-study/{slug}</span>
                              </div>
                            ) : null;
                          }}
                        </Form.Item>
                      </div>
 
                      {/* Case Study: Email Template */}
                      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                        <div style={{ marginBottom: 12 }}>
                          <Text strong style={{ fontSize: 14 }}>
                            <span style={{ marginRight: 8 }}>✉️</span>Email Template
                          </Text>
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                            HTML email sent to the user after gate form submission. Use{' '}
                            {['{{name}}', '{{title}}', '{{email}}', '{{contact}}', '{{slug}}'].map(p => (
                              <code key={p} style={{ background: '#f0f4ff', padding: '1px 5px', borderRadius: 4, fontSize: 11, marginRight: 4 }}>{p}</code>
                            ))} as placeholders. Leave blank to use the default template.
                          </div>
                        </div>
                        <Form.Item name="email_template" style={{ marginBottom: 0 }}>
                          <TextArea
                            rows={14}
                            placeholder={`<!DOCTYPE html>\n<html>\n<body>\n  <h2>Hi {{name}},</h2>\n  <p>Thank you for downloading <strong>{{title}}</strong>.</p>\n  <p>Your case study is ready. Click below to view it.</p>\n  <p>— TGS Tech Info Team</p>\n</body>\n</html>`}
                            style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
                          />
                        </Form.Item>
                      </div>
                    </>
                  )}
 

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
                contentElements={contentElements}
                onAddContentElement={(type, label) => {
                  const CONTENT_ELEMENTS_MAP = {
                    heading: 'h', paragraph: 'p', bullet_list: 'ul', numbered_list: 'ol',
                    line_break: 'br', image: 'img', divider: 'hr', blockquote: 'blockquote',
                    code_block: 'pre', table: 'table', section_break: 'br', table_row: 'tr',
                    split_section: 'div', button: 'button'
                  };
                  const newElement = {
                    id: `el-${Date.now()}`,
                    type,
                    tag: CONTENT_ELEMENTS_MAP[type] || 'div',
                    label,
                    content: '',
                    headingLevel: type === 'heading' ? 'h2' : undefined
                  };
                  setContentElements(prev => [...prev, newElement]);
                }}
                onRemoveContentElement={(id) => {
                  setContentElements(prev => prev.filter(el => el.id !== id));
                }}
                onUpdateContentElement={(id, updates) => {
                  setContentElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
                }}
                onContentElementsChange={setContentElements}
                selectedTypeName={selectedTypeName}
                customFields={customFields}
                setCustomFields={setCustomFields}
                fieldTypes={FIELD_TYPES}
                sections={builderSections}
                onSectionsChange={setBuilderSections}
              />
            )}

            {/* ── HTML BUILDER TAB ── */}
            {activeTab === 'html' && (
              <>
{/* Landing Page type hint banner */}
                {isLandingPageType && (
                  <div style={{ background: '#f0f4ff', border: '1px solid #4a7cff33', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🚀</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#4a7cff' }}>HTML Builder mode active</div>
                      <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
                        Your landing page will be published at <code style={{ background: '#e8eeff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>/content/<em>your-title-slug</em></code> — no Navbar or Footer, just your HTML.
                      </div>
                    </div>
                  </div>
                )}         
                       {/* Meta Section */}
                <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Landing Page Details</Text>
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
                <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                  <Form.Item name="title" rules={[{ required: true, message: 'Please enter a title' }]} style={{ marginBottom: 16 }}>
                    <Input placeholder="Landing page title..." size="large"
                      style={{ fontSize: 26, fontWeight: 700, border: 'none', borderBottom: '2px solid #f0f0f0', borderRadius: 0, padding: '8px 0', boxShadow: 'none', color: '#1a1a1a' }} />
                  </Form.Item>
                  <Form.Item name="short_description"
                    label={<span>Short Description <Tooltip title="Brief summary shown in listing cards"><InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c', fontSize: 12 }} /></Tooltip></span>}
                    rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 16 }}>
                    <TextArea rows={3} placeholder="Write a compelling summary..." style={{ resize: 'none', fontSize: 15, lineHeight: 1.7 }} />
                  </Form.Item>
                  {/* Auto slug preview */}
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.title !== cur.title}>
                    {({ getFieldValue }) => {
                      const title = getFieldValue('title') || '';
                      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      return slug ? (
                        <div style={{ padding: '10px 14px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 13 }}>
                          <span style={{ color: '#8c8c8c', fontWeight: 500 }}>Public URL: </span>
                          <span style={{ color: '#389e0d', fontWeight: 700 }}>/content/{slug}</span>
                        </div>
                      ) : null;
                    }}
                  </Form.Item>
                </div>

                {/* Banner Image */}
                <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Text strong style={{ fontSize: 14 }}><PictureOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Thumbnail Image</Text>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>This image will be displayed in the White Papers/Resources listing</div>
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
                      <Text style={{ color: '#8c8c8c', fontSize: 13 }}>No thumbnail image</Text>
                    </div>
                  )}
                </div>

                {/* HTML Editor */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ padding: '14px 28px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 14 }}><CodeOutlined style={{ marginRight: 8, color: '#4a7cff' }} />HTML Content</Text>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => setHtmlPreviewVisible(true)}>Preview</Button>
                  </div>
                  <div style={{ padding: '0 4px 4px' }}>
                    <HtmlEditor value={htmlContent} onChange={setHtmlContent} height="600px" />
                  </div>
                </div>

                {/* PDF Attachment */}
                <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20, border: '1px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <Text strong style={{ fontSize: 14 }}><FilePdfOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />PDF Attachment (Optional)</Text>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>This PDF will be available for download on the landing page</div>
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

                {/* Landing Page Form Fields */}
                {showLandingFields && (
                  <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <Text strong style={{ fontSize: 14 }}><MenuOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Landing Page Form Fields</Text>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Add form fields for lead capture</div>
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
                )}

                {/* Webhook URL */}
                {showLandingFields && (
                  <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginBottom: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 14 }}><ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL</Text>
                    </div>
                    <Form.Item name="webhook_url" style={{ marginBottom: 0 }} rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
                      <Input placeholder="https://client-api.example.com/webhook" prefix={<ApiOutlined style={{ color: '#bfbfbf' }} />} allowClear />
                    </Form.Item>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar — for desktop only */}
          {window.innerWidth >= 768 && (
            <div style={{ width: 300, flexShrink: 0 }}>

            {/* Layout Reorder Panel */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e8e8e8' }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                <HolderOutlined style={{ marginRight: 6, color: '#4a7cff' }} />Reorder Layout
              </Text>
              <Text style={{ fontSize: 11, color: '#8c8c8c', display: 'block', marginBottom: 12 }}>Drag sections to change order</Text>
              {(activeTab === 'builder' ? builderSections : standardLayout).map((item, index) => {
                const sec = activeTab === 'builder' 
                  ? SECTION_TYPES.find(s => s.type === item.type)
                  : STANDARD_SECTIONS.find(s => s.key === item);
                if (!sec) return null;
                const key = activeTab === 'builder' ? item.id : item;
                // hide landing/webhook if not applicable
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
                      background: '#fafafa', borderRadius: 8,
                      border: '1px solid #e8e8e8', cursor: 'grab',
                      userSelect: 'none'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7cff'; e.currentTarget.style.background = '#f0f4ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#fafafa'; }}
                  >
                    <HolderOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
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
          )}
        </div>
      </Form>

      {/* Preview Modal */}
      {previewVisible && previewData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px, 2vw, 40px) clamp(12px, 2vw, 20px)', overflowY: 'auto' }}
          onClick={() => setPreviewVisible(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 860, padding: 'clamp(20px, 3vw, 40px)', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <Button type="text" onClick={() => setPreviewVisible(false)} style={{ position: 'absolute', top: 'clamp(12px, 1.5vw, 16px)', right: 'clamp(12px, 1.5vw, 16px)', color: '#8c8c8c', fontSize: 'clamp(14px, 1.2vw, 16px)' }}>✕ Close</Button>
            <Tag color="blue" style={{ fontSize: 'clamp(11px, 0.85vw, 12px)' }}>{previewData.category}</Tag>
            <Tag color="purple" style={{ fontSize: 'clamp(11px, 0.85vw, 12px)' }}>{previewData.content_type}</Tag>
            <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: 700, color: '#1a1a1a', margin: 'clamp(12px, 1.5vw, 16px) 0', lineHeight: 1.3 }}>{previewData.title}</h1>
            {previewData.banner_image && (
              <div style={{ marginBottom: 'clamp(16px, 2vw, 24px)', borderRadius: 10, overflow: 'hidden' }}>
                <img src={previewData.banner_image} alt={previewData.title} style={{ width: '100%', maxHeight: 'clamp(280px, 35vw, 420px)', objectFit: 'contain', display: 'block' }} />
              </div>
            )}
            {previewData.short_description && (
              <div style={{ marginBottom: 'clamp(16px, 2vw, 20px)', padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 1.5vw, 16px)', background: '#f8f9fa', borderLeft: '4px solid #4a7cff', borderRadius: '0 8px 8px 0' }}>
                <Text style={{ fontSize: 'clamp(13px, 0.9vw, 15px)', color: '#495057', lineHeight: 1.7 }}>{previewData.short_description}</Text>
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
              <div style={{ marginBottom: 'clamp(16px, 2vw, 20px)', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 8px)', color: '#595959', fontSize: 'clamp(11px, 0.85vw, 13px)' }}>
                <CalendarOutlined style={{ color: '#4a7cff', fontSize: 'clamp(12px, 1vw, 14px)' }} />
                <Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)' }}>Scheduled: <strong>{previewData.scheduled_publish_date}</strong></Text>
              </div>
            )}
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: previewData.content || '<p>No content</p>' }} />
            {(previewData.seo_meta_title || previewData.seo_meta_description || previewData.seo_meta_keywords) && (
              <div style={{ marginTop: 'clamp(24px, 3vw, 32px)', padding: 'clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px)', background: '#f6f8fa', borderRadius: 10, border: '1px solid #e8e8e8' }}>
                <Text strong style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'clamp(10px, 1.5vw, 12px)' }}>SEO Settings</Text>
                {previewData.seo_meta_title && (
                  <div style={{ marginBottom: 'clamp(6px, 1vw, 8px)' }}>
                    <Text type="secondary" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)' }}>Meta Title</Text>
                    <div><Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)' }}>{previewData.seo_meta_title}</Text></div>
                  </div>
                )}
                {previewData.seo_meta_description && (
                  <div style={{ marginBottom: 'clamp(6px, 1vw, 8px)' }}>
                    <Text type="secondary" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)' }}>Meta Description</Text>
                    <div><Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)' }}>{previewData.seo_meta_description}</Text></div>
                  </div>
                )}
                {previewData.seo_meta_keywords && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)' }}>Keywords</Text>
                    <div><Text style={{ fontSize: 'clamp(11px, 0.85vw, 13px)' }}>{previewData.seo_meta_keywords}</Text></div>
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
          <div style={{ minHeight: 'clamp(50vh, 70vh, 70vh)', background: '#f5f5f5', padding: 'clamp(12px, 2vw, 20px)' }}>
            <div style={{ background: '#fff', minHeight: 'clamp(40vh, 60vh, 60vh)', padding: 'clamp(12px, 2vw, 20px)', borderRadius: 8 }}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent || '<p>No HTML content</p>' }} />
            </div>
          </div>
        </Modal>
      )}
      <style>{`
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
    </div>
  );
};

export default CreateContent;