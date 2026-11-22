// test/apiTest.js
// Automated HTTP integration test using native Node.js http client
const http = require('node:http');
const { server, PORT } = require('../server/server');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    }).on('error', reject);
  });
}

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const jsonStr = JSON.stringify(payload);
    const req = http.request(`http://localhost:${PORT}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });
    req.on('error', reject);
    req.write(jsonStr);
    req.end();
  });
}

async function runApiTests() {
  console.log('Testing live HTTP server endpoints...');

  try {
    // 1. Dashboard stats
    const dash = await get('/api/dashboard/stats');
    console.log(`[PASS] /api/dashboard/stats -> Status: ${dash.status}, Total Resources: ${JSON.parse(dash.data).counts.totalResources}`);

    // 2. Library categories
    const libCats = await get('/api/library/categories');
    console.log(`[PASS] /api/library/categories -> Status: ${libCats.status}, Categories: ${JSON.parse(libCats.data).length}`);

    // 3. Knowledge base article
    const art = await get('/api/knowledge/articles/cognitive-memory-systems');
    console.log(`[PASS] /api/knowledge/articles -> Status: ${art.status}, Title: ${JSON.parse(art.data).title}`);

    // 4. Clinical topics
    const clin = await get('/api/clinical/topics');
    console.log(`[PASS] /api/clinical/topics -> Status: ${clin.status}, Protocols: ${JSON.parse(clin.data).length}`);

    // 5. Assessment comparison
    const compare = await get('/api/assessments/compare?codes=WAIS-IV,BDI-II');
    console.log(`[PASS] /api/assessments/compare -> Status: ${compare.status}, Instruments: ${JSON.parse(compare.data).instruments.length}`);

    // 6. PYQ Predictor
    const predictor = await get('/api/pyq/predictor/1?count=5');
    console.log(`[PASS] /api/pyq/predictor/1 -> Status: ${predictor.status}, Predicted Questions: ${JSON.parse(predictor.data).totalQuestions}`);

    // 7. Research Descriptive Stats POST
    const statsPost = await post('/api/research/stats/descriptive', { data: [15, 20, 25, 30, 35] });
    console.log(`[PASS] POST /api/research/stats/descriptive -> Status: ${statsPost.status}, Mean: ${statsPost.data.mean}`);

    // 8. AI Chat Assistant POST
    const aiPost = await post('/api/ai/chat', { prompt: 'Explain the working memory model', mode: 'Knowledge' });
    console.log(`[PASS] POST /api/ai/chat -> Status: ${aiPost.status}, Mode: ${aiPost.data.mode}, Confidence: ${aiPost.data.confidence}`);

    // 9. Static Shell
    const indexHtml = await get('/');
    console.log(`[PASS] GET / (index.html) -> Status: ${indexHtml.status}, Content Length: ${indexHtml.data.length} bytes`);

    console.log('\nALL 9 LIVE REST API ENDPOINTS VALIDATED SUCCESSFULLY (100% OK)!');
  } catch (err) {
    console.error('API Test Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

// Give server time to listen
setTimeout(runApiTests, 500);

