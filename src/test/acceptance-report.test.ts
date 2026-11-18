// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectAcceptance, writeAcceptance, REQUIRED_CHECKS } from '../../scripts/acceptance.mjs';
const contract = { schemaVersion: 1, repository: 'owner/repo', branch: 'main', liveUrl: 'https://demo.example.test', lovableProjectId: 'lovp_fixture' };
const expected = { commit: 'a'.repeat(40), repository: contract.repository, branch: 'main', contract };
const identity = { schemaVersion: 1, ...expected, dirty: false, privateField: 'NOT_FOR_THE_REPORT' };
const now = () => new Date('2026-11-17T12:00:00Z');
const setup = (url = contract.liveUrl) => ({ url, expected, now,
  verify: vi.fn().mockResolvedValue({ ok: true, errors: [], identity }),
  smoke: vi.fn(async (url: string) => ({ ok: true, url, commit: expected.commit, checks: [...REQUIRED_CHECKS] })),
});
const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
test('matching live results produce acceptance evidence but never claim publication or real AI', async () => {
  const report = await collectAcceptance(setup());
  expect(report).toMatchObject({ scope: 'live', outcome: 'passed', liveAcceptancePassed: true, publicationPerformed: false,
    startedAt: now().toISOString(), finishedAt: now().toISOString(), aiMode: 'mock-backed; real AI unverified' });
  expect(JSON.stringify(report)).not.toContain('NOT_FOR_THE_REPORT');
  expect(report.browser.passedChecks).toEqual([...REQUIRED_CHECKS]);
});
test('a successful preview cannot become a live acceptance claim', async () => {
  const report = await collectAcceptance(setup('http://127.0.0.1:4173'));
  expect(report).toMatchObject({ scope: 'preview', outcome: 'passed', liveAcceptancePassed: false });
});
test('production URL with a preview branch is rejected before any requests', async () => {
  const options = setup();
  options.expected = { ...expected, branch: 'feature/preview' };
  const report = await collectAcceptance(options);
  expect(report.outcome).toBe('failed');
  expect(options.verify).not.toHaveBeenCalled();
  expect(options.smoke).not.toHaveBeenCalled();
});
test('a stale identity saves a failure receipt and skips the browser', async () => {
  const options = setup();
  options.verify.mockResolvedValue({ ok: false, errors: ['Missing current identity'], identity: null });
  const report = await collectAcceptance(options);
  expect(report.identity.status).toBe('failed');
  expect(report.browser.status).toBe('not-run');
  expect(report.liveAcceptancePassed).toBe(false);
  expect(options.smoke).not.toHaveBeenCalled();
});
test('the observed identity must independently match the expected source', async () => {
  const options = setup();
  options.verify.mockResolvedValue({ ok: true, errors: [], identity: { ...identity, commit: 'b'.repeat(40) } });
  const report = await collectAcceptance(options);
  expect(report.identity.errors).toContain('commit does not match the expected deployment');
  expect(options.smoke).not.toHaveBeenCalled();
});
test('transport failure records an incomplete identity check without copying private diagnostics', async () => {
  const options = setup();
  options.verify.mockRejectedValue(new Error('PRIVATE_DIAGNOSTIC'));
  const report = await collectAcceptance(options);
  expect(report.outcome).toBe('failed');
  expect(JSON.stringify(report)).not.toContain('PRIVATE_DIAGNOSTIC');
});
test('browser failure preserves completed checks and exact stage, without raw diagnostics', async () => {
  const options = setup();
  options.smoke.mockRejectedValue(Object.assign(new Error('PRIVATE_DIAGNOSTIC'), { stage: 'native fullscreen', checks: [...REQUIRED_CHECKS.slice(0, 2)] }));
  const report = await collectAcceptance(options);
  expect(report.browser).toMatchObject({ status: 'failed', stage: 'native fullscreen', passedChecks: [...REQUIRED_CHECKS.slice(0, 2)] });
  expect(report.liveAcceptancePassed).toBe(false);
  expect(JSON.stringify(report)).not.toContain('PRIVATE_DIAGNOSTIC');
});
test.each(['url', 'commit'])('browser success for the wrong %s cannot pass', async key => {
  const options = setup();
  options.smoke.mockResolvedValue({ ok: true, url: options.url, commit: expected.commit, checks: [], [key]: key === 'url' ? 'https://other.example.test' : 'b'.repeat(40) });
  const report = await collectAcceptance(options);
  expect(report.outcome).toBe('failed');
  expect(report.liveAcceptancePassed).toBe(false);
});
test.each(['https://user:password@example.test', 'https://example.test?private=value', 'http://example.test'])('invalid public target is rejected before requests (%s)', async url => {
  const options = setup(url);
  await expect(collectAcceptance(options)).rejects.toThrow();
  expect(options.verify).not.toHaveBeenCalled();
});
test('reports are valid JSON, create directories, and never overwrite earlier evidence', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'race-acceptance-')); dirs.push(dir);
  const path = join(dir, 'nested', 'report.json');
  const report = await collectAcceptance(setup());
  expect(writeAcceptance(report, path)).toBe(path);
  expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(report);
  expect(() => writeAcceptance({ ...report, outcome: 'failed' }, path)).toThrow();
  expect(JSON.parse(readFileSync(path, 'utf8')).outcome).toBe('passed');
  expect(() => writeAcceptance(report, join(dir, '.env'))).toThrow('.json');
});

test('incomplete UI checks cannot produce a live acceptance pass', async () => {
  const options = setup();
  options.smoke.mockResolvedValue({ ok: true, url: options.url, commit: expected.commit, checks: [...REQUIRED_CHECKS.slice(0, 2)] });
  const report = await collectAcceptance(options);
  expect(report.outcome).toBe('failed');
  expect(report.browser.passedChecks).toEqual([...REQUIRED_CHECKS.slice(0, 2)]);
  expect(report.liveAcceptancePassed).toBe(false);
});

test('malformed verification data produces a failed receipt rather than a success', async () => {
  const options = setup();
  options.verify.mockResolvedValue(undefined);
  const report = await collectAcceptance(options);
  expect(report.identity.status).toBe('failed');
  expect(options.smoke).not.toHaveBeenCalled();
});
