import React from 'react';
import { Link } from 'react-router-dom';

const UPDATED = 'July 8, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>{title}</h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>;

const AcceptableUsePolicy = () => (
  <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
    {/* Hero */}
    <div style={{ maxWidth: 860, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>Acceptable Use Policy</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Last updated: {UPDATED}</p>
    </div>

    <div style={{ maxWidth: 860, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 36 }}>
        This Acceptable Use Policy ("AUP") governs your use of <strong>tgstechinfo.com</strong> and all associated services, APIs, and platforms operated by TGS Tech Info. By accessing or using our platform, you agree to comply with this policy. This AUP supplements our <Link to="/terms-of-use" style={{ color: '#4a7cff' }}>Terms of Use</Link> and <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>.
      </p>

      <Section title="1. Scope">
        <p>This policy applies to all users of tgstechinfo.com including visitors, registered users, content contributors, content publishers, API users, and any party accessing our platform programmatically or through integrations.</p>
      </Section>

      <Section title="2. Permitted Uses">
        <p style={{ marginBottom: 12 }}>You may use our platform to:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Read, share, and engage with published content for professional and business purposes</Li>
          <Li>Register an account and submit original content for editorial review</Li>
          <Li>Subscribe to newsletters and download gated resources</Li>
          <Li>Register for webinars and events</Li>
          <Li>Contact us through official contact forms</Li>
          <Li>Integrate with our platform via authorized APIs and webhooks</Li>
          <Li>Conduct legitimate B2B research and market intelligence activities</Li>
        </ul>
      </Section>

      <Section title="3. Prohibited Content">
        <p style={{ marginBottom: 12 }}>You must not submit, publish, or distribute content that:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Is false, misleading, deceptive, or fraudulent</Li>
          <Li>Infringes any third-party intellectual property rights including copyright, trademark, or trade secrets</Li>
          <Li>Is defamatory, harassing, threatening, abusive, or discriminatory</Li>
          <Li>Contains obscene, pornographic, or sexually explicit material</Li>
          <Li>Promotes violence, terrorism, or illegal activities</Li>
          <Li>Contains malware, viruses, ransomware, spyware, or any malicious code</Li>
          <Li>Constitutes spam, phishing, or unsolicited bulk communications</Li>
          <Li>Violates any applicable local, national, or international law or regulation</Li>
          <Li>Discloses confidential information of third parties without authorization</Li>
          <Li>Impersonates any person, company, or organization</Li>
        </ul>
      </Section>

      <Section title="4. Prohibited Technical Activities">
        <p style={{ marginBottom: 12 }}>You must not:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Use automated bots, scrapers, crawlers, or spiders to extract content or data without prior written consent from TGS Tech Info</Li>
          <Li>Attempt to gain unauthorized access to any part of the platform, user accounts, databases, or backend systems</Li>
          <Li>Circumvent, disable, or interfere with security features, authentication mechanisms, or access controls</Li>
          <Li>Conduct denial-of-service (DoS) or distributed denial-of-service (DDoS) attacks</Li>
          <Li>Perform penetration testing, vulnerability scanning, or security assessments without prior written authorization</Li>
          <Li>Reverse engineer, decompile, or disassemble any software or technology used by the platform</Li>
          <Li>Inject malicious code, SQL injection, cross-site scripting (XSS), or other attack vectors</Li>
          <Li>Harvest email addresses or personal information from the platform for unsolicited communications</Li>
          <Li>Use the platform to mine cryptocurrency or conduct resource-intensive unauthorized computations</Li>
          <Li>Interfere with or disrupt the integrity or performance of the platform or its infrastructure</Li>
        </ul>
      </Section>

      <Section title="5. No Scraping Policy">
        <p style={{ marginBottom: 12 }}>Systematic scraping, crawling, or automated extraction of content from tgstechinfo.com is strictly prohibited without prior written authorization. This includes:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Scraping articles, author profiles, or metadata for commercial databases</Li>
          <Li>Extracting contact information or business data for marketing purposes</Li>
          <Li>Bulk downloading of whitepapers, reports, or gated content</Li>
          <Li>Using AI training pipelines to harvest content without consent</Li>
        </ul>
        <p style={{ marginTop: 12 }}>Authorized research or academic use may be permitted with prior written approval. Contact <a href="mailto:legal@tgstechinfo.com" style={{ color: '#4a7cff' }}>legal@tgstechinfo.com</a> for licensing inquiries.</p>
      </Section>

      <Section title="6. Email and Marketing Communications">
        <p style={{ marginBottom: 12 }}>When using our platform for B2B marketing or lead generation activities, you must:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Comply with CAN-SPAM Act, CASL, GDPR, and all applicable email marketing laws</Li>
          <Li>Include a clear and functional unsubscribe mechanism in all commercial emails</Li>
          <Li>Honor opt-out and unsubscribe requests promptly</Li>
          <Li>Not send unsolicited bulk emails or spam to contacts obtained through our platform</Li>
          <Li>Accurately identify yourself as the sender in all communications</Li>
          <Li>Maintain suppression lists and honor do-not-contact requests</Li>
        </ul>
      </Section>

      <Section title="7. API and Integration Use">
        <p style={{ marginBottom: 12 }}>If you access our platform via API or webhook integrations, you must:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Use API credentials only for authorized purposes</Li>
          <Li>Not share API keys or credentials with unauthorized parties</Li>
          <Li>Comply with rate limits and usage quotas</Li>
          <Li>Not use API access to extract data in bulk beyond authorized limits</Li>
          <Li>Secure all data received via webhooks in accordance with applicable data protection laws</Li>
        </ul>
      </Section>

      <Section title="8. Account Security Responsibilities">
        <p style={{ marginBottom: 12 }}>You are responsible for:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Maintaining the confidentiality of your account credentials</Li>
          <Li>All activities conducted under your account</Li>
          <Li>Immediately notifying us of any unauthorized access or security breach</Li>
          <Li>Not sharing your account with others</Li>
        </ul>
      </Section>

      <Section title="9. Enforcement and Consequences">
        <p style={{ marginBottom: 12 }}>Violations of this Acceptable Use Policy may result in:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Immediate suspension or permanent termination of your account</Li>
          <Li>Removal of content without notice</Li>
          <Li>IP address blocking or rate limiting</Li>
          <Li>Legal action including civil and criminal proceedings</Li>
          <Li>Reporting to relevant law enforcement or regulatory authorities</Li>
          <Li>Claims for damages, costs, and legal fees</Li>
        </ul>
        <p style={{ marginTop: 12 }}>TGS Tech Info reserves the right to investigate suspected violations and cooperate with law enforcement agencies.</p>
      </Section>

      <Section title="10. Reporting Violations">
        <p style={{ marginBottom: 12 }}>If you become aware of any violation of this policy, please report it to us immediately:</p>
        <div style={{ padding: '16px 20px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1a1a2e' }}>TGS Tech Info — Trust &amp; Safety</p>
          <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:abuse@tgstechinfo.com" style={{ color: '#4a7cff' }}>abuse@tgstechinfo.com</a></p>
          <p style={{ margin: 0, color: '#374151' }}>Security issues: <a href="mailto:security@tgstechinfo.com" style={{ color: '#4a7cff' }}>security@tgstechinfo.com</a></p>
        </div>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>We may update this Acceptable Use Policy from time to time. Continued use of the platform after changes take effect constitutes acceptance of the revised policy. The "Last Updated" date at the top of this page reflects the most recent revision.</p>
      </Section>

    </div>
  </div>
);

export default AcceptableUsePolicy;
