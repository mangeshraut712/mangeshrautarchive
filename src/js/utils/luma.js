/**
 * Luma Calendar & Event Integration Utility (2026 Apple Standard)
 * Connects community events, hackathons, and calendar subscriptions
 * to Luma (lu.ma / luma.com/home/calendars).
 */

export const LUMA_CALENDARS_URL = 'https://luma.com/home/calendars';
export const LUMA_BASE_URL = 'https://lu.ma';

/**
 * Safely opens Mangesh's Luma Calendars hub in a new tab.
 * @param {string} [customUrl] - Optional specific event or calendar URL.
 */
export function openLumaCalendar(customUrl = LUMA_CALENDARS_URL) {
  const target = customUrl && /^https?:\/\//i.test(customUrl) ? customUrl : LUMA_CALENDARS_URL;
  window.open(target, '_blank', 'noopener,noreferrer');
}
