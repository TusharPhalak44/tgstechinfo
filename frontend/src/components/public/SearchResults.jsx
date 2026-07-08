import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Input, Tag, Spin, Empty, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    axios.get('/api/public/search', { params: { q: q.trim() } })
      .then(({ data }) => {
        if (data.length === 1) {
          navigate(`/article/${data[0].slug}`, { replace: true });
        } else {
          setResults(data);
        }
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (val) => {
    if (val.trim().length >= 2) setSearchParams({ q: val.trim() });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      <Input
        size="large"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onPressEnter={() => handleSearch(query)}
        placeholder="Search articles, categories..."
        prefix={<SearchOutlined style={{ color: '#aaa' }} />}
        style={{ borderRadius: 24, marginBottom: 28 }}
        allowClear
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : q.trim().length < 2 ? (
        <Empty description="Type at least 2 characters to search" />
      ) : results.length === 0 ? (
        <Empty description={`No results found for "${q}"`} />
      ) : (
        <>
          <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "<strong>{q}</strong>"
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {results.map(item => (
              <Link
                key={item.id}
                to={`/article/${item.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff', borderRadius: 10, padding: '16px 20px',
                  border: '1px solid #e8e8e8', display: 'flex', gap: 16, alignItems: 'flex-start',
                  transition: 'box-shadow 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {item.banner_image && (
                    <img
                      src={`/uploads/${item.banner_image}`}
                      alt=""
                      style={{ width: 90, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      {item.category_name && <Tag color="blue" style={{ fontSize: 11 }}>{item.category_name}</Tag>}
                      {item.content_type_name && <Tag color="geekblue" style={{ fontSize: 11 }}>{item.content_type_name}</Tag>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{item.title}</div>
                    {item.short_description && (
                      <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.short_description}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;
