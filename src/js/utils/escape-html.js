/**
 * Shared HTML/attribute escaping for innerHTML sinks.
 * Prefer this over local copies so XSS edge cases stay consistent.
 */

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Alias for attribute contexts (same escaping rules). */
export function escapeAttr(value) {
  return escapeHtml(value);
}

/** camelCase alias used by blog modules. */
export const escapeHTML = escapeHtml;

export default escapeHtml;
