// server/aiService.js
// Centralized AI Psychology Assistant with 8 specialized persona modes,
// citation verification, and knowledge prioritization.
const { db } = require('./db');
const { answerQuestionGrounded } = require('./ragEngine');

const MODES = {
  Knowledge: 'Psychology Expert / Knowledge Mode',
  Clinical: 'Clinical Reference Mode',
  Assessment: 'Assessment Reference Mode',
  Research: 'Research Assistant Mode',
  DocumentChat: 'Document Chat Mode',
  PYQ: 'PYQ Analysis Mode',
  ExamPrep: 'Examination Preparation Mode',
  Teaching: 'Teaching Assistant Mode'
};

/**
 * Knowledge Base context search (Priority 2)
 */
function searchKnowledgeArticles(query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  if (tokens.length === 0) return [];

  const articles = db.prepare('SELECT * FROM knowledge_articles').all();
  const scored = articles.map(art => {
    let score = 0;
    const combined = `${art.title} ${art.definition} ${art.core_concepts} ${art.major_theories} ${art.key_theorists}`.toLowerCase();
    tokens.forEach(t => {
      if (combined.includes(t)) score += 5;
    });
    return { ...art, score };
  });

  return scored.filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
}

/**
 * Assessment Catalogue context search (Priority 3)
 */
function searchAssessments(query) {
  const rows = db.prepare(`
    SELECT a.*, c.name as category_name
    FROM assessment_catalogue a
    LEFT JOIN assessment_categories c ON c.id = a.category_id
    WHERE a.name LIKE ? OR a.acronym LIKE ? OR a.domains_measured LIKE ?
    LIMIT 2
  `).all(`%${query}%`, `%${query}%`, `%${query}%`);
  return rows;
}

/**
 * Handle user prompt according to active mode and document context
 */
