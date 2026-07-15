import React, { useRef } from 'react';
import {
  Form, Input, Select, DatePicker, Upload, Button, Typography, Tooltip
} from 'antd';
import {
  HolderOutlined, DeleteOutlined, PlusOutlined,
  AppstoreOutlined, TagOutlined, CalendarOutlined,
  SettingOutlined, PictureOutlined, FilePdfOutlined,
  FontSizeOutlined, AlignLeftOutlined, InfoCircleOutlined,
  UploadOutlined, MenuOutlined, ApiOutlined
} from '@ant-design/icons';
import TipTapEditor from './TipTapEditor';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const SECTION_TYPES = [
  { type: 'content_type_category', label: 'Content Type & Category' },
  { type: 'title_description',     label: 'Title & Description' },
  { type: 'banner_image',          label: 'Banner Image' },
  { type: 'pdf_attachment',        label: 'PDF Attachment' },
  { type: 'content',               label: 'Content' },
  { type: 'tags',                  label: 'Tags' },
  { type: 'schedule',              label: 'Schedule' },
  { type: 'seo',                   label: 'SEO Settings' },
];

const SectionRenderer = ({ type, props }) => {
  const {
    form, categories, contentTypes, setSelectedTypeName,
    fileList, setFileList, pdfList, setPdfList,
    content, setContent, initialContent, editorReady
  } = props;

  const inputStyle = { fontSize: 14 };

  switch (type) {
    case 'content_type_category':
      return (
        <div style={{ display: 'flex', gap: 16 }}>
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
      );

    case 'title_description':
      return (
        <div>
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
      );

    case 'banner_image': {
      const bannerUrl = fileList.length > 0
        ? (fileList[0].originFileObj ? URL.createObjectURL(fileList[0].originFileObj) : fileList[0].url)
        : null;
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Recommended: 1200×630px</Text>
            <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />} size="small">{fileList.length > 0 ? 'Change Image' : 'Upload Image'}</Button>
            </Upload>
          </div>
          {bannerUrl ? (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
              <img src={bannerUrl} alt="Banner" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }} />
            </div>
          ) : (
            <div style={{ border: '2px dashed #d9d9d9', borderRadius: 8, padding: '32px 20px', textAlign: 'center', background: '#fafafa' }}>
              <PictureOutlined style={{ fontSize: 28, color: '#bfbfbf', marginBottom: 6, display: 'block' }} />
              <Text style={{ color: '#8c8c8c', fontSize: 13 }}>No banner image</Text>
            </div>
          )}
        </div>
      );
    }

    case 'pdf_attachment':
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>PDF will be downloaded when user submits the access form</Text>
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
      );

    case 'content':
      return editorReady ? (
        <TipTapEditor value={content} initialContent={initialContent} onChange={setContent} placeholder="Start writing your article..." />
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>Loading editor...</div>
      );

    case 'tags':
      return (
        <Form.Item name="tags" style={{ marginBottom: 0 }}>
          <Select mode="tags" placeholder="Add tags and press Enter..." style={{ width: '100%' }} tokenSeparators={[',']} />
        </Form.Item>
      );

    case 'schedule':
      return (
        <Form.Item name="scheduled_publish_date" style={{ marginBottom: 0 }} help="Leave empty to publish after approval">
          <DatePicker format="YYYY-MM-DD" placeholder="Select publish date" style={{ width: '100%' }} />
        </Form.Item>
      );

    case 'seo':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Form.Item name="seo_meta_title" label={<Text style={{ fontSize: 12 }}>Meta Title</Text>} style={{ marginBottom: 0 }}>
            <Input placeholder="SEO title" style={inputStyle} />
          </Form.Item>
          <Form.Item name="seo_meta_description" label={<Text style={{ fontSize: 12 }}>Meta Description</Text>} style={{ marginBottom: 0 }}>
            <TextArea rows={3} placeholder="SEO description" style={{ resize: 'none', fontSize: 13 }} />
          </Form.Item>
          <Form.Item name="seo_meta_keywords" label={<Text style={{ fontSize: 12 }}>Meta Keywords</Text>} style={{ marginBottom: 0 }}>
            <Select mode="tags" placeholder="Add keyword and press Enter..." style={{ width: '100%' }} tokenSeparators={[',']} />
          </Form.Item>
        </div>
      );

    default: return null;
  }
};

