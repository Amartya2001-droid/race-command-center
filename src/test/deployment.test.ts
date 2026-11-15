// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { BuildIdentity, DeploymentContract } from '@/types/deployment';
import { createIdentity, checkIdentity, digest, verifyDeployment } from '../../scripts/deployment.mjs';
const contract = JSON.parse(readFileSync(new URL('../../config/deployment.json', import.meta.url), 'utf8')) as DeploymentContract;
const source = { repository: contract.repository, branch: 'main', commit: 'a'.repeat(40), dirty: false, builtAt: '2026-11-15T00:00:00Z' };
const expected = { ...source, contract };
function published() {
  const html = Buffer.from(`<meta name="race-command-center-build" content="${source.commit}"><script src="/assets/app.js"></script>`);
  const js = Buffer.from('console.log("simulator");');
  const manifest = { ...createIdentity(source, contract), assets: [{ path: 'index.html', sha256: digest(html) }, { path: 'assets/app.js', entrypoint: true, sha256: digest(js) }] };
  const files = new Map([['/build-identity.json', Buffer.from(JSON.stringify(manifest))], ['/index.html', html], ['/assets/app.js', js]]);
  const read = vi.fn(async (url: string) => { const file = files.get(new URL(url).pathname); if (!file) throw new Error('Not found'); return file; });
  return { manifest, files, read };
}
test('contract pins observed project and intended repository, branch and live URL', () => {
  expect(contract).toMatchObject({ repository: 'Amartya2001-droid/race-command-center', branch: 'main',
    lovableProjectId: 'lovp_5b8a2zmhjm93pac5cjm5gwajyr', liveUrl: 'https://telemetry-racer-ace.lovable.app' });
  expect(checkIdentity(createIdentity(source, contract), expected)).toEqual([]);
});
test('build identity only includes allowlisted metadata', () => {
  const identity = createIdentity({ ...source, unrelatedPrivateField: 'not-for-the-artifact' } as typeof source, contract);
  expect(JSON.stringify(identity)).not.toContain('unrelatedPrivateField');
  expect(() => createIdentity({ ...source, commit: '' }, contract)).toThrow('missing or invalid');
  expect(() => createIdentity(source, { ...contract, branch: '' })).toThrow('Invalid deployment contract');
});
test.each(['commit', 'repository', 'branch'])('rejects a mismatched source %s', key => {
  expect(checkIdentity({ ...createIdentity(source, contract), [key]: 'wrong' }, expected)).toContain(`${key} does not match the expected deployment`);
});
test.each([true, null])('rejects dirty or unverified provenance (%s)', dirty => {
  expect(checkIdentity(createIdentity({ ...source, dirty }, contract), expected)).toContain('Build source is dirty or cleanliness is unknown');
});
test.each(['repository', 'branch', 'liveUrl', 'lovableProjectId'])('rejects deployment contract %s mismatch', key => {
  const identity = createIdentity(source, contract);
  (identity.contract as unknown as Record<string, unknown>)[key] = 'wrong';
  expect(checkIdentity(identity, expected)).toContain(`Deployment contract ${key} mismatch`);
});
test('matching manifest, HTML and JavaScript all pass with cache-busted URLs', async () => {
  const { read } = published();
  expect((await verifyDeployment(contract.liveUrl, expected, read)).ok).toBe(true);
  expect(read.mock.calls.every(([url]) => url.includes(`parity=${source.commit}`))).toBe(true);
});
test('old SPA HTML returned in place of a manifest fails explicitly', async () => {
  const result = await verifyDeployment(contract.liveUrl, expected, async () => Buffer.from('<html>old app</html>'));
  expect(result.ok).toBe(false);
  expect(result.errors[0]).toContain('absent or invalid');
});
test('a current manifest with stale HTML or changed assets cannot pass', async () => {
  const { files, read } = published();
  files.set('/index.html', Buffer.from('<html>old cached page</html>'));
  files.set('/assets/app.js', Buffer.from('old code'));
  const result = await verifyDeployment(contract.liveUrl, expected, read, { strictHtml: true });
  expect(result.errors).toContain('Content digest mismatch: index.html');
  expect(result.errors).toContain('HTML does not identify the same source commit');
  expect(result.errors).toContain('Content digest mismatch: assets/app.js');
});
test('missing assets or unsafe manifest paths fail without reading another host', async () => {
  const { manifest, files, read } = published();
  manifest.assets[1].path = '../outside.js';
  files.set('/build-identity.json', Buffer.from(JSON.stringify(manifest)));
  const result = await verifyDeployment(contract.liveUrl, expected, read);
  expect(result.errors).toContain('Invalid manifest asset path or digest');
  expect(read.mock.calls).toHaveLength(2);
});
test('non-local plaintext HTTP is rejected before fetching', async () => {
  const read = vi.fn();
  await expect(verifyDeployment('http://example.test', expected, read)).rejects.toThrow('HTTPS');
  expect(read).not.toHaveBeenCalled();
});
test('hosting badge markup may change HTML bytes but not the commit, entrypoint or asset digests', async () => {
  const { files, read } = published();
  files.set('/index.html', Buffer.from(files.get('/index.html')!.toString() + `<a href="https://lovable.dev/projects/${contract.lovableProjectId}">Edit</a>`));
  const result = await verifyDeployment(contract.liveUrl, expected, read);
  expect(result.ok).toBe(true);
  expect(result.htmlBytesMatch).toBe(false);
});
test('a wrong Lovable badge project and stale HTML entrypoint fail independently', async () => {
  const { files, read } = published();
  files.set('/index.html', Buffer.from(`<meta content="${source.commit}"><script src="/assets/old.js"></script><a href="https://lovable.dev/projects/lovp_wrong">Edit</a>`));
  const result = await verifyDeployment(contract.liveUrl, expected, read);
  expect(result.errors).toContain('HTML does not reference expected entrypoint: assets/app.js');
  expect(result.errors).toContain('Observed Lovable badge project does not match the deployment contract');
});
