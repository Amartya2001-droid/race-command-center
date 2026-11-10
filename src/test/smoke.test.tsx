import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '@/App';

// The smoke test deliberately runs without backend credentials or network calls.
vi.mock('@/integrations/supabase/client', () => ({ supabase: null }));
afterEach(cleanup);
Object.defineProperty(window, 'matchMedia', { value: vi.fn(() => ({
  matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
})) });

test('dashboard renders without credentials and supports pause and architecture navigation', () => {
  render(<App />);
  expect(screen.getByText('LIVE TELEMETRY - ALL DRIVERS')).toBeTruthy();
  expect(screen.getByText('M. VERSTAPPEN')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'PAUSE' }));
  expect(screen.getByRole('button', { name: 'RESUME' })).toBeTruthy();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'ARCHITECTURE' }), { button: 0, ctrlKey: false });
  expect(screen.getByRole('heading', { name: 'Data Flow' })).toBeTruthy();
});
