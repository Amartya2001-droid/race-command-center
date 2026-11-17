import { readFileSync } from 'node:fs';
import { rolloutSmoke } from './rollout-smoke.mjs';
import { verifyDeployment } from './deployment.mjs';
import { readPublicUrl } from './curl.mjs';
import { collectAcceptance, writeAcceptance } from './acceptance.mjs';
const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const commit = option('--expected-sha');
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) { console.error('--expected-sha <full deployed commit> is required'); process.exit(2); }
try {
  const report = await collectAcceptance({ url: option('--url') ?? contract.liveUrl,
    expected: { commit, repository: contract.repository, branch: option('--expected-branch') ?? contract.branch, contract },
    verify: (url, expected) => verifyDeployment(url, expected, readPublicUrl), smoke: rolloutSmoke });
  const reportPath = writeAcceptance(report, option('--report'));
  console.log(JSON.stringify({ reportPath, ...report }, null, 2));
  process.exitCode = report.outcome === 'passed' ? 0 : 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
