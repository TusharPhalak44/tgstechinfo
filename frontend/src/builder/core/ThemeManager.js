/**
 * Theme Manager
 * Centralized theme management for the builder
 * Handles theme settings, global styles, and theme application
 */

import { defaultBuilderTheme } from '../utils/types';

class ThemeManager {
  constructor() {
    this.currentTheme = { ...defaultBuilderTheme };
    this.globalStyles = {
      headings: {
        h1: { ...defaultBuilderTheme.headings.h1 },
        h2: { ...defaultBuilderTheme.headings.h2 },
        h3: { ...defaultBuilderTheme.headings.h3 },
        h4: { ...defaultBuilderTheme.headings.h4 },
        h5: { ...defaultBuilderTheme.headings.h5 },
        h6: { ...defaultBuilderTheme.headings.h6 },
      },
      paragraphs: {
        body: { ...defaultBuilderTheme.paragraphs.body },
        small: { ...defaultBuilderTheme.paragraphs.small },
      },
      buttons: {
        primary: { ...defaultBuilderTheme.buttons.primary },
        secondary: { ...defaultBuilderTheme.buttons.secondary },
      },
      links: {
        color: '#4a7cff',
        textDecoration: 'none',
        hoverColor: '#6c5ce7',
        hoverDecoration: 'underline',
      },
      lists: {
        unordered: {
          listStyle: 'disc',
          paddingLeft: '24px',
          marginBottom: '16px',
        },
        ordered: {
          listStyle: 'decimal',
          paddingLeft: '24px',
          marginBottom: '16px',
        },
      },
    };
    this.customCSS = '';
    this.customJS = '';
    this.listeners = [];
  }

  /**
   * Get current theme
   * @returns {Object} Current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Set theme
   * @param {Object} theme - Theme object
   */
  setTheme(theme) {
    this.currentTheme = {
      ...this.currentTheme,
      ...theme,
    };
    this.notifyListeners();
  }

  /**
   * Update theme colors
   * @param {Object} colors - Color overrides
   */
  updateColors(colors) {
    this.currentTheme.colors = {
      ...this.currentTheme.colors,
      ...colors,
    };
    this.notifyListeners();
  }

  /**
   * Update theme typography
   * @param {Object} typography - Typography overrides
   */
  updateTypography(typography) {
    this.currentTheme.typography = {
      ...this.currentTheme.typography,
      ...typography,
    };
    this.notifyListeners();
  }

  /**
   * Update theme spacing
   * @param {Object} spacing - Spacing overrides
   */
  updateSpacing(spacing) {
    this.currentTheme.spacing = {
      ...this.currentTheme.spacing,
      ...spacing,
    };
    this.notifyListeners();
  }

  /**
   * Update theme border radius
   * @param {Object} borderRadius - Border radius overrides
   */
  updateBorderRadius(borderRadius) {
    this.currentTheme.borderRadius = {
      ...this.currentTheme.borderRadius,
      ...borderRadius,
    };
    this.notifyListeners();
  }

  /**
   * Update theme shadows
   * @param {Object} shadows - Shadow overrides
   */
  updateShadows(shadows) {
    this.currentTheme.shadows = {
      ...this.currentTheme.shadows,
      ...shadows,
    };
    this.notifyListeners();
  }

  /**
   * Get global styles
   * @returns {Object} Global styles
   */
  getGlobalStyles() {
    return this.globalStyles;
  }

  /**
   * Update global heading style
   * @param {string} heading - Heading key (h1, h2, etc.)
   * @param {Object} style - Style object
   */
  updateHeadingStyle(heading, style) {
    this.globalStyles.headings[heading] = {
      ...this.globalStyles.headings[heading],
      ...style,
    };
    this.notifyListeners();
  }

  /**
   * Update global paragraph style
   * @param {string} type - Paragraph type (body, small)
   * @param {Object} style - Style object
   */
  updateParagraphStyle(type, style) {
    this.globalStyles.paragraphs[type] = {
      ...this.globalStyles.paragraphs[type],
      ...style,
    };
    this.notifyListeners();
  }

