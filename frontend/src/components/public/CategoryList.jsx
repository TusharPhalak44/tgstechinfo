import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, Pagination } from 'antd';
import { CalendarOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const PAGE_SIZE = 10;

const parseTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); if (Array.isArray(p)) return p.filter(Boolean); } catch {}
    return value.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
};

const TYPE_MAP = {
  articles:   { type: 'article',   title: 'Articles',   accent: '#4a7cff', leftImg: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80' },
  blogs:      { type: 'blog',      title: 'Blogs',      accent: '#6c5ce7', leftImg: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80' },
  news:       { type: 'news',      title: 'News',       accent: '#00b894', leftImg: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80' },
  interviews: { type: 'interview', title: 'Interviews', accent: '#e17055', leftImg: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80' },
  webinars:   { type: 'webinar',   title: 'Webinars',   accent: '#fd79a8', leftImg: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80' },
  events:     { type: 'event',     title: 'Events',     accent: '#fdcb6e', leftImg: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80' },
};

// Category slug → hero images mapping
const CATEGORY_IMG_MAP = {
  'artificial-intelligence':  { accent: '#6c5ce7', leftImg: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80' },
  'cybersecurity':            { accent: '#e17055', leftImg: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80' },
  'cloud-computing':          { accent: '#00b894', leftImg: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80' },
  'data-analytics':           { accent: '#4a7cff', leftImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80' },
  'devops':                   { accent: '#fd79a8', leftImg: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80' },
  'machine-learning':         { accent: '#a29bfe', leftImg: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=800&q=80' },
  'software-development':     { accent: '#00cec9', leftImg: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80' },
  'healthcare':               { accent: '#00b894', leftImg: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80' },
  'fintech':                  { accent: '#fdcb6e', leftImg: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80' },
  'hr-tech':                  { accent: '#e17055', leftImg: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80' },
  'edtech':                   { accent: '#6c5ce7', leftImg: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80' },
  'whitepaper':               { accent: '#4a7cff', leftImg: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&q=80', rightImg: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&q=80' },
};

// ── Split Hero Banner ────────────────────────────────────────────
const HeroBanner = ({ title, accent, leftImg, rightImg }) => (
  <div style={{ display: 'flex', height: 400, overflow: 'hidden', position: 'relative' }} className="cat-hero">
    {/* Left half */}
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <img src={leftImg} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}66 60%, transparent 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 48px' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            TGS Tech Info
          </div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(28px,3vw,42px)', margin: 0, letterSpacing: -1, textShadow: '0 2px 12px rgba(0,0,0,.3)' }}>
            {title.toUpperCase()}
          </h1>
        </div>
      </div>
    </div>
    {/* Right half */}
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <img src={rightImg} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,22,40,.3) 0%, rgba(10,22,40,.6) 100%)' }} />
    </div>
    {/* Center divider glow */}
    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`, transform: 'translateX(-50%)', zIndex: 2 }} />
  </div>
);

// ── Main list item ───────────────────────────────────────────────
const ListItem = ({ item, navigate, accent }) => (
  <div style={{
    display: 'flex', gap: 20, padding: '20px 0',
    borderBottom: '1px solid #eef0f5', cursor: 'pointer',
    transition: 'background .15s', borderRadius: 4
  }}
    className="cat-list-item"
    onClick={() => navigate(`/article/${item.slug}`)}
    onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    {/* Thumbnail */}
    <div style={{ width: 220, height: 150, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#f0f4ff' }} className="cat-list-item-thumb">
      {item.banner_image
        ? <img src={`/uploads/${item.banner_image}`} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s', imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📄</div>
      }
    </div>
    {/* Content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {item.category_name && (
          <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: .8 }}>
            {item.category_name}
          </span>
        )}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.title}
      </h3>
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: '0 0 12px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.short_description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#94a3b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <UserOutlined style={{ fontSize: 11 }} />
          {item.first_name} {item.last_name}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarOutlined style={{ fontSize: 11 }} />
          {moment(item.published_date || item.created_at).format('MMM D, YYYY')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EyeOutlined style={{ fontSize: 11 }} />
          {item.view_count || 0}
        </span>
      </div>
    </div>
  </div>
);

// ── Sidebar recent post ──────────────────────────────────────────
const SidebarPost = ({ item, navigate, accent }) => (
  <div style={{ display: 'flex', flexDirection: 'row', gap: 10, padding: '12px 0', borderBottom: '1px solid #eef0f5', cursor: 'pointer', alignItems: 'flex-start' }}
    onClick={() => navigate(`/article/${item.slug}`)}
  >
    {/* Thumbnail */}
    <div style={{ width: 64, height: 52, flexShrink: 0, borderRadius: 7, overflow: 'hidden', background: '#f0f4ff' }}>
      {item.banner_image
        ? <img src={`/uploads/${item.banner_image}`} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
      }
    </div>
    {/* Title + Description */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <h4 style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', margin: '0 0 3px', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        transition: 'color .2s'
      }}
        onMouseEnter={e => e.currentTarget.style.color = accent}
        onMouseLeave={e => e.currentTarget.style.color = '#0f172a'}
      >
        {item.title}
      </h4>
      <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.short_description}
      </p>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────
const CategoryList = () => {
  const { slug: paramSlug } = useParams();
  const pathSlug = window.location.pathname.replace('/', '');
  const slug = paramSlug || pathSlug;
  const navigate = useNavigate();

  const [contents, setContents] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const typeInfo = TYPE_MAP[slug];
  const catImgInfo = !typeInfo ? (CATEGORY_IMG_MAP[slug] || {}) : {};
  const accent = typeInfo?.accent || catImgInfo.accent || '#4a7cff';
  const pageTitle = typeInfo?.title || (slug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) || 'Content';
  const leftImg = typeInfo?.leftImg || catImgInfo.leftImg || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
  const rightImg = typeInfo?.rightImg || catImgInfo.rightImg || 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80';

  useEffect(() => { setCurrentPage(1); }, [slug]);
  useEffect(() => { fetchContents(); }, [slug, currentPage]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params = { status: 'published', limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE };
      if (typeInfo) params.content_type = typeInfo.type;
      else params.category = slug;

      const [mainRes, recentRes] = await Promise.all([
        axios.get('/api/public/content', { params }),
        axios.get('/api/public/content', { params: { status: 'published', limit: 5, ...(typeInfo ? { content_type: typeInfo.type } : { category: slug }) } }),
      ]);
      setContents(mainRes.data?.data || []);
      setTotal(mainRes.data?.total || 0);
      setRecentPosts(recentRes.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero Banner ── */}
      <HeroBanner
        title={pageTitle}
        accent={accent}
        leftImg={leftImg}
        rightImg={rightImg}
      />

      {/* ── Content Area ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }} className="cat-layout">

          {/* ── Main List — scrollable, height matches sidebar ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Count bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingBottom: 16, borderBottom: `3px solid ${accent}`, flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{pageTitle}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{total} posts found</span>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 600, paddingRight: 4 }}>
              {loading
                ? <Skeleton active paragraph={{ rows: 6 }} />
                : contents.length === 0
                  ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 15 }}>No content found.</div>
                  : contents.map(item => (
                      <ListItem key={item.id} item={item} navigate={navigate} accent={accent} />
                    ))
              }
            </div>

            {total > PAGE_SIZE && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={page => setCurrentPage(page)}
                  showSizeChanger={false}
                  showTotal={t => `Total ${t} items`}
                />
              </div>
            )}
          </div>

          {/* ── Sidebar — natural height, no scroll ── */}
          <div style={{ width: 300, flexShrink: 0 }} className="cat-sidebar">
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,.06)', border: '1px solid #eef0f5' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: accent, marginBottom: 4, paddingBottom: 12, borderBottom: `2px solid ${accent}22` }}>
                Recent Posts
              </div>
              {loading
                ? <Skeleton active paragraph={{ rows: 6 }} />
                : recentPosts.map(item => (
                    <SidebarPost key={item.id} item={item} navigate={navigate} accent={accent} />
                  ))
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryList;
