// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { createOpenAIProvider } from '../../supabase/functions/race-risk-analysis/openai';
import { denoRuntime } from '../../supabase/functions/race-risk-analysis/runtime';
const body = { model: 'gpt-4o-mini', messages: [], temperature: 0.3, max_tokens: 1000, response_format: { type: 'json_object' as const } };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

test('provider has no Node or frontend credential fallback', async () => {
  vi.stubGlobal('Deno', undefined);
  expect(denoRuntime).toThrow('Deno runtime');
  await expect(createOpenAIProvider(vi.fn()).complete(body)).rejects.toThrow('Deno runtime');
});

test('missing Deno key never sends a request', async () => {
  const get = vi.fn().mockReturnValue(undefined);
  vi.stubGlobal('Deno', { env: { get } });
  const fetcher = vi.fn();
  await expect(createOpenAIProvider(fetcher).complete(body)).rejects.toThrow('OPENAI_API_KEY is not configured');
  expect(get).toHaveBeenCalledWith('OPENAI_API_KEY');
  expect(fetcher).not.toHaveBeenCalled();
});

// Non-secret marker returned by the mocked Deno environment, never a usable key.
const environmentMarker = 'MOCK_ENVIRONMENT_VALUE_NOT_A_CREDENTIAL';
const mockEnvironment = () => vi.stubGlobal('Deno', { env: { get: vi.fn().mockReturnValue(environmentMarker) } });
test('provider uses only the mocked Deno environment and forwards a bounded JSON request', async () => {
  mockEnvironment();
  const response = Response.json({ choices: [] });
  const fetcher = vi.fn().mockResolvedValue(response);
  expect(await createOpenAIProvider(fetcher).complete(body)).toBe(response);
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://api.openai.com/v1/chat/completions');
  expect(options.method).toBe('POST');
  expect(options.headers.Authorization).toBe(`Bearer ${environmentMarker}`);
  expect(JSON.parse(options.body)).toEqual(body);
  expect(options.signal).toBeInstanceOf(AbortSignal);
  expect(options.signal.aborted).toBe(false);
});
test.each([new Error('private transport diagnostics'), new DOMException('timeout', 'TimeoutError')])('transport failure is sanitized (%s)', async failure => {
  mockEnvironment();
  await expect(createOpenAIProvider(vi.fn().mockRejectedValue(failure)).complete(body)).rejects.toThrow('AI provider request failed or timed out');
});
test('production entrypoint starts without a key and serves preflight using only runtime stubs', async () => {
  const serve = vi.fn();
  const get = vi.fn().mockReturnValue(undefined);
  const fetcher = vi.fn();
  vi.stubGlobal('Deno', { env: { get }, serve });
  vi.stubGlobal('fetch', fetcher);
  await import('../../supabase/functions/race-risk-analysis/index');
  expect(serve).toHaveBeenCalledTimes(1);
  expect(get).not.toHaveBeenCalled();
  const handler = serve.mock.calls[0][0];
  expect((await handler(new Request('http://test/risk', { method: 'OPTIONS' }))).status).toBe(200);
  expect(fetcher).not.toHaveBeenCalled();
});
