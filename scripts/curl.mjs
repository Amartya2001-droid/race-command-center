import { execFileSync } from 'node:child_process';
/** Preserve inherited proxy/CA settings and TLS verification. Never send credentials. */
export async function readPublicUrl(url) {
  return execFileSync('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '20', '--max-filesize', '5242880', url], {
    maxBuffer: 6 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}
