import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date object to YYYY-MM-DD string using the user's local timezone.
 * Avoids toISOString().split('T')[0] timezone shift bug (which returns yesterday between 00:00 and 05:30 in IST).
 * @param {Date|string|number} date
 * @returns {string} YYYY-MM-DD in local time
 */
export function formatLocalDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
