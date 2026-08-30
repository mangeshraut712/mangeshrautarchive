/**
 * Hyper-Personalization Engine — Apple HIG On-Device Persona & Visitor Lens Architecture.
 * Allows visitors, recruiters, and engineering leaders to view customized perspectives of Mangesh's portfolio.
 * 100% GDPR-compliant & local-only storage.
 */

export const LENSES = {
  general: {
    id: 'general',
    label: 'All-Around',
    icon: '🧭',
    badge: 'Standard Portfolio View',
    focus: 'Full overview across engineering, AI agents, cloud systems, and achievements.',
  },
  recruiter: {
    id: 'recruiter',
    label: 'Recruiter',
    icon: '🎯',
    badge: 'Recruiter & Hiring Lens',
    focus: 'Prioritizing work experience, key metrics, technical skills, and resume downloads.',
  },
  engineer: {
    id: 'engineer',
    label: 'Engineer / Architect',
    icon: '🛠️',
    badge: 'Engineering & Systems Lens',
    focus: 'Highlighting architectural case studies, system design, benchmarks, and GitHub code.',
  },
  founder: {
    id: 'founder',
    label: 'Founder / AI',
    icon: '🚀',
    badge: 'AI & Full-Stack Velocity Lens',
    focus: 'Spotlighting WebMCP agentic AI pipelines, LLM proxies, and end-to-end delivery.',
  },
};

const STORAGE_KEY = 'mangesh_portfolio_lens';

export class HyperPersonalizationEngine {
  constructor() {
    this.activeLens = 'general';
    this.listeners = new Set();
  }

  init() {
    // 1. Detect from URL query params (e.g. ?lens=recruiter, ?role=engineer, ?ref=linkedin)
    const urlParams = new URLSearchParams(window.location.search);
    const queryLens = urlParams.get('lens') || urlParams.get('role') || urlParams.get('persona');
    const ref = (urlParams.get('ref') || '').toLowerCase();

    if (queryLens && LENSES[queryLens.toLowerCase()]) {
      this.setLens(queryLens.toLowerCase(), false);
    } else if (
      ref.includes('linkedin') ||
      ref.includes('recruiter') ||
      ref.includes('greenhouse')
    ) {
      this.setLens('recruiter', false);
    } else {
      // 2. Read from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && LENSES[saved]) {
          this.setLens(saved, false);
        } else {
          this.applyLens('general');
        }
      } catch {
        this.applyLens('general');
      }
    }

    this.bindUI();
    return this;
  }

  setLens(lensId, persist = true) {
    if (!LENSES[lensId]) lensId = 'general';
    this.activeLens = lensId;
    this.applyLens(lensId);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, lensId);
      } catch {
        // Local storage unavailable or restricted
      }
    }

    this.notify();
  }

  applyLens(lensId) {
    document.documentElement.setAttribute('data-active-lens', lensId);

    // Update active state on any rendered lens pill buttons
    const pills = document.querySelectorAll('.persona-lens-pill');
    pills.forEach(pill => {
      const match = pill.getAttribute('data-lens') === lensId;
      pill.classList.toggle('is-active', match);
      pill.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    // Update contextual status badge if present
    const badgeEl = document.getElementById('persona-lens-status');
    if (badgeEl && LENSES[lensId]) {
      badgeEl.textContent = `${LENSES[lensId].icon} ${LENSES[lensId].badge}`;
    }

    // Adapt Chatbot context
    if (window.__assistMeContext) {
      window.__assistMeContext.activeLens = lensId;
    }
  }

  bindUI() {
    const container = document.getElementById('persona-lens-selector');
    if (!container) return;

    container.addEventListener('click', e => {
      const btn = e.target.closest('.persona-lens-pill');
      if (btn) {
        const targetLens = btn.getAttribute('data-lens');
        if (targetLens && LENSES[targetLens]) {
          this.setLens(targetLens, true);
        }
      }
    });

    // Keyboard navigation (ArrowLeft / ArrowRight)
    container.addEventListener('keydown', e => {
      const buttons = Array.from(container.querySelectorAll('.persona-lens-pill'));
      const currentIndex = buttons.findIndex(b => b === document.activeElement);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[prevIndex].focus();
        buttons[prevIndex].click();
      }
    });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const lensData = LENSES[this.activeLens];
    this.listeners.forEach(fn => fn(this.activeLens, lensData));
    window.dispatchEvent(
      new CustomEvent('portfolio:lens-changed', {
        detail: { lens: this.activeLens, meta: lensData },
      })
    );
  }

  getActiveLens() {
    return {
      id: this.activeLens,
      ...LENSES[this.activeLens],
    };
  }

  reset() {
    this.setLens('general', true);
  }
}

export const personalizationEngine = new HyperPersonalizationEngine();

if (typeof window !== 'undefined') {
  window.personalizationEngine = personalizationEngine;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => personalizationEngine.init());
  } else {
    personalizationEngine.init();
  }
}
