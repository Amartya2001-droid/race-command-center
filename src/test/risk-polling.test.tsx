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

test('manual refresh recovers from invocation and application errors using stubs', async () => {
  invoke.mockResolvedValueOnce({ data: null, error: { message: 'stub backend unavailable' } })
    .mockResolvedValueOnce({ data: { error: 'stub upstream failure' }, error: null })
    .mockResolvedValueOnce({ data: { predictions: [{ driverNumber: 1 }], overallRaceStatus: 'yellow', topPriority: 'Review tyres' }, error: null });
  const { result } = renderHook(() => useRiskPrediction({ drivers: [generateDriverTelemetry('ver-1', 0)], raceInfo: generateRaceInfo() }));
  await act(async () => { result.current.refreshNow(); });
  expect(result.current.error).toBe('stub backend unavailable');
  expect(result.current.isLoading).toBe(false);
  await act(async () => { result.current.refreshNow(); });
  expect(result.current.error).toBe('stub upstream failure');
  await act(async () => { result.current.refreshNow(); });
  expect(result.current.error).toBeNull();
  expect(result.current.predictions).toEqual([{ driverNumber: 1 }]);
  expect(result.current.overallRaceStatus).toBe('yellow');
});

test('empty/disabled telemetry does not call AI and pending requests cannot overlap', async () => {
  let finish: (value: unknown) => void = () => {};
  invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const drivers = [generateDriverTelemetry('ver-1', 0)];
  const raceInfo = generateRaceInfo();
  const { result, rerender } = renderHook(({ enabled, drivers }) => useRiskPrediction({ drivers, raceInfo, enabled }), {
    initialProps: { enabled: false, drivers },
  });
  await act(async () => { result.current.refreshNow(); });
  expect(invoke).not.toHaveBeenCalled();
  rerender({ enabled: true, drivers: [] });
  await act(async () => { result.current.refreshNow(); });
  expect(invoke).not.toHaveBeenCalled();
  rerender({ enabled: true, drivers });
  await act(async () => { result.current.refreshNow(); });
  expect(result.current.isLoading).toBe(true);
  await act(async () => { result.current.refreshNow(); });
  expect(invoke).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ data: { predictions: [] }, error: null }); });
  expect(result.current.isLoading).toBe(false);
});
