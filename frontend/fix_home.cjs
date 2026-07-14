const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/public/Home.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// LatestArticlesSection ends with "};\n\n" — find the last clean section end before the orphaned JSX
// The LatestArticlesSection } is at around line 1150
// We'll find it by looking for the closing of the component before the orphaned <\/div>

// Strategy: find "  );\n};\n\n" which marks the end of LatestArticlesSection,
// then cut everything after it and append the clean Main Home section

// Find the LatestArticlesSection's closing
const latestSectionEnd = content.indexOf('  );\n};\n\n              </div>');
let cutPoint = -1;

if (latestSectionEnd !== -1) {
  // Cut after "};\n\n"
  cutPoint = latestSectionEnd + '  );\n};\n\n'.length;
} else {
  // Try alternate endings (Windows line endings)
  const alt = content.indexOf('  );\r\n};\r\n\r\n              </div>');
  if (alt !== -1) {
    cutPoint = alt + '  );\r\n};\r\n\r\n'.length;
  } else {
    // Find the end of LatestArticlesSection by finding first orphaned tag after it
    const orphanIdx = content.indexOf('\n              </div>\r\n              {tabLoading');
    if (orphanIdx !== -1) {
      cutPoint = orphanIdx + 1; // keep the newline before it
      // Back-track to find the end of };\n
      const prevClose = content.lastIndexOf('\n};\n', orphanIdx);
      if (prevClose !== -1) cutPoint = prevClose + '\n};\n'.length;
    }
  }
}

if (cutPoint === -1) {
  // Last resort: find by line number
  const lines = content.split('\n');
  // Line 1150 (0-indexed: 1149) should be "};"
  let endLine = -1;
  for (let i = 1148; i < 1155; i++) {
    if (lines[i] && lines[i].trim() === '};') {
      endLine = i;
      break;
    }
  }
  if (endLine !== -1) {
    // Recalculate cut point from line number
    cutPoint = lines.slice(0, endLine + 1).join('\n').length + 1;
    console.log('Using line-based cut at line', endLine);
  }
}

if (cutPoint === -1) {
  console.log('Could not determine cut point!');
  process.exit(1);
}

console.log('Cut point:', cutPoint);
console.log('Content before cut (last 100 chars):', JSON.stringify(content.substring(cutPoint - 100, cutPoint)));

const beforeCut = content.substring(0, cutPoint);

