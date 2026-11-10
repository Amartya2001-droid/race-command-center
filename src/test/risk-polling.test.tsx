import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useRiskPrediction } from '@/hooks/useRiskPrediction';
import { generateDriverTelemetry, generateRaceInfo } from '@/utils/telemetrySimulator';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

test('automatic risk polling survives telemetry updates and sends the latest frame', async () => {
  vi.useFakeTimers();
  invoke.mockResolvedValue({ data: { predictions: [], overallRaceStatus: 'green' }, error: null });
  let driver = generateDriverTelemetry('ver-1', 0);
  const raceInfo = generateRaceInfo();
  const { rerender } = renderHook(({ drivers }) => useRiskPrediction({ drivers, raceInfo, updateInterval: 15000 }), {
    initialProps: { drivers: [driver] },
  });
  for (let i = 0; i < 14; i++) {
    await act(async () => { vi.advanceTimersByTime(150); });
    driver = { ...driver, speed: 200 + i };
    rerender({ drivers: [driver] });
  }
  expect(invoke).toHaveBeenCalledTimes(1);
  await act(async () => { vi.advanceTimersByTime(30000); });
  expect(invoke).toHaveBeenCalledTimes(2);
  expect(invoke.mock.lastCall?.[1].body.drivers[0].speed).toBe(driver.speed);
});
