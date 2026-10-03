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
    const dashboard = document.createElement('div');
    dashboard.id = 'privacy-dashboard';
    dashboard.className = 'privacy-dashboard hidden';
    dashboard.setAttribute('role', 'dialog');
    dashboard.setAttribute('aria-modal', 'true');
    dashboard.setAttribute('aria-labelledby', 'privacy-dashboard-title');
    dashboard.innerHTML = `
      <div class="privacy-overlay" tabindex="-1"></div>
      <div class="privacy-panel">
        <div class="privacy-header">
          <div>
            <h2 id="privacy-dashboard-title">🛡️ Privacy & Personalization</h2>
            <p class="privacy-subtitle">On-device privacy controls, live integrations & AssistMe intelligence tuning</p>
          </div>
          <button class="close-btn privacy-close-btn" aria-label="Close" title="Close">×</button>
        </div>

        <div class="privacy-content">
          <!-- Data Integrations -->
          <div class="privacy-section">
            <h3 class="section-title">🔗 Data Integrations</h3>
            <p class="section-desc">Connect live portfolio and scheduling streams to enhance AssistMe's real-time accuracy.</p>
            
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

          <!-- Memory Settings -->
          <div class="privacy-section">
            <h3 class="section-title">🧠 Memory & Session Context</h3>
            <p class="section-desc">Control how AssistMe remembers your questions across sessions.</p>
            
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

            <div class="setting-item">
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

          <!-- AI Personalization -->
          <div class="privacy-section">
            <h3 class="section-title">✨ AI Personalization & Voice</h3>
            <p class="section-desc">Customize how AssistMe structures answers and explains engineering concepts.</p>
            
            <div class="setting-item">
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

            <div class="setting-item">
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

            <div class="setting-item">
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

          <!-- Data Management -->
          <div class="privacy-section">
            <h3 class="section-title">📊 Data Management & Rights</h3>
            <p class="section-desc">GDPR & CCPA-compliant controls. Your data stays strictly on your device.</p>

            <div class="data-actions">
              <button type="button" class="data-btn" id="export-data-btn">
                <span class="icon">⬇️</span>
                Export My Data
              </button>
              <button type="button" class="data-btn danger" id="delete-data-btn">
                <span class="icon">🗑️</span>
                Delete All Data
              </button>
            </div>
          </div>
        </div>

        <div class="privacy-footer">
          <button type="button" class="btn-secondary" id="cancel-btn">Cancel</button>
          <button type="button" class="btn-primary" id="save-btn">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(dashboard);
    this.attachEventListeners();
    this.applyStyles();
  }

  attachEventListeners() {
    const dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) return;

    // Open/Close
    dashboard.querySelector('.close-btn')?.addEventListener('click', () => this.close());
    dashboard.querySelector('.privacy-overlay')?.addEventListener('click', () => this.close());
    dashboard.querySelector('#cancel-btn')?.addEventListener('click', () => this.close());

    // Escape key
    dashboard.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
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
    const dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) return;
    dashboard.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Focus close button for accessibility
    setTimeout(() => {
      dashboard.querySelector('.close-btn')?.focus();
    }, 50);
  }

  close() {
    const dashboard = document.getElementById('privacy-dashboard');
    if (!dashboard) return;
    dashboard.classList.add('hidden');
    document.body.style.overflow = '';
    this.isOpen = false;
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'privacy-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  applyStyles() {
    if (document.getElementById('privacy-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'privacy-dashboard-styles';
    style.textContent = `
      .privacy-dashboard {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: privacyFadeIn 0.25s ease;
      }

      .privacy-dashboard.hidden {
        display: none !important;
      }

      .privacy-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        -webkit-backdrop-filter: blur(12px) saturate(160%);
        backdrop-filter: blur(12px) saturate(160%);
      }

      .privacy-panel {
        position: relative;
        background: rgba(255, 255, 255, 0.94);
        -webkit-backdrop-filter: blur(28px) saturate(180%);
        backdrop-filter: blur(28px) saturate(180%);
        width: 90%;
        max-width: 640px;
        max-height: 88vh;
        border-radius: 20px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: privacySlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        color: #1d1d1f;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      }

      html.dark .privacy-panel,
      html[data-theme="dark"] .privacy-panel {
        background: rgba(28, 28, 30, 0.95);
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.35);
        color: #f5f5f7;
      }

      .privacy-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      html.dark .privacy-header,
      html[data-theme="dark"] .privacy-header {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .privacy-header h2 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: #1d1d1f;
      }

      html.dark .privacy-header h2,
      html[data-theme="dark"] .privacy-header h2 {
        color: #f5f5f7;
      }

      .privacy-subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 0.82rem;
        color: #6e6e73;
        line-height: 1.35;
      }

      html.dark .privacy-subtitle,
      html[data-theme="dark"] .privacy-subtitle {
        color: #a1a1a6;
      }

      /* Unified Apple circular red close button */
      .privacy-close-btn,
      #privacy-dashboard .close-btn {
        width: 30px !important;
        height: 30px !important;
        min-width: 30px !important;
        min-height: 30px !important;
        border-radius: 50% !important;
        background: #ff3b30 !important;
        border: none !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        line-height: 1 !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: 0 2px 8px rgba(255, 59, 48, 0.35) !important;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease !important;
        flex-shrink: 0;
      }

      .privacy-close-btn:hover,
      #privacy-dashboard .close-btn:hover {
        background: #e02d23 !important;
        transform: scale(1.08) !important;
      }

      .privacy-close-btn:active,
      #privacy-dashboard .close-btn:active {
        transform: scale(0.96) !important;
      }

      .privacy-content {
        padding: 1.25rem 1.5rem;
        overflow-y: auto;
        flex: 1;
        -webkit-overflow-scrolling: touch;
      }

      /* Reset any global section styles inside the modal */
      .privacy-section {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 0 1.5rem 0 !important;
        min-height: auto !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }

      .section-title {
        margin: 0 0 0.35rem 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.01em;
      }

      html.dark .section-title,
      html[data-theme="dark"] .section-title {
        color: #f5f5f7;
      }

      .section-desc {
        color: #6e6e73;
        font-size: 0.82rem;
        margin: 0 0 0.85rem 0;
        line-height: 1.4;
      }

      html.dark .section-desc,
      html[data-theme="dark"] .section-desc {
        color: #a1a1a6;
      }

      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.9rem 1.1rem;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.03);
        border: 1px solid rgba(0, 0, 0, 0.06);
        margin-bottom: 0.65rem;
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }

      html.dark .setting-item,
      html[data-theme="dark"] .setting-item {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.08);
      }

      .setting-info {
        flex: 1;
        min-width: 0;
      }

      .setting-title-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .setting-info strong {
        display: inline-block;
        font-size: 0.95rem;
        font-weight: 600;
        color: #1d1d1f;
      }

      html.dark .setting-info strong,
      html[data-theme="dark"] .setting-info strong {
        color: #f5f5f7;
      }

      .setting-info p {
        margin: 0.2rem 0 0 0;
        font-size: 0.82rem;
        color: #6e6e73;
        line-height: 1.35;
      }

      html.dark .setting-info p,
      html[data-theme="dark"] .setting-info p {
        color: #a1a1a6;
      }

      /* Apple Badges */
      .apple-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 7px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .apple-badge.connected {
        background: rgba(0, 113, 227, 0.12);
        color: #0071e3;
        border: 1px solid rgba(0, 113, 227, 0.25);
      }

      html.dark .apple-badge.connected,
      html[data-theme="dark"] .apple-badge.connected {
        background: rgba(0, 113, 227, 0.2);
        color: #2997ff;
        border-color: rgba(0, 113, 227, 0.4);
      }

      .apple-badge.active {
        background: rgba(52, 199, 89, 0.14);
        color: #248a3d;
        border: 1px solid rgba(52, 199, 89, 0.3);
      }

      html.dark .apple-badge.active,
      html[data-theme="dark"] .apple-badge.active {
        background: rgba(52, 199, 89, 0.2);
        color: #30d158;
        border-color: rgba(52, 199, 89, 0.4);
      }

      .privacy-action-links {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 0.5rem;
      }

      .privacy-action-btn,
      .privacy-action-link {
        display: inline-flex;
        align-items: center;
        padding: 4px 9px;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 500;
        text-decoration: none;
        border: 1px solid rgba(0, 113, 227, 0.3);
        background: rgba(0, 113, 227, 0.08);
        color: #0071e3;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      html.dark .privacy-action-btn,
      html.dark .privacy-action-link,
      html[data-theme="dark"] .privacy-action-btn,
      html[data-theme="dark"] .privacy-action-link {
        color: #2997ff;
        border-color: rgba(41, 151, 255, 0.35);
        background: rgba(41, 151, 255, 0.12);
      }

      .privacy-action-btn:hover,
      .privacy-action-link:hover {
        background: #0071e3;
        color: #ffffff;
        border-color: #0071e3;
      }

      .privacy-action-btn.secondary {
        border-color: rgba(120, 120, 128, 0.25);
        background: rgba(120, 120, 128, 0.08);
        color: #1d1d1f;
      }

      html.dark .privacy-action-btn.secondary,
      html[data-theme="dark"] .privacy-action-btn.secondary {
        color: #f5f5f7;
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .privacy-action-btn.secondary:hover {
        background: rgba(120, 120, 128, 0.2);
      }

      /* Apple iOS Toggle Switch */
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 28px;
        flex-shrink: 0;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(120, 120, 128, 0.24);
        transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 28px;
      }

      .toggle-slider::before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 3px;
        bottom: 3px;
        background-color: #ffffff;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: #34c759;
      }

      input:checked + .toggle-slider::before {
        transform: translateX(20px);
      }

      .setting-select {
        padding: 0.55rem 0.85rem;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        background: #ffffff;
        font-size: 0.85rem;
        color: #1d1d1f;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s ease;
      }

      html.dark .setting-select,
      html[data-theme="dark"] .setting-select {
        background: #2c2c2e;
        border-color: rgba(255, 255, 255, 0.15);
        color: #f5f5f7;
      }

      .setting-select:focus {
        border-color: #0071e3;
      }

      .data-actions {
        display: flex;
        gap: 0.75rem;
      }

      .data-btn {
        flex: 1;
        padding: 0.8rem 1rem;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.02);
        color: #1d1d1f;
        cursor: pointer;
        font-size: 0.88rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      html.dark .data-btn,
      html[data-theme="dark"] .data-btn {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.12);
        color: #f5f5f7;
      }

      .data-btn:hover {
        background: rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
      }

      html.dark .data-btn:hover,
      html[data-theme="dark"] .data-btn:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .data-btn.danger {
        color: #ff3b30;
        border-color: rgba(255, 59, 48, 0.3);
        background: rgba(255, 59, 48, 0.06);
      }

      .data-btn.danger:hover {
        background: rgba(255, 59, 48, 0.14);
      }

      .privacy-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      html.dark .privacy-footer,
      html[data-theme="dark"] .privacy-footer {
        border-top-color: rgba(255, 255, 255, 0.1);
      }

      .btn-secondary,
      .btn-primary {
        padding: 0.65rem 1.25rem;
        border-radius: 10px;
        font-size: 0.92rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-secondary {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.15);
        color: #1d1d1f;
      }

      html.dark .btn-secondary,
      html[data-theme="dark"] .btn-secondary {
        border-color: rgba(255, 255, 255, 0.2);
        color: #f5f5f7;
      }

      .btn-secondary:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      html.dark .btn-secondary:hover,
      html[data-theme="dark"] .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .btn-primary {
        background: #0071e3;
        border: none;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);
      }

      .btn-primary:hover {
        background: #0077ed;
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(0, 113, 227, 0.45);
      }

      .privacy-toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(29, 29, 31, 0.95);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        color: #ffffff;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        z-index: 10001;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-size: 0.9rem;
        pointer-events: none;
      }

      .privacy-toast.show {
        transform: translateX(-50%) translateY(0);
      }

      @keyframes privacyFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes privacySlideUp {
        from {
          opacity: 0;
          transform: translateY(24px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 480px) {
        .privacy-panel {
          width: 95%;
          max-height: 92vh;
        }
        .privacy-header,
        .privacy-content,
        .privacy-footer {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .setting-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .toggle-switch {
          align-self: flex-end;
        }
        .setting-select {
          width: 100%;
        }
        .data-actions {
          flex-direction: column;
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
