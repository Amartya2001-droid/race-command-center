import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { AIRiskPanel } from '@/components/dashboard/AIRiskPanel';
import type { RiskAnalysis, RiskType } from '@/types/riskPrediction';
afterEach(cleanup);
const base: RiskAnalysis = { predictions: [], overallRaceStatus: 'green', topPriority: 'Test priority', lastUpdated: null, isLoading: false, error: null };
test.each(['tyre_overheat', 'fuel_depletion', 'performance_drop', 'tyre_degradation', 'unknown'])('renders risk icon and label for %s', riskType => {
  const onRefresh = vi.fn();
  const predictions = [20, 55, 85].map((riskScore, i) => ({ driverNumber: i + 1, driverName: `Test driver ${i}`, riskType: riskType as RiskType,
    riskScore, confidence: 80, lapsUntilCritical: i === 0 ? null : 0, recommendation: 'Test action', reasoning: 'Test reasoning' }));
  render(<AIRiskPanel analysis={{ ...base, predictions, lastUpdated: new Date(0) }} onRefresh={onRefresh} />);
  expect(screen.getByText('3 active predictions')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh AI analysis' }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
});
test.each(['green', 'yellow', 'red'])('renders completed %s analysis without predictions', overallRaceStatus => {
  render(<AIRiskPanel analysis={{ ...base, overallRaceStatus: overallRaceStatus as RiskAnalysis['overallRaceStatus'], lastUpdated: new Date(0) }} onRefresh={vi.fn()} />);
  expect(screen.getByText('No significant risks detected')).toBeTruthy();
});
test('loading disables refresh; initial and error states do not claim a completed analysis', () => {
  const { rerender } = render(<AIRiskPanel analysis={{ ...base, isLoading: true }} onRefresh={vi.fn()} />);
  expect((screen.getByRole('button', { name: 'Refresh AI analysis' }) as HTMLButtonElement).disabled).toBe(true);
  rerender(<AIRiskPanel analysis={base} onRefresh={vi.fn()} />);
  expect(screen.getByText('Awaiting first analysis')).toBeTruthy();
  rerender(<AIRiskPanel analysis={{ ...base, error: 'Test unavailable' }} onRefresh={vi.fn()} />);
  expect(screen.getByText('Test unavailable')).toBeTruthy();
  expect(screen.queryByText('Awaiting first analysis')).toBeNull();
});
