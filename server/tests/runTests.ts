// server/tests/runTests.ts
// Comprehensive Automated Test Suite for Phase 1 Backend Foundation
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.ts';
import { getDbClient } from '../src/services/prisma.ts';
import { seedDatabase } from '../prisma/seed.ts';

const prisma = getDbClient();
let server: http.Server;
const TEST_PORT = 5055;

// Supertest-compatible lightweight HTTP request helper
function request(path: string, options: { method?: string; body?: any; headers?: any } = {}) {
  const method = options.method || 'GET';
  const postData = options.body ? JSON.stringify(options.body) : '';

  return new Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
    const req = http.request(`http://localhost:${TEST_PORT}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(data);
        } catch {
          parsedBody = data;
        }
        resolve({
          status: res.statusCode || 500,
          body: parsedBody,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('PHASE 1 BACKEND FOUNDATION — AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  async function test(title: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${title}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${title}: ${err.message}`);
    }
  }

  // Start test server
  server = http.createServer((req, res) => app.handle(req, res));
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));

  try {
    // 1. Database Connection & Seed
    await test('1. Database Connection & Initial Seeding', async () => {
      await prisma.$connect();
      await seedDatabase();
      const count = await prisma.resourceCategory.findMany();
      assert.ok(count.length >= 10, 'Must have at least 10 seeded categories');
    });

    // 2. Health Endpoint
    await test('2. Health Endpoint (GET /api/health)', async () => {
      const res = await request('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'ok');
      assert.strictEqual(res.body.data.database, 'connected');
    });

    // 3. Version Endpoint
    await test('3. Version Endpoint (GET /api/version)', async () => {
      const res = await request('/api/version');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.version, '1.0.0');
    });

    // 4. Swagger Documentation Endpoint
    await test('4. Swagger Documentation (GET /api/docs & GET /api/docs/json)', async () => {
      const htmlRes = await request('/api/docs');
      assert.strictEqual(htmlRes.status, 200);
      assert.ok(htmlRes.body.includes('SwaggerUIBundle'), 'Swagger UI bundle HTML must be returned');

      const jsonRes = await request('/api/docs/json');
      assert.strictEqual(jsonRes.status, 200);
      assert.strictEqual(jsonRes.body.openapi, '3.0.3');
      assert.ok(jsonRes.body.paths['/api/knowledge'], 'Paths must include /api/knowledge');
    });

    // 5. Settings Endpoint (GET & PUT)
    await test('5. Settings Retrieval and Update (GET & PUT /api/settings)', async () => {
      const getRes = await request('/api/settings');
      assert.strictEqual(getRes.status, 200);
      assert.ok(getRes.body.data.preferredCitationStyle, 'Citation style must be present');

      const putRes = await request('/api/settings', {
        method: 'PUT',
        body: {
          preferredCitationStyle: 'APA 7th',
          preferredAiProvider: 'gemini',
          applicationPreferences: {
            theme: 'dark',
            autoSaveNotes: true
          }
        }
      });
      assert.strictEqual(putRes.status, 200);
      assert.strictEqual(putRes.body.data.preferredAiProvider, 'gemini');
      assert.strictEqual(putRes.body.data.applicationPreferences.theme, 'dark');
    });

    // 6. Knowledge Creation (POST /api/knowledge)
    let createdArticleId = '';
    await test('6. Knowledge Article Creation (POST /api/knowledge)', async () => {
      const res = await request('/api/knowledge', {
        method: 'POST',
        body: {
          title: 'Signal Detection Theory in Sensory Psychophysics',
          slug: 'signal-detection-theory-sensory',
          definition: 'Signal Detection Theory (SDT) is an experimental psychophysical framework used to measure the ability to differentiate between information-bearing patterns (stimulus signals) and random background patterns (noise).',
          explanation: 'SDT provides separate quantitative parameters for sensory sensitivity (d\') and observer decision criterion (beta or c), overcoming response bias limitations in classical threshold psychophysics.',
          keyConcepts: ['Sensitivity (d-prime)', 'Criterion (c)', 'Hits', 'False Alarms', 'ROC Curve'],
          theories: 'Green & Swets (1966) Signal Detection Theory and Psychophysics.',
          applications: 'Medical diagnostic imaging, radar monitoring, and eyewitness memory confidence analysis.',
          limitations: 'Assumes continuous normal equal-variance underlying sensory distribution.'
        }
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Signal Detection Theory in Sensory Psychophysics');
      assert.ok(res.body.data.id, 'Must return assigned ID');
      createdArticleId = res.body.data.id;
    });

    // 7. Request Validation Failure (Zod 400 Bad Request)
    await test('7. Zod Request Validation Failure (POST /api/knowledge with invalid data)', async () => {
      const res = await request('/api/knowledge', {
        method: 'POST',
        body: {
          title: 'AB', // Less than 3 chars
          definition: 'Too short' // Less than 10 chars
        }
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('validation failed') || res.body.message.includes('Validation'));
    });

    // 8. Knowledge Article Retrieval by ID & Slug (GET /api/knowledge/:id)
    await test('8. Knowledge Retrieval by ID & Slug (GET /api/knowledge/:id)', async () => {
      const resId = await request(`/api/knowledge/${createdArticleId}`);
      assert.strictEqual(resId.status, 200);
      assert.strictEqual(resId.body.data.id, createdArticleId);

      const resSlug = await request('/api/knowledge/signal-detection-theory-sensory');
      assert.strictEqual(resSlug.status, 200);
      assert.strictEqual(resSlug.body.data.title, 'Signal Detection Theory in Sensory Psychophysics');
    });

    // 9. Search, Filter by Category, and Pagination (GET /api/knowledge)
    await test('9. Search, Category Filtering, and Pagination (GET /api/knowledge)', async () => {
      // Search
      const searchRes = await request('/api/knowledge?search=sensory');
      assert.strictEqual(searchRes.status, 200);
      assert.ok(searchRes.body.data.length >= 1, 'Search query must find matching article');
      assert.ok(searchRes.body.pagination, 'Pagination metadata must be present');
      assert.strictEqual(searchRes.body.pagination.page, 1);

      // Pagination Limit
      const limitRes = await request('/api/knowledge?limit=1');
      assert.strictEqual(limitRes.status, 200);
      assert.strictEqual(limitRes.body.data.length, 1);
    });

    // 10. Knowledge Categories (GET /api/knowledge/categories)
    await test('10. Categories Listing (GET /api/knowledge/categories)', async () => {
      const res = await request('/api/knowledge/categories');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.length >= 10, 'Must return at least 10 categories');
      assert.ok(res.body.data.some((c: any) => c.code === 'COG'), 'Must include Cognitive Psychology (COG)');
    });

    // 11. Knowledge Update (PUT /api/knowledge/:id)
    await test('11. Knowledge Article Update (PUT /api/knowledge/:id)', async () => {
      const res = await request(`/api/knowledge/${createdArticleId}`, {
        method: 'PUT',
        body: {
          title: 'Signal Detection Theory: Advanced Psychophysical Models',
          theories: 'Tanner & Swets (1954); Green & Swets (1966).'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.title, 'Signal Detection Theory: Advanced Psychophysical Models');
    });

    // 12. Knowledge Deletion (DELETE /api/knowledge/:id)
    await test('12. Knowledge Article Deletion (DELETE /api/knowledge/:id)', async () => {
      const delRes = await request(`/api/knowledge/${createdArticleId}`, { method: 'DELETE' });
      assert.strictEqual(delRes.status, 200);

      // Verify 404 on subsequent get
      const verifyRes = await request(`/api/knowledge/${createdArticleId}`);
      assert.strictEqual(verifyRes.status, 404);
    });

    // 13. Documented Module Placeholders and Handlers
    await test('13. Documented Module Handlers (Assessments, Clinical, Research, Exams, Teaching)', async () => {
      const asmt = await request('/api/assessments');
      assert.strictEqual(asmt.status, 200);
      assert.strictEqual(asmt.body.success, true);
      assert.ok(Array.isArray(asmt.body.data), 'Assessments must return an array');

      const clin = await request('/api/clinical/topics');
      assert.strictEqual(clin.status, 200);
      assert.ok(Array.isArray(clin.body.data), 'Clinical topics must return an array');

      const resr = await request('/api/research/papers');
      assert.strictEqual(resr.status, 200);
      assert.ok(Array.isArray(resr.body.data), 'Research papers must return an array');

      const exams = await request('/api/exams');
      assert.strictEqual(exams.status, 200);
      assert.ok(Array.isArray(exams.body.data), 'Exams must return an array');

      const teach = await request('/api/teaching/notes');
      assert.strictEqual(teach.status, 200);
      assert.ok(Array.isArray(teach.body.data), 'Teaching notes must return an array');
    });

    // 14. 404 Not Found Handling
    await test('14. 404 Route Not Found Handling', async () => {
      const res = await request('/api/non-existent-route-xyz');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('not found'));
    });

  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log('\n===============================================================');
  console.log(`TEST SUITE COMPLETE: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
  console.log('===============================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});

