import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from '@/App';
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
Object.defineProperty(window, 'matchMedia', { value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test('AI panel waits for a result, renders a stubbed critical prediction and marks a failed refresh stale', async () => {
  invoke.mockResolvedValueOnce({ error: null, data: { predictions: [{ driverNumber: 1, driverName: 'M. VERSTAPPEN',
    riskType: 'tyre_overheat', riskScore: 95, confidence: 85, lapsUntilCritical: 0,
    recommendation: 'Review tyre cooling immediately', reasoning: 'Temperature exceeds the configured threshold' }],
    overallRaceStatus: 'red', topPriority: 'Review tyre cooling' } })
    .mockResolvedValueOnce({ error: { message: 'stub provider unavailable' }, data: null });
  render(<App />);
  expect(screen.getByText('unavailable')).toBeTruthy();
  expect(screen.getByText('Last updated: Never')).toBeTruthy();
  expect(screen.queryByText('No significant risks detected')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Refresh AI analysis' })); });
  expect(screen.getByText('Review tyre cooling immediately')).toBeTruthy();
  expect(screen.getByText('~0 laps until critical')).toBeTruthy();
  expect(screen.getByText('red')).toBeTruthy();
  expect(screen.getByText('1 active prediction')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Refresh AI analysis' })); });
  expect(screen.getByText('stub provider unavailable')).toBeTruthy();
  expect(screen.getByText(/previous analysis; refresh failed/)).toBeTruthy();
});
