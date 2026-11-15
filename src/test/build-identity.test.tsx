import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { BuildIdentity } from '@/components/BuildIdentity';
import type { BuildIdentity as Identity } from '@/types/deployment';
afterEach(cleanup);
test('tests/dev without injected metadata do not claim a deployed revision', () => {
  render(<BuildIdentity />);
  expect(screen.getByText('Build identity unavailable in this development/test session.')).toBeTruthy();
});
test.each([false, true, null])('shows source SHA, branch and actual provenance (%s)', dirty => {
  const identity = { schemaVersion: 1, commit: 'a'.repeat(40), repository: 'owner/repo', branch: 'feature/test', dirty,
    builtAt: '2026-11-15T00:00:00Z', contract: {} } as Identity;
  render(<BuildIdentity identity={identity} />);
  expect(screen.getByText('Build aaaaaaaaaaaa')).toBeTruthy();
  expect(screen.getByText('owner/repo · feature/test')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Deployment manifest' }).getAttribute('href')).toBe('/build-identity.json');
  expect(screen.getByText(dirty === null ? 'Unverified source — preview only' : dirty ? 'Uncommitted source — preview only' : 'Clean source checkout')).toBeTruthy();
});
