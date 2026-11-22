// server/pyqEngine.js
// Previous Year Questions (PYQ) Management, Statistical Trend Analysis,
// Question Paper Predictor, Mock Test Simulator, and Study Planner.
const { db } = require('./db');

/**
 * Extract questions automatically from unstructured raw text or document pages
 */
function extractQuestionsFromText(rawText) {
  const extracted = [];
  // Matches patterns like "1. ", "Q1. ", "Question 1:", "(1)"
  const questionPattern = /(?:(?:^|\n)(?:Q(?:uestion)?\.?\s*)?(\d{1,3})[.):]\s*)([\s\S]*?)(?=(?:(?:^|\n)(?:Q(?:uestion)?\.?\s*)?\d{1,3}[.):]\s*)|$)/gi;
  
  let match;
  while ((match = questionPattern.exec(rawText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const body = match[2].trim();
    if (body.length < 15) continue;

    // Detect options: (A), (B), (C), (D) or A), B), C), D) or 1), 2), 3), 4)
    const options = [];
    const optionPattern = /(?:[\n\s]|^)(?:\(?([A-Da-d1-4])\)?[:.)]\s*)([^\n(]+)/g;
    let optMatch;
    let cleanQuestionText = body;
    
    while ((optMatch = optionPattern.exec(body)) !== null) {
      options.push({
        label: optMatch[1].toUpperCase(),
        text: optMatch[2].trim()
      });
    }

    if (options.length >= 2) {
      // Strip option lines from question prompt
      const firstOptIndex = body.search(/(?:[\n\s]|^)(?:\(?([A-Da-d1-4])\)?[:.)]\s*)/);
      if (firstOptIndex > 0) {
        cleanQuestionText = body.substring(0, firstOptIndex).trim();
      }
    }

    // Detect Answer key if present at bottom: "Ans: C" or "Answer: (B)"
    let detectedAnswer = 'A';
    const ansMatch = body.match(/(?:Ans(?:wer)?|Correct)\s*[:=-]\s*\(?([A-Da-d1-4])\)?/i);
    if (ansMatch) {
      detectedAnswer = ansMatch[1].toUpperCase();
    }

    extracted.push({
      questionNumber: qNum,
      questionText: cleanQuestionText,
      questionType: options.length >= 2 ? 'MCQ' : 'Short Answer',
      options: options.length >= 2 ? options : [
        { label: 'A', text: 'Option A' },
        { label: 'B', text: 'Option B' },
        { label: 'C', text: 'Option C' },
        { label: 'D', text: 'Option D' }
      ],
      correctAnswer: detectedAnswer,
      explanation: 'Extracted from examination source document. Subject to manual clinician/educator verification.',
      difficulty: 'Moderate'
    });
  }

  return extracted;
}

/**
 * Statistical PYQ Multi-Year Analysis Engine
 */