  /**
   * Update global button style
   * @param {string} type - Button type (primary, secondary)
   * @param {Object} style - Style object
   */
  updateButtonStyle(type, style) {
    this.globalStyles.buttons[type] = {
      ...this.globalStyles.buttons[type],
      ...style,
    };
    this.notifyListeners();
  }

  /**
   * Update global link style
   * @param {Object} style - Style object
   */
  updateLinkStyle(style) {
    this.globalStyles.links = {
      ...this.globalStyles.links,
      ...style,
    };
    this.notifyListeners();
  }

  /**
   * Update global list style
   * @param {string} type - List type (unordered, ordered)
   * @param {Object} style - Style object
   */
  updateListStyle(type, style) {
    this.globalStyles.lists[type] = {
      ...this.globalStyles.lists[type],
      ...style,
    };
    this.notifyListeners();
  }

  /**
   * Set custom CSS
   * @param {string} css - Custom CSS string
   */
  setCustomCSS(css) {
    this.customCSS = css;
    this.notifyListeners();
  }

  /**
   * Get custom CSS
   * @returns {string} Custom CSS
   */
  getCustomCSS() {
    return this.customCSS;
  }

  /**
   * Set custom JavaScript
   * @param {string} js - Custom JavaScript string
   */
  setCustomJS(js) {
    this.customJS = js;
    this.notifyListeners();
  }

  /**
   * Get custom JavaScript
   * @returns {string} Custom JavaScript
   */
  getCustomJS() {
    return this.customJS;
  }

  /**
   * Generate CSS from theme
   * @returns {string} Generated CSS
   */
  generateCSS() {
    const { colors, typography, spacing, borderRadius, shadows } = this.currentTheme;
    const { headings, paragraphs, buttons, links, lists } = this.globalStyles;

    let css = `
:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-danger: ${colors.danger};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-border: ${colors.border};
  
  --font-primary: ${typography.primaryFont};
  --font-secondary: ${typography.secondaryFont};
  
  --spacing-unit: ${spacing.unit}px;
  --container-width: ${spacing.containerWidth}px;
  
  --radius-sm: ${borderRadius.sm};
  --radius-md: ${borderRadius.md};
  --radius-lg: ${borderRadius.lg};
  --radius-xl: ${borderRadius.xl};
  --radius-2xl: ${borderRadius['2xl']};
  --radius-full: ${borderRadius.full};
  
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};
  --shadow-2xl: ${shadows['2xl']};
}

/* Global Headings */
h1 {
  font-size: ${headings.h1.fontSize};
  font-weight: ${headings.h1.fontWeight};
  line-height: ${headings.h1.lineHeight};
  margin-bottom: ${headings.h1.marginBottom};
}

h2 {
  font-size: ${headings.h2.fontSize};
  font-weight: ${headings.h2.fontWeight};
  line-height: ${headings.h2.lineHeight};
  margin-bottom: ${headings.h2.marginBottom};
}

h3 {
  font-size: ${headings.h3.fontSize};
  font-weight: ${headings.h3.fontWeight};
  line-height: ${headings.h3.lineHeight};
  margin-bottom: ${headings.h3.marginBottom};
}

h4 {
  font-size: ${headings.h4.fontSize};
  font-weight: ${headings.h4.fontWeight};
  line-height: ${headings.h4.lineHeight};
  margin-bottom: ${headings.h4.marginBottom};
}

h5 {
  font-size: ${headings.h5.fontSize};
  font-weight: ${headings.h5.fontWeight};
  line-height: ${headings.h5.lineHeight};
  margin-bottom: ${headings.h5.marginBottom};
}

h6 {
  font-size: ${headings.h6.fontSize};
  font-weight: ${headings.h6.fontWeight};
  line-height: ${headings.h6.lineHeight};
  margin-bottom: ${headings.h6.marginBottom};
}

/* Global Paragraphs */
p {
  font-size: ${paragraphs.body.fontSize};
  line-height: ${paragraphs.body.lineHeight};
  margin-bottom: ${paragraphs.body.marginBottom};
}

p.small {
  font-size: ${paragraphs.small.fontSize};
  line-height: ${paragraphs.small.lineHeight};
  margin-bottom: ${paragraphs.small.marginBottom};
}

/* Global Buttons */
.btn-primary {
  background-color: ${buttons.primary.backgroundColor};
  color: ${buttons.primary.color};
  border-radius: ${buttons.primary.borderRadius};
  padding: ${buttons.primary.padding};
  font-weight: ${buttons.primary.fontWeight};
}

.btn-secondary {
  background-color: ${buttons.secondary.backgroundColor};
  color: ${buttons.secondary.color};
  border-radius: ${buttons.secondary.borderRadius};
  padding: ${buttons.secondary.padding};
  font-weight: ${buttons.secondary.fontWeight};
}

/* Global Links */
a {
  color: ${links.color};
  text-decoration: ${links.textDecoration};
}

a:hover {
  color: ${links.hoverColor};
  text-decoration: ${links.hoverDecoration};
}

/* Global Lists */
ul {
  list-style: ${lists.unordered.listStyle};
  padding-left: ${lists.unordered.paddingLeft};
  margin-bottom: ${lists.unordered.marginBottom};
}

ol {
  list-style: ${lists.ordered.listStyle};
  padding-left: ${lists.ordered.paddingLeft};
  margin-bottom: ${lists.ordered.marginBottom};
}
`;

    // Add custom CSS
    if (this.customCSS) {
      css += `\n/* Custom CSS */\n${this.customCSS}`;
    }

    return css;
  }

