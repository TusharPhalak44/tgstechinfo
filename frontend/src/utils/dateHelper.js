/**
 * Frontend Date Helper Utility
 * Provides consistent date formatting for React components
 * Matches the backend dateHelper for consistency
 */

import moment from 'moment';

/**
 * Standard date formats used across the application
 */
export const DATE_FORMATS = {
    // Display formats
    SHORT_DATE: 'MMM D, YYYY',           // "Jan 15, 2024"
    LONG_DATE: 'MMMM D, YYYY',          // "January 15, 2024"
    DATE_TIME: 'MMMM D, YYYY [at] h:mm A',  // "January 15, 2024 at 3:30 PM"
    TABLE_DATE: 'MMM DD, YYYY',          // "Jan 15, 2024" (for tables)
    
    // Input formats
    ISO_DATE: 'YYYY-MM-DD',              // "2024-01-15"
    ISO_DATE_TIME: 'YYYY-MM-DD HH:mm:ss', // "2024-01-15 15:30:00"
    
    // Backend/API formats
    API_DATE: 'YYYY-MM-DD',
    API_DATE_TIME: 'YYYY-MM-DD HH:mm:ss'
};

/**
 * Get the effective publish date for content
 * Uses consistent fallback logic: scheduled_publish_date > published_date > created_at
 * 
 * @param {Object} content - Content object with date fields
 * @returns {Date|null} The effective publish date or null
 */
export const getEffectivePublishDate = (content) => {
    if (!content) return null;
    
    // Priority: scheduled_publish_date > published_date > created_at
    return content.scheduled_publish_date || 
           content.published_date || 
           content.created_at || 
           null;
};

/**
 * Format a date for display in the UI
 * Uses standard SHORT_DATE format
 * 
 * @param {Date|string|Object} date - Date to format (can be Date object, string, or moment object)
 * @param {string} format - Optional format override (defaults to SHORT_DATE)
 * @returns {string} Formatted date string or fallback text
 */
export const formatDateForDisplay = (date, format = DATE_FORMATS.SHORT_DATE) => {
    if (!date) return '—';
    
    try {
        return moment(date).format(format);
    } catch (error) {
        console.error('Date formatting error:', error);
        return '—';
    }
};

/**
 * Format content publish date for display
 * Combines getEffectivePublishDate with formatDateForDisplay
 * This is the main function to use for displaying content dates
 * 
 * @param {Object} content - Content object with date fields
 * @param {string} format - Optional format override
 * @returns {string} Formatted publish date or fallback
 */
export const formatContentPublishDate = (content, format = DATE_FORMATS.SHORT_DATE) => {
    const effectiveDate = getEffectivePublishDate(content);
    return formatDateForDisplay(effectiveDate, format);
};

/**
 * Format content publish date with fallback for recent content
 * Used in user dashboard for "Recent" label
 * 
 * @param {Object} content - Content object with date fields
 * @returns {string} Formatted date or "Recent"
 */
export const formatContentPublishDateWithFallback = (content) => {
    if (!content) return 'Recent';
    
    if (content.scheduled_publish_date) {
        return formatDateForDisplay(content.scheduled_publish_date);
    }
    if (content.published_date) {
        return formatDateForDisplay(content.published_date);
    }
    if (content.created_at) {
        return formatDateForDisplay(content.created_at);
    }
    
    return 'Recent';
};

/**
 * Format webinar date with time
 * 
 * @param {Date|string} date - Webinar date
 * @returns {string} Formatted webinar date with time
 */
export const formatWebinarDate = (date) => {
    if (!date) return '—';
    
    try {
        return moment(date).format(DATE_FORMATS.DATE_TIME);
    } catch (error) {
        console.error('Webinar date formatting error:', error);
        return '—';
    }
};

/**
 * Format date for table display
 * Uses compact format suitable for tables
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date for table
 */
export const formatDateForTable = (date) => {
    return formatDateForDisplay(date, DATE_FORMATS.TABLE_DATE);
};

/**
 * Format date for table with draft fallback
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date or "Draft"
 */
export const formatDateForTableWithDraft = (date) => {
    if (!date) return 'Draft';
    return formatDateForTable(date);
};

/**
 * Format date for long form display (article details, etc.)
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date in long format
 */
export const formatDateForLongDisplay = (date) => {
    return formatDateForDisplay(date, DATE_FORMATS.LONG_DATE);
};

/**
 * Sort content by publish date
 * 
 * @param {Array} contents - Array of content objects
 * @param {string} order - 'desc' (newest first) or 'asc' (oldest first)
 * @returns {Array} Sorted array of content
 */
