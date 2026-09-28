import React, { useState, useEffect } from 'react';
import { Table, Button, Input, message, Tag, Badge, Segmented, Select } from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  FileTextOutlined, UserOutlined,
  TableOutlined, ArrowLeftOutlined, DatabaseOutlined,
  FileExcelOutlined, VideoCameraOutlined, UsergroupAddOutlined, CalendarOutlined, PhoneOutlined, BankOutlined, IdcardOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { formatDateForCSV, formatDateForDisplay, DATE_FORMATS, formatTimestampForFilename } from '../../utils/dateHelper';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    border: '1px solid #f0f0f0', flex: 1, minWidth: 160,
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: color + '15', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <span style={{ color, fontSize: 20 }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// Helper for exporting data table to Excel CSV with UTF-8 BOM
const exportToExcel = (columns, rows, fileNamePrefix = 'form_submissions') => {
  if (!rows || rows.length === 0) {
    message.warning('No records available to export');
    return;
  }

  const colKeys = columns && columns.length > 0
    ? columns.map(c => c.field || c.dataIndex || c)
    : Object.keys(rows[0]);

  const headerLabels = columns && columns.length > 0
    ? columns.map(c => c.label || c.title || c.field)
    : colKeys.map(k => k.replace(/_/g, ' ').toUpperCase());

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headerLabels.map(escapeCell).join(','),
    ...rows.map(row => colKeys.map(key => escapeCell(row[key])).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${formatTimestampForFilename()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success(`Exported ${rows.length} records to Excel successfully!`);
};

const AdminSubmissions = () => {
  const [activeTab, setActiveTab] = useState('forms'); // 'forms' | 'webinars'
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [searchTable, setSearchTable] = useState('');
  
  // Webinar Registrations state
  const [webinarRegistrations, setWebinarRegistrations] = useState([]);
  const [loadingWebinarRegs, setLoadingWebinarRegs] = useState(false);
  const [webinarSearch, setWebinarSearch] = useState('');
  const [webinarFilterId, setWebinarFilterId] = useState(null);

  // Table details view state
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState({ columns: [], rows: [], total: 0, content: null });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    fetchTables();
    fetchWebinarRegistrations();
  }, []);

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await axios.get('/api/admin/submission-tables');
      if (res.data?.success) {
        setTables(res.data.tables || []);
      } else {
        message.error('Failed to load submission tables');
      }
    } catch (err) {
      console.error('Error loading submission tables:', err);
      message.error('Failed to fetch submission tables from database');
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchWebinarRegistrations = async () => {
    setLoadingWebinarRegs(true);
    try {
      const res = await axios.get('/api/admin/webinar-registrations');
      if (res.data?.success) {
        setWebinarRegistrations(res.data.registrations || []);
      }
    } catch (err) {
      console.error('Error loading webinar registrations:', err);
    } finally {
      setLoadingWebinarRegs(false);
    }
  };

  const openTableDetails = async (tableItem) => {
    setSelectedTable(tableItem);
    setLoadingDetails(true);
    setDetailSearch('');
    setDetailPage(1);
    try {
      const res = await axios.get(`/api/admin/submission-tables/${tableItem.content_id}`);
      if (res.data?.success) {
        setTableDetails({
          columns: res.data.columns || [],
          rows: res.data.rows || [],
          total: res.data.total || 0,
          content: res.data.content || null
        });
      } else {
        message.error('Failed to fetch table details');
      }
    } catch (err) {
      console.error('Error fetching table details:', err);
      message.error('Could not load records for table ' + tableItem.table_name);
    } finally {
      setLoadingDetails(false);
    }
  };

  const backToTableList = () => {
    setSelectedTable(null);
    setTableDetails({ columns: [], rows: [], total: 0, content: null });
  };

  // Filter tables list
  const filteredTables = tables.filter(t => {
    if (!searchTable) return true;
    const q = searchTable.toLowerCase();
    return (
      (t.content_title && t.content_title.toLowerCase().includes(q)) ||
      (t.table_name && t.table_name.toLowerCase().includes(q)) ||
      (t.author_name && t.author_name.toLowerCase().includes(q)) ||
      (t.builder_type && t.builder_type.toLowerCase().includes(q))
    );
  });

  // Filter rows inside active table detail view
  const filteredDetailRows = tableDetails.rows.filter(row => {
    if (!detailSearch) return true;
    const q = detailSearch.toLowerCase();
    return Object.values(row).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    );
  });

  // Calculate high-level KPIs
  const totalTables = tables.length;
  const totalRecordsAcrossAll = tables.reduce((acc, t) => acc + (t.total_records || 0), 0);
  const uniqueAuthorsCount = new Set(tables.map(t => t.user_id).filter(Boolean)).size;

  // Render Table Columns for List View
  const listColumns = [
    {
      title: 'Database Table',
      key: 'table_name',
      width: 220,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#eef2ff', color: '#4f46e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0
          }}>
            <DatabaseOutlined />
          </div>
          <div>
            <span style={{
              fontFamily: 'monospace', fontWeight: 600, fontSize: 13,
              color: '#4f46e5', background: '#f5f3ff', padding: '2px 6px', borderRadius: 4
            }}>
              {r.table_name}
            </span>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>ID #{r.content_id}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Associated Page / Content',
      dataIndex: 'content_title',
      key: 'content_title',
      width: 250,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>
            <FileTextOutlined style={{ color: '#4a7cff', marginRight: 6 }} />
            {v}
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
            Slug: {r.content_slug || '—'}
          </div>
        </div>
      )
    },
    {
      title: 'Form Builder Type',
      dataIndex: 'builder_type',
      key: 'builder_type',
      width: 160,
      render: (v) => {
        let tagColor = 'blue';
        if (v === 'HTML Builder') tagColor = 'purple';
        if (v === 'Visual Drag-and-Drop Builder') tagColor = 'cyan';
        return <Tag color={tagColor}>{v}</Tag>;
      }
    },
    {
      title: 'Author',
      dataIndex: 'author_name',
      key: 'author_name',
      width: 160,
      render: (v) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          <UserOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
          {v}
        </span>
      )
    },
    {
      title: 'Total Submissions',
      dataIndex: 'total_records',
      key: 'total_records',
      width: 150,
      render: (v) => (
        <Badge
          count={v}
          showZero
          overflowCount={99999}
          style={{ background: v > 0 ? '#10b981' : '#94a3b8', fontSize: 12, fontWeight: 700 }}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          onClick={() => openTableDetails(r)}
          style={{ borderRadius: 6, background: '#4f46e5', borderColor: '#4f46e5', fontWeight: 600 }}
        >
          View Records
        </Button>
      )
    }
  ];

  // Dynamically generated Ant Design columns for Detail View
  const detailTableColumns = tableDetails.columns.map(col => {
    return {
      title: col.label,
      dataIndex: col.field,
      key: col.field,
      width: col.field === 'id' ? 70 : col.field.includes('created') ? 160 : 180,
      render: (val) => {
        if (val === null || val === undefined) return <span style={{ color: '#cbd5e1' }}>—</span>;
        
        if (col.field === 'id') {
          return <span style={{ fontWeight: 700, color: '#4f46e5' }}>#{val}</span>;
        }

        if (col.field === 'created_at' || col.field === 'updated_at') {
          return (
            <span style={{ fontSize: 12, color: '#475569' }}>
              {formatDateForCSV(val)}
            </span>
          );
        }

        return <span style={{ fontSize: 13, color: '#1e293b' }}>{String(val)}</span>;
      }
    };
  });

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Top Tab Switcher */}
      {!selectedTable && (
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Segmented
            size="large"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              {
                label: (
                  <div style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <DatabaseOutlined style={{ color: '#4f46e5' }} />
                    Form Submission Tables ({totalTables})
                  </div>
                ),
                value: 'forms'
              },
              {
                label: (
                  <div style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <VideoCameraOutlined style={{ color: '#ef4444' }} />
                    Webinar Registrations ({webinarRegistrations.length})
                  </div>
                ),
                value: 'webinars'
              }
            ]}
          />
        </div>
      )}

      {/* VIEW 1: TABLES LIST VIEW */}
      {!selectedTable && activeTab === 'forms' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DatabaseOutlined style={{ color: '#4f46e5' }} />
                Form Submissions Database Tables
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                All dynamic database tables (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>form_submissions_&#123;content_id&#125;</code>) generated by published forms
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button icon={<ReloadOutlined />} onClick={fetchTables} loading={loadingTables} style={{ borderRadius: 8 }}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard icon={<DatabaseOutlined />} label="Total Form Tables" value={totalTables} color="#4f46e5" />
            <StatCard icon={<TableOutlined />} label="Total Submitted Records" value={totalRecordsAcrossAll} color="#10b981" />
            <StatCard icon={<UserOutlined />} label="Content Authors" value={uniqueAuthorsCount} color="#3b82f6" />
          </div>

          {/* Search Filter Bar */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '16px 20px',
            border: '1px solid #e2e8f0', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <Input
              placeholder="Search table name, page title, author or form type..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchTable}
              onChange={e => setSearchTable(e.target.value)}
              allowClear
              style={{ width: 340, borderRadius: 8 }}
            />
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Showing <strong style={{ color: '#0f172a' }}>{filteredTables.length}</strong> of <strong style={{ color: '#0f172a' }}>{totalTables}</strong> tables
            </div>
          </div>

          {/* Tables Grid / List */}
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <Table
              dataSource={filteredTables}
              columns={listColumns}
              rowKey="table_name"
              loading={loadingTables}
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 15,
                showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} form tables`,
                style: { padding: '12px 20px', margin: 0 }
              }}
              size="middle"
            />
          </div>
        </>
      )}

      {/* VIEW 2: TABLE DETAIL VIEW */}
      {selectedTable && (
        <>
          {/* Top Bar with Back Button */}
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={backToTableList}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Back to Tables
            </Button>
          </div>

          {/* Table Details Header */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            border: '1px solid #e2e8f0', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {selectedTable.content_title}
                </h1>
                <Tag color="purple" style={{ borderRadius: 4 }}>
                  {selectedTable.builder_type}
                </Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#64748b' }}>
                <span>Database Table: <code style={{ color: '#4f46e5', fontWeight: 600, background: '#f5f3ff', padding: '2px 6px', borderRadius: 4 }}>{selectedTable.table_name}</code></span>
                <span>•</span>
                <span>Content ID: #{selectedTable.content_id}</span>
                <span>•</span>
                <span>Created by: {selectedTable.author_name}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => openTableDetails(selectedTable)}
                loading={loadingDetails}
                style={{ borderRadius: 8 }}
              >
                Refresh Data
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => exportToExcel(tableDetails.columns, filteredDetailRows, selectedTable.table_name)}
                disabled={filteredDetailRows.length === 0}
                style={{ borderRadius: 8, background: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
              >
                Export to Excel
              </Button>
            </div>
          </div>

          {/* Filter Bar for Detail View */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '14px 20px',
            border: '1px solid #e2e8f0', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
          }}>
            <Input
              placeholder="Search within submission records..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={detailSearch}
              onChange={e => { setDetailSearch(e.target.value); setDetailPage(1); }}
              allowClear
              style={{ width: 320, borderRadius: 8 }}
            />
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Showing <strong style={{ color: '#0f172a' }}>{filteredDetailRows.length}</strong> of <strong style={{ color: '#0f172a' }}>{tableDetails.total}</strong> records
            </div>
          </div>

          {/* Dynamic Records Table */}
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <Table
              dataSource={filteredDetailRows}
              columns={detailTableColumns}
              rowKey="id"
              loading={loadingDetails}
              scroll={{ x: 'max-content' }}
              pagination={{
                current: detailPage,
                pageSize: 20,
                total: filteredDetailRows.length,
                onChange: p => setDetailPage(p),
                showSizeChanger: false,
                showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} submissions`,
                style: { padding: '12px 20px', margin: 0 }
              }}
              size="middle"
            />
          </div>
        </>
      )}

      {/* VIEW 3: WEBINAR REGISTRATIONS TAB VIEW */}
      {!selectedTable && activeTab === 'webinars' && (() => {
        const filteredWebinarRegs = webinarRegistrations.filter(r => {
          if (webinarFilterId && r.webinar_id !== webinarFilterId) return false;
          if (!webinarSearch) return true;
          const q = webinarSearch.toLowerCase();
          return (
            (r.first_name && r.first_name.toLowerCase().includes(q)) ||
            (r.last_name && r.last_name.toLowerCase().includes(q)) ||
            (r.email && r.email.toLowerCase().includes(q)) ||
            (r.company_name && r.company_name.toLowerCase().includes(q)) ||
            (r.job_title && r.job_title.toLowerCase().includes(q)) ||
            (r.webinar_title && r.webinar_title.toLowerCase().includes(q))
          );
        });

        const uniqueWebinars = Array.from(new Set(webinarRegistrations.map(r => r.webinar_id))).map(id => {
          const match = webinarRegistrations.find(r => r.webinar_id === id);
          return { id, title: match?.webinar_title || `Webinar #${id}` };
        });

        const webinarColumns = [
          {
            title: 'Webinar Title',
            dataIndex: 'webinar_title',
            key: 'webinar_title',
            width: 240,
            render: (v, r) => (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{v || 'Untitled Webinar'}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {r.platform && <Tag color="blue" style={{ fontSize: 10 }}>{r.platform}</Tag>}
                  {r.webinar_date && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {formatDateForDisplay(r.webinar_date, DATE_FORMATS.DATE_TIME)}
                    </span>
                  )}
                </div>
              </div>
            )
          },
          {
            title: 'Attendee Name',
            key: 'name',
            width: 180,
            render: (_, r) => (
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                <UserOutlined style={{ marginRight: 6, color: '#3b82f6' }} />
                {r.first_name} {r.last_name}
              </div>
            )
          },
          {
            title: 'Work Email',
            dataIndex: 'email',
            key: 'email',
            width: 220,
            render: (v) => <a href={`mailto:${v}`} style={{ color: '#2563eb', fontWeight: 500 }}>{v}</a>
          },
          {
            title: 'Job Title',
            dataIndex: 'job_title',
            key: 'job_title',
            width: 160,
            render: (v) => v ? <span><IdcardOutlined style={{ color: '#8b5cf6', marginRight: 4 }} />{v}</span> : <span style={{ color: '#cbd5e1' }}>—</span>
          },
          {
            title: 'Company',
            dataIndex: 'company_name',
            key: 'company_name',
            width: 160,
            render: (v) => v ? <span><BankOutlined style={{ color: '#059669', marginRight: 4 }} />{v}</span> : <span style={{ color: '#cbd5e1' }}>—</span>
          },
          {
            title: 'Contact Phone',
            dataIndex: 'contact_number',
            key: 'contact_number',
            width: 150,
            render: (v) => v ? <span><PhoneOutlined style={{ color: '#d97706', marginRight: 4 }} />{v}</span> : <span style={{ color: '#cbd5e1' }}>—</span>
          },
          {
            title: 'Registered At',
            dataIndex: 'registered_at',
            key: 'registered_at',
            width: 160,
            render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{formatDateForDisplay(v, 'YYYY-MM-DD HH:mm')}</span>
          }
        ];

        return (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UsergroupAddOutlined style={{ color: '#ef4444' }} />
                  Live Webinar Registrations Database
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                  All attendee registrations recorded across live webinars in database table (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>webinar_registrations</code>)
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  icon={<FileExcelOutlined />}
                  type="primary"
                  onClick={() => exportToExcel([
                    { field: 'webinar_title', title: 'Webinar Title' },
                    { field: 'first_name', title: 'First Name' },
                    { field: 'last_name', title: 'Surname / Last Name' },
                    { field: 'email', title: 'Email' },
                    { field: 'job_title', title: 'Job Title' },
                    { field: 'company_name', title: 'Company Name' },
                    { field: 'contact_number', title: 'Contact Phone' },
                    { field: 'registered_at', title: 'Registered Date' }
                  ], filteredWebinarRegs, 'webinar_registrations')}
                  style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8 }}
                >
                  Export Registrations to Excel
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchWebinarRegistrations} loading={loadingWebinarRegs} style={{ borderRadius: 8 }}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard icon={<UsergroupAddOutlined />} label="Total Attendee Registrations" value={webinarRegistrations.length} color="#ef4444" />
              <StatCard icon={<VideoCameraOutlined />} label="Unique Webinars Registered" value={uniqueWebinars.length} color="#3b82f6" />
              <StatCard icon={<CalendarOutlined />} label="Registrations Today" value={webinarRegistrations.filter(r => moment(r.registered_at).isSame(moment(), 'day')).length} color="#10b981" />
            </div>

            {/* Search & Filter Bar */}
            <div style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              border: '1px solid #e2e8f0', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
                <Input
                  placeholder="Search registrant name, email, company, job title..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={webinarSearch}
                  onChange={e => setWebinarSearch(e.target.value)}
                  allowClear
                  style={{ width: 340, borderRadius: 8 }}
                />
                <Select
                  placeholder="Filter by Webinar"
                  allowClear
                  style={{ width: 260 }}
                  value={webinarFilterId}
                  onChange={setWebinarFilterId}
                >
                  {uniqueWebinars.map(w => (
                    <Select.Option key={w.id} value={w.id}>{w.title}</Select.Option>
                  ))}
                </Select>
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Showing <strong style={{ color: '#0f172a' }}>{filteredWebinarRegs.length}</strong> of <strong style={{ color: '#0f172a' }}>{webinarRegistrations.length}</strong> registrations
              </div>
            </div>

            {/* Registrations Table */}
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}>
              <Table
                dataSource={filteredWebinarRegs}
                columns={webinarColumns}
                rowKey="id"
                loading={loadingWebinarRegs}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                scroll={{ x: 1100 }}
              />
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default AdminSubmissions;
