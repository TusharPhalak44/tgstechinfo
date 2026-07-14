import React from 'react';
import { Link } from 'react-router-dom';

const UPDATED = 'July 8, 2026';
const YEAR = new Date().getFullYear();

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const Disclaimer = () => (
  <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
    {/* Hero */}
    <div style={{ maxWidth: 860, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Disclaimer &amp; Copyright Notice</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Last updated: {UPDATED}</p>
    </div>

    <div style={{ maxWidth: 860, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

      {/* Copyright banner */}
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,#f0f4ff,#e8f0ff)', borderRadius: 12, border: '1px solid #dce6ff', marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>©</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginBottom: 4 }}>
          © {YEAR} TGS Tech Info. All Rights Reserved.
        </div>
        <div style={{ fontSize: 13.5, color: '#6b7280' }}>tgstechinfo.com — Global B2B Technology Publishing Platform</div>
      </div>

      {/* DISCLAIMER */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e17055', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Part I — Disclaimer</div>

        <Section title="1. General Disclaimer">
          <p style={{ marginBottom: 12 }}>The information published on <strong>tgstechinfo.com</strong> is provided for general informational and educational purposes only. TGS Tech Info makes no representations or warranties of any kind, express or implied, regarding the accuracy, completeness, reliability, suitability, or availability of any content on this website.</p>
          <p>Any reliance you place on such information is strictly at your own risk. TGS Tech Info shall not be liable for any loss or damage arising from your use of, or reliance on, any content published on this platform.</p>
        </Section>

        <Section title="2. Not Professional Advice">
          <p style={{ marginBottom: 12 }}>Content published on TGS Tech Info — including articles, blogs, whitepapers, research reports, webinars, interviews, and case studies — does <strong>not constitute</strong> professional advice of any kind, including but not limited to:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>Legal advice</Li>
            <Li>Financial or investment advice</Li>
            <Li>Technical or engineering advice</Li>
            <Li>Medical or health advice</Li>
            <Li>Regulatory or compliance advice</Li>
          </ul>
          <p style={{ marginTop: 12 }}>Always seek the advice of a qualified professional for your specific situation before making any business, legal, financial, or technical decisions.</p>
        </Section>

        <Section title="3. Contributor and Sponsored Content">
          <p style={{ marginBottom: 12 }}>TGS Tech Info publishes content contributed by third-party authors, industry experts, and sponsoring organizations. The views, opinions, and statements expressed in contributor and sponsored content are those of the respective authors and do <strong>not necessarily reflect</strong> the views of TGS Tech Info.</p>
          <p>TGS Tech Info does not endorse any products, services, companies, or organizations mentioned in contributor or sponsored content unless explicitly stated.</p>
        </Section>

        <Section title="4. External Links Disclaimer">
          <p>Our website may contain links to third-party websites, resources, and services. These links are provided for convenience only. TGS Tech Info has no control over the content, privacy practices, or availability of external sites and accepts no responsibility for them. The inclusion of any link does not imply endorsement by TGS Tech Info.</p>
        </Section>

        <Section title="5. Availability Disclaimer">
          <p>TGS Tech Info does not guarantee that the website will be available at all times or that it will be free from errors, viruses, or other harmful components. We reserve the right to modify, suspend, or discontinue any part of the website at any time without notice.</p>
        </Section>

        <Section title="6. AI-Generated and Automated Content">
          <p>Some content on this platform may be assisted by artificial intelligence tools for drafting, summarization, categorization, or SEO optimization. All AI-assisted content is reviewed by human editors before publication. TGS Tech Info does not guarantee the accuracy of AI-assisted content and encourages readers to verify information independently.</p>
        </Section>

        <Section title="7. Forward-Looking Statements">
          <p>Certain content may contain forward-looking statements, projections, or market forecasts. These statements are based on current expectations and assumptions and are subject to risks and uncertainties. Actual results may differ materially. TGS Tech Info assumes no obligation to update forward-looking statements.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by applicable law, TGS Tech Info, its officers, directors, employees, contributors, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, this website or any content published herein.</p>
        </Section>
      </div>

      {/* COPYRIGHT */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7cff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Part II — Copyright Notice</div>

        <Section title="9. Ownership of Content">
          <p style={{ marginBottom: 12 }}>Unless otherwise stated, all content on tgstechinfo.com — including but not limited to text, articles, blogs, research reports, whitepapers, graphics, logos, icons, images, audio clips, video content, and software — is the <strong>intellectual property of TGS Tech Info</strong> or its respective content contributors and is protected by applicable copyright, trademark, and intellectual property laws.</p>
          <p>© {YEAR} TGS Tech Info. All rights reserved.</p>
        </Section>

        <Section title="10. Permitted Use">
          <p style={{ marginBottom: 12 }}>You may:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc', marginBottom: 12 }}>
            <Li>View and read content for personal, non-commercial use</Li>
            <Li>Share links to published articles with proper attribution</Li>
            <Li>Quote brief excerpts (up to 150 words) with a clear link back to the original article on tgstechinfo.com</Li>
            <Li>Download whitepapers and reports made available for download, for personal or internal business use only</Li>
          </ul>
          <p style={{ marginBottom: 12 }}>You may <strong>not</strong>:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>Reproduce, republish, or redistribute full articles or substantial portions of content without prior written permission</Li>
            <Li>Sell, license, or commercially exploit any content from this website</Li>
            <Li>Remove or alter any copyright, trademark, or proprietary notices</Li>
            <Li>Use content in any way that misrepresents TGS Tech Info or its contributors</Li>
            <Li>Scrape, crawl, or systematically extract content using automated tools</Li>
            <Li>Create derivative works based on our content without written authorization</Li>
          </ul>
        </Section>

        <Section title="11. Contributor Content Ownership">
          <p>Contributors who submit content to TGS Tech Info retain ownership of their original work. By submitting content, contributors grant TGS Tech Info a non-exclusive, worldwide, royalty-free licence to publish, distribute, and promote the content on the platform and associated channels. See our <Link to="/terms-of-use" style={{ color: '#4a7cff' }}>Terms of Use</Link> for full details.</p>
        </Section>

        <Section title="12. Trademarks">
          <p>The TGS Tech Info name, logo, and all related marks are trademarks of TGS Tech Info. All other trademarks, product names, and company names mentioned on this website are the property of their respective owners. Nothing on this website grants any licence to use any trademark without the prior written consent of the trademark owner.</p>
        </Section>

        <Section title="13. DMCA / Copyright Infringement Notice">
          <p style={{ marginBottom: 12 }}>If you believe that any content on tgstechinfo.com infringes your copyright, please send a written notice to our designated agent including:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc', marginBottom: 12 }}>
            <Li>A description of the copyrighted work you claim has been infringed</Li>
            <Li>The URL or location of the allegedly infringing content</Li>
            <Li>Your contact information (name, address, email, phone)</Li>
            <Li>A statement that you have a good faith belief that the use is not authorized</Li>
            <Li>A statement, under penalty of perjury, that the information is accurate and you are the copyright owner or authorized to act on their behalf</Li>
            <Li>Your electronic or physical signature</Li>
          </ul>
          <div style={{ padding: '16px 20px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1a1a2e' }}>DMCA Agent — TGS Tech Info</p>
            <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:legal@tgstechinfo.com" style={{ color: '#4a7cff' }}>legal@tgstechinfo.com</a></p>
            <p style={{ margin: 0, color: '#374151' }}>Subject line: DMCA Copyright Notice</p>
          </div>
        </Section>

        <Section title="14. Contact">
          <p>For permissions, licensing inquiries, or copyright questions, contact us at <a href="mailto:legal@tgstechinfo.com" style={{ color: '#4a7cff' }}>legal@tgstechinfo.com</a>.</p>
        </Section>
      </div>

    </div>
  </div>
);

export default Disclaimer;
