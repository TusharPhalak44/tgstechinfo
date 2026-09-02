import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const SiteSettingsContext = createContext(null);

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get('/api/site-settings/public');
      setSettings(response.data.settings || null);
    } catch (error) {
      console.error('Failed to load site settings:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Derived logo helpers so each component doesn't need to repeat fallback logic
  const navbarLogo = settings?.website_navbar_logo || settings?.website_main_logo || settings?.website_logo || '';
  const footerLogo = settings?.website_footer_logo || settings?.website_main_logo || settings?.website_logo || '';
  const mainLogo   = settings?.website_main_logo   || settings?.website_logo || '';
  // CMS logos — used in admin and user sidebars
  const cmsLogo1   = settings?.cms_logo1 || navbarLogo || mainLogo || '';
  const cmsLogo2   = settings?.cms_logo2 || '';
  const cmsLogo    = cmsLogo1 || cmsLogo2 || '';
  const favicon    = settings?.website_favicon || settings?.cms_favicon || '';

  // Logo sizes with safe defaults
  let logoSizes = {
    main: { height: 60, width: 200 },
    navbar: { height: 40, width: 120 },
    footer: { height: 50, width: 150 },
    cms_logo1: { height: 42, width: 195 },
    cms_logo2: { height: 36, width: 36 },
  };
  if (settings?.logo_sizes) {
    try {
      const raw = typeof settings.logo_sizes === 'string' ? JSON.parse(settings.logo_sizes) : settings.logo_sizes;
      if (raw) {
        logoSizes = {
          main:   { height: raw.main?.height || raw.website_main_logo?.height || 60, width: raw.main?.width || raw.website_main_logo?.width || 200 },
          navbar: { height: raw.navbar?.height || raw.website_navbar_logo?.height || 40, width: raw.navbar?.width || raw.website_navbar_logo?.width || 120 },
          footer: { height: raw.footer?.height || raw.website_footer_logo?.height || 50, width: raw.footer?.width || raw.website_footer_logo?.width || 150 },
          cms_logo1: { height: raw.cms_logo1?.height || 42, width: raw.cms_logo1?.width || 195 },
          cms_logo2: { height: raw.cms_logo2?.height || 36, width: raw.cms_logo2?.width || 36 },
        };
      }
    } catch (_) {}
  }

  return (
    <SiteSettingsContext.Provider value={{
      settings,
      loading,
      navbarLogo,
      footerLogo,
      mainLogo,
      cmsLogo,
      cmsLogo1,
      cmsLogo2,
      favicon,
      logoSizes,
      refreshSettings: fetchSettings
    }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
