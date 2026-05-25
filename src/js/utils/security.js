/**
 * Security utilities for input sanitization and XSS prevention
 * @module utils/security
 */

/**
 * HTML escape map for common characters
 * @const {Object}
 */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Regular expression for matching characters to escape
 * @const {RegExp}
 */
const ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - Raw text to escape
 * @returns {string} Escaped HTML-safe string
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(ESCAPE_REGEX, char => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitizes a URL to prevent javascript: protocol injection
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string if unsafe
 * @example
 * sanitizeUrl('javascript:alert(1)') // Returns: ''
 * sanitizeUrl('https://example.com')  // Returns: 'https://example.com'
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'chrome:',
    'resource:'
  ];
  
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return '';
  }
  
  // Allow safe protocols
  const safeProtocols = ['https:', 'http:', 'mailto:', 'tel:'];
  if (safeProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return url.trim();
  }
  
  // Allow relative URLs and anchors
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('./')) {
    return url.trim();
  }
  
  // Default to empty for unknown protocols
  return '';
}

/**
 * Validates and sanitizes an email address
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  // Check for dangerous characters
  const dangerousChars = /[<>'"`]/;
  if (dangerousChars.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

/**
 * Creates a DocumentFragment from sanitized HTML string
 * Only allows specific safe HTML tags
 * @param {string} html - HTML string to sanitize
 * @param {Document} [documentRef] - Document reference (defaults to window.document)
 * @returns {DocumentFragment} Sanitized DocumentFragment
 */
export function createSanitizedFragment(html, documentRef = document) {
  if (typeof html !== 'string') {
    return documentRef.createDocumentFragment();
  }
  
  const allowedTags = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'span', 'div'
  ]);
  
  const allowedAttrs = new Set([
    'href', 'title', 'class', 'id', 'target', 'rel'
  ]);
  
  const template = documentRef.createElement('template');
  template.innerHTML = html;
  
  const fragment = documentRef.createDocumentFragment();
  
  // Deep clone and sanitize
  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      if (!allowedTags.has(tagName)) {
        // Convert disallowed tags to span
        const span = documentRef.createElement('span');
        span.textContent = node.textContent;
        return span;
      }
      
      const clone = documentRef.createElement(tagName);
      
      // Copy allowed attributes
      for (const attr of node.attributes) {
        if (allowedAttrs.has(attr.name.toLowerCase())) {
          if (attr.name.toLowerCase() === 'href') {
            const safeUrl = sanitizeUrl(attr.value);
            if (safeUrl) {
              clone.setAttribute('href', safeUrl);
              // Add security attributes for external links
              if (safeUrl.startsWith('http')) {
                clone.setAttribute('target', '_blank');
                clone.setAttribute('rel', 'noopener noreferrer');
              }
            }
          } else {
            clone.setAttribute(attr.name, escapeHtml(attr.value));
          }
        }
      }
      
      // Recursively sanitize children
      for (const child of node.childNodes) {
        const sanitized = sanitizeNode(child);
        if (sanitized) {
          clone.appendChild(sanitized);
        }
      }
      
      return clone;
    }
    
    return null;
  }
  
  for (const child of template.content.childNodes) {
    const sanitized = sanitizeNode(child);
    if (sanitized) {
      fragment.appendChild(sanitized);
    }
  }
  
  return fragment;
}

/**
 * Rate limiter for function calls
 * Useful for preventing abuse in search, chat, etc.
 * @param {Function} fn - Function to rate limit
 * @param {number} limit - Number of calls allowed per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Rate-limited function
 */
export function rateLimit(fn, limit = 10, windowMs = 60000) {
  const calls = [];
  
  return function(...args) {
    const now = Date.now();
    
    // Remove old calls outside the window
    while (calls.length > 0 && calls[0] < now - windowMs) {
      calls.shift();
    }
    
    if (calls.length >= limit) {
      console.warn(`Rate limit exceeded. Try again in ${Math.ceil((calls[0] + windowMs - now) / 1000)}s`);
      return null;
    }
    
    calls.push(now);
    return fn.apply(this, args);
  };
}

/**
 * Validates a GitHub username to prevent injection
 * @param {string} username - GitHub username to validate
 * @returns {string|null} Validated username or null
 */
export function validateGitHubUsername(username) {
  if (typeof username !== 'string') {
    return null;
  }
  
  const trimmed = username.trim();
  
  // GitHub username rules: alphanumeric, hyphens, 1-39 chars
  // Cannot start/end with hyphen, no consecutive hyphens
  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  
  if (!usernameRegex.test(trimmed) || trimmed.length > 39) {
    return null;
  }
  
  return trimmed;
}

/**
 * Generates a secure random token
 * @param {number} [length=32] - Token length
 * @returns {string} Random token
 */
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return token;
}

export default {
  escapeHtml,
  sanitizeUrl,
  sanitizeEmail,
  createSanitizedFragment,
  rateLimit,
  validateGitHubUsername,
  generateSecureToken
};
