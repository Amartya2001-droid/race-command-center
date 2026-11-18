import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { checkIdentity } from './deployment.mjs';

export function publicTarget(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) throw new Error('Acceptance URL must not contain credentials, query parameters or fragments');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('Acceptance requires HTTPS except for local previews');
  }
  return url.href;
}
export const REQUIRED_CHECKS = Object.freeze([
  'Source identity and AI panel visible',
  'Settings, live counter, Pause, Export, durable reload/replay, Reset, Import/replay, invalid-import preservation and durable Clear',
  'Incident search, driver filtering, acknowledge shown, active-only, undo and Clear all',
  'Native fullscreen enter/exit',
]);
const passedChecks = value => REQUIRED_CHECKS.filter(check => Array.isArray(value) && value.includes(check));
const stages = new Set(['initialization', 'build identity and initial UI', 'settings and recording', 'incident triage search', 'incident acknowledgement', 'native fullscreen']);
const checks = value => Array.isArray(value) ? value.filter(item => typeof item === 'string').slice() : [];
const observed = identity => identity ? {
  commit: /^[a-f0-9]{40}$/.test(identity.commit) ? identity.commit : null,
  repository: identity.repository, branch: identity.branch, dirty: identity.dirty,
} : null;

/** An acceptance receipt is evidence of a check, never evidence that this command published. */
export async function collectAcceptance({ url, expected, verify, smoke, now = () => new Date() }) {
  if (!/^[a-f0-9]{40}$/.test(expected.commit)) throw new Error('A full expected source SHA is required');
  const target = publicTarget(url);
  const scope = target === publicTarget(expected.contract.liveUrl) ? 'live' : 'preview';
  const report = {
    schemaVersion: 1, kind: 'race-command-center.acceptance', scope, target,
    expected: { commit: expected.commit, repository: expected.repository, branch: expected.branch,
      lovableProjectId: expected.contract.lovableProjectId },
    startedAt: now().toISOString(), finishedAt: null,
    identity: { status: 'not-run', errors: [], observed: null },
    browser: { status: 'not-run', stage: null, passedChecks: [], error: null },
    outcome: 'failed', liveAcceptancePassed: false,
    publicationPerformed: false, aiMode: 'mock-backed; real AI unverified',
  };
  const finish = () => { report.finishedAt = now().toISOString(); return report; };
  if (scope === 'live' && (expected.branch !== expected.contract.branch || expected.repository !== expected.contract.repository)) {
    report.identity = { status: 'failed', errors: ['Live acceptance requires the declared production repository and branch'], observed: null };
    return finish();
  }
  let verification;
  try { verification = await verify(target, expected); }
  catch {
    report.identity = { status: 'failed', errors: ['Identity verification could not complete'], observed: null };
    return finish();
  }
  const identityErrors = checkIdentity(verification?.identity, expected);
  report.identity = { status: verification?.ok === true && identityErrors.length === 0 && checks(verification.errors).length === 0 ? 'passed' : 'failed',
    errors: [...checks(verification?.errors), ...identityErrors], observed: observed(verification?.identity) };
  if (report.identity.status !== 'passed') return finish();
  try {
    const result = await smoke(target, expected);
    if (result.ok !== true || publicTarget(result.url) !== target || result.commit !== expected.commit) {
      report.browser = { status: 'failed', stage: 'initialization', passedChecks: [], error: 'Browser result does not match the checked target and source' };
      return finish();
    }
    const completed = passedChecks(result.checks);
    if (completed.length !== REQUIRED_CHECKS.length) {
      report.browser = { status: 'failed', stage: 'initialization', passedChecks: completed, error: 'Browser result is missing required rollout checks' };
      return finish();
    }
    report.browser = { status: 'passed', stage: 'complete', passedChecks: completed, error: null };
    report.outcome = 'passed';
    report.liveAcceptancePassed = scope === 'live';
  } catch (error) {
    report.browser = { status: 'failed', stage: stages.has(error?.stage) ? error.stage : 'initialization',
      passedChecks: passedChecks(error?.checks), error: 'Browser acceptance did not complete' };
  }
  return finish();
}

export function defaultReportPath(report) {
  const stamp = report.startedAt.replace(/[:.]/g, '-');
  return join('acceptance-reports', `${report.scope}-${report.expected.commit}-${stamp}.json`);
}
export function writeAcceptance(report, path = defaultReportPath(report)) {
  if (extname(path) !== '.json') throw new Error('Acceptance reports require a .json path');
  mkdirSync(dirname(path), { recursive: true });
  // Existing evidence must never be silently replaced, including a previous successful run.
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return path;
}
