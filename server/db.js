// server/db.js
// SQLite Database Layer with node:sqlite
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for performance and data integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

function initSchema() {
  db.exec(`
    -- IDENTITY & SETTINGS
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_name TEXT DEFAULT 'Psychology Scholar',
      theme TEXT DEFAULT 'light',
      default_citation_format TEXT DEFAULT 'APA 7th',
      document_rag_top_k INTEGER DEFAULT 5,
      confidence_threshold REAL DEFAULT 0.70,
      active_exam_target TEXT DEFAULT 'UGC NET Psychology',
      preferences_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- LIBRARY MODULE
    CREATE TABLE IF NOT EXISTS resource_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      publication_year INTEGER,
      publisher TEXT,
      doi TEXT,
      isbn TEXT,
      subject TEXT,
      category_id INTEGER REFERENCES resource_categories(id) ON DELETE SET NULL,
      publication_type TEXT, -- Book, Journal Article, Manual, Guide, Paper, Report
      abstract TEXT,
      source TEXT, -- Verified Scholarly, User Upload, Open Access
      reference_url TEXT,
      is_verified INTEGER DEFAULT 1,
      copyright_status TEXT DEFAULT 'Metadata & Citation / Open Access',
      citation_apa TEXT,
      citation_bibtex TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      affiliation TEXT,
      orcid TEXT
    );

    CREATE TABLE IF NOT EXISTS resource_authors (
      resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
      author_order INTEGER DEFAULT 1,
      PRIMARY KEY (resource_id, author_id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resource_tags (
      resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (resource_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL, -- resource, topic, document, pyq, assessment
      item_id INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      target_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_list_id INTEGER REFERENCES reading_lists(id) ON DELETE CASCADE,
      resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'unread', -- unread, reading, completed
      notes TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- KNOWLEDGE BASE MODULE
    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      definition TEXT NOT NULL,
      introduction TEXT NOT NULL,
      historical_background TEXT,
      key_theorists TEXT, -- JSON array of strings
      major_theories TEXT,
      core_concepts TEXT,
      principles TEXT,
      classification TEXT,
      models TEXT,
      applications TEXT,
      clinical_relevance TEXT,
      research_evidence TEXT,
      examples TEXT,
      limitations TEXT,
      references_citations TEXT NOT NULL, -- Verified references
      recommended_reading TEXT,
      verified_status TEXT DEFAULT 'Verified Academic',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topic_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_topic TEXT NOT NULL,
      target_topic TEXT NOT NULL,
      relation_type TEXT DEFAULT 'subtopic', -- subtopic, related, contrasts, foundation
      description TEXT,
      UNIQUE(source_topic, target_topic)
    );

    -- CLINICAL REFERENCE MODULE
    CREATE TABLE IF NOT EXISTS clinical_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL, -- Mental Status Examination, Case History, Case Formulation, etc.
      title TEXT NOT NULL,
      explanation TEXT NOT NULL,
      clinical_significance TEXT NOT NULL,
      professional_guidelines TEXT NOT NULL,
      practical_examples TEXT,
      structured_templates TEXT,
      related_assessment_tools TEXT,
      references_json TEXT NOT NULL,
      safety_disclaimer TEXT DEFAULT 'Educational & Academic Reference Only. Does not substitute professional clinical judgement.'
    );

    CREATE TABLE IF NOT EXISTS clinical_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- MSE, Case Formulation, Clinical Report, Risk Assessment
      format_schema TEXT, -- Structure JSON
      template_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DIAGNOSTIC & ASSESSMENT CENTRE
    CREATE TABLE IF NOT EXISTS assessment_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS assessment_catalogue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      acronym TEXT,
      category_id INTEGER REFERENCES assessment_categories(id) ON DELETE SET NULL,
      original_author TEXT NOT NULL,
      publication_year INTEGER,
      purpose TEXT NOT NULL,
      target_population TEXT,
      age_range TEXT,
      administration_method TEXT,
      time_required TEXT,
      domains_measured TEXT,
      reliability_validity_evidence TEXT NOT NULL,
      normative_population TEXT,
      scoring_overview TEXT NOT NULL,
      interpretation_guidelines TEXT NOT NULL,
      licensing_qualification TEXT,
      source_references TEXT NOT NULL,
      is_proprietary INTEGER DEFAULT 1,
      copyright_notice TEXT DEFAULT 'General educational information only. Proprietary test materials and protected keys are not reproduced.'
    );

    -- RESEARCH HUB MODULE
    CREATE TABLE IF NOT EXISTS research_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      research_question TEXT,
      objectives TEXT,
      hypotheses TEXT,
      methodology_type TEXT,
      sampling_method TEXT,
      design_type TEXT,
      variables_json TEXT,
      status TEXT DEFAULT 'In Progress',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS research_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES research_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS research_citations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      year INTEGER,
      journal_or_publisher TEXT,
      doi TEXT,
      source_type TEXT DEFAULT 'Crossref/OpenAlex/Verified',
      citation_apa TEXT,
      citation_mla TEXT,
      citation_chicago TEXT,
      citation_vancouver TEXT,
      citation_bibtex TEXT,
      citation_ris TEXT,
      abstract TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DOCUMENT INTELLIGENCE MODULE
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      total_pages INTEGER DEFAULT 1,
      summary TEXT,
      key_concepts TEXT, -- JSON array
      extracted_references TEXT, -- JSON array
      important_questions TEXT, -- JSON array
      study_notes TEXT,
      ocr_applied INTEGER DEFAULT 0,
      status TEXT DEFAULT 'processed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      heading TEXT,
      text_content TEXT NOT NULL,
      tables_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      section_heading TEXT,
      chunk_text TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding_meta TEXT
    );

    -- PYQ & EXAMINATION MODULE
    CREATE TABLE IF NOT EXISTS examinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL, -- UGC NET Psychology, GATE Psychology, CUET PG, MSc Entrance, etc.
      board_university TEXT,
      description TEXT,
      syllabus_overview TEXT
    );

    CREATE TABLE IF NOT EXISTS syllabus_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examination_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
      unit_number INTEGER NOT NULL,
      unit_title TEXT NOT NULL,
      topics_covered TEXT NOT NULL,
      historical_weightage REAL DEFAULT 10.0
    );

    CREATE TABLE IF NOT EXISTS question_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examination_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      session TEXT, -- June, December, Annual
      title TEXT NOT NULL,
      total_questions INTEGER DEFAULT 0,
      source_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_paper_id INTEGER REFERENCES question_papers(id) ON DELETE CASCADE,
      examination_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
      unit_id INTEGER REFERENCES syllabus_units(id) ON DELETE SET NULL,
      question_number INTEGER,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'MCQ', -- MCQ, Assertion-Reason, Matching, Short, Long
      options_json TEXT, -- [{ "label": "A", "text": "..." }, ...]
      correct_answer TEXT, -- official answer e.g. "A"
      explanation TEXT,
      topic_tag TEXT,
      theorist_tag TEXT,
      instrument_tag TEXT,
      difficulty TEXT DEFAULT 'Moderate', -- Easy, Moderate, Difficult
      source_page INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topic_frequency (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examination_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
      unit_id INTEGER REFERENCES syllabus_units(id) ON DELETE CASCADE,
      topic_name TEXT NOT NULL,
      appearance_count INTEGER DEFAULT 1,
      years_appeared TEXT, -- JSON array of years [2019, 2020, 2022, 2023]
      trend_category TEXT DEFAULT 'Frequently Tested', -- Frequently Tested, Emerging, Stable, Infrequent
      last_appeared_year INTEGER,
      UNIQUE(examination_id, topic_name)
    );

    CREATE TABLE IF NOT EXISTS mock_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      examination_id INTEGER REFERENCES examinations(id) ON DELETE SET NULL,
      mode TEXT DEFAULT 'practice', -- practice, exam
      total_questions INTEGER NOT NULL,
      time_limit_minutes INTEGER DEFAULT 60,
      config_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mock_test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mock_test_id INTEGER REFERENCES mock_tests(id) ON DELETE CASCADE,
      score REAL,
      accuracy REAL,
      total_attempted INTEGER,
      correct_count INTEGER,
      incorrect_count INTEGER,
      answers_payload TEXT, -- JSON of user responses & evaluations
      unit_performance TEXT, -- JSON breakdown
      weak_topics TEXT, -- JSON array
      time_taken_seconds INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examination_id INTEGER REFERENCES examinations(id) ON DELETE CASCADE,
      target_date DATE NOT NULL,
      daily_hours REAL DEFAULT 3.0,
      total_weeks INTEGER DEFAULT 12,
      plan_schedule_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TEACHING WORKSPACE MODULE
    CREATE TABLE IF NOT EXISTS lesson_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_title TEXT NOT NULL,
      target_level TEXT DEFAULT 'Undergraduate', -- Higher Secondary, Undergraduate, Postgraduate
      duration_minutes INTEGER DEFAULT 60,
      learning_objectives TEXT NOT NULL,
      introduction TEXT NOT NULL,
      explanation TEXT NOT NULL,
      key_concepts TEXT NOT NULL,
      examples TEXT NOT NULL,
      classroom_activity TEXT NOT NULL,
      assessment_questions TEXT NOT NULL,
      references_citations TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teaching_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_plan_id INTEGER REFERENCES lesson_plans(id) ON DELETE CASCADE,
      material_type TEXT NOT NULL, -- presentation_outline, worksheet, assignment, practical_record
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- AI CONVERSATIONS & CHAT HISTORY
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL, -- Knowledge, Clinical, Assessment, Research, DocumentChat, PYQ, ExamPrep, Teaching
      document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
      title TEXT DEFAULT 'New Discussion',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL, -- user, assistant, system
      content TEXT NOT NULL,
      citations_json TEXT, -- [{ document: "...", page: 12, excerpt: "...", verified: true }]
      confidence_category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- INDEXES FOR INSTANT RETRIEVAL
    CREATE INDEX IF NOT EXISTS idx_resources_cat ON resources(category_id);
    CREATE INDEX IF NOT EXISTS idx_resources_pubyear ON resources(publication_year);
    CREATE INDEX IF NOT EXISTS idx_doc_pages_doc ON document_pages(document_id);
    CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc ON document_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(examination_id);
    CREATE INDEX IF NOT EXISTS idx_questions_unit ON questions(unit_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_cat ON assessment_catalogue(category_id);
    CREATE INDEX IF NOT EXISTS idx_topic_freq_exam ON topic_frequency(examination_id);
  `);

  // Ensure default user preference exists
  const existingPref = db.prepare('SELECT id FROM user_preferences WHERE id = 1').get();
  if (!existingPref) {
    db.prepare(`
      INSERT INTO user_preferences (id, user_name, theme, default_citation_format, active_exam_target)
      VALUES (1, 'Psychology Scholar', 'light', 'APA 7th', 'UGC NET Psychology')
    `).run();
  }
}

initSchema();

module.exports = {
  db,
  DATA_DIR,
  UPLOADS_DIR,
  EXPORTS_DIR
};

