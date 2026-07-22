import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../../context/CookieContext';

const { Text, Paragraph } = Typography;

// Export the modal separately for use in Footer
export const CookiePreferencesModal = ({ visible, onClose }) => {
  const { consent, savePreferences, updateConsent } = useCookieConsent();
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: consent?.functional_cookies || false,
    analytics: consent?.analytics_cookies || false,
    marketing: consent?.marketing_cookies || false,
  });

  // Update preferences when consent changes
  React.useEffect(() => {
    if (consent) {
      setPreferences({
        necessary: true,
        functional: consent.functional_cookies || false,
        analytics: consent.analytics_cookies || false,
        marketing: consent.marketing_cookies || false,
      });
    }
  }, [consent]);

  const handleToggle = (category) => {
    if (category === 'necessary') return; // Necessary cookies are always enabled
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = async () => {
    const result = consent?.uuid
      ? await updateConsent({
          functional_cookies: preferences.functional,
          analytics_cookies: preferences.analytics,
          marketing_cookies: preferences.marketing,
        })
      : await savePreferences({
          functional: preferences.functional,
          analytics: preferences.analytics,
          marketing: preferences.marketing,
        });

    if (result.success) {
      onClose();
    }
  };

  const cookieCategories = [
    {
      key: 'necessary',
      title: 'Necessary Cookies',
      description: 'Essential for the website to function properly.',
      examples: 'Authentication, security, core features',
      alwaysActive: true,
    },
    {
      key: 'functional',
      title: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization.',
      examples: 'Preferences, language settings, themes',
      alwaysActive: false,
    },
    {
      key: 'analytics',
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors use our website.',
      examples: 'Page views, bounce rates, traffic sources',
      alwaysActive: false,
    },
    {
      key: 'marketing',
      title: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements.',
      examples: 'Targeted ads, social media integration',
      alwaysActive: false,
    },
  ];

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-modal-title"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11,31,77,0.7)',
        backdropFilter: 'blur(8px)',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderRadius: 20,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 64px rgba(11,31,77,0.3)',
          border: '1px solid rgba(11,31,77,0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid rgba(11,31,77,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
            borderRadius: '20px 20px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <Text
              id="cookie-modal-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: 0.3,
              }}
            >
              Cookie Preferences
            </Text>
          </div>
          <Button
            type="text"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.1)',
            }}
            aria-label="Close"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          <Paragraph
            style={{
              fontSize: 13,
              color: '#475569',
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Customize your cookie preferences below. You can change these settings at any time.
          </Paragraph>

          {/* Cookie Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cookieCategories.map((category) => (
              <div
                key={category.key}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  border: category.alwaysActive
                    ? '2px solid #0B1F4D'
                    : '1px solid rgba(11,31,77,0.1)',
                  background: category.alwaysActive
                    ? 'linear-gradient(135deg, #EAF2FF 0%, #FFFFFF 100%)'
                    : '#FFFFFF',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#0F172A',
                        }}
                      >
                        {category.title}
                      </Text>
                      {category.alwaysActive && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
                            color: '#FFFFFF',
                            padding: '3px 10px',
                            borderRadius: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Always Active
                        </span>
                      )}
                    </div>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        display: 'block',
                        marginBottom: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {category.description}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        display: 'block',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Examples:</span>{' '}
                      {category.examples}
                    </Text>
                  </div>

                  {/* Toggle Switch */}
                  {!category.alwaysActive && (
                    <button
                      onClick={() => handleToggle(category.key)}
                      style={{
                        width: 48,
                        height: 26,
                        borderRadius: 13,
                        background: preferences[category.key]
                          ? 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)'
                          : '#CBD5E1',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s',
                        flexShrink: 0,
                        boxShadow: preferences[category.key]
                          ? '0 4px 12px rgba(247,148,29,0.3)'
                          : 'none',
                      }}
                      aria-label={`Toggle ${category.title}`}
                      aria-pressed={preferences[category.key]}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: preferences[category.key] ? 25 : 3,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          transition: 'left 0.3s',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 28px',
            borderTop: '1px solid rgba(11,31,77,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            background: '#F8FAFC',
            borderRadius: '0 0 20px 20px',
          }}
        >
          <Button
            onClick={onClose}
            style={{
              borderRadius: 10,
              height: 40,
              padding: '0 24px',
              fontSize: 13,
              fontWeight: 600,
              borderColor: 'rgba(11,31,77,0.2)',
              color: '#0F172A',
              background: '#FFFFFF',
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            style={{
              borderRadius: 10,
              height: 40,
              padding: '0 24px',
              fontSize: 13,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 100%)',
              borderColor: 'transparent',
              boxShadow: '0 4px 16px rgba(11,31,77,0.2)',
            }}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

const CookieBanner = () => {
  const { showBanner, acceptAll, rejectAll, hideBanner } = useCookieConsent();
  const [showCustomize, setShowCustomize] = useState(false);

  console.log('CookieBanner - showBanner state:', showBanner);

  if (!showBanner) {
    console.log('CookieBanner - Banner hidden, returning null');
    return null;
  }

  console.log('CookieBanner - Rendering banner');

  const handleAcceptAll = async () => {
    console.log('CookieBanner - handleAcceptAll called');
    // Hide banner immediately for better UX
    hideBanner();
    await acceptAll();
  };

  const handleRejectAll = async () => {
    console.log('CookieBanner - handleRejectAll called');
    // Hide banner immediately for better UX
    hideBanner();
    await rejectAll();
  };

  const handleCustomize = () => {
    console.log('CookieBanner - handleCustomize called');
    setShowCustomize(true);
    hideBanner();
  };

  return (
    <>
      <div
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0B1F4D 0%, #123A8C 50%, #0B1F4D 100%)',
          boxShadow: '0 -8px 32px rgba(11,31,77,0.25)',
          padding: '24px 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
          className="cookie-banner-content"
        >
          {/* Icon Section */}
          <div
            style={{
              flexShrink: 0,
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(247,148,29,0.3)',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          {/* Content Section */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Text
              id="cookie-banner-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: 0.5,
              }}
            >
              Your Privacy Matters
            </Text>
            <Paragraph
              id="cookie-banner-description"
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.85)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              We use cookies to personalize your experience and analyze traffic. Your data stays secure with us.
            </Paragraph>
          </div>

          {/* Actions Section */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Button
              onClick={handleRejectAll}
              style={{
                borderRadius: 8,
                height: 40,
                padding: '0 20px',
                fontSize: 13,
                fontWeight: 600,
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              Reject
            </Button>
            <Button
              type="primary"
              onClick={handleAcceptAll}
              style={{
                borderRadius: 8,
                height: 40,
                padding: '0 24px',
                fontSize: 13,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #F7941D 0%, #E67E00 100%)',
                borderColor: 'transparent',
                boxShadow: '0 4px 16px rgba(247,148,29,0.4)',
              }}
            >
              Accept All
            </Button>
            <Button
              onClick={handleCustomize}
              style={{
                borderRadius: 8,
                height: 40,
                padding: '0 16px',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                background: 'transparent',
                border: 'none',
              }}
            >
              Customize
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div
          style={{
            maxWidth: 1200,
            margin: '16px auto 0',
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 16,
          }}
        >
          <Link
            to="/privacy-policy"
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F7941D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Privacy Policy
          </Link>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>•</span>
          <Link
            to="/cookie-policy"
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F7941D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Cookie Policy
          </Link>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>•</span>
          <Link
            to="/terms-of-use"
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F7941D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Terms of Use
          </Link>
        </div>
      </div>

      {/* Customize Modal */}
      {showCustomize && (
        <CookiePreferencesModal
          visible={showCustomize}
          onClose={() => setShowCustomize(false)}
        />
      )}
    </>
  );
};

export default CookieBanner;
