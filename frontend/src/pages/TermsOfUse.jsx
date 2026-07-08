import React from 'react';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e8f0ff' }}>
      {title}
    </h2>
    <div style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85 }}>{children}</div>
  </div>
);

const Li = ({ children }) => (
  <li style={{ marginBottom: 6, paddingLeft: 4 }}>{children}</li>
);

const TermsOfUse = () => {
  const updated = 'July 8, 2026';

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>
      {/* Hero */}
      <div style={{
        maxWidth: 860, margin: '0 auto 40px',
        background: 'linear-gradient(135deg,#0f3460 0%,#16213e 60%,#1a1a2e 100%)',
        borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Legal
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 12px', color: '#fff' }}>Terms of Use</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Last updated: {updated}</p>
      </div>

      {/* Body */}
      <div style={{
        maxWidth: 860, margin: '0 auto',
        background: '#fff', borderRadius: 16,
        padding: '48px 48px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)'
      }}>

        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 24 }}>
          Welcome to <strong>TGS Tech Info</strong> ("<strong>Platform</strong>", "<strong>we</strong>", "<strong>our</strong>", or "<strong>us</strong>"). By accessing or using <strong>tgstechinfo.com</strong>, you agree to be bound by these Terms of Use ("<strong>Terms</strong>"). If you do not agree to these Terms, please do not use the Platform.
        </p>

        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 36 }}>
          These Terms apply to all visitors, registered users, content contributors, and content publishers. By using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.
        </p>

        <Section title="1. About the Platform">
          <p>TGS Tech Info is a global B2B technology and IT industry publishing platform that enables professionals and organisations to publish, discover, and engage with content including articles, blogs, news, interviews, whitepapers, webinars, and events. The Platform also provides gated content delivery, newsletter subscriptions, and content management tools for registered contributors and administrators.</p>
        </Section>

        <Section title="2. Eligibility">
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>You must be at least <strong>18 years of age</strong> to register an account or submit content.</Li>
            <Li>By using the Platform, you represent that you have the legal capacity to enter into a binding agreement.</Li>
            <Li>If you are using the Platform on behalf of a company or organisation, you represent that you have authority to bind that entity to these Terms.</Li>
          </ul>
        </Section>

        <Section title="3. Account Registration">
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>You must provide <strong>accurate, current, and complete</strong> information during registration (first name, last name, email address).</Li>
            <Li>You are <strong>solely responsible</strong> for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</Li>
            <Li>You must notify us immediately at <a href="mailto:contact@tgstechinfo.com" style={{ color: '#6c5ce7' }}>contact@tgstechinfo.com</a> if you suspect unauthorised access to your account.</Li>
            <Li>We reserve the right to <strong>suspend or terminate</strong> accounts that violate these Terms or are found to be inactive, fraudulent, or abusive.</Li>
            <Li>Accounts are <strong>non-transferable</strong>.</Li>
          </ul>
        </Section>

        <Section title="4. User Roles and Permissions">
          <p style={{ marginBottom: 12 }}>The Platform operates with the following roles:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li><strong>Visitor (unauthenticated):</strong> may browse published content, search articles, and submit gated content forms.</Li>
            <Li><strong>Registered User / Contributor:</strong> may create, edit, and submit content for review; view submission history; manage their profile; and receive notifications.</Li>
            <Li><strong>Administrator:</strong> may review, approve, reject, publish, or request changes to submitted content; manage user accounts; edit any content; and access submission data.</Li>
          </ul>
          <p style={{ marginTop: 12 }}>Role assignments are made at the discretion of TGS Tech Info administrators.</p>
        </Section>

        <Section title="5. Content Submission and Publishing">
          <p style={{ fontWeight: 600, marginBottom: 8 }}>5.1 Contributor Responsibilities</p>
          <p style={{ marginBottom: 12 }}>By submitting content to TGS Tech Info, you represent and warrant that:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc', marginBottom: 16 }}>
            <Li>You are the original author or have <strong>full rights</strong> to submit the content.</Li>
            <Li>The content does not <strong>infringe</strong> any third-party intellectual property rights, including copyright, trademark, or trade secrets.</Li>
            <Li>The content is <strong>accurate, not misleading</strong>, and complies with applicable laws and regulations.</Li>
            <Li>The content does not contain defamatory, obscene, hateful, discriminatory, or otherwise unlawful material.</Li>
            <Li>The content does not contain malware, spam, or unsolicited commercial communications.</Li>
            <Li>Any SEO metadata, tags, and descriptions accurately reflect the content.</Li>
          </ul>

          <p style={{ fontWeight: 600, marginBottom: 8 }}>5.2 Content Review Process</p>
          <p style={{ marginBottom: 12 }}>All submitted content undergoes an editorial review process. Administrators may:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc', marginBottom: 16 }}>
            <Li>Approve and publish content as submitted.</Li>
            <Li>Request changes before publication.</Li>
            <Li>Reject content that does not meet editorial or quality standards.</Li>
            <Li>Edit content directly for formatting, SEO, or compliance purposes.</Li>
          </ul>
          <p>Submission does not guarantee publication. We reserve the right to decline any content at our sole discretion.</p>

          <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 16 }}>5.3 Licence Grant</p>
          <p style={{ marginBottom: 12 }}>By submitting content, you grant TGS Tech Info a <strong>non-exclusive, worldwide, royalty-free licence</strong> to host, display, distribute, promote, and archive the content on the Platform and associated channels (including newsletters and social media). You retain ownership of your content.</p>

          <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 16 }}>5.4 Gated Content and Lead Generation</p>
          <p>Content publishers may configure gated content (requiring form submission for access) and external webhook integrations to receive lead data. Publishers are <strong>solely responsible</strong> for how they collect, use, and store lead data received via webhooks, and must comply with applicable data protection laws including GDPR and CCPA.</p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p style={{ marginBottom: 12 }}>You agree <strong>not</strong> to:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>Submit false, misleading, or plagiarised content.</Li>
            <Li>Impersonate any person, company, or organisation.</Li>
            <Li>Attempt to gain unauthorised access to any part of the Platform, other user accounts, or backend systems.</Li>
            <Li>Use automated bots, scrapers, or crawlers to extract content or data without prior written consent.</Li>
            <Li>Circumvent rate limiting, authentication, or security measures.</Li>
            <Li>Upload files containing viruses, malware, or malicious code.</Li>
            <Li>Use the Platform to send spam, phishing communications, or unsolicited bulk messages.</Li>
            <Li>Engage in any activity that disrupts, damages, or impairs the Platform's functionality.</Li>
            <Li>Violate any applicable local, national, or international law or regulation.</Li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <p style={{ marginBottom: 12 }}>All Platform design, branding, logos, software code, and non-user-generated content are the <strong>exclusive property of TGS Tech Info</strong> and are protected by applicable intellectual property laws.</p>
          <p>You may not reproduce, distribute, modify, or create derivative works from Platform content without our prior written permission, except as expressly permitted (e.g., sharing published articles with proper attribution).</p>
        </Section>

        <Section title="8. Newsletter">
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>By subscribing to our newsletter, you consent to receive <strong>periodic email communications</strong> about technology news, platform updates, and industry insights.</Li>
            <Li>You may <strong>unsubscribe</strong> at any time by clicking the unsubscribe link in any newsletter email or by contacting us at <a href="mailto:contact@tgstechinfo.com" style={{ color: '#6c5ce7' }}>contact@tgstechinfo.com</a>.</Li>
            <Li>We will <strong>not share</strong> your newsletter subscription email with third parties for their own marketing purposes.</Li>
          </ul>
        </Section>

        <Section title="9. Third-Party Links and Integrations">
          <p>The Platform may contain links to third-party websites, tools, or services. These links are provided for convenience only. TGS Tech Info does <strong>not endorse, control, or assume responsibility</strong> for the content, privacy practices, or availability of third-party sites. Your use of third-party services is at your own risk and subject to their respective terms and policies.</p>
        </Section>

        <Section title="10. Disclaimers">
          <p style={{ marginBottom: 12 }}>The Platform and all content are provided on an <strong>"as is" and "as available"</strong> basis without warranties of any kind, express or implied, including but not limited to:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc', marginBottom: 12 }}>
            <Li>Accuracy, completeness, or timeliness of published content.</Li>
            <Li>Fitness for a particular business purpose.</Li>
            <Li>Uninterrupted or error-free operation of the Platform.</Li>
          </ul>
          <p>Content published on TGS Tech Info represents the views of individual contributors and does <strong>not constitute professional advice</strong> (legal, financial, technical, or otherwise). Always seek qualified professional advice for your specific situation.</p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p style={{ marginBottom: 12 }}>To the fullest extent permitted by applicable law, TGS Tech Info and its officers, directors, employees, and affiliates shall <strong>not be liable</strong> for any:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>Indirect, incidental, special, consequential, or punitive damages.</Li>
            <Li>Loss of profits, revenue, data, or business opportunities.</Li>
            <Li>Damages arising from reliance on content published on the Platform.</Li>
            <Li>Unauthorised access to or alteration of your data.</Li>
          </ul>
          <p style={{ marginTop: 12 }}>Our <strong>total liability</strong> to you for any claim arising from use of the Platform shall not exceed the amount you paid us (if any) in the twelve months preceding the claim.</p>
        </Section>

        <Section title="12. Indemnification">
          <p>You agree to <strong>indemnify, defend, and hold harmless</strong> TGS Tech Info and its affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or related to: (a) your use of the Platform; (b) content you submit; (c) your violation of these Terms; or (d) your violation of any third-party rights.</p>
        </Section>

        <Section title="13. Account Termination">
          <p style={{ marginBottom: 12 }}>We reserve the right to <strong>suspend or permanently terminate</strong> your account, with or without notice, if:</p>
          <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
            <Li>You violate these Terms or our Privacy Policy.</Li>
            <Li>Your account is used for fraudulent, abusive, or illegal activity.</Li>
            <Li>We are required to do so by law or court order.</Li>
          </ul>
          <p style={{ marginTop: 12 }}>You may request account deletion at any time by contacting <a href="mailto:contact@tgstechinfo.com" style={{ color: '#6c5ce7' }}>contact@tgstechinfo.com</a>. Upon deletion, your published content may remain on the Platform unless you specifically request its removal.</p>
        </Section>

        <Section title="14. Governing Law and Dispute Resolution">
          <p>These Terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Platform shall be resolved through <strong>good-faith negotiation</strong>. If unresolved, disputes shall be submitted to <strong>binding arbitration</strong> in accordance with the rules of the American Arbitration Association, or to the courts of competent jurisdiction in California.</p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p style={{ marginBottom: 12 }}>We may update these Terms from time to time to reflect changes in our services, legal requirements, or business practices. We will notify registered users of <strong>material changes</strong> via email or in-platform notification.</p>
          <p>The "Last updated" date at the top of this page reflects the most recent revision. Continued use of the Platform after changes take effect constitutes your <strong>acceptance</strong> of the revised Terms.</p>
        </Section>

        <Section title="16. Contact Us">
          <p style={{ marginBottom: 12 }}>If you have any questions about these Terms of Use, please contact us:</p>
          <div style={{ marginTop: 16, padding: '20px 24px', background: '#f5f0ff', borderRadius: 12, borderLeft: '4px solid #6c5ce7' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1a1a2e' }}>TGS Tech Info</p>
            <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:contact@tgstechinfo.com" style={{ color: '#6c5ce7' }}>contact@tgstechinfo.com</a></p>
            <p style={{ margin: 0, color: '#374151' }}>Website: <a href="https://tgstechinfo.com" style={{ color: '#6c5ce7' }}>https://tgstechinfo.com</a></p>
          </div>
        </Section>

      </div>
    </div>
  );
};

export default TermsOfUse;