// public/js/modules/clinical.js
// Clinical Psychology Reference Centre Module

const ClinicalModule = {
  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Clinical Psychology Reference Centre</h1>
          <p class="view-header-subtitle">Standardized clinical assessment protocols, diagnostic guidelines, case formulation frameworks, and clinical documentation templates.</p>
        </div>
      </div>

      <!-- CLINICAL ETHICAL SAFETY NOTICE -->
      <div class="card" style="background: var(--color-terracotta-light); border: 1px solid var(--color-terracotta-border); margin-bottom: 24px; padding: 16px 20px;">
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <i data-lucide="shield-alert" style="color: var(--color-terracotta); width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;"></i>
          <div style="font-size: 0.92rem; color: #783822; line-height: 1.6;">
            <strong style="color: var(--color-terracotta); font-size: 0.98rem; display: block; margin-bottom: 4px;">Professional Practice & Ethical Boundary Notice:</strong>
            These resources represent standardized academic and clinical training protocols. AI-assisted analysis and structured documentation tools are strictly educational aids and do NOT substitute for independent clinical judgment, formal diagnostic evaluation, or face-to-face risk assessment by a qualified, licensed mental health clinician.
          </div>
        </div>
      </div>

      <!-- TABS: PROTOCOLS vs TEMPLATES -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <button id="btn-tab-clin-protocols" class="btn btn-secondary btn-sm" onclick="ClinicalModule.switchTab('protocols')">
          <i data-lucide="clipboard-list"></i> Clinical Assessment Protocols
        </button>
        <button id="btn-tab-clin-templates" class="btn btn-outline btn-sm" onclick="ClinicalModule.switchTab('templates')">
          <i data-lucide="file-text"></i> Standardized Clinical Templates
        </button>
      </div>

      <!-- TAB 1: CLINICAL PROTOCOLS -->
      <div id="clin-protocols-view">
        <div id="clin-protocols-list" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading clinical protocols...</div>
        </div>
      </div>

      <!-- TAB 2: CLINICAL TEMPLATES -->
      <div id="clin-templates-view" class="hidden">
        <div id="clin-templates-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(440px, 1fr)); gap: 20px;">
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading templates...</div>
        </div>
      </div>
    `;

    await this.loadClinicalProtocols();
    await this.loadClinicalTemplates();
    if (window.lucide) window.lucide.createIcons();
  },

  switchTab(tab) {
    const protocolsView = document.getElementById('clin-protocols-view');
    const templatesView = document.getElementById('clin-templates-view');
    const btnProtocols = document.getElementById('btn-tab-clin-protocols');
    const btnTemplates = document.getElementById('btn-tab-clin-templates');

    if (tab === 'protocols') {
      protocolsView.classList.remove('hidden');
      templatesView.classList.add('hidden');
      btnProtocols.className = 'btn btn-secondary btn-sm';
      btnTemplates.className = 'btn btn-outline btn-sm';
    } else {
      protocolsView.classList.add('hidden');
      templatesView.classList.remove('hidden');
      btnProtocols.className = 'btn btn-outline btn-sm';
      btnTemplates.className = 'btn btn-secondary btn-sm';
    }
  },

  async loadClinicalProtocols() {
    try {
      const topics = await API.get('/api/clinical/topics');
      const container = document.getElementById('clin-protocols-list');
      if (!container) return;

      container.innerHTML = '';
      for (const t of topics) {
        const full = await API.get(`/api/clinical/topics/${t.id}`);
        const refs = Array.isArray(full.references_json) ? full.references_json : [];
        
        container.innerHTML += `
          <div class="card" style="padding: 24px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
              <div>
                <span class="badge" style="background: var(--lavender); color: var(--primary); margin-bottom: 6px;">
                  ${full.domain}
                </span>
                <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">
                  ${full.title}
                </h2>
              </div>
              <span class="badge badge-verified">Clinical Standard</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px; font-size: 0.90rem; line-height: 1.6;">
              <div>
                <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Clinical Significance:</h4>
                <p style="color: var(--text-secondary);">${full.clinical_significance}</p>
              </div>

              <div>
                <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Protocol Guidelines:</h4>
                <p style="color: var(--text-secondary);">${full.professional_guidelines}</p>
              </div>

              <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px;">
                <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
                  <i data-lucide="file-check"></i> Standardized Clinical Example:
                </h4>
                <p style="font-size: 0.84rem; color: var(--text-secondary);">${full.practical_examples || 'Standard clinical observations apply.'}</p>
              </div>

              <div>
                <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Recommended Assessment Batteries:</h4>
                <div style="font-size: 0.84rem; color: var(--text-secondary);">${full.related_assessment_tools || 'None specified'}</div>
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; font-size: 0.78rem; color: var(--text-muted);">
                <strong>Authoritative References:</strong>
                <ul style="margin-left: 20px; margin-top: 4px;">
                  ${refs.map(r => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load clinical protocols:', err);
    }
  },

  async loadClinicalTemplates() {
    try {
      const templates = await API.get('/api/clinical/templates');
      const container = document.getElementById('clin-templates-list');
      if (!container) return;

      container.innerHTML = templates.map(tmpl => `
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header">
            <div>
              <span class="badge" style="background: var(--lavender); color: var(--primary); font-size: 0.70rem; margin-bottom: 4px;">
                ${tmpl.category}
              </span>
              <h3 class="card-title" style="font-size: 1.05rem;">${tmpl.title}</h3>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ClinicalModule.copyTemplate('${tmpl.id}')">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
          <pre id="tmpl-text-${tmpl.id}" style="flex: 1; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; font-family: 'Times New Roman', Times, serif; font-size: 0.90rem; line-height: 1.6; color: var(--text-secondary); overflow-y: auto; max-height: 340px; white-space: pre-wrap;">${tmpl.template_text}</pre>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  },

  copyTemplate(id) {
    const el = document.getElementById(`tmpl-text-${id}`);
    if (el) {
      navigator.clipboard.writeText(el.textContent);
      showToast('Clinical template copied to clipboard!', 'success');
    }
  }
};

