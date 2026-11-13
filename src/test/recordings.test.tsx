import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useRaceRecording } from '@/hooks/useRaceRecording';
import { parseRecording, serializeRecording, RECORDING_KEY, MAX_RECORDING_BYTES } from '@/utils/recordingStorage';
import { generateDriverTelemetry, generateRaceInfo, generateSystemHealth } from '@/utils/telemetrySimulator';
import type { RecordingSession } from '@/types/replay';

const fixture = (): RecordingSession => {
  const driver = generateDriverTelemetry('ver-1', 0);
  const raceInfo = generateRaceInfo();
  const frame = (timestamp: number) => ({ timestamp, drivers: [driver], raceInfo, systemHealth: generateSystemHealth() });
  return { id: 'test-session', startTime: 1000, endTime: 2000, raceInfo,
    snapshots: [frame(1000), frame(1500), frame(2000)], incidents: [{ id: 'test-incident', snapshotIndex: 1,
      anomaly: { id: 'test-incident', timestamp: new Date(1500), driverId: 'ver-1', driverNumber: 1, type: 'tyre_overheat', severity: 'warning', message: 'Test warning' },
      telemetryContext: driver, summary: { whatHappened: 'Test event', impact: 'Test impact', suggestedAction: 'Test action' } }] };
};
const props = () => ({ drivers: [generateDriverTelemetry('ver-1', 0)], anomalies: [], systemHealth: generateSystemHealth(), raceInfo: generateRaceInfo(), isPaused: false });
afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks(); });

test('versioned export roundtrip revives incident/health dates for replay', () => {
  const data = fixture();
  const restored = parseRecording(serializeRecording(data));
  expect(restored).toEqual(data);
  expect(restored.incidents[0].anomaly.timestamp).toBeInstanceOf(Date);
  expect(restored.snapshots[0].systemHealth.lastUpdate).toBeInstanceOf(Date);
});

test.each(['unsupported version', 'missing frames', 'bad incident index', 'bad driver', 'invalid date', 'reversed timeline'])('rejects %s imports', reason => {
  const data = JSON.parse(serializeRecording(fixture()));
  if (reason === 'unsupported version') data.schemaVersion = 2;
  if (reason === 'missing frames') data.recording.snapshots = [];
  if (reason === 'bad incident index') data.recording.incidents[0].snapshotIndex = 9;
  if (reason === 'bad driver') delete data.recording.snapshots[0].drivers[0].speed;
  if (reason === 'invalid date') data.recording.incidents[0].anomaly.timestamp = 'bad date';
  if (reason === 'reversed timeline') data.recording.snapshots[1].timestamp = 500;
  expect(() => parseRecording(JSON.stringify(data))).toThrow('Invalid recording');
});

test('rejects malformed and oversized JSON without storing it', () => {
  expect(() => parseRecording('{')).toThrow('valid JSON');
  expect(() => parseRecording(' '.repeat(MAX_RECORDING_BYTES + 1))).toThrow('4 MiB');
});

test('Stop saves a recording; reload restores it; Clear removes it durably', () => {
  const input = props();
  const first = renderHook(() => useRaceRecording(input));
  act(() => first.result.current.startRecording());
  act(() => first.result.current.stopRecording());
  expect(localStorage.getItem(RECORDING_KEY)).toBeTruthy();
  first.unmount();
  const second = renderHook(() => useRaceRecording(input));
  expect(second.result.current.replayState.session?.snapshots).toHaveLength(1);
  act(() => { second.result.current.clearSession(); });
  expect(localStorage.getItem(RECORDING_KEY)).toBeNull();
  expect(second.result.current.replayState.session).toBeNull();
});

test('invalid import preserves current session and valid import supports timestamp-paced replay and replay from end', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useRaceRecording(props()));
  // Stable inputs are essential: production changes telemetry on its own interval.
  act(() => result.current.importRecording(serializeRecording(fixture())));
  expect(() => act(() => result.current.importRecording('{}'))).toThrow();
  expect(result.current.replayState.session?.id).toBe('test-session');
  act(() => result.current.startPlayback());
  act(() => { vi.advanceTimersByTime(499); });
  expect(result.current.replayState.currentIndex).toBe(0);
  act(() => { vi.advanceTimersByTime(1); });
  expect(result.current.replayState.currentIndex).toBe(1);
  act(() => result.current.setPlaybackSpeed(2));
  act(() => { vi.advanceTimersByTime(250); });
  expect(result.current.replayState.currentIndex).toBe(2);
  expect(result.current.replayState.isPlaying).toBe(false);
  act(() => result.current.startPlayback());
  expect(result.current.replayState.currentIndex).toBe(0);
});

test('corrupt storage and storage quota failures are explicit and recording stays exportable', () => {
  localStorage.setItem(RECORDING_KEY, '{}');
  const input = props();
  const { result } = renderHook(() => useRaceRecording(input));
  expect(result.current.storageMessage).toContain('could not be loaded');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  act(() => result.current.startRecording());
  act(() => result.current.stopRecording());
  expect(result.current.storageMessage).toContain('could not be saved');
  expect(result.current.getRecording()?.snapshots).toHaveLength(1);
});

test('capture limit stops and saves automatically rather than growing indefinitely', () => {
  const input = props();
  vi.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(3 * 1024 * 1024);
  const { result } = renderHook(() => useRaceRecording(input));
  act(() => result.current.startRecording());
  expect(result.current.replayState.isRecording).toBe(false);
  expect(result.current.replayState.session?.snapshots).toHaveLength(1);
  expect(result.current.storageMessage).toContain('capture limit');
});

test('recording while paused cannot create an empty saved session', () => {
  const input = { ...props(), isPaused: true };
  const { result } = renderHook(() => useRaceRecording(input));
  act(() => result.current.startRecording());
  act(() => result.current.stopRecording());
  expect(result.current.replayState.session).toBeNull();
  expect(result.current.storageMessage).toContain('No frames');
  expect(localStorage.getItem(RECORDING_KEY)).toBeNull();
});
