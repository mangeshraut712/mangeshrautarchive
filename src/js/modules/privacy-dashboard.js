/**
 * Privacy Dashboard & Personal Intelligence Controls
 *
 * Features:
 * - Data integration toggles (GitHub, Calendar, etc.)
 * - Privacy settings and consent management
 * - Memory/history controls
 * - GDPR compliance tools (export/delete data)
 * - Preference customization
 */

function getApiUrl(path) {
  const base =
    globalThis.APP_CONFIG?.apiBaseUrl ||
    (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
    '';
  let apiBase = base;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    // Vercel blocked — use Cloudflare edge worker (same as CHAT_API_BASE)
    if (!apiBase || /mangeshraut\.pro|vercel\.app/i.test(apiBase)) {
      apiBase = 'https://assistme-chat.mangeshraut712.workers.dev';
    }
  }
  const apiBaseNormalized = apiBase ? apiBase.replace(/\/$/, '') : '';
  return apiBaseNormalized
    ? `${apiBaseNormalized}${path.startsWith('/') ? path : `/${path}`}`
    : path;
}

class PrivacyDashboard {
  constructor() {
    this.settings = this.loadSettings();
    this.isOpen = false;
    this.createDashboard();
  }

  loadSettings() {
    const defaults = {
      github_integration: true,
      calendar_integration: true,
      memory_enabled: true,
      memory_retention: '30days',
      response_length: 'balanced',
      technical_level: 'intermediate',
      communication_style: 'professional',
    };

    try {
      const saved =
        localStorage.getItem('assistme_privacy_settings:v1') ||
        localStorage.getItem('assistme_privacy_settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  saveSettings() {
    try {
      const serialized = JSON.stringify(this.settings);
      localStorage.setItem('assistme_privacy_settings:v1', serialized);
      localStorage.setItem('assistme_privacy_settings', serialized);
      this.syncWithBackend();
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  }

  async syncWithBackend() {
    try {
      const response = await fetch(getApiUrl('/api/personalization/preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            github_integration: this.settings.github_integration,
            calendar_integration: this.settings.calendar_integration,
            response_length: this.settings.response_length,
            technical_level: this.settings.technical_level,
            communication_style: this.settings.communication_style,
          },
        }),
      });

      // Edge stub returns 200 with mode=client_local; localStorage remains source of truth.
      if (!response.ok) {
        console.info('Preferences kept on-device (edge personalization is client-local).');
      }
    } catch {
      // Offline / edge unavailable — local settings still apply on GitHub Pages.
    }
  }