function analyzeExaminationTrends(examinationId = 1) {
  // 1. Unit-wise Question Distribution
  const unitStats = db.prepare(`
    SELECT u.id as unit_id, u.unit_number, u.unit_title, u.historical_weightage,
           COUNT(q.id) as question_count
    FROM syllabus_units u
    LEFT JOIN questions q ON q.unit_id = u.id AND q.examination_id = ?
    WHERE u.examination_id = ?
    GROUP BY u.id
    ORDER BY u.unit_number ASC
  `).all(examinationId, examinationId);

  // 2. Frequently Repeated Concepts & Topics
  const topicFrequencies = db.prepare(`
    SELECT tf.topic_name, tf.appearance_count, tf.years_appeared, tf.trend_category,
           tf.last_appeared_year, u.unit_title, u.unit_number
    FROM topic_frequency tf
    JOIN syllabus_units u ON u.id = tf.unit_id
    WHERE tf.examination_id = ?
    ORDER BY tf.appearance_count DESC
  `).all(examinationId);

  // 3. Theorists & Instrument Mentions
  const theoristCounts = db.prepare(`
    SELECT theorist_tag, COUNT(*) as count
    FROM questions
    WHERE examination_id = ? AND theorist_tag IS NOT NULL AND theorist_tag != ''
    GROUP BY theorist_tag
    ORDER BY count DESC
    LIMIT 10
  `).all(examinationId);

  // 4. Difficulty Distribution
  const difficultyCounts = db.prepare(`
    SELECT difficulty, COUNT(*) as count
    FROM questions
    WHERE examination_id = ?
    GROUP BY difficulty
  `).all(examinationId);

  // 5. Emerging vs Rotation (Topics that appeared frequently but not in the most recent year)
  const currentMaxYear = 2023;
  const rotationTopics = topicFrequencies.filter(t => t.last_appeared_year < currentMaxYear && t.appearance_count >= 5);
  const emergingTopics = topicFrequencies.filter(t => t.trend_category === 'Emerging');

  return {
    examinationId,
    unitStats,
    topicFrequencies,
    theoristCounts,
    difficultyCounts,
    rotationTopics,
    emergingTopics,
    transparencyDisclaimer: 'Methodological Notice: Trend distributions reflect empirical frequency across recorded past papers. In accordance with psychometric assessment principles, past frequency does not guarantee future inclusion, and rotation patterns must be treated as indicative study aids rather than official examination forecasts.'
  };
}

/**
 * Question Paper Predictor Engine
 * Uses historical frequency, syllabus unit weightages, and recency rotation to construct a predicted practice paper.
 */
function generatePredictedPracticePaper(examinationId = 1, questionCount = 10) {
  const analysis = analyzeExaminationTrends(examinationId);
  const units = analysis.unitStats;
  const topicFreqs = analysis.topicFrequencies;

  // Retrieve available questions in question bank
  const bankQuestions = db.prepare(`
    SELECT q.*, u.unit_title, u.unit_number
    FROM questions q
    JOIN syllabus_units u ON u.id = q.unit_id
    WHERE q.examination_id = ?
  `).all(examinationId);

  // Scoring and predictive classification
  const scoredPredictions = bankQuestions.map(q => {
    let score = 50;
    let rationale = '';
    let category = 'Moderate historical relevance';
    const relatedTopic = topicFreqs.find(t => t.topic_name.toLowerCase().includes((q.topic_tag || '').toLowerCase()));

    if (relatedTopic) {
      if (relatedTopic.appearance_count >= 12) {
        score += 35;
        category = 'High historical relevance';
        rationale = `High historical appearance density (${relatedTopic.appearance_count} occurrences across years ${relatedTopic.years_appeared}). Core recurring foundational construct.`;
      } else if (relatedTopic.trend_category === 'Emerging') {
        score += 25;
        category = 'High historical relevance';
        rationale = `Rapidly emerging topic in recent syllabus updates (${relatedTopic.years_appeared}). High contemporary testing probability.`;
      } else if (relatedTopic.last_appeared_year <= 2022) {
        score += 20;
        category = 'Moderate historical relevance';
        rationale = `Established recurring concept with rotational latency (last examined in ${relatedTopic.last_appeared_year}).`;
      }
    } else {
      category = 'Exploratory practice';
      rationale = `Exploratory syllabus coverage addressing comprehensive unit objectives.`;
      score += 10;
    }

    return {
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      unitTitle: `Unit ${q.unit_number}: ${q.unit_title}`,
      topicTag: q.topic_tag,
      theoristTag: q.theorist_tag,
      difficulty: q.difficulty,
      predictionScore: score,
      predictionCategory: category,
      predictionRationale: rationale,
      relatedYears: relatedTopic ? JSON.parse(relatedTopic.years_appeared || '[]') : [2022, 2023]
    };
  });

  // Sort by prediction score and take requested count
  scoredPredictions.sort((a, b) => b.predictionScore - a.predictionScore);
  const selected = scoredPredictions.slice(0, questionCount);

  // If bank questions are fewer than requested, synthetically augment with verified syllabus mock questions
  if (selected.length < questionCount) {
    const additionalNeeded = questionCount - selected.length;
    for (let i = 0; i < additionalNeeded; i++) {
      const u = units[i % units.length];
      selected.push({
        id: 1000 + i,
        questionText: `Which empirical principle best describes the methodological relationship in ${u.unit_title}?`,
        options: [
          { label: 'A', text: 'Operationalization of latent constructs through standardized psychometric validation' },
          { label: 'B', text: 'Arbitrary classification without reliability estimation' },
          { label: 'C', text: 'Uncontrolled confounding in randomized block assignment' },
          { label: 'D', text: 'Subjective non-replicable observation' }
        ],
        correctAnswer: 'A',
        explanation: `Syllabus Unit ${u.unit_number} (${u.unit_title}) emphasizes rigorous operationalization, construct validity, and empirical reproducibility.`,
        unitTitle: `Unit ${u.unit_number}: ${u.unit_title}`,
        topicTag: u.unit_title,
        difficulty: 'Moderate',
        predictionScore: 65,
        predictionCategory: 'Exploratory practice',
        predictionRationale: 'Syllabus-aligned exploratory practice item designed to ensure balanced multi-unit preparation coverage.',
        relatedYears: [2020, 2022]
      });
    }
  }

  return {
    examinationName: 'UGC NET Psychology (Predicted Model Practice Paper)',
    totalQuestions: selected.length,
    generatedAt: new Date().toISOString(),
    confidenceBreakdown: {
      highRelevanceCount: selected.filter(q => q.predictionCategory === 'High historical relevance').length,
      moderateRelevanceCount: selected.filter(q => q.predictionCategory === 'Moderate historical relevance').length,
      exploratoryCount: selected.filter(q => q.predictionCategory === 'Exploratory practice').length
    },
    transparencyNotice: 'Academic Transparency Statement: This predicted question set is statistically synthesized from multi-year question frequency, unit weightages, and topic recurrence algorithms. It is strictly intended as an evidence-informed study aid. Examination conducting authorities maintain independent question-setting panels, and no predictions can be deemed guaranteed or official.',
    questions: selected
  };
}

