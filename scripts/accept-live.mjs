import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { OWNER_HELP, OwnerUsageError, parseOwnerArgs, runOwnerAcceptance } from './owner-acceptance.mjs';

try {
  const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8'));
  const options = parseOwnerArgs(process.argv.slice(2), contract);
  if (options.help) console.log(OWNER_HELP);
  else {
    if (Number(process.versions.node.split('.')[0]) < 22) throw new OwnerUsageError('Node.js 22 or newer is required');
    try { execFileSync('curl', ['--version'], { stdio: 'ignore' }); }
    catch { throw new OwnerUsageError('curl is required; install it before running acceptance'); }
    const [{ verifyDeployment }, { readPublicUrl }, { rolloutSmoke }] = await Promise.all([
      import('./deployment.mjs'), import('./curl.mjs'), import('./rollout-smoke.mjs'),
    ]);
    const result = await runOwnerAcceptance(options, { contract,
      verify: (url, expected) => verifyDeployment(url, expected, readPublicUrl), smoke: rolloutSmoke });
    console.log(JSON.stringify({ reportPath: result.reportPath, ...result.report }, null, 2));
    process.exitCode = result.exitCode;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = error instanceof OwnerUsageError ? 2 : 1;
}
