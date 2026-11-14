import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useRiskPrediction } from '@/hooks/useRiskPrediction';
import { generateDriverTelemetry, generateRaceInfo } from '@/utils/telemetrySimulator';
vi.mock('@/integrations/supabase/client', () => ({ supabase: null }));
afterEach(cleanup);
test('no backend configuration reports unavailable without a network call', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected network request'));
  const drivers = [generateDriverTelemetry('ver-1', 0)];
  const raceInfo = generateRaceInfo();
  const { result } = renderHook(() => useRiskPrediction({ drivers, raceInfo }));
  await act(async () => { result.current.refreshNow(); });
  expect(result.current.error).toContain('configure VITE_SUPABASE_URL');
  expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockRestore();
});
