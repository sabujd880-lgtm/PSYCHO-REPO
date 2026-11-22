// server/tests/probeServer.ts
// Live HTTP probe test against server/src/server.ts
import http from 'node:http';
import { spawn } from 'node:child_process';

const NODE_BIN = process.execPath;

function get(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 500, body: data }));
    }).on('error', reject);
  });
}

async function runLiveProbe() {
  console.log('Spawning backend server process...');
  const proc = spawn(NODE_BIN, ['--experimental-strip-types', 'server/src/server.ts'], {
    stdio: 'pipe'
  });

  proc.stdout.on('data', (d) => process.stdout.write(d));
  proc.stderr.on('data', (d) => process.stderr.write(d));

  // Wait for server to boot
  await new Promise(r => setTimeout(r, 2500));

  try {
    const endpoints = [
      '/api/health',
      '/api/version',
      '/api/docs',
      '/api/docs/json',
      '/api/settings',
      '/api/knowledge',
      '/api/knowledge/categories',
      '/api/assessments',
      '/api/clinical/topics',
      '/api/research/papers',
      '/api/exams',
      '/api/teaching/notes'
    ];

    console.log('\nProbing all 12 Phase 1 REST endpoints:');
    for (const ep of endpoints) {
      const res = await get(ep);
      console.log(`[OK ${res.status}] ${ep} (Response length: ${res.body.length} bytes)`);
      if (res.status !== 200) {
        throw new Error(`Endpoint ${ep} returned status ${res.status}`);
      }
    }

    console.log('\nAll 12 live endpoints verified successfully on port 5000!');
  } finally {
    proc.kill('SIGINT');
    console.log('Backend server process closed.');
  }
}

runLiveProbe().catch((err) => {
  console.error('Live probe failed:', err);
  process.exit(1);
});
