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

const UserAccountPolicy = () => (
  <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 16px' }}>

    {/* Hero */}
    <div style={{ maxWidth: 900, margin: '0 auto 40px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', borderRadius: 16, padding: '48px 40px', color: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Legal</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>User Account &amp; Platform Usage Policy</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Last updated: {UPDATED}</p>
    </div>

    {/* Content */}
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '48px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 32 }}>
        This User Account &amp; Platform Usage Policy governs the registration, access, and use of the TGS Tech Info platform (<strong>tgstechinfo.com</strong>). By creating an account or using our platform, you agree to comply with this policy in addition to our <Link to="/terms-of-use" style={{ color: '#4a7cff' }}>Terms of Use</Link> and <Link to="/privacy-policy" style={{ color: '#4a7cff' }}>Privacy Policy</Link>.
      </p>

      <Section title="1. User Registration Requirements">
        <p style={{ marginBottom: 12 }}>To register an account on TGS Tech Info, you must:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Be at least <strong>18 years of age</strong> or the age of majority in your jurisdiction.</Li>
          <Li>Provide accurate, complete, and current information during registration, including your full name, valid email address, and any other required details.</Li>
          <Li>Not register on behalf of another person without their explicit authorization.</Li>
          <Li>Not use a false identity, impersonate any person or entity, or misrepresent your affiliation with any organization.</Li>
          <Li>Agree to receive account-related communications from TGS Tech Info at the email address provided.</Li>
        </ul>
        <p style={{ marginTop: 12 }}>We reserve the right to reject any registration or suspend any account that does not meet these requirements.</p>
      </Section>

      <Section title="2. Account Responsibilities">
        <p style={{ marginBottom: 12 }}>As a registered user, you are solely responsible for:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>All activities that occur under your account, whether or not authorized by you.</Li>
          <Li>Keeping your account information accurate and up to date.</Li>
          <Li>Ensuring that your use of the platform complies with all applicable laws and regulations.</Li>
          <Li>Any content you submit, publish, or share through the platform.</Li>
          <Li>Notifying TGS Tech Info immediately at <a href="mailto:support@tgstechinfo.com" style={{ color: '#4a7cff' }}>support@tgstechinfo.com</a> if you become aware of any unauthorized use of your account.</Li>
        </ul>
      </Section>

      <Section title="3. Login Credentials and Account Security">
        <p style={{ marginBottom: 12 }}>You are responsible for maintaining the confidentiality and security of your login credentials. Specifically:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Choose a strong, unique password and do not reuse passwords from other services.</Li>
          <Li>Do not share your username or password with any third party.</Li>
          <Li>Do not allow others to access the platform using your credentials.</Li>
          <Li>Log out of your account after each session, especially on shared or public devices.</Li>
          <Li>TGS Tech Info will never ask for your password via email, phone, or any unsolicited communication.</Li>
        </ul>
        <p style={{ marginTop: 12 }}>TGS Tech Info is not liable for any loss or damage arising from your failure to maintain account security.</p>
      </Section>

      <Section title="4. Acceptable Use of the Platform">
        <p style={{ marginBottom: 12 }}>You agree to use the TGS Tech Info platform only for lawful purposes and in a manner consistent with this policy. Acceptable uses include:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Creating and submitting original content (articles, blogs, news, interviews, whitepapers, webinars, events, eBooks) for review and publication.</Li>
          <Li>Accessing published content for personal, educational, or professional purposes.</Li>
          <Li>Engaging with platform features such as newsletters, downloads, and event registrations.</Li>
          <Li>Communicating with the TGS Tech Info team through designated channels.</Li>
        </ul>
      </Section>

      <Section title="5. Prohibited Activities">
        <p style={{ marginBottom: 12 }}>The following activities are strictly prohibited on the TGS Tech Info platform:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Submitting false, misleading, defamatory, obscene, or plagiarized content.</Li>
          <Li>Uploading or distributing malware, viruses, or any harmful code.</Li>
          <Li>Attempting to gain unauthorized access to any part of the platform, other user accounts, or backend systems.</Li>
          <Li>Scraping, crawling, or harvesting data from the platform without prior written consent.</Li>
          <Li>Using the platform to send unsolicited communications (spam) to other users or third parties.</Li>
          <Li>Impersonating TGS Tech Info staff, editors, or other registered users.</Li>
          <Li>Engaging in any activity that disrupts, overloads, or impairs the platform's infrastructure.</Li>
          <Li>Using the platform for any illegal activity, including but not limited to fraud, copyright infringement, or data theft.</Li>
          <Li>Circumventing any access controls, content restrictions, or security measures implemented by TGS Tech Info.</Li>
        </ul>
        <p style={{ marginTop: 12 }}>Violation of these prohibitions may result in immediate account suspension or termination and may be reported to relevant authorities.</p>
      </Section>

      <Section title="6. User-Generated Content">
        <p style={{ marginBottom: 12 }}>When you submit content to TGS Tech Info, you agree that:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>You own or have the necessary rights, licenses, and permissions to submit the content.</Li>
          <Li>Your content does not infringe any third-party intellectual property, privacy, or other rights.</Li>
          <Li>You grant TGS Tech Info a non-exclusive, royalty-free, worldwide license to publish, display, distribute, and promote your content on the platform and associated channels.</Li>
          <Li>All submitted content is subject to editorial review and approval before publication. TGS Tech Info reserves the right to reject, edit, or remove any content at its sole discretion.</Li>
          <Li>You remain responsible for the accuracy and legality of all content you submit.</Li>
        </ul>
      </Section>

      <Section title="7. Account Suspension or Termination">
        <p style={{ marginBottom: 12 }}>TGS Tech Info reserves the right to suspend or permanently terminate your account, with or without prior notice, if:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>You violate any provision of this policy, the Terms of Use, or any applicable law.</Li>
          <Li>You provide false or misleading registration information.</Li>
          <Li>Your account is involved in fraudulent, abusive, or harmful activity.</Li>
          <Li>You engage in repeated submission of content that violates our editorial guidelines.</Li>
          <Li>We are required to do so by law or a regulatory authority.</Li>
        </ul>
        <p style={{ marginTop: 12 }}>Upon termination, your right to access the platform ceases immediately. Content previously published may be retained or removed at TGS Tech Info's discretion. You may request account deletion by contacting <a href="mailto:support@tgstechinfo.com" style={{ color: '#4a7cff' }}>support@tgstechinfo.com</a>.</p>
      </Section>

      <Section title="8. Confidentiality of Account Information">
        <p style={{ marginBottom: 12 }}>You are responsible for maintaining the confidentiality of all account-related information. This includes:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li>Not disclosing your login credentials to any third party under any circumstances.</Li>
          <Li>Ensuring that any device used to access your account is adequately secured with a password or biometric lock.</Li>
          <Li>Promptly updating your password if you suspect it has been compromised.</Li>
          <Li>Being aware that TGS Tech Info staff will never request your password through any channel.</Li>
        </ul>
      </Section>

      <Section title="9. Compliance with Applicable Laws">
        <p style={{ marginBottom: 12 }}>By using the TGS Tech Info platform, you agree to comply with all applicable local, national, and international laws and regulations, including but not limited to:</p>
        <ul style={{ paddingLeft: 24, listStyleType: 'disc' }}>
          <Li><strong>India:</strong> Information Technology Act, 2000; Digital Personal Data Protection Act, 2023; and all rules and regulations thereunder.</Li>
          <Li><strong>Intellectual Property Laws:</strong> Copyright Act and applicable trademark laws governing the content you submit or access.</Li>
          <Li><strong>Anti-Spam Laws:</strong> CAN-SPAM Act, CASL, and equivalent regulations applicable in your jurisdiction.</Li>
          <Li><strong>Data Protection Laws:</strong> GDPR, UK GDPR, CCPA/CPRA, and other applicable privacy regulations.</Li>
        </ul>
        <p style={{ marginTop: 12 }}>Any use of the platform that violates applicable law is strictly prohibited and may result in account termination and legal action.</p>
      </Section>

      {/* Contact box */}
      <div style={{ marginTop: 40, padding: '20px 24px', background: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #4a7cff' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1a1a2e' }}>Questions about this policy?</p>
        <p style={{ margin: '0 0 4px', color: '#374151' }}>Email: <a href="mailto:support@tgstechinfo.com" style={{ color: '#4a7cff' }}>support@tgstechinfo.com</a></p>
        <p style={{ margin: 0, color: '#374151' }}>Privacy Officer: <a href="mailto:privacy@tgstechinfo.com" style={{ color: '#4a7cff' }}>privacy@tgstechinfo.com</a></p>
      </div>

    </div>
  </div>
);

export default UserAccountPolicy;