const newMainHome = `
// \u2500\u2500 Main Home \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ articles: [], blogs: [], news: [], interviews: [] });
  const [stats, setStats] = useState({ totalPublished: 0, totalViews: 0, totalAuthors: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState(CAT_TABS[0].key);
  const [tabData, setTabData] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const catSectionRef = useRef(null);

  useEffect(() => { fetchHomeData(); }, []);

  useEffect(() => {
    if (!activeTab) { setTabData([]); return; }
    setTabLoading(true);
    const tab = CAT_TABS.find(c => c.key === activeTab);
    const qs = tab?.param === 'content_type'
      ? \`content_type=\${tab.key}\`
      : \`category=\${tab?.key}\`;
    axios.get(\`/api/public/content?status=published&\${qs}&limit=2\`)
      .then(r => setTabData(r.data?.data || []))
      .catch(() => setTabData([]))
      .finally(() => { setTabLoading(false); });
  }, [activeTab]);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [aR, bR, nR, iR, sR] = await Promise.all([
        axios.get('/api/public/content?status=published&content_type=article&limit=6'),
        axios.get('/api/public/content?status=published&content_type=blog&limit=4'),
        axios.get('/api/public/content?status=published&content_type=news&limit=4'),
        axios.get('/api/public/content?status=published&content_type=interview&limit=4'),
        axios.get('/api/public/stats'),
      ]);
      setData({
        articles:   aR.data?.data || [],
        blogs:      bR.data?.data || [],
        news:       nR.data?.data || [],
        interviews: iR.data?.data || [],
      });
      setStats(sR.data || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchVal.trim().length >= 2)
      navigate(\`/search?q=\${encodeURIComponent(searchVal.trim())}\`);
  };

  if (loading) return (
    <div style={{ padding: '40px 0' }}>
      <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 32 }} />
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  const [featuredArticle, ...restArticles] = data.articles;

  return (
    <div style={{ paddingBottom: 60, background: 'var(--color-bg-alt)', minHeight: '100vh' }}>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {/* Hero */}
      <HeroSection searchVal={searchVal} setSearchVal={setSearchVal} handleSearch={handleSearch} />

      {/* Ticker */}
      {data.news.length > 0 && <TickerStrip items={data.news} />}

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

        {/* Latest Posts */}
        <LatestArticlesSection articles={data.articles} blogs={data.blogs} navigate={navigate} />

        {/* Category chips */}
        <CategoryNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Category filtered content */}
        <div ref={catSectionRef}>
          {activeTab && (() => {
            const activeCat = CAT_TABS.find(c => c.key === activeTab);
            return (
              <div style={{ margin: '0 0 40px', minHeight: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{activeCat?.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-heading)' }}>{activeCat?.label}</span>
                    {!tabLoading && tabData.length > 0 && (
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, background: activeCat?.color || 'var(--color-primary)', borderRadius: 20, padding: '2px 10px' }}>
                        {tabData.length} posts
                      </span>
                    )}
                  </div>
                  <Link to={\`/category/\${activeTab}\`} style={{
                    fontSize: 12, color: activeCat?.color || 'var(--color-primary)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
                    padding: '5px 14px', borderRadius: 8,
                    border: \`1px solid \${activeCat?.color || 'var(--color-primary)'}33\`,
                    background: \`\${activeCat?.color || 'var(--color-primary)'}0d\`
                  }}>
                    View All <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </Link>
                </div>

                {tabLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                    {[1, 2].map(i => <Skeleton key={i} active />)}
                  </div>
                ) : tabData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-muted)', fontSize: 14,
                    background: 'var(--color-surface)', borderRadius: 12, border: '1px dashed var(--color-border)' }}>
                    No content found for this category yet.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }} className="cat-cards-grid">
                    {tabData.slice(0, 2).map((a, idx) => (
                      <div key={a.id} style={{ animation: \`catCardIn .4s ease \${idx * 80}ms both\` }}>
                        <div style={{
                          background: 'var(--color-surface)', borderRadius: 14, overflow: 'hidden',
                          border: \`1.5px solid \${activeCat?.color || 'var(--color-primary)'}22\`,
                          boxShadow: \`0 2px 16px \${activeCat?.color || 'var(--color-primary)'}0d\`,
                          display: 'flex', flexDirection: 'column',
                          transition: 'transform .22s ease, box-shadow .22s ease'
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = \`0 14px 36px \${activeCat?.color || 'var(--color-primary)'}22\`; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = \`0 2px 16px \${activeCat?.color || 'var(--color-primary)'}0d\`; }}
                        >
                          {/* Image */}
                          <div style={{ position: 'relative', overflow: 'hidden', height: 200, lineHeight: 0 }}>
                            {a.banner_image ? (
                              <img src={\`/uploads/\${a.banner_image}\`} alt={a.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: \`linear-gradient(135deg, \${activeCat?.color || 'var(--color-primary)'}22 0%, #e8edff 100%)\` }}>
                                <ReadOutlined style={{ fontSize: 40, color: activeCat?.color || 'var(--color-primary)', opacity: 0.4 }} />
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: activeCat?.color || 'var(--color-primary)' }} />
                          </div>

                          {/* Content */}
                          <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h3 style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.45, color: 'var(--color-heading)', margin: 0,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {a.title}
                            </h3>

                            {/* Author + Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--color-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: \`\${activeCat?.color || 'var(--color-primary)'}22\`,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, color: activeCat?.color || 'var(--color-primary)', fontWeight: 700 }}>
                                  {(a.author_name || a.author || 'A').charAt(0).toUpperCase()}
                                </span>
                                <span style={{ fontWeight: 500 }}>{a.author_name || a.author || 'TgsTechInfo'}</span>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <CalendarOutlined />{moment(a.published_date || a.created_at).format('MMM D, YYYY')}
                              </span>
                            </div>

                            {/* Read More */}
                            <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                              <button
                                onClick={() => navigate(\`/article/\${a.slug}\`)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                                  borderRadius: 8, background: activeCat?.color || 'var(--color-primary)',
                                  color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                                  boxShadow: \`0 4px 14px \${activeCat?.color || 'var(--color-primary)'}40\`,
                                  transition: 'all .2s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.opacity = '1'; }}
                              >
                                Read More <ArrowRightOutlined style={{ fontSize: 11 }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Featured Articles */}
        {data.articles.length > 0 && (
          <RevealSection>
            <SectionHead icon={<FireOutlined />} label="Featured Articles" viewAllTo="/articles" accent="var(--color-primary)" />
            <Row gutter={[20, 20]}>
              {featuredArticle && (
                <Col xs={24} lg={14}>
                  <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--color-surface)',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.11)', cursor: 'pointer', height: '100%',
                    transition: 'transform .25s, box-shadow .25s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(11,31,77,.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 20px rgba(11,31,77,0.08)'; }}
                    onClick={() => navigate(\`/article/\${featuredArticle.slug}\`)}
                  >
                    <div style={{ lineHeight: 0, cursor: 'zoom-in', borderRadius: '16px 16px 0 0', overflow: 'hidden', position: 'relative' }}
                      onClick={e => { e.stopPropagation(); if (featuredArticle.banner_image) setLightbox({ src: \`/uploads/\${featuredArticle.banner_image}\`, alt: featuredArticle.title }); }}>
                      {featuredArticle.banner_image
                        ? <img src={\`/uploads/\${featuredArticle.banner_image}\`} alt={featuredArticle.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        : <div style={{ height: 200, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReadOutlined style={{ fontSize: 32, color: 'var(--color-primary)' }} />
                          </div>
                      }
                      <div style={{ position: 'absolute', top: 12, left: 12 }}>
                        <span style={{ background: 'var(--color-accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, letterSpacing: .5 }}>
                          \u2b50 FEATURED
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '22px 24px 24px' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {featuredArticle.category_name && <Tag color="blue" style={{ borderRadius: 20, fontSize: 11, border: 'none', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{featuredArticle.category_name}</Tag>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.4, color: 'var(--color-heading)', marginBottom: 10 }}>{featuredArticle.title}</div>
                      <div style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 16,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {featuredArticle.short_description}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                        <span><EyeOutlined style={{ marginRight: 4 }} />{featuredArticle.view_count || 0}</span>
                        <span><CalendarOutlined style={{ marginRight: 4 }} />{moment(featuredArticle.published_date || featuredArticle.created_at).format('MMM D, YYYY')}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              )}
              <Col xs={24} lg={10} style={{ display: 'flex' }}>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '20px 20px 8px', boxShadow: '0 2px 20px rgba(0,0,0,0.11)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {restArticles.slice(0, 5).map((a, i, arr) => (
                    <ListCard key={a.id} article={a} navigate={navigate} isLast={i === arr.length - 1} onImgClick={(src, alt) => setLightbox({ src, alt })} />
                  ))}
                </div>
              </Col>
            </Row>
          </RevealSection>
        )}

        <StatsBar stats={stats} />

        {data.news.length > 0 && (
          <RevealSection delay={80}>
            <SectionHead icon={<GlobalOutlined />} label="Latest News" viewAllTo="/news" accent="#00b894" />
            <Row gutter={[20, 20]}>
              {data.news.map(a => (
                <Col xs={24} sm={12} lg={6} key={a.id}>
                  <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#00b894" />
                </Col>
              ))}
            </Row>
          </RevealSection>
        )}

        {data.blogs.length > 0 && (
          <RevealSection delay={100}>
            <div style={{ marginTop: 48 }}>
              <SectionHead icon={<ReadOutlined />} label="Latest Blogs" viewAllTo="/blogs" accent="#6c5ce7" />
              <Row gutter={[20, 20]}>
                {data.blogs.map(a => (
                  <Col xs={24} sm={12} lg={6} key={a.id}>
                    <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#6c5ce7" />
                  </Col>
                ))}
              </Row>
            </div>
          </RevealSection>
        )}

        <WhyPublishSection />
        <PublishingSolutions />
        <NewsletterBox />

        {data.interviews.length > 0 && (
          <RevealSection delay={80}>
            <SectionHead icon={<TeamOutlined />} label="Expert Interviews" viewAllTo="/interviews" accent="#e17055" />
            <Row gutter={[20, 20]}>
              {data.interviews.map(a => (
                <Col xs={24} sm={12} lg={6} key={a.id}>
                  <HeroCard article={a} navigate={navigate} onImgClick={(src, alt) => setLightbox({ src, alt })} accent="#e17055" />
                </Col>
              ))}
            </Row>
          </RevealSection>
        )}

      </div>

      <style>{\`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes heroProgress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes catCardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stats-grid, .why-grid, .solutions-grid { grid-template-columns: repeat(4, 1fr); }
        .latest-articles-grid { grid-template-columns: repeat(4, 1fr); }
        .cat-cards-grid { grid-template-columns: repeat(2, 1fr); }
        .latest-article-card { will-change: transform, box-shadow; }
        @media (max-width: 900px) { .latest-articles-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .stats-grid, .why-grid, .solutions-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) { .cat-cards-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) {
          .stats-grid, .why-grid, .solutions-grid, .latest-articles-grid { grid-template-columns: 1fr; }
        }
      \`}</style>
    </div>
  );
};

export default Home;
`;

const newContent = beforeCut + newMainHome;
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('\\nDone! Final checks:');
console.log('  Lines:', newContent.split('\\n').length);
console.log('  CAT_TABS[0].key default:', newContent.includes('CAT_TABS[0].key'));
console.log('  Read More:', newContent.includes('Read More'));
console.log('  catCardIn:', newContent.includes('catCardIn'));
console.log('  export default Home:', newContent.includes('export default Home'));
console.log('  style blocks:', (newContent.match(/CSS for animations/g)||[]).length);
console.log('  tabLoading:', (newContent.match(/tabLoading/g)||[]).length);
