export class PrivacyDashboard {
  constructor() {
    ((this.settings = this.loadSettings()), (this.isOpen = !1), this.createDashboard());
  }
  loadSettings() {
    const n = {
      github_integration: !1,
      calendar_integration: !1,
      memory_enabled: !0,
      memory_retention: '30days',
      response_length: 'balanced',
      technical_level: 'intermediate',
      communication_style: 'professional',
    };
    try {
      const e = localStorage.getItem('assistme_privacy_settings');
      return e ? { ...n, ...JSON.parse(e) } : n;
    } catch {
      return n;
    }
  }
  saveSettings() {
    try {
      (localStorage.setItem('assistme_privacy_settings', JSON.stringify(this.settings)),
        this.syncWithBackend());
    } catch (n) {
      console.error('Failed to save privacy settings:', n);
    }
  }
  async syncWithBackend() {
    try {
      (
        await fetch('/api/personalization/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: {
              response_length: this.settings.response_length,
              technical_level: this.settings.technical_level,
              communication_style: this.settings.communication_style,
            },
          }),
        })
      ).ok || console.warn('Failed to sync preferences with backend');
    } catch (n) {
      console.error('Error syncing preferences:', n);
    }
  }
  createDashboard() {
    const n = document.createElement('div');
    ((n.id = 'privacy-dashboard'),
      (n.className = 'privacy-dashboard hidden'),
      (n.innerHTML = `\n            <div class="privacy-overlay"></div>\n            <div class="privacy-panel">\n                <div class="privacy-header">\n                    <h2>🛡️ Privacy & Personalization</h2>\n                    <button class="close-btn" aria-label="Close">×</button>\n                </div>\n\n                <div class="privacy-content">\n                    \x3c!-- Data Integrations --\x3e\n                    <section class="privacy-section">\n                        <h3>🔗 Data Integrations</h3>\n                        <p class="section-desc">Connect apps to enhance AI responses with personal context</p>\n                        \n                        <div class="setting-item">\n                            <div class="setting-info">\n                                <strong>GitHub Integration</strong>\n                                <p>Access live repository data and code statistics</p>\n                            </div>\n                            <label class="toggle-switch">\n                                <input type="checkbox" id="github-integration" ${this.settings.github_integration ? 'checked' : ''}>\n                                <span class="toggle-slider"></span>\n                            </label>\n                        </div>\n\n                        <div class="setting-item disabled">\n                            <div class="setting-info">\n                                <strong>Google Calendar</strong>\n                                <p>Schedule meetings and check availability</p>\n                                <span class="badge">Coming Soon</span>\n                            </div>\n                            <label class="toggle-switch">\n                                <input type="checkbox" id="calendar-integration" disabled>\n                                <span class="toggle-slider"></span>\n                            </label>\n                        </div>\n                    </section>\n\n                    \x3c!-- Memory Settings --\x3e\n                    <section class="privacy-section">\n                        <h3>🧠 Memory & History</h3>\n                        <p class="section-desc">Control how AI remembers your conversations</p>\n                        \n                        <div class="setting-item">\n                            <div class="setting-info">\n                                <strong>Conversation Memory</strong>\n                                <p>Remember context across sessions for better responses</p>\n                            </div>\n                            <label class="toggle-switch">\n                                <input type="checkbox" id="memory-enabled" ${this.settings.memory_enabled ? 'checked' : ''}>\n                                <span class="toggle-slider"></span>\n                            </label>\n                        </div>\n\n                        <div class="setting-item">\n                            <label for="memory-retention">\n                                <strong>Memory Retention</strong>\n                            </label>\n                            <select id="memory-retention" class="setting-select">\n                                <option value="session" ${'session' === this.settings.memory_retention ? 'selected' : ''}>Current session only</option>\n                                <option value="7days" ${'7days' === this.settings.memory_retention ? 'selected' : ''}>7 days</option>\n                                <option value="30days" ${'30days' === this.settings.memory_retention ? 'selected' : ''}>30 days</option>\n                                <option value="forever" ${'forever' === this.settings.memory_retention ? 'selected' : ''}>Until manually cleared</option>\n                            </select>\n                        </div>\n                    </section>\n\n                    \x3c!-- Personalization --\x3e\n                    <section class="privacy-section">\n                        <h3>✨ AI Personalization</h3>\n                        <p class="section-desc">Customize how AI communicates with you</p>\n                        \n                        <div class="setting-item">\n                            <label for="response-length">\n                                <strong>Response Length</strong>\n                            </label>\n                            <select id="response-length" class="setting-select">\n                                <option value="concise" ${'concise' === this.settings.response_length ? 'selected' : ''}>Concise (50-100 words)</option>\n                                <option value="balanced" ${'balanced' === this.settings.response_length ? 'selected' : ''}>Balanced (100-150 words)</option>\n                                <option value="detailed" ${'detailed' === this.settings.response_length ? 'selected' : ''}>Detailed (150+ words)</option>\n                            </select>\n                        </div>\n\n                        <div class="setting-item">\n                            <label for="technical-level">\n                                <strong>Technical Level</strong>\n                            </label>\n                            <select id="technical-level" class="setting-select">\n                                <option value="beginner" ${'beginner' === this.settings.technical_level ? 'selected' : ''}>Beginner (explain concepts)</option>\n                                <option value="intermediate" ${'intermediate' === this.settings.technical_level ? 'selected' : ''}>Intermediate (some jargon OK)</option>\n                                <option value="expert" ${'expert' === this.settings.technical_level ? 'selected' : ''}>Expert (full technical detail)</option>\n                            </select>\n                        </div>\n\n                        <div class="setting-item">\n                            <label for="communication-style">\n                                <strong>Communication Style</strong>\n                            </label>\n                            <select id="communication-style" class="setting-select">\n                                <option value="casual" ${'casual' === this.settings.communication_style ? 'selected' : ''}>Casual & Friendly</option>\n                                <option value="professional" ${'professional' === this.settings.communication_style ? 'selected' : ''}>Professional</option>\n                                <option value="formal" ${'formal' === this.settings.communication_style ? 'selected' : ''}>Formal</option>\n                            </select>\n                        </div>\n                    </section >\n\n                    < !--Data Management-- >\n    <section class="privacy-section">\n        <h3>📊 Data Management</h3>\n        <p class="section-desc">GDPR-compliant data controls (your rights)</p>\n\n        <div class="data-actions">\n            <button class="data-btn" id="export-data-btn">\n                <span class="icon">⬇️</span>\n                Export My Data\n            </button>\n            <button class="data-btn danger" id="delete-data-btn">\n                <span class="icon">🗑️</span>\n                Delete All Data\n            </button>\n        </div>\n    </section>\n                </div >\n\n    <div class="privacy-footer">\n        <button class="btn-secondary" id="cancel-btn">Cancel</button>\n        <button class="btn-primary" id="save-btn">Save Changes</button>\n    </div>\n            </div >\n    `),
      document.body.appendChild(n),
      this.attachEventListeners(),
      this.applyStyles());
  }
  attachEventListeners() {
    const n = document.getElementById('privacy-dashboard');
    (n.querySelector('.close-btn').addEventListener('click', () => this.close()),
      n.querySelector('.privacy-overlay').addEventListener('click', () => this.close()),
      n.querySelector('#cancel-btn').addEventListener('click', () => this.close()),
      n.querySelector('#save-btn').addEventListener('click', () => {
        (this.updateSettingsFromUI(),
          this.saveSettings(),
          this.close(),
          this.showToast('✅ Settings saved successfully!'));
      }),
      n.querySelector('#export-data-btn').addEventListener('click', () => {
        this.exportUserData();
      }),
      n.querySelector('#delete-data-btn').addEventListener('click', () => {
        this.confirmDeleteData();
      }),
      n.querySelectorAll('input[type="checkbox"]').forEach(n => {
        n.addEventListener('change', n => {
          this.settings[n.target.id.replace('-', '_')] = n.target.checked;
        });
      }));
  }
  updateSettingsFromUI() {
    const n = document.getElementById('privacy-dashboard');
    ((this.settings.github_integration = n.querySelector('#github-integration').checked),
      (this.settings.memory_enabled = n.querySelector('#memory-enabled').checked),
      (this.settings.memory_retention = n.querySelector('#memory-retention').value),
      (this.settings.response_length = n.querySelector('#response-length').value),
      (this.settings.technical_level = n.querySelector('#technical-level').value),
      (this.settings.communication_style = n.querySelector('#communication-style').value));
  }
  async exportUserData() {
    try {
      const n = await fetch('/api/personalization/export');
      if (!n.ok) throw new Error('Export failed');
      const e = await n.json(),
        t = new Blob([JSON.stringify(e, null, 2)], { type: 'application/json' }),
        s = URL.createObjectURL(t),
        i = document.createElement('a');
      ((i.href = s),
        (i.download = `assistme - data -export -${new Date().toISOString().split('T')[0]}.json`),
        i.click(),
        URL.revokeObjectURL(s),
        this.showToast('✅ Data exported successfully!'));
    } catch (n) {
      (this.showToast('❌ Export failed. Please try again.'), console.error('Export error:', n));
    }
  }
  confirmDeleteData() {
    confirm(
      '⚠️ WARNING: This will permanently delete ALL your data including:\n\n• Conversation history\n• Preferences\n• Personalization settings\n\nThis action cannot be undone. Continue?'
    ) && this.deleteAllData();
  }
  async deleteAllData() {
    try {
      (localStorage.removeItem('assistme_privacy_settings'),
        localStorage.removeItem('assistme_session_id'),
        await fetch('/api/personalization/delete', { method: 'DELETE' }),
        this.showToast('✅ All data deleted. Refreshing page...'),
        setTimeout(() => window.location.reload(), 2e3));
    } catch (n) {
      (this.showToast('❌ Deletion failed. Please try again.'), console.error('Delete error:', n));
    }
  }
  open() {
    (document.getElementById('privacy-dashboard').classList.remove('hidden'),
      (document.body.style.overflow = 'hidden'),
      (this.isOpen = !0));
  }
  close() {
    (document.getElementById('privacy-dashboard').classList.add('hidden'),
      (document.body.style.overflow = ''),
      (this.isOpen = !1));
  }
  showToast(n) {
    const e = document.createElement('div');
    ((e.className = 'privacy-toast'),
      (e.textContent = n),
      document.body.appendChild(e),
      setTimeout(() => e.classList.add('show'), 10),
      setTimeout(() => {
        (e.classList.remove('show'), setTimeout(() => e.remove(), 300));
      }, 3e3));
  }
  applyStyles() {
    if (document.getElementById('privacy-dashboard-styles')) return;
    const n = document.createElement('style');
    ((n.id = 'privacy-dashboard-styles'),
      (n.textContent =
        '\n    .privacy-dashboard {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    z-index: 10000;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    animation: fadeIn 0.3s ease;\n}\n\n            .privacy-dashboard.hidden {\n    display: none;\n}\n\n            .privacy-overlay {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0, 0, 0, 0.6);\n    backdrop-filter: blur(8px);\n}\n\n            .privacy-panel {\n    position: relative;\n    background: white;\n    width: 90 %;\n    max-width: 600px;\n    max-height: 90vh;\n    border-radius: 16px;\n    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);\n    display: flex;\n    flex-direction: column;\n    animation: slideUp 0.3s ease;\n}\n\n@media(prefers-color - scheme: dark) {\n                .privacy-panel {\n        background: #1d1d1f;\n        color: #f5f5f7;\n    }\n}\n\n            .privacy-header {\n    padding: 1.5rem;\n    border-bottom: 1px solid #e5e5e7;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n}\n\n            .privacy-header h2 {\n    margin: 0;\n    font-size: 1.5rem;\n    font-weight: 600;\n}\n\n            .close-btn {\n    background: none;\n    border: none;\n    font-size: 2rem;\n    cursor: pointer;\n    opacity: 0.6;\n    transition: opacity 0.2s;\n}\n\n            .close-btn:hover {\n    opacity: 1;\n}\n\n            .privacy-content {\n    padding: 1.5rem;\n    overflow-y: auto;\n    flex: 1;\n}\n\n            .privacy-section {\n    margin-bottom: 2rem;\n}\n\n            .privacy-section h3 {\n    margin: 0 0 0.5rem 0;\n    font-size: 1.1rem;\n    font-weight: 600;\n}\n\n            .section-desc {\n    color: #666;\n    font-size: 0.9rem;\n    margin: 0 0 1rem 0;\n}\n\n            .setting-item {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    padding: 1rem;\n    border-radius: 8px;\n    background: #f5f5f7;\n    margin-bottom: 0.75rem;\n}\n\n@media(prefers-color - scheme: dark) {\n                .setting-item {\n        background: #2d2d2f;\n    }\n}\n\n            .setting-item.disabled {\n    opacity: 0.5;\n}\n\n            .setting-info {\n    flex: 1;\n}\n\n            .setting-info strong {\n    display: block;\n    margin-bottom: 0.25rem;\n}\n\n            .setting-info p {\n    margin: 0;\n    font-size: 0.85rem;\n    color: #666;\n}\n\n            .badge {\n    display: inline-block;\n    padding: 0.25rem 0.5rem;\n    background: #007aff;\n    color: white;\n    border-radius: 4px;\n    font-size: 0.75rem;\n    margin-top: 0.5rem;\n}\n\n            .toggle-switch {\n    position: relative;\n    display: inline-block;\n    width: 48px;\n    height: 28px;\n}\n\n    .toggle-switch input {\n                opacity: 0;\nwidth: 0;\nheight: 0;\n            }\n\n            .toggle-slider {\n    position: absolute;\n    cursor: pointer;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background-color: #ccc;\n    transition: 0.3s;\n    border-radius: 28px;\n}\n\n            .toggle-slider:before {\n    position: absolute;\n    content: "";\n    height: 20px;\n    width: 20px;\n    left: 4px;\n    bottom: 4px;\n    background-color: white;\n    transition: 0.3s;\n    border-radius: 50 %;\n}\n\ninput: checked + .toggle-slider {\n    background-color: #007aff;\n}\n\ninput: checked + .toggle-slider:before {\n    transform: translateX(20px);\n}\n\n            .setting-select {\n    width: 100 %;\n    padding: 0.75rem;\n    border: 1px solid #e5e5e7;\n    border-radius: 8px;\n    background: white;\n    font-size: 0.95rem;\n    cursor: pointer;\n    margin-top: 0.5rem;\n}\n\n            .data-actions {\n    display: flex;\n    gap: 1rem;\n}\n\n            .data-btn {\n    flex: 1;\n    padding: 1rem;\n    border: 1px solid #e5e5e7;\n    border-radius: 8px;\n    background: white;\n    cursor: pointer;\n    font-size: 0.95rem;\n    transition: all 0.2s;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 0.5rem;\n}\n\n            .data-btn:hover {\n    background: #f5f5f7;\n    transform: translateY(-2px);\n}\n\n            .data-btn.danger {\n    color: #ff3b30;\n    border-color: #ff3b30;\n}\n\n            .data-btn.danger:hover {\n    background: #fff5f5;\n}\n\n            .privacy-footer {\n    padding: 1rem 1.5rem;\n    border-top: 1px solid #e5e5e7;\n    display: flex;\n    gap: 1rem;\n    justify-content: flex-end;\n}\n\n            .btn-secondary, .btn-primary {\n    padding: 0.75rem 1.5rem;\n    border-radius: 8px;\n    font-size: 1rem;\n    font-weight: 500;\n    cursor: pointer;\n    transition: all 0.2s;\n}\n\n            .btn-secondary {\n    background: transparent;\n    border: 1px solid #e5e5e7;\n    color: #1d1d1f;\n}\n\n            .btn-primary {\n    background: #007aff;\n    border: none;\n    color: white;\n}\n\n            .btn-primary:hover {\n    background: #0051d5;\n    transform: translateY(-2px);\n}\n\n            .privacy-toast {\n    position: fixed;\n    bottom: 2rem;\n    left: 50 %;\n    transform: translateX(-50 %) translateY(100px);\n    background: #1d1d1f;\n    color: white;\n    padding: 1rem 2rem;\n    border-radius: 8px;\n    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);\n    z-index: 10001;\n    transition: transform 0.3s ease;\n}\n\n            .privacy-toast.show {\n    transform: translateX(-50 %) translateY(0);\n}\n\n@keyframes fadeIn {\n                from { opacity: 0; }\n                to { opacity: 1; }\n}\n\n@keyframes slideUp {\n                from {\n        opacity: 0;\n        transform: translateY(30px);\n    }\n                to {\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n'),
      document.head.appendChild(n));
  }
  getSettings() {
    return { ...this.settings };
  }
}
export const privacyDashboard = new PrivacyDashboard();
