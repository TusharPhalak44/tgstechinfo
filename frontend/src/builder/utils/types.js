/**
 * Builder Core Type Definitions
 * Central type system for the modular builder architecture
 * JavaScript version for compatibility
 */

/**
 * Node types in the builder hierarchy
 */
export const NodeType = {
  // Layout nodes
  PAGE: 'page',
  SECTION: 'section',
  CONTAINER: 'container',
  COLUMN: 'column',

  // Widget nodes
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  IMAGE: 'image',
  BUTTON: 'button',
  TABLE: 'table',
  DIVIDER: 'divider',
  SPACER: 'spacer',
  BULLET_LIST: 'bullet_list',
  NUMBERED_LIST: 'numbered_list',
  BLOCKQUOTE: 'blockquote',
  CODE_BLOCK: 'code_block',
  LINE_BREAK: 'line_break',
  SECTION_BREAK: 'section_break',
  SPLIT_SECTION: 'split_section',
  RICH_TEXT: 'rich_text',
  VIDEO: 'video',
  PDF: 'pdf',
  HTML: 'html',
  FORM: 'form',

  // Special / legacy section nodes
  CONTENT: 'content',
  CONTENT_TYPE_CATEGORY: 'content_type_category',
  TITLE_DESCRIPTION: 'title_description',
  BANNER_IMAGE: 'banner_image',
  PDF_ATTACHMENT: 'pdf_attachment',
  TAGS: 'tags',
  SCHEDULE: 'schedule',
  SEO: 'seo',
};

/**
 * Event types for builder event system
 */
export const BuilderEventType = {
  NODE_SELECTED: 'NODE_SELECTED',
  NODE_UPDATED: 'NODE_UPDATED',
  NODE_DELETED: 'NODE_DELETED',
  NODE_MOVED: 'NODE_MOVED',
  WIDGET_ADDED: 'WIDGET_ADDED',
  WIDGET_REMOVED: 'WIDGET_REMOVED',
  HISTORY_CHANGED: 'HISTORY_CHANGED',
  SELECTION_CHANGED: 'SELECTION_CHANGED',
  PAGE_LOADED: 'PAGE_LOADED',
  PAGE_SAVED: 'PAGE_SAVED',
};

/**
 * Default builder theme
 */
export const defaultBuilderTheme = {
  colors: {
    primary: '#4a7cff',
    secondary: '#6c5ce7',
    accent: '#f79429',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1a1a2e',
    border: '#e8e8e8',
  },
  typography: {
    primaryFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondaryFont: 'Georgia, serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '48px',
      '4xl': '64px',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.6,
      relaxed: 1.8,
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  spacing: {
    unit: 8,
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
    containerWidth: 1200,
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
  },
  buttons: {
    primary: {
      backgroundColor: '#4a7cff',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: 600,
    },
    secondary: {
      backgroundColor: '#6c5ce7',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: 600,
    },
  },
  headings: {
    h1: {
      fontSize: '48px',
      fontWeight: 700,
      lineHeight: 1.2,
      marginBottom: '24px',
    },
    h2: {
      fontSize: '36px',
      fontWeight: 600,
      lineHeight: 1.3,
      marginBottom: '20px',
    },
    h3: {
      fontSize: '28px',
      fontWeight: 600,
      lineHeight: 1.4,
      marginBottom: '16px',
    },
    h4: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.4,
      marginBottom: '12px',
    },
    h5: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.5,
      marginBottom: '12px',
    },
    h6: {
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: 1.5,
      marginBottom: '8px',
    },
  },
  paragraphs: {
    body: {
      fontSize: '16px',
      lineHeight: 1.6,
      marginBottom: '16px',
    },
    small: {
      fontSize: '14px',
      lineHeight: 1.5,
      marginBottom: '12px',
    },
  },
};

/**
 * Responsive device configurations
 */
export const deviceConfig = {
  desktop: {
    name: 'Desktop',
    icon: '🖥️',
    width: 1200,
    breakpoint: 1200,
  },
  tablet: {
    name: 'Tablet',
    icon: '📱',
    width: 768,
    breakpoint: 768,
  },
  mobile: {
    name: 'Mobile',
    icon: '📲',
    width: 375,
    breakpoint: 375,
  },
};

/**
 * Animation types
 */
export const animationTypes = {
  none: 'none',
  fadeIn: 'fade-in',
  slideUp: 'slide-up',
  slideDown: 'slide-down',
  slideLeft: 'slide-left',
  slideRight: 'slide-right',
  zoomIn: 'zoom-in',
  zoomOut: 'zoom-out',
  bounce: 'bounce',
  rotate: 'rotate',
  flip: 'flip',
  pulse: 'pulse',
};

/**
 * Animation easing functions
 */
export const animationEasing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  cubicEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Visibility rule types
 */
export const visibilityRuleTypes = {
  device: 'device',
  auth: 'auth',
  pageType: 'pageType',
  custom: 'custom',
  dateRange: 'dateRange',
};

/**
 * Data source types
 */
export const dataSourceTypes = {
  static: 'static',
  cms: 'cms',
  api: 'api',
  json: 'json',
  webhook: 'webhook',
  userVariable: 'userVariable',
};

/**
 * Global component types
 */
export const globalComponentTypes = {
  widget: 'widget',
  container: 'container',
  section: 'section',
};
