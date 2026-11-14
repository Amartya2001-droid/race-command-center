import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { IncidentLog } from '@/components/dashboard/IncidentLog';
import type { Anomaly } from '@/types/telemetry';
afterEach(cleanup);
const incidents: Anomaly[] = [
  { id: 'hot', driverId: 'ver-1', driverNumber: 1, timestamp: new Date(0), type: 'tyre_overheat', severity: 'critical', message: 'Critical tyre temperature', value: 118, threshold: 115 },
  { id: 'fuel', driverId: 'lec-16', driverNumber: 16, timestamp: new Date(1000), type: 'fuel_critical', severity: 'warning', message: 'Fuel reserve warning' },
  { id: 'warm', driverId: 'ver-1', driverNumber: 1, timestamp: new Date(2000), type: 'tyre_overheat', severity: 'warning', message: 'Warm tyre temperature' },
];
test('combined filters narrow incidents without modifying history; reset restores them', () => {
  render(<IncidentLog anomalies={incidents} onClear={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Search incidents'), { target: { value: 'TYRE' } });
  fireEvent.change(screen.getByLabelText('Incident severity'), { target: { value: 'warning' } });
  fireEvent.change(screen.getByLabelText('Incident driver'), { target: { value: '1' } });
  expect(screen.getByRole('status').textContent).toContain('1 of 3');
  expect(screen.getByText('Warm tyre temperature')).toBeTruthy();
  expect(screen.queryByText('Fuel reserve warning')).toBeNull();
  fireEvent.change(screen.getByLabelText('Search incidents'), { target: { value: 'no matching text' } });
  expect(screen.getByText('No incidents match your filters')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reset incident filters' }));
  expect(screen.getByRole('status').textContent).toContain('3 of 3');
});
test('acknowledge shown affects only the filtered set; undo and active-only work', () => {
  render(<IncidentLog anomalies={incidents} onClear={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Incident driver'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Acknowledge shown' }));
  expect(screen.getByRole('status').textContent).toContain('2 acknowledged');
  fireEvent.click(screen.getByLabelText('Unacknowledged only'));
  expect(screen.getByRole('status').textContent).toContain('0 of 3');
  fireEvent.change(screen.getByLabelText('Incident driver'), { target: { value: 'all' } });
  expect(screen.getByText('Fuel reserve warning')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Acknowledge incident' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset incident filters' }));
  expect(screen.getByRole('status').textContent).toContain('3 acknowledged');
  fireEvent.click(within(screen.getByLabelText('Incident hot')).getByRole('button', { name: 'Acknowledged — undo' }));
  expect(screen.getByRole('status').textContent).toContain('2 acknowledged');
});
test('updates retain acknowledgement for current history and remove expired ids', () => {
  const { rerender } = render(<IncidentLog anomalies={incidents} onClear={vi.fn()} />);
  fireEvent.click(within(screen.getByLabelText('Incident fuel')).getByRole('button', { name: 'Acknowledge incident' }));
  rerender(<IncidentLog anomalies={[...incidents]} onClear={vi.fn()} />);
  expect(screen.getByRole('status').textContent).toContain('1 acknowledged');
  fireEvent.change(screen.getByLabelText('Incident driver'), { target: { value: '16' } });
  rerender(<IncidentLog anomalies={[incidents[0]]} onClear={vi.fn()} />);
  expect(screen.getByRole('status').textContent).toContain('0 acknowledged');
  expect(screen.getByRole('option', { name: '#16 (no recent incidents)' })).toBeTruthy();
});
test('Clear all incidents acts on all history even while filtered and resets acknowledgements', () => {
  const onClear = vi.fn();
  const { rerender } = render(<IncidentLog anomalies={incidents} onClear={onClear} />);
  fireEvent.click(screen.getByRole('button', { name: 'Acknowledge shown' }));
  fireEvent.change(screen.getByLabelText('Incident severity'), { target: { value: 'critical' } });
  fireEvent.click(screen.getByRole('button', { name: 'Clear all incidents' }));
  expect(onClear).toHaveBeenCalledTimes(1);
  rerender(<IncidentLog anomalies={[]} onClear={onClear} />);
  expect(screen.getByText('No incidents detected')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('0 acknowledged');
  expect((screen.getByRole('button', { name: 'Acknowledge shown' }) as HTMLButtonElement).disabled).toBe(true);
});
