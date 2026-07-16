import React from 'react';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ 
      fontSize: 22, 
      fontWeight: 700, 
      color: '#1a1a2e', 
      marginBottom: 16, 
      paddingBottom: 12, 
      borderBottom: '2px solid #e8f0ff',
      letterSpacing: '-0.3px'
    }}>
      {title}
    </h2>
    <div style={{ 
      fontSize: 15.5, 
      color: '#374151', 
      lineHeight: 1.85,
      paddingLeft: 4
    }}>
      {children}
    </div>
  </div>
);

const Li = ({ children }) => (
  <li style={{ 
    marginBottom: 8, 
    paddingLeft: 8,
    lineHeight: 1.7,
    position: 'relative'
  }}>
    {children}
  </li>
);

const PrivacyPolicy = () => {
  const updated = 'July 8, 2026';

  return (
    <div style={{ 
      background: '#f8f9fa', 
      minHeight: '100vh', 
      padding: 0,
      display: 'flex',
      justifyContent: 'center'
    }}>
      {/* Main Container - Full Width */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        padding: '40px 48px'
      }}>
        {/* Hero Section - Full Width */}
        <div style={{
          width: '100%',
          marginBottom: 40,
          background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
          borderRadius: 16, 
          padding: '60px 48px', 
          color: '#fff'
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#60a5fa', 
            textTransform: 'uppercase', 
            letterSpacing: 2, 
            marginBottom: 12 
          }}>
            LEGAL
          </div>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 800, 
            margin: '0 0 12px', 
            color: '#fff',
            letterSpacing: '-0.5px'
          }}>
            Privacy Policy
          </h1>
          <p style={{ 
            fontSize: 16, 
            color: '#94a3b8', 
            margin: 0,
            fontWeight: 400
          }}>
            Last updated: {updated}
          </p>
        </div>

        {/* Content Body - Full Width */}
        <div style={{
          width: '100%',
          background: '#fff', 
          borderRadius: 16,
          padding: '56px 56px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)'
        }}>

          {/* Introduction Paragraphs */}
          <p style={{ 
            fontSize: 16, 
            color: '#374151', 
            lineHeight: 1.85, 
            marginBottom: 24,
            paddingLeft: 4
          }}>
            Welcome to <strong>TGS Tech Info</strong> ("<strong>TGS Tech Info</strong>," "<strong>we</strong>," "<strong>our</strong>," or "<strong>us</strong>"). We operate <strong>tgstechinfo.com</strong>, a global B2B technology publishing platform that delivers industry news, research, whitepapers, reports, webinars, interviews, blogs, events, and enterprise technology insights.
          </p>

          <p style={{ 
            fontSize: 16, 
            color: '#374151', 
            lineHeight: 1.85, 
            marginBottom: 24,
            paddingLeft: 4
          }}>
            This Privacy Policy explains how we collect, use, disclose, store, and protect your personal information when you visit our website, create an account, submit content, download resources, subscribe to newsletters, participate in webinars or events, or otherwise interact with our platform.
          </p>

          <p style={{ 
            fontSize: 16, 
            color: '#374151', 
            lineHeight: 1.85, 
            marginBottom: 40,
            paddingLeft: 4
          }}>
            By using our website, you acknowledge that you have read and understood this Privacy Policy.
          </p>

          {/* Section 1 */}
          <Section title="1. Information We Collect">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We collect information directly from you, automatically through your use of our platform, and from trusted third-party services.</p>
            
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 16, color: '#1a1a2e' }}>A. Information You Provide</p>
            
            <p style={{ fontWeight: 600, marginBottom: 8, marginTop: 16, fontSize: 15, color: '#1a1a2e' }}>Account Registration</p>
            <p style={{ marginBottom: 8, paddingLeft: 4 }}>When you create an account, we may collect:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 20, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>First Name</Li>
              <Li>Last Name</Li>
              <Li>Email Address</Li>
              <Li>Password (securely encrypted)</Li>
              <Li>Company Name (optional)</Li>
              <Li>Job Title (optional)</Li>
              <Li>Country</Li>
              <Li>Industry</Li>
              <Li>Organization Size (optional)</Li>
            </ul>

            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: '#1a1a2e' }}>Contributor Information</p>
            <p style={{ marginBottom: 8, paddingLeft: 4 }}>If you submit content for publication, we may collect:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 20, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>Author profile</Li>
              <Li>Biography</Li>
              <Li>Company information</Li>
              <Li>Profile image</Li>
              <Li>Articles</Li>
              <Li>Blogs</Li>
              <Li>News</Li>
              <Li>Whitepapers</Li>
              <Li>Reports</Li>
              <Li>Guides</Li>
              <Li>Webinars</Li>
              <Li>Event details</Li>
              <Li>Banner images</Li>
              <Li>Downloadable PDF files</Li>
              <Li>SEO metadata</Li>
              <Li>Tags</Li>
              <Li>Categories</Li>
            </ul>

            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: '#1a1a2e' }}>Gated Content Forms</p>
            <p style={{ marginBottom: 8, paddingLeft: 4 }}>When downloading premium resources such as:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 8, listStyleType: 'disc' }}>
              <Li>Whitepapers</Li>
              <Li>eBooks</Li>
              <Li>Research Reports</Li>
              <Li>Case Studies</Li>
              <Li>Webinar Recordings</Li>
            </ul>
            <p style={{ marginBottom: 8, paddingLeft: 4 }}>we may collect:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 20, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>First Name</Li>
              <Li>Last Name</Li>
              <Li>Business Email</Li>
              <Li>Contact Number</Li>
              <Li>Company</Li>
              <Li>Job Role</Li>
              <Li>Industry</Li>
              <Li>Country</Li>
              <Li>Any additional fields configured by the content publisher</Li>
            </ul>

            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: '#1a1a2e' }}>Newsletter Subscriptions</p>
            <p style={{ marginBottom: 8, paddingLeft: 4 }}>When subscribing to newsletters, we collect:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 20, listStyleType: 'disc' }}>
              <Li>Email Address</Li>
              <Li>Subscription preferences</Li>
            </ul>

            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: '#1a1a2e' }}>Contact Forms</p>
            <p style={{ paddingLeft: 4 }}>When contacting us, we collect any information voluntarily submitted, including messages and attachments.</p>
          </Section>

          {/* Section 2 */}
          <Section title="2. Information Collected Automatically">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>When you browse our website, we automatically collect certain technical information including:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '3 200px',
              columnGap: 32
            }}>
              <Li>IP Address</Li>
              <Li>Browser Type</Li>
              <Li>Operating System</Li>
              <Li>Device Information</Li>
              <Li>Language Preferences</Li>
              <Li>Screen Resolution</Li>
              <Li>Referring URLs</Li>
              <Li>Exit Pages</Li>
              <Li>Pages Viewed</Li>
              <Li>Time Spent</Li>
              <Li>Clickstream Data</Li>
              <Li>Search Queries</Li>
              <Li>Download Activity</Li>
              <Li>Content View Counts</Li>
              <Li>Session Duration</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>This information helps us improve platform performance and user experience.</p>
          </Section>

          {/* Section 3 */}
          <Section title="3. Cookies and Similar Technologies">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We use cookies, pixels, local storage, and similar technologies to:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 20, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>Maintain secure login sessions</Li>
              <Li>Remember preferences</Li>
              <Li>Improve navigation</Li>
              <Li>Measure content engagement</Li>
              <Li>Analyse website performance</Li>
              <Li>Prevent fraudulent activity</Li>
              <Li>Deliver relevant marketing communications</Li>
              <Li>Understand user interests</Li>
            </ul>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Cookies may include:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 20, listStyleType: 'disc' }}>
              <Li>Essential Cookies</Li>
              <Li>Functional Cookies</Li>
              <Li>Analytics Cookies</Li>
              <Li>Performance Cookies</Li>
              <Li>Marketing Cookies (where legally permitted)</Li>
            </ul>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Users may disable cookies through browser settings, although certain features may not function properly.</p>
            <p style={{ paddingLeft: 4 }}>Please refer to our separate Cookie Policy for additional information.</p>
          </Section>

          {/* Section 4 */}
          <Section title="4. How We Use Your Information">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We use personal information to:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '2 260px',
              columnGap: 32
            }}>
              <Li>Create and manage user accounts</Li>
              <Li>Authenticate users securely using JWT authentication</Li>
              <Li>Publish and manage submitted content</Li>
              <Li>Review contributor submissions</Li>
              <Li>Deliver downloadable resources</Li>
              <Li>Send approval or rejection notifications</Li>
              <Li>Deliver newsletters</Li>
              <Li>Respond to enquiries</Li>
              <Li>Personalize content recommendations</Li>
              <Li>Improve website functionality</Li>
              <Li>Monitor platform security</Li>
              <Li>Detect abuse and fraudulent activities</Li>
              <Li>Maintain analytics and reporting</Li>
              <Li>Generate aggregated platform statistics</Li>
              <Li>Comply with legal obligations</Li>
              <Li>Enforce our Terms of Use</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>We do not sell personal information.</p>
          </Section>

          {/* Section 5 */}
          <Section title="5. Marketing Communications">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>With your consent or where otherwise permitted by law, we may send:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>Industry newsletters</Li>
              <Li>Technology updates</Li>
              <Li>Webinar invitations</Li>
              <Li>Event announcements</Li>
              <Li>Whitepaper releases</Li>
              <Li>Product announcements</Li>
              <Li>Research publications</Li>
              <Li>Sponsored industry content</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>You may unsubscribe at any time using the unsubscribe link included in our emails.</p>
          </Section>

          {/* Section 6 */}
          <Section title="6. Legal Basis for Processing (GDPR)">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>If you reside within the European Economic Area (EEA), Switzerland, or the United Kingdom, we process personal data under one or more of the following legal bases:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 20, listStyleType: 'disc' }}>
              <Li>Performance of a Contract</Li>
              <Li>Legitimate Business Interests</Li>
              <Li>Consent</Li>
              <Li>Compliance with Legal Obligations</Li>
              <Li>Protection of Vital Interests where applicable</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>You may withdraw consent at any time without affecting prior lawful processing.</p>
          </Section>

          {/* Section 7 - Modified for better readability */}
          <Section title="7. Sharing of Information">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We never sell personal information.</p>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We may share information with:</p>
            
            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 16, color: '#1a1a2e' }}>Service Providers</p>
            <p style={{ marginBottom: 8, paddingLeft: 4 }}>Including:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 20, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>Cloud hosting providers</Li>
              <Li>Email delivery services</Li>
              <Li>Analytics providers</Li>
              <Li>Security monitoring services</Li>
              <Li>CDN providers</Li>
              <Li>Customer support platforms</Li>
            </ul>
            <p style={{ marginBottom: 20, paddingLeft: 4 }}>All providers are contractually required to protect your information.</p>

            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 16, color: '#1a1a2e' }}>Content Sponsors</p>
            <p style={{ marginBottom: 12, paddingLeft: 4 }}>Some premium content such as whitepapers, webinars, reports, and case studies may be sponsored by third-party organizations.</p>
            <p style={{ marginBottom: 20, paddingLeft: 4 }}>Where clearly disclosed before submission, information you provide through gated content forms may be shared with the sponsoring organization for follow-up regarding the requested resource.</p>

            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 16, color: '#1a1a2e' }}>Webhook Integrations</p>
            <p style={{ marginBottom: 12, paddingLeft: 4 }}>Organizations publishing content through our platform may configure secure webhook integrations.</p>
            <p style={{ marginBottom: 12, paddingLeft: 4 }}>When a visitor submits a gated content form, submitted information may be securely transmitted to the publisher's designated CRM, marketing automation platform, or lead management system.</p>
            <p style={{ marginBottom: 20, paddingLeft: 4 }}>We are not responsible for how third parties process information once it has been transferred to their systems.</p>

            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 16, color: '#1a1a2e' }}>Legal Requirements</p>
            <p style={{ marginBottom: 12, paddingLeft: 4 }}>We may disclose information when required to:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 20, listStyleType: 'disc' }}>
              <Li>Comply with applicable laws</Li>
              <Li>Respond to court orders or lawful governmental requests</Li>
              <Li>Protect our rights, users, or platform</Li>
              <Li>Investigate fraud or abuse</Li>
            </ul>

            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 16, color: '#1a1a2e' }}>Business Transfers</p>
            <p style={{ paddingLeft: 4 }}>In connection with a merger, acquisition, financing, or sale of assets, user information may be transferred subject to appropriate confidentiality protections.</p>
          </Section>

          {/* Section 8-18 with consistent styling */}
          <Section title="8. Analytics and Advertising">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We may use trusted analytics and advertising technologies to understand platform usage and improve content performance.</p>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>These services may collect information regarding:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 16, listStyleType: 'disc' }}>
              <Li>Page interactions</Li>
              <Li>Device identifiers</Li>
              <Li>Browser information</Li>
              <Li>Referral sources</Li>
              <Li>Campaign performance</Li>
              <Li>Conversion tracking</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>Analytics data is generally aggregated and used to improve our services.</p>
          </Section>

          <Section title="9. User Generated Content">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Articles, blogs, comments, author profiles, interviews, and other content submitted by contributors may become publicly accessible once published.</p>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Please avoid submitting confidential or sensitive personal information within publicly published content.</p>
            <p style={{ paddingLeft: 4 }}>Authors remain responsible for ensuring they have the necessary rights to publish submitted materials.</p>
          </Section>

          <Section title="10. Data Retention">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We retain information only as long as reasonably necessary.</p>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Typical retention periods include:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>User accounts: until account deletion or prolonged inactivity</Li>
              <Li>Published articles: indefinitely unless removal is requested and approved</Li>
              <Li>Contributor information: while contributor accounts remain active</Li>
              <Li>Newsletter subscriptions: until unsubscribe</Li>
              <Li>Contact enquiries: as necessary to resolve requests</Li>
              <Li>Download history: for analytics and compliance purposes</Li>
              <Li>Security logs: as required for fraud prevention</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>Where legally required, certain information may be retained longer.</p>
          </Section>

          <Section title="11. Data Security">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We implement industry-standard technical and organizational safeguards including:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>HTTPS encryption</Li>
              <Li>TLS-secured communications</Li>
              <Li>Bcrypt password hashing</Li>
              <Li>JWT authentication</Li>
              <Li>Role-based access control</Li>
              <Li>API rate limiting</Li>
              <Li>Input validation</Li>
              <Li>Malware scanning of uploaded files</Li>
              <Li>Secure cloud infrastructure</Li>
              <Li>Firewall protection</Li>
              <Li>Regular security monitoring</Li>
              <Li>Restricted administrative access</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>While we strive to protect all information, no internet transmission or electronic storage system can be guaranteed to be completely secure.</p>
          </Section>

          <Section title="12. International Data Transfers">
            <p style={{ paddingLeft: 4 }}>Because TGS Tech Info serves a global audience, personal information may be processed or stored in countries outside your country of residence.</p>
            <p style={{ paddingLeft: 4, marginTop: 12 }}>Where required by law, we implement appropriate safeguards including contractual protections and applicable international data transfer mechanisms.</p>
          </Section>

          <Section title="13. Children's Privacy">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Our platform is intended solely for business professionals and individuals aged 18 years or older.</p>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We do not knowingly collect personal information from children under the age of 16.</p>
            <p style={{ paddingLeft: 4 }}>If such information is identified, we will promptly delete it.</p>
          </Section>

          <Section title="14. Your Privacy Rights">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Depending upon your location, applicable laws may provide you with rights including:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '2 240px',
              columnGap: 24
            }}>
              <Li>Access your personal information</Li>
              <Li>Correct inaccurate information</Li>
              <Li>Delete personal information</Li>
              <Li>Restrict processing</Li>
              <Li>Object to processing</Li>
              <Li>Data portability</Li>
              <Li>Withdraw consent</Li>
              <Li>Unsubscribe from marketing communications</Li>
              <Li>Lodge a complaint with a supervisory authority</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>Requests may be submitted using the contact information below.</p>
          </Section>

          <Section title="15. Third-Party Websites">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Our platform may link to:</p>
            <ul style={{ 
              paddingLeft: 28, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: '2 200px',
              columnGap: 24
            }}>
              <Li>Technology vendors</Li>
              <Li>Event organizers</Li>
              <Li>Research organizations</Li>
              <Li>Industry partners</Li>
              <Li>Advertisers</Li>
              <Li>Sponsor websites</Li>
            </ul>
            <p style={{ paddingLeft: 4 }}>We do not control these third-party websites and encourage users to review their respective privacy policies.</p>
          </Section>

          <Section title="16. AI-Assisted Content and Automation">
            <p style={{ paddingLeft: 4 }}>TGS Tech Info may utilize artificial intelligence, machine learning, or automated technologies to assist with content categorization, moderation, spam detection, SEO optimization, recommendations, analytics, or workflow automation.</p>
            <p style={{ paddingLeft: 4, marginTop: 12 }}>Such technologies are used to support editorial processes and improve user experience but do not replace human editorial oversight where appropriate.</p>
          </Section>

          <Section title="17. Changes to This Privacy Policy">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>We may revise this Privacy Policy periodically.</p>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>Material updates may be communicated through:</p>
            <ul style={{ paddingLeft: 28, marginBottom: 16, listStyleType: 'disc' }}>
              <Li>Website notices</Li>
              <Li>Email notifications</Li>
              <Li>In-platform notifications</Li>
            </ul>
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>The "Last Updated" date indicates the effective version of this policy.</p>
            <p style={{ paddingLeft: 4 }}>Continued use of the platform after updates constitutes acceptance of the revised Privacy Policy.</p>
          </Section>

          <Section title="18. Contact Us">
            <p style={{ marginBottom: 16, paddingLeft: 4 }}>For privacy-related questions, requests, or concerns, please contact:</p>
            <div style={{ 
              marginTop: 16, 
              padding: '24px 28px', 
              background: '#f0f4ff', 
              borderRadius: 12, 
              borderLeft: '4px solid #4a7cff' 
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 17, color: '#1a1a2e' }}>TGS Tech Info</p>
              <p style={{ margin: '0 0 6px', color: '#374151', fontSize: 15 }}>
                Email: <a href="mailto:contact@tgstechinfo.com" style={{ color: '#4a7cff', textDecoration: 'none', fontWeight: 500 }}>contact@tgstechinfo.com</a>
              </p>
              <p style={{ margin: 0, color: '#374151', fontSize: 15 }}>
                Website: <a href="https://tgstechinfo.com" style={{ color: '#4a7cff', textDecoration: 'none', fontWeight: 500 }}>https://tgstechinfo.com</a>
              </p>
            </div>
            <p style={{ marginTop: 16, paddingLeft: 4 }}>We will respond to legitimate privacy requests in accordance with applicable data protection laws.</p>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;