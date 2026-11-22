// public/js/modules/pyqExam.js
// Previous Year Questions (PYQ) Hub, Statistical Trend Engine,
// Question Paper Predictor, Mock Simulator, and Diagnostic Study Planner.

const PyqExamModule = {
  activeExamId: 1,
  activeMockTest: null,
  activeMockResponses: {},
  mockTimerInterval: null,
  mockTimeRemaining: 0,

  async render(container, activeSubView = 'hub') {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-header-title">PYQ & Examination Preparation Centre</h1>
          <p class="view-header-subtitle">UGC NET & Psychology Entrance command centre: Multi-year trend analysis, Paper Predictor, and Mock Simulator.</p>
        </div>
        <div class="top-actions">
          <button class="btn btn-secondary btn-sm" onclick="PyqExamModule.openMockModal()">
            <i data-lucide="play-circle"></i> Create Mock Test
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('predictor')">
            <i data-lucide="sparkles"></i> Question Paper Predictor
          </button>
        </div>
      </div>

      <!-- NAVIGATION SUB-BAR -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px;">
        <button id="btn-pyq-sub-hub" class="btn btn-secondary btn-sm" onclick="PyqExamModule.switchSubView('hub')">
          <i data-lucide="trending-up"></i> Multi-Year PYQ Trends
        </button>
        <button id="btn-pyq-sub-bank" class="btn btn-outline btn-sm" onclick="PyqExamModule.switchSubView('bank')">
          <i data-lucide="list-checks"></i> Question Bank & PYQs
        </button>
        <button id="btn-pyq-sub-predict" class="btn btn-outline btn-sm" onclick="PyqExamModule.switchSubView('predict')">
          <i data-lucide="sparkles"></i> Paper Predictor
        </button>
        <button id="btn-pyq-sub-plan" class="btn btn-outline btn-sm" onclick="PyqExamModule.switchSubView('plan')">
          <i data-lucide="calendar"></i> Intelligent Study Planner
        </button>
        <button id="btn-pyq-sub-extract" class="btn btn-outline btn-sm" onclick="PyqExamModule.switchSubView('extract')">
          <i data-lucide="scan-text"></i> Question Extractor (OCR)
        </button>
      </div>

      <!-- SUB-VIEW 1: MULTI-YEAR TREND ANALYSIS -->
      <div id="pyq-subview-hub">
        
        <!-- TRANSPARENCY DISCLAIMER -->
        <div class="card" style="background: #fffbeb; border: 1px solid #fde68a; margin-bottom: 20px; padding: 12px 18px; font-size: 0.82rem; color: #92400e;">
          <strong>Historical Examination Analysis Protocol:</strong> Trend graphs display empirical occurrence frequencies across recorded past papers. In psychological psychometrics, past appearance frequency demonstrates curriculum importance, but does NOT constitute a guarantee of future exam appearance.
        </div>

        <!-- STATS & FREQUENCY CHARTS ROW -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          
          <!-- UNIT DISTRIBUTION -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 12px;"><i data-lucide="pie-chart"></i> Unit-Wise Question Distribution</h3>
            <div id="pyq-unit-distribution-bars" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="color: var(--text-muted); font-size: 0.84rem;">Calculating unit weights...</div>
            </div>
          </div>

          <!-- TOP FREQUENTLY TESTED CONCEPTS -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 12px;"><i data-lucide="repeat"></i> High-Frequency Concepts & Rotation</h3>
            <div id="pyq-concept-frequencies" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="color: var(--text-muted); font-size: 0.84rem;">Analyzing recurring concepts...</div>
            </div>
          </div>

        </div>

      </div>

      <!-- SUB-VIEW 2: QUESTION BANK -->
      <div id="pyq-subview-bank" class="hidden">
        <div class="card" style="margin-bottom: 18px; padding: 14px 18px; display: flex; gap: 14px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 240px;">
            <select id="pyq-bank-unit-filter" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app); color: var(--text-primary);" onchange="PyqExamModule.loadQuestionBank()">
              <option value="">All 10 Syllabus Units</option>
            </select>
          </div>
          <div>
            <select id="pyq-bank-diff-filter" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem; background: var(--bg-app); color: var(--text-primary);" onchange="PyqExamModule.loadQuestionBank()">
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Difficult">Difficult</option>
            </select>
          </div>
        </div>
        <div id="pyq-bank-list" style="display: flex; flex-direction: column; gap: 14px;"></div>
      </div>

      <!-- SUB-VIEW 3: QUESTION PAPER PREDICTOR -->
      <div id="pyq-subview-predict" class="hidden">
        <div class="card" style="margin-bottom: 20px; padding: 18px 24px; background: var(--lavender); border-color: var(--lavender-border);">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
            <div>
              <span class="badge" style="background: var(--primary); color: white; margin-bottom: 6px;">AI Prediction Engine</span>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-deep); margin-bottom: 4px;">
                Evidence-Informed Practice Paper Predictor
              </h2>
              <p style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.5;">
                Constructs predicted model papers by integrating multi-year PYQ frequencies, syllabus unit weightages, theorist prominence, and rotation patterns. Each item displays its historical rationale and confidence tier.
              </p>
            </div>
            <button class="btn btn-primary" onclick="PyqExamModule.loadPredictorPaper()">
              <i data-lucide="refresh-cw"></i> Regenerate Paper
            </button>
          </div>
        </div>
        <div id="pyq-predictor-results"></div>
      </div>

      <!-- SUB-VIEW 4: STUDY PLANNER -->
      <div id="pyq-subview-plan" class="hidden">
        <div class="card" style="max-width: 820px; margin: 0 auto;">
          <h3 class="card-title" style="margin-bottom: 12px;"><i data-lucide="calendar"></i> Intelligent UGC NET Study Planner Generator</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">Target Examination Date:</label>
              <input type="date" id="plan-target-date" value="2026-12-15" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
            <div>
              <label style="font-size: 0.80rem; font-weight: 600;">Daily Available Preparation (Hours):</label>
              <input type="number" id="plan-daily-hours" value="3.5" step="0.5" min="1" max="10" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.86rem;">
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="PyqExamModule.generatePlan()">Generate Tailored Schedule</button>
          <div id="plan-output-container" style="margin-top: 20px;"></div>
        </div>
      </div>

      <!-- SUB-VIEW 5: QUESTION EXTRACTOR (OCR / TEXT) -->
      <div id="pyq-subview-extract" class="hidden">
        <div class="card" style="max-width: 820px; margin: 0 auto;">
          <h3 class="card-title" style="margin-bottom: 8px;"><i data-lucide="scan-text"></i> Automatic Question Extractor</h3>
          <p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 14px;">Paste raw unformatted text from a PDF, scanned paper, or document. The engine automatically identifies question numbers, options (A/B/C/D), and answers:</p>
          <textarea id="pyq-extract-input" style="width: 100%; height: 160px; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: 'Times New Roman', Times, serif; font-size: 0.95rem; line-height: 1.5; margin-bottom: 12px;" placeholder="Paste raw question paper text here...&#10;e.g.&#10;1. Which theory of intelligence proposes 8 distinct independent faculties?&#10;(A) Spearman g factor&#10;(B) Gardner Multiple Intelligences&#10;(C) Sternberg Triarchic&#10;(D) Cattell Fluid-Crystallized&#10;Ans: B"></textarea>
          <button class="btn btn-primary btn-sm" onclick="PyqExamModule.extractQuestions()">Extract Questions into Question Bank</button>
          <div id="pyq-extract-results" style="margin-top: 20px;"></div>
        </div>
      </div>

      <!-- MOCK TEST SIMULATOR MODAL / INTERFACE -->
      <div id="mock-test-modal" class="modal-overlay hidden">
        <div class="modal-card" style="max-width: 900px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <div class="modal-title">
              <i data-lucide="check-circle-2"></i> <span id="mock-modal-title">Mock Examination Simulator</span>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <div id="mock-timer-pill" class="badge" style="background: #fee2e2; color: #991b1b; font-size: 0.84rem; padding: 4px 10px;">
                <i data-lucide="clock"></i> Time Left: <span id="mock-timer-display">45:00</span>
              </div>
              <button class="icon-btn" onclick="PyqExamModule.closeMockModal()"><i data-lucide="x"></i></button>
            </div>
          </div>
          <div class="modal-body" id="mock-test-body" style="flex: 1; overflow-y: auto; padding: 24px;">
            <!-- Questions injected -->
          </div>
          <div style="padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-app);">
            <span id="mock-progress-text" style="font-size: 0.82rem; color: var(--text-muted);">Question 1 of 25</span>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-outline btn-sm" onclick="PyqExamModule.closeMockModal()">Cancel Attempt</button>
              <button class="btn btn-primary btn-sm" id="btn-submit-mock" onclick="PyqExamModule.submitMock()">Submit Examination</button>
            </div>
          </div>
        </div>
      </div>

    `;

    await this.loadTrends();
    await this.loadSyllabusUnits();
    if (activeSubView === 'predict') {
      this.switchSubView('predict');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  switchSubView(sub) {
    const views = ['hub', 'bank', 'predict', 'plan', 'extract'];
    views.forEach(v => {
      document.getElementById(`pyq-subview-${v}`)?.classList.toggle('hidden', v !== sub);
      const btn = document.getElementById(`btn-pyq-sub-${v}`);
      if (btn) btn.className = v === sub ? 'btn btn-secondary btn-sm' : 'btn btn-outline btn-sm';
    });

    if (sub === 'bank') this.loadQuestionBank();
    if (sub === 'predict') this.loadPredictorPaper();
  },

  async loadTrends() {
    try {
      const data = await API.get(`/api/pyq/trends/${this.activeExamId}`);
      
      // Render Unit Distribution Bars
      const unitContainer = document.getElementById('pyq-unit-distribution-bars');
      if (unitContainer && data.unitStats) {
        unitContainer.innerHTML = data.unitStats.map(u => `
          <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.80rem; margin-bottom: 2px;">
              <span>Unit ${u.unit_number}: ${u.unit_title}</span>
              <strong style="color: var(--primary);">${u.historical_weightage}% Weight</strong>
            </div>
            <div style="height: 6px; background: var(--border-color); border-radius: 9999px; overflow: hidden;">
              <div style="width: ${Math.min(100, u.historical_weightage * 6)}%; height: 100%; background: var(--primary);"></div>
            </div>
          </div>
        `).join('');
      }

      // Render Recurring Topics
      const conceptContainer = document.getElementById('pyq-concept-frequencies');
      if (conceptContainer && data.topicFrequencies) {
        conceptContainer.innerHTML = data.topicFrequencies.slice(0, 6).map(tf => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-app); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div>
              <strong style="font-size: 0.84rem; display: block;">${tf.topic_name}</strong>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Unit ${tf.unit_number} • Years: ${tf.years_appeared}</span>
            </div>
            <span class="badge ${tf.trend_category === 'Frequently Tested' ? 'badge-high' : 'badge-moderate'}">
              ${tf.appearance_count} Times
            </span>
          </div>
        `).join('');
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load trends:', err);
    }
  },

  async loadSyllabusUnits() {
    try {
      const units = await API.get(`/api/pyq/syllabus/${this.activeExamId}`);
      const select = document.getElementById('pyq-bank-unit-filter');
      if (select) {
        select.innerHTML = '<option value="">All 10 Syllabus Units</option>' +
          units.map(u => `<option value="${u.id}">Unit ${u.unit_number}: ${u.unit_title}</option>`).join('');
      }
    } catch (err) {}
  },

  async loadQuestionBank() {
    const unitId = document.getElementById('pyq-bank-unit-filter')?.value;
    const diff = document.getElementById('pyq-bank-diff-filter')?.value;
    let url = `/api/pyq/questions?examination_id=${this.activeExamId}`;
    if (unitId) url += `&unit_id=${unitId}`;
    if (diff) url += `&difficulty=${diff}`;

    const container = document.getElementById('pyq-bank-list');
    if (!container) return;
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading questions...</div>`;

    try {
      const questions = await API.get(url);
      if (questions.length === 0) {
        container.innerHTML = `<div class="card" style="text-align: center; padding: 30px;">No questions found matching criteria.</div>`;
        return;
      }

      container.innerHTML = questions.map((q, idx) => `
        <div class="card" style="padding: 18px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; gap: 8px;">
              <span class="badge" style="background: var(--lavender); color: var(--primary);">Q${q.question_number || idx + 1}</span>
              <span class="badge" style="background: var(--bg-app); border: 1px solid var(--border-color);">${q.difficulty}</span>
              ${q.topic_tag ? `<span class="badge" style="background: #eff6ff; color: #1e40af;">${q.topic_tag}</span>` : ''}
            </div>
            <button class="btn btn-outline btn-sm" onclick="this.nextElementSibling.classList.toggle('hidden');">
              Toggle Explanation
            </button>
            <div class="hidden"></div>
          </div>

          <p style="font-size: 0.94rem; font-weight: 500; margin-bottom: 12px; color: var(--text-primary); line-height: 1.5;">
            ${q.question_text}
          </p>

          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
            ${(q.options_json || []).map(opt => `
              <div style="padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.86rem; background: ${opt.label === q.correct_answer ? '#ecfdf5' : 'var(--bg-app)'}; border-color: ${opt.label === q.correct_answer ? '#a7f3d0' : 'var(--border-color)'};">
                <strong>(${opt.label})</strong> ${opt.text}
                ${opt.label === q.correct_answer ? '<span style="color: #047857; font-weight: 700; margin-left: 8px;">✓ Official Answer</span>' : ''}
              </div>
            `).join('')}
          </div>

          <div style="background: var(--bg-app); border-left: 3px solid var(--primary); padding: 10px 14px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
            <strong>Psychological Explanation:</strong> ${q.explanation || 'Verified examination answer key rationale.'}
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Failed to load bank:', err);
    }
  },

  async loadPredictorPaper() {
    const container = document.getElementById('pyq-predictor-results');
    if (!container) return;
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i data-lucide="loader" class="spinner"></i> Generating predicted practice paper...</div>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const data = await API.get(`/api/pyq/predictor/${this.activeExamId}?count=10`);
      
      container.innerHTML = `
        <div class="card" style="margin-bottom: 20px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong>Prediction Confidence Spectrum:</strong>
            <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 8px;">
              ${data.confidenceBreakdown.highRelevanceCount} High Historical Relevance • 
              ${data.confidenceBreakdown.moderateRelevanceCount} Moderate • 
              ${data.confidenceBreakdown.exploratoryCount} Exploratory
            </span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.print()">
            <i data-lucide="printer"></i> Print / Save PDF
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${data.questions.map((q, idx) => `
            <div class="card" style="padding: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="badge" style="background: var(--primary); color: white;">Item ${idx + 1}</span>
                  <span class="badge ${q.predictionCategory === 'High historical relevance' ? 'badge-high' : q.predictionCategory === 'Moderate historical relevance' ? 'badge-moderate' : 'badge-exploratory'}">
                    ${q.predictionCategory}
                  </span>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">${q.unitTitle}</span>
                </div>
                <span style="font-size: 0.76rem; color: var(--text-muted);">
                  Appeared in years: ${q.relatedYears ? q.relatedYears.join(', ') : 'Recent'}
                </span>
              </div>

              <p style="font-size: 0.94rem; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; line-height: 1.5;">
                ${q.questionText}
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                ${(q.options || []).map(opt => `
                  <div style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.84rem; background: var(--bg-app);">
                    <strong>(${opt.label})</strong> ${opt.text}
                  </div>
                `).join('')}
              </div>

              <div style="background: var(--lavender); border: 1px solid var(--lavender-border); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.80rem; color: var(--primary-deep); margin-bottom: 8px;">
                <strong>Prediction Rationale:</strong> ${q.predictionRationale}
              </div>

              <details style="font-size: 0.82rem; cursor: pointer; color: var(--text-muted);">
                <summary style="font-weight: 600; color: var(--primary);">View Correct Answer & Theoretical Explanation</summary>
                <div style="margin-top: 8px; padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-sm); color: #065f46;">
                  <strong>Correct Answer: (${q.correctAnswer})</strong><br>
                  ${q.explanation}
                </div>
              </details>
            </div>
          `).join('')}
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      container.innerHTML = `<span style="color: var(--danger);">Failed to generate predictor paper: ${err.message}</span>`;
    }
  },

  openMockModal() {
    const modal = document.getElementById('mock-test-modal');
    modal?.classList.remove('hidden');
    this.startMockTest();
  },

  closeMockModal() {
    clearInterval(this.mockTimerInterval);
    const modal = document.getElementById('mock-test-modal');
    modal?.classList.add('hidden');
  },

  async startMockTest(questionCount = 10) {
    const bodyContainer = document.getElementById('mock-test-body');
    bodyContainer.innerHTML = `<div style="text-align: center; padding: 60px;"><i data-lucide="loader" class="spinner"></i> Preparing mock examination questions...</div>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const mock = await API.post('/api/pyq/mock/create', {
        title: 'UGC NET Psychology Quick Practice Simulation',
        examinationId: this.activeExamId,
        totalQuestions: questionCount,
        timeLimitMinutes: 20
      });

      this.activeMockTest = mock;
      this.activeMockResponses = {};

      // Start Timer (20 mins)
      this.mockTimeRemaining = mock.timeLimitMinutes * 60;
      clearInterval(this.mockTimerInterval);
      this.mockTimerInterval = setInterval(() => {
        this.mockTimeRemaining--;
        const mins = Math.floor(this.mockTimeRemaining / 60);
        const secs = this.mockTimeRemaining % 60;
        const display = document.getElementById('mock-timer-display');
        if (display) display.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (this.mockTimeRemaining <= 0) {
          clearInterval(this.mockTimerInterval);
          this.submitMock();
        }
      }, 1000);

      bodyContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${mock.questions.map((q, idx) => `
            <div class="card" style="padding: 18px 20px;">
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--primary); margin-bottom: 6px;">
                QUESTION ${idx + 1} OF ${mock.questions.length} • ${q.difficulty || 'Moderate'}
              </div>
              <p style="font-size: 0.94rem; font-weight: 600; color: var(--text-primary); margin-bottom: 14px; line-height: 1.5;">
                ${q.question_text || q.questionText}
              </p>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${(q.options || q.options_json || []).map(opt => `
                  <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.88rem; background: var(--bg-app); transition: var(--transition);" class="mock-opt-label">
                    <input type="radio" name="mock_q_${q.id}" value="${opt.label}" onchange="PyqExamModule.recordResponse(${q.id}, '${opt.label}', '${q.correct_answer || q.correctAnswer}', '${q.topic_tag || q.topicTag || ''}', ${q.unit_id || 1})">
                    <strong>(${opt.label})</strong> <span>${opt.text}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      bodyContainer.innerHTML = `<span style="color: var(--danger);">Failed to start mock test: ${err.message}</span>`;
    }
  },

  recordResponse(qId, selected, correct, topic, unitId) {
    this.activeMockResponses[qId] = {
      questionId: qId,
      selectedAnswer: selected,
      correctAnswer: correct,
      topicTag: topic,
      unitId: unitId
    };
  },

  async submitMock() {
    clearInterval(this.mockTimerInterval);
    const bodyContainer = document.getElementById('mock-test-body');
    const submitBtn = document.getElementById('btn-submit-mock');
    if (submitBtn) submitBtn.disabled = true;

    const responsesArray = Object.values(this.activeMockResponses);
    
    try {
      const evalResult = await API.post('/api/pyq/mock/submit', {
        mockTestId: this.activeMockTest?.mockTestId || 1,
        responses: responsesArray,
        timeTakenSeconds: (this.activeMockTest?.timeLimitMinutes * 60) - this.mockTimeRemaining
      });

      bodyContainer.innerHTML = `
        <div style="text-align: center; padding: 20px 10px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; color: #047857; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-size: 2rem;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 6px;">Mock Test Evaluation Complete</h2>
          <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 24px;">Diagnostic performance metrics computed across attempted syllabus items.</p>

          <div class="grid-cards" style="margin-bottom: 24px;">
            <div class="card stat-card">
              <div>
                <div class="stat-value" style="color: var(--primary);">${evalResult.score} / ${evalResult.maxScore}</div>
                <div class="stat-label">Final Score (2 marks/Q)</div>
              </div>
            </div>
            <div class="card stat-card">
              <div>
                <div class="stat-value" style="color: #047857;">${evalResult.accuracy}%</div>
                <div class="stat-label">Response Accuracy</div>
              </div>
            </div>
            <div class="card stat-card">
              <div>
                <div class="stat-value">${evalResult.correctCount} / ${evalResult.totalAttempted}</div>
                <div class="stat-label">Correct Answers</div>
              </div>
            </div>
          </div>

          <div class="card" style="text-align: left; background: var(--bg-app); padding: 18px 20px; margin-bottom: 20px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
              <i data-lucide="activity"></i> Diagnostic Weak-Area Identification:
            </h4>
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
              ${evalResult.diagnosticRecommendation}
            </p>
          </div>

          <button class="btn btn-primary" onclick="PyqExamModule.closeMockModal()">
            Done & Return to Exam Hub
          </button>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      bodyContainer.innerHTML = `<span style="color: var(--danger);">Failed to evaluate mock: ${err.message}</span>`;
    }
  },

  async generatePlan() {
    const targetDate = document.getElementById('plan-target-date').value;
    const dailyHours = parseFloat(document.getElementById('plan-daily-hours').value) || 3.0;
    const out = document.getElementById('plan-output-container');

    try {
      const plan = await API.post('/api/pyq/study-plan', {
        examinationId: this.activeExamId,
        targetDate,
        dailyHours
      });

      out.innerHTML = `
        <div class="card" style="background: var(--lavender); border-color: var(--lavender-border); padding: 14px 18px; margin-bottom: 18px;">
          <h4 style="font-weight: 700; color: var(--primary-deep); margin-bottom: 4px;">Tailored Study Plan Generated (${plan.totalWeeks} Weeks • ${plan.totalStudyHours} Total Hours)</h4>
          <span style="font-size: 0.80rem; color: var(--text-primary);">Syllabus rotation scheduled with revision periods and end-of-week mock evaluations.</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${plan.schedule.map(w => `
            <div class="card" style="padding: 14px 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.90rem; color: var(--primary);">Week ${w.weekNumber}: ${w.focus}</strong>
                <span class="badge" style="background: var(--bg-app);">${w.allocatedDailyHours} hrs/day</span>
              </div>
              <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 8px;">${w.goal}</p>
              <ul style="margin-left: 20px; font-size: 0.78rem; color: var(--text-muted);">
                ${w.keyMilestones.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<span style="color: var(--danger);">Error generating study plan: ${err.message}</span>`;
    }
  },

  async extractQuestions() {
    const text = document.getElementById('pyq-extract-input').value;
    const out = document.getElementById('pyq-extract-results');
    if (!text.trim()) return showToast('Please paste question paper text first.', 'warning');

    try {
      const res = await API.post('/api/pyq/extract-from-text', { text });
      out.innerHTML = `
        <div class="card" style="background: var(--lavender); border-color: var(--lavender-border); padding: 12px 16px; margin-bottom: 14px;">
          <strong>Extracted ${res.count} Structured Questions:</strong> Review and verify below.
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${res.questions.map(q => `
            <div class="card" style="padding: 14px 16px;">
              <strong>Q${q.questionNumber}:</strong> ${q.questionText}
              <div style="margin-top: 8px; font-size: 0.82rem; color: var(--text-secondary);">
                ${q.options.map(o => `<div><strong>(${o.label})</strong> ${o.text}</div>`).join('')}
              </div>
              <div style="margin-top: 6px; font-size: 0.78rem; color: #047857;"><strong>Detected Answer:</strong> ${q.correctAnswer}</div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      out.innerHTML = `<span style="color: var(--danger);">Error extracting questions: ${err.message}</span>`;
    }
  }
};

