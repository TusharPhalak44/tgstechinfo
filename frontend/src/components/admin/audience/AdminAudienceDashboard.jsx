import React, { useState, useEffect } from 'react';
import {
  Tabs, Card, Table, Form, Input, InputNumber, Button, Switch, Modal,
  Tag, message, Upload, Alert, Statistic, Row, Col, Space, Tooltip, Select
} from 'antd';
import {
  DatabaseOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  UploadOutlined,
  HistoryOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  SlidersOutlined,
  ArrowUpOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { audienceService } from '../../../services/audienceService';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminAudienceDashboard() {
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settingsData, setSettingsData] = useState({ settings: [], database_summary: {} });
  const [settingsForm] = Form.useForm();

  // Taxonomies state
  const [taxonomies, setTaxonomies] = useState(null);
  const [selectedTaxType, setSelectedTaxType] = useState('countries');
  const [taxModalVisible, setTaxModalVisible] = useState(false);
  const [editingTaxItem, setEditingTaxItem] = useState(null);
  const [taxForm] = Form.useForm();

  // Statistics Explorer state
  const [statsRows, setStatsRows] = useState([]);
  const [statsPagination, setStatsPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [statsSearch, setStatsSearch] = useState('');
  const [statsFilters, setStatsFilters] = useState({
    region_id: undefined,
    country_id: undefined,
    industry_id: undefined,
    employee_size_id: undefined,
    department_id: undefined,
    job_level_id: undefined
  });
  const [editStatModalVisible, setEditStatModalVisible] = useState(false);
  const [editingStat, setEditingStat] = useState(null);
  const [statEditForm] = Form.useForm();

  // Volume Adjuster state
  const [adjusterScopeType, setAdjusterScopeType] = useState('REGION');
  const [adjusterScopeCode, setAdjusterScopeCode] = useState('APAC');
  const [adjusterMode, setAdjusterMode] = useState('DELTA');
  const [adjusterDelta, setAdjusterDelta] = useState(100000);
  const [adjusterTargetTotal, setAdjusterTargetTotal] = useState(20000000);
  const [adjusterNotes, setAdjusterNotes] = useState('Proportional APAC regional volume expansion');
  const [adjusterPreview, setAdjusterPreview] = useState(null);
  const [adjusterHistory, setAdjusterHistory] = useState([]);
  const [isPreviewingAdjuster, setIsPreviewingAdjuster] = useState(false);
  const [isApplyingAdjuster, setIsApplyingAdjuster] = useState(false);

  // Data Quality state
  const [qualityReport, setQualityReport] = useState(null);

  // Import state
  const [importCsvText, setImportCsvText] = useState('');
  const [importDryRunResult, setImportDryRunResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0 });

  // 1. Fetch Settings & DB Summary
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await audienceService.getAdminSettings();
      if (res?.data) {
        setSettingsData(res.data);
        const map = {};
        res.data.settings.forEach(s => {
          map[s.setting_key] = s.setting_value;
        });
        settingsForm.setFieldsValue(map);
      }
    } catch (err) {
      message.error(err.message || 'Failed to load audience settings');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Taxonomies
  const loadTaxonomies = async () => {
    try {
      const data = await audienceService.getAdminTaxonomies();
      setTaxonomies(data);
      return data;
    } catch (err) {
      message.error(err.message || 'Failed to load taxonomies');
    }
  };

  // 3. Fetch Statistics Explorer
  const loadStatistics = async (page = 1, search = statsSearch, filters = statsFilters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search,
        region_id: filters.region_id,
        country_id: filters.country_id,
        industry_id: filters.industry_id,
        employee_size_id: filters.employee_size_id,
        department_id: filters.department_id,
        job_level_id: filters.job_level_id
      };
      const data = await audienceService.getAdminStatistics(params);
      if (data) {
        setStatsRows(data.rows || []);
        setStatsPagination(data.pagination || { page: 1, limit: 20, total: 0 });
      }
    } catch (err) {
      message.error(err.message || 'Failed to load audience statistics');
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch Import History & Audit Logs
  const loadImportsAndAudit = async () => {
    try {
      const [imports, logs] = await Promise.all([
        audienceService.getImportHistory(),
        audienceService.getAuditLogs({ page: auditPagination.page, limit: 20 })
      ]);
      setImportHistory(imports || []);
      setAuditLogs(logs?.logs || []);
      setAuditPagination(logs?.pagination || { page: 1, limit: 20, total: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdjustmentHistory = async () => {
    try {
      const data = await audienceService.getAdjustmentHistory();
      setAdjusterHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadQualityReport = async () => {
    try {
      setLoading(true);
      const data = await audienceService.getDataQualityReport();
      setQualityReport(data);
    } catch (err) {
      message.error('Failed to load data quality report');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewAdjuster = async () => {
    try {
      setIsPreviewingAdjuster(true);
      const res = await audienceService.previewAudienceAdjustment({
        scope_type: adjusterScopeType,
        scope_code: adjusterScopeCode,
        adjustment_mode: adjusterMode,
        delta_contacts: adjusterDelta,
        target_total_contacts: adjusterTargetTotal
      });
      setAdjusterPreview(res);
      message.info(`Calculated proportional breakdown for ${res.scope_name}`);
    } catch (err) {
      message.error(err.message || 'Failed to calculate adjustment preview');
    } finally {
      setIsPreviewingAdjuster(false);
    }
  };

  const handleApplyAdjuster = async () => {
    try {
      setIsApplyingAdjuster(true);
      const res = await audienceService.adjustAudienceVolume({
        scope_type: adjusterScopeType,
        scope_code: adjusterScopeCode,
        adjustment_mode: adjusterMode,
        delta_contacts: adjusterDelta,
        target_total_contacts: adjusterTargetTotal,
        notes: adjusterNotes
      });
      message.success(res.message || 'Audience volume adjusted successfully!');
      setAdjusterPreview(null);
      loadSettings();
      loadAdjustmentHistory();
    } catch (err) {
      message.error(err.message || 'Failed to apply audience volume adjustment');
    } finally {
      setIsApplyingAdjuster(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTaxonomies();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') loadSettings();
    else if (activeTab === 'adjuster') {
      if (!taxonomies) loadTaxonomies();
      loadAdjustmentHistory();
    }
    else if (activeTab === 'taxonomies') loadTaxonomies();
    else if (activeTab === 'statistics') {
      if (!taxonomies) loadTaxonomies();
      loadStatistics(1, statsSearch, statsFilters);
    }
    else if (activeTab === 'quality') loadQualityReport();
    else if (activeTab === 'import') loadImportsAndAudit();
    else if (activeTab === 'audit') loadImportsAndAudit();
  }, [activeTab]);

  const handleFilterChange = (key, value) => {
    const updated = { ...statsFilters, [key]: value };
    setStatsFilters(updated);
    loadStatistics(1, statsSearch, updated);
  };

  const handleResetFilters = () => {
    const cleared = {
      region_id: undefined,
      country_id: undefined,
      industry_id: undefined,
      employee_size_id: undefined,
      department_id: undefined,
      job_level_id: undefined
    };
    setStatsFilters(cleared);
    setStatsSearch('');
    loadStatistics(1, '', cleared);
  };

  const activeFilterCount = Object.values(statsFilters).filter(Boolean).length + (statsSearch.trim() ? 1 : 0);

  // Handle Save Settings
  const handleSaveSettings = async (values) => {
    try {
      setLoading(true);
      const array = Object.entries(values).map(([key, value]) => ({ key, value }));
      await audienceService.updateAdminSettings(array);
      message.success('Global audience configuration saved successfully!');
      loadSettings();
    } catch (err) {
      message.error(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Taxonomy Item
  const handleSaveTaxonomy = async (values) => {
    try {
      await audienceService.upsertTaxonomyItem(selectedTaxType, {
        ...values,
        id: editingTaxItem?.id
      });
      message.success(`${selectedTaxType} item saved successfully`);
      setTaxModalVisible(false);
      loadTaxonomies();
    } catch (err) {
      message.error(err.message || 'Failed to save taxonomy item');
    }
  };

  // Handle CSV Dry-Run Validation
  const handleParseAndValidateCSV = async (dryRun = true) => {
    try {
      setIsImporting(true);
      if (!importCsvText.trim()) {
        message.warning('Please paste or upload CSV data first.');
        setIsImporting(false);
        return;
      }

      // Parse CSV into rows array
      const lines = importCsvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        message.error('CSV must contain a header line and at least 1 data line.');
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = parts[idx] || '';
        });
        parsedRows.push(obj);
      }

      const res = await audienceService.importAudienceData({
        rows: parsedRows,
        dry_run: dryRun,
        version_label: `Batch Import (${parsedRows.length} rows)`,
        filename: 'manual_admin_upload.csv'
      });

      if (dryRun) {
        setImportDryRunResult(res);
        message.info(`Validation complete: ${res.valid_rows_count} valid, ${res.invalid_rows_count} errors.`);
      } else {
        message.success(`Published ${res.new_total_contacts.toLocaleString()} total audience records!`);
        setImportDryRunResult(null);
        setImportCsvText('');
        loadImportsAndAudit();
      }
    } catch (err) {
      message.error(err.message || 'Import validation failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Sample CSV generator for admin reference
  const loadSampleCSV = () => {
    const sample = `country,region,industry,employee_size,department,job_level,contact_count
India,APAC,Telecommunications/Technology Sector,1001_5000,IT,DIRECTOR,12500
Brazil,LATAM,Finance/Banking/Insurance/VC/Private Equity,501_1000,Finance,C_LEVEL,4200
United States,NORTH_AMERICA,Healthcare/Pharmaceuticals,10001_PLUS,Operations,MANAGER,8900
Germany,EMEA,Manufacturing & Process Industries,201_500,Sales,VP_EXEC,3100`;
    setImportCsvText(sample);
    message.info('Sample CSV template loaded');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            Data Demographics & Audience Intelligence Management
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.875rem' }}>
            Manage commercial global figures, demographic taxonomies, data combinations, and batch CSV imports.
          </p>
        </div>
      </div>

      <Card style={{ borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          
          {/* ── TAB 1: Global Configuration & Database Summary ── */}
          <TabPane
            tab={<span><DatabaseOutlined /> Global Settings & Sizing</span>}
            key="settings"
          >
            <div style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ background: '#F0F9FF', borderColor: '#BAE6FD', borderRadius: 10 }}>
                    <Statistic
                      title="Aggregated Contacts in DB"
                      value={settingsData.database_summary?.total_contacts || 0}
                      valueStyle={{ color: '#0284C7', fontWeight: 800 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ background: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 10 }}>
                    <Statistic
                      title="Target Companies in DB"
                      value={settingsData.database_summary?.total_companies || 0}
                      valueStyle={{ color: '#D97706', fontWeight: 800 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', borderRadius: 10 }}>
                    <Statistic
                      title="Active Countries Covered"
                      value={settingsData.database_summary?.active_countries || 0}
                      valueStyle={{ color: '#16A34A', fontWeight: 800 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ background: '#FAF5FF', borderColor: '#E9D5FF', borderRadius: 10 }}>
                    <Statistic
                      title="Total Demographic Cells"
                      value={settingsData.database_summary?.total_combinations || 0}
                      valueStyle={{ color: '#9333EA', fontWeight: 800 }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings}>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Commercial Global Contacts Count (e.g. 78,000,000)"
                    name="global_contacts_total"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="78000000" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Commercial Global Companies Count"
                    name="global_companies_total"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="4250000" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Countries Covered Display Badge"
                    name="countries_covered_count"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="195+" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Commercial Freshness Display (e.g. August 2026)"
                    name="last_updated_display"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="August 2026" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Minimum Privacy Threshold (Mask below count)"
                    name="privacy_threshold"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={500} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Brand Name Display"
                    name="brand_name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="TARAJ GLOBAL" />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                style={{ background: '#0AAEEF', borderColor: '#0AAEEF', fontWeight: 700, borderRadius: 8 }}
              >
                Save Global Configuration
              </Button>
            </Form>
          </TabPane>

          {/* ── TAB 2: Direct Regional Volume & Proportional Scope Adjuster ── */}
          <TabPane
            tab={<span><ThunderboltOutlined style={{ color: '#0AAEEF' }} /> Regional Scale Editor</span>}
            key="adjuster"
          >
            <div style={{ marginBottom: 24 }}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ThunderboltOutlined style={{ color: '#0AAEEF', fontSize: 20 }} />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Proportional Scope & Region Volume Adjuster</span>
                  </div>
                }
                style={{ borderRadius: 12, borderColor: '#BAE6FD', background: '#F8FAFC' }}
              >
                <Alert
                  type="info"
                  showIcon
                  message="Proportional Volume Redistribution"
                  description="Directly adjust the count of any Region (e.g. APAC +100,000), Commercial Group (DACH, Nordics), or Country. The engine calculates each country's exact percentage share and redistributes the added volume across all underlying demographic cells proportionally, updating the global database total."
                  style={{ marginBottom: 20, borderRadius: 8 }}
                />

                <Row gutter={[20, 20]}>
                  <Col xs={24} md={6}>
                    <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                      1. Scope Type
                    </label>
                    <Select value={adjusterScopeType} onChange={(newType) => {
                      setAdjusterScopeType(newType);
                      setAdjusterPreview(null);
                      if (newType === 'REGION') setAdjusterScopeCode('APAC');
                      else if (newType === 'GEO_GROUP') setAdjusterScopeCode('DACH');
                      else if (newType === 'COUNTRY') setAdjusterScopeCode(taxonomies?.countries?.[0]?.iso_code || 'IN');
                      else if (newType === 'GLOBAL') setAdjusterScopeCode('GLOBAL');
                    }} style={{ width: '100%' }}>
                      <Option value="REGION">Continent / Region (APAC, EMEA, LATAM)</Option>
                      <Option value="GEO_GROUP">Commercial Group (DACH, Nordics, UK & Ireland)</Option>
                      <Option value="COUNTRY">Specific Country (India, USA, Germany)</Option>
                      <Option value="GLOBAL">Entire Global Database</Option>
                    </Select>
                  </Col>

                  <Col xs={24} md={6}>
                    <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                      2. Target Scope
                    </label>
                    <Select value={adjusterScopeCode} onChange={setAdjusterScopeCode} style={{ width: '100%' }} showSearch>
                      {adjusterScopeType === 'REGION' && (
                        <>
                          <Option value="APAC">APAC (Asia Pacific)</Option>
                          <Option value="EMEA">EMEA (Europe, Middle East, Africa)</Option>
                          <Option value="NORTH_AMERICA">North America (USA & Canada)</Option>
                          <Option value="LATAM">LATAM (Latin America)</Option>
                        </>
                      )}
                      {adjusterScopeType === 'GEO_GROUP' && (
                        <>
                          <Option value="DACH">DACH (Germany, Austria, Switzerland)</Option>
                          <Option value="NORDICS">Nordics (Sweden, Norway, Denmark, Finland)</Option>
                          <Option value="UK_IRELAND">UK & Ireland</Option>
                          <Option value="SEA">Southeast Asia (SG, MY, ID, PH, VN)</Option>
                          <Option value="ANZ">ANZ (Australia & New Zealand)</Option>
                          <Option value="MENA">MENA (UAE, Saudi Arabia)</Option>
                        </>
                      )}
                      {adjusterScopeType === 'COUNTRY' && taxonomies?.countries?.map(c => (
                        <Option key={c.iso_code} value={c.iso_code}>{c.name} ({c.iso_code})</Option>
                      ))}
                      {adjusterScopeType === 'GLOBAL' && (
                        <Option value="GLOBAL">Entire Global Database (78M+)</Option>
                      )}
                    </Select>
                  </Col>

                  <Col xs={24} md={6}>
                    <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                      3. Adjustment Mode
                    </label>
                    <Select value={adjusterMode} onChange={setAdjusterMode} style={{ width: '100%' }}>
                      <Option value="DELTA">Add / Subtract Volume (+ / - Delta)</Option>
                      <Option value="TARGET">Set Exact Target Total Count</Option>
                    </Select>
                  </Col>

                  <Col xs={24} md={6}>
                    <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                      {adjusterMode === 'DELTA' ? '4. Volume Delta to Add (e.g. +100,000)' : '4. Target Scope Total Count'}
                    </label>
                    {adjusterMode === 'DELTA' ? (
                      <InputNumber
                        value={adjusterDelta}
                        onChange={val => setAdjusterDelta(val || 0)}
                        step={10000}
                        style={{ width: '100%' }}
                        formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={val => val.replace(/\$\s?|(,*)/g, '')}
                      />
                    ) : (
                      <InputNumber
                        value={adjusterTargetTotal}
                        onChange={val => setAdjusterTargetTotal(val || 0)}
                        step={100000}
                        style={{ width: '100%' }}
                        formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={val => val.replace(/\$\s?|(,*)/g, '')}
                      />
                    )}
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                    Notes / Reference Reason
                  </label>
                  <Input
                    value={adjusterNotes}
                    onChange={e => setAdjusterNotes(e.target.value)}
                    placeholder="e.g. Proportional APAC regional expansion as per Q3 targets"
                  />
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <Button
                    type="primary"
                    icon={<SlidersOutlined />}
                    loading={isPreviewingAdjuster}
                    onClick={handlePreviewAdjuster}
                    style={{ background: '#0AAEEF', borderColor: '#0AAEEF', fontWeight: 700, borderRadius: 8 }}
                  >
                    Calculate Proportional Preview
                  </Button>
                </div>
              </Card>
            </div>

            {/* Interactive Preview Result Card */}
            {adjusterPreview && (
              <Card
                style={{ borderRadius: 12, borderColor: '#67E8F9', marginBottom: 24, boxShadow: '0 4px 16px rgba(10, 174, 239, 0.12)' }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#0F172A' }}>
                      Proportional Adjustment Simulation: {adjusterPreview.scope_name}
                    </span>
                    <Tag color="cyan" style={{ fontSize: '0.85rem', padding: '4px 10px', borderRadius: 6 }}>
                      Ratio Multiplier: {adjusterPreview.proportional_ratio}x
                    </Tag>
                  </div>
                }
              >
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#F0F9FF', borderRadius: 8 }}>
                      <Statistic title="Baseline Scope Contacts" value={adjusterPreview.baseline_scope_contacts} valueStyle={{ fontWeight: 800 }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#ECFDF5', borderRadius: 8 }}>
                      <Statistic title="Added Volume Delta" value={adjusterPreview.delta_applied} prefix="+" valueStyle={{ color: '#059669', fontWeight: 800 }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#FFFBEB', borderRadius: 8 }}>
                      <Statistic title="Projected Scope Total" value={adjusterPreview.target_scope_contacts} valueStyle={{ color: '#D97706', fontWeight: 800 }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#FAF5FF', borderRadius: 8 }}>
                      <Statistic title="Projected Global DB Total" value={adjusterPreview.projected_global_total} valueStyle={{ color: '#7C3AED', fontWeight: 800 }} />
                    </Card>
                  </Col>
                </Row>

                <h4 style={{ fontWeight: 700, margin: '16px 0 12px 0', color: '#1E293B' }}>
                  Country-by-Country Proportional Redistribution Breakdown:
                </h4>
                <Table
                  dataSource={adjusterPreview.country_breakdown}
                  rowKey="country_id"
                  pagination={{ pageSize: 10 }}
                  size="middle"
                  columns={[
                    { title: 'ISO', dataIndex: 'iso_code', width: 80, render: val => <Tag color="blue">{val}</Tag> },
                    { title: 'Country Name', dataIndex: 'country_name', fontWeight: 600 },
                    { title: 'Current Contacts', dataIndex: 'current_contacts', render: val => val.toLocaleString() },
                    { title: 'Scope Weight %', dataIndex: 'weight_percentage', render: val => `${val}%` },
                    { title: 'Added Volume', dataIndex: 'added_delta', render: val => <span style={{ color: '#059669', fontWeight: 700 }}>+{val.toLocaleString()}</span> },
                    { title: 'Projected Contacts', dataIndex: 'projected_contacts', render: val => <span style={{ fontWeight: 800, color: '#0F172A' }}>{val.toLocaleString()}</span> }
                  ]}
                />

                <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setAdjusterPreview(null)}>Dismiss Preview</Button>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={isApplyingAdjuster}
                    onClick={handleApplyAdjuster}
                    style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 700, borderRadius: 8 }}
                  >
                    Apply Scale & Sync System Total
                  </Button>
                </div>
              </Card>
            )}

            {/* Adjustment Log History */}
            <Card title={<span style={{ fontWeight: 800 }}>Volume Scale History Log</span>} style={{ borderRadius: 12 }}>
              <Table
                dataSource={adjusterHistory}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
                columns={[
                  { title: 'Date', dataIndex: 'created_at', render: val => new Date(val).toLocaleString() },
                  { title: 'Target Scope', dataIndex: 'scope_name', fontWeight: 600 },
                  { title: 'Type', dataIndex: 'adjustment_type', render: val => <Tag color="cyan">{val}</Tag> },
                  { title: 'Delta', dataIndex: 'delta_applied', render: val => <span style={{ fontWeight: 700, color: val >= 0 ? '#059669' : '#DC2626' }}>{val >= 0 ? `+${val.toLocaleString()}` : val.toLocaleString()}</span> },
                  { title: 'Previous Scope Total', dataIndex: 'previous_total', render: val => val.toLocaleString() },
                  { title: 'New Scope Total', dataIndex: 'new_total', render: val => <span style={{ fontWeight: 700 }}>{val.toLocaleString()}</span> },
                  { title: 'Performed By', dataIndex: 'performed_by_name' }
                ]}
              />
            </Card>
          </TabPane>

          {/* ── TAB 3: Data Quality & Coverage Matrix Report ── */}
          <TabPane
            tab={<span><SafetyCertificateOutlined style={{ color: '#10B981' }} /> Data Quality & Coverage</span>}
            key="quality"
          >
            {qualityReport ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', borderRadius: 10 }}>
                      <Statistic title="Total Indexed Contacts" value={qualityReport.total_contacts || 0} valueStyle={{ color: '#16A34A', fontWeight: 800 }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#F0F9FF', borderColor: '#BAE6FD', borderRadius: 10 }}>
                      <Statistic title="Total Demographic Combinations" value={qualityReport.total_indexed_records || 0} valueStyle={{ color: '#0284C7', fontWeight: 800 }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#FAF5FF', borderColor: '#E9D5FF', borderRadius: 10 }}>
                      <Statistic title="LinkedIn Industry Coverage" value={qualityReport.dimensions?.industry_linkedin_v2?.coverage_percentage || 0} suffix="%" valueStyle={{ color: '#9333EA', fontWeight: 800 }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ background: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 10 }}>
                      <Statistic title="LinkedIn Function Coverage" value={qualityReport.dimensions?.linkedin_functions?.coverage_percentage || 0} suffix="%" valueStyle={{ color: '#D97706', fontWeight: 800 }} />
                    </Card>
                  </Col>
                </Row>

                <Card title={<span style={{ fontWeight: 800 }}>LinkedIn Dimension Coverage Metrics</span>} style={{ borderRadius: 12 }}>
                  <Table
                    dataSource={[
                      { dimension: 'Geography & Nations', ...qualityReport.dimensions?.geography },
                      { dimension: 'LinkedIn Industry V2 Hierarchy', ...qualityReport.dimensions?.industry_linkedin_v2 },
                      { dimension: 'LinkedIn Standard Functions', ...qualityReport.dimensions?.linkedin_functions },
                      { dimension: 'LinkedIn Headcount Brackets', ...qualityReport.dimensions?.company_headcount },
                      { dimension: 'LinkedIn Seniority Levels', ...qualityReport.dimensions?.seniority_levels }
                    ]}
                    rowKey="dimension"
                    pagination={false}
                    columns={[
                      { title: 'Taxonomy Dimension', dataIndex: 'dimension', fontWeight: 700 },
                      { title: 'Classified Contacts', dataIndex: 'classified_contacts', render: val => (val || 0).toLocaleString() },
                      { title: 'Unclassified Contacts', dataIndex: 'unclassified_contacts', render: val => (val || 0).toLocaleString() },
                      {
                        title: 'Coverage Rate',
                        dataIndex: 'coverage_percentage',
                        render: val => (
                          <Tag color={val > 90 ? 'green' : val > 75 ? 'orange' : 'volcano'} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {val}% Classified
                          </Tag>
                        )
                      }
                    ]}
                  />
                </Card>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Button type="primary" onClick={loadQualityReport} style={{ background: '#0AAEEF', borderColor: '#0AAEEF' }}>
                  Load Data Quality Report
                </Button>
              </div>
            )}
          </TabPane>

          {/* ── TAB 4: Taxonomies & Geographic Hierarchy ── */}
          <TabPane
            tab={<span><GlobalOutlined /> Taxonomies & Hierarchy</span>}
            key="taxonomies"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Space>
                <Select value={selectedTaxType} onChange={setSelectedTaxType} style={{ width: 260 }}>
                  <Option value="countries">Countries Master (195+ Nations)</Option>
                  <Option value="regions">Continents & Macro Regions</Option>
                  <Option value="geo-groups">Commercial Geo Groups (DACH, Nordics, SEA)</Option>
                  <Option value="industries">LinkedIn Industry V2 Hierarchy</Option>
                  <Option value="employee-sizes">LinkedIn Headcount Brackets</Option>
                  <Option value="functions">LinkedIn Standard Functions</Option>
                  <Option value="departments">Departments</Option>
                  <Option value="job-levels">LinkedIn Seniority Levels</Option>
                  <Option value="job-titles">Searchable Dynamic Job Titles</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={loadTaxonomies} />
              </Space>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTaxItem(null);
                  taxForm.resetFields();
                  setTaxModalVisible(true);
                }}
                style={{ background: '#0AAEEF', borderColor: '#0AAEEF', borderRadius: 8 }}
              >
                Add {selectedTaxType}
              </Button>
            </div>

            {taxonomies && (
              <Table
                dataSource={
                  selectedTaxType === 'countries' ? taxonomies.countries :
                  selectedTaxType === 'regions' ? taxonomies.regions :
                  selectedTaxType === 'industries' ? taxonomies.industries :
                  selectedTaxType === 'employee-sizes' ? taxonomies.employee_sizes :
                  selectedTaxType === 'departments' ? taxonomies.departments :
                  taxonomies.job_levels
                }
                rowKey="id"
                pagination={{ pageSize: 15 }}
                size="middle"
                columns={[
                  { title: 'ID', dataIndex: 'id', width: 60 },
                  { title: 'Name', dataIndex: 'name', fontWeight: 600 },
                  { title: 'Code / ISO', dataIndex: selectedTaxType === 'countries' ? 'iso_code' : 'code', render: val => <Tag color="blue">{val}</Tag> },
                  ...(selectedTaxType === 'countries' ? [
                    { title: 'Lat/Lon', render: (_, r) => `${r.lat}, ${r.lon}` }
                  ] : []),
                  { title: 'Demographic Records', dataIndex: 'stats_count', render: val => <span style={{ fontWeight: 600 }}>{(val || 0).toLocaleString()}</span> },
                  { title: 'Active', dataIndex: 'is_active', render: val => <Tag color={val ? 'green' : 'red'}>{val ? 'Active' : 'Disabled'}</Tag> },
                  {
                    title: 'Action',
                    render: (_, r) => (
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingTaxItem(r);
                          taxForm.setFieldsValue(r);
                          setTaxModalVisible(true);
                        }}
                      >
                        Edit
                      </Button>
                    )
                  }
                ]}
              />
            )}
          </TabPane>

          {/* ── TAB 3: Statistics Explorer & Direct Record Editor ── */}
          <TabPane
            tab={<span><AppstoreOutlined /> Statistics Matrix</span>}
            key="statistics"
          >
            {/* 5 Column Filters Bar */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1E293B' }}>
                    Column Filters (6 Dimensions)
                  </span>
                  {activeFilterCount > 0 && (
                    <Tag color="cyan" style={{ borderRadius: 10, fontWeight: 700 }}>
                      {activeFilterCount} Active {activeFilterCount === 1 ? 'Filter' : 'Filters'}
                    </Tag>
                  )}
                </div>

                <Space>
                  <Button
                    size="small"
                    onClick={handleResetFilters}
                    disabled={activeFilterCount === 0}
                    style={{ borderRadius: 6 }}
                  >
                    Reset All Filters
                  </Button>
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => loadStatistics(statsPagination.page, statsSearch, statsFilters)}
                    title="Reload Current View"
                  />
                </Space>
              </div>

              {/* 6 Dropdown Filters Grid */}
              <Row gutter={[12, 12]}>
                {/* 1. Region Filter */}
                <Col xs={24} sm={12} md={8} lg={4}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    1. Region
                  </div>
                  <Select
                    placeholder="All Regions"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label || option?.children || '').toString().toLowerCase().includes(input.toLowerCase().trim())}
                    value={statsFilters.region_id}
                    onChange={(val) => handleFilterChange('region_id', val)}
                    style={{ width: '100%' }}
                  >
                    {taxonomies?.regions?.map(r => (
                      <Option key={r.id} value={r.id} label={`${r.name} (${r.code})`}>
                        {r.name} ({r.code})
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 2. Country Filter */}
                <Col xs={24} sm={12} md={8} lg={4}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    2. Country
                  </div>
                  <Select
                    placeholder="All Countries"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label || option?.children || '').toString().toLowerCase().includes(input.toLowerCase().trim())}
                    value={statsFilters.country_id}
                    onChange={(val) => handleFilterChange('country_id', val)}
                    style={{ width: '100%' }}
                  >
                    {taxonomies?.countries?.map(c => (
                      <Option key={c.id} value={c.id} label={`${c.name} (${c.iso_code})`}>
                        {c.name} ({c.iso_code})
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 3. Industry Sector Filter */}
                <Col xs={24} sm={12} md={8} lg={4}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    3. Industry
                  </div>
                  <Select
                    placeholder="All Industries"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label || option?.children || '').toString().toLowerCase().includes(input.toLowerCase().trim())}
                    value={statsFilters.industry_id}
                    onChange={(val) => handleFilterChange('industry_id', val)}
                    style={{ width: '100%' }}
                  >
                    {taxonomies?.industries?.map(ind => (
                      <Option key={ind.id} value={ind.id} label={ind.name}>
                        {ind.name}
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 4. Company Size Filter */}
                <Col xs={24} sm={12} md={8} lg={4}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    4. Company Size
                  </div>
                  <Select
                    placeholder="All Company Sizes"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label || option?.children || '').toString().toLowerCase().includes(input.toLowerCase().trim())}
                    value={statsFilters.employee_size_id}
                    onChange={(val) => handleFilterChange('employee_size_id', val)}
                    style={{ width: '100%' }}
                  >
                    {taxonomies?.employee_sizes?.map(sz => (
                      <Option key={sz.id} value={sz.id} label={sz.name}>
                        {sz.name}
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 5. Department Filter */}
                <Col xs={24} sm={12} md={8} lg={4}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    5. Department
                  </div>
                  <Select
                    placeholder="All Departments"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label || option?.children || '').toString().toLowerCase().includes(input.toLowerCase().trim())}
                    value={statsFilters.department_id}
                    onChange={(val) => handleFilterChange('department_id', val)}
                    style={{ width: '100%' }}
                  >
                    {taxonomies?.departments?.map(dept => (
                      <Option key={dept.id} value={dept.id} label={dept.name}>
                        {dept.name}
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 6. Seniority / Job Level Filter */}
                <Col xs={24} sm={12} md={8} lg={4}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                    6. Seniority Level
                  </div>
                  <Select
                    placeholder="All Seniority Levels"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label || option?.children || '').toString().toLowerCase().includes(input.toLowerCase().trim())}
                    value={statsFilters.job_level_id}
                    onChange={(val) => handleFilterChange('job_level_id', val)}
                    style={{ width: '100%' }}
                  >
                    {taxonomies?.job_levels?.map(lvl => (
                      <Option key={lvl.id} value={lvl.id} label={lvl.name}>
                        {lvl.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              {/* Text Search + Quick Stats */}
              <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input
                  placeholder="Quick search by text (Region, Country, Industry, Size, Dept, Seniority)..."
                  prefix={<SearchOutlined />}
                  value={statsSearch}
                  onChange={e => setStatsSearch(e.target.value)}
                  onPressEnter={() => loadStatistics(1, statsSearch, statsFilters)}
                  style={{ maxWidth: 450, borderRadius: 8 }}
                  allowClear
                />
                <Button
                  type="primary"
                  onClick={() => loadStatistics(1, statsSearch, statsFilters)}
                  style={{ background: '#0AAEEF', borderColor: '#0AAEEF', borderRadius: 8 }}
                >
                  Search Records
                </Button>
                <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
                  Showing {statsRows.length} of {statsPagination.total.toLocaleString()} demographic combinations
                </div>
              </div>
            </div>

            <Table
              dataSource={statsRows}
              rowKey="id"
              loading={loading}
              pagination={{
                current: statsPagination.page,
                pageSize: statsPagination.limit,
                total: statsPagination.total,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total.toLocaleString()} records`,
                onChange: (page) => loadStatistics(page, statsSearch, statsFilters)
              }}
              size="middle"
              columns={[
                { title: 'ID', dataIndex: 'id', width: 70, render: val => <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>#{val}</span> },
                {
                  title: 'Region',
                  dataIndex: 'region_name',
                  key: 'region',
                  width: 130,
                  render: (val, r) => (
                    <Tag color="purple" style={{ fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>
                      {val || r.region_code || 'GLOBAL'}
                    </Tag>
                  )
                },
                {
                  title: 'Country',
                  dataIndex: 'country_name',
                  key: 'country',
                  render: (val, r) => (
                    <div>
                      <strong style={{ color: '#0F172A' }}>{val}</strong>
                      <Tag color="blue" style={{ marginLeft: 6, fontSize: '0.6875rem' }}>{r.country_iso}</Tag>
                    </div>
                  )
                },
                {
                  title: 'Industry',
                  dataIndex: 'industry_name',
                  render: val => <span style={{ fontWeight: 600, color: '#334155' }}>{val}</span>
                },
                {
                  title: 'Company Size',
                  dataIndex: 'size_name',
                  render: val => (
                    <Tag color="geekblue" style={{ fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
                      {val}
                    </Tag>
                  )
                },
                {
                  title: 'Department',
                  dataIndex: 'department_name',
                  render: val => (
                    <Tag color="cyan" style={{ fontWeight: 600, borderRadius: 6 }}>
                      {val}
                    </Tag>
                  )
                },
                {
                  title: 'Seniority',
                  dataIndex: 'level_name',
                  render: val => (
                    <Tag color="purple" style={{ fontWeight: 600, borderRadius: 6 }}>
                      {val}
                    </Tag>
                  )
                },
                {
                  title: 'Contacts Count',
                  dataIndex: 'contact_count',
                  render: val => <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.9375rem' }}>{(val || 0).toLocaleString()}</span>
                },
                {
                  title: 'Companies',
                  dataIndex: 'company_count',
                  render: val => <span style={{ color: '#64748B', fontWeight: 600 }}>{(val || 0).toLocaleString()}</span>
                },
                {
                  title: 'Action',
                  render: (_, r) => (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingStat(r);
                        statEditForm.setFieldsValue(r);
                        setEditStatModalVisible(true);
                      }}
                    >
                      Edit
                    </Button>
                  )
                }
              ]}
            />
          </TabPane>

          {/* ── TAB 4: CSV Data Import Engine ── */}
          <TabPane
            tab={<span><UploadOutlined /> Batch Data Import</span>}
            key="import"
          >
            <div style={{ maxWidth: 900 }}>
              <Alert
                type="info"
                showIcon
                message="Safe Batch Demographic Upload"
                description="Upload CSV with columns: country, region, industry, employee_size, department, job_level, contact_count. The system will perform a dry-run validation before publishing."
                style={{ marginBottom: 18 }}
              />

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <Button onClick={loadSampleCSV}>
                  Load Sample Template
                </Button>
              </div>

              <TextArea
                rows={8}
                value={importCsvText}
                onChange={e => setImportCsvText(e.target.value)}
                placeholder="Paste CSV rows here (including header)..."
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', marginBottom: 16 }}
              />

              <Space>
                <Button
                  type="primary"
                  onClick={() => handleParseAndValidateCSV(true)}
                  loading={isImporting}
                  style={{ background: '#0AAEEF', borderColor: '#0AAEEF' }}
                >
                  Dry-Run Validate CSV
                </Button>

                {importDryRunResult && importDryRunResult.valid_rows_count > 0 && (
                  <Button
                    type="primary"
                    danger
                    onClick={() => handleParseAndValidateCSV(false)}
                    loading={isImporting}
                  >
                    Confirm & Publish ({importDryRunResult.valid_rows_count} Records)
                  </Button>
                )}
              </Space>

              {/* Dry Run Preview Results */}
              {importDryRunResult && (
                <div style={{ marginTop: 24, padding: 18, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontWeight: 800 }}>Dry-Run Validation Report</h4>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="Total Rows Analyzed" value={importDryRunResult.total_rows} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Valid Rows" value={importDryRunResult.valid_rows_count} valueStyle={{ color: '#16A34A' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Errors" value={importDryRunResult.invalid_rows_count} valueStyle={{ color: '#DC2626' }} />
                    </Col>
                  </Row>

                  {importDryRunResult.validation_errors?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <Alert
                        type="error"
                        message="Validation Issues Found"
                        description={
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {importDryRunResult.validation_errors.map((err, idx) => (
                              <li key={idx}>Line {err.row_index}: {err.errors.join(', ')}</li>
                            ))}
                          </ul>
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabPane>

          {/* ── TAB 5: Audit Log ── */}
          <TabPane
            tab={<span><HistoryOutlined /> Audit Trail</span>}
            key="audit"
          >
            <Table
              dataSource={auditLogs}
              rowKey="id"
              pagination={{
                current: auditPagination.page,
                pageSize: auditPagination.limit,
                total: auditPagination.total,
                onChange: (page) => {
                  setAuditPagination(prev => ({ ...prev, page }));
                  audienceService.getAuditLogs({ page, limit: 20 }).then(res => setAuditLogs(res?.logs || []));
                }
              }}
              size="middle"
              columns={[
                { title: 'Date / Time', dataIndex: 'created_at', width: 170 },
                { title: 'User', dataIndex: 'user_name', render: val => <strong>{val || 'Admin'}</strong> },
                { title: 'Action', dataIndex: 'action', render: val => <Tag color="blue">{val}</Tag> },
                { title: 'Entity', dataIndex: 'entity' },
                { title: 'Entity ID', dataIndex: 'entity_id' },
                { title: 'New Value / Details', dataIndex: 'new_value', render: val => <code style={{ fontSize: '0.75rem' }}>{typeof val === 'object' ? JSON.stringify(val) : val}</code> }
              ]}
            />
          </TabPane>

        </Tabs>
      </Card>

      {/* Edit Taxonomy Modal */}
      <Modal
        open={taxModalVisible}
        onCancel={() => setTaxModalVisible(false)}
        onOk={() => taxForm.submit()}
        title={`${editingTaxItem ? 'Edit' : 'Create'} ${selectedTaxType}`}
      >
        <Form form={taxForm} layout="vertical" onFinish={handleSaveTaxonomy}>
          <Form.Item label="Display Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Code / Key" name={selectedTaxType === 'countries' ? 'iso_code' : 'code'} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {selectedTaxType === 'countries' && (
            <>
              <Form.Item label="Latitude" name="lat">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Longitude" name="lon">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          <Form.Item label="Active" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Single Statistic Count Modal */}
      <Modal
        open={editStatModalVisible}
        onCancel={() => setEditStatModalVisible(false)}
        onOk={() => statEditForm.submit()}
        title="Edit Demographic Cell Contacts"
      >
        <Form
          form={statEditForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await audienceService.updateStatistic(editingStat.id, values);
              message.success('Demographic cell updated!');
              setEditStatModalVisible(false);
              loadStatistics(statsPagination.page, statsSearch);
            } catch (err) {
              message.error(err.message || 'Failed to update record');
            }
          }}
        >
          <Form.Item label="Matching Contacts" name="contact_count" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Target Companies" name="company_count">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
