// public/js/modules/dashboard.js
// Human-Centred Academic & Clinical Psychology Dashboard
async function renderDashboard(container) {
  container.innerHTML = `
    <!-- WELCOME & ACADEMIC HEADER -->
    <div class="view-header">
      <div>
        <h1 class="view-header-title">Personal Psychology Digital Workspace</h1>
        <p class="view-header-subtitle">Comprehensive academic library, clinical reference centre, psychometric catalogue, and examination command desk.</p>
      </div>
      <div class="top-actions">
        <button class="btn btn-primary btn-sm" onclick="App.openUploadModal()">
          <i data-lucide="upload-cloud"></i> Upload Document
        </button>
        <button class="btn btn-secondary btn-sm" onclick="App.navigate('ai-assistant')">
          <i data-lucide="bot"></i> AI Scholar Assistant
        </button>
      </div>
    </div>

    <!-- STATS ROW (COORDINATED MULTICOLOUR ACADEMIC TILES) -->
    <div class="grid-cards" id="dashboard-stats-grid">
      <div class="card stat-card" style="border-left: 4px solid var(--color-sage);">
        <div class="stat-icon" style="background: var(--color-sage-light); color: var(--color-sage);">
          <i data-lucide="book-marked"></i>
        </div>
        <div>
          <div class="stat-value" id="stat-resources">--</div>
          <div class="stat-label">Verified Library Resources</div>
        </div>
      </div>

      <div class="card stat-card" style="border-left: 4px solid var(--color-mustard);">
        <div class="stat-icon" style="background: var(--color-mustard-light); color: #9E7F26;">
          <i data-lucide="network"></i>
        </div>
        <div>
          <div class="stat-value" id="stat-articles">--</div>
          <div class="stat-label">Structured Knowledge Articles</div>
        </div>
      </div>

      <div class="card stat-card" style="border-left: 4px solid var(--color-teal);">
        <div class="stat-icon" style="background: var(--color-teal-light); color: var(--color-teal);">
          <i data-lucide="gauge"></i>
        </div>
        <div>
          <div class="stat-value" id="stat-assessments">--</div>
          <div class="stat-label">Psychometric Instruments</div>
        </div>
      </div>

      <div class="card stat-card" style="border-left: 4px solid var(--color-terracotta);">
        <div class="stat-icon" style="background: var(--color-terracotta-light); color: var(--color-terracotta);">
          <i data-lucide="file-text"></i>
        </div>
        <div>
          <div class="stat-value" id="stat-documents">--</div>
          <div class="stat-label">Indexed Documents (RAG)</div>
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS TRAY -->
    <div class="card" style="margin-bottom: 24px; background: var(--bg-card); border: 1px solid var(--border-color);">
      <div class="card-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
        <h2 class="card-title" style="font-size: 1.15rem; color: var(--color-forest);">
          <i data-lucide="compass" style="color: var(--color-forest);"></i> Scholar Quick Actions
        </h2>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn btn-outline btn-sm" onclick="App.openUploadModal()"><i data-lucide="upload"></i> Upload Document</button>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('ai-assistant')"><i data-lucide="message-square"></i> Ask a Question</button>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('global-search-input').focus()"><i data-lucide="search"></i> Search Psychology</button>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('pyq-exam')"><i data-lucide="trending-up"></i> Analyze PYQ</button>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('predictor')"><i data-lucide="sparkles"></i> Predict Practice Paper</button>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('teaching')"><i data-lucide="file-plus"></i> Generate Study Notes</button>
        <button class="btn btn-outline btn-sm" onclick="PyqExamModule.openMockModal()"><i data-lucide="check-circle-2"></i> Create Mock Test</button>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN DASHBOARD SECTION -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(440px, 1fr)); gap: 24px;">
      
      <!-- LEFT COLUMN -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- EXAM TARGET & STUDY PROGRESS (FOREST GREEN ACCENT) -->
        <div class="card" style="border-top: 3px solid var(--color-forest); background: var(--bg-card);">
          <div class="card-header">
            <h2 class="card-title"><i data-lucide="graduation-cap" style="color: var(--color-forest);"></i> Examination Target: UGC NET / JRF Psychology</h2>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('pyq-exam')">View PYQ Hub</button>
          </div>
          <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">
            Target: Junior Research Fellowship & University Assistant Professorship. 10 syllabus domains calibrated with historical question papers.
          </p>
          <div style="background: var(--color-forest-light); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--color-forest-border); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 700; margin-bottom: 8px;">
              <span>Syllabus Coverage & PYQ Trend Mastery</span>
              <span style="color: var(--color-forest);">64% Complete</span>
            </div>
            <div style="height: 10px; background: #DFD5C6; border-radius: 9999px; overflow: hidden;">
              <div style="width: 64%; height: 100%; background: linear-gradient(90deg, var(--color-forest), var(--color-sage));"></div>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-sm" onclick="App.navigate('predictor')"><i data-lucide="sparkles"></i> Run Predictor Engine</button>
            <button class="btn btn-secondary btn-sm" onclick="PyqExamModule.openMockModal()"><i data-lucide="play-circle"></i> Start Mock Test</button>
          </div>
        </div>

        <!-- RECENTLY INDEXED DOCUMENTS (WARM BEIGE ACCENT) -->
        <div class="card" style="border-top: 3px solid var(--color-terracotta); background: var(--bg-card);">
          <div class="card-header">
            <h2 class="card-title"><i data-lucide="file-search" style="color: var(--color-terracotta);"></i> Recently Indexed Documents</h2>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('document-intelligence')">All Documents</button>
          </div>
          <div id="dash-recent-docs" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-size: 0.88rem; color: var(--text-muted);">Loading recent files...</div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div style="display: flex; flex-direction: column; gap: 24px;">

        <!-- DIAGNOSTIC & CLINICAL SHORTCUTS (TERRACOTTA ACCENT) -->
        <div class="card" style="border-top: 3px solid var(--color-terracotta); background: var(--bg-card);">
          <div class="card-header">
            <h2 class="card-title"><i data-lucide="clipboard-check" style="color: var(--color-terracotta);"></i> Clinical & Diagnostic Quick Access</h2>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('clinical')">All Protocols</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="#clinical" class="nav-item" style="padding: 10px 14px; border: 1px solid var(--border-color); background: var(--color-terracotta-light); border-radius: var(--radius-sm);">
              <i data-lucide="file-text" style="color: var(--color-terracotta);"></i>
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">Mental Status Examination (MSE) Protocol</strong>
                <div style="font-size: 0.82rem; color: var(--text-muted);">Standardized 9-domain clinical observation template</div>
              </div>
            </a>
            <a href="#clinical" class="nav-item" style="padding: 10px 14px; border: 1px solid var(--border-color); background: var(--color-terracotta-light); border-radius: var(--radius-sm);">
              <i data-lucide="git-branch" style="color: var(--color-terracotta);"></i>
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">Biopsychosocial Case Formulation (5 P's)</strong>
                <div style="font-size: 0.82rem; color: var(--text-muted);">Predisposing, Precipitating, Perpetuating, Protective factors</div>
              </div>
            </a>
            <a href="#assessment" class="nav-item" style="padding: 10px 14px; border: 1px solid var(--border-color); background: var(--color-teal-light); border-radius: var(--radius-sm);">
              <i data-lucide="scale" style="color: var(--color-teal);"></i>
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">Assessment Comparison: WAIS-IV vs MMPI-3</strong>
                <div style="font-size: 0.82rem; color: var(--text-muted);">Reliability, validity metrics, age bounds, qualification tiers</div>
              </div>
            </a>
          </div>
        </div>

        <!-- RECENTLY VIEWED LIBRARY RESOURCES (SAGE GREEN ACCENT) -->
        <div class="card" style="border-top: 3px solid var(--color-sage); background: var(--bg-card);">
          <div class="card-header">
            <h2 class="card-title"><i data-lucide="bookmark" style="color: var(--color-sage);"></i> Curated Academic Resources</h2>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('library')">Explore Library</button>
          </div>
          <div id="dash-recent-resources" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-size: 0.88rem; color: var(--text-muted);">Loading resources...</div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Fetch live stats
  try {
    const data = await API.get('/api/dashboard/stats');
    if (data && data.counts) {
      document.getElementById('stat-resources').textContent = data.counts.totalResources;
      document.getElementById('stat-articles').textContent = data.counts.totalArticles;
      document.getElementById('stat-assessments').textContent = data.counts.totalAssessments;
      document.getElementById('stat-documents').textContent = data.counts.totalDocuments;
    }

    // Render Recent Documents
    const docsContainer = document.getElementById('dash-recent-docs');
    if (docsContainer) {
      if (data.recentDocs && data.recentDocs.length > 0) {
        docsContainer.innerHTML = data.recentDocs.map(d => {
          const docName = d.original_name || d.originalFilename || 'Document';
          const pages = d.total_pages || d.pageCount || 1;
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-app); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                <i data-lucide="file" style="color: var(--color-forest); width: 18px; height: 18px; flex-shrink: 0;"></i>
                <span style="font-size: 0.92rem; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; color: var(--text-primary);">${docName}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                <span class="badge badge-verified">${pages} Pages</span>
                <button class="btn btn-outline btn-sm" onclick="App.navigate('document-intelligence'); setTimeout(() => DocumentModule.openDocument('${d.id}'), 200);">Open</button>
              </div>
            </div>
          `;
        }).join('');
      } else {
        docsContainer.innerHTML = `<p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;">No documents uploaded yet. Click "Upload Document" above to index your first PDF, DOCX, or research paper.</p>`;
      }
    }

    // Render Recent Resources
    const resContainer = document.getElementById('dash-recent-resources');
    if (resContainer) {
      if (data.recentResources && data.recentResources.length > 0) {
        resContainer.innerHTML = data.recentResources.map(r => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-app); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="overflow: hidden;">
              <strong style="font-size: 0.92rem; display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; color: var(--text-primary);">${r.title}</strong>
              <span style="font-size: 0.80rem; color: var(--text-muted);">${r.publication_year || 'Scholarly'} • ${r.subject || 'Psychology'}</span>
            </div>
            <span class="badge badge-verified" style="margin-left: 10px; flex-shrink: 0;">Verified</span>
          </div>
        `).join('');
      } else {
        resContainer.innerHTML = `<p style="font-size: 0.88rem; color: var(--text-muted);">Curated academic resources ready in the Library.</p>`;
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }

  if (window.lucide) window.lucide.createIcons();
}
