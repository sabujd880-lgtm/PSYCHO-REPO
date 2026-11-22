// public/js/modules/research.js
// Research Hub, Methodology Formulation, Statistical Calculators, and Multi-Format Citation Generator

const ResearchModule = {
  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Psychology Research Hub</h1>
          <p class="view-header-subtitle">Methodology design, statistical testing engines, hypothesis formalization, and multi-format citation export.</p>
        </div>
      </div>

      <!-- WORKSPACE TABS -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <button id="btn-tab-res-stats" class="btn btn-secondary btn-sm" onclick="ResearchModule.switchTab('stats')">
          <i data-lucide="calculator"></i> Statistical & Psychometric Engines
        </button>
        <button id="btn-tab-res-cite" class="btn btn-outline btn-sm" onclick="ResearchModule.switchTab('cite')">
          <i data-lucide="quote"></i> Multi-Format Citation Generator
        </button>
        <button id="btn-tab-res-design" class="btn btn-outline btn-sm" onclick="ResearchModule.switchTab('design')">
          <i data-lucide="flask-conical"></i> Research Design & Hypotheses
        </button>
      </div>

      <!-- TAB 1: STATISTICAL CALCULATORS -->
      <div id="res-tab-stats">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px;">
          
          <!-- 1. DESCRIPTIVE STATS -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 8px;"><i data-lucide="bar-chart-2"></i> Descriptive Statistics Calculator</h3>
            <p style="font-size: 0.80rem; color: var(--text-muted); margin-bottom: 12px;">Enter comma or space-separated numbers (e.g. test scores or response latencies):</p>
            <textarea id="stats-desc-input" style="width: 100%; height: 70px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: 'JetBrains Mono', monospace; font-size: 0.84rem; margin-bottom: 10px;">22, 25, 28, 29, 31, 33, 35, 36, 40, 42</textarea>
            <button class="btn btn-primary btn-sm" onclick="ResearchModule.runDescriptiveStats()">Compute Statistics</button>
            <div id="stats-desc-output" style="margin-top: 14px; font-size: 0.82rem; line-height: 1.6;"></div>
          </div>

          <!-- 2. INDEPENDENT SAMPLES T-TEST -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 8px;"><i data-lucide="git-compare"></i> Independent Samples t-test</h3>
            <p style="font-size: 0.80rem; color: var(--text-muted); margin-bottom: 10px;">Compare two experimental/clinical groups (computes t, df, p-value, and Cohen's d):</p>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div style="flex: 1;">
                <label style="font-size: 0.74rem; font-weight: 600;">Group 1 (e.g. CBT Intervention):</label>
                <input type="text" id="stats-t-g1" value="18, 19, 21, 20, 24, 22, 23" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.82rem; font-family: 'JetBrains Mono', monospace;">
              </div>
              <div style="flex: 1;">
                <label style="font-size: 0.74rem; font-weight: 600;">Group 2 (Control / Waitlist):</label>
                <input type="text" id="stats-t-g2" value="28, 29, 32, 30, 31, 34, 33" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.82rem; font-family: 'JetBrains Mono', monospace;">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="ResearchModule.runTTest()">Run t-Test & Effect Size</button>
            <div id="stats-t-output" style="margin-top: 14px; font-size: 0.82rem; line-height: 1.6;"></div>
          </div>

          <!-- 3. PEARSON CORRELATION -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 8px;"><i data-lucide="activity"></i> Pearson Product-Moment Correlation (r)</h3>
            <p style="font-size: 0.80rem; color: var(--text-muted); margin-bottom: 10px;">Examine linear relationship and shared variance between continuous variables:</p>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div style="flex: 1;">
                <label style="font-size: 0.74rem; font-weight: 600;">Variable X (e.g. Anxiety Score):</label>
                <input type="text" id="stats-r-x" value="12, 15, 18, 20, 25, 28, 30" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.82rem; font-family: 'JetBrains Mono', monospace;">
              </div>
              <div style="flex: 1;">
                <label style="font-size: 0.74rem; font-weight: 600;">Variable Y (e.g. Sleep Latency):</label>
                <input type="text" id="stats-r-y" value="20, 25, 30, 35, 45, 50, 60" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.82rem; font-family: 'JetBrains Mono', monospace;">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="ResearchModule.runCorrelation()">Compute Pearson r</button>
            <div id="stats-r-output" style="margin-top: 14px; font-size: 0.82rem; line-height: 1.6;"></div>
          </div>

          <!-- 4. CRONBACH'S ALPHA (RELIABILITY) -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 8px;"><i data-lucide="shield-check"></i> Cronbach's Alpha (Scale Reliability)</h3>
            <p style="font-size: 0.80rem; color: var(--text-muted); margin-bottom: 10px;">Evaluate internal consistency of psychometric survey items (1 row per participant, comma items):</p>
            <textarea id="stats-alpha-input" style="width: 100%; height: 70px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; margin-bottom: 10px;">4, 5, 4, 5
3, 4, 3, 4
5, 5, 5, 5
2, 3, 2, 3
4, 4, 4, 4</textarea>
            <button class="btn btn-primary btn-sm" onclick="ResearchModule.runAlpha()">Compute Cronbach's Alpha</button>
            <div id="stats-alpha-output" style="margin-top: 14px; font-size: 0.82rem; line-height: 1.6;"></div>
          </div>

        </div>
      </div>

      <!-- TAB 2: CITATION GENERATOR -->
      <div id="res-tab-cite" class="hidden">
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <h3 class="card-title" style="margin-bottom: 16px;"><i data-lucide="quote"></i> Multi-Format Reference & Citation Engine</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">Authors (e.g. Beck, A. T., & Clark, D. A.):</label>
              <input type="text" id="cite-authors" value="Beck, A. T., & Haigh, E. A." style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">Year of Publication:</label>
              <input type="number" id="cite-year" value="2014" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
            <div style="grid-column: 1 / -1;">
              <label style="font-size: 0.80rem; font-weight: 600;">Title of Article or Book:</label>
              <input type="text" id="cite-title" value="Advances in cognitive theory and therapy: The generic cognitive model" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">Journal / Publisher:</label>
              <input type="text" id="cite-publisher" value="Annual Review of Clinical Psychology" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">DOI or Reference URL:</label>
              <input type="text" id="cite-doi" value="10.1146/annurev-clinpsy-032813-153734" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ResearchModule.generateAllCitations()">Generate All Citation Formats</button>

          <div id="cite-results-box" class="hidden" style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">
            <!-- Rendered formats -->
          </div>
        </div>
      </div>

      <!-- TAB 3: RESEARCH DESIGN & HYPOTHESIS BUILDER -->
      <div id="res-tab-design" class="hidden">
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <h3 class="card-title" style="margin-bottom: 12px;"><i data-lucide="flask-conical"></i> Research Hypothesis & Methodology Protocol</h3>
          <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 16px;">Formalize directionality, independent/dependent variable operationalizations, and statistical test selections.</p>
          
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px;">
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">Research Question:</label>
              <input type="text" id="rq-question" value="Does a 6-week mindfulness-based cognitive intervention significantly reduce cognitive anxiety in undergraduate students?" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">Independent Variable (IV):</label>
                <input type="text" id="rq-iv" value="Mindfulness Intervention (Intervention vs Waitlist)" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
              </div>
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">Dependent Variable (DV):</label>
                <input type="text" id="rq-dv" value="State-Trait Anxiety Inventory (STAI) Score" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
              </div>
            </div>
          </div>

          <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; font-size: 0.86rem; line-height: 1.6;">
            <strong>Formalized Hypotheses:</strong>
            <ul style="margin-left: 20px; margin-top: 6px;">
              <li><strong>Null Hypothesis (H0):</strong> There is no statistically significant difference in mean post-intervention STAI anxiety scores between the mindfulness intervention group and waitlist control group (\(\mu_1 = \mu_2\)).</li>
              <li><strong>Alternative Directional Hypothesis (H1):</strong> Participants in the 6-week mindfulness intervention group will demonstrate significantly lower mean STAI anxiety scores compared to control participants (\(\mu_1 < \mu_2\)).</li>
            </ul>
            <div style="margin-top: 10px; font-size: 0.80rem; color: var(--primary);">
              <strong>Recommended Statistical Design:</strong> 2x2 Mixed Factorial ANOVA (Time: Pre vs Post x Group: Intervention vs Control).
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  switchTab(tab) {
    document.getElementById('res-tab-stats').classList.toggle('hidden', tab !== 'stats');
    document.getElementById('res-tab-cite').classList.toggle('hidden', tab !== 'cite');
    document.getElementById('res-tab-design').classList.toggle('hidden', tab !== 'design');

    document.getElementById('btn-tab-res-stats').className = tab === 'stats' ? 'btn btn-secondary btn-sm' : 'btn btn-outline btn-sm';
    document.getElementById('btn-tab-res-cite').className = tab === 'cite' ? 'btn btn-secondary btn-sm' : 'btn btn-outline btn-sm';
    document.getElementById('btn-tab-res-design').className = tab === 'design' ? 'btn btn-secondary btn-sm' : 'btn btn-outline btn-sm';
  },

  async runDescriptiveStats() {
    const raw = document.getElementById('stats-desc-input').value;
    const nums = raw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const out = document.getElementById('stats-desc-output');

    try {
      const res = await API.post('/api/research/stats/descriptive', { data: nums });
      out.innerHTML = `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px;">
          <strong>Sample Size (N):</strong> ${res.sampleSize} | <strong>Mean:</strong> ${res.mean} | <strong>Median:</strong> ${res.median}<br>
          <strong>Std. Deviation (SD):</strong> ${res.standardDeviation} | <strong>Variance (s²):</strong> ${res.variance}<br>
          <strong>Std. Error (SEM):</strong> ${res.standardErrorOfMean} | <strong>Range:</strong> ${res.range} (${res.min} to ${res.max})<br>
          <strong>Skewness:</strong> ${res.skewness} (${Math.abs(res.skewness) < 0.5 ? 'Approximately symmetric' : 'Moderate skew'})
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<span style="color: var(--danger);">Error computing stats: ${err.message}</span>`;
    }
  },

  async runTTest() {
    const g1 = document.getElementById('stats-t-g1').value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const g2 = document.getElementById('stats-t-g2').value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const out = document.getElementById('stats-t-output');

    try {
      const res = await API.post('/api/research/stats/ttest', { group1: g1, group2: g2 });
      out.innerHTML = `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px;">
          <strong>APA Report:</strong> <code style="color: var(--primary); font-family: 'JetBrains Mono', monospace;">${res.apaFormat}</code><br>
          <strong>Interpretation:</strong> ${res.interpretation}
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<span style="color: var(--danger);">Error running t-test: ${err.message}</span>`;
    }
  },

  async runCorrelation() {
    const x = document.getElementById('stats-r-x').value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const y = document.getElementById('stats-r-y').value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const out = document.getElementById('stats-r-output');

    try {
      const res = await API.post('/api/research/stats/correlation', { x, y });
      out.innerHTML = `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px;">
          <strong>APA Report:</strong> <code style="color: var(--primary); font-family: 'JetBrains Mono', monospace;">${res.apaFormat}</code><br>
          <strong>Shared Variance (r²):</strong> ${(res.rSquared * 100).toFixed(1)}%<br>
          <strong>Interpretation:</strong> ${res.interpretation}
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<span style="color: var(--danger);">Error computing correlation: ${err.message}</span>`;
    }
  },

  async runAlpha() {
    const lines = document.getElementById('stats-alpha-input').value.split('\n').map(l => l.trim()).filter(Boolean);
    const matrix = lines.map(line => line.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)));
    const out = document.getElementById('stats-alpha-output');

    try {
      const res = await API.post('/api/research/stats/cronbach', { matrix });
      out.innerHTML = `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px;">
          <strong>Cronbach's Alpha (α):</strong> <strong style="color: var(--primary);">${res.alpha}</strong> (${res.evaluation})<br>
          <strong>Items Analyzed (k):</strong> ${res.numberOfItems} | <strong>Respondents (N):</strong> ${res.sampleSize}<br>
          <strong>Evaluation:</strong> ${res.interpretation}
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<span style="color: var(--danger);">Error computing alpha: ${err.message}</span>`;
    }
  },

  async generateAllCitations() {
    const payload = {
      authors: document.getElementById('cite-authors').value,
      year: parseInt(document.getElementById('cite-year').value, 10),
      title: document.getElementById('cite-title').value,
      publisher: document.getElementById('cite-publisher').value,
      doi: document.getElementById('cite-doi').value
    };

    const box = document.getElementById('cite-results-box');
    try {
      const res = await API.post('/api/research/citations/generate', payload);
      box.classList.remove('hidden');

      const formats = [
        { name: 'APA 7th Edition', text: res.apa },
        { name: 'MLA 9th Edition', text: res.mla },
        { name: 'Chicago 17th (Notes & Bibliography)', text: res.chicago },
        { name: 'Vancouver Style', text: res.vancouver },
        { name: 'BibTeX', text: res.bibtex, code: true },
        { name: 'RIS (EndNote / Zotero)', text: res.ris, code: true }
      ];

      box.innerHTML = formats.map(f => `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 0.86rem; color: var(--primary);">${f.name}</strong>
            <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${f.text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'); showToast('${f.name} copied!');">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
          ${f.code 
            ? `<pre style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; white-space: pre-wrap; color: var(--text-secondary); margin-top: 6px;">${f.text}</pre>`
            : `<div style="font-size: 0.86rem; line-height: 1.5; color: var(--text-primary); user-select: all;">${f.text}</div>`
          }
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      showToast(`Error generating citations: ${err.message}`, 'error');
    }
  }
};

