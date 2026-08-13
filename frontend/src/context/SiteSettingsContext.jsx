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
  // CMS logo — used in the admin login page and dashboard; uploaded via Admin > Settings
  const cmsLogo    = settings?.cms_logo1 || settings?.cms_logo2 || mainLogo || '';
  const favicon    = settings?.website_favicon || '';

  // Logo sizes with safe defaults
  let logoSizes = { main: { height: 60, width: 200 }, navbar: { height: 40, width: 120 }, footer: { height: 50, width: 150 } };
  if (settings?.logo_sizes) {
    try {
      const raw = typeof settings.logo_sizes === 'string' ? JSON.parse(settings.logo_sizes) : settings.logo_sizes;
      if (raw) {
        logoSizes = {
          main:   { height: raw.main?.height   || 60,  width: raw.main?.width   || 200 },
          navbar: { height: raw.navbar?.height  || 40,  width: raw.navbar?.width  || 120 },
          footer: { height: raw.footer?.height  || 50,  width: raw.footer?.width  || 150 },
        };
      }
    } catch (_) {}
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, navbarLogo, footerLogo, mainLogo, cmsLogo, favicon, logoSizes, refreshSettings: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
