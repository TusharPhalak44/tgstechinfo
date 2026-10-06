/**
 * Centralized Date Helper Utility
 * Provides consistent date formatting and handling across the entire application
 * This eliminates the recurring date formatting inconsistencies
 */

const moment = require('moment');

/**
 * Standard date formats used across the application
 */
const DATE_FORMATS = {
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
function getEffectivePublishDate(content) {
    if (!content) return null;
    
    // Priority: scheduled_publish_date > published_date > created_at
    return content.scheduled_publish_date || 
           content.published_date || 
           content.created_at || 
           null;
}

/**
 * Format a date for display in the UI
 * Uses standard SHORT_DATE format
 * 
 * @param {Date|string|Object} date - Date to format (can be Date object, string, or moment object)
 * @param {string} format - Optional format override (defaults to SHORT_DATE)
 * @returns {string} Formatted date string or fallback text
 */
function formatDateForDisplay(date, format = DATE_FORMATS.SHORT_DATE) {
    if (!date) return '—';
    
    try {
        return moment(date).format(format);
    } catch (error) {
        console.error('Date formatting error:', error);
        return '—';
    }
}

/**
 * Format a date for API/backend use
 * Uses standard ISO_DATE_TIME format
 * 
 * @param {Date|string|Object} date - Date to format
 * @returns {string} Formatted date string for API use
 */
function formatDateForAPI(date) {
    if (!date) return null;
    
    try {
        return moment(date).format(DATE_FORMATS.API_DATE_TIME);
    } catch (error) {
        console.error('API date formatting error:', error);
        return null;
    }
}

/**
 * Format content publish date for display
 * Combines getEffectivePublishDate with formatDateForDisplay
 * 
 * @param {Object} content - Content object with date fields
 * @param {string} format - Optional format override
 * @returns {string} Formatted publish date or fallback
 */
function formatContentPublishDate(content, format = DATE_FORMATS.SHORT_DATE) {
    const effectiveDate = getEffectivePublishDate(content);
    return formatDateForDisplay(effectiveDate, format);
}

/**
 * Format content dates for email templates
 * Uses locale-specific formatting for better email display
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Locale-formatted date string
 */
function formatDateForEmail(date) {
    if (!date) return new Date().toLocaleDateString();
    
    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Email date formatting error:', error);
        return new Date().toLocaleDateString();
    }
}

/**
 * Format webinar date with time
 * 
 * @param {Date|string} date - Webinar date
 * @returns {string} Formatted webinar date with time
 */
function formatWebinarDate(date) {
    if (!date) return '—';
    
    try {
        return moment(date).format(DATE_FORMATS.DATE_TIME);
    } catch (error) {
        console.error('Webinar date formatting error:', error);
        return '—';
    }
}

/**
 * Format date for table display
 * Uses compact format suitable for tables
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date for table
 */
function formatDateForTable(date) {
    return formatDateForDisplay(date, DATE_FORMATS.TABLE_DATE);
}

/**
 * Sort content by publish date
 * 
 * @param {Array} contents - Array of content objects
 * @param {string} order - 'desc' (newest first) or 'asc' (oldest first)
 * @returns {Array} Sorted array of content
 */
function sortContentByDate(contents, order = 'desc') {
    if (!Array.isArray(contents)) return [];
    
    return [...contents].sort((a, b) => {
        const dateA = new Date(getEffectivePublishDate(a) || 0);
        const dateB = new Date(getEffectivePublishDate(b) || 0);
        
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
}

/**
 * Check if a date is valid
 * 
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid
 */
function isValidDate(date) {
    if (!date) return false;
    
    try {
        const momentDate = moment(date);
        return momentDate.isValid();
    } catch (error) {
        return false;
    }
}

/**
 * Get date range for filtering
 * 
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} Date range object with moment dates
 */
function getDateRange(startDate, endDate) {
    return {
        start: startDate ? moment(startDate) : null,
        end: endDate ? moment(endDate) : null
    };
}

/**
 * Check if a date falls within a range
 * 
 * @param {Date|string} date - Date to check
 * @param {Date|string} rangeStart - Range start
 * @param {Date|string} rangeEnd - Range end
 * @returns {boolean} True if date is within range
 */
function isDateInRange(date, rangeStart, rangeEnd) {
    if (!date) return false;
    
    const checkDate = moment(date);
    const start = rangeStart ? moment(rangeStart) : moment().subtract(100, 'years');
    const end = rangeEnd ? moment(rangeEnd) : moment().add(100, 'years');
    
    return checkDate.isBetween(start, end, null, '[]');
}

/**
 * Get current timestamp in India Standard Time (IST / Asia/Kolkata)
 * Returns 'YYYY-MM-DD HH:mm:ss' formatted string for MySQL DATETIME / TIMESTAMP storage
 */
function getNowInIST() {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        return formatter.format(new Date()).replace(', ', ' ');
    } catch {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
        const pad = n => String(n).padStart(2, '0');
        return `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(istDate.getDate())} ${pad(istDate.getHours())}:${pad(istDate.getMinutes())}:${pad(istDate.getSeconds())}`;
    }
}

module.exports = {
    // Date format constants
    DATE_FORMATS,
    
    // Core functions
    getEffectivePublishDate,
    formatDateForDisplay,
    formatDateForAPI,
    formatContentPublishDate,
    formatDateForEmail,
    formatWebinarDate,
    formatDateForTable,
    getNowInIST,
    
    // Utility functions
    sortContentByDate,
    isValidDate,
    getDateRange,
    isDateInRange
};