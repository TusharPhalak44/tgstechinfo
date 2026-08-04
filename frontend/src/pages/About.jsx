import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Section = ({ title, children, darkMode }) => (
  <div style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
    <h2 style={{
      fontSize: 'clamp(18px, 2.5vw, 22px)',
      fontWeight: 700,
      color: darkMode ? '#f1f5f9' : '#1a1a2e',
      marginBottom: 12,
      paddingBottom: 10,
      borderBottom: darkMode ? '2px solid #334155' : '2px solid #e8f0ff',
      letterSpacing: '-0.3px'
    }}>
      {title}
    </h2>
    <div style={{
      fontSize: 'clamp(14px, 1.5vw, 15.5px)',
      color: darkMode ? '#cbd5e1' : '#374151',
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

const About = () => {
  const { darkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{
      background: darkMode ? '#0f172a' : '#f8f9fa',
      minHeight: '100vh',
      padding: 'clamp(24px, 3vw, 32px) 0',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      marginTop: 0,
      paddingTop: 'clamp(24px, 3vw, 32px)'
    }}>
      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        padding: '0 clamp(12px, 2vw, 24px)',
        marginTop: 0
      }}>
        {/* Hero Section */}
        <div style={{
          width: '100%',
          marginBottom: 'clamp(24px, 4vw, 32px)',
          background: 'linear-gradient(135deg, #0B1F4D 0%, #1a1a2e 60%, #0f3460 100%)',
          borderRadius: 16, 
          padding: 'clamp(32px, 6vw, 48px) clamp(24px, 4vw, 32px)', 
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            fontSize: 'clamp(12px, 1.5vw, 14px)', 
            fontWeight: 600, 
            color: '#F7941D', 
            textTransform: 'uppercase', 
            letterSpacing: 2, 
            marginBottom: 12 
          }}>
            About Us
          </div>
          <h1 style={{ 
            fontSize: 'clamp(28px, 5vw, 42px)', 
            fontWeight: 800, 
            margin: '0 0 16px', 
            color: '#fff',
            letterSpacing: '-0.5px'
          }}>
            About TGS Tech Info
          </h1>
          <p style={{ 
            fontSize: 'clamp(16px, 2vw, 20px)', 
            color: '#94a3b8', 
            margin: '0 0 20px',
            fontWeight: 400,
            maxWidth: 800,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Empowering Businesses Through Content, Knowledge, and Digital Reach
          </p>
        </div>

        {/* Content Body */}
        <div style={{
          width: '100%',
          background: darkMode ? '#1e293b' : '#fff',
          borderRadius: 16,
          padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)'
        }}>
          <p style={{
            fontSize: 'clamp(15px, 1.6vw, 17px)',
            color: darkMode ? '#cbd5e1' : '#374151',
            lineHeight: 1.9,
            marginBottom: 20,
            paddingLeft: 4,
            fontWeight: 500
          }}>
            TGS Tech Info is a modern Content Management System (CMS) and digital publishing platform developed to help businesses, marketers, technology professionals, and organizations publish, manage, and distribute high-quality content to a global audience.
          </p>

          <p style={{
            fontSize: 'clamp(15px, 1.6vw, 17px)',
            color: darkMode ? '#cbd5e1' : '#374151',
            lineHeight: 1.9,
            marginBottom: 20,
            paddingLeft: 4
          }}>
            As a division of Taraj Global Solutions Pvt. Ltd., founded in 2021, TGS Tech Info combines powerful content publishing capabilities with audience engagement, lead generation opportunities, and knowledge sharing in a single platform.
          </p>

          <p style={{
            fontSize: 'clamp(15px, 1.6vw, 17px)',
            color: darkMode ? '#cbd5e1' : '#374151',
            lineHeight: 1.9,
            marginBottom: 24,
            paddingLeft: 4
          }}>
            Unlike traditional blogging websites, TGS Tech Info is a user-driven content ecosystem where registered users, businesses, publishers, and industry experts can create, publish, organize, and manage their own content while reaching readers across multiple industries.
          </p>

          <p style={{
            fontSize: 'clamp(15px, 1.6vw, 17px)',
            color: darkMode ? '#cbd5e1' : '#374151',
            lineHeight: 1.9,
            marginBottom: 24,
            paddingLeft: 4
          }}>
            Our platform is built to support organizations that want to strengthen their digital presence, establish thought leadership, educate their audience, and maximize the value of their content.
          </p>

          {/* Who We Are */}
          <Section title="Who We Are" darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              TGS Tech Info was created with a vision to build a scalable content ecosystem that enables organizations and professionals to publish valuable knowledge without the complexity of managing their own publishing infrastructure.
            </p>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              Today, our platform serves as a centralized destination for:
            </p>
            <ul style={{ 
              paddingLeft: 24, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: 'clamp(1, 2, 2) clamp(200px, 25vw, 240px)',
              columnGap: 20
            }}>
              <Li>Technology insights</Li>
              <Li>Business articles</Li>
              <Li>Industry research</Li>
              <Li>Whitepapers</Li>
              <Li>eBooks</Li>
              <Li>Case studies</Li>
              <Li>Product announcements</Li>
              <Li>Press releases</Li>
              <Li>Marketing resources</Li>
              <Li>Educational content</Li>
              <Li>Professional opinions</Li>
              <Li>Business news</Li>
            </ul>
            <p style={{ paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              Whether you are an individual contributor or a global enterprise, TGS Tech Info provides the tools needed to publish, organize, and distribute content effectively.
            </p>
          </Section>

          {/* More Than a Publishing Website */}
          <Section title="More Than a Publishing Website" darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              TGS Tech Info is designed as a comprehensive Content Management System (CMS) rather than a conventional publishing website.
            </p>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 'clamp(16px, 1.8vw, 18px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>Registered users can:</p>
            <ul style={{ 
              paddingLeft: 24, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: 'clamp(1, 2, 2) clamp(200px, 25vw, 240px)',
              columnGap: 20
            }}>
              <Li>Create and manage their own content</Li>
              <Li>Publish articles and blogs</Li>
              <Li>Upload whitepapers and downloadable assets</Li>
              <Li>Share case studies</Li>
              <Li>Organize content by category</Li>
              <Li>Manage author profiles</Li>
              <Li>Build their content portfolio</Li>
              <Li>Update published resources</Li>
              <Li>Reach a wider professional audience</Li>
            </ul>
            <p style={{ paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              The platform simplifies content publishing while maintaining a professional reading experience for visitors.
            </p>
          </Section>

          {/* Helping Businesses Grow */}
          <Section title="Helping Businesses Grow Through Content" darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              Content has become one of the most valuable assets for modern organizations.
            </p>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              TGS Tech Info enables businesses to transform that content into measurable business opportunities by improving discoverability, increasing audience engagement, and extending digital reach.
            </p>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 'clamp(16px, 1.8vw, 18px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>Organizations use our platform to:</p>
            <ul style={{ 
              paddingLeft: 24, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: 'clamp(1, 2, 2) clamp(200px, 25vw, 240px)',
              columnGap: 20
            }}>
              <Li>Build brand authority</Li>
              <Li>Demonstrate industry expertise</Li>
              <Li>Educate potential customers</Li>
              <Li>Improve search engine visibility</Li>
              <Li>Publish product updates</Li>
              <Li>Share market research</Li>
              <Li>Increase website traffic</Li>
              <Li>Generate marketing-qualified opportunities</Li>
              <Li>Support content marketing initiatives</Li>
            </ul>
          </Section>

          {/* Built for B2B Growth */}
          <Section title="Built for B2B Growth" darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              As part of Taraj Global Solutions, a company specializing in B2B demand generation and digital marketing, we understand how content influences the modern buyer's journey.
            </p>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 'clamp(16px, 1.8vw, 18px)', color: darkMode ? '#f1f5f9' : '#1a1a2e' }}>Our platform supports businesses across industries including:</p>
            <ul style={{ 
              paddingLeft: 24, 
              marginBottom: 16, 
              listStyleType: 'disc',
              columns: 'clamp(1, 2, 2) clamp(200px, 25vw, 240px)',
              columnGap: 20
            }}>
              <Li>Software & SaaS</Li>
              <Li>Information Technology</Li>
              <Li>Cybersecurity</Li>
              <Li>Artificial Intelligence</Li>
              <Li>Cloud Computing</Li>
              <Li>Manufacturing</Li>
              <Li>Healthcare</Li>
              <Li>Finance</Li>
              <Li>Human Resources</Li>
              <Li>Professional Services</Li>
              <Li>Retail</Li>
              <Li>Telecommunications</Li>
              <Li>Education</Li>
            </ul>
            <p style={{ paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              By combining valuable content with an engaged professional audience, we help organizations increase visibility and strengthen their digital presence.
            </p>
          </Section>

          {/* Why Choose TGS Tech Info */}
          <Section title="Why Choose TGS Tech Info" darkMode={darkMode}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              marginTop: 16
            }}>
              {[
                { title: 'Professional Content Management', desc: 'Manage all your content from one centralized platform with an intuitive publishing experience.' },
                { title: 'User Registration & Author Portal', desc: 'Every registered user can build and manage their own content library through a secure dashboard.' },
                { title: 'Search Engine Optimized Publishing', desc: 'Every article is structured to support search engine best practices, improving discoverability across major search engines.' },
                { title: 'Thought Leadership', desc: 'Publish expert insights that position your organization as a trusted industry authority.' },
                { title: 'Business Visibility', desc: 'Increase your online presence by publishing content that reaches professionals searching for industry knowledge.' },
                { title: 'Scalable Publishing', desc: 'Whether publishing one article or hundreds of resources, the platform is designed to scale with your content strategy.' },
                { title: 'Content Organization', desc: 'Categorize and structure information for an improved reading experience and easier navigation.' },
                { title: 'Knowledge Sharing', desc: 'Create an accessible repository of valuable industry information for customers, partners, and professionals.' }
              ].map((item, index) => (
                <div key={index} style={{
                  background: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#f8f9fa',
                  border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 20,
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    fontSize: 'clamp(16px, 1.8vw, 18px)',
                    fontWeight: 700,
                    color: darkMode ? '#f1f5f9' : '#1a1a2e',
                    marginBottom: 8,
                    color: '#F7941D'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: 'clamp(14px, 1.5vw, 15px)',
                    color: darkMode ? '#cbd5e1' : '#374151',
                    lineHeight: 1.7,
                    margin: 0
                  }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Our Mission */}
          <Section title="Our Mission" darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              Our mission is to make professional content publishing accessible, efficient, and impactful for businesses and individuals worldwide.
            </p>
            <p style={{ paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              We aim to create a trusted platform where knowledge is shared, ideas are exchanged, and organizations can establish meaningful connections with their audiences through high-quality content.
            </p>
          </Section>

          {/* Our Vision */}
          <Section title="Our Vision" darkMode={darkMode}>
            <p style={{ paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              To become a globally recognized digital content platform that empowers organizations, professionals, and creators to publish, manage, and distribute valuable knowledge while driving innovation, education, and business growth.
            </p>
          </Section>

          {/* About Taraj Global Solutions */}
          <Section title="About Taraj Global Solutions Pvt. Ltd." darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              TGS Tech Info is proudly developed and operated by Taraj Global Solutions Pvt. Ltd., a technology-driven organization established in 2021.
            </p>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              Taraj Global specializes in digital marketing, B2B demand generation, content marketing, lead generation, business growth solutions, and marketing technologies that help organizations expand their reach across global markets.
            </p>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              The experience gained through supporting international businesses has helped shape TGS Tech Info into a platform focused on delivering professional, scalable, and user-centric content publishing.
            </p>
          </Section>

          {/* Our Core Values */}
          <Section title="Our Core Values" darkMode={darkMode}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginTop: 16
            }}>
              {[
                'Quality Content',
                'Transparency',
                'Innovation',
                'Knowledge Sharing',
                'User-Centric Development',
                'Digital Excellence',
                'Continuous Improvement',
                'Trust & Integrity'
              ].map((value, index) => (
                <div key={index} style={{
                  background: darkMode ? 'rgba(247, 148, 29, 0.1)' : '#fff7e6',
                  border: darkMode ? '1px solid #F7941D' : '1px solid #ffd591',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                  fontWeight: 600,
                  color: darkMode ? '#F7941D' : '#d46b08',
                  fontSize: 'clamp(14px, 1.5vw, 15px)'
                }}>
                  {value}
                </div>
              ))}
            </div>
          </Section>

          {/* Join the Community */}
          <Section title="Join the TGS Tech Info Community" darkMode={darkMode}>
            <p style={{ marginBottom: 12, paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              Whether you're an individual expert, startup, enterprise, marketer, researcher, or business leader, TGS Tech Info provides the platform to publish your ideas, share your expertise, and connect with a growing professional audience.
            </p>
            <p style={{ paddingLeft: 4, fontSize: 'clamp(15px, 1.6vw, 17px)', color: darkMode ? '#cbd5e1' : '#374151' }}>
              We believe great content deserves the right platform, and we're committed to helping every creator and organization maximize the value of their knowledge through modern content management and digital publishing.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default About;
