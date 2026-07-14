const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/public/Home.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. StatsBar - Remove icons
content = content.replace(
  /const ITEMS = \[[\s\S]*?\];/,
  `const ITEMS = [
    { label: 'Articles Published', value: stats.totalPublished,  color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
    { label: 'Total Views',        value: stats.totalViews,      color: 'var(--color-success)', bg: 'var(--color-primary-light)' },
    { label: 'Contributors',       value: stats.totalAuthors,    color: 'var(--color-accent)',  bg: 'var(--color-primary-light)' },
    { label: 'Tech Categories',    value: stats.totalCategories, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  ];`
);
content = content.replace(
  /<div style={{ fontSize: 32, marginBottom: 10, lineHeight: 1 }}>{s\.icon}<\/div>\s*/,
  ''
);

// 2. CAT_TABS - Remove icons and set color to var(--color-primary)
content = content.replace(
  /const CAT_TABS = \[[\s\S]*?\];/,
  `const CAT_TABS = [
  { label: 'AI & ML',        key: 'artificial-intelligence', param: 'category',     color: 'var(--color-primary)' },
  { label: 'Cybersecurity',  key: 'cybersecurity',           param: 'category',     color: 'var(--color-primary)' },
  { label: 'Cloud',          key: 'cloud-computing',         param: 'category',     color: 'var(--color-primary)' },
  { label: 'DevOps',         key: 'devops',                  param: 'category',     color: 'var(--color-primary)' },
  { label: 'Data Analytics', key: 'data-analytics',          param: 'category',     color: 'var(--color-primary)' },
  { label: 'FinTech',        key: 'fintech',                 param: 'category',     color: 'var(--color-primary)' },
  { label: 'Healthcare IT',  key: 'healthcare',              param: 'category',     color: 'var(--color-primary)' },
  { label: 'Interviews',     key: 'interview',               param: 'content_type', color: 'var(--color-primary)' },
];`
);

// 3. CategoryNav - Increase height (padding) and remove icon render
content = content.replace(
  /padding: '8px 16px'/g,
  `padding: '12px 22px'`
);
content = content.replace(
  /<span style={{ fontSize: 15, lineHeight: 1 }}>{c\.icon}<\/span>\s*/,
  ''
);

// 4. WHY_ITEMS - Remove icons
content = content.replace(
  /const WHY_ITEMS = \[[\s\S]*?\];/,
  `const WHY_ITEMS = [
  { title: 'Targeted B2B Audience',     desc: 'Reach 200,000+ verified IT decision-makers, CXOs, and tech buyers across industries.' },
  { title: 'Measurable ROI',             desc: 'Real-time analytics dashboard: track impressions, leads, downloads and engagement.' },
  { title: 'Thought Leadership',         desc: 'Position your brand as an industry authority with expert-curated editorial placement.' },
  { title: 'Multi-Channel Distribution', desc: 'Your content amplified via newsletter, social, SEO and partner syndication networks.' },
  { title: 'Fast-Track Publishing',      desc: 'Dedicated editorial team ensures your content goes live within 48 hours of approval.' },
  { title: 'Dedicated Account Manager',  desc: 'White-glove support from strategy to execution, with a single point of contact for your team.' },
];`
);
content = content.replace(
  /<div style={{ fontSize: 36, marginBottom: 14, lineHeight: 1 }}>{item\.icon}<\/div>\s*/,
  ''
);

// 5. SOLUTIONS - Remove icons
content = content.replace(
  /const SOLUTIONS = \[[\s\S]*?\];/,
  `const SOLUTIONS = [
  { accent: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Articles & Blogs',      desc: 'Long-form thought leadership, how-tos and opinion pieces that rank on Google and drive organic traffic.',       tags: ['SEO Optimised', 'Editorial Review', 'Author Profile'] },
  { accent: 'var(--color-success)', bg: 'var(--color-primary-light)', label: 'Whitepapers & Reports',  desc: 'Gated research assets that generate qualified leads. We handle design, hosting and lead capture forms.',       tags: ['Lead Gen', 'Branded Design', 'CRM Integration'] },
  { accent: 'var(--color-accent)',  bg: 'var(--color-primary-light)', label: 'Webinars & Events',      desc: 'Live and on-demand virtual events promoted to our engaged audience of IT professionals.',                     tags: ['Registration Page', 'Email Promotion', 'Recording Hosting'] },
  { accent: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Sponsored News',         desc: 'Get your product launches, partnerships and announcements in front of the right audience instantly.',          tags: ['Instant Publish', 'Homepage Feature', 'Newsletter Blast'] },
];`
);
content = content.replace(
  /<div style={{ width: 52, height: 52, borderRadius: 14, background: s\.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>{s\.icon}<\/div>\s*/,
  ''
);

// 6. Remove tabData.length posts and category icon
content = content.replace(
  /<span style={{ fontSize: 22 }}>{activeCat\?\.icon}<\/span>\s*/,
  ''
);
content = content.replace(
  /{!tabLoading && tabData\.length > 0 && \(\s*<span[^>]*>{tabData\.length} posts<\/span>\s*\)}/,
  ''
);

// 7. Read More animation and button change
const oldReadMore = `<button onClick={() => navigate(\`/article/\${a.slug}\`)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: activeCat?.color || 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: \`0 4px 14px \${activeCat?.color || 'var(--color-primary)'}40\`, transition: 'all .2s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.opacity = '1'; }}
                              >
                                Read More <ArrowRightOutlined style={{ fontSize: 11 }} />
                              </button>`;

const newReadMore = `<button onClick={() => navigate(\`/article/\${a.slug}\`)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'transparent', color: activeCat?.color || 'var(--color-primary)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'transform .2s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(5px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                              >
                                Read More <ArrowRightOutlined style={{ fontSize: 11 }} />
                              </button>`;

if (content.includes(oldReadMore)) {
  content = content.replace(oldReadMore, newReadMore);
} else {
  console.log("Could not find oldReadMore string directly, attempting regex replacement...");
  content = content.replace(
    /<button onClick={\(\) => navigate\(\`\/article\/\${a\.slug}\`\)}[\s\S]*?Read More <ArrowRightOutlined style={{ fontSize: 11 }} \/>\s*<\/button>/,
    newReadMore
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully removed emojis, updated button, and increased chip padding.");