  /**
   * Reset theme to default
   */
  resetToDefault() {
    this.currentTheme = { ...defaultBuilderTheme };
    this.globalStyles = {
      headings: {
        h1: { ...defaultBuilderTheme.headings.h1 },
        h2: { ...defaultBuilderTheme.headings.h2 },
        h3: { ...defaultBuilderTheme.headings.h3 },
        h4: { ...defaultBuilderTheme.headings.h4 },
        h5: { ...defaultBuilderTheme.headings.h5 },
        h6: { ...defaultBuilderTheme.headings.h6 },
      },
      paragraphs: {
        body: { ...defaultBuilderTheme.paragraphs.body },
        small: { ...defaultBuilderTheme.paragraphs.small },
      },
      buttons: {
        primary: { ...defaultBuilderTheme.buttons.primary },
        secondary: { ...defaultBuilderTheme.buttons.secondary },
      },
      links: {
        color: '#4a7cff',
        textDecoration: 'none',
        hoverColor: '#6c5ce7',
        hoverDecoration: 'underline',
      },
      lists: {
        unordered: {
          listStyle: 'disc',
          paddingLeft: '24px',
          marginBottom: '16px',
        },
        ordered: {
          listStyle: 'decimal',
          paddingLeft: '24px',
          marginBottom: '16px',
        },
      },
    };
    this.customCSS = '';
    this.customJS = '';
    this.notifyListeners();
  }

  /**
   * Subscribe to theme changes
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of theme changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        theme: this.currentTheme,
        globalStyles: this.globalStyles,
        customCSS: this.customCSS,
        customJS: this.customJS,
      });
    });
  }

  /**
   * Serialize theme to JSON
   * @returns {Object} Serialized theme
   */
  serialize() {
    return {
      theme: this.currentTheme,
      globalStyles: this.globalStyles,
      customCSS: this.customCSS,
      customJS: this.customJS,
    };
  }

  /**
   * Deserialize theme from JSON
   * @param {Object} data - Serialized theme data
   */
  deserialize(data) {
    if (data.theme) {
      this.currentTheme = {
        ...this.currentTheme,
        ...data.theme,
      };
    }
    if (data.globalStyles) {
      this.globalStyles = {
        ...this.globalStyles,
        ...data.globalStyles,
      };
    }
    if (data.customCSS !== undefined) {
      this.customCSS = data.customCSS;
    }
    if (data.customJS !== undefined) {
      this.customJS = data.customJS;
    }
    this.notifyListeners();
  }
}

// Singleton instance
const themeManager = new ThemeManager();

export default themeManager;
export { ThemeManager };
