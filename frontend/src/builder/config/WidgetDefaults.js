/**
 * Widget Defaults Configuration
 * Defines sensible defaults for every widget (font, size, weight, spacing, colors)
 */

export const widgetDefaults = {
  // Typography defaults
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
    color: '#262626',
  },

  // Spacing defaults
  spacing: {
    padding: '16px',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '16px',
    paddingRight: '16px',
    margin: '0',
    marginTop: '0',
    marginBottom: '0',
    marginLeft: '0',
    marginRight: '0',
  },

  // Size defaults
  size: {
    width: 'auto',
    height: 'auto',
    maxWidth: 'none',
    maxHeight: 'none',
    minWidth: '0',
    minHeight: '0',
  },

  // Background defaults
  background: {
    backgroundColor: '#ffffff',
    backgroundImage: 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },

  // Border defaults
  border: {
    borderWidth: '0',
    borderStyle: 'solid',
    borderColor: '#d9d9d9',
    borderRadius: '0',
  },

  // Shadow defaults
  shadow: {
    boxShadow: 'none',
  },

  // Opacity defaults
  opacity: {
    opacity: '1',
  },

  // Display defaults
  display: {
    display: 'block',
    visibility: 'visible',
  },

  // Flex defaults
  flex: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: '0',
  },

  // Grid defaults
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gridGap: '16px',
  },

  // Overflow defaults
  overflow: {
    overflow: 'visible',
    overflowX: 'visible',
    overflowY: 'visible',
  },
};

/**
 * Widget-specific defaults
 */
export const widgetSpecificDefaults = {
  // Text-based widgets
  heading: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.2',
    },
    spacing: {
      ...widgetDefaults.spacing,
      marginBottom: '16px',
    },
  },

  paragraph: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '16px',
      lineHeight: '1.6',
    },
    spacing: {
      ...widgetDefaults.spacing,
      marginBottom: '16px',
    },
  },

  blockquote: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '18px',
      fontStyle: 'italic',
      color: '#595959',
    },
    spacing: {
      ...widgetDefaults.spacing,
      padding: '16px 24px',
      marginLeft: '24px',
      borderLeft: '4px solid #1890ff',
      backgroundColor: '#f5f5f5',
    },
  },

  // List widgets
  bulletList: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '16px',
    },
    spacing: {
      ...widgetDefaults.spacing,
      paddingLeft: '24px',
      marginBottom: '16px',
    },
  },

  numberedList: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '16px',
    },
    spacing: {
      ...widgetDefaults.spacing,
      paddingLeft: '24px',
      marginBottom: '16px',
    },
  },

  // Code widgets
  codeBlock: {
    ...widgetDefaults,
    typography: {
      fontFamily: 'Monaco, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    spacing: {
      ...widgetDefaults.spacing,
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      border: '1px solid #e8e8e8',
    },
  },

  // Table widget
  table: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '14px',
    },
    spacing: {
      ...widgetDefaults.spacing,
      padding: '12px',
      borderCollapse: 'collapse',
    },
    border: {
      ...widgetDefaults.border,
      borderWidth: '1px',
      borderColor: '#e8e8e8',
    },
  },

  // Media widgets
  image: {
    ...widgetDefaults,
    size: {
      ...widgetDefaults.size,
      maxWidth: '100%',
      height: 'auto',
    },
    spacing: {
      ...widgetDefaults.spacing,
      marginBottom: '16px',
    },
  },

  video: {
    ...widgetDefaults,
    size: {
      ...widgetDefaults.size,
      width: '100%',
      height: 'auto',
      aspectRatio: '16/9',
    },
    spacing: {
      ...widgetDefaults.spacing,
      marginBottom: '16px',
    },
  },

  pdf: {
    ...widgetDefaults,
    size: {
      ...widgetDefaults.size,
      width: '100%',
      height: '600px',
    },
    spacing: {
      ...widgetDefaults.spacing,
      marginBottom: '16px',
    },
  },

  // Form widgets
  form: {
    ...widgetDefaults,
    spacing: {
      ...widgetDefaults.spacing,
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e8e8e8',
    },
  },

  // Section widgets
  section: {
    ...widgetDefaults,
    spacing: {
      ...widgetDefaults.spacing,
      padding: '48px 24px',
      marginBottom: '0',
      backgroundColor: '#ffffff',
    },
  },

  splitSection: {
    ...widgetDefaults,
    spacing: {
      ...widgetDefaults.spacing,
      padding: '48px 24px',
      gap: '32px',
    },
    flex: {
      ...widgetDefaults.flex,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },

  sectionBreak: {
    ...widgetDefaults,
    spacing: {
      ...widgetDefaults.spacing,
      margin: '32px 0',
    },
    border: {
      ...widgetDefaults.border,
      borderWidth: '1px',
      borderColor: '#e8e8e8',
    },
  },

  // Rich text widget
  richText: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '16px',
      lineHeight: '1.6',
    },
    spacing: {
      ...widgetDefaults.spacing,
      padding: '16px',
      marginBottom: '16px',
    },
  },

  // HTML widget
  html: {
    ...widgetDefaults,
    spacing: {
      ...widgetDefaults.spacing,
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
    },
  },

  // Button widget
  button: {
    ...widgetDefaults,
    typography: {
      ...widgetDefaults.typography,
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    spacing: {
      ...widgetDefaults.spacing,
      padding: '8px 16px',
      borderRadius: '4px',
    },
    background: {
      ...widgetDefaults.background,
      backgroundColor: '#1890ff',
    },
    border: {
      ...widgetDefaults.border,
      borderWidth: '0',
    },
  },

  // Container widget
  container: {
    ...widgetDefaults,
    size: {
      ...widgetDefaults.size,
      maxWidth: '1200px',
      width: '100%',
    },
    spacing: {
      ...widgetDefaults.spacing,
      padding: '0 24px',
      margin: '0 auto',
    },
  },
};

/**
 * Get defaults for a specific widget type
 */
export function getWidgetDefaults(widgetType) {
  return widgetSpecificDefaults[widgetType] || widgetDefaults;
}

/**
 * Merge widget defaults with custom overrides
 */
export function mergeWidgetDefaults(widgetType, customStyles = {}) {
  const defaults = getWidgetDefaults(widgetType);
  return {
    ...defaults,
    ...customStyles,
    typography: {
      ...defaults.typography,
      ...customStyles.typography,
    },
    spacing: {
      ...defaults.spacing,
      ...customStyles.spacing,
    },
    size: {
      ...defaults.size,
      ...customStyles.size,
    },
    background: {
      ...defaults.background,
      ...customStyles.background,
    },
    border: {
      ...defaults.border,
      ...customStyles.border,
    },
    shadow: {
      ...defaults.shadow,
      ...customStyles.shadow,
    },
    opacity: {
      ...defaults.opacity,
      ...customStyles.opacity,
    },
    display: {
      ...defaults.display,
      ...customStyles.display,
    },
    flex: {
      ...defaults.flex,
      ...customStyles.flex,
    },
    grid: {
      ...defaults.grid,
      ...customStyles.grid,
    },
    overflow: {
      ...defaults.overflow,
      ...customStyles.overflow,
    },
  };
}

export default widgetDefaults;
