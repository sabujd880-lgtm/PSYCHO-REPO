// server/server.js
// High-performance HTTP REST API Server for Personal Psychology Knowledge & Intelligence Platform
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const url = require('node:url');

const { db, UPLOADS_DIR, EXPORTS_DIR } = require('./db');
const { seedDatabase } = require('./seedData');
const { processUploadedDocument } = require('./documentProcessor');
const { answerQuestionGrounded, retrieveChunks } = require('./ragEngine');
const {
  analyzeExaminationTrends,
  generatePredictedPracticePaper,
  createMockTest,
  submitMockTestAttempt,
  generateStudyPlan,
  extractQuestionsFromText
} = require('./pyqEngine');
const {
  calculateDescriptiveStats,
  independentSamplesTTest,
  pearsonCorrelation,
  cronbachAlpha,
  generateCitations,
  searchScholarlyLiterature
} = require('./researchStats');
const { generateAssistantResponse, MODES } = require('./aiService');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

/**
 * Helper to read JSON request body
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB max limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper to send JSON responses
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

/**
 * Helper to send static files
 */
function serveStaticFile(res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  try {
    // -------------------------------------------------------------
    // API ROUTES
    // -------------------------------------------------------------

    // 1. DASHBOARD & STATS
    if (pathname === '/api/dashboard/stats' && method === 'GET') {
      const recentDocs = db.prepare('SELECT id, original_name, file_size, total_pages, created_at FROM documents ORDER BY id DESC LIMIT 5').all();
      const recentResources = db.prepare('SELECT id, title, publication_year, subject, publication_type FROM resources ORDER BY id DESC LIMIT 5').all();
      const bookmarks = db.prepare('SELECT * FROM bookmarks ORDER BY id DESC LIMIT 5').all();
      const recentQuestions = db.prepare("SELECT id, role, content, created_at FROM ai_messages WHERE role = 'user' ORDER BY id DESC LIMIT 5").all();
      
      const counts = {
        totalResources: db.prepare('SELECT COUNT(*) as c FROM resources').get().c,
        totalArticles: db.prepare('SELECT COUNT(*) as c FROM knowledge_articles').get().c,
        totalAssessments: db.prepare('SELECT COUNT(*) as c FROM assessment_catalogue').get().c,
        totalDocuments: db.prepare('SELECT COUNT(*) as c FROM documents').get().c,
        totalPYQs: db.prepare('SELECT COUNT(*) as c FROM questions').get().c,
        totalLessonPlans: db.prepare('SELECT COUNT(*) as c FROM lesson_plans').get().c
      };

      const upcomingExam = db.prepare('SELECT * FROM examinations LIMIT 1').get();
      const latestMockAttempt = db.prepare('SELECT * FROM mock_test_attempts ORDER BY id DESC LIMIT 1').get();

      return sendJson(res, 200, {
        counts,
        recentDocs,
        recentResources,
        bookmarks,
        recentQuestions,
        upcomingExam,
        latestMockAttempt
      });
    }

    // 2. GLOBAL SEARCH
    if (pathname === '/api/search' && method === 'GET') {
      const q = (parsedUrl.query.q || '').trim();
      if (!q) return sendJson(res, 200, { query: '', total: 0, results: [] });

      const searchPattern = `%${q}%`;
      const results = [];

      // A. Knowledge Base Articles
      const articles = db.prepare(`
        SELECT id, topic_id, title, category, definition
        FROM knowledge_articles
        WHERE title LIKE ? OR definition LIKE ? OR core_concepts LIKE ?
        LIMIT 5
      `).all(searchPattern, searchPattern, searchPattern);
      articles.forEach(a => results.push({ type: 'Knowledge Article', title: a.title, subtitle: a.category, id: a.topic_id, snippet: a.definition.slice(0, 160) + '...' }));

      // B. Library Resources
      const resources = db.prepare(`
        SELECT id, title, publication_year, subject, publisher
        FROM resources
        WHERE title LIKE ? OR subject LIKE ? OR abstract LIKE ?
        LIMIT 5
      `).all(searchPattern, searchPattern, searchPattern);
      resources.forEach(r => results.push({ type: 'Library Resource', title: r.title, subtitle: `${r.publication_year || 'N/A'} • ${r.publisher || ''}`, id: r.id, snippet: r.subject }));

      // C. Assessment Instruments
      const assessments = db.prepare(`
        SELECT id, code, name, acronym, purpose, domains_measured
        FROM assessment_catalogue
        WHERE name LIKE ? OR acronym LIKE ? OR domains_measured LIKE ?
        LIMIT 5
      `).all(searchPattern, searchPattern, searchPattern);
      assessments.forEach(a => results.push({ type: 'Psychological Assessment', title: `${a.name} (${a.acronym})`, subtitle: a.code, id: a.code, snippet: a.purpose.slice(0, 160) + '...' }));

      // D. Uploaded Documents
      const docs = db.prepare(`
        SELECT id, original_name, summary, total_pages
        FROM documents
        WHERE original_name LIKE ? OR summary LIKE ?
        LIMIT 5
      `).all(searchPattern, searchPattern);
      docs.forEach(d => results.push({ type: 'Uploaded Document', title: d.original_name, subtitle: `${d.total_pages} Pages`, id: d.id, snippet: d.summary ? d.summary.slice(0, 160) + '...' : '' }));

      // E. PYQs
      const pyqs = db.prepare(`
        SELECT id, question_number, question_text, topic_tag, difficulty
        FROM questions
        WHERE question_text LIKE ? OR topic_tag LIKE ?
        LIMIT 5
      `).all(searchPattern, searchPattern);
      pyqs.forEach(pq => results.push({ type: 'Exam PYQ', title: `Q${pq.question_number || ''}: ${pq.topic_tag || 'Psychology'}`, subtitle: pq.difficulty, id: pq.id, snippet: pq.question_text.slice(0, 160) + '...' }));

      return sendJson(res, 200, {
        query: q,
        total: results.length,
        results
      });
    }

    // 3. PSYCHOLOGY LIBRARY
    if (pathname === '/api/library/categories' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM resource_categories ORDER BY display_order ASC').all();
      return sendJson(res, 200, rows);
    }

    if (pathname === '/api/library/resources' && method === 'GET') {
      const { category_id, publication_type, verified, search } = parsedUrl.query;
      let sql = `
        SELECT r.*, c.name as category_name, GROUP_CONCAT(a.name, ', ') as author_names
        FROM resources r
        LEFT JOIN resource_categories c ON c.id = r.category_id
        LEFT JOIN resource_authors ra ON ra.resource_id = r.id
        LEFT JOIN authors a ON a.id = ra.author_id
        WHERE 1=1
      `;
      const params = [];
      if (category_id) {
        sql += ' AND r.category_id = ?';
        params.push(category_id);
      }
      if (publication_type) {
        sql += ' AND r.publication_type = ?';
        params.push(publication_type);
      }
      if (verified !== undefined) {
        sql += ' AND r.is_verified = ?';
        params.push(verified === '1' ? 1 : 0);
      }
      if (search) {
        sql += ' AND (r.title LIKE ? OR r.subject LIKE ? OR r.abstract LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ' GROUP BY r.id ORDER BY r.publication_year DESC, r.id DESC';

      const rows = db.prepare(sql).all(...params);
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/api/library/resources/') && method === 'GET') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const row = db.prepare(`
        SELECT r.*, c.name as category_name, GROUP_CONCAT(a.name, ', ') as author_names
        FROM resources r
        LEFT JOIN resource_categories c ON c.id = r.category_id
        LEFT JOIN resource_authors ra ON ra.resource_id = r.id
        LEFT JOIN authors a ON a.id = ra.author_id
        WHERE r.id = ?
        GROUP BY r.id
      `).get(id);
      if (!row) return sendJson(res, 404, { error: 'Resource not found' });
      return sendJson(res, 200, row);
    }

    if (pathname === '/api/library/resources' && method === 'POST') {
      const body = await readJsonBody(req);
      const insert = db.prepare(`
        INSERT INTO resources (
          title, subtitle, publication_year, publisher, doi, isbn, subject,
          category_id, publication_type, abstract, source, reference_url,
          is_verified, citation_apa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = insert.run(
        body.title, body.subtitle || null, body.publication_year || null,
        body.publisher || null, body.doi || null, body.isbn || null,
        body.subject || null, body.category_id || null, body.publication_type || 'Paper',
        body.abstract || null, body.source || 'User Uploaded',
        body.reference_url || null, body.is_verified ? 1 : 0, body.citation_apa || null
      );
      return sendJson(res, 201, { success: true, id: info.lastInsertRowid });
    }

    // Bookmarks
    if (pathname === '/api/library/bookmarks' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM bookmarks ORDER BY id DESC').all();
      return sendJson(res, 200, rows);
    }

    if (pathname === '/api/library/bookmarks' && method === 'POST') {
      const body = await readJsonBody(req);
      const info = db.prepare('INSERT INTO bookmarks (item_type, item_id, notes) VALUES (?, ?, ?)')
        .run(body.item_type, body.item_id, body.notes || null);
      return sendJson(res, 201, { success: true, id: info.lastInsertRowid });
    }

    if (pathname.startsWith('/api/library/bookmarks/') && method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
      return sendJson(res, 200, { success: true });
    }

    // 4. PSYCHOLOGY KNOWLEDGE BASE
    if (pathname === '/api/knowledge/articles' && method === 'GET') {
      const category = parsedUrl.query.category;
      let sql = 'SELECT id, topic_id, title, category, definition, verified_status, created_at FROM knowledge_articles';
      const params = [];
      if (category) {
        sql += ' WHERE category = ?';
        params.push(category);
      }
      sql += ' ORDER BY id ASC';
      const rows = db.prepare(sql).all(...params);
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/api/knowledge/articles/') && method === 'GET') {
      const topicId = pathname.split('/').pop();
      const row = db.prepare('SELECT * FROM knowledge_articles WHERE topic_id = ?').get(topicId);
      if (!row) return sendJson(res, 404, { error: 'Knowledge article not found' });
      
      // Parse key theorists JSON if string
      try {
        row.key_theorists = JSON.parse(row.key_theorists);
      } catch {}

      // Get related topics from relationship graph
      const relations = db.prepare(`
        SELECT target_topic, relation_type, description
        FROM topic_relations
        WHERE source_topic = ? OR source_topic = ?
      `).all(row.title, row.category);

      return sendJson(res, 200, { ...row, relatedTopics: relations });
    }

    if (pathname === '/api/knowledge/relations' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM topic_relations').all();
      return sendJson(res, 200, rows);
    }

    // 5. CLINICAL PSYCHOLOGY REFERENCE CENTRE
    if (pathname === '/api/clinical/topics' && method === 'GET') {
      const rows = db.prepare('SELECT id, domain, title, clinical_significance FROM clinical_topics').all();
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/api/clinical/topics/') && method === 'GET') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const row = db.prepare('SELECT * FROM clinical_topics WHERE id = ?').get(id);
      if (!row) return sendJson(res, 404, { error: 'Clinical topic not found' });
      try {
        row.structured_templates = JSON.parse(row.structured_templates);
        row.references_json = JSON.parse(row.references_json);
      } catch {}
      return sendJson(res, 200, row);
    }

    if (pathname === '/api/clinical/templates' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM clinical_templates ORDER BY id ASC').all();
      return sendJson(res, 200, rows);
    }

    // 6. DIAGNOSTIC & ASSESSMENT CENTRE
    if (pathname === '/api/assessments/categories' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM assessment_categories').all();
      return sendJson(res, 200, rows);
    }

    if (pathname === '/api/assessments/catalogue' && method === 'GET') {
      const categoryId = parsedUrl.query.category_id;
      let sql = `
        SELECT a.*, c.name as category_name
        FROM assessment_catalogue a
        LEFT JOIN assessment_categories c ON c.id = a.category_id
      `;
      const params = [];
      if (categoryId) {
        sql += ' WHERE a.category_id = ?';
        params.push(categoryId);
      }
      sql += ' ORDER BY a.id ASC';
      const rows = db.prepare(sql).all(...params);
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/api/assessments/catalogue/') && method === 'GET') {
      const code = pathname.split('/').pop();
      const row = db.prepare(`
        SELECT a.*, c.name as category_name
        FROM assessment_catalogue a
        LEFT JOIN assessment_categories c ON c.id = a.category_id
        WHERE a.code = ?
      `).get(code);
      if (!row) return sendJson(res, 404, { error: 'Assessment instrument not found' });
      return sendJson(res, 200, row);
    }

    // Side-by-Side Comparison Feature
    if (pathname === '/api/assessments/compare' && method === 'GET') {
      const codes = (parsedUrl.query.codes || '').split(',').map(s => s.trim()).filter(Boolean);
      if (codes.length === 0) return sendJson(res, 400, { error: 'Specify comma-separated codes' });

      const placeholders = codes.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT a.*, c.name as category_name
        FROM assessment_catalogue a
        LEFT JOIN assessment_categories c ON c.id = a.category_id
        WHERE a.code IN (${placeholders})
      `).all(...codes);

      return sendJson(res, 200, { instruments: rows });
    }

    // 7. DOCUMENT INTELLIGENCE
    if (pathname === '/api/documents/upload' && method === 'POST') {
      const body = await readJsonBody(req);
      const { filename, content, mimeType } = body;
      if (!filename || !content) {
        return sendJson(res, 400, { error: 'Filename and base64/raw content required' });
      }

      const safeFilename = `${Date.now()}_${path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(UPLOADS_DIR, safeFilename);

      // Support base64 or plain string content
      let fileBuffer;
      if (content.startsWith('data:') && content.includes(';base64,')) {
        const base64Data = content.split(';base64,').pop();
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        fileBuffer = Buffer.from(content, 'utf-8');
      }

      fs.writeFileSync(filePath, fileBuffer);

      const result = processUploadedDocument({
        path: filePath,
        originalName: filename,
        mimeType: mimeType || 'application/octet-stream'
      });

      return sendJson(res, 201, result);
    }

    if (pathname === '/api/documents' && method === 'GET') {
      const rows = db.prepare(`
        SELECT id, filename, original_name, mime_type, file_size, total_pages,
               summary, key_concepts, ocr_applied, created_at
        FROM documents
        ORDER BY id DESC
      `).all();

      const mapped = rows.map(r => {
        try { r.key_concepts = JSON.parse(r.key_concepts); } catch {}
        return r;
      });
      return sendJson(res, 200, mapped);
    }

    if (pathname.startsWith('/api/documents/') && method === 'GET') {
      const parts = pathname.split('/');
      const docId = parseInt(parts[3], 10);

      // Check if page specific: /api/documents/:id/pages/:num
      if (parts[4] === 'pages' && parts[5]) {
        const pageNum = parseInt(parts[5], 10);
        const page = db.prepare('SELECT * FROM document_pages WHERE document_id = ? AND page_number = ?').get(docId, pageNum);
        if (!page) return sendJson(res, 404, { error: 'Page not found' });
        return sendJson(res, 200, page);
      }

      const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
      if (!doc) return sendJson(res, 404, { error: 'Document not found' });
      
      try {
        doc.key_concepts = JSON.parse(doc.key_concepts);
        doc.extracted_references = JSON.parse(doc.extracted_references);
        doc.important_questions = JSON.parse(doc.important_questions);
      } catch {}

      const pages = db.prepare('SELECT page_number, heading, text_content FROM document_pages WHERE document_id = ? ORDER BY page_number ASC').all(docId);

      return sendJson(res, 200, { ...doc, pages });
    }

    // Ask Document / Multi-Document RAG Query
    if (pathname === '/api/documents/ask' && method === 'POST') {
      const body = await readJsonBody(req);
      const { query, documentIds = [] } = body;
      if (!query) return sendJson(res, 400, { error: 'Query is required' });

      const answer = answerQuestionGrounded(query, documentIds);
      return sendJson(res, 200, answer);
    }

    // 8. RESEARCH HUB & STATISTICS
    if (pathname === '/api/research/stats/descriptive' && method === 'POST') {
      const body = await readJsonBody(req);
      const numbers = (body.data || []).map(Number).filter(n => !isNaN(n));
      const stats = calculateDescriptiveStats(numbers);
      return sendJson(res, 200, stats);
    }

    if (pathname === '/api/research/stats/ttest' && method === 'POST') {
      const body = await readJsonBody(req);
      const g1 = (body.group1 || []).map(Number).filter(n => !isNaN(n));
      const g2 = (body.group2 || []).map(Number).filter(n => !isNaN(n));
      if (g1.length < 2 || g2.length < 2) return sendJson(res, 400, { error: 'Minimum 2 observations per group required' });
      const result = independentSamplesTTest(g1, g2);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/research/stats/correlation' && method === 'POST') {
      const body = await readJsonBody(req);
      const x = (body.x || []).map(Number).filter(n => !isNaN(n));
      const y = (body.y || []).map(Number).filter(n => !isNaN(n));
      if (x.length !== y.length || x.length < 3) return sendJson(res, 400, { error: 'Equal observations (>=3) required for x and y' });
      const result = pearsonCorrelation(x, y);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/research/stats/cronbach' && method === 'POST') {
      const body = await readJsonBody(req);
      const matrix = body.matrix || [];
      if (!Array.isArray(matrix) || matrix.length < 3) return sendJson(res, 400, { error: 'Valid 2D array [persons x items] required' });
      const result = cronbachAlpha(matrix);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/research/citations/generate' && method === 'POST') {
      const body = await readJsonBody(req);
      const citations = generateCitations(body);
      return sendJson(res, 200, citations);
    }

    if (pathname === '/api/research/literature' && method === 'GET') {
      const q = parsedUrl.query.q || '';
      const lit = await searchScholarlyLiterature(q);
      return sendJson(res, 200, lit);
    }

    if (pathname === '/api/research/projects' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM research_projects ORDER BY id DESC').all();
      return sendJson(res, 200, rows);
    }

    if (pathname === '/api/research/projects' && method === 'POST') {
      const body = await readJsonBody(req);
      const info = db.prepare(`
        INSERT INTO research_projects (title, research_question, objectives, hypotheses, methodology_type, sampling_method, design_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.title, body.research_question || null, body.objectives || null,
        body.hypotheses || null, body.methodology_type || 'Quantitative',
        body.sampling_method || 'Random Stratified', body.design_type || 'Experimental'
      );
      return sendJson(res, 201, { success: true, id: info.lastInsertRowid });
    }

    // 9. PYQ & EXAM PREPARATION
    if (pathname === '/api/pyq/examinations' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM examinations').all();
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/api/pyq/syllabus/') && method === 'GET') {
      const examId = parseInt(pathname.split('/').pop(), 10) || 1;
      const units = db.prepare('SELECT * FROM syllabus_units WHERE examination_id = ? ORDER BY unit_number ASC').all(examId);
      return sendJson(res, 200, units);
    }

    if (pathname === '/api/pyq/questions' && method === 'GET') {
      const { examination_id = 1, unit_id, difficulty } = parsedUrl.query;
      let sql = 'SELECT * FROM questions WHERE examination_id = ?';
      const params = [examination_id];
      if (unit_id) {
        sql += ' AND unit_id = ?';
        params.push(unit_id);
      }
      if (difficulty) {
        sql += ' AND difficulty = ?';
        params.push(difficulty);
      }
      sql += ' ORDER BY id ASC';
      const rows = db.prepare(sql).all(...params);
      const parsed = rows.map(r => {
        try { r.options_json = JSON.parse(r.options_json); } catch {}
        return r;
      });
      return sendJson(res, 200, parsed);
    }

    if (pathname.startsWith('/api/pyq/trends/') && method === 'GET') {
      const examId = parseInt(pathname.split('/').pop(), 10) || 1;
      const trends = analyzeExaminationTrends(examId);
      return sendJson(res, 200, trends);
    }

    if (pathname.startsWith('/api/pyq/predictor/') && method === 'GET') {
      const examId = parseInt(pathname.split('/').pop(), 10) || 1;
      const count = parseInt(parsedUrl.query.count, 10) || 10;
      const predictedPaper = generatePredictedPracticePaper(examId, count);
      return sendJson(res, 200, predictedPaper);
    }

    if (pathname === '/api/pyq/mock/create' && method === 'POST') {
      const body = await readJsonBody(req);
      const mockTest = createMockTest(body);
      return sendJson(res, 201, mockTest);
    }

    if (pathname === '/api/pyq/mock/submit' && method === 'POST') {
      const body = await readJsonBody(req);
      const evaluation = submitMockTestAttempt(body);
      return sendJson(res, 200, evaluation);
    }

    if (pathname === '/api/pyq/study-plan' && method === 'POST') {
      const body = await readJsonBody(req);
      const plan = generateStudyPlan(body);
      return sendJson(res, 201, plan);
    }

    if (pathname === '/api/pyq/extract-from-text' && method === 'POST') {
      const body = await readJsonBody(req);
      const questions = extractQuestionsFromText(body.text || '');
      return sendJson(res, 200, { count: questions.length, questions });
    }

    // 10. TEACHING WORKSPACE
    if (pathname === '/api/teaching/lesson-plans' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM lesson_plans ORDER BY id DESC').all();
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/api/teaching/lesson-plans/') && method === 'GET') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const plan = db.prepare('SELECT * FROM lesson_plans WHERE id = ?').get(id);
      if (!plan) return sendJson(res, 404, { error: 'Lesson plan not found' });
      return sendJson(res, 200, plan);
    }

    if (pathname === '/api/teaching/lesson-plans' && method === 'POST') {
      const body = await readJsonBody(req);
      const insert = db.prepare(`
        INSERT INTO lesson_plans (
          topic_title, target_level, duration_minutes, learning_objectives,
          introduction, explanation, key_concepts, examples, classroom_activity,
          assessment_questions, references_citations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = insert.run(
        body.topic_title, body.target_level || 'Undergraduate', body.duration_minutes || 60,
        body.learning_objectives, body.introduction, body.explanation,
        body.key_concepts, body.examples, body.classroom_activity,
        body.assessment_questions, body.references_citations
      );
      return sendJson(res, 201, { success: true, id: info.lastInsertRowid });
    }

    // 11. AI PSYCHOLOGY ASSISTANT
    if (pathname === '/api/ai/chat' && method === 'POST') {
      const body = await readJsonBody(req);
      const { prompt, mode = 'Knowledge', documentIds = [] } = body;
      if (!prompt) return sendJson(res, 400, { error: 'Prompt is required' });

      // Save user message
      db.prepare("INSERT INTO ai_messages (role, content) VALUES ('user', ?)").run(prompt);

      const response = await generateAssistantResponse(prompt, mode, documentIds);

      // Save assistant message
      db.prepare(`
        INSERT INTO ai_messages (role, content, citations_json, confidence_category)
        VALUES ('assistant', ?, ?, ?)
      `).run(
        response.response,
        JSON.stringify(response.citations || []),
        response.confidence || 'Standard'
      );

      return sendJson(res, 200, response);
    }

    // 12. SETTINGS & PREFERENCES
    if (pathname === '/api/settings' && method === 'GET') {
      const prefs = db.prepare('SELECT * FROM user_preferences WHERE id = 1').get();
      return sendJson(res, 200, prefs);
    }

    if (pathname === '/api/settings' && method === 'POST') {
      const body = await readJsonBody(req);
      db.prepare(`
        UPDATE user_preferences
        SET user_name = ?, theme = ?, default_citation_format = ?, active_exam_target = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        body.user_name || 'Psychology Scholar',
        body.theme || 'light',
        body.default_citation_format || 'APA 7th',
        body.active_exam_target || 'UGC NET Psychology'
      );
      return sendJson(res, 200, { success: true });
    }

    // -------------------------------------------------------------
    // STATIC ASSETS SERVING
    // -------------------------------------------------------------
    let safePath = pathname === '/' ? '/index.html' : pathname;
    const localFilePath = path.join(PUBLIC_DIR, safePath);

    // Prevent directory traversal
    if (!localFilePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    serveStaticFile(res, localFilePath);

  } catch (error) {
    console.error('Server Request Error:', error);
    sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

// Seed DB on boot if needed and listen
seedDatabase();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Psychology Platform Server running on http://localhost:${PORT}`);
});

module.exports = { server, PORT };
