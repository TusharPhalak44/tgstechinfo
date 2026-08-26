import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Input, Button, Space, Tag, Table, Progress, ConfigProvider, message, Tooltip } from 'antd';
import {
  LineChartOutlined,
  SaveOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  BarChartOutlined,
  GlobalOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  PieChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const { TextArea } = Input;

/* ─────────────────────────────────────────────
   STYLING SYSTEM & ANIMATIONS (Dashboard Parity)
───────────────────────────────────────────── */
const seoStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .seo-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    animation: seoFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes seoFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .seo-stagger-1 { animation: seoSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .seo-stagger-2 { animation: seoSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.10s both; }
  .seo-stagger-3 { animation: seoSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
  .seo-stagger-4 { animation: seoSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both; }

  @keyframes seoSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .seo-beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2DD4BF;
    position: relative;
    display: inline-block;
  }
  .seo-beacon-dot::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid #2DD4BF;
    animation: seoPulse 2s ease-out infinite;
  }
  @keyframes seoPulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .seo-kpi-card {
    border-radius: 16px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .seo-kpi-card:hover {
    transform: translateY(-3px);
  }

  @keyframes gaugeDash {
    from { stroke-dashoffset: 440; }
  }

  .seo-gauge-circle {
    transition: stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    animation: gaugeDash 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

const SEO = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [seoScore, setSeoScore] = useState(78);
  const [seoIssues, setSeoIssues] = useState([]);
  const [pages, setPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    optimized: 0,
    needsWork: 0,
    avgScore: 0,
  });

  const [breakdown, setBreakdown] = useState({
    titleScore: 85,
    metaDescScore: 72,
    wordCountScore: 90,
    tagsScore: 80,
    metaKeywordsScore: 65,
  });

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    try {
      setLoading(true);

      const settingsResponse = await axios.get('/api/seo/settings');
      form.setFieldsValue(settingsResponse.data);

      const contentResponse = await axios.get('/api/admin/content/all', {
        params: { limit: 100, offset: 0 }
      });
      const contentData = contentResponse.data.data || [];

      let totalTitle = 0;
      let totalDesc = 0;
      let totalWords = 0;
      let totalTags = 0;
      let totalKeywords = 0;

      const calculateSEOScore = (title, description, content, tags, seoMetaTitle, seoMetaDescription) => {
        let score = 0;
        let maxScore = 100;
        let issues = [];

        if (title && title.length >= 30 && title.length <= 60) {
          score += 20;
          totalTitle += 20;
        } else if (title && title.length > 0) {
          score += 10;
          totalTitle += 10;
          issues.push(title.length < 30 ? 'Title is too short' : 'Title is too long');
        } else {
          issues.push('Title is missing');
        }

        if (description && description.length >= 120 && description.length <= 160) {
          score += 15;
          totalDesc += 15;
        } else if (description && description.length > 0) {
          score += 8;
          totalDesc += 8;
          issues.push('Description length sub-optimal');
        } else {
          issues.push('Description is missing');
        }

        const plainContent = content ? content.replace(/<[^>]*>/g, '').trim() : '';
        const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
        if (wordCount >= 300) {
          score += 25;
          totalWords += 25;
        } else {
          score += 15;
          totalWords += 15;
          issues.push('Content length short (< 300 words)');
        }

        const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
        if (parsedTags && parsedTags.length >= 3) {
          score += 10;
          totalTags += 10;
        } else {
          score += 5;
          totalTags += 5;
          issues.push('Needs 3+ tags');
        }

        if (seoMetaTitle && seoMetaTitle.length >= 30 && seoMetaTitle.length <= 60) {
          score += 15;
          totalKeywords += 15;
        } else {
          score += 8;
          totalKeywords += 8;
          issues.push('Meta title needs optimization');
        }

        if (seoMetaDescription && seoMetaDescription.length >= 120 && seoMetaDescription.length <= 160) {
          score += 15;
        } else {
          score += 8;
        }

        return { score: Math.round((score / maxScore) * 100), issues };
      };

      const pagesWithScores = contentData.map(item => {
        const { score, issues } = calculateSEOScore(
          item.title,
          item.short_description,
          item.content,
          item.tags,
          item.seo_meta_title,
          item.seo_meta_description
        );

        return {
          id: item.id,
          page: item.title || 'Untitled',
          title: item.title || 'Untitled',
          status: item.status || 'draft',
          score,
          issues,
          slug: item.slug,
        };
      });

      setPages(pagesWithScores);

      if (pagesWithScores.length > 0) {
        const totalScore = pagesWithScores.reduce((sum, page) => sum + page.score, 0);
        const averageScore = Math.round(totalScore / pagesWithScores.length);
        const optimized = pagesWithScores.filter(p => p.score >= 80).length;
        const needsWork = pagesWithScores.filter(p => p.score < 80).length;

        setSeoScore(averageScore);
        setStats({
          total: pagesWithScores.length,
          optimized,
          needsWork,
          avgScore: averageScore,
        });

        const len = pagesWithScores.length;
        setBreakdown({
          titleScore: Math.min(100, Math.round((totalTitle / (len * 20)) * 100)),
          metaDescScore: Math.min(100, Math.round((totalDesc / (len * 15)) * 100)),
          wordCountScore: Math.min(100, Math.round((totalWords / (len * 25)) * 100)),
          tagsScore: Math.min(100, Math.round((totalTags / (len * 10)) * 100)),
          metaKeywordsScore: Math.min(100, Math.round((totalKeywords / (len * 15)) * 100)),
        });

        const allIssues = [];
        pagesWithScores.forEach(page => {
          page.issues.forEach(issue => {
            allIssues.push({ type: 'warning', message: `${issue} for "${page.title}"` });
          });
        });

        setSeoIssues(allIssues.slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await axios.put('/api/seo/settings', values);
      message.success('SEO settings saved successfully');
      fetchSeoData();
    } catch (error) {
      message.error('Failed to save SEO settings');
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      const response = await axios.get('/api/seo/sitemap', { responseType: 'text' });
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
      message.error('Failed to generate sitemap');
    }
  };

  const handleCopyMetaTags = async () => {
    try {
      const settings = form.getFieldsValue();
      const metaTags = `<title>${settings.siteTitle || 'TgsTechInfo'}</title>\n<meta name="description" content="${settings.metaDescription || ''}">\n<meta name="keywords" content="${settings.metaKeywords || ''}">`;
      await navigator.clipboard.writeText(metaTags);
      message.success('Meta tags copied to clipboard');
    } catch (error) {
      message.error('Failed to copy meta tags');
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', accentColor, subtitle }) => {
    const colorMap = {
      primary: { bg: D ? 'rgba(45, 212, 191, 0.12)' : 'rgba(45, 212, 191, 0.08)', text: '#2DD4BF', border: 'rgba(45, 212, 191, 0.3)' },
      success: { bg: D ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
      warning: { bg: D ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
      info: { bg: D ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
      <div
        className="seo-kpi-card"
        style={{
          background: D
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.65) 100%)'
            : 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
          boxShadow: D
            ? '0 10px 30px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 30px -5px rgba(11, 31, 77, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor || c.text }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: D ? '#94A3B8' : '#64748B' }}>
            {title}
          </span>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${c.border}` }}>
            {icon}
          </div>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: D ? '#F8FAFC' : '#0F172A', lineHeight: 1 }}>
          {value}
        </div>

        {subtitle && (
          <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: D ? '#64748B' : '#94A3B8' }}>
            {subtitle}
          </div>
        )}
      </div>
    );
  };

  // SVG Circular Gauge calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.8
  const strokeDashoffset = circumference - (circumference * seoScore) / 100;

  const columns = [
    {
      title: 'Article / Page Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem' }}>{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <Tag color={status === 'published' ? 'green' : 'default'} style={{ borderRadius: 6, fontWeight: 700, textTransform: 'capitalize' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'SEO Grade',
      key: 'seoGrade',
      width: 120,
      render: (_, record) => {
        const grade = record.score >= 80 ? 'Optimal' : record.score >= 60 ? 'Moderate' : 'Critical';
        return (
          <Tooltip title={record.issues.join(', ') || 'Fully optimized'}>
            <Tag color={grade === 'Optimal' ? 'green' : grade === 'Moderate' ? 'orange' : 'red'} style={{ borderRadius: 6, fontWeight: 700 }}>
              {grade === 'Optimal' ? <CheckCircleOutlined /> : <WarningOutlined />} {grade}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'SEO Health Score',
      dataIndex: 'score',
      key: 'score',
      width: 180,
      render: (score) => (
        <Progress percent={score} strokeColor={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'} />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: D ? '#1E293B' : '#FFFFFF',
          colorText: D ? '#CBD5E1' : '#334155',
          colorBorder: D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)',
          colorBgElevated: D ? '#1E293B' : '#FFFFFF',
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        },
      }}
    >
      <style>{seoStyles}</style>

      <div className="seo-root" style={{ padding: '24px 28px', background: D ? '#0A1229' : '#F8FAFC', minHeight: '100vh' }}>
        {/* ── COMMAND HEADER BANNER ── */}
        <div
          className="seo-stagger-1"
          style={{
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            background: D
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.75) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: D ? '0 12px 32px -4px rgba(0, 0, 0, 0.4)' : '0 12px 32px -4px rgba(11, 31, 77, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.4), transparent)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="seo-beacon-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2DD4BF' }}>
                Search Engine Indexing & Graphical Analytics
              </span>
              <span style={{ fontSize: '0.72rem', color: D ? '#64748B' : '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B' }}>
                {seoScore}% Overall Health Score
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <LineChartOutlined style={{ color: '#2DD4BF' }} /> SEO Health & Graphical Performance Hub
            </h1>
          </div>

          <Space size={10}>
            <Button
              icon={<SaveOutlined />}
              onClick={handleGenerateSitemap}
              style={{ borderRadius: 10, fontWeight: 700, background: D ? '#1E293B' : '#F1F5F9' }}
            >
              Export Sitemap.xml
            </Button>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopyMetaTags}
              style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                height: 42,
                padding: '0 20px',
              }}
            >
              Copy Meta Tags
            </Button>
          </Space>
        </div>

        {/* ── EXECUTIVE KPI GRID ── */}
        <div
          className="seo-stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Indexed Pages" value={stats.total} icon={<BarChartOutlined />} color="primary" accentColor="#2DD4BF" subtitle="Audited Web Pages" />
          <StatCard title="Fully Optimized (80%+)" value={stats.optimized} icon={<CheckCircleOutlined />} color="success" accentColor="#10B981" subtitle="Good SEO Score" />
          <StatCard title="Needs Optimization" value={stats.needsWork} icon={<WarningOutlined />} color="warning" accentColor="#F59E0B" subtitle="Action Required" />
          <StatCard title="Average Platform Score" value={`${stats.avgScore}%`} icon={<SafetyCertificateOutlined />} color="info" accentColor="#3B82F6" subtitle="Site Wide Benchmark" />
        </div>

        {/* ── GRAPHICAL ANIMATED REPRESENTATIONS SECTION ── */}
        <Row gutter={[20, 20]} className="seo-stagger-3" style={{ marginBottom: 24 }}>
          {/* Animated SVG Circular Score Ring Meter */}
          <Col xs={24} lg={8}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 24,
                textAlign: 'center',
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#2DD4BF' }} /> Graphical Health Gauge
              </h3>

              <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="seoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="100%" stopColor="#2DD4BF" />
                    </linearGradient>
                  </defs>

                  {/* Outer Background Ring */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke={D ? 'rgba(51, 65, 85, 0.5)' : '#E2E8F0'}
                    strokeWidth="12"
                    fill="transparent"
                  />

                  {/* Animated Score Arc */}
                  <circle
                    className="seo-gauge-circle"
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="url(#seoGradient)"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Score Number Display */}
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: D ? '#F8FAFC' : '#0F172A', lineHeight: 1, display: 'block' }}>
                    {seoScore}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2DD4BF' }}>
                    Out of 100
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: '0.78rem', color: D ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                {seoScore >= 80 ? '🚀 Excellent SEO Optimization Status' : seoScore >= 60 ? '⚡ Good Progress, Action Needed' : '⚠️ Critical SEO Improvements Required'}
              </div>
            </div>
          </Col>

          {/* Graphical Breakdown Bar Charts */}
          <Col xs={24} lg={10}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 24,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiseOutlined style={{ color: '#3B82F6' }} /> Optimization Vector Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: D ? '#CBD5E1' : '#334155' }}>Article Title Optimization (30-60 chars)</span>
                    <span style={{ color: '#10B981' }}>{breakdown.titleScore}%</span>
                  </div>
                  <Progress percent={breakdown.titleScore} strokeColor="#10B981" showInfo={false} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: D ? '#CBD5E1' : '#334155' }}>Meta Description Density (120-160 chars)</span>
                    <span style={{ color: '#3B82F6' }}>{breakdown.metaDescScore}%</span>
                  </div>
                  <Progress percent={breakdown.metaDescScore} strokeColor="#3B82F6" showInfo={false} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: D ? '#CBD5E1' : '#334155' }}>Content Word Depth (&gt; 300 words)</span>
                    <span style={{ color: '#8B5CF6' }}>{breakdown.wordCountScore}%</span>
                  </div>
                  <Progress percent={breakdown.wordCountScore} strokeColor="#8B5CF6" showInfo={false} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: D ? '#CBD5E1' : '#334155' }}>Topic Tag Taxonomy (&gt;= 3 tags)</span>
                    <span style={{ color: '#F59E0B' }}>{breakdown.tagsScore}%</span>
                  </div>
                  <Progress percent={breakdown.tagsScore} strokeColor="#F59E0B" showInfo={false} />
                </div>
              </div>
            </div>
          </Col>

          {/* Visual Distribution Summary Card */}
          <Col xs={24} lg={6}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 24,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
                Content Health Split
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: D ? '#1E293B' : '#F1F5F9', padding: '12px 14px', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>Optimal Pages (80%+)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>{stats.optimized}</div>
                </div>

                <div style={{ background: D ? '#1E293B' : '#F1F5F9', padding: '12px 14px', borderRadius: 10, borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>Needs Work (&lt; 80%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B' }}>{stats.needsWork}</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* ── GLOBAL SETTINGS FORM & AUDIT LOGS ── */}
        <Row gutter={[20, 20]} className="seo-stagger-4" style={{ marginBottom: 24 }}>
          <Col xs={24} lg={15}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 24,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GlobalOutlined style={{ color: '#2DD4BF' }} /> Global Website SEO Tokens
              </h3>

              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item name="siteTitle" label={<span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Default Site Title</span>}>
                      <Input placeholder="TgsTechInfo - Advanced Tech Platform" style={{ borderRadius: 8, height: 40 }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="siteSeparator" label={<span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Separator</span>}>
                      <Input placeholder=" - " style={{ borderRadius: 8, height: 40 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="metaDescription" label={<span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Global Meta Description</span>}>
                  <TextArea rows={3} placeholder="Leading technology publication and enterprise digital solutions." style={{ borderRadius: 8 }} />
                </Form.Item>

                <Form.Item name="metaKeywords" label={<span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Global Meta Keywords</span>}>
                  <Input placeholder="technology, software, cloud, enterprise, devops" style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    style={{
                      background: 'linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      height: 40,
                    }}
                  >
                    Save SEO Settings
                  </Button>
                </div>
              </Form>
            </div>
          </Col>

          <Col xs={24} lg={9}>
            <div
              style={{
                background: D ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                padding: 20,
                boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
                minHeight: 380,
              }}
            >
              <h3 style={{ margin: '0 0 14px', fontSize: '0.92rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#F59E0B' }} /> SEO Recommendations Feed
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {seoIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: D ? '#1E293B' : '#F1F5F9',
                      border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: '0.78rem',
                      color: D ? '#CBD5E1' : '#334155',
                    }}
                  >
                    <WarningOutlined style={{ color: '#F59E0B' }} />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* ── CONTENT AUDIT TABLE ── */}
        <div
          className="seo-stagger-4"
          style={{
            background: D ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
            borderRadius: 16,
            border: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
            overflow: 'hidden',
            boxShadow: D ? '0 10px 30px -5px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(11, 31, 77, 0.05)',
          }}
        >
          <div
            style={{
              padding: '16px 22px',
              borderBottom: `1px solid ${D ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0F172A' }}>
                Content SEO Performance Registry
              </h3>
              <span style={{ fontSize: '0.78rem', color: D ? '#64748B' : '#94A3B8' }}>
                Audit scores across {pages.length} published articles and pages
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: D ? '#1E293B' : '#F1F5F9',
                  border: `1px solid ${D ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)'}`,
                  borderRadius: 10,
                  padding: '6px 14px',
                  width: 220,
                }}
              >
                <SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8', fontSize: 14 }} />
                <input
                  type="text"
                  placeholder="Filter pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.82rem',
                    color: D ? '#F8FAFC' : '#0F172A',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Tooltip title="Refresh SEO Audit">
                <Button icon={<ReloadOutlined />} onClick={fetchSeoData} style={{ borderRadius: 10, background: D ? '#1E293B' : '#F1F5F9' }} />
              </Tooltip>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SEO;
