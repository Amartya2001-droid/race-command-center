import { readFileSync } from 'node:fs';
import { rolloutSmoke } from './rollout-smoke.mjs';
const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const commit = option('--expected-sha');
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) { console.error('--expected-sha <full deployed commit> is required'); process.exit(2); }
try {
  const report = await rolloutSmoke(option('--url') ?? contract.liveUrl, { commit, repository: contract.repository, branch: option('--expected-branch') ?? contract.branch, contract });
  console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
