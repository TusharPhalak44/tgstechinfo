import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SettingOutlined,
  CheckCircleFilled,
  MailOutlined,
  BellOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  BankOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { message, Spin, Switch, Tag } from 'antd';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const SubscriberPreferences = () => {
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriber, setSubscriber] = useState(null);
  const [manualEmail, setManualEmail] = useState(emailParam);
  const [notFound, setNotFound] = useState(false);

  // Preference switches
  const [instantAlerts, setInstantAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [generalAlerts, setGeneralAlerts] = useState(true);
  const [technologyAlerts, setTechnologyAlerts] = useState(true);
  const [industryAlerts, setIndustryAlerts] = useState(true);

  // Topics
  const [availableTechs, setAvailableTechs] = useState([]);
  const [availableIndustries, setAvailableIndustries] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState(new Set()); // Set of "type:slug"

  const identifier = tokenParam || emailParam || manualEmail;

  useEffect(() => {
    if (identifier) {
      loadPreferences(identifier);
    } else {
      setLoading(false);
    }
  }, [tokenParam, emailParam]);

  const loadPreferences = async (idVal) => {
    try {
      setLoading(true);
      setNotFound(false);
      const res = await axios.get('/api/public/newsletter/preferences', {
        params: { token: idVal }
      });
      const data = res.data;
      if (data && data.subscriber) {
        setSubscriber(data.subscriber);
        setInstantAlerts(Boolean(data.subscriber.preferences_instant_alerts));
        setWeeklyDigest(Boolean(data.subscriber.preferences_weekly_digest));
        setGeneralAlerts(Boolean(data.subscriber.preferences_general_alerts));
        setTechnologyAlerts(Boolean(data.subscriber.preferences_technology_alerts));
        setIndustryAlerts(Boolean(data.subscriber.preferences_industry_alerts));

        if (data.availableTopics) {
          setAvailableTechs(data.availableTopics.technologies || []);
          setAvailableIndustries(data.availableTopics.industries || []);
        }

        // Active interests
        const topicSet = new Set();
        if (Array.isArray(data.interests)) {
          data.interests.forEach(item => {
            if (item.is_active && item.interest_type && item.interest_value) {
              topicSet.add(`${item.interest_type}:${item.interest_value.toLowerCase()}`);
            }
          });
        }
        setSelectedTopics(topicSet);
      }
    } catch (err) {
      console.warn('Failed to load preferences:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (type, slug) => {
    const key = `${type}:${slug.toLowerCase()}`;
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!subscriber) return;
    setSaving(true);
    try {
      const topicsArray = Array.from(selectedTopics).map(t => {
        const [type, value] = t.split(':');
        return { type, value };
      });

      await axios.post('/api/public/newsletter/preferences', {
        token: tokenParam || subscriber.email,
        email: subscriber.email,
        preferences: {
          preferences_instant_alerts: instantAlerts,
          preferences_weekly_digest: weeklyDigest,
          preferences_general_alerts: generalAlerts,
          preferences_technology_alerts: technologyAlerts,
          preferences_industry_alerts: industryAlerts
        },
        selectedTopics: topicsArray
      });

      message.success('Your subscription preferences have been updated!');
    } catch (err) {
      console.error('Error saving preferences:', err);
      message.error(err.response?.data?.message || 'Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      padding: '40px 16px',
      background: darkMode ? '#0B1120' : '#F8FAFC'
    }}>
      <div style={{
        maxWidth: 780,
        margin: '0 auto',
        background: darkMode ? '#1E293B' : '#FFFFFF',
        borderRadius: 16,
        boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(11,31,77,0.06)',
        border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0B1F4D 0%, #1e3a8a 100%)',
            padding: '32px 28px',
            color: '#FFFFFF',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(247, 148, 29, 0.2)',
              border: '1px solid #F7941D',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              color: '#F7941D',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 12
            }}>
              <SettingOutlined /> Subscriber Preference Center
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>
              Manage Your Content & Newsletter Preferences
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.5 }}>
              Customize what notifications and briefings you receive from TGS Tech Info. You can adjust frequency or update specific topic interests anytime.
            </p>
          </div>

          <div style={{ padding: '28px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: 13.5, color: darkMode ? '#94A3B8' : '#64748B' }}>
                  Loading your subscription preferences...
                </div>
              </div>
            ) : !subscriber || notFound ? (
              /* Lookup Form if Token Missing or Invalid */
              <div style={{ padding: '20px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <MailOutlined style={{ fontSize: 36, color: '#0AAEEF', marginBottom: 12 }} />
                  <h3 style={{ margin: '0 0 6px 0', color: darkMode ? '#F1F5F9' : '#0F172A' }}>
                    Access Your Preferences
                  </h3>
                  <p style={{ fontSize: 13.5, color: darkMode ? '#94A3B8' : '#64748B', maxWidth: 460, margin: '0 auto' }}>
                    Please enter the email address you used to subscribe to view and manage your newsletter preferences.
                  </p>
                </div>

                <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', gap: 10 }}>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={manualEmail}
                    onChange={e => setManualEmail(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: darkMode ? '1px solid #475569' : '1px solid #CBD5E1',
                      background: darkMode ? '#0F172A' : '#FFFFFF',
                      color: darkMode ? '#F1F5F9' : '#0F172A',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => {
                      if (manualEmail && manualEmail.includes('@')) {
                        loadPreferences(manualEmail.trim().toLowerCase());
                      } else {
                        message.error('Please enter a valid email address');
                      }
                    }}
                    style={{
                      padding: '12px 20px',
                      background: '#0AAEEF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Look Up
                  </button>
                </div>
                {notFound && (
                  <div style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                    No subscription found for this email. Please check spelling or subscribe from our homepage.
                  </div>
                )}
              </div>
            ) : (
              /* Active Preference Management UI */
              <div>
                {/* Subscriber Profile Info Bar */}
                <div style={{
                  background: darkMode ? '#0F172A' : '#F1F5F9',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 24,
                  border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: darkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                      Subscriber Email
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: darkMode ? '#F8FAFC' : '#0F172A' }}>
                      {subscriber.email}
                    </div>
                  </div>
                  <div>
                    <Tag color={subscriber.is_active ? 'green' : 'red'} style={{ fontWeight: 700, borderRadius: 6 }}>
                      {subscriber.is_active ? '● ACTIVE SUBSCRIBER' : '○ UNSUBSCRIBED'}
                    </Tag>
                  </div>
                </div>

                {/* Section 1: Notification Types & Frequency */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: darkMode ? '#F1F5F9' : '#0F172A',
                    margin: '0 0 14px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <BellOutlined style={{ color: '#F7941D' }} /> Notification Delivery Preferences
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: darkMode ? '#0F172A' : '#FAFAFA',
                      border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#F1F5F9' : '#0F172A' }}>
                          <ThunderboltOutlined style={{ color: '#0AAEEF', marginRight: 6 }} />
                          Instant Publication Alerts
                        </div>
                        <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                          Receive immediate notification when new content matching your topics is published.
                        </div>
                      </div>
                      <Switch checked={instantAlerts} onChange={setInstantAlerts} />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: darkMode ? '#0F172A' : '#FAFAFA',
                      border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#F1F5F9' : '#0F172A' }}>
                          <MailOutlined style={{ color: '#10B981', marginRight: 6 }} />
                          Weekly Tech Intelligence Digest
                        </div>
                        <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                          Curated weekly executive briefing delivered to your inbox every Monday.
                        </div>
                      </div>
                      <Switch checked={weeklyDigest} onChange={setWeeklyDigest} />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: darkMode ? '#0F172A' : '#FAFAFA',
                      border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#F1F5F9' : '#0F172A' }}>
                          All Editorial & General Publications
                        </div>
                        <div style={{ fontSize: 12, color: darkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                          Receive top stories and critical industry breakthroughs across all domains.
                        </div>
                      </div>
                      <Switch checked={generalAlerts} onChange={setGeneralAlerts} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Technology Topic Interests */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: darkMode ? '#F1F5F9' : '#0F172A',
                    margin: '0 0 6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <AppstoreOutlined style={{ color: '#0AAEEF' }} /> Technology Topics of Interest
                  </h3>
                  <p style={{ fontSize: 12.5, color: darkMode ? '#94A3B8' : '#64748B', margin: '0 0 12px 0' }}>
                    Click to add or remove technology areas you care about:
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableTechs.map(tech => {
                      const key = `technology:${tech.slug.toLowerCase()}`;
                      const isSelected = selectedTopics.has(key);
                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => toggleTopic('technology', tech.slug)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 20,
                            border: isSelected ? '1.5px solid #0AAEEF' : (darkMode ? '1px solid #334155' : '1px solid #CBD5E1'),
                            background: isSelected
                              ? (darkMode ? 'rgba(10, 174, 239, 0.2)' : '#E0F2FE')
                              : (darkMode ? '#0F172A' : '#FFFFFF'),
                            color: isSelected ? '#0284C7' : (darkMode ? '#CBD5E1' : '#334155'),
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: 12.5,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <CheckCircleFilled style={{ color: '#0AAEEF' }} />}
                          {tech.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Industry Verticals */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: darkMode ? '#F1F5F9' : '#0F172A',
                    margin: '0 0 6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <BankOutlined style={{ color: '#10B981' }} /> Industry Verticals
                  </h3>
                  <p style={{ fontSize: 12.5, color: darkMode ? '#94A3B8' : '#64748B', margin: '0 0 12px 0' }}>
                    Receive sector-specific research, whitepapers, and market reports:
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableIndustries.map(ind => {
                      const key = `industry:${ind.slug.toLowerCase()}`;
                      const isSelected = selectedTopics.has(key);
                      return (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => toggleTopic('industry', ind.slug)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 20,
                            border: isSelected ? '1.5px solid #10B981' : (darkMode ? '1px solid #334155' : '1px solid #CBD5E1'),
                            background: isSelected
                              ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5')
                              : (darkMode ? '#0F172A' : '#FFFFFF'),
                            color: isSelected ? '#059669' : (darkMode ? '#CBD5E1' : '#334155'),
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: 12.5,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <CheckCircleFilled style={{ color: '#10B981' }} />}
                          {ind.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Changes Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                  borderTop: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                  paddingTop: 20
                }}>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: 'linear-gradient(135deg, #0AAEEF 0%, #0284c7 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 28px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(10, 174, 239, 0.3)'
                    }}
                  >
                    <SaveOutlined /> {saving ? 'Saving...' : 'Save Preferences'}
                  </button>

                  <Link
                    to={`/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token || '')}&email=${encodeURIComponent(subscriber.email)}`}
                    style={{
                      color: '#DC2626',
                      fontSize: 13,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <DisconnectOutlined /> Unsubscribe from all emails
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default SubscriberPreferences;
