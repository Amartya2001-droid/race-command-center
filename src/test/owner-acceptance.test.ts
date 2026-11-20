// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseOwnerArgs, runOwnerAcceptance, OwnerUsageError } from '../../scripts/owner-acceptance.mjs';
import { REQUIRED_CHECKS } from '../../scripts/acceptance.mjs';
const contract = { schemaVersion: 1, repository: 'owner/repo', branch: 'main', liveUrl: 'https://demo.example.test', lovableProjectId: 'lovp_fixture' };
const commit = 'a'.repeat(40);
const args = ['--url', contract.liveUrl, '--expected-sha', commit];
const dirs: string[] = [];
const reportPath = () => { const dir = mkdtempSync(join(tmpdir(), 'owner-check-')); dirs.push(dir); return join(dir, 'new.json'); };
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const dependencies = () => ({ contract, now: () => new Date('2026-11-19T12:00:00Z'),
  verify: vi.fn().mockResolvedValue({ ok: true, errors: [], identity: { schemaVersion: 1, commit, repository: contract.repository, branch: 'main', dirty: false, contract } }),
  smoke: vi.fn(async (url: string) => ({ ok: true, url, commit, checks: [...REQUIRED_CHECKS] })),
});

test('owner supplies the URL and full SHA; contract controls production repository/branch', () => {
  expect(parseOwnerArgs(args, contract)).toMatchObject({ url: contract.liveUrl + '/', commit, help: false });
  expect(parseOwnerArgs(['--help'], contract)).toEqual({ help: true });
});
test.each([
  [], ['--url', contract.liveUrl], ['--expected-sha', commit],
  ['--url', contract.liveUrl, '--expected-sha', 'short'],
  [...args, '--url', contract.liveUrl], [...args, '--expected-branch', 'preview'],
  ['--url', '--expected-sha', commit], [...args, 'extra'],
  ['--help', ...args], [...args, '--report', '.env'],
].map(argv => [argv]))('invalid/ambiguous arguments fail before runner construction (%j)', argv => {
  expect(() => parseOwnerArgs(argv, contract)).toThrow(OwnerUsageError);
});
test.each(['https://other.example.test', 'http://localhost:4173', 'https://user:password@demo.example.test', 'https://demo.example.test?private=value', 'https://demo.example.test/#fragment'])('a different, preview or credential-bearing target is not a live owner check (%s)', url => {
  expect(() => parseOwnerArgs(['--url', url, '--expected-sha', commit], contract)).toThrow(OwnerUsageError);
});
test('earlier reports cannot be overwritten during preflight', () => {
  const path = reportPath(); writeFileSync(path, 'Earlier evidence');
  expect(() => parseOwnerArgs([...args, '--report', path], contract)).toThrow('already exists');
  expect(readFileSync(path, 'utf8')).toBe('Earlier evidence');
});
test('matching marker/source plus complete mocked browser gates save a successful live report', async () => {
  const deps = dependencies();
  const options = parseOwnerArgs([...args, '--report', reportPath()], contract);
  const result = await runOwnerAcceptance(options, deps);
  expect(result.exitCode).toBe(0);
  expect(result.report).toMatchObject({ scope: 'live', liveAcceptancePassed: true, publicationPerformed: false, aiMode: 'mock-backed; real AI unverified' });
  expect(JSON.parse(readFileSync(result.reportPath, 'utf8'))).toEqual(result.report);
  expect(deps.verify.mock.calls[0][1]).toMatchObject({ repository: contract.repository, branch: 'main', commit });
});
test('the missing live marker fails, saves the result and never starts the browser', async () => {
  const deps = dependencies();
  deps.verify.mockResolvedValue({ ok: false, errors: ['Build identity missing'], identity: null });
  const result = await runOwnerAcceptance(parseOwnerArgs([...args, '--report', reportPath()], contract), deps);
  expect(result.exitCode).toBe(1);
  expect(result.report.browser.status).toBe('not-run');
  expect(result.report.liveAcceptancePassed).toBe(false);
  expect(deps.smoke).not.toHaveBeenCalled();
  expect(JSON.parse(readFileSync(result.reportPath, 'utf8')).outcome).toBe('failed');
});
test('browser failure retains the failed stage in the owner result', async () => {
  const deps = dependencies();
  deps.smoke.mockRejectedValue(Object.assign(new Error('Fixture failure'), { stage: 'native fullscreen', checks: [...REQUIRED_CHECKS.slice(0, 3)] }));
  const result = await runOwnerAcceptance(parseOwnerArgs([...args, '--report', reportPath()], contract), deps);
  expect(result.exitCode).toBe(1);
  expect(result.report.browser.stage).toBe('native fullscreen');
  expect(result.report.browser.passedChecks).toHaveLength(3);
});
test('actual CLI help and invalid arguments use predictable exit codes without network work', () => {
  const help = spawnSync(process.execPath, ['scripts/accept-live.mjs', '--help'], { encoding: 'utf8' });
  expect(help.status).toBe(0);
  expect(help.stdout).toContain('does not publish or merge');
  const bad = spawnSync(process.execPath, ['scripts/accept-live.mjs'], { encoding: 'utf8' });
  expect(bad.status).toBe(2);
  expect(bad.stderr).toContain('--url');
});
