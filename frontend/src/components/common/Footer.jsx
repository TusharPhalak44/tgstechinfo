import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import {
  FacebookOutlined, TwitterOutlined, LinkedinOutlined, YoutubeOutlined,
  MailOutlined, PhoneOutlined, EnvironmentOutlined, ArrowRightOutlined,
  SendOutlined
} from '@ant-design/icons';
import CookiePreferencesModal from './CookieBanner';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const FooterLink = ({ to, children }) => (
  <Link to={to} style={{
    fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0',
    transition: 'color .2s, gap .2s'
  }}
    onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.gap = '10px'; }}
    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.gap = '7px'; }}
  >
    <ArrowRightOutlined style={{ fontSize: 9 }} />
    {children}
  </Link>
);

const SocialBtn = ({ href, icon, label, color, logoUrl }) => (
  <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer" style={{
    width: 38, height: 38, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-muted)', fontSize: 17, textDecoration: 'none',
    background: 'var(--color-primary-light)', border: '1px solid var(--color-border)',
    transition: 'all .22s'
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
  >
    {logoUrl ? (
      <img src={logoUrl} alt={label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
    ) : (
      icon
    )}
  </a>
);

const ColHead = ({ children, accent = 'var(--color-accent)' }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontWeight: 700, fontSize: 12, color: accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
      {children}
    </div>
    <div style={{ width: 12, height: 2, background: accent, borderRadius: 2 }} />
  </div>
);

