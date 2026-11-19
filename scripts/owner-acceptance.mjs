import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { collectAcceptance, publicTarget, writeAcceptance } from './acceptance.mjs';

export class OwnerUsageError extends Error {}
export const OWNER_HELP = `Owner live acceptance (read-only; does not publish or merge)

npm run accept:live -- --url PUBLISHED_URL --expected-sha FULL_PUBLISHED_SHA [--report NEW_REPORT.json]

Required: Node.js 22+, npm ci, curl, and Playwright Chromium.
Install Chromium with: npx playwright install --with-deps chromium
Use the URL declared in config/deployment.json and the actual full published main SHA.
The command checks build identity before browser acceptance, saves a JSON receipt,
uses a fresh browser context and intercepts backend requests. Real AI is unverified.
Exit codes: 0 live frontend acceptance passed; 1 acceptance/report failure; 2 invalid arguments/setup.
Publication requires an authorized Lovable owner. This command never publishes, changes
Lovable settings, self-merges, reads a stored key or requests an OpenAI key.
`;

export function parseOwnerArgs(args, contract) {
  if (args.length === 1 && args[0] === '--help') return { help: true };
  const flags = new Set(['--url', '--expected-sha', '--report']);
  const values = new Map();
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    if (!flags.has(flag)) throw new OwnerUsageError('Unknown option; use --help');
    if (values.has(flag)) throw new OwnerUsageError('Duplicate option; use --help');
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new OwnerUsageError('Each option requires one value; use --help');
    values.set(flag, args[i + 1]);
  }
  if (!values.has('--url')) throw new OwnerUsageError('--url PUBLISHED_URL is required');
  const commit = values.get('--expected-sha');
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new OwnerUsageError('--expected-sha requires the actual full 40-character published SHA');
  let url;
  try { url = publicTarget(values.get('--url')); }
  catch { throw new OwnerUsageError('--url must be a public HTTPS URL without credentials, query parameters or fragments'); }
  if (url !== publicTarget(contract.liveUrl)) throw new OwnerUsageError('Published URL does not match config/deployment.json; review the target mapping before acceptance');
  const reportPath = values.get('--report');
  if (reportPath && extname(reportPath) !== '.json') throw new OwnerUsageError('--report requires a new .json file');
  if (reportPath && existsSync(reportPath)) throw new OwnerUsageError('Report already exists; choose a new path to preserve earlier evidence');
  return { help: false, url, commit, reportPath };
}

export async function runOwnerAcceptance(options, { contract, verify, smoke, now }) {
  const report = await collectAcceptance({ url: options.url,
    expected: { commit: options.commit, repository: contract.repository, branch: contract.branch, contract },
    verify, smoke, ...(now ? { now } : {}),
  });
  const reportPath = writeAcceptance(report, options.reportPath);
  return { report, reportPath, exitCode: report.liveAcceptancePassed === true ? 0 : 1 };
}
