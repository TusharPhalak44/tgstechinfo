import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Input, Tag, Spin, Empty, Typography, Button } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { resolveContentRoute } from '../../lib/contentRoute';
import { useTheme } from '../../context/ThemeContext';

const getArticleRoute = (item) => {
  return resolveContentRoute(item).url;
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
};

const SUGGESTED_SEARCHES = [
  'Article - Technology',
  'Blog - ITech',
  'Whitepapers',
  'Case Studies',
  'Cloud Computing',
  'Artificial Intelligence',
  'Neha Jain',
  'Admin User'
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const { darkMode } = useTheme();

  useEffect(() => {
    setQuery(q);
    setSelectedTypeFilter('all');
    setSelectedCategoryFilter('all');
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    axios.get('/api/public/search', { params: { q: q.trim(), limit: 50 } })
      .then(({ data }) => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (val) => {
    const term = (val !== undefined ? val : query).trim();
    if (term.length >= 2) {
      setSearchParams({ q: term });
    }
  };

  // Derive unique content types and categories from results for filter chips
  const availableTypes = useMemo(() => {
    const counts = {};
    results.forEach(item => {
      const name = item.content_type_name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [results]);

  const availableCategories = useMemo(() => {
    const counts = {};
    results.forEach(item => {
      const name = item.category_name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      if (selectedTypeFilter !== 'all' && item.content_type_name !== selectedTypeFilter) {
        return false;
      }
      if (selectedCategoryFilter !== 'all' && item.category_name !== selectedCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [results, selectedTypeFilter, selectedCategoryFilter]);

  return (
    <div style={{
      maxWidth: 860,
      margin: '0 auto',
      padding: '36px 16px 64px',
      color: darkMode ? '#F1F5F9' : '#0F172A'
    }}>
      {/* Search Header & Input */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 800,
          color: darkMode ? '#F8FAFC' : '#0B1F4D',
          marginBottom: 10
        }}>
          Search Publications & Insights
        </h1>
        <p style={{
          fontSize: 14,
          color: darkMode ? '#94A3B8' : '#64748B',
          maxWidth: 600,
          margin: '0 auto 24px'
        }}>
          Search across titles, authors, categories, and content types (e.g. <em>Article - Technology</em>, <em>Neha Jain</em>, <em>Cloud Computing</em>)
        </p>

        <Input
          size="large"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onPressEnter={() => handleSearch(query)}
          placeholder="Search by title, author, category, or content type..."
          prefix={<SearchOutlined style={{ color: darkMode ? '#94A3B8' : '#64748B', fontSize: 18, marginRight: 6 }} />}
          suffix={
            <Button
              type="primary"
              onClick={() => handleSearch(query)}
              style={{
                borderRadius: 18,
                background: '#F7941D',
                borderColor: '#F7941D',
                fontWeight: 600,
                fontSize: 13,
                height: 34
              }}
            >
              Search
            </Button>
          }
          style={{
            borderRadius: 30,
            padding: '6px 10px 6px 18px',
            background: darkMode ? '#1E293B' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#CBD5E1',
            color: darkMode ? '#F1F5F9' : '#0F172A',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}
          allowClear
        />
      </div>

      {/* Suggested Quick Searches */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 28,
        fontSize: 12.5,
        color: darkMode ? '#94A3B8' : '#64748B'
      }}>
        <span style={{ fontWeight: 600 }}>Try searching:</span>
        {SUGGESTED_SEARCHES.map(term => (
          <span
            key={term}
            onClick={() => {
              setQuery(term);
              handleSearch(term);
            }}
            style={{
              cursor: 'pointer',
              background: darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              color: darkMode ? '#60A5FA' : '#0B1F4D',
              border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
              padding: '2px 9px',
              borderRadius: 12,
              fontSize: 11.5,
              transition: 'all .15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.color = '#3B82F6';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = darkMode ? '#334155' : '#E2E8F0';
              e.currentTarget.style.color = darkMode ? '#60A5FA' : '#0B1F4D';
            }}
          >
            {term}
          </span>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 14, color: darkMode ? '#94A3B8' : '#64748B', fontSize: 13 }}>
            Searching publications...
          </div>
        </div>
      ) : q.trim().length < 2 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: darkMode ? '#1E293B' : '#F8FAFC',
          borderRadius: 16,
          border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
        }}>
          <SearchOutlined style={{ fontSize: 36, color: '#94A3B8', marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: 6 }}>
            Type at least 2 characters to search
          </h3>
          <p style={{ fontSize: 13, color: darkMode ? '#94A3B8' : '#64748B', maxWidth: 460, margin: '0 auto' }}>
            You can search by content title, author name, category name, content type, or combined terms like "Article - Technology".
          </p>
        </div>
      ) : results.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: darkMode ? '#1E293B' : '#F8FAFC',
          borderRadius: 16,
          border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
        }}>
          <Empty
            description={
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: 6 }}>
                  No results found for "<strong>{q}</strong>"
                </div>
                <div style={{ fontSize: 13, color: darkMode ? '#94A3B8' : '#64748B', maxWidth: 440, margin: '0 auto 16px' }}>
                  Try checking your spelling or search using another keyword, author name, or category.
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Result summary and filter pills */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 14, color: darkMode ? '#CBD5E1' : '#475569' }}>
                Showing <strong>{filteredResults.length}</strong> {filteredResults.length === 1 ? 'result' : 'results'} for "<strong>{q}</strong>"
              </span>
              {(selectedTypeFilter !== 'all' || selectedCategoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSelectedTypeFilter('all'); setSelectedCategoryFilter('all'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#F7941D',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Content Type Filter Pills */}
            {availableTypes.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B' }}>Type:</span>
                <span
                  onClick={() => setSelectedTypeFilter('all')}
                  style={{
                    cursor: 'pointer',
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: 11.5,
                    fontWeight: selectedTypeFilter === 'all' ? 700 : 500,
                    background: selectedTypeFilter === 'all'
                      ? '#0B1F4D'
                      : (darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                    color: selectedTypeFilter === 'all' ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#475569'),
                    border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                  }}
                >
                  All ({results.length})
                </span>
                {availableTypes.map(t => (
                  <span
                    key={t.name}
                    onClick={() => setSelectedTypeFilter(t.name === selectedTypeFilter ? 'all' : t.name)}
                    style={{
                      cursor: 'pointer',
                      padding: '3px 10px',
                      borderRadius: 14,
                      fontSize: 11.5,
                      fontWeight: selectedTypeFilter === t.name ? 700 : 500,
                      background: selectedTypeFilter === t.name
                        ? '#3B82F6'
                        : (darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                      color: selectedTypeFilter === t.name ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#475569'),
                      border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                    }}
                  >
                    {t.name} ({t.count})
                  </span>
                ))}
              </div>
            )}

            {/* Category Filter Pills */}
            {availableCategories.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#94A3B8' : '#64748B' }}>Category:</span>
                <span
                  onClick={() => setSelectedCategoryFilter('all')}
                  style={{
                    cursor: 'pointer',
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: 11.5,
                    fontWeight: selectedCategoryFilter === 'all' ? 700 : 500,
                    background: selectedCategoryFilter === 'all'
                      ? '#0B1F4D'
                      : (darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                    color: selectedCategoryFilter === 'all' ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#475569'),
                    border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                  }}
                >
                  All
                </span>
                {availableCategories.map(c => (
                  <span
                    key={c.name}
                    onClick={() => setSelectedCategoryFilter(c.name === selectedCategoryFilter ? 'all' : c.name)}
                    style={{
                      cursor: 'pointer',
                      padding: '3px 10px',
                      borderRadius: 14,
                      fontSize: 11.5,
                      fontWeight: selectedCategoryFilter === c.name ? 700 : 500,
                      background: selectedCategoryFilter === c.name
                        ? '#F7941D'
                        : (darkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                      color: selectedCategoryFilter === c.name ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#475569'),
                      border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                    }}
                  >
                    {c.name} ({c.count})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Result Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredResults.map(item => {
              const formattedDate = formatDate(item.published_date);
              return (
                <Link
                  key={item.id}
                  to={getArticleRoute(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      background: darkMode ? '#1E293B' : '#FFFFFF',
                      borderRadius: 14,
                      padding: '18px 20px',
                      border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                      display: 'flex',
                      gap: 18,
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = darkMode
                        ? '0 6px 20px rgba(0,0,0,0.5)'
                        : '0 6px 20px rgba(11,31,77,0.1)';
                      e.currentTarget.style.borderColor = darkMode ? '#475569' : '#CBD5E1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = darkMode
                        ? '0 2px 8px rgba(0,0,0,0.3)'
                        : '0 2px 8px rgba(0,0,0,0.03)';
                      e.currentTarget.style.borderColor = darkMode ? '#334155' : '#E2E8F0';
                    }}
                  >
                    {item.banner_image ? (
                      <img
                        src={`/uploads/${item.banner_image}`}
                        alt=""
                        style={{
                          width: 110,
                          height: 78,
                          objectFit: 'cover',
                          borderRadius: 8,
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 110,
                        height: 78,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: darkMode ? '#0F172A' : '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3B82F6',
                        fontSize: 24
                      }}>
                        <FileTextOutlined />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Meta badges: Content Type & Category */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        {item.content_type_name && (
                          <Tag
                            color="geekblue"
                            style={{
                              fontSize: 11,
                              lineHeight: '18px',
                              padding: '0 7px',
                              margin: 0,
                              fontWeight: 600,
                              borderRadius: 4
                            }}
                          >
                            {item.content_type_name}
                          </Tag>
                        )}
                        {item.category_name && (
                          <Tag
                            color="blue"
                            style={{
                              fontSize: 11,
                              lineHeight: '18px',
                              padding: '0 7px',
                              margin: 0,
                              fontWeight: 600,
                              borderRadius: 4
                            }}
                          >
                            {item.category_name}
                          </Tag>
                        )}
                        {formattedDate && (
                          <span style={{ fontSize: 11.5, color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CalendarOutlined style={{ fontSize: 11 }} /> {formattedDate}
                          </span>
                        )}
                        {item.reading_time && (
                          <span style={{ fontSize: 11.5, color: darkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockCircleOutlined style={{ fontSize: 11 }} /> {item.reading_time} min read
                          </span>
                        )}
                      </div>

                      {/* Content Title */}
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: darkMode ? '#F1F5F9' : '#0F172A',
                        lineHeight: 1.35,
                        marginBottom: 6
                      }}>
                        {item.title}
                      </div>

                      {/* Author Info */}
                      {item.author_name && (
                        <div style={{
                          fontSize: 12.5,
                          color: darkMode ? '#94A3B8' : '#475569',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <UserOutlined style={{ color: '#F7941D' }} />
                          <span>By <strong style={{ color: darkMode ? '#E2E8F0' : '#1E293B' }}>{item.author_name}</strong></span>
                        </div>
                      )}

                      {/* Short Description */}
                      {item.short_description && (
                        <div style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: darkMode ? '#94A3B8' : '#64748B',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {item.short_description}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;
