// server/tests/phase2.test.ts
// Comprehensive automated test suite for Phase 2: Document Intelligence Engine
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ExpressApp } from '../src/app.ts';
import { getDbClient } from '../src/services/prisma.ts';

const PORT = 5022;
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
  console.log('====================================================');
  console.log('  STARTING PHASE 2 DOCUMENT INTELLIGENCE TEST SUITE ');
  console.log('====================================================\n');

  const app = new ExpressApp();
  const db = getDbClient();
  await db.$connect();

  server = http.createServer((req, res) => app.handle(req, res));

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      console.log(`Test server running on ${baseUrl}\n`);
      resolve();
    });
  });

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Upload TXT Document
    // ----------------------------------------------------
    const txtContent = `Cognitive Behavioral Therapy (CBT) for Depressive Disorders.
Aaron T. Beck (1979) established cognitive therapy on the premise that negative automatic thoughts and cognitive distortions contribute to affective distress.
Core components include behavioral activation, thought records, cognitive restructuring, and core belief modification.

Psychometric validity of the Beck Depression Inventory (BDI-II) demonstrates high internal consistency (alpha = 0.92) across outpatient populations.`;

    const txtRes = await makeRequest('POST', '/api/documents/upload', {
      filename: 'beck_cbt_manual.txt',
      mimeType: 'text/plain',
      content: Buffer.from(txtContent, 'utf-8').toString('base64')
    });

    assert(txtRes.status === 201, 'POST /api/documents/upload (TXT format)', JSON.stringify(txtRes.data));
    const txtDoc = txtRes.data.data;
    const txtDocId = txtDoc.id;
    assert(txtDoc.processingStatus === 'COMPLETED', 'TXT Document status is COMPLETED');
    assert(txtDoc.pageCount >= 1, `TXT Document pageCount is ${txtDoc.pageCount}`);
    assert(Array.isArray(txtDoc.keyConcepts) && txtDoc.keyConcepts.length > 0, 'TXT Document extracted psychological concepts');

    // ----------------------------------------------------
    // TEST 2: Upload CSV Dataset
    // ----------------------------------------------------
    const csvContent = `PatientID,Age,Gender,BDI_Pre,BDI_Post,Outcome
P001,34,F,28,12,Remission
P002,45,M,32,18,Partial Response
P003,29,F,24,8,Remission
P004,52,M,36,22,Partial Response
P005,41,F,30,10,Remission`;

    const csvRes = await makeRequest('POST', '/api/documents/upload', {
      filename: 'clinical_outcomes.csv',
      mimeType: 'text/csv',
      content: Buffer.from(csvContent, 'utf-8').toString('base64')
    });

    assert(csvRes.status === 201, 'POST /api/documents/upload (CSV format)');
    const csvDoc = csvRes.data.data;
    const csvDocId = csvDoc.id;
    assert(csvDoc.fileType === 'CSV', `CSV Document fileType detected as ${csvDoc.fileType}`);

    // ----------------------------------------------------
    // TEST 3: Upload Image with Simulated OCR
    // ----------------------------------------------------
    // Create a 1x1 minimal PNG buffer
    const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const imgRes = await makeRequest('POST', '/api/documents/upload', {
      filename: 'neuropsych_scan.png',
      mimeType: 'image/png',
      content: minimalPng.toString('base64')
    });

    assert(imgRes.status === 201, 'POST /api/documents/upload (Image format with OCR)');
    const imgDoc = imgRes.data.data;
    assert(imgDoc.ocrApplied === true, 'Image document flagged with ocrApplied: true');
    assert(imgDoc.fileType === 'IMAGE', 'Image document fileType is IMAGE');

    // ----------------------------------------------------
    // TEST 4: List Documents
    // ----------------------------------------------------
    const listRes = await makeRequest('GET', '/api/documents');
    assert(listRes.status === 200, 'GET /api/documents returns 200');
    assert(Array.isArray(listRes.data.data) && listRes.data.data.length >= 3, 'GET /api/documents lists all uploaded files');

    // ----------------------------------------------------
    // TEST 5: Get Document By ID with Pages
    // ----------------------------------------------------
    const getRes = await makeRequest('GET', `/api/documents/${txtDocId}`);
    assert(getRes.status === 200, 'GET /api/documents/:id returns 200');
    assert(Array.isArray(getRes.data.data.pages) && getRes.data.data.pages.length > 0, 'GET /api/documents/:id includes document pages');

    // ----------------------------------------------------
    // TEST 6: Get Document Processing Status
    // ----------------------------------------------------
    const statusRes = await makeRequest('GET', `/api/documents/${txtDocId}/status`);
    assert(statusRes.status === 200, 'GET /api/documents/:id/status returns 200');
    assert(statusRes.data.data.processingStatus === 'COMPLETED', 'Status reports COMPLETED');

    // ----------------------------------------------------
    // TEST 7: Get Document Pages
    // ----------------------------------------------------
    const pagesRes = await makeRequest('GET', `/api/documents/${txtDocId}/pages`);
    assert(pagesRes.status === 200, 'GET /api/documents/:id/pages returns 200');
    assert(pagesRes.data.data[0].pageNumber === 1, 'First page has pageNumber: 1');

    // ----------------------------------------------------
    // TEST 8: Full-Text Document Search
    // ----------------------------------------------------
    const searchRes = await makeRequest('GET', '/api/documents/search?q=cognitive');
    assert(searchRes.status === 200, 'GET /api/documents/search returns 200');
    assert(searchRes.data.data.results.length > 0, 'Search finds keyword "cognitive" in document chunks');
    assert(typeof searchRes.data.data.results[0].snippet === 'string', 'Search result includes contextual snippet');

    // ----------------------------------------------------
    // TEST 9: Grounded Single-Document Q&A
    // ----------------------------------------------------
    const askRes = await makeRequest('POST', `/api/documents/${txtDocId}/ask`, {
      query: 'What did Beck propose regarding cognitive therapy and automatic thoughts?'
    });
    assert(askRes.status === 200, 'POST /api/documents/:id/ask returns 200');
    assert(askRes.data.data.groundingStatus === 'DOCUMENT_GROUNDED', 'Grounding status is DOCUMENT_GROUNDED');
    assert(Array.isArray(askRes.data.data.citations) && askRes.data.data.citations.length > 0, 'Grounded Q&A provides page-level citations');
    const firstCit = askRes.data.data.citations[0];
    assert(firstCit.pageNumber === 1, `Citation page number is accurate: ${firstCit.pageNumber}`);
    assert(firstCit.excerpt.length > 10, 'Citation includes direct verbatim excerpt');

    // ----------------------------------------------------
    // TEST 10: Multi-Document Q&A
    // ----------------------------------------------------
    const multiAskRes = await makeRequest('POST', '/api/documents/ask-multiple', {
      query: 'Compare the depression assessment criteria between the documents',
      documentIds: [txtDocId, csvDocId]
    });
    assert(multiAskRes.status === 200, 'POST /api/documents/ask-multiple returns 200');
    assert(multiAskRes.data.data.multiDocumentComparison === true, 'multiDocumentComparison flag is true');

    // ----------------------------------------------------
    // TEST 11: Document Summarization (Multiple Types)
    // ----------------------------------------------------
    const sumDetailed = await makeRequest('POST', `/api/documents/${txtDocId}/summarize`, {
      type: 'detailed'
    });
    assert(sumDetailed.status === 200, 'POST /api/documents/:id/summarize (detailed)');
    assert(sumDetailed.data.data.summary.length > 50, 'Detailed summary generated');

    const sumDefinitions = await makeRequest('POST', `/api/documents/${txtDocId}/summarize`, {
      type: 'definitions'
    });
    assert(sumDefinitions.status === 200, 'POST /api/documents/:id/summarize (definitions)');
    assert(sumDefinitions.data.data.summary.includes('Key Psychological Definitions'), 'Definitions format correctly generated');

    // ----------------------------------------------------
    // TEST 12: Practice Question Generation (MCQ & Case-Based)
    // ----------------------------------------------------
    const qMcq = await makeRequest('POST', `/api/documents/${txtDocId}/questions`, {
      type: 'mcq',
      count: 3
    });
    assert(qMcq.status === 200, 'POST /api/documents/:id/questions (MCQ)');
    assert(qMcq.data.data.questions.length === 3, 'Generates requested question count (3)');
    assert(Array.isArray(qMcq.data.data.questions[0].options), 'MCQ contains answer options');
    assert(typeof qMcq.data.data.questions[0].pageCitation === 'number', 'Question includes grounded page citation');

    const qCase = await makeRequest('POST', `/api/documents/${txtDocId}/questions`, {
      type: 'case_based',
      count: 2
    });
    assert(qCase.status === 200, 'POST /api/documents/:id/questions (Case-based)');
    assert(qCase.data.data.questions[0].type === 'Clinical / Case-based', 'Generates case vignette question');

    // ----------------------------------------------------
    // TEST 13: Re-process Document Endpoint
    // ----------------------------------------------------
    const reprocRes = await makeRequest('POST', `/api/documents/${txtDocId}/process`);
    assert(reprocRes.status === 200, 'POST /api/documents/:id/process re-processes document');

    // ----------------------------------------------------
    // TEST 14: Delete Document
    // ----------------------------------------------------
    const delRes = await makeRequest('DELETE', `/api/documents/${csvDocId}`);
    assert(delRes.status === 200, 'DELETE /api/documents/:id returns 200');
    assert(delRes.data.data.deleted === true, 'DELETE reports deleted: true');

    const verifyDel = await makeRequest('GET', `/api/documents/${csvDocId}`);
    assert(verifyDel.status === 404, 'Verified document is deleted and returns 404');

    // ----------------------------------------------------
    // TEST 15: Swagger Documentation Spec
    // ----------------------------------------------------
    const docRes = await makeRequest('GET', '/api/docs/json');
    assert(docRes.status === 200, 'GET /api/docs/json returns 200');
    assert(Boolean(docRes.data.paths['/api/documents/upload']), 'OpenAPI spec includes /api/documents/upload');
    assert(Boolean(docRes.data.paths['/api/documents/{id}/ask']), 'OpenAPI spec includes /api/documents/{id}/ask');

  } catch (err: any) {
    console.error('Fatal test execution error:', err);
  } finally {
    server.close();
    await db.$disconnect();
    console.log(`\n====================================================`);
    console.log(`  PHASE 2 TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`====================================================\n`);

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

runTests();