  createDashboard() {
    let dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) {
      dashboard = document.createElement('div');
      dashboard.id = 'privacy-dashboard';
      dashboard.className = 'privacy-dashboard hidden';
      dashboard.setAttribute('role', 'dialog');
      dashboard.setAttribute('aria-modal', 'true');
      dashboard.setAttribute('aria-labelledby', 'privacy-dashboard-title');
      dashboard.innerHTML = `
        <div class="privacy-header">
          <button type="button" class="privacy-back-btn" id="privacy-back-btn" aria-label="Back to chat" title="Back to chat">
            <i class="fas fa-chevron-left" aria-hidden="true"></i>
            <span>Chat</span>
          </button>
          <div class="privacy-header-title-wrap">
            <h2 id="privacy-dashboard-title" class="privacy-title">
              <span class="privacy-title-icon" aria-hidden="true">🛡️</span>
              <span>Privacy & Settings</span>
            </h2>
            <p class="privacy-subtitle">On-device privacy & AssistMe tuning</p>
          </div>
          <button class="close-btn privacy-close-btn" aria-label="Close" title="Close">×</button>
        </div>

        <div class="privacy-content">
          <!-- Data Integrations -->
          <div class="privacy-section">
            <div class="privacy-section-header">
              <h3 class="section-title">🔗 Data Integrations</h3>
              <p class="section-desc">Connect live portfolio and scheduling streams.</p>
            </div>
            <div class="privacy-card">
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-title-row">
                    <strong>GitHub Integration</strong>
                    <span class="apple-badge connected">● Connected: @mangeshraut712</span>
                  </div>
                  <p>Provide AssistMe with real-time knowledge of pinned repositories, commit history, and code statistics.</p>
                  <div class="privacy-action-links">
                    <a href="https://github.com/mangeshraut712" target="_blank" rel="noopener noreferrer" class="privacy-action-link">
                      View GitHub Profile ↗
                    </a>
                  </div>
                </div>
                <label class="toggle-switch" aria-label="Toggle GitHub Integration">
                  <input type="checkbox" id="github-integration" ${this.settings.github_integration ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-title-row">
                    <strong>Google Calendar & Scheduling</strong>
                    <span class="apple-badge active">● Active & Available</span>
                  </div>
                  <p>Allow AssistMe to surface available meeting slots and schedule 1:1 sessions with Mangesh.</p>
                  <div class="privacy-action-links">
                    <button type="button" class="privacy-action-btn" id="privacy-book-cal-btn">
                      📅 Book 1:1 on Calendly ↗
                    </button>
                    <button type="button" class="privacy-action-btn secondary" id="privacy-view-cal-btn">
                      Check Schedule in Contact
                    </button>
                  </div>
                </div>
                <label class="toggle-switch" aria-label="Toggle Google Calendar Integration">
                  <input type="checkbox" id="calendar-integration" ${this.settings.calendar_integration ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Memory Settings -->
          <div class="privacy-section">
            <div class="privacy-section-header">
              <h3 class="section-title">🧠 Memory & Session Context</h3>
              <p class="section-desc">Control how AssistMe remembers your questions across sessions.</p>
            </div>
            <div class="privacy-card">
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Conversation Memory</strong>
                  <p>Preserve dialogue context across turns for natural multi-step conversations.</p>
                </div>
                <label class="toggle-switch" aria-label="Toggle Conversation Memory">
                  <input type="checkbox" id="memory-enabled" ${this.settings.memory_enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item vertical-stack">
                <div class="setting-info">
                  <label for="memory-retention">
                    <strong>Memory Retention</strong>
                  </label>
                  <p>Choose when local conversation history is automatically cleared from your browser.</p>
                </div>
                <select id="memory-retention" class="setting-select">
                  <option value="session" ${this.settings.memory_retention === 'session' ? 'selected' : ''}>Current session only</option>
                  <option value="7days" ${this.settings.memory_retention === '7days' ? 'selected' : ''}>7 days</option>
                  <option value="30days" ${this.settings.memory_retention === '30days' ? 'selected' : ''}>30 days</option>
                  <option value="forever" ${this.settings.memory_retention === 'forever' ? 'selected' : ''}>Until manually cleared</option>
                </select>
              </div>
            </div>
          </div>

          <!-- AI Personalization -->
          <div class="privacy-section">
            <div class="privacy-section-header">
              <h3 class="section-title">✨ AI Personalization & Voice</h3>
              <p class="section-desc">Customize how AssistMe structures answers and explains engineering concepts.</p>
            </div>
            <div class="privacy-card">
              <div class="setting-item vertical-stack">
                <div class="setting-info">
                  <label for="response-length">
                    <strong>Response Length</strong>
                  </label>
                  <p>Preferred verbosity of assistant answers.</p>
                </div>
                <select id="response-length" class="setting-select">
                  <option value="concise" ${this.settings.response_length === 'concise' ? 'selected' : ''}>Concise (50-100 words)</option>
                  <option value="balanced" ${this.settings.response_length === 'balanced' ? 'selected' : ''}>Balanced (100-150 words)</option>
                  <option value="detailed" ${this.settings.response_length === 'detailed' ? 'selected' : ''}>Detailed (150+ words)</option>
                </select>
              </div>

              <div class="setting-item vertical-stack">
                <div class="setting-info">
                  <label for="technical-level">
                    <strong>Technical Level</strong>
                  </label>
                  <p>Depth of technical terminology, code snippets, and system design specifics.</p>
                </div>
                <select id="technical-level" class="setting-select">
                  <option value="beginner" ${this.settings.technical_level === 'beginner' ? 'selected' : ''}>Overview (high-level summaries)</option>
                  <option value="intermediate" ${this.settings.technical_level === 'intermediate' ? 'selected' : ''}>Intermediate (systems & stack)</option>
                  <option value="expert" ${this.settings.technical_level === 'expert' ? 'selected' : ''}>Expert (full architecture & code)</option>
                </select>
              </div>

              <div class="setting-item vertical-stack">
                <div class="setting-info">
                  <label for="communication-style">
                    <strong>Communication Style</strong>
                  </label>
                  <p>Tone of voice when answering inquiries.</p>
                </div>
                <select id="communication-style" class="setting-select">
                  <option value="casual" ${this.settings.communication_style === 'casual' ? 'selected' : ''}>Casual & Friendly</option>
                  <option value="professional" ${this.settings.communication_style === 'professional' ? 'selected' : ''}>Professional</option>
                  <option value="formal" ${this.settings.communication_style === 'formal' ? 'selected' : ''}>Formal & Executive</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Data Management -->
          <div class="privacy-section">
            <div class="privacy-section-header">
              <h3 class="section-title">📊 Data Management & Rights</h3>
              <p class="section-desc">GDPR & CCPA-compliant controls. Your data stays strictly on your device.</p>
            </div>
            <div class="privacy-card">
              <div class="setting-item buttons-row">
                <div class="data-actions">
                  <button type="button" class="data-btn" id="export-data-btn">
                    <span class="icon">⬇️</span>
                    <span>Export My Data</span>
                  </button>
                  <button type="button" class="data-btn danger" id="delete-data-btn">
                    <span class="icon">🗑️</span>
                    <span>Delete All Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="privacy-footer">
          <button type="button" class="btn-secondary" id="cancel-btn">Cancel</button>
          <button type="button" class="btn-primary" id="save-btn">Save Changes</button>
        </div>
      `;
    }

