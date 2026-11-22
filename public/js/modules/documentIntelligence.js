// public/js/modules/documentIntelligence.js
// Document Intelligence: Split-Screen Viewer, Page Preservation, RAG Chat, Selection Q&A, Multi-Doc Reasoning

const DocumentModule = {
  activeDocId: null,
  activeDoc: null,
  selectedForMultiRag: new Set(),
  selectedDocsForMultiRag: new Set(),

  async render(container, preselectedDocId = null) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Document Intelligence & RAG Workspace</h1>
          <p class="view-header-subtitle">Split-screen reader with page-level indexing, text selection inquiry, and grounded multi-document retrieval.</p>
        </div>
        <div class="top-actions">
          <button class="btn btn-outline btn-sm" onclick="DocumentModule.toggleMultiDocSelector()">
            <i data-lucide="layers"></i> Multi-Doc Selection (<span id="multi-doc-count">0</span>)
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.openUploadModal()">
            <i data-lucide="upload-cloud"></i> Upload New Document
          </button>
        </div>
      </div>

      <!-- MULTI-DOCUMENT SELECTION TRAY (COLLAPSIBLE) -->
      <div id="multi-doc-tray" class="card hidden" style="margin-bottom: 20px; padding: 16px 20px; background: var(--color-beige-light); border-color: var(--color-beige-border);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <strong style="font-size: 0.95rem; color: var(--color-forest);">
            <i data-lucide="check-square" style="color: var(--color-forest);"></i> Select Multiple Uploaded Documents to Cross-Compare in AI Chat:
          </strong>
          <span style="font-size: 0.82rem; color: var(--text-muted);">Citations will show page numbers per document</span>
        </div>
        <div id="multi-doc-checkboxes" style="display: flex; gap: 14px; flex-wrap: wrap;">
          <!-- Injected -->
        </div>
      </div>

      <!-- DOCUMENT SELECTOR ROW -->
      <div class="card" style="margin-bottom: 20px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 280px;">
          <label style="font-size: 0.86rem; font-weight: 600; white-space: nowrap;">Active Document:</label>
          <select id="doc-active-select" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app); color: var(--text-primary);" onchange="DocumentModule.openDocument(this.value)">
            <option value="">-- Choose an uploaded document --</option>
          </select>
        </div>
        <div id="doc-summary-pill" style="font-size: 0.80rem; color: var(--text-muted);">
          No document selected
        </div>
      </div>

      <!-- SPLIT-SCREEN WORKSPACE (LEFT: DOCUMENT READER | RIGHT: AI Q&A) -->
      <div class="split-screen" id="doc-split-workspace">
        
        <!-- LEFT PANEL: DOCUMENT READER -->
        <div class="split-panel">
          <div class="panel-toolbar">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="book-open" style="color: var(--primary); width: 18px; height: 18px;"></i>
              <strong style="font-size: 0.88rem;" id="doc-reader-title">Document Content</strong>
            </div>
            <div id="selection-prompt-action" class="hidden">
              <button class="btn btn-secondary btn-sm" onclick="DocumentModule.askSelectedText()">
                <i data-lucide="sparkles"></i> Ask AI about Selection
              </button>
            </div>
          </div>
          
          <div class="panel-content" id="doc-reader-content" onmouseup="DocumentModule.handleTextSelection()">
            <div style="text-align: center; padding: 80px 20px; color: var(--text-muted);">
              <i data-lucide="file-text" style="width: 48px; height: 48px; margin-bottom: 12px;"></i>
              <h3>Select or upload a document to view its pages, sections, and study notes here.</h3>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: GROUNDED AI WORKSPACE -->
        <div class="split-panel">
          <div class="panel-toolbar">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="bot" style="color: var(--primary); width: 18px; height: 18px;"></i>
              <strong style="font-size: 0.88rem;">Document-Grounded Assistant</strong>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm" onclick="DocumentModule.quickAsk('Summarize key findings')">Summarize</button>
              <button class="btn btn-outline btn-sm" onclick="DocumentModule.quickAsk('Extract all references and citations')">References</button>
              <button class="btn btn-outline btn-sm" onclick="DocumentModule.quickAsk('Generate 5 exam practice questions')">Questions</button>
            </div>
          </div>

          <div class="chat-container">
            <div class="chat-messages" id="doc-chat-messages">
              <div class="chat-bubble assistant">
                <strong>Document Grounded Q&A Ready.</strong><br>
                Ask questions regarding specific chapters, definitions, methodologies, or theories. Every response will cite exact document pages and supporting quotes.
              </div>
            </div>

            <div class="chat-input-row">
              <textarea id="doc-chat-input" placeholder="Ask a question grounded in this document... (Press Enter to Send)" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); DocumentModule.sendQuestion();}"></textarea>
              <button class="btn btn-primary" onclick="DocumentModule.sendQuestion()">
                <i data-lucide="send"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    await this.loadDocumentList(preselectedDocId);
    if (window.lucide) window.lucide.createIcons();
  },

  async loadDocumentList(preselectId = null) {
    try {
      const docs = await API.get('/api/documents');
      const select = document.getElementById('doc-active-select');
      const tray = document.getElementById('multi-doc-checkboxes');
      if (!select) return;

      select.innerHTML = '<option value="">-- Choose an uploaded document --</option>' +
        docs.map(d => `<option value="${d.id}" ${d.id === preselectId ? 'selected' : ''}>${d.original_name || d.originalFilename} (${d.total_pages || d.pageCount} pages)</option>`).join('');

      if (tray) {
        tray.innerHTML = docs.map(d => `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer;">
            <input type="checkbox" value="${d.id}" onchange="DocumentModule.toggleMultiDocCheck('${d.id}', this.checked)">
            <span>${d.original_name || d.originalFilename}</span>
          </label>
        `).join('');
      }

      // If docs exist and none preselected, open first
      const targetId = preselectId || (docs.length > 0 ? docs[0].id : null);
      if (targetId) {
        select.value = targetId;
        this.openDocument(targetId);
      }
    } catch (err) {
      console.error('Failed to load document list:', err);
    }
  },

  toggleMultiDocSelector() {
    const tray = document.getElementById('multi-doc-tray');
    if (tray) tray.classList.toggle('hidden');
  },

  toggleMultiDocCheck(docId, checked) {
    if (checked) {
      this.selectedForMultiRag.add(docId);
    } else {
      this.selectedForMultiRag.delete(docId);
    }
    const badge = document.getElementById('multi-doc-count');
    if (badge) badge.textContent = this.selectedForMultiRag.size;
  },

  async openDocument(docId) {
    if (!docId) return;
    this.activeDocId = String(docId);

    const readerTitle = document.getElementById('doc-reader-title');
    const readerContent = document.getElementById('doc-reader-content');
    const summaryPill = document.getElementById('doc-summary-pill');
    
    if (readerContent) {
      readerContent.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading document pages...</div>`;
    }

    try {
      const doc = await API.get(`/api/documents/${docId}`);
      this.activeDoc = doc;

      const docName = doc.original_name || doc.originalFilename;
      const pageCount = doc.total_pages || doc.pageCount;
      if (readerTitle) readerTitle.textContent = `${docName} (${pageCount} Pages)`;
      if (summaryPill) {
        const concepts = Array.isArray(doc.key_concepts || doc.keyConcepts) ? (doc.key_concepts || doc.keyConcepts).slice(0, 3).join(', ') : 'Psychology';
        summaryPill.innerHTML = `<strong>Focus:</strong> ${concepts} • <strong>Size:</strong> ${((doc.file_size || doc.fileSize) / 1024).toFixed(1)} KB`;
      }

      // Render Pages with page markers
      readerContent.innerHTML = `
        <!-- STUDY NOTES & CONCEPTS DRAWER -->
        <div class="card" style="background: var(--color-beige-light); border-color: var(--color-beige-border); margin-bottom: 22px; padding: 18px 22px;">
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--color-forest); margin-bottom: 8px;">
            <i data-lucide="sparkles" style="color: var(--color-terracotta);"></i> Automated Document Intelligence Summary:
          </h4>
          <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.65; margin-bottom: 12px;">
            ${doc.summary || 'Summary processing complete.'}
          </p>
          <div style="font-size: 0.84rem; color: var(--text-muted);">
            <strong style="color: var(--text-primary);">Identified Concepts:</strong> ${(doc.key_concepts || doc.keyConcepts || []).join(', ')}
          </div>
        </div>

        <!-- DOCUMENT PAGES -->
        <div class="document-text-viewer">
          ${(doc.pages || []).map(p => `
            <div class="document-page-card" id="page-card-${p.page_number || p.pageNumber}">
              <div class="page-marker">
                <span>PAGE ${p.page_number || p.pageNumber}</span>
                <span>${p.heading || ''}</span>
              </div>
              <div style="white-space: pre-wrap; font-size: 0.90rem; line-height: 1.7;">${p.text_content || p.extractedText}</div>
            </div>
          `).join('')}
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to open document:', err);
    }
  },

  handleTextSelection() {
    const selection = window.getSelection().toString().trim();
    const actionBtn = document.getElementById('selection-prompt-action');
    if (selection.length > 5) {
      this.selectedTextSnippet = selection;
      actionBtn?.classList.remove('hidden');
    } else {
      actionBtn?.classList.add('hidden');
    }
  },

  askSelectedText() {
    if (!this.selectedTextSnippet) return;
    const input = document.getElementById('doc-chat-input');
    if (input) {
      input.value = `Explain the clinical and theoretical meaning of this excerpt: "${this.selectedTextSnippet}"`;
      input.focus();
    }
  },

  quickAsk(prompt) {
    const input = document.getElementById('doc-chat-input');
    if (input) {
      input.value = prompt;
      this.sendQuestion();
    }
  },

  async sendQuestion() {
    const input = document.getElementById('doc-chat-input');
    const query = input?.value.trim();
    if (!query) return;

    input.value = '';
    const messages = document.getElementById('doc-chat-messages');

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user';
    userMsg.textContent = query;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    // Append Loading Assistant Bubble
    const assistantMsg = document.createElement('div');
    assistantMsg.className = 'chat-bubble assistant';
    assistantMsg.innerHTML = `<span style="color: var(--text-muted);"><i data-lucide="loader" class="spinner"></i> Searching document text and retrieving grounded citations...</span>`;
    messages.appendChild(assistantMsg);
    messages.scrollTop = messages.scrollHeight;

    // Determine target doc IDs
    let targetDocIds = [];
    if (this.selectedForMultiRag.size > 0) {
      targetDocIds = Array.from(this.selectedForMultiRag);
    } else if (this.activeDocId) {
      targetDocIds = [this.activeDocId];
    }

    try {
      const res = await API.post('/api/documents/ask', {
        query,
        documentIds: targetDocIds
      });

      let citationsHtml = '';
      if (res.citations && res.citations.length > 0) {
        citationsHtml = `
          <div class="chat-citation-box">
            <div class="citation-header">
              <i data-lucide="shield-check"></i>
              <span>Page-Level Citations (${res.citations.length} Grounded Sources):</span>
            </div>
            ${res.citations.map(c => `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed var(--color-beige-border); line-height: 1.6;">
                <strong style="color: var(--color-forest);">${c.documentName}</strong> • Page <strong>${c.pageNumber}</strong> <em>(${c.section})</em>
                <div style="font-style: italic; color: var(--text-secondary); margin-top: 3px; font-size: 0.90rem;">"${c.excerpt}"</div>
              </div>
            `).join('')}
          </div>
        `;
      }

      assistantMsg.innerHTML = `
        <div style="margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span class="badge ${res.citations && res.citations.length > 0 ? 'badge-verified' : 'badge-exploratory'}">
            ${res.confidence}
          </span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">
            ${res.multiDocumentComparison ? 'Multi-Document Comparison' : 'Grounded Single-Doc'}
          </span>
        </div>
        <div style="white-space: pre-wrap; font-size: 0.88rem; line-height: 1.6;">${res.answer}</div>
        ${citationsHtml}
      `;

      messages.scrollTop = messages.scrollHeight;
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      assistantMsg.innerHTML = `<span style="color: var(--danger);">Error retrieving grounded answer: ${err.message}</span>`;
    }
  }
};

