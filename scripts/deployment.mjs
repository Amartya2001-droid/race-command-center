import { createHash } from 'node:crypto';

const sha = /^[0-9a-f]{40}$/;
const repo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const ref = /^[A-Za-z0-9_./-]+$/;
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function createIdentity(source, contract) {
  if (contract.schemaVersion !== 1 || !repo.test(contract.repository) || !ref.test(contract.branch) ||
      !/^lovp_[a-z0-9]+$/.test(contract.lovableProjectId) || new URL(contract.liveUrl).protocol !== 'https:') {
    throw new Error('Invalid deployment contract');
  }
  if (!sha.test(source.commit) || !repo.test(source.repository) || !ref.test(source.branch) ||
      !(source.dirty === null || typeof source.dirty === 'boolean') || !Number.isFinite(Date.parse(source.builtAt))) {
    throw new Error('Build source identity is missing or invalid');
  }
  return { schemaVersion: 1, commit: source.commit, repository: source.repository, branch: source.branch, dirty: source.dirty, builtAt: source.builtAt,
    contract: { schemaVersion: 1, repository: contract.repository, branch: contract.branch, liveUrl: contract.liveUrl, lovableProjectId: contract.lovableProjectId } };
}

export function checkIdentity(identity, expected) {
  const errors = [];
  if (identity?.schemaVersion !== 1) return ['Missing build identity schema version 1'];
  for (const key of ['commit', 'repository', 'branch']) {
    if (identity[key] !== expected[key]) errors.push(`${key} does not match the expected deployment`);
  }
  if (identity.dirty !== false) errors.push('Build source is dirty or cleanliness is unknown');
  for (const key of ['repository', 'branch', 'liveUrl', 'lovableProjectId']) {
    if (identity.contract?.[key] !== expected.contract[key]) errors.push(`Deployment contract ${key} mismatch`);
  }
  return errors;
}

/** Check the actual HTML and assets, not merely a separately cached manifest. */
export async function verifyDeployment(baseUrl, expected, read, options = {}) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) {
    throw new Error('Deployment verification requires HTTPS (HTTP is allowed only for local previews)');
  }
  const url = file => new URL(`${file}?parity=${expected.commit}`, `${base.href.replace(/\/$/, '')}/`).href;
  let manifest;
  try { manifest = JSON.parse((await read(url('build-identity.json'))).toString('utf8')); }
  catch { return { ok: false, errors: ['Live build identity is absent or invalid; the site may be an older build'], identity: null }; }
  const errors = checkIdentity(manifest, expected);
  const assets = manifest?.assets;
  if (!Array.isArray(assets) || assets.length < 2 || assets.length > 50 ||
      !assets.some(a => a.path === 'index.html') || !assets.some(a => /\.js$/.test(a.path) && a.entrypoint === true)) {
    errors.push('Manifest must include the built HTML and JavaScript assets');
    return { ok: false, errors, identity: manifest };
  }
  let htmlText;
  let htmlBytesMatch = false;
  for (const asset of assets) {
    if (typeof asset.path !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(asset.path) || asset.path.startsWith('/') || asset.path.split('/').includes('..') ||
        !/^[a-f0-9]{64}$/.test(asset.sha256)) {
      errors.push('Invalid manifest asset path or digest');
      continue;
    }
    try {
      const bytes = await read(url(asset.path));
      const matches = digest(bytes) === asset.sha256;
      if (asset.path !== 'index.html' || options.strictHtml) {
        if (!matches) errors.push(`Content digest mismatch: ${asset.path}`);
      }
      if (asset.path === 'index.html') {
        htmlText = bytes.toString('utf8');
        htmlBytesMatch = matches;
        if (!htmlText.includes(`content="${manifest.commit}"`)) errors.push('HTML does not identify the same source commit');
      }
    } catch { errors.push(`Could not fetch asset: ${asset.path}`); }
  }
  if (htmlText) {
    for (const asset of assets.filter(a => a.entrypoint === true)) {
      if (!htmlText.includes(asset.path)) errors.push(`HTML does not reference expected entrypoint: ${asset.path}`);
    }
    const badgeProject = htmlText.match(/https:\/\/lovable\.dev\/projects\/(lovp_[a-z0-9]+)/)?.[1];
    if (badgeProject && badgeProject !== expected.contract.lovableProjectId) errors.push('Observed Lovable badge project does not match the deployment contract');
  }
  return { ok: errors.length === 0, errors, identity: manifest, htmlBytesMatch };
}
