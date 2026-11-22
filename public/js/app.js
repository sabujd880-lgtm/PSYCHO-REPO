// public/js/app.js
// Main Application Controller, Client Router, Global Search, and Upload Manager

const App = {
  currentRoute: 'dashboard',

  init() {
    this.setupEventListeners();
    this.handleRoute();
    this.loadUserPreferences();

    // Listen to hash changes for navigation
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  setupEventListeners() {
    // Sidebar toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    toggleBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (window.lucide) window.lucide.createIcons();
    });

    // Mobile sidebar toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    mobileToggle?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Theme toggle button
    const themeBtn = document.getElementById('btn-theme-toggle');
    themeBtn?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(newTheme);
    });

    // Quick Action buttons
    document.getElementById('btn-quick-upload')?.addEventListener('click', () => this.openUploadModal());
    document.getElementById('btn-quick-ai')?.addEventListener('click', () => this.navigate('ai-assistant'));
    document.getElementById('btn-close-upload-modal')?.addEventListener('click', () => this.closeUploadModal());

    // Global Search Input
    const searchInput = document.getElementById('global-search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    
    let debounceTimer;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (!query) {
        searchDropdown?.classList.add('hidden');
        return;
      }
      debounceTimer = setTimeout(() => this.handleGlobalSearch(query), 200);
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.global-search-container')) {
        searchDropdown?.classList.add('hidden');
      }
    });

    // File Upload Drag & Drop
    this.setupDropZone();
  },

  setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--primary)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'var(--lavender-border)';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--lavender-border)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.uploadFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        this.uploadFile(fileInput.files[0]);
      }
    });
  },

  openUploadModal() {
    document.getElementById('upload-modal')?.classList.remove('hidden');
    document.getElementById('upload-status')?.classList.add('hidden');
    document.getElementById('drop-zone')?.classList.remove('hidden');
  },

  closeUploadModal() {
    document.getElementById('upload-modal')?.classList.add('hidden');
  },

  async uploadFile(file) {
    const dropZone = document.getElementById('drop-zone');
    const uploadStatus = document.getElementById('upload-status');
    const statusText = document.getElementById('upload-status-text');

    dropZone?.classList.add('hidden');
    uploadStatus?.classList.remove('hidden');
    if (statusText) statusText.textContent = `Extracting text, analyzing psychological concepts, and generating study notes for "${file.name}"...`;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Content = e.target.result;
        const res = await API.post('/api/documents/upload', {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: base64Content
        });

        showToast(`Document "${file.name}" indexed successfully with ${res.totalPages} pages!`, 'success');
        this.closeUploadModal();
        
        // Navigate to Document Intelligence and open this document
        this.navigate('document-intelligence');
        setTimeout(() => {
          if (window.DocumentModule) DocumentModule.openDocument(res.documentId);
        }, 300);

      } catch (err) {
        showToast(`Upload failed: ${err.message}`, 'error');
        uploadStatus?.classList.add('hidden');
        dropZone?.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  },

  async handleGlobalSearch(query) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;

    try {
      const data = await API.get(`/api/search?q=${encodeURIComponent(query)}`);
      if (data.results.length === 0) {
        dropdown.innerHTML = `<div style="padding: 16px; font-size: 0.84rem; color: var(--text-muted); text-align: center;">No matches found for "${query}"</div>`;
        dropdown.classList.remove('hidden');
        return;
      }

      dropdown.innerHTML = data.results.map(r => `
        <div class="search-item" onclick="App.selectSearchResult('${r.type}', '${r.id}')">
          <div class="search-item-header">
            <span class="search-item-title">${r.title}</span>
            <span class="search-item-type">${r.type}</span>
          </div>
          <div class="search-item-snippet">${r.snippet || r.subtitle || ''}</div>
        </div>
      `).join('');

      dropdown.classList.remove('hidden');
    } catch (err) {
      console.error('Search failed:', err);
    }
  },

  selectSearchResult(type, id) {
    document.getElementById('search-dropdown')?.classList.add('hidden');
    document.getElementById('global-search-input').value = '';

    if (type === 'Knowledge Article') {
      window.location.hash = '#knowledge-base';
      setTimeout(() => KnowledgeModule.loadArticle(id), 200);
    } else if (type === 'Library Resource') {
      window.location.hash = '#library';
      setTimeout(() => LibraryModule.showCitation(id), 200);
    } else if (type === 'Psychological Assessment') {
      window.location.hash = '#assessment';
    } else if (type === 'Uploaded Document') {
      window.location.hash = '#document-intelligence';
      setTimeout(() => DocumentModule.openDocument(id), 200);
    } else if (type === 'Exam PYQ') {
      window.location.hash = '#pyq-exam';
    }
  },

  navigate(route) {
    window.location.hash = `#${route}`;
  },

  handleRoute() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    this.currentRoute = hash;

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const navTarget = link.getAttribute('data-nav');
      link.classList.toggle('active', navTarget === hash);
    });

    const container = document.getElementById('main-content');
    if (!container) return;

    window.scrollTo(0, 0);

    // Route Dispatcher
    switch (hash) {
      case 'dashboard':
        renderDashboard(container);
        break;
      case 'library':
        LibraryModule.render(container);
        break;
      case 'knowledge-base':
        KnowledgeModule.render(container);
        break;
      case 'clinical':
        ClinicalModule.render(container);
        break;
      case 'assessment':
        AssessmentModule.render(container);
        break;
      case 'document-intelligence':
        DocumentModule.render(container);
        break;
      case 'research':
        ResearchModule.render(container);
        break;
      case 'pyq-exam':
        PyqExamModule.render(container, 'hub');
        break;
      case 'predictor':
        PyqExamModule.render(container, 'predict');
        break;
      case 'teaching':
        TeachingModule.render(container);
        break;
      case 'notes-bookmarks':
        NotesBookmarksModule.render(container);
        break;
      case 'ai-assistant':
        AiAssistantModule.render(container);
        break;
      case 'settings':
        SettingsModule.render(container);
        break;
      default:
        renderDashboard(container);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('psyche_theme', theme);
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  async loadUserPreferences() {
    const savedTheme = localStorage.getItem('psyche_theme') || 'light';
    this.applyTheme(savedTheme);

    try {
      const prefs = await API.get('/api/settings');
      const nameEl = document.getElementById('user-display-name');
      if (nameEl && prefs.user_name) nameEl.textContent = prefs.user_name;
    } catch {}
  }
};

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

