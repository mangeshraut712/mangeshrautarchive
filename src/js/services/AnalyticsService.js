/**
 * AnalyticsService — Custom Vercel Analytics event tracker
 *
 * Wraps Vercel Web Analytics `va('event', { name, data })` for portfolio events.
 */

import { isPerformanceAudit } from '../utils/perf-audit.js';

class AnalyticsService {
  constructor() {
    this._track = null;
    this._queue = [];
    this._initialized = false;
    this._disabled = isPerformanceAudit();
    this._handleReady = () => this._init();

    if (this._disabled || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('vercel-analytics-ready', this._handleReady);
    window.addEventListener('load', () => this._init(), { once: true });
    setTimeout(() => this._init(), 500);
  }

  _init() {
    if (this._disabled || isPerformanceAudit()) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.va === 'function') {
      this._track = (name, data = {}) => {
        window.va('event', { name, data });
      };
      this._initialized = true;
    } else if (typeof window !== 'undefined' && typeof window.__vercel_insights_track === 'function') {
      this._track = window.__vercel_insights_track;
      this._initialized = true;
    }

    if (this._initialized && this._queue.length) {
      this._queue.forEach(([name, props]) => this._sendEvent(name, props));
      this._queue = [];
    }
  }

  _sendEvent(name, properties = {}) {
    if (this._disabled || isPerformanceAudit()) {
      return;
    }

    if (!this._track) {
      this._init();
    }

    if (!this._track) {
      if (this._queue.length < 50) {
        this._queue.push([name, properties]);
      }
      return;
    }

    try {
      this._track(name, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.debug('[Analytics] track failed:', err.message);
    }
  }

  // ─────────────────────────────────────────────
  // Portfolio-specific events
  // ─────────────────────────────────────────────

  /**
   * User asked a question in the chatbot.
   * @param {string} question  Raw question text (truncated to 100 chars for privacy)
   * @param {string} intent    Inferred intent category (e.g. 'skills', 'projects', 'contact')
   * @param {string} model     AI model that responded
   */
  chatQuestion(question, intent = 'unknown', model = 'unknown') {
    this._sendEvent('chatbot_question', {
      question_preview: String(question).slice(0, 100),
      intent,
      model,
    });
  }

  /**
   * AI responded to a question.
   * @param {string} intent
   * @param {number} latencyMs   Response time in milliseconds
   * @param {boolean} streamed   Whether response was streamed
   */
  chatResponse(intent = 'unknown', latencyMs = 0, streamed = true) {
    this._sendEvent('chatbot_response', {
      intent,
      latency_ms: Math.round(latencyMs),
      streamed,
    });
  }

  /**
   * User viewed a portfolio section.
   * @param {string} section  e.g. 'experience', 'projects', 'skills', 'contact'
   */
  sectionView(section) {
    this._sendEvent('section_view', { section });
  }

  /**
   * User submitted the contact form.
   * @param {'success'|'error'} outcome
   * @param {string} [errorCode]   Error code if outcome is 'error'
   */
  contactFormSubmit(outcome, errorCode = null) {
    this._sendEvent('contact_form_submit', {
      outcome,
      ...(errorCode ? { error_code: errorCode } : {}),
    });
  }

  /** User clicked the resume download button. */
  resumeDownload() {
    this._sendEvent('resume_download', {});
  }

  /**
   * User toggled the color theme.
   * @param {'dark'|'light'} newTheme
   */
  themeToggle(newTheme) {
    this._sendEvent('theme_toggle', { theme: newTheme });
  }

  /**
   * User used voice I/O.
   * @param {'input'|'output'} direction
   */
  voiceUsed(direction) {
    this._sendEvent('voice_used', { direction });
  }

  /**
   * GitHub projects section loaded successfully.
   * @param {number} repoCount  Number of repos displayed
   * @param {'proxy'|'direct'|'cache'} source  How repos were fetched
   */
  githubProjectsLoaded(repoCount, source = 'proxy') {
    this._sendEvent('github_projects_loaded', {
      repo_count: repoCount,
      source,
    });
  }

  /**
   * User clicked a project card.
   * @param {string} projectName
   * @param {'github'|'live'} linkType
   */
  projectClick(projectName, linkType = 'github') {
    this._sendEvent('project_click', {
      project: String(projectName).slice(0, 80),
      link_type: linkType,
    });
  }

  /**
   * Generic custom event — use for any one-off tracking.
   * @param {string} name
   * @param {Record<string, string|number|boolean>} [props]
   */
  track(name, props = {}) {
    this._sendEvent(name, props);
  }
}

// Singleton export
export const analytics = new AnalyticsService();