const LANDING_TYPES = ['webinar', 'whitepaper', 'event', 'ebook'];

const DragDropBuilder = ({ sectionProps, selectedTypeName = '', customFields = [], setCustomFields, fieldTypes = [], sections, onSectionsChange }) => {
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const addedTypes = sections.map(s => s.type);
  const availableSections = SECTION_TYPES.filter(s => !addedTypes.includes(s.type));

  const addSection = (type) => {
    onSectionsChange([...sections, { id: `sec-${Date.now()}`, type }]);
  };

  const removeSection = (id) => {
    onSectionsChange(sections.filter(s => s.id !== id));
  };

  const onDragStart = (index) => { dragItem.current = index; };
  const onDragEnter = (index) => { dragOver.current = index; };
  const onDragEnd = () => {
    const items = [...sections];
    const dragged = items.splice(dragItem.current, 1)[0];
    items.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    onSectionsChange(items);
  };

  const showLandingFields = LANDING_TYPES.includes((selectedTypeName || '').toLowerCase());

  const addField = () => {
    setCustomFields(prev => [...prev, {
      id: Date.now(), name: `field_${Date.now()}`, label: '',
      type: 'text', placeholder: '', options: '', required: true
    }]);
  };

  const updateField = (id, key, value) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [key]: value };
      if (key === 'label') updated.name = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${id}`;
      return updated;
    }));
  };

  const removeField = (id) => setCustomFields(prev => prev.filter(f => f.id !== id));

  const fieldDragItem = useRef(null);
  const fieldDragOver = useRef(null);
  const onFieldDragStart = (index) => { fieldDragItem.current = index; };
  const onFieldDragEnter = (index) => { fieldDragOver.current = index; };
  const onFieldDragEnd = () => {
    const fields = [...customFields];
    const dragged = fields.splice(fieldDragItem.current, 1)[0];
    fields.splice(fieldDragOver.current, 0, dragged);
    fieldDragItem.current = null;
    fieldDragOver.current = null;
    setCustomFields(fields);
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* Left Panel — Available Sections (Icons Removed) */}
      <div style={{
        width: 200, // Slightly reduced width since icons are removed
        flexShrink: 0, 
        background: '#fff',
        borderRadius: 12, 
        border: '1px solid #e8e8e8',
        padding: '16px 14px', 
        position: 'sticky', 
        top: 72
      }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 700, 
          color: '#8c8c8c', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          marginBottom: 12,
          paddingLeft: 4
        }}>
          Available Sections
        </div>
        {availableSections.length === 0 ? (
          <div style={{ fontSize: 12, color: '#bfbfbf', textAlign: 'center', padding: '12px 0' }}>All sections added</div>
        ) : availableSections.map(s => (
          <div
            key={s.type}
            onClick={() => addSection(s.type)}
            draggable
            onDragStart={() => {}}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              padding: '10px 14px', 
              borderRadius: 8, 
              cursor: 'pointer',
              border: '1px solid #e8e8e8', 
              background: '#fff', 
              marginBottom: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.borderColor = '#4a7cff'; 
              e.currentTarget.style.background = '#f0f5ff'; 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.borderColor = '#e8e8e8'; 
              e.currentTarget.style.background = '#fff'; 
            }}
          >
            <span style={{ 
              fontSize: 13, 
              color: '#1a1a2e', 
              fontWeight: 500, 
              flex: 1 
            }}>
              {s.label}
            </span>
            <PlusOutlined style={{ color: '#bfbfbf', fontSize: 11 }} />
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {sections.length === 0 ? (
          <div style={{
            minHeight: 400, border: '2px dashed #e0e0e0', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, background: '#fafafa'
          }}>
            <div style={{ fontSize: 36 }}>🧩</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#595959' }}>Click sections from the left panel to add them</div>
            <div style={{ fontSize: 13, color: '#8c8c8c' }}>Drag to reorder after adding</div>
          </div>
        ) : (
          sections.map((sec, index) => {
            const meta = SECTION_TYPES.find(s => s.type === sec.type);
            return (
              <div
                key={sec.id}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragEnter={() => onDragEnter(index)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{
                  background: '#fff', borderRadius: 12,
                  border: '1px solid #e8e8e8', marginBottom: 16,
                  overflow: 'hidden', cursor: 'default',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
              >
                {/* Section Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', background: '#fafafa',
                  borderBottom: '1px solid #f0f0f0', cursor: 'grab'
                }}>
                  <HolderOutlined style={{ color: '#bfbfbf' }} />
                  <span style={{
                    width: 24, height: 24, borderRadius: 5, background: '#4a7cff20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4a7cff', fontSize: 12
                  }}>
                    {meta?.icon}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
                    {meta?.label}
                  </span>
                  <Tooltip title="Remove section">
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeSection(sec.id)} />
                  </Tooltip>
                </div>

                {/* Section Content */}
                <div style={{ padding: '16px 20px' }}>
                  <SectionRenderer type={sec.type} props={sectionProps} />
                </div>
              </div>
            );
          })
        )}

        {/* Landing Page Form Fields — auto shown for webinar/whitepaper/event */}
        {showLandingFields && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <Text strong style={{ fontSize: 14 }}>
                  <MenuOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Landing Page Form Fields
                </Text>
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
              <div
                key={field.id}
                draggable
                onDragStart={() => onFieldDragStart(index)}
                onDragEnter={() => onFieldDragEnter(index)}
                onDragEnd={onFieldDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '12px 14px', marginBottom: 10,
                  background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8', cursor: 'grab'
                }}
              >
                <HolderOutlined style={{ color: '#bfbfbf', marginTop: 8, cursor: 'grab', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Input placeholder="Field Label (e.g. First Name)" value={field.label}
                    onChange={e => updateField(field.id, 'label', e.target.value)}
                    style={{ flex: '1 1 140px' }} size="small" />
                  <Input placeholder="API Key (e.g. firstname)" value={field.webhook_key || ''}
                    onChange={e => updateField(field.id, 'webhook_key', e.target.value)}
                    style={{ flex: '1 1 130px' }} size="small" />
                  <Select value={field.type} onChange={v => updateField(field.id, 'type', v)}
                    style={{ width: 110 }} size="small">
                    {fieldTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                  </Select>
                  <Input placeholder="Placeholder text" value={field.placeholder}
                    onChange={e => updateField(field.id, 'placeholder', e.target.value)}
                    style={{ flex: '1 1 130px' }} size="small" />
                  {field.type === 'select' && (
                    <Input placeholder="Options (comma separated)" value={field.options}
                      onChange={e => updateField(field.id, 'options', e.target.value)}
                      style={{ flex: '1 1 180px' }} size="small" />
                  )}
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeField(field.id)} style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* Client Webhook URL — auto shown for webinar/whitepaper/event */}
        {showLandingFields && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', border: '1px solid #e8e8e8', marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 14 }}>
                <ApiOutlined style={{ marginRight: 8, color: '#4a7cff' }} />Client Webhook URL
              </Text>
            </div>
            <Form.Item name="webhook_url" style={{ marginBottom: 0 }}
              rules={[{ type: 'url', message: 'Enter Valid api (https://...)' }]}>
              <Input
                placeholder="https://client-api.example.com/webhook"
                prefix={<ApiOutlined style={{ color: '#bfbfbf' }} />}
                allowClear
              />
            </Form.Item>
          </div>
        )}
      </div>
    </div>
  );
};

export default DragDropBuilder;