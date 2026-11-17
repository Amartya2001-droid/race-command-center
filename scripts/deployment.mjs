import { createHash } from 'node:crypto';
import { parse } from 'parse5';
/** Inspect browser-relevant HTML nodes; comments, script text and template content are inert. */
function htmlEvidence(html, documentUrl) {
  const nodes = [];
  const stack = [parse(html, { scriptingEnabled: true })];
  while (stack.length) {
    const node = stack.pop();
    if (node.namespaceURI === 'http://www.w3.org/1999/xhtml') nodes.push(node);
    // Template contents live under .content and must not count as executable document nodes.
    for (const child of [...(node.childNodes ?? [])].reverse()) stack.push(child);
  }
  const attrs = node => Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
  const head = nodes.find(node => node.tagName === 'head');
  const headNodes = [];
  const visitHead = node => {
    if (!node) return;
    headNodes.push(node);
    for (const child of node.childNodes ?? []) visitHead(child);
  };
  visitHead(head);
  const markers = headNodes.filter(node => node.tagName === 'meta' &&
    (attrs(node).name ?? '').toLowerCase() === 'race-command-center-build').map(node => attrs(node).content);
  let effectiveBase = documentUrl;
  const base = headNodes.find(node => node.tagName === 'base' && Object.hasOwn(attrs(node), 'href'));
  if (base) {
    try { effectiveBase = new URL(attrs(base).href, documentUrl).href; } catch { /* invalid base uses document URL */ }
  }
  const modules = [];
  const projects = [];
  for (const node of nodes) {
    const attributes = attrs(node);
    if (node.tagName === 'script' && (attributes.type ?? '').replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, '').toLowerCase() === 'module' && attributes.src) {
      try { modules.push(new URL(attributes.src, effectiveBase).href); } catch { /* unusable module URL */ }
    }
    if (node.tagName === 'a' && attributes.href) {
      try {
        const link = new URL(attributes.href, effectiveBase);
        const project = link.pathname.match(/^\/projects\/(lovp_[a-z0-9]+)\/?$/)?.[1];
        if (link.origin === 'https://lovable.dev' && project) projects.push(project);
      } catch { /* unusable link */ }
    }
  }
  return { markers, modules, projects };
}


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

      }
    } catch { errors.push(`Could not fetch asset: ${asset.path}`); }
  }
  if (htmlText !== undefined) {
    const evidence = htmlEvidence(htmlText, base.href);
    if (evidence.markers.length !== 1 || evidence.markers[0] !== manifest.commit) {
      errors.push('HTML does not identify the same source commit');
    }
    for (const asset of assets.filter(a => a.entrypoint === true)) {
      const expectedUrl = new URL(asset.path, base.href.endsWith('/') ? base.href : base.href + '/').href;
      if (!evidence.modules.includes(expectedUrl)) errors.push(`HTML does not reference expected entrypoint: ${asset.path}`);
    }
    if (evidence.projects.some(project => project !== expected.contract.lovableProjectId)) {
      errors.push('Observed Lovable badge project does not match the deployment contract');
    }
  }
  return { ok: errors.length === 0, errors, identity: manifest, htmlBytesMatch };
}
