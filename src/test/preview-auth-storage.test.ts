import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { brokeredPreviewStorage } from '@/integrations/supabase/previewAuthStorage';

// All session values below are inert test data; no SDK, editor or network is used.
const project = '11111111-2222-3333-4444-555555555555';
const key = 'test-session';
const editor = 'https://lovable.dev';

function surface(host = `id-preview--${project}.lovable.app`, ancestor = editor) {
  const events = new EventTarget();
  const post = vi.fn();
  const parent = { postMessage: post };
  const frame = {
    parent,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: vi.fn(events.removeEventListener.bind(events)),
  };
  vi.stubGlobal('window', frame);
  vi.stubGlobal('location', { hostname: host, ancestorOrigins: [ancestor] });
  const send = (data: unknown, origin = editor) => events.dispatchEvent(new MessageEvent('message', { data, origin }));
  const reply = (value: unknown, ok = true) => {
    const request = post.mock.lastCall![0];
    send({ type: 'lovable-preview-auth:result', requestId: request.requestId, ok, value });
  };
  return { frame, post, send, reply };
}

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

test('server imports have no browser storage', () => {
  vi.stubGlobal('window', undefined);
  expect(brokeredPreviewStorage()).toBeUndefined();
});

test.each([
  'telemetry-racer-ace.lovable.app',
  `preview--${project}.lovable.app`,
  `id-preview--${project}.lovable.app.example.test`,
])('non-project surface %s uses local storage without messaging', host => {
  const { post } = surface(host);
  expect(brokeredPreviewStorage()).toBe(localStorage);
  expect(post).not.toHaveBeenCalled();
});

test('a top-level project surface uses local storage', () => {
  const { frame } = surface();
  Object.assign(frame, { parent: frame });
  expect(brokeredPreviewStorage()).toBe(localStorage);
});

test.each([
  `id-preview--${project}.lovable.app`,
  `project--${project}.lovableproject.com`,
  `live--${project}-thr_test.lovable.app`,
])('project surface %s sends the host-derived project id', async host => {
  const { post, reply } = surface(host);
  const pending = brokeredPreviewStorage()!.getItem(key);
  expect(post).toHaveBeenCalledWith(expect.objectContaining({
    type: 'lovable-preview-auth:get', projectId: project, key,
  }), editor);
  reply('broker-session');
  expect(await pending).toBe('broker-session');
  expect(localStorage.getItem(key)).toBe('broker-session');
});

test('untrusted ancestors never receive session messages', async () => {
  const { post, reply } = surface(undefined, 'https://untrusted.example.test');
  localStorage.setItem(key, 'local-session');
  const pending = brokeredPreviewStorage()!.getItem(key);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ value: 'local-session' }), editor);
  reply(null);
  expect(await pending).toBe('local-session');
});

test('ignores wrong origins, request ids and malformed replies until a matching reply', async () => {
  const { post, send, reply, frame } = surface();
  const timeout = vi.spyOn(globalThis, 'setTimeout');
  const cancel = vi.spyOn(globalThis, 'clearTimeout');
  const settled = vi.fn();
  const pending = Promise.resolve(brokeredPreviewStorage()!.getItem(key)).then(settled);
  const requestId = post.mock.lastCall![0].requestId;
  send({ type: 'lovable-preview-auth:result', requestId, ok: true, value: 'wrong' }, 'https://untrusted.example.test');
  send({ type: 'lovable-preview-auth:result', requestId: 'other-request', ok: true, value: 'wrong' });
  send(null);
  send({ type: 'unrelated', requestId });
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  reply('broker-session');
  await pending;
  expect(settled).toHaveBeenCalledWith('broker-session');
  expect(frame.removeEventListener).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledWith(timeout.mock.results[0].value);
});

test('retries only the first timed-out read, then falls back to local storage', async () => {
  const { post, frame } = surface();
  localStorage.setItem(key, 'local-session');
  const storage = brokeredPreviewStorage()!;
  const first = storage.getItem(key);
  await vi.advanceTimersByTimeAsync(2250);
  expect(post).toHaveBeenCalledTimes(2);
  expect(post.mock.calls[0][0].requestId).not.toBe(post.mock.calls[1][0].requestId);
  await vi.advanceTimersByTimeAsync(2000);
  expect(await first).toBe('local-session');
  const second = storage.getItem(key);
  await vi.advanceTimersByTimeAsync(2000);
  expect(await second).toBe('local-session');
  expect(post).toHaveBeenCalledTimes(3);
  expect(frame.removeEventListener).toHaveBeenCalledTimes(3);
  expect(vi.getTimerCount()).toBe(0);
});

test.each([false, true])('unsynced or rejected broker reads preserve local sessions (ok=%s)', async ok => {
  const { reply } = surface();
  localStorage.setItem(key, 'local-session');
  const pending = brokeredPreviewStorage()!.getItem(key);
  reply(null, ok);
  expect(await pending).toBe('local-session');
});

test('a logout tombstone clears the local copy and cannot resurrect it on timeout', async () => {
  const { reply } = surface();
  localStorage.setItem(key, 'local-session');
  const storage = brokeredPreviewStorage()!;
  const first = storage.getItem(key);
  reply('');
  expect(await first).toBeNull();
  expect(localStorage.getItem(key)).toBeNull();
  const second = storage.getItem(key);
  await vi.advanceTimersByTimeAsync(2000);
  expect(await second).toBeNull();
});

test('a stale logout reply cannot remove a newer local session', async () => {
  const { reply } = surface();
  localStorage.setItem(key, 'old-session');
  const pending = brokeredPreviewStorage()!.getItem(key);
  localStorage.setItem(key, 'new-session');
  reply('');
  expect(await pending).toBeNull();
  expect(localStorage.getItem(key)).toBe('new-session');
});

test.each(['canonical-session', ''])('set persists locally then reconciles broker value %j', async value => {
  const { post, reply } = surface();
  const pending = brokeredPreviewStorage()!.setItem(key, 'local-session');
  expect(localStorage.getItem(key)).toBe('local-session');
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'lovable-preview-auth:set', key, value: 'local-session' }), editor);
  reply(value);
  await pending;
  expect(localStorage.getItem(key)).toBe(value || null);
});

test('a delayed set acknowledgement cannot overwrite a newer session', async () => {
  const { reply } = surface();
  const pending = brokeredPreviewStorage()!.setItem(key, 'old-session');
  localStorage.setItem(key, 'new-session');
  reply('stale-session');
  await pending;
  expect(localStorage.getItem(key)).toBe('new-session');
});

test('remove clears locally and sends the prior session for broker revocation', async () => {
  const { post, reply } = surface();
  localStorage.setItem(key, 'local-session');
  const pending = brokeredPreviewStorage()!.removeItem(key);
  expect(localStorage.getItem(key)).toBeNull();
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'lovable-preview-auth:remove', value: 'local-session' }), editor);
  reply(null);
  await pending;
});

test('blocked local reads do not prevent a successful broker read', async () => {
  const { reply } = surface();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  const pending = brokeredPreviewStorage()!.getItem(key);
  reply('broker-session');
  expect(await pending).toBe('broker-session');
});

test('a full local store does not discard a successful broker read', async () => {
  const { reply } = surface();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
  const pending = brokeredPreviewStorage()!.getItem(key);
  reply('broker-session');
  expect(await pending).toBe('broker-session');
});
