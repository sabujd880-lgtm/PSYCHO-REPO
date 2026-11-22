// server/tests/phase3.test.ts
// Comprehensive Automated Test Suite for Phase 3: Psychology Knowledge Base & Digital Library Engine
import http from 'node:http';
import assert from 'node:assert';
import { ExpressApp } from '../src/app.ts';
import { getDbClient } from '../src/services/prisma.ts';
import { seedDatabase } from '../prisma/seed.ts';

const PORT = 5033;
let server: http.Server;
let baseUrl: string;

function makeRequest(method: string, endpoint: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', chunk => { rawData += chunk; });
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({ status: res.statusCode || 500, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  STARTING PHASE 3 KNOWLEDGE BASE & DIGITAL LIBRARY TEST SUITE  ');
  console.log('================================================================\n');

  const app = new ExpressApp();
  server = http.createServer((req, res) => app.handle(req, res));

  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${PORT}`;
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  try {
    // Setup: Seed the database
    await seedDatabase();

    // -------------------------------------------------------------
    // SECTION 1: KNOWLEDGE BASE MODULE
    // -------------------------------------------------------------
    console.log('\n--- 1. Knowledge Base Categories & Relations ---');

    await test('GET /api/knowledge/categories returns 10 standard disciplines', async () => {
      const res = await makeRequest('GET', '/api/knowledge/categories');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 10);
      const codes = res.data.data.map((c: any) => c.code);
      assert.ok(codes.includes('GEN'));
      assert.ok(codes.includes('COG'));
      assert.ok(codes.includes('CLN'));
      assert.ok(codes.includes('PSY'));
    });

    await test('GET /api/knowledge/relations returns topic network graph', async () => {
      const res = await makeRequest('GET', '/api/knowledge/relations');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 5);
      const first = res.data.data[0];
      assert.ok(first.source_topic, 'Relation must have source_topic');
      assert.ok(first.target_topic, 'Relation must have target_topic');
      assert.ok(first.relation_type, 'Relation must have relation_type');
    });

    console.log('\n--- 2. Structured Articles & 17 Standard Dimensions ---');

    let sampleArticleId = '';

    await test('GET /api/knowledge/articles returns structured list of articles', async () => {
      const res = await makeRequest('GET', '/api/knowledge/articles');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 10);
      const art = res.data.data[0];
      assert.ok(art.topic_id || art.id, 'Article must have topic_id or id');
      assert.ok(art.category, 'Article must have category');
      assert.ok(art.title, 'Article must have title');
      sampleArticleId = art.id || art.topic_id;
    });

    await test('GET /api/knowledge (alias route) returns articles list', async () => {
      const res = await makeRequest('GET', '/api/knowledge');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 10);
    });

    await test('GET /api/knowledge/articles/working-memory-architecture provides all 17 structured dimensions', async () => {
      const res = await makeRequest('GET', '/api/knowledge/articles/working-memory-architecture');
      assert.strictEqual(res.status, 200);
      const art = res.data.data;
      assert.ok(art, 'Article detail must exist');
      assert.strictEqual(art.slug, 'working-memory-architecture');
      assert.strictEqual(art.verified_status, 'Verified Scholarly');

      // 17 Standard Structured Dimensions verification
      assert.ok(art.definition, '1. Definition must exist');
      assert.ok(art.introduction, '2. Academic introduction must exist');
      assert.ok(art.historical_background, '3. Historical background must exist');
      assert.ok(art.key_theorists, '4. Key theorists must exist');
      assert.ok(Array.isArray(art.key_theorists) && art.key_theorists.length > 0, 'Key theorists must be an array');
      assert.ok(art.major_theories, '5. Major theories must exist');
      assert.ok(art.core_concepts, '6. Core concepts must exist');
      assert.ok(art.principles, '7. Principles must exist');
      assert.ok(art.classification, '8. Classification must exist');
      assert.ok(art.models, '9. Models must exist');
      assert.ok(art.applications, '10. Real-world applications must exist');
      assert.ok(art.clinical_relevance, '11. Clinical relevance must exist');
      assert.ok(art.research_evidence, '12. Research evidence must exist');
      assert.ok(art.examples, '13. Examples must exist');
      assert.ok(art.limitations, '14. Limitations must exist');
      assert.ok(Array.isArray(art.relatedTopics), '15. Related topics must be an array');
      assert.ok(art.references_citations, '16. References & citations must exist');
      assert.ok(art.recommended_reading, '17. Recommended reading must exist');
    });

    await test('GET /api/knowledge/articles/working-memory-architecture/citation returns all 6 academic citation styles', async () => {
      const res = await makeRequest('GET', '/api/knowledge/articles/working-memory-architecture/citation');
      assert.strictEqual(res.status, 200);
      const c = res.data.data;
      assert.ok(c.apa, 'Must contain APA 7th');
      assert.ok(c.apa.includes('Baddeley') || c.apa.includes('Working Memory'), 'APA must cite Baddeley or title');
      assert.ok(c.bibtex, 'Must contain BibTeX');
      assert.ok(c.bibtex.startsWith('@'), 'BibTeX must start with @');
      assert.ok(c.mla, 'Must contain MLA 9th');
      assert.ok(c.chicago, 'Must contain Chicago 17th');
      assert.ok(c.vancouver, 'Must contain Vancouver style');
      assert.ok(c.ris, 'Must contain RIS export format');
      assert.ok(c.ris.includes('TY  -'), 'RIS must contain TY tag');
      assert.ok(c.ris.includes('ER  -'), 'RIS must contain ER tag');
    });

    console.log('\n--- 3. Article Creation, Update & Deletion ---');

    let createdArticleId = '';

    await test('POST /api/knowledge creates a new structured article', async () => {
      const payload = {
        title: 'Cognitive Appraisal Theory of Emotion',
        slug: 'cognitive-appraisal-theory-emotion',
        definition: 'Cognitive Appraisal Theory posits that emotions are extracted from our evaluations (appraisals) of events that cause specific reactions in different people.',
        explanation: 'Richard Lazarus proposed that appraisal occurs in two stages: Primary Appraisal (relevance to personal well-being) and Secondary Appraisal (coping resources).',
        introduction: 'Appraisal theories of emotion emphasize that cognitive evaluation mediates between environmental stimuli and emotional reactions.',
        keyConcepts: ['Primary Appraisal', 'Secondary Appraisal', 'Coping Resources', 'Core Relational Themes'],
        keyTheorists: ['Richard S. Lazarus', 'Magda B. Arnold', 'Klaus Scherer'],
        majorTheories: 'Lazarus Cognitive-Mediational Theory; Arnold Appraisal Framework; Scherer Component Process Model.',
        applications: 'Stress management counseling, emotional regulation training, organizational coping strategies.',
        limitations: 'May overstate conscious cognitive deliberation prior to rapid autonomic amygdala responses (Zajonc affective primacy critique).'
      };

      const res = await makeRequest('POST', '/api/knowledge', payload);
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.data.id);
      assert.strictEqual(res.data.data.title, 'Cognitive Appraisal Theory of Emotion');
      createdArticleId = res.data.data.id;
    });

    await test('PUT /api/knowledge/:id updates article fields', async () => {
      const res = await makeRequest('PUT', `/api/knowledge/${createdArticleId}`, {
        applications: 'Updated application: Comprehensive emotional resilience workshops and clinical mindfulness protocols.'
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.applications.includes('mindfulness protocols'));
    });

    await test('DELETE /api/knowledge/:id deletes article successfully', async () => {
      const res = await makeRequest('DELETE', `/api/knowledge/${createdArticleId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.deleted, true);

      // Verify not found
      const getRes = await makeRequest('GET', `/api/knowledge/${createdArticleId}`);
      assert.strictEqual(getRes.status, 404);
    });

    // -------------------------------------------------------------
    // SECTION 2: DIGITAL LIBRARY MODULE
    // -------------------------------------------------------------
    console.log('\n--- 4. Digital Library Categories & Resources ---');

    await test('GET /api/library/categories returns resource categories', async () => {
      const res = await makeRequest('GET', '/api/library/categories');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 10);
    });

    let sampleResourceId = '';

    await test('GET /api/library/resources returns curated academic references', async () => {
      const res = await makeRequest('GET', '/api/library/resources');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 12, 'Must have at least 12 seeded library resources');

      const r = res.data.data[0];
      assert.ok(r.id, 'Resource must have id');
      assert.ok(r.title, 'Resource must have title');
      assert.ok(r.author_names, 'Resource must have author_names');
      assert.ok(r.publication_year, 'Resource must have publication_year');
      assert.ok(r.publication_type, 'Resource must have publication_type');
      assert.ok(r.citation_apa, 'Resource must have formatted citation_apa');
      assert.strictEqual(r.is_verified, true, 'Seeded resources should be verified');
      sampleResourceId = r.id;
    });

    console.log('\n--- 5. Library Filtering & Search ---');

    await test('GET /api/library/resources?publication_type=Manual filters accurately', async () => {
      const res = await makeRequest('GET', '/api/library/resources?publication_type=Manual');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length >= 2);
      for (const item of res.data.data) {
        assert.strictEqual(item.publication_type, 'Manual');
      }
    });

    await test('GET /api/library/resources?verified=1 returns verified scholarly resources', async () => {
      const res = await makeRequest('GET', '/api/library/resources?verified=1');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length >= 10);
      for (const item of res.data.data) {
        assert.strictEqual(item.is_verified, true);
      }
    });

    await test('GET /api/library/resources?search=Kandel finds Principles of Neural Science', async () => {
      const res = await makeRequest('GET', '/api/library/resources?search=Kandel');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length >= 1);
      assert.ok(res.data.data[0].title.includes('Neural Science'));
    });

    await test('GET /api/library/resources/:id returns single resource with full details', async () => {
      const res = await makeRequest('GET', `/api/library/resources/${sampleResourceId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.id, sampleResourceId);
      assert.ok(res.data.data.citation_apa);
      assert.ok(res.data.data.citation_bibtex);
    });

    console.log('\n--- 6. Library Citation Engine ---');

    await test('GET /api/library/resources/:id/citation generates all 6 citation styles', async () => {
      const res = await makeRequest('GET', `/api/library/resources/${sampleResourceId}/citation`);
      assert.strictEqual(res.status, 200);
      const c = res.data.data;
      assert.ok(c.apa, 'APA citation must be present');
      assert.ok(c.bibtex, 'BibTeX citation must be present');
      assert.ok(c.mla, 'MLA citation must be present');
      assert.ok(c.chicago, 'Chicago citation must be present');
      assert.ok(c.vancouver, 'Vancouver citation must be present');
      assert.ok(c.ris, 'RIS export must be present');
      assert.ok(c.bibtex.startsWith('@'), 'BibTeX must format correctly');
    });

    console.log('\n--- 7. Library Resource CRUD Operations ---');

    let createdResourceId = '';

    await test('POST /api/library/resources creates new resource with auto-generated citations', async () => {
      const payload = {
        title: 'Social Foundations of Thought and Action: A Social Cognitive Theory',
        author_names: 'Albert Bandura',
        publication_year: 1986,
        publisher: 'Prentice-Hall',
        publication_type: 'Book',
        is_verified: true,
        subject: 'Social Cognitive Psychology',
        abstract: 'Bandura formalizes reciprocal determinism, observational learning, vicarious reinforcement, and self-efficacy mechanisms.'
      };

      const res = await makeRequest('POST', '/api/library/resources', payload);
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.data.id);
      assert.strictEqual(res.data.data.title, payload.title);
      assert.ok(res.data.data.citation_apa.includes('Bandura, Albert') || res.data.data.citation_apa.includes('1986'));
      createdResourceId = res.data.data.id;
    });

    await test('PUT /api/library/resources/:id updates resource', async () => {
      const res = await makeRequest('PUT', `/api/library/resources/${createdResourceId}`, {
        publisher: 'Prentice-Hall International Edition'
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.publisher, 'Prentice-Hall International Edition');
    });

    await test('DELETE /api/library/resources/:id deletes resource', async () => {
      const res = await makeRequest('DELETE', `/api/library/resources/${createdResourceId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.deleted, true);

      // Verify deletion
      const getRes = await makeRequest('GET', `/api/library/resources/${createdResourceId}`);
      assert.strictEqual(getRes.status, 404);
    });

    // -------------------------------------------------------------
    // SECTION 3: BOOKMARKS & DASHBOARD INTEGRATION
    // -------------------------------------------------------------
    console.log('\n--- 8. Bookmarks & Dashboard Integration ---');

    let createdBookmarkId = '';

    await test('GET /api/library/bookmarks returns saved bookmarks', async () => {
      const res = await makeRequest('GET', '/api/library/bookmarks');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 2);
    });

    await test('POST /api/library/bookmarks creates a study bookmark', async () => {
      const res = await makeRequest('POST', '/api/library/bookmarks', {
        item_type: 'resource',
        item_id: sampleResourceId,
        title: 'Core Textbook Bookmark',
        notes: 'Review chapters 3 & 4 for upcoming mock test',
        category: 'Neuropsychology'
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.data.id);
      createdBookmarkId = res.data.data.id;
    });

    await test('DELETE /api/library/bookmarks/:id removes bookmark', async () => {
      const res = await makeRequest('DELETE', `/api/library/bookmarks/${createdBookmarkId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.deleted, true);
    });

    await test('GET /api/dashboard/stats provides live aggregated platform metrics', async () => {
      const res = await makeRequest('GET', '/api/dashboard/stats');
      assert.strictEqual(res.status, 200);
      const data = res.data.data;
      assert.ok(data.counts, 'Counts object must exist');
      assert.ok(data.counts.totalResources >= 12, 'totalResources must be >= 12');
      assert.ok(data.counts.totalArticles >= 10, 'totalArticles must be >= 10');
      assert.ok(data.counts.totalAssessments >= 25, 'totalAssessments must be >= 25');
      assert.ok(Array.isArray(data.recentResources), 'recentResources must be an array');
      assert.ok(data.recentResources.length > 0, 'recentResources must contain entries');
      assert.ok(Array.isArray(data.recentDocs), 'recentDocs must be an array');
    });

    await test('GET /api/search returns cross-module results (Knowledge Articles & Library)', async () => {
      const res = await makeRequest('GET', '/api/search?q=Working');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data.results));
      assert.ok(res.data.data.results.length >= 1);
      const types = res.data.data.results.map((r: any) => r.type);
      assert.ok(types.includes('Knowledge Article') || types.includes('Digital Library'));
    });

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  PHASE 3 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (${totalTestCount(passed, failed)} TOTAL)`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

function totalTestCount(p: number, f: number) {
  return p + f;
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Exception:', err);
  if (server) server.close();
  process.exit(1);
});

