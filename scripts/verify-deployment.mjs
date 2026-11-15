import { readPublicUrl } from './curl.mjs';
import { readFileSync } from 'node:fs';
import { verifyDeployment } from './deployment.mjs';
const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const commit = option('--expected-sha');
if (!/^[0-9a-f]{40}$/.test(commit ?? '')) {
  console.error('Usage: npm run verify:deployment -- --expected-sha <full deployed commit> [--url <preview URL>] [--expected-branch <preview branch>]');
  process.exit(2);
}
const read = readPublicUrl;
try {
  const result = await verifyDeployment(option('--url') ?? contract.liveUrl, {
    commit, repository: contract.repository, branch: option('--expected-branch') ?? contract.branch, contract,
  }, read, { strictHtml: args.includes('--strict-html') });
  console.log(JSON.stringify({ url: option('--url') ?? contract.liveUrl, ...result }, null, 2));
  process.exitCode = result.ok ? 0 : 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
