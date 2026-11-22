// test/verify.js
// Automated verification suite for Personal Psychology Knowledge & Intelligence Platform
const assert = require('node:assert');
const { db } = require('../server/db');
const { seedDatabase } = require('../server/seedData');
const { processUploadedDocument } = require('../server/documentProcessor');
const { answerQuestionGrounded } = require('../server/ragEngine');
const {
  analyzeExaminationTrends,
  generatePredictedPracticePaper,
  createMockTest,
  submitMockTestAttempt,
  generateStudyPlan
} = require('../server/pyqEngine');
const {
  calculateDescriptiveStats,
  independentSamplesTTest,
  pearsonCorrelation,
  cronbachAlpha,
  generateCitations
} = require('../server/researchStats');
const { generateAssistantResponse } = require('../server/aiService');
const fs = require('node:fs');
const path = require('node:path');

async function runAllTests() {
  console.log('====================================================');
  console.log('STARTING PSYCHOLOGY PLATFORM COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // 1. DATABASE INTEGRITY
  test('1. Database Tables & Seeded Resources Verification', () => {
    seedDatabase();
    const resCount = db.prepare('SELECT COUNT(*) as c FROM resources').get().c;
    const catCount = db.prepare('SELECT COUNT(*) as c FROM resource_categories').get().c;
    const artCount = db.prepare('SELECT COUNT(*) as c FROM knowledge_articles').get().c;
    const asmtCount = db.prepare('SELECT COUNT(*) as c FROM assessment_catalogue').get().c;
    const qCount = db.prepare('SELECT COUNT(*) as c FROM questions').get().c;

    assert.ok(resCount >= 5, `Expected >= 5 resources, got ${resCount}`);
    assert.strictEqual(catCount, 8, `Expected 8 resource categories, got ${catCount}`);
    assert.ok(artCount >= 3, `Expected >= 3 knowledge articles, got ${artCount}`);
    assert.ok(asmtCount >= 4, `Expected >= 4 assessment instruments, got ${asmtCount}`);
    assert.ok(qCount >= 5, `Expected >= 5 PYQs, got ${qCount}`);
  });

  // 2. KNOWLEDGE BASE 17 SECTIONS
  test('2. Knowledge Base Structured 17-Section Schema', () => {
    const art = db.prepare("SELECT * FROM knowledge_articles WHERE topic_id = 'cognitive-memory-systems'").get();
    assert.ok(art, 'Article should exist');
    assert.ok(art.definition.length > 20, 'Definition must be present');
    assert.ok(art.historical_background.length > 20, 'Historical background must be present');
    assert.ok(art.key_theorists.includes('Baddeley'), 'Key theorists must include Baddeley');
    assert.ok(art.major_theories.length > 20, 'Major theories must be present');
    assert.ok(art.clinical_relevance.length > 20, 'Clinical relevance must be present');
    assert.ok(art.references_citations.length > 20, 'References must be present');
  });

  // 3. STATISTICAL CALCULATIONS
  test('3. Descriptive Statistics Engine', () => {
    const sample = [10, 20, 30, 40, 50];
    const stats = calculateDescriptiveStats(sample);
    assert.strictEqual(stats.sampleSize, 5);
    assert.strictEqual(stats.mean, 30);
    assert.strictEqual(stats.median, 30);
    assert.strictEqual(stats.variance, 250);
  });

  test('4. Independent Samples t-test Engine', () => {
    const g1 = [10, 12, 14, 15, 13];
    const g2 = [22, 24, 25, 26, 23];
    const res = independentSamplesTTest(g1, g2);
    assert.strictEqual(res.degreesOfFreedom, 8);
    assert.ok(res.tStatistic < -5, 't-statistic should be negative and significant');
    assert.ok(res.pValue < 0.05, 'p-value should be significant');
    assert.ok(res.apaFormat.includes('t(8)'), 'APA format should match');
  });

  test('5. Pearson Correlation & Cronbach Alpha', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const corr = pearsonCorrelation(x, y);
    assert.strictEqual(corr.r, 1);
    assert.strictEqual(corr.rSquared, 1);

    const survey = [
      [4, 4, 4],
      [3, 3, 3],
      [5, 5, 5],
      [2, 2, 2]
    ];
    const alpha = cronbachAlpha(survey);
    assert.strictEqual(alpha.alpha, 1);
  });

  // 6. CITATION GENERATOR
  test('6. Multi-Format Academic Citation Generator', () => {
    const meta = {
      authors: 'Sternberg, R. J., & Sternberg, K.',
      year: 2020,
      title: 'Cognitive Psychology',
      publisher: 'Cengage Learning',
      doi: '10.1016/j.cog.2020.01'
    };
    const c = generateCitations(meta);
    assert.ok(c.apa.includes('Sternberg'), 'APA citation must contain author');
    assert.ok(c.mla.includes('"Cognitive Psychology."'), 'MLA must quote title');
    assert.ok(c.bibtex.includes('@article{sternberg2020'), 'BibTeX key must be formatted');
    assert.ok(c.ris.includes('TY  - JOUR'), 'RIS must match format');
  });

  // 7. DOCUMENT INGESTION & OCR FALLBACK
  test('7. Document Ingestion, Page Retention & Analysis', () => {
    const testDocPath = path.join(__dirname, 'test_sample.txt');
    fs.writeFileSync(testDocPath, `
Cognitive Psychology and Executive Functions.
Page 1: Attention and working memory mechanisms coordinate goal-directed action.
The central executive directs resources between the phonological loop and visuospatial sketchpad.

Page 2: Standard Error of Measurement and Psychometric Evaluation.
Reliability of cognitive batteries must be calculated using internal consistency metrics.
Reference: Baddeley, A. (2000). The episodic buffer. Trends in Cognitive Sciences, 4(11), 417-423.
    `);

    const result = processUploadedDocument({
      path: testDocPath,
      originalName: 'Cognitive_Executive_Study.txt',
      mimeType: 'text/plain'
    });

    assert.ok(result.documentId > 0, 'Document must be assigned an ID');
    assert.ok(result.totalPages >= 1, 'Pages must be extracted');
    assert.ok(result.keyConcepts.length > 0, 'Key concepts must be generated');
    assert.ok(result.summary.length > 20, 'Summary must be generated');
    assert.ok(result.importantQuestions.length >= 3, 'Important questions generated');

    // 8. RAG GROUNDED RETRIEVAL WITH PAGE CITATION
    const ragAnswer = answerQuestionGrounded('What does the central executive direct?', [result.documentId]);
    assert.ok(ragAnswer.citations.length > 0, 'RAG must return citations');
    assert.strictEqual(ragAnswer.citations[0].documentName, 'Cognitive_Executive_Study.txt');
    assert.ok(ragAnswer.citations[0].pageNumber >= 1, 'Page number must be preserved');
    assert.ok(ragAnswer.answer.includes('central executive') || ragAnswer.answer.includes('phonological'), 'Answer must be grounded');

    // Clean up test file
    fs.unlinkSync(testDocPath);
  });

  // 9. PYQ PREDICTOR & MOCK TEST SIMULATOR
  test('9. Examination Trend Engine & Question Paper Predictor', () => {
    const trends = analyzeExaminationTrends(1);
    assert.ok(trends.unitStats.length === 10, 'All 10 syllabus units must be analyzed');
    assert.ok(trends.topicFrequencies.length > 0, 'Topic frequencies must be analyzed');

    const predicted = generatePredictedPracticePaper(1, 5);
    assert.strictEqual(predicted.totalQuestions, 5);
    assert.ok(predicted.questions[0].predictionCategory, 'Confidence category must be assigned');
    assert.ok(predicted.questions[0].predictionRationale, 'Rationale must be articulated');
    assert.ok(predicted.transparencyNotice.includes('Transparency Statement'), 'Disclaimer must be present');
  });

  test('10. Mock Test Simulator & Diagnostic Performance Attempt', () => {
    const mock = createMockTest({
      title: 'Practice Verification Simulation',
      examinationId: 1,
      totalQuestions: 4,
      timeLimitMinutes: 10
    });
    assert.strictEqual(mock.totalQuestions, 4);

    const responses = [
      { questionId: mock.questions[0].id, selectedAnswer: 'C', correctAnswer: 'C', topicTag: 'Working Memory', unitId: 5 },
      { questionId: mock.questions[1].id, selectedAnswer: 'A', correctAnswer: 'A', topicTag: 'Statistics', unitId: 2 },
      { questionId: mock.questions[2].id, selectedAnswer: 'B', correctAnswer: 'A', topicTag: 'Psychometrics', unitId: 3 }
    ];

    const evaluation = submitMockTestAttempt({
      mockTestId: mock.mockTestId,
      responses,
      timeTakenSeconds: 300
    });

    assert.strictEqual(evaluation.correctCount, 2);
    assert.strictEqual(evaluation.incorrectCount, 1);
    assert.strictEqual(evaluation.score, 4);
    assert.ok(evaluation.diagnosticRecommendation.includes('Psychometrics'), 'Weak area must be identified');
  });

  // 11. STUDY PLANNER
  test('11. Intelligent Study Planner Engine', () => {
    const plan = generateStudyPlan({
      examinationId: 1,
      targetDate: '2026-12-15',
      dailyHours: 3.0,
      weakTopics: ['Psychometrics']
    });
    assert.ok(plan.totalWeeks >= 2);
    assert.ok(plan.schedule.length === plan.totalWeeks);
    assert.ok(plan.schedule[0].keyMilestones.length > 0);
  });

  // 12. AI ASSISTANT MULTI-MODE RESPONSES
  await asyncTest('12. AI Assistant Multi-Mode Inquiries & Priority Citations', async () => {
    const modes = ['Knowledge', 'Clinical', 'Assessment', 'Research', 'PYQ', 'Teaching'];
    for (const m of modes) {
      const res = await generateAssistantResponse('memory and cognitive assessment', m);
      assert.ok(res.response.length > 30, `Response for mode ${m} must be non-empty`);
      assert.ok(res.evidenceStatus, `Evidence status must be declared for ${m}`);
    }
  });

  console.log('\n====================================================');
  console.log(`TEST SUITE COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================');
}

runAllTests();
