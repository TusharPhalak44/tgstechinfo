import React, { useState, useEffect } from 'react';
import { Table, Button, Input, message, Tag, Badge } from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  FileTextOutlined, UserOutlined,
  TableOutlined, ArrowLeftOutlined, DatabaseOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

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
  link.setAttribute('download', `${fileNamePrefix}_${moment().format('YYYYMMDD_HHmmss')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success(`Exported ${rows.length} records to Excel successfully!`);
};

const AdminSubmissions = () => {
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [searchTable, setSearchTable] = useState('');
  
  // Table details view state
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState({ columns: [], rows: [], total: 0, content: null });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    fetchTables();
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
      title: 'Form Builder',
      dataIndex: 'builder_type',
      key: 'builder_type',
      width: 150,
      render: (v) => {
        let color = 'blue';
        let label = 'Standard Form';
        if (v === 'drag_drop') { color = 'purple'; label = 'Drag & Drop'; }
        else if (v === 'html') { color = 'orange'; label = 'HTML Builder'; }
        return <Tag color={color} style={{ borderRadius: 4, textTransform: 'capitalize' }}>{label}</Tag>;
      }
    },
    {
      title: 'Created By',
      key: 'author',
      width: 180,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{r.author_name}</div>
          {r.author_email && <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.author_email}</div>}
        </div>
      )
    },
    {
      title: 'Submissions',
      dataIndex: 'total_records',
      key: 'total_records',
      width: 120,
      align: 'center',
      render: (count) => (
        <Badge
          count={count}
          overflowCount={99999}
          style={{ backgroundColor: count > 0 ? '#10b981' : '#d1d5db', color: '#fff', fontWeight: 700 }}
        />
      )
    },
    {
      title: 'Last Submission',
      dataIndex: 'last_submission',
      key: 'last_submission',
      width: 160,
      render: (v) => v ? (
        <div style={{ fontSize: 12, color: '#475569' }}>
          <div>{moment(v).format('MMM D, YYYY')}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{moment(v).format('h:mm A')}</div>
        </div>
      ) : <span style={{ color: '#cbd5e1', fontSize: 12 }}>No submissions</span>
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<TableOutlined />}
          onClick={() => openTableDetails(r)}
          style={{ borderRadius: 6, background: '#4a7cff' }}
        >
          View Data
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
              {moment(val).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          );
        }

        return <span style={{ fontSize: 13, color: '#1e293b' }}>{String(val)}</span>;
      }
    };
  });

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* VIEW 1: TABLES LIST VIEW */}
      {!selectedTable ? (
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
      ) : (

        /* VIEW 2: TABLE DETAIL VIEW */
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
    </div>
  );
};

export default AdminSubmissions;
