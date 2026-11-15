import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyDeployment } from './deployment.mjs';
const contract = JSON.parse(readFileSync(new URL('../config/deployment.json', import.meta.url), 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
let branch;
try { branch = git('symbolic-ref', '--short', 'HEAD'); }
catch { branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME; }
const root = resolve('dist');
const result = await verifyDeployment('http://localhost', {
  commit: git('rev-parse', 'HEAD'), repository: contract.repository, branch, contract,
}, async url => readFileSync(resolve(root, `.${new URL(url).pathname}`)), { strictHtml: true });
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
