import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import type { DeploymentContract } from '../src/types/deployment';
import { createIdentity, digest } from './deployment.mjs';

function git(...args: string[]) {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return undefined; }
}
export function buildIdentityPlugin(): Plugin {
  const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8')) as DeploymentContract;
  const gitCommit = git('rev-parse', 'HEAD');
  const gitBranch = git('symbolic-ref', '--short', 'HEAD');
  const remote = git('remote', 'get-url', 'origin');
  const repository = remote?.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  // Only public source metadata is read from these allowlisted variables.
  const commit = gitCommit ?? process.env.DEPLOY_COMMIT_SHA;
  const branch = gitBranch ?? process.env.DEPLOY_SOURCE_BRANCH ?? process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME;
  const sourceRepository = repository ?? process.env.DEPLOY_SOURCE_REPOSITORY;
  if (gitCommit && process.env.DEPLOY_COMMIT_SHA && gitCommit !== process.env.DEPLOY_COMMIT_SHA) throw new Error('DEPLOY_COMMIT_SHA disagrees with checked-out Git source');
  if (gitBranch && process.env.DEPLOY_SOURCE_BRANCH && gitBranch !== process.env.DEPLOY_SOURCE_BRANCH) throw new Error('DEPLOY_SOURCE_BRANCH disagrees with checked-out Git source');
  if (repository && process.env.DEPLOY_SOURCE_REPOSITORY && repository !== process.env.DEPLOY_SOURCE_REPOSITORY) throw new Error('DEPLOY_SOURCE_REPOSITORY disagrees with Git origin');
  const status = git('status', '--porcelain', '--untracked-files=normal');
  const identity = createIdentity({ commit: commit ?? '', branch: branch ?? '', repository: sourceRepository ?? '',
    // Without Git, cleanliness cannot be proven. Such a build must fail rollout verification.
    dirty: status === undefined ? null : status.length > 0, builtAt: new Date().toISOString() }, contract);
  return {
    name: 'race-build-identity', enforce: 'post',
    config: () => ({ define: { __BUILD_IDENTITY__: JSON.stringify(identity) } }),
    transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'race-command-center-build', content: identity.commit }, injectTo: 'head' }],
    generateBundle(_options, bundle) {
      const assets = Object.values(bundle).filter(file => file.fileName === 'index.html' || /\.(js|css)$/.test(file.fileName)).map(file => ({
        path: file.fileName, entrypoint: file.type === 'chunk' && file.isEntry, sha256: digest(file.type === 'chunk' ? file.code : file.source),
      })).sort((a, b) => a.path.localeCompare(b.path));
      this.emitFile({ type: 'asset', fileName: 'build-identity.json', source: JSON.stringify({ ...identity, assets }, null, 2) });
    },
  };
}
