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
        background: 'rgba(0, 0, 0, 0.5)',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 14,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 12px 48px rgba(11,31,77,0.16)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            id="cookie-modal-title"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-heading)',
            }}
          >
            Cookie Preferences
          </Text>
          <Button
            type="text"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted)',
            }}
            aria-label="Close"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          <Paragraph
            style={{
              fontSize: 13,
              color: 'var(--color-body)',
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Customize your cookie preferences below. You can change these settings at any time.
          </Paragraph>

          {/* Cookie Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cookieCategories.map((category) => (
              <div
                key={category.key}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  background: category.alwaysActive
                    ? 'var(--color-primary-light)'
                    : 'transparent',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--color-heading)',
                        }}
                      >
                        {category.title}
                      </Text>
                      {category.alwaysActive && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 10,
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
                        color: 'var(--color-body)',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      {category.description}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        display: 'block',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>Examples:</span>{' '}
                      {category.examples}
                    </Text>
                  </div>

                  {/* Toggle Switch */}
                  {!category.alwaysActive && (
                    <button
                      onClick={() => handleToggle(category.key)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: preferences[category.key]
                          ? 'var(--color-primary)'
                          : 'var(--color-border)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                      aria-label={`Toggle ${category.title}`}
                      aria-pressed={preferences[category.key]}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: preferences[category.key] ? 22 : 2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button
            onClick={onClose}
            style={{
              borderRadius: 24,
              height: 36,
              padding: '0 20px',
              fontSize: 13,
              fontWeight: 600,
              borderColor: 'var(--color-border)',
              color: 'var(--color-heading)',
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            style={{
              borderRadius: 24,
              height: 36,
              padding: '0 20px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
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
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -4px 24px rgba(11,31,77,0.12)',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
          className="cookie-banner-content"
        >
          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <Text
              id="cookie-banner-title"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--color-heading)',
              }}
            >
              We Value Your Privacy
            </Text>
            <Paragraph
              id="cookie-banner-description"
              style={{
                fontSize: 13,
                color: 'var(--color-body)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              We use cookies to enhance your experience, analyze usage, and assist in our marketing efforts.
              By clicking "Accept All", you consent to our use of cookies.
            </Paragraph>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Button
              type="primary"
              onClick={handleAcceptAll}
              style={{
                borderRadius: 24,
                height: 36,
                padding: '0 20px',
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              }}
            >
              Accept All
            </Button>
            <Button
              onClick={handleRejectAll}
              style={{
                borderRadius: 24,
                height: 36,
                padding: '0 20px',
                fontSize: 13,
                fontWeight: 600,
                borderColor: 'var(--color-border)',
                color: 'var(--color-heading)',
              }}
            >
              Reject Non-Essential
            </Button>
            <Button
              type="link"
              onClick={handleCustomize}
              style={{
                borderRadius: 24,
                height: 36,
                padding: '0 16px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}
            >
              Customize
            </Button>
          </div>

          {/* Footer Links */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Link
              to="/privacy-policy"
              style={{
                fontSize: 12,
                color: 'var(--color-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)';
              }}
            >
              Privacy Policy
            </Link>
            <span style={{ fontSize: 12, color: 'var(--color-border)' }}>•</span>
            <Link
              to="/cookie-policy"
              style={{
                fontSize: 12,
                color: 'var(--color-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)';
              }}
            >
              Cookie Policy
            </Link>
            <span style={{ fontSize: 12, color: 'var(--color-border)' }}>•</span>
            <Link
              to="/terms-of-use"
              style={{
                fontSize: 12,
                color: 'var(--color-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-muted)';
              }}
            >
              Terms of Use
            </Link>
          </div>
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
