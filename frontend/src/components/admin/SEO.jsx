import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, Space, Tag, Alert, Table, Progress, Grid, ConfigProvider, message, Tooltip } from 'antd';
import {
  LineChartOutlined,
  SaveOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SEO = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;
  const { darkMode } = useTheme();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [seoScore, setSeoScore] = useState(75);
  const [seoIssues, setSeoIssues] = useState([]);
  const [pages, setPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    try {
      setLoading(true);

      // Fetch SEO settings
      const settingsResponse = await axios.get('/api/seo/settings');
      form.setFieldsValue(settingsResponse.data);

      // Fetch all content for SEO analysis
      const contentResponse = await axios.get('/api/admin/content/all', {
        params: { limit: 100, offset: 0 }
      });
      const contentData = contentResponse.data.data || [];

      // Use the same SEO calculation logic as CreateContent.jsx
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
        const plainContent = content ? content.replace(/<[^>]*>/g, '').trim() : '';
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
        const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
        if (parsedTags && parsedTags.length >= 3) {
          score += 10;
        } else if (parsedTags && parsedTags.length > 0) {
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
          score: Math.round((score / maxScore) * 100),
          issues
        };
      };

      // Calculate SEO scores for all content
      const pagesWithScores = contentData.map(item => {
        const { score, issues } = calculateSEOScore(
          item.title,
          item.short_description,
          item.content,
          item.tags,
          item.seo_meta_title,
          item.seo_meta_description,
          item.seo_meta_keywords
        );

        return {
          id: item.id,
          page: item.title || 'Untitled',
          title: item.title || 'Untitled',
          status: item.status || 'draft',
          score: score,
          issues: issues,
          slug: item.slug,
        };
      });

      setPages(pagesWithScores);

      // Calculate overall SEO score
      if (pagesWithScores.length > 0) {
        const totalScore = pagesWithScores.reduce((sum, page) => sum + page.score, 0);
        const averageScore = Math.round(totalScore / pagesWithScores.length);
        setSeoScore(averageScore);

        // Collect all issues
        const allIssues = [];
        pagesWithScores.forEach(page => {
          page.issues.forEach(issue => {
            allIssues.push({ type: 'warning', message: `${issue} for "${page.title}"` });
          });
        });

        if (allIssues.length === 0) {
          allIssues.unshift({ type: 'success', message: 'All content has excellent SEO scores' });
        } else {
          allIssues.unshift({ type: 'success', message: `${pagesWithScores.length} content items analyzed` });
        }

        setSeoIssues(allIssues.slice(0, 10));
      } else {
        setSeoScore(0);
        setSeoIssues([]);
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      setPages([]);
      setSeoScore(0);
      setSeoIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Content Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: isMobile ? 120 : 250,
      render: (text, record) => (
        <Text strong style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#cbd5e1' : '#111827' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Content Status',
      dataIndex: 'status',
      key: 'contentStatus',
      width: isMobile ? 70 : 100,
      render: (status) => {
        const statusColors = {
          published: { bg: '#dcfce7', color: '#166534' },
          draft: { bg: '#f3f4f6', color: '#374151' },
          pending: { bg: '#fef3c7', color: '#92400e' },
          rejected: { bg: '#fee2e2', color: '#991b1b' },
        };
        const cfg = statusColors[status] || statusColors.draft;
        return (
          <Tag style={{
            background: cfg.bg,
            color: cfg.color,
            fontSize: isMobile ? 11 : 12,
            fontWeight: 500,
            border: 'none'
          }}>
            {status?.toUpperCase() || 'DRAFT'}
          </Tag>
        );
      },
    },
    {
      title: 'SEO Status',
      key: 'seoStatus',
      width: isMobile ? 70 : 100,
      render: (_, record) => {
        const seoStatus = record.score >= 80 ? 'Good' : record.score >= 60 ? 'Warning' : 'Critical';
        return (
          <Tooltip
            title={record.issues && record.issues.length > 0 ? record.issues.join(', ') : 'No SEO issues'}
            placement="top"
          >
            <Tag color={seoStatus === 'Good' ? 'green' : seoStatus === 'Warning' ? 'orange' : 'red'} icon={seoStatus === 'Good' ? <CheckCircleOutlined /> : <WarningOutlined />} style={{ fontSize: isMobile ? 11 : 14, cursor: 'pointer' }}>
              {seoStatus}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'SEO Score',
      dataIndex: 'score',
      key: 'score',
      width: isMobile ? 80 : 120,
      render: (score) => (
        <div style={{ width: isMobile ? 80 : 120 }}>
          <Progress percent={score} size="small" strokeColor={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'} />
        </div>
      ),
    },
  ];

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await axios.put('/api/seo/settings', values);
      message.success('SEO settings saved successfully');
      fetchSeoData(); // Refresh data
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      message.error('Failed to save SEO settings');
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      const response = await axios.get('/api/seo/sitemap');
      const blob = new Blob([response.data], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Sitemap generated successfully');
    } catch (error) {
      console.error('Error generating sitemap:', error);
      message.error('Failed to generate sitemap');
    }
  };

  const handleCopyMetaTags = async () => {
    try {
      const settings = form.getFieldsValue();
      const metaTags = `
<title>${settings.siteTitle}</title>
<meta name="description" content="${settings.metaDescription}">
<meta name="keywords" content="${settings.metaKeywords}">
${settings.ogImage ? `<meta property="og:image" content="${settings.ogImage}">` : ''}
      `.trim();
      
      await navigator.clipboard.writeText(metaTags);
      message.success('Meta tags copied to clipboard');
    } catch (error) {
      console.error('Error copying meta tags:', error);
      message.error('Failed to copy meta tags');
    }
  };

  return (
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
      <div className="p-4 md:p-6 lg:p-8">
        <div style={{ marginBottom: isMobile ? 16 : 32 }}>
          <Title level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 8 }}>
            <LineChartOutlined /> SEO Settings
          </Title>
          <Text style={{ fontSize: isMobile ? 13 : 15, color: darkMode ? '#94a3b8' : '#6B7280' }}>
            Manage search engine optimization settings for your website
          </Text>
        </div>

      <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} style={{ padding: isMobile ? '0 6px' : '0' }}>
          <Card
            style={{
              borderRadius: 12,
              border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
              boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
            }}
            bodyStyle={{ padding: isMobile ? '16px' : '20px' }}
          >
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 12 : 16, color: darkMode ? '#f1f5f9' : '#111827', fontSize: isMobile ? 16 : 18 }}>
              Overall SEO Score
            </Title>
            <div style={{ textAlign: 'center', padding: isMobile ? '12px 0' : '20px 0' }}>
              <div style={{ fontSize: isMobile ? 48 : 64, fontWeight: 600, color: seoScore >= 70 ? '#10B981' : seoScore >= 50 ? '#F59E0B' : '#EF4444' }}>
                {seoScore}
              </div>
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14, color: darkMode ? '#94a3b8' : '#6B7280' }}>out of 100</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
              boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
            }}
            bodyStyle={{ padding: isMobile ? '16px' : '20px' }}
          >
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 12 : 16, color: darkMode ? '#f1f5f9' : '#111827', fontSize: isMobile ? 16 : 18 }}>
              SEO Issues
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 4 : 8}>
              {seoIssues.map((issue, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 6 : 8 }}>
                  {issue.type === 'success' ? (
                    <CheckCircleOutlined style={{ color: '#10B981', marginTop: 4, fontSize: isMobile ? 12 : 14 }} />
                  ) : (
                    <WarningOutlined style={{ color: '#F59E0B', marginTop: 4, fontSize: isMobile ? 12 : 14 }} />
                  )}
                  <Text style={{ fontSize: isMobile ? 11 : 13, color: darkMode ? '#cbd5e1' : '#111827' }}>{issue.message}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} style={{ padding: isMobile ? '0 6px' : '0' }}>
          <Card
            style={{
              borderRadius: 12,
              border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
              boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              height: '100%',
            }}
            bodyStyle={{ padding: isMobile ? '16px' : '20px' }}
          >
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 12 : 16, color: darkMode ? '#f1f5f9' : '#111827', fontSize: isMobile ? 16 : 18 }}>
              Quick Actions
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 4 : 8}>
              <Button type="primary" icon={<SaveOutlined />} block size={isMobile ? 'small' : 'middle'} onClick={handleGenerateSitemap}>
                Generate Sitemap
              </Button>
              <Button icon={<CopyOutlined />} block size={isMobile ? 'small' : 'middle'} onClick={handleCopyMetaTags}>
                Copy Meta Tags
              </Button>
              <Button block size={isMobile ? 'small' : 'middle'} onClick={fetchSeoData} loading={loading}>
                Refresh Analysis
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Global SEO Settings"
        loading={loading}
        style={{
          borderRadius: 12,
          border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={isMobile ? 12 : 16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                name="siteTitle"
                label="Site Title"
                initialValue="TgsTechInfo - Technology Solutions"
                rules={[{ required: true, message: 'Please enter site title' }]}
              >
                <Input placeholder="Enter site title" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                name="siteSeparator"
                label="Title Separator"
                initialValue=" - "
              >
                <Input placeholder="Title separator" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="metaDescription"
            label="Meta Description"
            initialValue="TgsTechInfo provides cutting-edge technology solutions for businesses. Discover our innovative services and products."
            rules={[{ required: true, message: 'Please enter meta description' }]}
          >
            <TextArea rows={3} placeholder="Enter meta description (150-160 characters)" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
          </Form.Item>

          <Row gutter={isMobile ? 12 : 16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                name="metaKeywords"
                label="Meta Keywords"
                initialValue="technology, solutions, software, development"
              >
                <Input placeholder="Enter meta keywords (comma-separated)" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                name="ogImage"
                label="Open Graph Image"
              >
                <Input placeholder="Enter OG image URL" style={{ background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ width: isMobile ? '100%' : 'auto' }}>
                Save Settings
              </Button>
              <Button style={{ width: isMobile ? '100%' : 'auto' }}>Preview</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Content SEO Analysis</span>
            <Input
              placeholder="Search content..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: isMobile ? 150 : 250, background: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#cbd5e1' : '#111827', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        }
        loading={loading}
        style={{
          borderRadius: 12,
          border: darkMode ? '1px solid #334155' : '1px solid #E5E7EB',
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
      >
        <div style={{ maxHeight: isMobile ? 400 : 500, overflowY: 'auto' }}>
          <Table
            columns={columns}
            dataSource={pages.filter(page =>
              page.title.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            rowKey="id"
            scroll={{ x: isMobile ? 600 : 800 }}
            pagination={false}
            size={isMobile ? 'small' : 'middle'}
            style={{ fontSize: isMobile ? 12 : 14 }}
          />
        </div>
      </Card>
    </div>
    </ConfigProvider>
  );
};

export default SEO;
