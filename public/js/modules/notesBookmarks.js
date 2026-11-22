// public/js/modules/notesBookmarks.js
// Notes and Bookmarks Workspace

const NotesBookmarksModule = {
  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Notes & Bookmarks</h1>
          <p class="view-header-subtitle">Saved psychological citations, assessment bookmarks, revision checklists, and academic annotations.</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <!-- SAVED BOOKMARKS -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 14px;"><i data-lucide="bookmark"></i> Saved Items</h3>
          <div id="bookmarks-list" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-size: 0.84rem; color: var(--text-muted);">Loading bookmarks...</div>
          </div>
        </div>

        <!-- QUICK NOTES SCRATCHPAD -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 10px;"><i data-lucide="edit-3"></i> Scholar's Revision Scratchpad</h3>
          <p style="font-size: 0.80rem; color: var(--text-muted); margin-bottom: 12px;">Persistent local notes saved automatically in browser storage:</p>
          <textarea id="scholar-scratchpad" style="width: 100%; height: 260px; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.88rem; line-height: 1.6; background: var(--bg-app); color: var(--text-primary); resize: none;" placeholder="Record lecture thoughts, mnemonics, quick references, or hypotheses here..." oninput="localStorage.setItem('scholar_scratchpad_notes', this.value)"></textarea>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span style="font-size: 0.76rem; color: var(--text-muted);">Auto-saved locally</span>
            <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('scholar-scratchpad').value); showToast('Notes copied!');">
              <i data-lucide="copy"></i> Copy Notes
            </button>
          </div>
        </div>

      </div>
    `;

    // Load scratchpad from localStorage
    const savedNotes = localStorage.getItem('scholar_scratchpad_notes') || '';
    const pad = document.getElementById('scholar-scratchpad');
    if (pad) pad.value = savedNotes;

    await this.loadBookmarks();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadBookmarks() {
    try {
      const bookmarks = await API.get('/api/library/bookmarks');
      const container = document.getElementById('bookmarks-list');
      if (!container) return;

      if (bookmarks.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 0.84rem;">
            No bookmarks saved yet. Bookmark resources in the Psychology Library or Assessment Centre for rapid access.
          </div>
        `;
        return;
      }

      container.innerHTML = bookmarks.map(b => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
          <div>
            <span class="badge" style="background: var(--color-sage-light); color: var(--color-sage); font-size: 0.70rem; text-transform: uppercase;">${b.item_type}</span>
            <div style="font-size: 0.90rem; font-weight: 600; margin-top: 2px; color: var(--text-primary); font-family: 'Times New Roman', Times, serif;">${b.title || `Item #${b.item_id}`}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${b.notes || 'Saved academic reference'}</div>
          </div>
          <button class="icon-btn" onclick="NotesBookmarksModule.deleteBookmark('${b.id}')" title="Delete Bookmark">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  },

  async deleteBookmark(id) {
    try {
      await API.delete(`/api/library/bookmarks/${id}`);
      showToast('Bookmark removed', 'info');
      this.loadBookmarks();
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  }
};