    const widget = document.getElementById('chatbot-widget');
    if (widget && dashboard.parentElement !== widget) {
      widget.appendChild(dashboard);
    } else if (!dashboard.parentElement) {
      if (document.body) {
        document.body.appendChild(dashboard);
      }
    }

    this.attachEventListeners(dashboard);
    this.applyStyles();
    return dashboard;
  }

  ensureMounted() {
    let dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) {
      dashboard = this.createDashboard();
    }
    const widget = document.getElementById('chatbot-widget');
    if (widget && dashboard.parentElement !== widget) {
      widget.appendChild(dashboard);
    }
    return dashboard;
  }

  attachEventListeners(dashboard = document.getElementById('privacy-dashboard')) {
    if (!dashboard) return;
    if (dashboard.dataset.bound === 'true') return;
    dashboard.dataset.bound = 'true';

    // Open/Close
    dashboard.querySelector('.close-btn')?.addEventListener('click', () => this.close());
    dashboard.querySelector('#privacy-back-btn')?.addEventListener('click', () => this.close());
    dashboard.querySelector('#cancel-btn')?.addEventListener('click', () => this.close());

    // Escape key
    dashboard.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        e.stopPropagation();
        this.close();
      }
    });

    // Calendar direct action buttons
    dashboard.querySelector('#privacy-book-cal-btn')?.addEventListener('click', () => {
      this.close();
      window.open('https://calendly.com/mbr63/30min', '_blank', 'noopener,noreferrer');
    });

    dashboard.querySelector('#privacy-view-cal-btn')?.addEventListener('click', () => {
      this.close();
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = 'contact.html#contact-calendar';
      }
    });

    // Save button
    dashboard.querySelector('#save-btn')?.addEventListener('click', () => {
      this.updateSettingsFromUI();
      this.saveSettings();
      this.close();
      this.showToast('✅ Privacy preferences saved successfully!');
    });

    // Data export
    dashboard.querySelector('#export-data-btn')?.addEventListener('click', () => {
      this.exportUserData();
    });

    // Data deletion
    dashboard.querySelector('#delete-data-btn')?.addEventListener('click', () => {
      this.confirmDeleteData();
    });

    // Real-time toggle feedback
    dashboard.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
      toggle.addEventListener('change', e => {
        const key = e.target.id.replace(/-/g, '_');
        this.settings[key] = e.target.checked;
      });
    });
  }

  updateSettingsFromUI() {
    const dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) return;

    const githubEl = dashboard.querySelector('#github-integration');
    const calEl = dashboard.querySelector('#calendar-integration');
    const memEl = dashboard.querySelector('#memory-enabled');
    const retEl = dashboard.querySelector('#memory-retention');
    const lenEl = dashboard.querySelector('#response-length');
    const techEl = dashboard.querySelector('#technical-level');
    const styleEl = dashboard.querySelector('#communication-style');

    if (githubEl) this.settings.github_integration = githubEl.checked;
    if (calEl) this.settings.calendar_integration = calEl.checked;
    if (memEl) this.settings.memory_enabled = memEl.checked;
    if (retEl) this.settings.memory_retention = retEl.value;
    if (lenEl) this.settings.response_length = lenEl.value;
    if (techEl) this.settings.technical_level = techEl.value;
    if (styleEl) this.settings.communication_style = styleEl.value;
  }

  async exportUserData() {
    try {
      let backendData = {};
      try {
        const response = await fetch(getApiUrl('/api/personalization/export'));
        if (response.ok) {
          backendData = await response.json();
        }
      } catch {
        // Backend offline — export client data
      }

      const clientData = {
        exportedAt: new Date().toISOString(),
        settings: this.settings,
        chatSession: localStorage.getItem('assistme-chat-session-v1'),
        sessionId: localStorage.getItem('assistme_session_id'),
        ...backendData,
      };

      const blob = new Blob([JSON.stringify(clientData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `assistme-privacy-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      this.showToast('✅ Data exported successfully!');
    } catch (error) {
      this.showToast('❌ Export failed. Please try again.');
      console.error('Export error:', error);
    }
  }

  confirmDeleteData() {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete your stored preferences, session history, and cached context from this device.\n\nContinue?'
    );

    if (confirmed) {
      this.deleteAllData();
    }
  }

  async deleteAllData() {
    try {
      localStorage.removeItem('assistme_privacy_settings:v1');
      localStorage.removeItem('assistme_privacy_settings');
      localStorage.removeItem('assistme_session_id');
      localStorage.removeItem('assistme-chat-session-v1');
      localStorage.removeItem('assistme-chat-session-id-v1');

      try {
        await fetch(getApiUrl('/api/personalization/delete'), { method: 'DELETE' });
      } catch {
        // Offline
      }

      this.showToast('✅ All on-device data deleted. Refreshing page...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      this.showToast('❌ Deletion failed. Please try again.');
      console.error('Delete error:', error);
    }
  }

  open() {
    // 1. If chatbot widget is closed, open it first
    const widget = document.getElementById('chatbot-widget');
    if (widget && (widget.classList.contains('hidden') || !widget.classList.contains('visible'))) {
      if (
        window.appleIntelligenceChatbot &&
        typeof window.appleIntelligenceChatbot.openWidget === 'function'
      ) {
        window.appleIntelligenceChatbot.openWidget();
      } else {
        const toggle = document.getElementById('chatbot-toggle');
        toggle?.click();
      }
    }

    // 2. Ensure dashboard is mounted inside chatbot-widget
    const dashboard = this.ensureMounted();
    if (!dashboard) return;

    // 3. Make dashboard visible inside chatbot
    dashboard.classList.remove('hidden');
    dashboard.classList.add('visible');
    this.isOpen = true;

    // 4. Reset scroll position to top
    const content = dashboard.querySelector('.privacy-content');
    if (content) content.scrollTop = 0;

    // 5. Focus back button or close button for accessibility
    setTimeout(() => {
      (
        dashboard.querySelector('#privacy-back-btn') || dashboard.querySelector('.close-btn')
      )?.focus();
    }, 50);
  }

  close() {
    const dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) return;
    dashboard.classList.remove('visible');
    dashboard.classList.add('hidden');
    this.isOpen = false;

    // Return focus to chat input
    const input = document.getElementById('chatbot-input');
    if (input) input.focus({ preventScroll: true });
  }

  showToast(message) {
    const host =
      document.getElementById('privacy-dashboard') ||
      document.getElementById('chatbot-widget') ||
      document.body;
    const toast = document.createElement('div');
    toast.className = 'privacy-toast';
    toast.textContent = message;
    host.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  applyStyles() {
    if (document.getElementById('privacy-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'privacy-dashboard-styles';
    style.textContent = `
      /* Privacy Dashboard inside AssistMe Chatbot - Apple HIG Style */
      #privacy-dashboard,
      .privacy-dashboard {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 100 !important;
        display: flex !important;
        flex-direction: column !important;
        background: rgba(255, 255, 255, 0.96) !important;
        -webkit-backdrop-filter: blur(40px) saturate(190%) !important;
        backdrop-filter: blur(40px) saturate(190%) !important;
        border-radius: inherit !important;
        overflow: hidden !important;
        color: #1d1d1f !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif !important;
        animation: privacySlideIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-sizing: border-box !important;
      }

      #privacy-dashboard.hidden,
      .privacy-dashboard.hidden {
        display: none !important;
      }

      html.dark #privacy-dashboard,
      html[data-theme="dark"] #privacy-dashboard,
      html.dark .privacy-dashboard,
      html[data-theme="dark"] .privacy-dashboard {
        background: rgba(24, 24, 27, 0.97) !important;
        color: #f5f5f7 !important;
      }

      @keyframes privacySlideIn {
        from {
          opacity: 0;
          transform: translateY(14px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #privacy-dashboard,
        .privacy-dashboard {
          animation: none !important;
        }
      }

      .privacy-overlay {
        display: none !important;
      }

      .privacy-panel {
        display: contents !important;
      }

      .privacy-header {
        padding: 10px 14px !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
        background: rgba(255, 255, 255, 0.88) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        backdrop-filter: blur(20px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }

      html.dark .privacy-header,
      html[data-theme="dark"] .privacy-header {
        border-bottom-color: rgba(255, 255, 255, 0.1) !important;
        background: rgba(28, 28, 30, 0.92) !important;
      }

      .privacy-back-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        background: transparent !important;
        border: none !important;
        color: #0071e3 !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        padding: 6px 8px !important;
        border-radius: 8px !important;
        min-height: 36px !important;
        min-width: 36px !important;
        transition: background 0.15s ease, opacity 0.15s ease !important;
        font-family: inherit !important;
        flex-shrink: 0 !important;
      }

      .privacy-back-btn:hover {
        background: rgba(0, 113, 227, 0.08) !important;
      }

      html.dark .privacy-back-btn,
      html[data-theme="dark"] .privacy-back-btn {
        color: #2997ff !important;
      }

      html.dark .privacy-back-btn:hover,
      html[data-theme="dark"] .privacy-back-btn:hover {
        background: rgba(41, 151, 255, 0.12) !important;
      }

      .privacy-header-title-wrap {
        flex: 1 !important;
        text-align: center !important;
        min-width: 0 !important;
        padding: 0 4px !important;
      }

      .privacy-header-title-wrap h2,
      .privacy-title,
      #privacy-dashboard-title {
        margin: 0 !important;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
        letter-spacing: -0.01em !important;
        color: #1d1d1f !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
      }

      html.dark .privacy-header-title-wrap h2,
      html.dark .privacy-title,
      html.dark #privacy-dashboard-title,
      html[data-theme="dark"] .privacy-header-title-wrap h2,
      html[data-theme="dark"] .privacy-title,
      html[data-theme="dark"] #privacy-dashboard-title {
        color: #f5f5f7 !important;
      }

      .privacy-subtitle {
        margin: 1px 0 0 0 !important;
        font-size: 0.7rem !important;
        color: #6e6e73 !important;
        line-height: 1.25 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      html.dark .privacy-subtitle,
      html[data-theme="dark"] .privacy-subtitle {
        color: #a1a1a6 !important;
      }

      /* Unified Apple circular red close button */
      .privacy-close-btn,
      #privacy-dashboard .close-btn {
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        border-radius: 50% !important;
        background: #ff3b30 !important;
        border: none !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        line-height: 1 !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: 0 2px 6px rgba(255, 59, 48, 0.35) !important;
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease !important;
        flex-shrink: 0 !important;
      }

      .privacy-close-btn:hover,
      #privacy-dashboard .close-btn:hover {
        background: #e02d23 !important;
        transform: scale(1.08) !important;
      }

      .privacy-close-btn:active,
      #privacy-dashboard .close-btn:active {
        transform: scale(0.95) !important;
      }

      /* Scrollable Content */
      .privacy-content {
        padding: 12px 14px 16px 14px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        flex: 1 !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: thin !important;
        scrollbar-color: rgba(0, 0, 0, 0.18) transparent !important;
        box-sizing: border-box !important;
      }

      .privacy-content::-webkit-scrollbar {
        width: 5px !important;
      }

      .privacy-content::-webkit-scrollbar-track {
        background: transparent !important;
      }

      .privacy-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.18) !important;
        border-radius: 6px !important;
      }

      html.dark .privacy-content::-webkit-scrollbar-thumb,
      html[data-theme="dark"] .privacy-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.22) !important;
      }

      .privacy-section {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 0 14px 0 !important;
        min-height: auto !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }

      .privacy-section-header {
        padding: 0 4px 6px 4px !important;
      }

      .section-title {
        margin: 0 !important;
        font-size: 0.78rem !important;
        font-weight: 600 !important;
        color: #6e6e73 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.04em !important;
      }

      html.dark .section-title,
      html[data-theme="dark"] .section-title {
        color: #98989d !important;
      }

      .section-desc {
        color: #86868b !important;
        font-size: 0.74rem !important;
        margin: 2px 0 0 0 !important;
        line-height: 1.35 !important;
      }

      html.dark .section-desc,
      html[data-theme="dark"] .section-desc {
        color: #8e8e93 !important;
      }

      .privacy-card {
        background: rgba(0, 0, 0, 0.03) !important;
        border: 1px solid rgba(0, 0, 0, 0.07) !important;
        border-radius: 14px !important;
        overflow: hidden !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
      }

      html.dark .privacy-card,
      html[data-theme="dark"] .privacy-card {
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: rgba(255, 255, 255, 0.08) !important;
      }

      .setting-item {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        padding: 10px 12px !important;
        background: transparent !important;
        border: none !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        transition: background-color 0.15s ease !important;
      }

      .setting-item:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
      }

      html.dark .setting-item:not(:last-child),
      html[data-theme="dark"] .setting-item:not(:last-child) {
        border-bottom-color: rgba(255, 255, 255, 0.06) !important;
      }

      .setting-info {
        flex: 1 !important;
        min-width: 0 !important;
      }

      .setting-title-row {
        display: flex !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        margin-bottom: 2px !important;
      }

      .setting-info strong {
        display: inline-block !important;
        font-size: 0.88rem !important;
        font-weight: 600 !important;
        color: #1d1d1f !important;
      }

      html.dark .setting-info strong,
      html[data-theme="dark"] .setting-info strong {
        color: #f5f5f7 !important;
      }

      .setting-info p {
        margin: 2px 0 0 0 !important;
        font-size: 0.76rem !important;
        color: #6e6e73 !important;
        line-height: 1.35 !important;
      }

      html.dark .setting-info p,
      html[data-theme="dark"] .setting-info p {
        color: #a1a1a6 !important;
      }

      /* Apple Badges */
      .apple-badge {
        display: inline-flex !important;
        align-items: center !important;
        padding: 2px 6px !important;
        border-radius: 6px !important;
        font-size: 0.68rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em !important;
      }

      .apple-badge.connected {
        background: rgba(0, 113, 227, 0.12) !important;
        color: #0071e3 !important;
        border: 1px solid rgba(0, 113, 227, 0.25) !important;
      }

      html.dark .apple-badge.connected,
      html[data-theme="dark"] .apple-badge.connected {
        background: rgba(0, 113, 227, 0.2) !important;
        color: #2997ff !important;
        border-color: rgba(0, 113, 227, 0.4) !important;
      }

      .apple-badge.active {
        background: rgba(52, 199, 89, 0.14) !important;
        color: #248a3d !important;
        border: 1px solid rgba(52, 199, 89, 0.3) !important;
      }

      html.dark .apple-badge.active,
      html[data-theme="dark"] .apple-badge.active {
        background: rgba(52, 199, 89, 0.2) !important;
        color: #30d158 !important;
        border-color: rgba(52, 199, 89, 0.4) !important;
      }

      .privacy-action-links {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        margin-top: 6px !important;
      }

      .privacy-action-btn,
      .privacy-action-link {
        display: inline-flex !important;
        align-items: center !important;
        padding: 4px 8px !important;
        border-radius: 6px !important;
        font-size: 0.74rem !important;
        font-weight: 500 !important;
        text-decoration: none !important;
        border: 1px solid rgba(0, 113, 227, 0.3) !important;
        background: rgba(0, 113, 227, 0.08) !important;
        color: #0071e3 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        font-family: inherit !important;
      }

      html.dark .privacy-action-btn,
      html.dark .privacy-action-link,
      html[data-theme="dark"] .privacy-action-btn,
      html[data-theme="dark"] .privacy-action-link {
        color: #2997ff !important;
        border-color: rgba(41, 151, 255, 0.35) !important;
        background: rgba(41, 151, 255, 0.12) !important;
      }

      .privacy-action-btn:hover,
      .privacy-action-link:hover {
        background: #0071e3 !important;
        color: #ffffff !important;
        border-color: #0071e3 !important;
      }

      .privacy-action-btn.secondary {
        border-color: rgba(120, 120, 128, 0.22) !important;
        background: rgba(120, 120, 128, 0.08) !important;
        color: #1d1d1f !important;
      }

      html.dark .privacy-action-btn.secondary,
      html[data-theme="dark"] .privacy-action-btn.secondary {
        color: #f5f5f7 !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.15) !important;
      }

      .privacy-action-btn.secondary:hover {
        background: rgba(120, 120, 128, 0.2) !important;
      }

      /* Apple iOS Toggle Switch */
      .toggle-switch {
        position: relative !important;
        display: inline-block !important;
        width: 44px !important;
        height: 26px !important;
        flex-shrink: 0 !important;
        cursor: pointer !important;
      }

      .toggle-switch input {
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
      }

      .toggle-slider {
        position: absolute !important;
        cursor: pointer !important;
        inset: 0 !important;
        background-color: rgba(120, 120, 128, 0.24) !important;
        transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        border-radius: 26px !important;
      }

      html.dark .toggle-slider,
      html[data-theme="dark"] .toggle-slider {
        background-color: rgba(120, 120, 128, 0.35) !important;
      }

      .toggle-slider::before {
        position: absolute !important;
        content: "" !important;
        height: 20px !important;
        width: 20px !important;
        left: 3px !important;
        bottom: 3px !important;
        background-color: #ffffff !important;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        border-radius: 50% !important;
      }

      input:checked + .toggle-slider {
        background-color: #34c759 !important;
      }

      input:checked + .toggle-slider::before {
        transform: translateX(18px) !important;
      }

      .setting-select {
        padding: 6px 26px 6px 10px !important;
        border: 1px solid rgba(0, 0, 0, 0.12) !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236e6e73' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 8px center !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        font-size: 0.8rem !important;
        color: #1d1d1f !important;
        cursor: pointer !important;
        outline: none !important;
        transition: border-color 0.15s ease !important;
        font-family: inherit !important;
        max-width: 175px !important;
      }

      html.dark .setting-select,
      html[data-theme="dark"] .setting-select {
        background-color: #2c2c2e !important;
        border-color: rgba(255, 255, 255, 0.15) !important;
        color: #f5f5f7 !important;
      }

      .setting-select:focus {
        border-color: #0071e3 !important;
      }

      .data-actions {
        display: flex !important;
        gap: 8px !important;
        width: 100% !important;
      }

      .data-btn {
        flex: 1 !important;
        padding: 7px 10px !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        border-radius: 9px !important;
        background: rgba(0, 0, 0, 0.02) !important;
        color: #1d1d1f !important;
        cursor: pointer !important;
        font-size: 0.78rem !important;
        font-weight: 500 !important;
        transition: all 0.15s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        font-family: inherit !important;
      }

      html.dark .data-btn,
      html[data-theme="dark"] .data-btn {
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: rgba(255, 255, 255, 0.12) !important;
        color: #f5f5f7 !important;
      }

      .data-btn:hover {
        background: rgba(0, 0, 0, 0.06) !important;
        transform: translateY(-1px) !important;
      }

      html.dark .data-btn:hover,
      html[data-theme="dark"] .data-btn:hover {
        background: rgba(255, 255, 255, 0.08) !important;
      }

      .data-btn.danger {
        color: #ff3b30 !important;
        border-color: rgba(255, 59, 48, 0.3) !important;
        background: rgba(255, 59, 48, 0.06) !important;
      }

      .data-btn.danger:hover {
        background: rgba(255, 59, 48, 0.14) !important;
      }

      .privacy-footer {
        padding: 10px 14px !important;
        border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
        background: rgba(255, 255, 255, 0.88) !important;
        display: flex !important;
        gap: 8px !important;
        justify-content: flex-end !important;
        align-items: center !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }

      html.dark .privacy-footer,
      html[data-theme="dark"] .privacy-footer {
        border-top-color: rgba(255, 255, 255, 0.1) !important;
        background: rgba(28, 28, 30, 0.92) !important;
      }

      .btn-secondary,
      .btn-primary {
        padding: 7px 14px !important;
        border-radius: 9px !important;
        font-size: 0.84rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        font-family: inherit !important;
      }

      .btn-secondary {
        background: transparent !important;
        border: 1px solid rgba(0, 0, 0, 0.15) !important;
        color: #1d1d1f !important;
      }

      html.dark .btn-secondary,
      html[data-theme="dark"] .btn-secondary {
        border-color: rgba(255, 255, 255, 0.2) !important;
        color: #f5f5f7 !important;
      }

      .btn-secondary:hover {
        background: rgba(0, 0, 0, 0.05) !important;
      }

      html.dark .btn-secondary:hover,
      html[data-theme="dark"] .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.08) !important;
      }

      .btn-primary {
        background: #0071e3 !important;
        border: none !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3) !important;
      }

      .btn-primary:hover {
        background: #0077ed !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0, 113, 227, 0.45) !important;
      }

      .privacy-toast {
        position: absolute !important;
        bottom: 58px !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(16px) !important;
        background: rgba(29, 29, 31, 0.94) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        backdrop-filter: blur(16px) !important;
        color: #ffffff !important;
        padding: 6px 14px !important;
        border-radius: 10px !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
        z-index: 120 !important;
        opacity: 0 !important;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        font-size: 0.78rem !important;
        font-weight: 500 !important;
        pointer-events: none !important;
        white-space: nowrap !important;
      }

      .privacy-toast.show {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }

      @media (max-width: 360px) {
        .setting-item.vertical-stack {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .setting-select {
          max-width: 100% !important;
          width: 100% !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  getSettings() {
    return { ...this.settings };
  }
}

// Export singleton instance
export const privacyDashboard = new PrivacyDashboard();
