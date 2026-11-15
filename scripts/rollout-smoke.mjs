import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { verifyDeployment } from './deployment.mjs';
import { readPublicUrl } from './curl.mjs';

/** Fresh browser/storage; all backend requests are intercepted, so no real AI is called. */
export async function rolloutSmoke(url, expected) {
  const verification = await verifyDeployment(url, expected, readPublicUrl);
  assert.equal(verification.ok, true, JSON.stringify(verification.errors));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  });
  const checks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const request = route.request();
      if (['fetch', 'xhr'].includes(request.resourceType())) {
        return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'AI calls are mocked in rollout smoke tests' }) });
      }
      if (new URL(request.url()).origin !== new URL(url).origin) return route.abort();
      try {
        const body = await readPublicUrl(request.url());
        const pathname = new URL(request.url()).pathname;
        return route.fulfill({ body, contentType: pathname.endsWith('.js') ? 'application/javascript' : pathname.endsWith('.css') ? 'text/css' : 'text/html' });
      } catch { return route.abort(); }
    });
    await page.goto(url);
    await page.getByText(`Build ${expected.commit.slice(0, 12)}`, { exact: true }).waitFor();
    await page.getByText('AI RISK PREDICTION', { exact: true }).waitFor();
    checks.push('Source identity and AI panel visible');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Telemetry interval').selectOption('500');
    await page.getByLabel('Enable AI risk polling').uncheck();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'RECORD', exact: true }).click();
    await page.waitForTimeout(1100);
    await page.getByRole('button', { name: 'PAUSE', exact: true }).click();
    const counter = await page.getByText(/REC •/).innerText();
    const frames = Number(counter.match(/(\d+) frames/)[1]);
    assert(frames >= 3);
    await page.waitForTimeout(600);
    assert.equal(await page.getByText(/REC •/).innerText(), counter);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'EXPORT', exact: true }).click();
    const download = await downloading;
    const file = readFileSync(await download.path());
    const exported = JSON.parse(file.toString());
    assert.equal(exported.recording.snapshots.length, frames);
    assert.equal(exported.schemaVersion, 1);
    assert.equal(exported.simulated, true);
    await page.getByRole('button', { name: 'STOP', exact: true }).click();
    await page.getByText('Recording saved on this browser.', { exact: true }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: /REPLAY/ }).click();
    await page.getByText('REPLAY MODE', { exact: true }).waitFor();
    await page.getByRole('button', { name: '2×', exact: true }).click();
    await page.getByRole('button', { name: '1×', exact: true }).click();
    await page.getByRole('button', { name: 'EXIT REPLAY', exact: true }).click();
    await page.getByRole('button', { name: 'RESET', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: /REPLAY/ }).count(), 0);
    await page.getByLabel('Import recording file').setInputFiles({ name: 'recording.json', mimeType: 'application/json', buffer: file });
    await page.getByText('Recording imported and saved on this browser.', { exact: true }).waitFor();
    await page.getByRole('button', { name: /REPLAY/ }).click();
    await page.getByText('REPLAY MODE', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'EXIT REPLAY', exact: true }).click();
    await page.getByLabel('Import recording file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByRole('button', { name: /REPLAY/ }).count(), 1);
    await page.getByRole('button', { name: 'Clear saved recording', exact: true }).click();
    await page.reload();
    assert.equal(await page.getByRole('button', { name: /REPLAY/ }).count(), 0);
    checks.push('Settings, live counter, Pause, Export, durable reload/replay, Reset, Import/replay, invalid-import preservation and durable Clear');
    await page.waitForFunction(() => document.querySelectorAll('[aria-label^="Incident "]').length > 0);
    await page.getByRole('button', { name: 'PAUSE', exact: true }).click();
    const log = page.getByRole('region', { name: 'Incident log', exact: true });
    await log.getByLabel('Search incidents').fill('no-matching-test-incident');
    await log.getByText('No incidents match your filters', { exact: true }).waitFor();
    await log.getByRole('button', { name: 'Reset incident filters', exact: true }).click();
    const driver = await log.getByLabel('Incident driver').locator('option').nth(1).getAttribute('value');
    await log.getByLabel('Incident driver').selectOption(driver);
    await log.getByRole('button', { name: 'Acknowledge shown', exact: true }).click();
    await log.getByLabel('Unacknowledged only').check();
    await log.getByText('No incidents match your filters', { exact: true }).waitFor();
    await log.getByRole('button', { name: 'Reset incident filters', exact: true }).click();
    await log.getByRole('button', { name: 'Acknowledged — undo' }).first().click();
    await log.getByRole('button', { name: 'Clear all incidents', exact: true }).click();
    await log.getByText('No incidents detected', { exact: true }).waitFor();
    checks.push('Incident search, driver filtering, acknowledge shown, active-only, undo and Clear all');
    await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    checks.push('Native fullscreen enter/exit');
    assert.deepEqual(errors, []);
    return { ok: true, url, commit: expected.commit, checks, aiMode: 'Backend requests intercepted; real AI unverified' };
  } finally { await browser.close(); }
}