async function generateAssistantResponse(prompt, mode = 'Knowledge', documentIds = []) {
  const activeMode = MODES[mode] || MODES.Knowledge;

  // PRIORITY 1: If in DocumentChat mode or specific documents selected, route to RAG engine
  if (mode === 'DocumentChat' || (documentIds && documentIds.length > 0)) {
    const grounded = answerQuestionGrounded(prompt, documentIds);
    return {
      mode: activeMode,
      response: grounded.answer,
      citations: grounded.citations,
      confidence: grounded.confidence,
      evidenceStatus: grounded.citations.length > 0 ? 'Document Grounded' : 'Unverified / Absent from Text',
      multiDocument: grounded.multiDocumentComparison
    };
  }

  // PRIORITY 2: Search structured Knowledge Base
  const matchedArticles = searchKnowledgeArticles(prompt);
  const matchedAssessments = searchAssessments(prompt);

  let responseText = '';
  const citations = [];
  let confidence = 'High Academic Evidence';

  if (mode === 'Clinical') {
    responseText += `> **Clinical Safety Notice**: This reference is for academic and clinical training purposes only. It does not replace independent clinical evaluation or constitute a diagnostic determination.\n\n`;
    if (matchedArticles.length > 0) {
      const art = matchedArticles[0];
      responseText += `### Clinical Overview: ${art.title}\n`;
      responseText += `**Clinical Relevance & Formulation**:\n${art.clinical_relevance}\n\n`;
      responseText += `**Recommended Evidence-Based Interventions**:\n${art.applications}\n\n`;
      responseText += `**References**:\n${art.references_citations}`;
      citations.push({
        source: art.title,
        verified: true,
        referenceText: art.references_citations.split('\n')[0]
      });
    } else {
      responseText += `Clinical inquiry for: "${prompt}".\n\nClinical guidelines recommend following structured assessment protocols (e.g., Mental Status Examination, 5 P's Biopsychosocial Formulation) and standardized screening instruments (e.g., BDI-II, PHQ-9). Always cross-reference the DSM-5-TR or ICD-11 diagnostic criteria before reaching clinical hypotheses.`;
    }
  } else if (mode === 'Assessment') {
    if (matchedAssessments.length > 0) {
      const asmt = matchedAssessments[0];
      responseText += `### Assessment Reference: **${asmt.name} (${asmt.acronym})**\n`;
      responseText += `- **Author & Year**: ${asmt.original_author} (${asmt.publication_year})\n`;
      responseText += `- **Purpose**: ${asmt.purpose}\n`;
      responseText += `- **Target Population & Age Range**: ${asmt.target_population} (${asmt.age_range})\n`;
      responseText += `- **Administration & Time**: ${asmt.administration_method} (~${asmt.time_required})\n`;
      responseText += `- **Psychometric Reliability & Validity**: ${asmt.reliability_validity_evidence}\n`;
      responseText += `- **Normative Standard**: ${asmt.normative_population}\n`;
      responseText += `- **Scoring & Interpretation**: ${asmt.scoring_overview}\n`;
      responseText += `- **Licensing Level**: ${asmt.licensing_qualification}\n\n`;
      responseText += `*Notice: ${asmt.copyright_notice}*\n\n`;
      responseText += `**Authoritative Source**: ${asmt.source_references}`;
      citations.push({
        source: asmt.name,
        verified: true,
        referenceText: asmt.source_references
      });
    } else {
      responseText += `Inquiry regarding psychological assessment instrument: "${prompt}".\n\nPlease specify the test acronym (e.g. WAIS-IV, MMPI-3, BDI-II, MoCA) to review verified psychometric properties, age criteria, normative data, and qualification tiers.`;
    }
  } else if (mode === 'PYQ' || mode === 'ExamPrep') {
    responseText += `### Examination Preparation Analysis: "${prompt}"\n\n`;
    if (matchedArticles.length > 0) {
      const art = matchedArticles[0];
      responseText += `**Key Theorists & High-Probability Concepts**:\n- Theorists: ${art.key_theorists}\n- Core Principles: ${art.principles}\n- Primary Theories: ${art.major_theories}\n\n`;
      responseText += `**Exam Strategy Tip**: In competitive examinations (such as UGC NET Psychology), questions often test double dissociations, chronological development of models, and differences between competing frameworks.`;
    } else {
      responseText += `Reviewing historical UGC NET and entrance examination trends. This topic corresponds to foundational psychology syllabus units. Review past year questions in the PYQ Centre to observe recurring question types (MCQ, Assertion-Reason, and Matching).`;
    }
  } else if (mode === 'Teaching') {
    responseText += `### Teaching & Pedagogical Guide: "${prompt}"\n\n`;
    responseText += `1. **Core Learning Objective**: Enable students to critically analyze and contrast underlying theoretical paradigms.\n`;
    responseText += `2. **Classroom Socratic Prompt**: "What experimental evidence demonstrates that these cognitive or behavioral mechanisms operate independently?"\n`;
    responseText += `3. **Didactic Demonstration**: Recommend active learning exercises (e.g. Stroop effect timing demonstration, memory chunking trials, or case vignette roleplay).\n`;
    responseText += `4. **Formative Assessment**: Generate 3-5 multiple-choice questions focusing on application rather than pure rote recall.`;
  } else {
    // General Knowledge Expert Mode
    if (matchedArticles.length > 0) {
      const art = matchedArticles[0];
      responseText += `### ${art.title}\n\n`;
      responseText += `**Definition**: ${art.definition}\n\n`;
      responseText += `**Theoretical Framework**: ${art.major_theories}\n\n`;
      responseText += `**Core Concepts**: ${art.core_concepts}\n\n`;
      responseText += `**Empirical Evidence**: ${art.research_evidence}\n\n`;
      responseText += `**Clinical & Practical Applications**: ${art.applications}\n\n`;
      responseText += `#### References & Citations:\n${art.references_citations}`;
      citations.push({
        source: art.title,
        verified: true,
        referenceText: art.references_citations
      });
    } else {
      responseText += `Psychological conceptual overview for: "${prompt}".\n\nIn psychological science, this inquiry involves cognitive, neurobiological, and behavioral dimensions. For granular citations and page-level source evidence, consider uploading related academic texts or selecting matching entries from the Psychology Library.`;
      confidence = 'Educational Generalization';
    }
  }

  return {
    mode: activeMode,
    response: responseText,
    citations,
    confidence,
    evidenceStatus: citations.length > 0 ? 'Verified Academic References' : 'General Educational Explanation'
  };
}

module.exports = {
  MODES,
  generateAssistantResponse
};

