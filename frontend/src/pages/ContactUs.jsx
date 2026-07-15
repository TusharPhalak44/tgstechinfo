import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

// Custom components
import { ContactHero } from '../components/contact/ContactHero';
import { ContactForm } from '../components/contact/ContactForm';
import { OfficeMap } from '../components/contact/OfficeMap';
import { FAQAccordion } from '../components/contact/FAQAccordion';
import { ThemeToggle } from '../components/contact/ThemeToggle';
import { SocialMediaIcons } from '../components/contact/SocialMediaIcons';
import { ContactSideImage } from '../components/contact/ContactSideImage';

const infoItems = [
  {
    icon: <Mail className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />,
    title: 'General Inquiries',
    lines: [
      <a key="email" href="mailto:info@tgstechinfo.com" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>info@tgstechinfo.com</a>,
      <span key="rt" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Response: 24–48 hrs</span>,
    ],
  },
  {
    icon: <Mail className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />,
    title: 'Partnerships & Media',
    lines: [
      <a key="email" href="mailto:partnerships@tgstechinfo.com" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>partnerships@tgstechinfo.com</a>,
      <span key="rt" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Guest posts, sponsorships, media</span>,
    ],
  },
  {
    icon: <MapPin className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />,
    title: 'Office Address',
    lines: [
      <span key="name" style={{ color: 'var(--color-body)', fontWeight: 500 }}>TGS Tech Info</span>,
      <span key="addr" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>City, State, Country</span>,
    ],
  },
  {
    icon: <Phone className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />,
    title: 'Phone Support',
    lines: [
      <span key="num" style={{ color: 'var(--color-body)', fontWeight: 500 }}>+1 (800) 000-0000</span>,
      <span key="hrs" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Mon–Fri, 9 AM–6 PM EST</span>,
    ],
  },
];

export const ContactUs = () => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Theme switcher */}
      <ThemeToggle />

      {/* ── Hero ── */}
      <ContactHero />



      {/* ── Contact Form + Side Image ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
        <div className="space-y-6">
          <ContactForm agreed={agreed} setAgreed={setAgreed} />
          <SocialMediaIcons />
        </div>
        <ContactSideImage />
      </div>

      {/* ── Info Cards — 4 in one row ── */}
      <div className="max-w-7xl mx-auto mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {infoItems.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-1 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 1px 4px rgba(11,31,77,0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <span className="text-sm font-semibold" style={{ color: 'var(--color-heading)' }}>
                {item.title}
              </span>
            </div>
            {item.lines.map((line, i) => (
              <div key={i} className="text-sm leading-snug">{line}</div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Map (with business hours above) + FAQ side-by-side ── */}
      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left — Business hours strip + Map
        <div className="flex flex-col gap-3">
          Business hours — single line strip
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
            <span>
              <strong>Business Hours:</strong>&nbsp;Mon–Fri 9:00 AM – 6:00 PM EST &nbsp;·&nbsp; Sat & Sun: Closed
            </span>
          </div>
          <OfficeMap />
        </div> */}

        {/* Right — FAQ */}
        {/* <FAQAccordion /> */}
      </div>
    </div>
  );
};

export default ContactUs;
