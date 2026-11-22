// public/js/modules/library.js
// Psychology Digital Library Module

const LibraryModule = {
  activeCategory: null,
  activeType: null,

  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Psychology Digital Library</h1>
          <p class="view-header-subtitle">Curated repository of peer-reviewed literature, clinical manuals, diagnostic systems, and textbooks.</p>
        </div>
        <div class="top-actions">
          <button class="btn btn-primary btn-sm" onclick="LibraryModule.openAddResourceModal()">
            <i data-lucide="plus-circle"></i> Add Reference / Resource
          </button>
        </div>
      </div>

      <!-- CATEGORY PILLS BAR -->
      <div id="library-category-pills" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 20px;">
        <button class="btn btn-secondary btn-sm active-cat" onclick="LibraryModule.filterCategory(null, this)">All Categories</button>
        <!-- Injected dynamically -->
      </div>

      <!-- FILTER & SEARCH ROW -->
      <div class="card" style="margin-bottom: 20px; padding: 14px 18px;">
        <div style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 240px;">
            <input type="text" id="library-search-input" placeholder="Filter by title, author, subject, or abstract..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app); color: var(--text-primary);" oninput="LibraryModule.loadResources()">
          </div>
          <div>
            <select id="library-type-filter" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app); color: var(--text-primary);" onchange="LibraryModule.loadResources()">
              <option value="">All Publication Types</option>
              <option value="Manual">Manuals & Guidelines</option>
              <option value="Textbook">Textbooks</option>
              <option value="Book">Clinical Books</option>
              <option value="Journal Article">Journal Articles</option>
            </select>
          </div>
          <div>
            <select id="library-verified-filter" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app); color: var(--text-primary);" onchange="LibraryModule.loadResources()">
              <option value="">All Verification Status</option>
              <option value="1">Verified Scholarly Only</option>
              <option value="0">User Uploaded</option>
            </select>
          </div>
        </div>
      </div>

      <!-- RESOURCES LIST / TABLE -->
      <div id="library-resources-container">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading library resources...</div>
      </div>

      <!-- CITATION PREVIEW MODAL -->
      <div id="citation-modal" class="modal-overlay hidden">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title"><i data-lucide="quote"></i> Academic Citation & Reference Metadata</div>
            <button class="icon-btn" onclick="document.getElementById('citation-modal').classList.add('hidden')"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" id="citation-modal-content">
            <!-- Injected -->
          </div>
        </div>
      </div>
    `;

    await this.loadCategories();
    await this.loadResources();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadCategories() {
    try {
      const categories = await API.get('/api/library/categories');
      const pillsContainer = document.getElementById('library-category-pills');
      if (!pillsContainer) return;
      
      const pillsHtml = categories.map(c => `
        <button class="btn btn-outline btn-sm" onclick="LibraryModule.filterCategory('${c.id}', this)">
          ${c.name}
        </button>
      `).join('');
      
      pillsContainer.innerHTML = `
        <button class="btn btn-secondary btn-sm active-cat" onclick="LibraryModule.filterCategory(null, this)">All Categories</button>
        ${pillsHtml}
      `;
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  },

  filterCategory(catId, btnElement) {
    this.activeCategory = catId;
    document.querySelectorAll('#library-category-pills button').forEach(b => {
      b.className = 'btn btn-outline btn-sm';
    });
    if (btnElement) {
      btnElement.className = 'btn btn-secondary btn-sm active-cat';
    }
    this.loadResources();
  },

  async loadResources() {
    const search = document.getElementById('library-search-input')?.value || '';
    const type = document.getElementById('library-type-filter')?.value || '';
    const verified = document.getElementById('library-verified-filter')?.value || '';

    let url = '/api/library/resources?';
    if (this.activeCategory) url += `category_id=${this.activeCategory}&`;
    if (type) url += `publication_type=${encodeURIComponent(type)}&`;
    if (verified) url += `verified=${verified}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
      const rows = await API.get(url);
      const container = document.getElementById('library-resources-container');
      if (!container) return;

      if (rows.length === 0) {
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px 20px;">
            <i data-lucide="book-x" style="width: 44px; height: 44px; color: var(--text-muted); margin-bottom: 12px;"></i>
            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">No resources found matching filters</h3>
            <p style="font-size: 0.86rem; color: var(--text-muted); max-width: 420px; margin: 0 auto;">Try clearing search terms or selecting another category.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${rows.map(r => `
            <div class="card" style="padding: 20px 22px; border-left: 4px solid var(--color-sage);">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                    <span class="badge ${r.is_verified ? 'badge-verified' : 'badge-exploratory'}">
                      <i data-lucide="${r.is_verified ? 'shield-check' : 'user'}"></i>
                      ${r.is_verified ? 'Verified Scholarly' : 'User Upload'}
                    </span>
                    <span class="badge" style="background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-secondary);">
                      ${r.publication_type || 'Reference'}
                    </span>
                    <span class="badge" style="background: var(--color-sage-light); color: var(--color-sage); border: 1px solid var(--color-sage-border);">
                      ${r.category_name || 'General'}
                    </span>
                  </div>
                  <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    ${r.title}
                  </h3>
                  <div style="font-size: 0.86rem; color: var(--text-secondary);">
                    <strong>Authors:</strong> ${r.author_names || 'Institutional Author'} • 
                    <strong>Year:</strong> ${r.publication_year || 'N/A'} • 
                    <strong>Publisher:</strong> ${r.publisher || 'Academic Press'}
                    ${r.doi ? ` • <strong>DOI:</strong> <a href="https://doi.org/${r.doi}" target="_blank" style="color: var(--color-forest); text-decoration: underline;">${r.doi}</a>` : ''}
                  </div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0; align-items: flex-start;">
                  <button class="btn btn-outline btn-sm" onclick="LibraryModule.showCitation('${r.id}')">
                    <i data-lucide="quote"></i> Cite
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="LibraryModule.bookmarkResource('${r.id}', '${(r.title || '').replace(/'/g, "\\'")}')" title="Save to Study Bookmarks">
                    <i data-lucide="bookmark"></i> Save
                  </button>
                  ${r.reference_url ? `<a href="${r.reference_url}" target="_blank" class="btn btn-secondary btn-sm"><i data-lucide="external-link"></i> Access</a>` : ''}
                </div>
              </div>

              <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.65; margin-top: 10px;">
                ${r.abstract || 'Comprehensive foundational psychological reference work.'}
              </p>
              
              <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 0.80rem; color: var(--text-muted);">
                <span>Subject: ${r.subject || 'Psychological Science'}</span>
                <span>Copyright / Licensing: ${r.copyright_status || 'Metadata & Authorized Open Reference'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  },

  async bookmarkResource(resourceId, title) {
    try {
      await API.post('/api/library/bookmarks', {
        item_type: 'resource',
        item_id: resourceId,
        title: title || 'Psychological Resource',
        notes: 'Bookmarked from Digital Library catalog'
      });
      showToast('Resource added to study bookmarks!', 'success');
    } catch (err) {
      showToast('Could not save bookmark', 'error');
    }
  },

  async showCitation(resourceId) {
    try {
      const res = await API.get(`/api/library/resources/${resourceId}`);
      const citationData = await API.get(`/api/library/resources/${resourceId}/citation`).catch(() => null);
      const modal = document.getElementById('citation-modal');
      const content = document.getElementById('citation-modal-content');

      const c = citationData || res.citations || {};
      const apa = c.apa || res.citation_apa || `${res.author_names || 'Author'}. (${res.publication_year || 'n.d.'}). ${res.title}. ${res.publisher || ''}.`;
      const bibtex = c.bibtex || res.citation_bibtex || `@book{ref${res.id},\n  title = {${res.title}},\n  author = {${res.author_names || 'Author'}},\n  year = {${res.publication_year || ''}}\n}`;
      const mla = c.mla || '';
      const chicago = c.chicago || '';
      const vancouver = c.vancouver || '';
      const ris = c.ris || '';

      content.innerHTML = `
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); font-family: 'Times New Roman', Times, serif;">
          ${res.title}
        </h3>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; margin-bottom: 6px; color: var(--color-forest);">APA 7th Edition:</h4>
          <div style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-sm); font-size: 0.95rem; font-family: 'Times New Roman', Times, serif; line-height: 1.6; user-select: all;">
            ${apa}
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top: 6px;" onclick="navigator.clipboard.writeText('${apa.replace(/'/g, "\\'")}'); showToast('APA 7th copied!');">
            <i data-lucide="copy"></i> Copy APA 7th
          </button>
        </div>

        ${mla ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; margin-bottom: 6px; color: var(--color-forest);">MLA 9th Edition:</h4>
          <div style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.92rem; font-family: 'Times New Roman', Times, serif; line-height: 1.5; user-select: all;">
            ${mla}
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top: 6px;" onclick="navigator.clipboard.writeText('${mla.replace(/'/g, "\\'")}'); showToast('MLA copied!');">
            <i data-lucide="copy"></i> Copy MLA
          </button>
        </div>` : ''}

        ${chicago ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; margin-bottom: 6px; color: var(--color-forest);">Chicago 17th Edition:</h4>
          <div style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.92rem; font-family: 'Times New Roman', Times, serif; line-height: 1.5; user-select: all;">
            ${chicago}
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top: 6px;" onclick="navigator.clipboard.writeText('${chicago.replace(/'/g, "\\'")}'); showToast('Chicago copied!');">
            <i data-lucide="copy"></i> Copy Chicago
          </button>
        </div>` : ''}

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; margin-bottom: 6px; color: var(--color-forest);">BibTeX:</h4>
          <pre style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-sm); font-size: 0.88rem; font-family: 'Times New Roman', Times, serif; line-height: 1.45; user-select: all; overflow-x: auto;">${bibtex}</pre>
          <button class="btn btn-outline btn-sm" style="margin-top: 6px;" onclick="navigator.clipboard.writeText('${bibtex.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'); showToast('BibTeX copied!');">
            <i data-lucide="copy"></i> Copy BibTeX
          </button>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px;">
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('citation-modal').classList.add('hidden')">
            Close
          </button>
        </div>
      `;

      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to show citation:', err);
    }
  },

  openAddResourceModal() {
    showToast('Use "Upload Document" for PDF/DOCX indexing, or enter verified citation details.', 'info');
  }
};

