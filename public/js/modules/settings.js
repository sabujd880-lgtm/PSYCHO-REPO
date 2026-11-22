// public/js/modules/settings.js
// Single-User Platform Settings & Preferences

const SettingsModule = {
  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Platform Settings & Scholar Preferences</h1>
          <p class="view-header-subtitle">Single-user local environment configuration (No authentication or organizational overhead).</p>
        </div>
      </div>

      <div class="card" style="max-width: 680px; margin: 0 auto; padding: 24px;">
        <h3 class="card-title" style="margin-bottom: 18px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
          <i data-lucide="user"></i> Scholar Profile & Defaults
        </h3>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 600;">Scholar Display Name:</label>
            <input type="text" id="pref-user-name" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.88rem;">
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 600;">Active Examination Target:</label>
            <select id="pref-exam-target" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.88rem; background: var(--bg-app);">
              <option value="UGC NET Psychology">UGC NET Psychology (NTA / Paper II)</option>
              <option value="GATE Psychology">GATE Psychology (XH-C5)</option>
              <option value="CUET PG Psychology">CUET PG Psychology Entrance</option>
              <option value="MSc Psychology Academic">MSc / MPhil Clinical Psychology</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 600;">Default Citation Format:</label>
            <select id="pref-citation-style" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.88rem; background: var(--bg-app);">
              <option value="APA 7th">APA 7th Edition (Standard Psychological Association)</option>
              <option value="MLA 9th">MLA 9th Edition</option>
              <option value="Chicago">Chicago 17th (Notes & Bibliography)</option>
              <option value="Vancouver">Vancouver Biomedical Style</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.90rem; font-weight: 600;">Visual Interface Theme:</label>
            <select id="pref-theme" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background: var(--bg-app);" onchange="App.applyTheme(this.value)">
              <option value="light">Warm Academic Ivory (Default Multicolour Theme)</option>
              <option value="dark">Deep Forest Night-Study Theme</option>
            </select>
          </div>

          <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; font-size: 0.80rem; color: var(--text-muted); line-height: 1.5; margin-top: 6px;">
            <strong>Architecture Note:</strong> This application operates strictly in single-user mode. No logins, accounts, passwords, or multi-user access permissions are required. Data and indexed documents remain completely local.
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button class="btn btn-primary" onclick="SettingsModule.savePreferences()">
              <i data-lucide="save"></i> Save Preferences
            </button>
          </div>
        </div>
      </div>
    `;

    await this.loadPreferences();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadPreferences() {
    try {
      const prefs = await API.get('/api/settings');
      if (document.getElementById('pref-user-name')) document.getElementById('pref-user-name').value = prefs.user_name || 'Psychology Scholar';
      if (document.getElementById('pref-exam-target')) document.getElementById('pref-exam-target').value = prefs.active_exam_target || 'UGC NET Psychology';
      if (document.getElementById('pref-citation-style')) document.getElementById('pref-citation-style').value = prefs.default_citation_format || 'APA 7th';
      if (document.getElementById('pref-theme')) document.getElementById('pref-theme').value = prefs.theme || 'light';
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  },

  async savePreferences() {
    const payload = {
      user_name: document.getElementById('pref-user-name').value,
      active_exam_target: document.getElementById('pref-exam-target').value,
      default_citation_format: document.getElementById('pref-citation-style').value,
      theme: document.getElementById('pref-theme').value
    };

    try {
      await API.post('/api/settings', payload);
      document.getElementById('user-display-name').textContent = payload.user_name;
      App.applyTheme(payload.theme);
      showToast('Preferences saved successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