export const sortContentByDate = (contents, order = 'desc') => {
    if (!Array.isArray(contents)) return [];
    
    return [...contents].sort((a, b) => {
        const dateA = new Date(getEffectivePublishDate(a) || 0);
        const dateB = new Date(getEffectivePublishDate(b) || 0);
        
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
};

/**
 * Check if a date is valid
 * 
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (date) => {
    if (!date) return false;
    
    try {
        const momentDate = moment(date);
        return momentDate.isValid();
    } catch (error) {
        return false;
    }
};

/**
 * Get date range for filtering
 * 
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} Date range object with moment dates
 */
export const getDateRange = (startDate, endDate) => {
    return {
        start: startDate ? moment(startDate) : null,
        end: endDate ? moment(endDate) : null
    };
};

/**
 * Check if a date falls within a range
 * 
 * @param {Date|string} date - Date to check
 * @param {Date|string} rangeStart - Range start
 * @param {Date|string} rangeEnd - Range end
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, rangeStart, rangeEnd) => {
    if (!date) return false;
    
    const checkDate = moment(date);
    const start = rangeStart ? moment(rangeStart) : moment().subtract(100, 'years');
    const end = rangeEnd ? moment(rangeEnd) : moment().add(100, 'years');
    
    return checkDate.isBetween(start, end, null, '[]');
};

/**
 * Format date for input fields (date picker)
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date for input
 */
export const formatDateForInput = (date) => {
    if (!date) return '';
    
    try {
        return moment(date).format(DATE_FORMATS.ISO_DATE);
    } catch (error) {
        console.error('Input date formatting error:', error);
        return '';
    }
};

/**
 * Format date-time for input fields (date-time picker)
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date-time for input
 */
export const formatDateTimeForInput = (date) => {
    if (!date) return '';
    
    try {
        return moment(date).format(DATE_FORMATS.ISO_DATE_TIME);
    } catch (error) {
        console.error('Input date-time formatting error:', error);
        return '';
    }
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
    if (!date) return '';
    
    try {
        return moment(date).fromNow();
    } catch (error) {
        console.error('Relative time formatting error:', error);
        return '';
    }
};

/**
 * Format date for CSV export
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} CSV-friendly date format
 */
export const formatDateForCSV = (date) => {
    if (!date) return '';
    
    try {
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
        console.error('CSV date formatting error:', error);
        return '';
    }
};

/**
 * Format date for CSV filename timestamp
 * Uses compact format: YYYYMMDD_HHmmss
 * 
 * @param {Date|string} date - Date to format (defaults to current time)
 * @returns {string} Formatted timestamp for filename
 */
export const formatTimestampForFilename = (date = new Date()) => {
    try {
        return moment(date).format('YYYYMMDD_HHmmss');
    } catch (error) {
        console.error('Filename timestamp formatting error:', error);
        return '';
    }
};

/**
 * Format date for ICS calendar format
 * Uses UTC format: YYYYMMDDTHHmmss[Z]
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date for ICS calendar
 */
export const formatDateForICS = (date) => {
    if (!date) return '';
    
    try {
        return moment(date).utc().format('YYYYMMDDTHHmmss[Z]');
    } catch (error) {
        console.error('ICS date formatting error:', error);
        return '';
    }
};

/**
 * Format time for display (hours, minutes, seconds)
 * Uses format: h:mm:ss A
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time
 */
export const formatTimeForDisplay = (date) => {
    if (!date) return '';
    
    try {
        return moment(date).format('h:mm:ss A');
    } catch (error) {
        console.error('Time formatting error:', error);
        return '';
    }
};

/**
 * Combined date display component props
 * Returns all the props needed for consistent date display
 * 
 * @param {Object} content - Content object
 * @param {string} format - Optional format override
 * @returns {Object} Props for date display
 */
export const getDateDisplayProps = (content, format = DATE_FORMATS.SHORT_DATE) => {
    const effectiveDate = getEffectivePublishDate(content);
    return {
        date: effectiveDate,
        formatted: formatDateForDisplay(effectiveDate, format),
        isValid: isValidDate(effectiveDate),
        relative: getRelativeTime(effectiveDate)
    };
};

// Export all helper functions for use in components
export default {
    // Date format constants
    DATE_FORMATS,
    
    // Core functions
    getEffectivePublishDate,
    formatDateForDisplay,
    formatContentPublishDate,
    formatContentPublishDateWithFallback,
    formatWebinarDate,
    formatDateForTable,
    formatDateForTableWithDraft,
    formatDateForLongDisplay,
    formatDateForInput,
    formatDateTimeForInput,
    formatDateForCSV,
    formatTimestampForFilename,
    formatDateForICS,
    formatTimeForDisplay,
    
    // Utility functions
    sortContentByDate,
    isValidDate,
    getDateRange,
    isDateInRange,
    getRelativeTime,
    getDateDisplayProps
};