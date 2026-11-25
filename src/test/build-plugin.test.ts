// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const { exec } = vi.hoisted(() => ({ exec: vi.fn() }));
vi.mock('node:child_process', () => ({ execFileSync: exec }));
import { buildIdentityPlugin } from '../../scripts/build-identity';
beforeEach(() => {
  for (const name of ['DEPLOY_COMMIT_SHA', 'DEPLOY_SOURCE_BRANCH', 'DEPLOY_SOURCE_REPOSITORY', 'GITHUB_HEAD_REF', 'GITHUB_REF_NAME']) vi.stubEnv(name, undefined);
  exec.mockImplementation((_command: string, args: string[]) => {
    if (args[0] === 'rev-parse') return 'a'.repeat(40);
    if (args[0] === 'symbolic-ref') return 'main';
    if (args[0] === 'remote') return 'https://github.com/Amartya2001-droid/race-command-center.git';
    return '';
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const identity = () => {
  const plugin = buildIdentityPlugin();
  const config = (plugin.config as () => { define: Record<string, string> })();
  return JSON.parse(config.define.__BUILD_IDENTITY__);
};
test('builds use actual Git source identity and strip origin transport syntax', () => {
  expect(identity()).toMatchObject({ commit: 'a'.repeat(40), branch: 'main', repository: 'Amartya2001-droid/race-command-center', dirty: false });
});
test('a host without Git must supply metadata and is still marked unverified', () => {
  exec.mockImplementation(() => { throw new Error('No Git'); });
  expect(buildIdentityPlugin).toThrow('missing or invalid');
  vi.stubEnv('DEPLOY_COMMIT_SHA', 'b'.repeat(40));
  vi.stubEnv('DEPLOY_SOURCE_BRANCH', 'main');
  vi.stubEnv('DEPLOY_SOURCE_REPOSITORY', 'Amartya2001-droid/race-command-center');
  expect(identity()).toMatchObject({ commit: 'b'.repeat(40), dirty: null });
});
test.each([
  ['DEPLOY_COMMIT_SHA', 'b'.repeat(40)], ['DEPLOY_SOURCE_BRANCH', 'other'], ['DEPLOY_SOURCE_REPOSITORY', 'other/repository'],
])('explicit %s metadata cannot contradict available Git evidence', (name, value) => {
  vi.stubEnv(name, value);
  expect(buildIdentityPlugin).toThrow('disagrees');
});
test('detached CI builds identify their documented event branch and actual commit', () => {
  const previous = exec.getMockImplementation()!;
  exec.mockImplementation((command: string, args: string[]) => { if (args[0] === 'symbolic-ref') throw new Error('detached'); return previous(command, args); });
  vi.stubEnv('GITHUB_HEAD_REF', 'feature/test');
  expect(identity()).toMatchObject({ branch: 'feature/test', commit: 'a'.repeat(40) });
});
test('the current branch is read from the checked-out branch name', () => {
  const previous = exec.getMockImplementation()!;
  exec.mockImplementation((command: string, args: string[]) => {
    if (args[0] === 'branch') return 'release/2026-11';
    if (args[0] === 'symbolic-ref') throw new Error('not allowed');
    return previous(command, args);
  });
  expect(identity()).toMatchObject({ branch: 'release/2026-11', commit: 'a'.repeat(40) });
});
test('a non-GitHub origin uses the repository declared in the committed contract', () => {
  const previous = exec.getMockImplementation()!;
  exec.mockImplementation((command: string, args: string[]) => {
    if (args[0] === 'remote') return 'https://token@git.private.lovable-gcp.code.storage/ee396a16-ffbe-4818-8cb3-9dd90a7d5f10.git';
    return previous(command, args);
  });
  expect(identity()).toMatchObject({ repository: 'Amartya2001-droid/race-command-center', branch: 'main', dirty: false });
});
