// public/js/modules/assessment.js
// Diagnostic & Psychological Assessment Centre with Side-by-Side Instrument Comparison

const AssessmentModule = {
  selectedForCompare: new Set(),

  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Diagnostic & Assessment Centre</h1>
          <p class="view-header-subtitle">Standardized psychological test reference catalogue, verified psychometric properties, qualification tiers, and side-by-side comparison matrix.</p>
        </div>
        <div class="top-actions">
          <button id="btn-compare-instruments" class="btn btn-secondary btn-sm" onclick="AssessmentModule.openComparisonModal()" disabled>
            <i data-lucide="scale"></i> Compare Selected (<span id="compare-count">0</span>)
          </button>
        </div>
      </div>

      <!-- COPYRIGHT & QUALIFICATION NOTICE -->
      <div class="card" style="background: var(--color-teal-light); border: 1px solid var(--color-teal-border); margin-bottom: 20px; padding: 14px 20px; font-size: 0.90rem; color: #2B4549; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
        <span><strong>Licensing & Psychometric Boundary:</strong> Displays verified psychometric parameters and administration parameters. Protected proprietary test items, answer keys, and normative score conversion tables are not reproduced.</span>
        <span class="badge badge-verified" style="background: var(--bg-card); color: var(--color-teal); border: 1px solid var(--color-teal-border);">AERA / APA / NCME Compliant</span>
      </div>

      <!-- CATEGORY FILTER PILLS -->
      <div id="assessment-categories-bar" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 20px;">
        <!-- Injected -->
      </div>

      <!-- CATALOGUE GRID -->
      <div id="assessment-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading assessment instruments...</div>
      </div>

      <!-- SIDE-BY-SIDE COMPARISON MODAL -->
      <div id="compare-modal" class="modal-overlay hidden">
        <div class="modal-card" style="max-width: 960px; width: 95%;">
          <div class="modal-header">
            <div class="modal-title"><i data-lucide="scale"></i> Psychometric Side-by-Side Instrument Comparison</div>
            <button class="icon-btn" onclick="document.getElementById('compare-modal').classList.add('hidden')"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" id="compare-modal-content" style="max-height: 80vh; overflow-y: auto;">
            <!-- Comparison matrix injected -->
          </div>
        </div>
      </div>
    `;

    await this.loadCategories();
    await this.loadCatalogue();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadCategories() {
    try {
      const cats = await API.get('/api/assessments/categories');
      const bar = document.getElementById('assessment-categories-bar');
      if (!bar) return;

      bar.innerHTML = `
        <button class="btn btn-secondary btn-sm active-cat" onclick="AssessmentModule.filterCat(null, this)">All Assessment Domains</button>
        ${cats.map(c => `
          <button class="btn btn-outline btn-sm" onclick="AssessmentModule.filterCat(${c.id}, this)">${c.name}</button>
        `).join('')}
      `;
    } catch (err) {
      console.error('Failed to load assessment categories:', err);
    }
  },

  filterCat(catId, btnElement) {
    document.querySelectorAll('#assessment-categories-bar button').forEach(b => b.className = 'btn btn-outline btn-sm');
    if (btnElement) btnElement.className = 'btn btn-secondary btn-sm active-cat';
    this.loadCatalogue(catId);
  },

  async loadCatalogue(categoryId = null) {
    let url = '/api/assessments/catalogue';
    if (categoryId) url += `?category_id=${categoryId}`;

    try {
      const items = await API.get(url);
      const grid = document.getElementById('assessment-grid');
      if (!grid) return;

      if (items.length === 0) {
        grid.innerHTML = `<div class="card" style="text-align: center; padding: 40px; grid-column: 1 / -1;">No assessment instruments found.</div>`;
        return;
      }

      grid.innerHTML = items.map(item => `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--color-teal);">
          <div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
              <span class="badge" style="background: var(--color-teal-light); color: var(--color-teal); border: 1px solid var(--color-teal-border);">
                ${item.category_name || 'Standard Battery'}
              </span>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; color: var(--text-muted);">
                <input type="checkbox" onchange="AssessmentModule.toggleCompare('${item.code}', this.checked)" ${AssessmentModule.selectedForCompare.has(item.code) ? 'checked' : ''}>
                Compare
              </label>
            </div>

            <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
              ${item.name} <span style="color: var(--color-teal); font-weight: 600;">(${item.acronym})</span>
            </h3>
            
            <div style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 12px;">
              Author: <strong>${item.original_author}</strong> (${item.publication_year}) • Age: <strong>${item.age_range}</strong>
            </div>

            <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.6;">
              ${item.purpose}
            </p>

            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 14px; font-size: 0.86rem; line-height: 1.55;">
              <div style="margin-bottom: 6px;">
                <strong style="color: var(--color-teal);">Domains:</strong> ${item.domains_measured}
              </div>
              <div>
                <strong style="color: var(--text-primary);">Reliability & Validity:</strong> ${item.reliability_validity_evidence}
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span class="badge" style="background: var(--color-mustard-light); color: #8A6D1F; border: 1px solid var(--color-mustard-border); font-size: 0.74rem;">
              ${item.licensing_qualification ? item.licensing_qualification.split('(')[0] : 'Level C'}
            </span>
            <span style="font-size: 0.80rem; color: var(--text-muted);">
              Time: ${item.time_required}
            </span>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load assessment catalogue:', err);
    }
  },

  toggleCompare(code, isChecked) {
    if (isChecked) {
      this.selectedForCompare.add(code);
    } else {
      this.selectedForCompare.delete(code);
    }
    const count = this.selectedForCompare.size;
    const btn = document.getElementById('btn-compare-instruments');
    const badge = document.getElementById('compare-count');
    if (badge) badge.textContent = count;
    if (btn) btn.disabled = count < 2;
  },

  async openComparisonModal() {
    if (this.selectedForCompare.size < 2) return;
    const codes = Array.from(this.selectedForCompare).join(',');
    
    try {
      const data = await API.get(`/api/assessments/compare?codes=${codes}`);
      const modal = document.getElementById('compare-modal');
      const content = document.getElementById('compare-modal-content');
      
      const instruments = data.instruments || [];

      content.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="min-width: 160px;">Psychometric Parameter</th>
                ${instruments.map(i => `<th style="min-width: 200px;">${i.name} (${i.acronym})</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Category</strong></td>
                ${instruments.map(i => `<td><span class="badge" style="background: var(--lavender); color: var(--primary);">${i.category_name}</span></td>`).join('')}
              </tr>
              <tr>
                <td><strong>Author & Year</strong></td>
                ${instruments.map(i => `<td>${i.original_author} (${i.publication_year})</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Target Age Range</strong></td>
                ${instruments.map(i => `<td><strong>${i.age_range}</strong></td>`).join('')}
              </tr>
              <tr>
                <td><strong>Administration Time</strong></td>
                ${instruments.map(i => `<td>${i.time_required}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Domains Measured</strong></td>
                ${instruments.map(i => `<td style="font-size: 0.82rem;">${i.domains_measured}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Reliability Evidence</strong></td>
                ${instruments.map(i => `<td style="font-size: 0.82rem; color: #047857;">${i.reliability_validity_evidence}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Normative Basis</strong></td>
                ${instruments.map(i => `<td style="font-size: 0.82rem;">${i.normative_population}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Scoring System</strong></td>
                ${instruments.map(i => `<td style="font-size: 0.82rem;">${i.scoring_overview}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Qualification Tier</strong></td>
                ${instruments.map(i => `<td><span class="badge" style="background: #fef3c7; color: #92400e;">${i.licensing_qualification}</span></td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      `;

      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to open comparison:', err);
    }
  }
};

