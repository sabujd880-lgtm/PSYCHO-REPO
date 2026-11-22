// server/tests/probePhase2.ts
// Live probe verifying that the full server boots up with Phase 2 routes enabled
import http from 'node:http';
import { app } from '../src/app.ts';
import { getDbClient } from '../src/services/prisma.ts';

const prisma = getDbClient();
const PORT = 5099;

async function probe() {
  await prisma.$connect();
  const server = http.createServer((req, res) => app.handle(req, res));

  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Probe server running on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  function get(path: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve) => {
      http.get(`http://127.0.0.1:${PORT}${path}`, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode || 500, body: data }));
      });
    });
  }

  const endpoints = [
    '/api/health',
    '/api/version',
    '/api/docs/json',
    '/api/documents',
    '/api/documents/search?q=psychology',
    '/api/knowledge',
    '/api/settings'
  ];

  console.log('\n--- LIVE HTTP ENDPOINT PROBE ---');
  let ok = true;
  for (const ep of endpoints) {
    const res = await get(ep);
    const pass = res.status === 200;
    console.log(`[${pass ? '200 OK' : res.status}] ${ep}`);
    if (!pass) ok = false;
  }

  server.close();
  await prisma.$disconnect();
  console.log(`\nProbe Complete: ${ok ? 'ALL ENDPOINTS RESPONDED WITH 200 OK' : 'ERRORS DETECTED'}`);
  process.exit(ok ? 0 : 1);
}

probe();

