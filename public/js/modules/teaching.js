// public/js/modules/teaching.js
// Teaching Workspace: Lesson Plans, Lecture Notes, Worksheets, Quiz Generator, and Exports

const TeachingModule = {
  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">Psychology Teaching Workspace</h1>
          <p class="view-header-subtitle">Curriculum builder, lesson plan designer, Socratic discussion prompts, worksheets, and printable didactic materials.</p>
        </div>
        <div class="top-actions">
          <button class="btn btn-primary btn-sm" onclick="TeachingModule.openNewPlanModal()">
            <i data-lucide="plus-circle"></i> Create New Lesson Plan
          </button>
        </div>
      </div>

      <!-- LESSON PLANS GRID -->
      <div id="teaching-plans-container" style="display: flex; flex-direction: column; gap: 20px;">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading teaching materials...</div>
      </div>

      <!-- CREATE LESSON PLAN MODAL -->
      <div id="new-plan-modal" class="modal-overlay hidden">
        <div class="modal-card" style="max-width: 780px;">
          <div class="modal-header">
            <div class="modal-title"><i data-lucide="file-plus"></i> New Psychology Lesson Plan</div>
            <button class="icon-btn" onclick="document.getElementById('new-plan-modal').classList.add('hidden')"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="max-height: 75vh; overflow-y: auto;">
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">Topic / Lesson Title:</label>
                <input type="text" id="plan-title" placeholder="e.g. Cognitive Dissonance and Attitude Change" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 0.80rem; font-weight: 600;">Target Educational Level:</label>
                  <select id="plan-level" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app);">
                    <option value="Undergraduate">Undergraduate (BSc / BA)</option>
                    <option value="Postgraduate">Postgraduate (MSc / MA)</option>
                    <option value="Higher Secondary">Higher Secondary / A-Level</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 0.80rem; font-weight: 600;">Duration (Minutes):</label>
                  <input type="number" id="plan-duration" value="60" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
                </div>
              </div>
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">1. Learning Objectives (Bloom's Taxonomy):</label>
                <textarea id="plan-objectives" style="width: 100%; height: 60px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.84rem;" placeholder="1. Define cognitive dissonance&#10;2. Contrast Festinger & Carlsmith experiment with self-perception theory"></textarea>
              </div>
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">2. Hook / Introduction:</label>
                <textarea id="plan-intro" style="width: 100%; height: 50px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.84rem;" placeholder="Pose hypothetical scenario: Doing a boring task for $1 vs $20"></textarea>
              </div>
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">3. Didactic Explanation & Key Concepts:</label>
                <textarea id="plan-explanation" style="width: 100%; height: 80px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.84rem;" placeholder="Festinger (1957) theory, psychological discomfort, belief modification..."></textarea>
              </div>
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">4. Classroom Activity / Case Demonstration:</label>
                <input type="text" id="plan-activity" placeholder="Small group discussion evaluating real-life consumer dissonance" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
              </div>
              <div>
                <label style="font-size: 0.80rem; font-weight: 600;">5. References & Academic Readings:</label>
                <input type="text" id="plan-refs" value="Festinger, L. (1957). A theory of cognitive dissonance. Stanford University Press." style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button class="btn btn-outline btn-sm" onclick="document.getElementById('new-plan-modal').classList.add('hidden')">Cancel</button>
              <button class="btn btn-primary btn-sm" onclick="TeachingModule.saveLessonPlan()">Save Lesson Plan</button>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadLessonPlans();
    if (window.lucide) window.lucide.createIcons();
  },

  async loadLessonPlans() {
    try {
      const plans = await API.get('/api/teaching/lesson-plans');
      const container = document.getElementById('teaching-plans-container');
      if (!container) return;

      container.innerHTML = plans.map(p => `
        <div class="card" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
            <div>
              <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                <span class="badge" style="background: var(--lavender); color: var(--primary);">
                  ${p.target_level}
                </span>
                <span class="badge" style="background: var(--bg-app); border: 1px solid var(--border-color);">
                  ${p.duration_minutes} Minutes
                </span>
              </div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${p.topic_title}</h2>
            </div>
            <button class="btn btn-outline btn-sm" onclick="TeachingModule.exportPlanMarkdown(${p.id})">
              <i data-lucide="download"></i> Export Markdown / Print
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; font-size: 0.88rem; line-height: 1.6;">
            <div>
              <h4 style="font-weight: 700; color: var(--primary); margin-bottom: 4px;">1. Learning Objectives:</h4>
              <div style="white-space: pre-line; color: var(--text-secondary);">${p.learning_objectives}</div>
            </div>
            <div>
              <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">2. Classroom Hook / Introduction:</h4>
              <p style="color: var(--text-secondary);">${p.introduction}</p>
            </div>
          </div>

          <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px; font-size: 0.86rem; line-height: 1.6;">
            <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">3. Didactic Explanation & Key Concepts:</h4>
            <p style="color: var(--text-secondary); margin-bottom: 8px;">${p.explanation}</p>
            <div style="font-size: 0.80rem; color: var(--text-muted);"><strong>Core Constructs:</strong> ${p.key_concepts || 'Standard terminology'}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.84rem; margin-bottom: 14px;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); padding: 12px; color: #166534;">
              <strong>4. Classroom Exercise / Socratic Activity:</strong><br>
              ${p.classroom_activity}
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); padding: 12px; color: #1e40af;">
              <strong>5. Formative Assessment Questions:</strong><br>
              <div style="white-space: pre-line;">${p.assessment_questions || 'Discussion questions'}</div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 0.78rem; color: var(--text-muted);">
            <strong>Authoritative References:</strong> ${p.references_citations}
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load lesson plans:', err);
    }
  },

  openNewPlanModal() {
    document.getElementById('new-plan-modal')?.classList.remove('hidden');
  },

  async saveLessonPlan() {
    const payload = {
      topic_title: document.getElementById('plan-title').value,
      target_level: document.getElementById('plan-level').value,
      duration_minutes: parseInt(document.getElementById('plan-duration').value, 10),
      learning_objectives: document.getElementById('plan-objectives').value,
      introduction: document.getElementById('plan-intro').value,
      explanation: document.getElementById('plan-explanation').value,
      key_concepts: 'Core concepts defined in didactic text',
      examples: 'Illustrated classroom vignettes',
      classroom_activity: document.getElementById('plan-activity').value,
      assessment_questions: '1. Formative conceptual check\n2. Applied analysis question',
      references_citations: document.getElementById('plan-refs').value
    };

    if (!payload.topic_title) return showToast('Topic title is required', 'warning');

    try {
      await API.post('/api/teaching/lesson-plans', payload);
      document.getElementById('new-plan-modal').classList.add('hidden');
      showToast('Lesson plan created successfully!', 'success');
      this.loadLessonPlans();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async exportPlanMarkdown(planId) {
    try {
      const plan = await API.get(`/api/teaching/lesson-plans/${planId}`);
      const md = `# Psychology Lesson Plan: ${plan.topic_title}
**Target Level:** ${plan.target_level}  
**Duration:** ${plan.duration_minutes} Minutes  

## 1. Learning Objectives
${plan.learning_objectives}

## 2. Introduction & Anticipatory Set
${plan.introduction}

## 3. Didactic Explanation
${plan.explanation}

## 4. Classroom Activity
${plan.classroom_activity}

## 5. Assessment Questions
${plan.assessment_questions}

## 6. Authoritative References
${plan.references_citations}
`;
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plan.topic_title.replace(/[^a-zA-Z0-9]/g, '_')}_LessonPlan.md`;
      a.click();
      showToast('Lesson plan exported as Markdown file!', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  }
};

