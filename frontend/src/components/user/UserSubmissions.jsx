import React, { useState, useEffect } from 'react';
import { Table, Button, Input, message, Tag, Badge, Row, Col } from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  FileTextOutlined, SendOutlined,
  TableOutlined, ArrowLeftOutlined, DatabaseOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';

// Helper for exporting data table to Excel CSV with UTF-8 BOM
const exportToExcel = (columns, rows, fileNamePrefix = 'my_form_submissions') => {
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

const UserSubmissions = () => {
  const { darkMode } = useTheme();
  const D = darkMode;

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [searchTable, setSearchTable] = useState('');

  // Selected Table Detail view state
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState({ columns: [], rows: [], total: 0, content: null });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    fetchUserTables();
  }, []);

  const fetchUserTables = async () => {
    setLoadingTables(true);
    try {
      const res = await axios.get('/api/user/submission-tables');
      if (res.data?.success) {
        setTables(res.data.tables || []);
      } else {
        message.error('Failed to load your submission tables');
      }
    } catch (err) {
      console.error('Error fetching user submission tables:', err);
      message.error('Failed to load form submission tables');
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
      const res = await axios.get(`/api/user/submission-tables/${tableItem.content_id}`);
      if (res.data?.success) {
        setTableDetails({
          columns: res.data.columns || [],
          rows: res.data.rows || [],
          total: res.data.total || 0,
          content: res.data.content || null
        });
      } else {
        message.error(res.data?.message || 'Failed to load table details');
      }
    } catch (err) {
      console.error('Error opening user table details:', err);
      const msg = err.response?.data?.message || 'Access denied or error loading table details';
      message.error(msg);
    } finally {
      setLoadingDetails(false);
    }
  };

  const backToTableList = () => {
    setSelectedTable(null);
    setTableDetails({ columns: [], rows: [], total: 0, content: null });
  };

  // Filter user's table list
  const safeTables = Array.isArray(tables) ? tables : [];
  const filteredTables = safeTables.filter(t => {
    if (!searchTable) return true;
    const q = searchTable.toLowerCase();
    return (
      (t.content_title && t.content_title.toLowerCase().includes(q)) ||
      (t.table_name && t.table_name.toLowerCase().includes(q)) ||
      (t.builder_type && t.builder_type.toLowerCase().includes(q))
    );
  });

  // Filter rows inside active table view
  const safeDetailRows = Array.isArray(tableDetails?.rows) ? tableDetails.rows : [];
  const filteredDetailRows = safeDetailRows.filter(row => {
    if (!detailSearch) return true;
    const q = detailSearch.toLowerCase();
    return Object.values(row).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    );
  });

  const totalUserTables = safeTables.length;
  const totalUserSubmissions = tables.reduce((acc, t) => acc + (t.total_records || 0), 0);

  // List view columns
  const listColumns = [
    {
      title: 'Database Table',
      key: 'table_name',
      width: 220,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: D ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
            color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0
          }}>
            <DatabaseOutlined />
          </div>
          <div>
            <span style={{
              fontFamily: 'monospace', fontWeight: 600, fontSize: 13,
              color: D ? '#60A5FA' : '#2563EB',
              background: D ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
              padding: '2px 6px', borderRadius: 4
            }}>
              {r.table_name}
            </span>
            <div style={{ fontSize: 11, color: D ? '#64748B' : '#94A3B8', marginTop: 2 }}>ID #{r.content_id}</div>
          </div>
        </div>
      )
    },
    {
      title: 'My Created Content Page',
      dataIndex: 'content_title',
      key: 'content_title',
      width: 260,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: D ? '#F8FAFC' : '#0B1F4D' }}>
            <FileTextOutlined style={{ color: '#F7941D', marginRight: 6 }} />
            {v}
          </div>
          <div style={{ fontSize: 11, color: D ? '#64748B' : '#94A3B8', marginTop: 2 }}>
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
      title: 'Submissions',
      dataIndex: 'total_records',
      key: 'total_records',
      width: 130,
      align: 'center',
      render: (count) => (
        <Badge
          count={count}
          overflowCount={99999}
          style={{ backgroundColor: count > 0 ? '#10B981' : '#64748B', color: '#fff', fontWeight: 700 }}
        />
      )
    },
    {
      title: 'Last Received',
      dataIndex: 'last_submission',
      key: 'last_submission',
      width: 160,
      render: (v) => v ? (
        <div style={{ fontSize: 12, color: D ? '#CBD5E1' : '#475569' }}>
          <div>{moment(v).format('MMM D, YYYY')}</div>
          <div style={{ fontSize: 11, color: D ? '#64748B' : '#94A3B8' }}>{moment(v).format('h:mm A')}</div>
        </div>
      ) : <span style={{ color: D ? '#475569' : '#CBD5E1', fontSize: 12 }}>No submissions</span>
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
          style={{ borderRadius: 6, background: '#2563EB', fontWeight: 600 }}
        >
          View Data
        </Button>
      )
    }
  ];

  // Dynamic columns for selected table
  const detailTableColumns = tableDetails.columns.map(col => {
    return {
      title: col.label,
      dataIndex: col.field,
      key: col.field,
      width: col.field === 'id' ? 70 : col.field.includes('created') ? 160 : 180,
      render: (val) => {
        if (val === null || val === undefined) return <span style={{ color: D ? '#475569' : '#CBD5E1' }}>—</span>;
        
        if (col.field === 'id') {
          return <span style={{ fontWeight: 700, color: '#2563EB' }}>#{val}</span>;
        }

        if (col.field === 'created_at' || col.field === 'updated_at') {
          return (
            <span style={{ fontSize: 12, color: D ? '#CBD5E1' : '#475569' }}>
              {moment(val).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          );
        }

        return <span style={{ fontSize: 13, color: D ? '#F8FAFC' : '#1E293B' }}>{String(val)}</span>;
      }
    };
  });

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* VIEW 1: USER'S SUBMISSION TABLES */}
      {!selectedTable ? (
        <>
          {/* Header Bar */}
          <div
            style={{
              borderRadius: 16,
              padding: '18px 24px',
              marginBottom: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              background: D
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 31, 77, 0.5) 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 31, 77, 0.08)'}`,
              boxShadow: D ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(11, 31, 77, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #0B1F4D 0%, #1D3D8F 100%)',
                border: '1px solid rgba(247, 148, 29, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#F7941D', fontSize: 20, flexShrink: 0,
              }}>
                <SendOutlined />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.24rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D' }}>
                  My Form Submission Tables
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: D ? '#94A3B8' : '#64748B' }}>
                  Dynamic submission tables generated by forms on your created content pages.
                </p>
              </div>
            </div>

            <Button
              icon={<ReloadOutlined spin={loadingTables} />}
              onClick={fetchUserTables}
              style={{
                background: D ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
                color: D ? '#94A3B8' : '#475569',
                borderRadius: 10, fontWeight: 600
              }}
            >
              Refresh Tables
            </Button>
          </div>

          {/* KPI Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 22 }}>
            <Col xs={12} sm={12}>
              <div style={{
                borderRadius: 14, padding: '16px 20px', border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
                background: D ? '#0F172A' : '#FFFFFF', backdropFilter: 'blur(12px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                    My Form Tables
                  </span>
                  <DatabaseOutlined style={{ color: '#2563EB', fontSize: 18 }} />
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
                  {totalUserTables}
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12}>
              <div style={{
                borderRadius: 14, padding: '16px 20px', border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
                background: D ? '#0F172A' : '#FFFFFF', backdropFilter: 'blur(12px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: D ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                    Total Inbound Submissions
                  </span>
                  <SendOutlined style={{ color: '#10B981', fontSize: 18 }} />
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', marginTop: 8 }}>
                  {totalUserSubmissions}
                </div>
              </div>
            </Col>
          </Row>

          {/* Filter Bar */}
          <div style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 12, padding: '12px 16px',
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
            marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <Input
              placeholder="Search table name or page title..."
              prefix={<SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8' }} />}
              value={searchTable}
              onChange={e => setSearchTable(e.target.value)}
              allowClear
              style={{ width: 300, borderRadius: 8 }}
            />
            <div style={{ fontSize: '0.8rem', color: D ? '#94A3B8' : '#64748B' }}>
              Showing <strong style={{ color: D ? '#F8FAFC' : '#0B1F4D' }}>{filteredTables.length}</strong> of <strong style={{ color: D ? '#F8FAFC' : '#0B1F4D' }}>{totalUserTables}</strong> tables
            </div>
          </div>

          {/* Table Listing */}
          <div style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 14,
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            overflow: 'hidden'
          }}>
            <Table
              dataSource={filteredTables}
              columns={listColumns}
              rowKey="table_name"
              loading={loadingTables}
              scroll={{ x: 900 }}
              pagination={{
                pageSize: 10,
                showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} tables`,
                style: { padding: '12px 20px', margin: 0 }
              }}
              size="middle"
            />
          </div>
        </>
      ) : (

        /* VIEW 2: USER TABLE DETAIL VIEW */
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={backToTableList}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Back to My Tables
            </Button>
          </div>

          {/* Table Header Details */}
          <div style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 14, padding: '20px 24px',
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: D ? '#F8FAFC' : '#0B1F4D', margin: 0 }}>
                  {selectedTable.content_title}
                </h1>
                <Tag color="purple" style={{ borderRadius: 4 }}>
                  {selectedTable.builder_type}
                </Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: D ? '#94A3B8' : '#64748B' }}>
                <span>Database Table: <code style={{ color: '#2563EB', fontWeight: 600, background: D ? 'rgba(37,99,235,0.15)' : '#EFF6FF', padding: '2px 6px', borderRadius: 4 }}>{selectedTable.table_name}</code></span>
                <span>•</span>
                <span>Content ID: #{selectedTable.content_id}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => openTableDetails(selectedTable)}
                loading={loadingDetails}
                style={{ borderRadius: 8 }}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => exportToExcel(tableDetails.columns, filteredDetailRows, selectedTable.table_name)}
                disabled={filteredDetailRows.length === 0}
                style={{ borderRadius: 8, background: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
              >
                Export to Excel
              </Button>
            </div>
          </div>

          {/* Record Filter */}
          <div style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 12, padding: '12px 16px',
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
            marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
          }}>
            <Input
              placeholder="Search in submission records..."
              prefix={<SearchOutlined style={{ color: D ? '#64748B' : '#94A3B8' }} />}
              value={detailSearch}
              onChange={e => { setDetailSearch(e.target.value); setDetailPage(1); }}
              allowClear
              style={{ width: 300, borderRadius: 8 }}
            />
            <div style={{ fontSize: '0.8rem', color: D ? '#94A3B8' : '#64748B' }}>
              Showing <strong style={{ color: D ? '#F8FAFC' : '#0B1F4D' }}>{filteredDetailRows.length}</strong> of <strong style={{ color: D ? '#F8FAFC' : '#0B1F4D' }}>{tableDetails.total}</strong> records
            </div>
          </div>

          {/* Dynamic Records Table */}
          <div style={{
            background: D ? '#0F172A' : '#FFFFFF',
            borderRadius: 14,
            border: `1px solid ${D ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
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
                pageSize: 15,
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

export default UserSubmissions;
