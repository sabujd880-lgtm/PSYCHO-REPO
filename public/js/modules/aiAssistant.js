// public/js/modules/aiAssistant.js
// Centralized AI Psychology Assistant with 8 specialized persona modes

const AiAssistantModule = {
  currentMode: 'Knowledge',

  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">AI Psychology Assistant</h1>
          <p class="view-header-subtitle">Evidence-grounded assistant with 8 specialized professional persona modes and source-prioritized citation verification.</p>
        </div>
      </div>

      <!-- PERSONA MODES BAR -->
      <div id="ai-modes-bar" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 20px;">
        <button class="btn btn-secondary btn-sm active-mode" onclick="AiAssistantModule.setMode('Knowledge', this)">
          <i data-lucide="book"></i> Psychology Expert
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('Clinical', this)">
          <i data-lucide="clipboard-plus"></i> Clinical Reference
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('Assessment', this)">
          <i data-lucide="gauge"></i> Assessment Reference
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('Research', this)">
          <i data-lucide="flask-conical"></i> Research Assistant
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('DocumentChat', this)">
          <i data-lucide="file-text"></i> Document Chat (RAG)
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('PYQ', this)">
          <i data-lucide="trending-up"></i> PYQ Analysis
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('ExamPrep', this)">
          <i data-lucide="graduation-cap"></i> Exam Preparation
        </button>
        <button class="btn btn-outline btn-sm" onclick="AiAssistantModule.setMode('Teaching', this)">
          <i data-lucide="presentation"></i> Teaching Assistant
        </button>
      </div>

      <!-- MODE DESCRIPTION & CITATION POLICY PILL -->
      <div class="card" style="margin-bottom: 18px; padding: 12px 18px; background: var(--bg-app); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="font-size: 0.82rem; color: var(--text-secondary);" id="ai-mode-description">
          <strong>Psychology Expert Mode:</strong> Synthesizes verified cognitive, behavioral, neurobiological, and social psychological literature with authoritative citations.
        </div>
        <span class="badge badge-verified">
          <i data-lucide="shield-check"></i> Source Priority Enforced
        </span>
      </div>

      <!-- CENTRAL CHAT WORKSPACE -->
      <div class="card" style="display: flex; flex-direction: column; height: calc(100vh - var(--navbar-height) - 240px); min-height: 480px; padding: 0; overflow: hidden;">
        
        <div class="chat-messages" id="ai-assistant-messages" style="flex: 1; padding: 20px;">
          <div class="chat-bubble assistant">
            <strong>Welcome to your Personal Psychology Assistant.</strong><br>
            Current Mode: <span id="bubble-active-mode" style="color: var(--primary); font-weight: 600;">Psychology Expert</span>.<br>
            Ask conceptual, clinical, statistical, or examination questions. The assistant strictly prioritizes uploaded documents and verified academic references.
          </div>
        </div>

        <div class="chat-input-row" style="border-top: 1px solid var(--border-color);">
          <textarea id="ai-central-input" placeholder="Enter psychological query or prompt... (Shift+Enter for new line)" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); AiAssistantModule.sendMessage();}"></textarea>
          <button class="btn btn-primary" onclick="AiAssistantModule.sendMessage()">
            <i data-lucide="send"></i>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  setMode(mode, btnElement) {
    this.currentMode = mode;
    document.querySelectorAll('#ai-modes-bar button').forEach(b => b.className = 'btn btn-outline btn-sm');
    if (btnElement) btnElement.className = 'btn btn-secondary btn-sm active-mode';

    const descEl = document.getElementById('ai-mode-description');
    const bubbleMode = document.getElementById('bubble-active-mode');
    if (bubbleMode) bubbleMode.textContent = mode;

    const descriptions = {
      Knowledge: '<strong>Psychology Expert Mode:</strong> Synthesizes verified cognitive, behavioral, neurobiological, and social psychological literature with authoritative citations.',
      Clinical: '<strong>Clinical Reference Mode:</strong> Clinical assessment guidelines, case formulation (5 Ps), and psychopathology reference. Not a substitute for formal diagnosis.',
      Assessment: '<strong>Assessment Reference Mode:</strong> Verifies test reliability, validity, norms, age ranges, and qualification levels.',
      Research: '<strong>Research Assistant Mode:</strong> Methodology formulation, experimental designs, sampling methods, and statistical interpretation.',
      DocumentChat: '<strong>Document Chat Mode:</strong> Strictly document-grounded RAG retrieval across uploaded PDFs, DOCX, and academic papers with page citations.',
      PYQ: '<strong>PYQ Analysis Mode:</strong> Examines multi-year UGC NET and MSc entrance question recurrence and rotational trends.',
      ExamPrep: '<strong>Exam Preparation Mode:</strong> Concept clarifications, high-yield topics, and Socratic practice solving.',
      Teaching: '<strong>Teaching Assistant Mode:</strong> Lesson design, classroom engagement activities, worksheets, and formative quiz questions.'
    };

    if (descEl) descEl.innerHTML = descriptions[mode] || descriptions.Knowledge;
    if (window.lucide) window.lucide.createIcons();
  },

  async sendMessage() {
    const input = document.getElementById('ai-central-input');
    const prompt = input?.value.trim();
    if (!prompt) return;

    input.value = '';
    const messages = document.getElementById('ai-assistant-messages');

    // User Message
    const uMsg = document.createElement('div');
    uMsg.className = 'chat-bubble user';
    uMsg.textContent = prompt;
    messages.appendChild(uMsg);
    messages.scrollTop = messages.scrollHeight;

    // Loading Assistant
    const aMsg = document.createElement('div');
    aMsg.className = 'chat-bubble assistant';
    aMsg.innerHTML = `<span style="color: var(--text-muted);"><i data-lucide="loader" class="spinner"></i> Consulting verified knowledge base and psychological references...</span>`;
    messages.appendChild(aMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await API.post('/api/ai/chat', {
        prompt,
        mode: this.currentMode
      });

      let citationsHtml = '';
      if (res.citations && res.citations.length > 0) {
        citationsHtml = `
          <div class="chat-citation-box">
            <div class="citation-header">
              <i data-lucide="shield-check"></i>
              <span>Verified References & Academic Sources:</span>
            </div>
            ${res.citations.map(c => `
              <div style="margin-top: 4px; font-size: 0.78rem;">
                <strong>${c.source || c.documentName}</strong>: ${c.referenceText || c.excerpt}
              </div>
            `).join('')}
          </div>
        `;
      }

      aMsg.innerHTML = `
        <div style="margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span class="badge ${res.evidenceStatus.includes('Verified') || res.evidenceStatus.includes('Document') ? 'badge-verified' : 'badge-moderate'}">
            ${res.evidenceStatus}
          </span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${res.mode}</span>
        </div>
        <div style="white-space: pre-wrap; line-height: 1.6; font-size: 0.88rem;">${res.response}</div>
        ${citationsHtml}
      `;

      messages.scrollTop = messages.scrollHeight;
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      aMsg.innerHTML = `<span style="color: var(--danger);">Assistant inquiry failed: ${err.message}</span>`;
    }
  }
};

