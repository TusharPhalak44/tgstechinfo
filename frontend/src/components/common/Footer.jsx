import React from 'react';
import { Link } from 'react-router-dom';
import {
  FacebookOutlined, TwitterOutlined, LinkedinOutlined, YoutubeOutlined,
  MailOutlined, PhoneOutlined, EnvironmentOutlined, ArrowRightOutlined,
  SendOutlined
} from '@ant-design/icons';

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

const SocialBtn = ({ href, icon, label, color }) => (
  <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer" style={{
    width: 38, height: 38, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-muted)', fontSize: 17, textDecoration: 'none',
    background: 'var(--color-primary-light)', border: '1px solid var(--color-border)',
    transition: 'all .22s'
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
  >
    {icon}
  </a>
);

const ColHead = ({ children, accent = 'var(--color-accent)' }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontWeight: 700, fontSize: 12, color: accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
      {children}
    </div>
    <div style={{ width: 24, height: 2, background: accent, borderRadius: 2 }} />
  </div>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--color-primary)', marginTop: 0 }}>

      {/* ── Main footer ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 44px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1.4fr', gap: '40px 32px', flexWrap: 'wrap' }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <img src="/logo.jpg" alt="TGS Tech Info" style={{ height: 70, objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.8, marginBottom: 22, maxWidth: 240 }}>
              Your gateway to technology insights, news, and resources for IT and B2B professionals worldwide.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              <SocialBtn href="#" icon={<LinkedinOutlined />} label="LinkedIn" color="#0077b5" />
              <SocialBtn href="#" icon={<TwitterOutlined />} label="Twitter" color="#1da1f2" />
              <SocialBtn href="#" icon={<FacebookOutlined />} label="Facebook" color="#1877f2" />
              <SocialBtn href="#" icon={<YoutubeOutlined />} label="YouTube" color="#ff0000" />
            </div>
            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 20 }}>
              {[['50K+', 'Readers'], ['500+', 'Articles'], ['100+', 'Experts']].map(([num, lbl]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)' }}>{num}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{lbl}</div>
                </div>
              ))}
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

          {/* Company */}
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
                <span style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 5 }}>contact@tgstechinfo.com</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PhoneOutlined style={{ color: 'var(--color-accent)', fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 5 }}>+1 (555) 123-4567</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EnvironmentOutlined style={{ color: 'var(--color-accent)', fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 5 }}>123 Tech Park, Silicon Valley, CA</span>
              </div>
            </div>

            {/* Newsletter */}
            <div style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Newsletter</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>Weekly tech digest, free.</div>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <input placeholder="your@email.com" style={{
                  flex: 1, padding: '9px 12px', border: 'none', fontSize: 12,
                  outline: 'none', background: 'var(--color-surface)', color: 'var(--color-heading)'
                }} />
                <button style={{
                  padding: '9px 14px', background: 'var(--color-accent)',
                  border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer'
                }}>
                  <SendOutlined />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'var(--color-border)', margin: '0 24px' }} />

      {/* ── Bottom bar ── */}
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
        </div>
      </div>

    </footer>
  );
};

export default Footer;
