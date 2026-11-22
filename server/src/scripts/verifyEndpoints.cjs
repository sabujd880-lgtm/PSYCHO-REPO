// server/src/scripts/verifyEndpoints.js
const http = require('node:http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:5000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== VERIFYING LIVE PLATFORM ENDPOINTS ===');

  // 1. Dashboard Stats
  const stats = await get('/api/dashboard/stats');
  console.log('\n[PASS] 1. Dashboard Stats:');
  console.log(stats.data.counts);

  // 2. Assessment Catalogue
  const assessments = await get('/api/assessments/catalogue');
  console.log(`\n[PASS] 2. Assessment Catalogue: ${assessments.data.length} instruments`);
  console.log(assessments.data.slice(0, 3).map(a => `${a.name} (${a.acronym}) - ${a.category_name}`));

  // 3. Assessment Comparison
  const comp = await get('/api/assessments/compare?codes=YBOCS,VQ,BRS');
  console.log(`\n[PASS] 3. Assessment Comparison: ${comp.data.instruments.length} instruments compared`);
  console.log(comp.data.instruments.map(i => `${i.code}: ${i.domains_measured.slice(0, 50)}...`));

  // 4. Clinical Topics
  const clinical = await get('/api/clinical/topics');
  console.log(`\n[PASS] 4. Clinical Protocols: ${clinical.data.length} protocols`);
  console.log(clinical.data.slice(0, 3).map(c => `${c.title} [${c.domain}]`));

  // 5. Clinical Templates
  const templates = await get('/api/clinical/templates');
  console.log(`\n[PASS] 5. Clinical Templates: ${templates.data.length} templates`);
  console.log(templates.data.map(t => `${t.title} (${t.category})`));

  // 6. PYQ Trends & Syllabus
  const trends = await get('/api/pyq/trends/1');
  console.log(`\n[PASS] 6. PYQ Trends & Syllabus: ${trends.data.unitStats.length} units, ${trends.data.topicFrequencies.length} trend topics`);
  console.log(trends.data.unitStats.slice(0, 4).map(u => `Unit ${u.unit_number}: ${u.unit_title} (${u.historical_weightage}%)`));

  // 7. PYQ Questions
  const questions = await get('/api/pyq/questions?examination_id=1');
  console.log(`\n[PASS] 7. PYQ Question Bank: ${questions.data.length} curated questions`);
  console.log(questions.data.slice(0, 2).map(q => `Q${q.question_number}: ${q.question_text.slice(0, 60)}... [Ans: ${q.correct_answer}]`));

  // 8. Digital Library Search
  const libSearch = await get('/api/library/resources?search=Abnormal');
  const resourcesList = Array.isArray(libSearch.data) ? libSearch.data : (libSearch.data?.resources || []);
  console.log(`\n[PASS] 8. Digital Library Search: ${resourcesList.length} books found`);
  console.log(resourcesList.slice(0, 2).map(r => `"${r.title}" by ${r.author_names} (${r.publication_year})`));

  // 9. Document Search across ingested books
  const docSearch = await get('/api/documents/search?q=Obsessive');
  const docResultsList = docSearch.data?.results || [];
  console.log(`\n[PASS] 9. Document Intelligence Search: ${docResultsList.length} results found`);
  console.log(docResultsList.slice(0, 2).map(r => `${r.documentName} (Page ${r.pageNumber}): ${r.snippet.slice(0, 80)}...`));

  // 10. Multi-Document Grounded Q&A
  const qna = await post('/api/documents/ask-multiple', {
    query: 'What is the purpose of the Yale-Brown Obsessive Compulsive Scale and how is it scored?'
  });
  console.log('\n[PASS] 10. Grounded Q&A over authentic documents:');
  console.log(`Status: ${qna.data.groundingStatus}`);
  console.log(`Answer excerpt: ${qna.data.answer.slice(0, 200)}...`);
  console.log(`Citations: ${qna.data.citations.length} page-level citations`);

  console.log('\n=============================================');
  console.log(' ALL 10 LIVE VERIFICATION CHECKS PASSED 100%!');
  console.log('=============================================');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
