/**
 * Dynamic Script Loader for Cookie Consent
 * Loads and removes tracking scripts based on user consent
 */

// Script definitions with consent requirements
const SCRIPT_DEFINITIONS = {
  googleAnalytics4: {
    name: 'Google Analytics 4',
    category: 'analytics',
    load: (trackingId) => {
      // Load GA4
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingId}');
      `;
      document.head.appendChild(script2);

      return [script1, script2];
    },
    remove: () => {
      // Remove GA4 scripts and dataLayer
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      scripts.forEach(script => script.remove());
      window.dataLayer = [];
    }
  },
  googleTagManager: {
    name: 'Google Tag Manager',
    category: 'analytics',
    load: (containerId) => {
      const script = document.createElement('script');
      script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${containerId}');
      `;
      document.head.appendChild(script);

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
      document.body.prepend(noscript);

      return [script, noscript];
    },
    remove: () => {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.innerHTML && script.innerHTML.includes('googletagmanager')) {
          script.remove();
        }
      });
      const noscripts = document.querySelectorAll('noscript iframe[src*="googletagmanager"]');
      noscripts.forEach(noscript => noscript.parentElement.remove());
      window.dataLayer = [];
    }
  },
  hubSpot: {
    name: 'HubSpot',
    category: 'marketing',
    load: (portalId) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.id = 'hs-script-loader';
      script.async = true;
      script.defer = true;
      script.src = `//js.hs-scripts.com/${portalId}.js`;
      document.head.appendChild(script);

      return [script];
    },
    remove: () => {
      const script = document.getElementById('hs-script-loader');
      if (script) script.remove();
    }
  },
  metaPixel: {
    name: 'Meta Pixel (Facebook)',
    category: 'marketing',
    load: (pixelId) => {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.innerHTML = `
        <img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
      `;
      document.body.appendChild(noscript);

      return [script, noscript];
    },
    remove: () => {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.innerHTML && script.innerHTML.includes('connect.facebook.net')) {
          script.remove();
        }
      });
      const noscripts = document.querySelectorAll('noscript img[src*="facebook.com/tr"]');
      noscripts.forEach(noscript => noscript.parentElement.remove());
    }
  },
  linkedinInsight: {
    name: 'LinkedIn Insight Tag',
    category: 'marketing',
    load: (partnerId) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        _linkedin_partner_id = "${partnerId}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        (function(){var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);})();
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.innerHTML = `
        <img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=${partnerId}&fmt=gif" />
      `;
      document.body.appendChild(noscript);

      return [script, noscript];
    },
    remove: () => {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.innerHTML && script.innerHTML.includes('linkedin.com')) {
          script.remove();
        }
      });
      const noscripts = document.querySelectorAll('noscript img[src*="linkedin.com"]');
      noscripts.forEach(noscript => noscript.parentElement.remove());
    }
  },
  microsoftClarity: {
    name: 'Microsoft Clarity',
    category: 'analytics',
    load: (projectId) => {
      const script = document.createElement('script');
      script.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `;
      document.head.appendChild(script);

      return [script];
    },
    remove: () => {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.innerHTML && script.innerHTML.includes('clarity.ms')) {
          script.remove();
        }
      });
    }
  }
};

// Loaded scripts tracking
const loadedScripts = new Map();

/**
 * Load a script based on consent
 * @param {string} scriptKey - Script key from SCRIPT_DEFINITIONS
 * @param {string} scriptId - Script ID (tracking ID, container ID, etc.)
 * @returns {boolean} Success status
 */
export const loadScript = (scriptKey, scriptId) => {
  try {
    const scriptDef = SCRIPT_DEFINITIONS[scriptKey];
    if (!scriptDef) {
      console.warn(`Script definition not found: ${scriptKey}`);
      return false;
    }

    // Check if already loaded
    if (loadedScripts.has(scriptKey)) {
      console.log(`Script already loaded: ${scriptKey}`);
      return true;
    }

    // Load the script
    const elements = scriptDef.load(scriptId);
    loadedScripts.set(scriptKey, elements);
    
    console.log(`Script loaded: ${scriptDef.name}`);
    return true;
  } catch (error) {
    console.error(`Error loading script ${scriptKey}:`, error);
    return false;
  }
};

/**
 * Remove a script
 * @param {string} scriptKey - Script key from SCRIPT_DEFINITIONS
 * @returns {boolean} Success status
 */
export const removeScript = (scriptKey) => {
  try {
    const scriptDef = SCRIPT_DEFINITIONS[scriptKey];
    if (!scriptDef) {
      console.warn(`Script definition not found: ${scriptKey}`);
      return false;
    }

    // Check if loaded
    if (!loadedScripts.has(scriptKey)) {
      console.log(`Script not loaded: ${scriptKey}`);
      return true;
    }

    // Remove the script
    scriptDef.remove();
    loadedScripts.delete(scriptKey);
    
    console.log(`Script removed: ${scriptDef.name}`);
    return true;
  } catch (error) {
    console.error(`Error removing script ${scriptKey}:`, error);
    return false;
  }
};

/**
 * Load all scripts for a given consent category
 * @param {Object} consent - Consent object
 * @param {Object} scriptIds - Object mapping script keys to their IDs
 */
export const loadScriptsByConsent = (consent, scriptIds = {}) => {
  if (!consent) return;

  // Load analytics scripts
  if (consent.analytics_cookies) {
    Object.keys(scriptIds).forEach(key => {
      const scriptDef = SCRIPT_DEFINITIONS[key];
      if (scriptDef && scriptDef.category === 'analytics' && scriptIds[key]) {
        loadScript(key, scriptIds[key]);
      }
    });
  }

  // Load marketing scripts
  if (consent.marketing_cookies) {
    Object.keys(scriptIds).forEach(key => {
      const scriptDef = SCRIPT_DEFINITIONS[key];
      if (scriptDef && scriptDef.category === 'marketing' && scriptIds[key]) {
        loadScript(key, scriptIds[key]);
      }
    });
  }

  // Load functional scripts
  if (consent.functional_cookies) {
    Object.keys(scriptIds).forEach(key => {
      const scriptDef = SCRIPT_DEFINITIONS[key];
      if (scriptDef && scriptDef.category === 'functional' && scriptIds[key]) {
        loadScript(key, scriptIds[key]);
      }
    });
  }
};

/**
 * Remove all scripts that don't match current consent
 * @param {Object} consent - Current consent object
 * @param {Object} scriptIds - Object mapping script keys to their IDs
 */
export const removeScriptsByConsent = (consent, scriptIds = {}) => {
  if (!consent) {
    // Remove all scripts if no consent
    loadedScripts.forEach((_, key) => removeScript(key));
    return;
  }

  // Remove analytics scripts if consent revoked
  if (!consent.analytics_cookies) {
    Object.keys(scriptIds).forEach(key => {
      const scriptDef = SCRIPT_DEFINITIONS[key];
      if (scriptDef && scriptDef.category === 'analytics') {
        removeScript(key);
      }
    });
  }

  // Remove marketing scripts if consent revoked
  if (!consent.marketing_cookies) {
    Object.keys(scriptIds).forEach(key => {
      const scriptDef = SCRIPT_DEFINITIONS[key];
      if (scriptDef && scriptDef.category === 'marketing') {
        removeScript(key);
      }
    });
  }

  // Remove functional scripts if consent revoked
  if (!consent.functional_cookies) {
    Object.keys(scriptIds).forEach(key => {
      const scriptDef = SCRIPT_DEFINITIONS[key];
      if (scriptDef && scriptDef.category === 'functional') {
        removeScript(key);
      }
    });
  }
};

/**
 * Update scripts based on consent changes
 * @param {Object} newConsent - New consent object
 * @param {Object} oldConsent - Old consent object
 * @param {Object} scriptIds - Object mapping script keys to their IDs
 */
export const updateScriptsByConsent = (newConsent, oldConsent, scriptIds = {}) => {
  // Remove scripts that are no longer allowed
  removeScriptsByConsent(newConsent, scriptIds);
  
  // Load newly allowed scripts
  loadScriptsByConsent(newConsent, scriptIds);
};

/**
 * Get all loaded scripts
 * @returns {Array} Array of loaded script keys
 */
export const getLoadedScripts = () => {
  return Array.from(loadedScripts.keys());
};

/**
 * Check if a script is loaded
 * @param {string} scriptKey - Script key
 * @returns {boolean} Loaded status
 */
export const isScriptLoaded = (scriptKey) => {
  return loadedScripts.has(scriptKey);
};

/**
 * Clear all loaded scripts
 */
export const clearAllScripts = () => {
  loadedScripts.forEach((_, key) => removeScript(key));
};

export default {
  loadScript,
  removeScript,
  loadScriptsByConsent,
  removeScriptsByConsent,
  updateScriptsByConsent,
  getLoadedScripts,
  isScriptLoaded,
  clearAllScripts,
  SCRIPT_DEFINITIONS
};