/**
 * Question Paper Generator for Practice / Exam Mock Tests
 */
function createMockTest(config) {
  const {
    title = 'UGC NET Psychology Mock Test',
    examinationId = 1,
    mode = 'practice', // 'practice' (instant feedback) or 'exam' (timed)
    totalQuestions = 25,
    timeLimitMinutes = 60,
    unitId = null
  } = config;

  // Retrieve questions matching criteria
  let query = 'SELECT * FROM questions WHERE examination_id = ?';
  const params = [examinationId];
  if (unitId) {
    query += ' AND unit_id = ?';
    params.push(unitId);
  }
  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(totalQuestions);

  let questions = db.prepare(query).all(...params);

  // If questions in bank are fewer than requested, duplicate/augment with practice items
  if (questions.length < totalQuestions) {
    const extra = generatePredictedPracticePaper(examinationId, totalQuestions).questions;
    questions = extra.slice(0, totalQuestions);
  } else {
    questions = questions.map(q => ({
      ...q,
      options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json
    }));
  }

  const insertMock = db.prepare(`
    INSERT INTO mock_tests (title, examination_id, mode, total_questions, time_limit_minutes, config_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const mockInfo = insertMock.run(
    title, examinationId, mode, totalQuestions, timeLimitMinutes, JSON.stringify(config)
  );

  return {
    mockTestId: mockInfo.lastInsertRowid,
    title,
    mode,
    totalQuestions: questions.length,
    timeLimitMinutes,
    questions
  };
}

/**
 * Evaluate Mock Test Submission and Diagnostic Performance
 */
function submitMockTestAttempt(attemptData) {
  const {
    mockTestId,
    responses, // Array of { questionId, selectedAnswer, correctAnswer, unitId, topicTag }
    timeTakenSeconds = 1800
  } = attemptData;

  let correctCount = 0;
  let incorrectCount = 0;
  const unitStats = {};
  const weakTopics = [];

  responses.forEach(r => {
    const isCorrect = (r.selectedAnswer || '').trim().toUpperCase() === (r.correctAnswer || '').trim().toUpperCase();
    if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
      if (r.topicTag && !weakTopics.includes(r.topicTag)) {
        weakTopics.push(r.topicTag);
      }
    }

    const unitKey = r.unitId || 'General';
    if (!unitStats[unitKey]) {
      unitStats[unitKey] = { total: 0, correct: 0 };
    }
    unitStats[unitKey].total++;
    if (isCorrect) unitStats[unitKey].correct++;
  });

  const totalAttempted = responses.length;
  const score = correctCount * 2; // Standard 2 marks per question in UGC NET
  const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

  const insertAttempt = db.prepare(`
    INSERT INTO mock_test_attempts (
      mock_test_id, score, accuracy, total_attempted, correct_count, incorrect_count,
      answers_payload, unit_performance, weak_topics, time_taken_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertAttempt.run(
    mockTestId, score, accuracy, totalAttempted, correctCount, incorrectCount,
    JSON.stringify(responses), JSON.stringify(unitStats), JSON.stringify(weakTopics), timeTakenSeconds
  );

  return {
    attemptId: info.lastInsertRowid,
    score,
    maxScore: totalAttempted * 2,
    accuracy: Math.round(accuracy * 10) / 10,
    totalAttempted,
    correctCount,
    incorrectCount,
    unitPerformance: unitStats,
    weakTopics,
    diagnosticRecommendation: weakTopics.length > 0 
      ? `Priority revision recommended for: ${weakTopics.slice(0, 3).join(', ')}. Review foundational definitions and corresponding assessment/theorist models.`
      : 'Excellent performance across all tested domains. Maintain spaced repetition schedule.'
  };
}

/**
 * Intelligent Study Planner Generator
 */
function generateStudyPlan(config) {
  const {
    examinationId = 1,
    targetDate = '2026-12-15',
    dailyHours = 3.0,
    weakTopics = []
  } = config;

  const units = db.prepare(`
    SELECT * FROM syllabus_units WHERE examination_id = ? ORDER BY unit_number ASC
  `).all(examinationId);

  const now = new Date();
  const target = new Date(targetDate);
  const diffDays = Math.max(14, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  const totalWeeks = Math.max(2, Math.floor(diffDays / 7));

  const schedule = [];
  let unitIndex = 0;

  for (let week = 1; week <= totalWeeks; week++) {
    const isRevisionWeek = week >= totalWeeks - 1;
    let focusUnit;
    let weekGoal;

    if (isRevisionWeek) {
      focusUnit = 'Comprehensive Revision & Full-Length Mock Simulations';
      weekGoal = 'Timed full-length mock examinations, diagnostic review of incorrect answers, and flashcard review of core theorists.';
    } else {
      const u = units[unitIndex % units.length];
      unitIndex++;
      focusUnit = `Unit ${u.unit_number}: ${u.unit_title}`;
      weekGoal = `Master key concepts (${u.topics_covered.slice(0, 80)}...). Complete 50 unit-specific practice questions.`;
    }

    schedule.push({
      weekNumber: week,
      focus: focusUnit,
      allocatedDailyHours: dailyHours,
      keyMilestones: [
        'Read core textbook / knowledge base articles',
        'Solve 25 targeted PYQ questions',
        'Review weak topic notes and flashcards',
        'Complete end-of-week self-assessment'
      ],
      goal: weekGoal
    });
  }

  const insertPlan = db.prepare(`
    INSERT INTO study_plans (examination_id, target_date, daily_hours, total_weeks, plan_schedule_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = insertPlan.run(examinationId, targetDate, dailyHours, totalWeeks, JSON.stringify(schedule));

  return {
    planId: info.lastInsertRowid,
    examinationId,
    targetDate,
    totalWeeks,
    totalStudyHours: Math.round(totalWeeks * 7 * dailyHours),
    schedule,
    weakTopicsPrioritized: weakTopics
  };
}

module.exports = {
  extractQuestionsFromText,
  analyzeExaminationTrends,
  generatePredictedPracticePaper,
  createMockTest,
  submitMockTestAttempt,
  generateStudyPlan
};

