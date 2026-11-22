// public/js/modules/knowledgeBase.js
// Psychology Structured Knowledge Base Module (17 Standard Sections & Relationship Graph)

const KnowledgeModule = {
  activeTopicId: null,

  async render(container, selectedTopic = null) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Psychology Knowledge Base</h1>
          <p class="view-header-subtitle">Structured, evidence-grounded articles with 17 academic dimensions, concept relationship maps, and verified citations.</p>
        </div>
      </div>

      <!-- TOPIC RELATIONSHIP BREADCRUMB / EXPLORER -->
      <div class="card" style="margin-bottom: 20px; padding: 14px 18px;">
        <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">
          <i data-lucide="network"></i> Topic Relationship Graph (Click to Explore)
        </div>
        <div id="kb-topic-graph" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- TWO PANE KNOWLEDGE VIEW -->
      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 20px; min-height: 600px;">
        
        <!-- TOPIC LIST (LEFT) -->
        <div class="card" style="display: flex; flex-direction: column; padding: 16px;">
          <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span>Knowledge Topics</span>
            <span class="badge" id="kb-topic-count">--</span>
          </h3>
          <div id="kb-articles-list" style="display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: 700px;">
            <div style="font-size: 0.84rem; color: var(--text-muted);">Loading topics...</div>
          </div>
        </div>

        <!-- ARTICLE DETAIL (RIGHT) -->
        <div class="card" id="kb-article-detail" style="padding: 28px; overflow-y: auto; max-height: 780px;">
          <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <i data-lucide="book-open" style="width: 48px; height: 48px; margin-bottom: 12px;"></i>
            <h3>Select a topic from the left to read its complete 17-section structured academic article.</h3>
          </div>
        </div>

      </div>
    `;

    await this.loadTopicRelations();
    await this.loadArticlesList(selectedTopic);
    if (window.lucide) window.lucide.createIcons();
  },

  async loadTopicRelations() {
    try {
      const relations = await API.get('/api/knowledge/relations');
      const container = document.getElementById('kb-topic-graph');
      if (!container) return;

      container.innerHTML = relations.map(r => `
        <button class="btn btn-outline btn-sm" onclick="KnowledgeModule.searchAndOpen('${r.target_topic}')" title="${r.description || ''}">
          <span style="color: var(--text-muted); font-size: 0.72rem;">${r.source_topic} →</span>
          <strong>${r.target_topic}</strong>
        </button>
      `).join('');
    } catch (err) {
      console.error('Failed to load topic relations:', err);
    }
  },

  async loadArticlesList(preselectedTopic = null) {
    try {
      const articles = await API.get('/api/knowledge/articles');
      const countEl = document.getElementById('kb-topic-count');
      const listContainer = document.getElementById('kb-articles-list');
      if (countEl) countEl.textContent = `${articles.length} Topics`;
      if (!listContainer) return;

      listContainer.innerHTML = articles.map(art => `
        <div class="nav-item ${art.topic_id === preselectedTopic ? 'active' : ''}" 
             style="cursor: pointer; padding: 10px 12px; border: 1px solid var(--border-subtle); display: block;"
             onclick="KnowledgeModule.loadArticle('${art.topic_id}', this)">
          <div style="font-size: 0.72rem; color: var(--primary); font-weight: 600;">${art.category}</div>
          <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-primary); margin-top: 2px;">${art.title}</div>
        </div>
      `).join('');

      // Auto load first or preselected topic
      const targetId = preselectedTopic || (articles.length > 0 ? articles[0].topic_id : null);
      if (targetId) {
        this.loadArticle(targetId);
      }
    } catch (err) {
      console.error('Failed to load articles list:', err);
    }
  },

  async loadArticle(topicId, clickedElement = null) {
    this.activeTopicId = topicId;
    if (clickedElement) {
      document.querySelectorAll('#kb-articles-list .nav-item').forEach(el => el.classList.remove('active'));
      clickedElement.classList.add('active');
    }

    const detailContainer = document.getElementById('kb-article-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading article...</div>`;

    try {
      const art = await API.get(`/api/knowledge/articles/${topicId}`);
      
      const theoristsList = Array.isArray(art.key_theorists) ? art.key_theorists.join(', ') : (art.key_theorists || 'N/A');

      detailContainer.innerHTML = `
        <div style="border-bottom: 2px solid var(--border-color); padding-bottom: 18px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge" style="background: var(--color-sage-light); color: var(--color-sage); font-size: 0.78rem;">
                ${art.category}
              </span>
              <span class="badge badge-verified">
                <i data-lucide="shield-check"></i> ${art.verified_status}
              </span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="KnowledgeModule.showCitation('${art.topic_id || art.id}')">
                <i data-lucide="quote"></i> Cite Article
              </button>
              <button class="btn btn-outline btn-sm" onclick="KnowledgeModule.bookmarkArticle('${art.topic_id || art.id}', '${(art.title || '').replace(/'/g, "\\'")}', '${art.category || ''}')">
                <i data-lucide="bookmark"></i> Save
              </button>
            </div>
          </div>
          <h1 style="font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.25;">
            ${art.title}
          </h1>
          <div style="font-size: 0.82rem; color: var(--text-muted);">
            Structured 17-Dimension Psychology Knowledge Synthesis • Academic Standard
          </div>
        </div>

        <!-- 17 STANDARD STRUCTURED SECTIONS -->
        <div style="display: flex; flex-direction: column; gap: 22px; line-height: 1.7; font-size: 0.92rem;">
          
          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">1. Operational Definition</h3>
            <p style="background: var(--bg-app); border-left: 4px solid var(--primary); padding: 12px 16px; border-radius: var(--radius-sm); font-weight: 500;">
              ${art.definition}
            </p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">2. Academic Introduction</h3>
            <p>${art.introduction}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">3. Historical Background & Emergence</h3>
            <p>${art.historical_background || 'Historical evolution documented across classical and modern psychological literature.'}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">4. Key Theorists & Investigators</h3>
            <div style="background: var(--lavender); border: 1px solid var(--lavender-border); padding: 10px 14px; border-radius: var(--radius-sm); color: var(--primary-deep); font-weight: 500;">
              ${theoristsList}
            </div>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">5. Major Theories & Frameworks</h3>
            <div style="white-space: pre-line;">${art.major_theories}</div>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">6. Core Concepts & Taxonomy</h3>
            <p>${art.core_concepts}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">7. Foundational Principles</h3>
            <div style="white-space: pre-line;">${art.principles}</div>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">8. Scientific Classification</h3>
            <p>${art.classification}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">9. Structural & Cognitive Models</h3>
            <p>${art.models}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">10. Real-World Applications</h3>
            <p>${art.applications}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">11. Clinical & Diagnostic Relevance</h3>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: var(--radius-sm); color: #1e40af;">
              ${art.clinical_relevance}
            </div>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">12. Research & Neuroimaging Evidence</h3>
            <p>${art.research_evidence}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">13. Applied Case Examples</h3>
            <p>${art.examples}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">14. Methodological Limitations & Criticisms</h3>
            <p>${art.limitations}</p>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">15. Related Concepts & Subtopics</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${(art.relatedTopics || []).map(t => `
                <span class="badge" style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 5px 10px; font-size: 0.80rem;">
                  ${t.target_topic} (${t.relation_type})
                </span>
              `).join('')}
            </div>
          </section>

          <!-- 16. DEDICATED REFERENCES SECTION -->
          <section style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 18px 20px; border-radius: var(--radius-md);">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="book-check" style="color: var(--primary);"></i>
              16. References & Verified Citations
            </h3>
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 0.95rem; line-height: 1.8; color: var(--text-secondary); white-space: pre-line;">
              ${art.references_citations}
            </div>
          </section>

          <section>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">17. Recommended Textbooks & Foundational Papers</h3>
            <div style="font-style: italic; color: var(--text-secondary);">
              ${art.recommended_reading || 'Standard APA, Oxford, and Cambridge psychology reference manuals.'}
            </div>
          </section>

        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load article detail:', err);
    }
  },

  searchAndOpen(topicName) {
    document.getElementById('global-search-input').value = topicName;
    App.handleGlobalSearch(topicName);
  },

  async bookmarkArticle(topicId, title, category) {
    try {
      await API.post('/api/library/bookmarks', {
        item_type: 'article',
        item_id: topicId,
        title: title || 'Psychology Knowledge Article',
        category: category || 'General Psychology',
        notes: 'Bookmarked from Knowledge Base'
      });
      showToast('Article added to study bookmarks!', 'success');
    } catch (err) {
      showToast('Could not save bookmark', 'error');
    }
  },

  async showCitation(topicId) {
    try {
      const art = await API.get(`/api/knowledge/articles/${topicId}`);
      const citationData = await API.get(`/api/knowledge/articles/${topicId}/citation`).catch(() => null);
      
      const c = citationData || art.citations || {};
      const apa = c.apa || art.citation_apa || `${art.authorReferences || 'Author'}. (2024). ${art.title}. Comprehensive Psychology Knowledge Base.`;
      const bibtex = c.bibtex || art.citation_bibtex || `@article{art_${topicId},\n  title = {${art.title}},\n  year = {2024}\n}`;

      // Open Library citation modal or create inline dialog
      let modal = document.getElementById('citation-modal');
      let content = document.getElementById('citation-modal-content');

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'citation-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title"><i data-lucide="quote"></i> Academic Citation</div>
              <button class="icon-btn" onclick="document.getElementById('citation-modal').classList.add('hidden')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body" id="citation-modal-content"></div>
          </div>
        `;
        document.body.appendChild(modal);
        content = document.getElementById('citation-modal-content');
      }

      content.innerHTML = `
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); font-family: 'Times New Roman', Times, serif;">
          ${art.title}
        </h3>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; margin-bottom: 6px; color: var(--color-forest);">APA 7th Edition:</h4>
          <div style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-sm); font-size: 0.95rem; font-family: 'Times New Roman', Times, serif; line-height: 1.6; user-select: all;">
            ${apa}
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top: 6px;" onclick="navigator.clipboard.writeText('${apa.replace(/'/g, "\\'")}'); showToast('APA citation copied!');">
            <i data-lucide="copy"></i> Copy APA 7th
          </button>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; margin-bottom: 6px; color: var(--color-forest);">BibTeX:</h4>
          <pre style="background: var(--bg-app); border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-sm); font-size: 0.88rem; font-family: 'Times New Roman', Times, serif; line-height: 1.45; user-select: all; overflow-x: auto;">${bibtex}</pre>
          <button class="btn btn-outline btn-sm" style="margin-top: 6px;" onclick="navigator.clipboard.writeText('${bibtex.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'); showToast('BibTeX copied!');">
            <i data-lucide="copy"></i> Copy BibTeX
          </button>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('citation-modal').classList.add('hidden')">
            Close
          </button>
        </div>
      `;

      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to show article citation:', err);
    }
  }
};

