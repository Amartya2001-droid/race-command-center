// Node request/response primitives exercise the same handler deployed by Deno.
// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { createRiskHandler } from '../../supabase/functions/race-risk-analysis/handler';
import { createOpenAICompletion } from '../../supabase/functions/race-risk-analysis/openai';
const payload = { drivers: [{ id: 'ver-1', driverNumber: 1, driverName: 'M. VERSTAPPEN', fuel: 12,
  tyreTemp: { frontLeft: 115, frontRight: 100, rearLeft: 102, rearRight: 103 },
  tyreWear: { frontLeft: 80, frontRight: 70, rearLeft: 60, rearRight: 70 },
  tyreAge: 20, tyreCompound: 'soft', speed: 300, position: 1 }], raceInfo: { currentLap: 60, totalLaps: 78, trackTemp: 40 } };
const request = () => new Request('http://localhost/risk', { method: 'POST', body: JSON.stringify(payload) });

test('preflight needs no completion or key', async () => {
  const complete = vi.fn();
  const response = await createRiskHandler(complete)(new Request('http://localhost/risk', { method: 'OPTIONS' }));
  expect(response.status).toBe(200);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  expect(complete).not.toHaveBeenCalled();
});

test('server adapter refuses a missing key without making a network request', async () => {
  const fetcher = vi.fn();
  const response = await createRiskHandler(createOpenAICompletion(() => undefined, fetcher))(request());
  expect(response.status).toBe(500);
  expect((await response.json()).error).toBe('OPENAI_API_KEY is not configured');
  expect(fetcher).not.toHaveBeenCalled();
});

test('handler builds telemetry prompts and returns stubbed predictions', async () => {
  const analysis = { predictions: [{ driverNumber: 1, riskType: 'fuel_depletion', riskScore: 80 }], overallRaceStatus: 'yellow', topPriority: 'Review fuel' };
  const complete = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(analysis) } }] }));
  const response = await createRiskHandler(complete)(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(analysis);
  const body = complete.mock.calls[0][0];
  expect(body.model).toBe('gpt-4o-mini');
  expect(body.response_format).toEqual({ type: 'json_object' });
  expect(body.messages[1].content).toContain('18 remaining');
  expect(body.messages[1].content).toContain('Fuel 12.0%, TyreTemp 115°C, Wear 70%');
});

test.each([
  ['HTTP rejection', () => new Response('rate limited', { status: 429 }), 'OpenAI API error: 429'],
  ['empty response', () => Response.json({ choices: [] }), 'Empty response from AI'],
  ['invalid JSON', () => Response.json({ choices: [{ message: { content: 'invalid' } }] }), 'Invalid AI response format'],
])('handler reports %s from stubbed completion', async (_, makeResponse, message) => {
  const response = await createRiskHandler(vi.fn().mockResolvedValue(makeResponse()))(request());
  expect(response.status).toBe(500);
  const body = await response.json();
  expect(body.error).toContain(message);
  expect(body.predictions).toEqual([]);
  expect(body.overallRaceStatus).toBe('yellow');
});

test('malformed client payload fails without a completion request', async () => {
  const complete = vi.fn();
  const response = await createRiskHandler(complete)(new Request('http://localhost/risk', { method: 'POST', body: '{}' }));
  expect(response.status).toBe(500);
  expect(complete).not.toHaveBeenCalled();
});
