import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { rolloutSmoke } from './rollout-smoke.mjs';
const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync('dist/build-identity.json', 'utf8'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: ['ignore', 'ignore', 'inherit'] });
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { const response = await fetch('http://127.0.0.1:4173'); if (response.ok) { ready = true; break; } } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Built preview did not start');
  console.log(JSON.stringify(await rolloutSmoke('http://127.0.0.1:4173', { commit, repository: contract.repository, branch: manifest.branch, contract }), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { server.kill('SIGTERM'); }