const Footer = ({ simplified = false }) => {
  const { darkMode } = useTheme();
  const year = new Date().getFullYear();
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState('/logo.jpg');
  const [stats, setStats] = useState({ totalPublished: 0, totalViews: 0, totalAuthors: 0, totalCategories: 0 });

  useEffect(() => {
    const fetchWebsiteLogo = async () => {
      try {
        const response = await axios.get('/api/site-settings/public');
        const settings = response.data.settings;
        if (settings && settings.website_logo) {
          setWebsiteLogo(settings.website_logo);
        }
      } catch (error) {
        console.error('Failed to fetch website logo:', error);
      }
    };
    fetchWebsiteLogo();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/public/stats');
        setStats(response.data || {});
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      message.error('Please enter a valid email address');
      return;
    }

    setNewsletterLoading(true);
    try {
      await axios.post('/api/public/newsletter', { email: newsletterEmail });
      message.success('Successfully subscribed to newsletter!');
      setNewsletterEmail('');
    } catch (error) {
      if (error.response?.status === 400) {
        message.error(error.response.data.message || 'Email already subscribed');
      } else {
        message.error('Failed to subscribe. Please try again.');
      }
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Simplified footer for dashboard pages
  if (simplified) {
    return (
      <footer style={{ background: darkMode ? '#0f172a' : 'var(--color-primary)', marginTop: 0, borderTop: darkMode ? '1px solid #334155' : '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            © {year} <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>TGS Tech Info</span>. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Privacy', '/privacy-policy'], ['Terms', '/terms-of-use'], ['Cookies', '/cookie-policy']].map(([label, to]) => (
              <Link key={label} to={to} style={{ fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
              >{label}</Link>
            ))}
            <button
              onClick={() => setShowCookiePreferences(true)}
              style={{
                fontSize: 13,
                color: 'var(--color-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
            >
              Cookie Preferences
            </button>
          </div>
        </div>

        {/* Cookie Preferences Modal */}
        {showCookiePreferences && (
          <CookiePreferencesModal
            visible={showCookiePreferences}
            onClose={() => setShowCookiePreferences(false)}
          />
        )}
      </footer>
    );
  }

  // Full footer for public pages
  return (
  <footer style={{ background: darkMode ? '#0f172a' : 'var(--color-primary)', marginTop: 0, position: 'relative', zIndex: 1 }}>
      {/* ── Main footer ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 44px' }}>
        <style>{`
          .footer-grid {
            display: grid;
            grid-template-columns: 1.6fr 1fr 1fr 1fr 1.4fr;
            gap: 40px 32px;
          }
          @media (max-width: 1024px) {
            .footer-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 40px 24px;
            }
          }
          @media (max-width: 640px) {
            .footer-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }
          }
        `}</style>
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <img src={websiteLogo} alt="TGS Tech Info" style={{ height: 90, objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.8, marginBottom: 22, maxWidth: 240 }}>
              Your gateway to technology insights, news, and resources for IT and B2B professionals worldwide.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              <SocialBtn href="https://www.linkedin.com/company/taraj-global/" icon={<LinkedinOutlined />} label="LinkedIn" color="#0077b5" logoUrl="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" />
            </div>
            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)' }}>{stats.totalViews || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Readers</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)' }}>{stats.totalPublished || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Articles</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)' }}>{stats.totalAuthors || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Experts</div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div>
            <ColHead>Insights</ColHead>
            <FooterLink to="/articles">Articles</FooterLink>
            <FooterLink to="/news">News</FooterLink>
            <FooterLink to="/blogs">Blogs</FooterLink>
            <FooterLink to="/interviews">Interviews</FooterLink>
            <FooterLink to="/webinars">Webinars</FooterLink>
            <FooterLink to="/events">Events</FooterLink>
            <div style={{ marginTop: 48 }}>
              <ColHead>Company</ColHead>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
          </div>

          {/* Technology */}
          <div>
            <ColHead>Technology</ColHead>
            <FooterLink to="/category/artificial-intelligence">AI & ML</FooterLink>
            <FooterLink to="/category/cybersecurity">Cybersecurity</FooterLink>
            <FooterLink to="/category/cloud-computing">Cloud Computing</FooterLink>
            <FooterLink to="/category/data-analytics">Data Analytics</FooterLink>
            <FooterLink to="/category/devops">DevOps</FooterLink>
            <FooterLink to="/category/software-development">Software Dev</FooterLink>
          </div>

          {/* Legal & Privacy */}
          <div>
            <ColHead accent="#F7941D">Legal &amp; Privacy</ColHead>
            <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
            <FooterLink to="/terms-of-use">Terms of Use</FooterLink>
            <FooterLink to="/cookie-policy">Cookie Policy</FooterLink>
            <FooterLink to="/data-privacy-notice">GDPR / CCPA Notice</FooterLink>
            <FooterLink to="/data-requests">Data Requests (DSAR)</FooterLink>
            <FooterLink to="/do-not-sell">Do Not Sell My Info</FooterLink>
            <FooterLink to="/disclaimer">Disclaimer &amp; Copyright</FooterLink>
            <FooterLink to="/accessibility">Accessibility</FooterLink>
            <FooterLink to="/acceptable-use">Acceptable Use</FooterLink>
            <FooterLink to="/security">Security &amp; Data Retention</FooterLink>
            <FooterLink to="/vendor-list">Vendor List</FooterLink>
            <FooterLink to="/contact-privacy-officer">Contact Privacy Officer</FooterLink>
            <FooterLink to="/user-account-policy">User Account &amp; Platform Usage</FooterLink>
          </div>


          {/* Contact + Newsletter */}
          <div>
            <ColHead>Get In Touch</ColHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MailOutlined style={{ color: 'var(--color-accent)', fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 5 }}>info@tgstechinfo.com</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PhoneOutlined style={{ color: 'var(--color-accent)', fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 5 }}>+91 96655-99442</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EnvironmentOutlined style={{ color: 'var(--color-accent)', fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 5 }}>The Space Business Complex Office No 512-516, Grant Rd, Kharadi, Pune, Maharashtra 411014</span>
              </div>
            </div>

            {/* Newsletter */}
            <div style={{ background: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'var(--color-primary-light)', border: darkMode ? '1px solid #334155' : '1px solid var(--color-border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Newsletter</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>Weekly tech digest, free.</div>
              <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: darkMode ? '1px solid #334155' : '1px solid var(--color-border)' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={newsletterLoading}
                  style={{
                    flex: 1, padding: '9px 12px', border: 'none', fontSize: 12,
                    outline: 'none', background: darkMode ? '#0f172a' : 'var(--color-surface)', color: darkMode ? '#f1f5f9' : 'var(--color-heading)'
                  }}
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  style={{
                    padding: '9px 14px', background: darkMode ? '#F7941D' : 'var(--color-accent)',
                    border: 'none', color: '#fff', fontSize: 14, cursor: newsletterLoading ? 'not-allowed' : 'pointer',
                    opacity: newsletterLoading ? 0.7 : 1
                  }}
                >
                  {newsletterLoading ? '...' : <SendOutlined />}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: darkMode ? '#334155' : 'var(--color-border)', margin: '0 24px' }} />

      {/* ── Bottom bar ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', width: '100%', display: 'block' }} className="footer-copyright">
          © {year} <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>TGS Tech Info</span>. All rights reserved.
        </span>
        <style>{`
          @media (min-width: 640px) {
            .footer-copyright { width: auto !important; display: inline !important; text-align: left !important; }
            .footer-bottom-links { justify-content: flex-end !important; }
          }
          .footer-bottom-links { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; width: 100%; }
          @media (min-width: 640px) { .footer-bottom-links { width: auto; } }
        `}</style>
        <div className="footer-bottom-links">
          {[['Privacy', '/privacy-policy'], ['Terms', '/terms-of-use'], ['Cookies', '/cookie-policy']].map(([label, to]) => (
            <Link key={label} to={to} style={{ fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
            >{label}</Link>
          ))}
          <button
            onClick={() => setShowCookiePreferences(true)}
            style={{ fontSize: 13, color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color .2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
          >
            Cookie Preferences
          </button>
        </div>
      </div>

      {/* Cookie Preferences Modal */}
      {showCookiePreferences && (
        <CookiePreferencesModal
          visible={showCookiePreferences}
          onClose={() => setShowCookiePreferences(false)}
        />
      )}

    </footer>
  );
};

export default Footer;
