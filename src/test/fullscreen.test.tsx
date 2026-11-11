import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { FullscreenButton } from '@/components/dashboard/FullscreenButton';
afterEach(() => { cleanup(); vi.restoreAllMocks(); Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null }); });

test('Fullscreen enters/exits and follows external Escape changes', async () => {
  let element: Element | null = null;
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
  const change = (value: Element | null) => { element = value; document.dispatchEvent(new Event('fullscreenchange')); };
  const enter = vi.fn(async () => change(document.documentElement));
  const exit = vi.fn(async () => change(null));
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: enter });
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });
  render(<FullscreenButton />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' })); });
  expect(enter).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Exit fullscreen' }).getAttribute('aria-pressed')).toBe('true');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' })); });
  expect(exit).toHaveBeenCalledTimes(1);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' })); });
  act(() => change(null));
  expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeTruthy();
});

test.each(['unsupported', 'denied'])('Fullscreen reports %s instead of rejecting silently', async reason => {
  Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true,
    value: reason === 'unsupported' ? undefined : vi.fn().mockRejectedValue(new Error('denied')) });
  render(<FullscreenButton />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' })); });
  expect(screen.getByRole('alert').textContent).toContain('Fullscreen unavailable');
});
