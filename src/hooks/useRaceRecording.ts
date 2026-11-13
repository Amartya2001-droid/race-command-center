import { useState, useCallback, useRef, useEffect } from 'react';
import { DriverTelemetry, Anomaly, SystemHealth, RaceInfo } from '@/types/telemetry';
import { TelemetrySnapshot, RecordedIncident, RecordingSession, ReplayState, PlaybackSpeed } from '@/types/replay';
import { MAX_RECORDING_FRAMES, RECORDING_KEY, parseRecording, serializeRecording } from '@/utils/recordingStorage';
import { generateIncidentSummary } from '@/utils/incidentAnalysis';

interface UseRaceRecordingProps {
  drivers: DriverTelemetry[];
  anomalies: Anomaly[];
  systemHealth: SystemHealth;
  raceInfo: RaceInfo;
  isPaused: boolean;
}

export const useRaceRecording = ({
  drivers,
  anomalies,
  systemHealth,
  raceInfo,
  isPaused
}: UseRaceRecordingProps) => {
  const [restored] = useState(() => {
    try {
      const json = localStorage.getItem(RECORDING_KEY);
      return { session: json ? parseRecording(json) : null, error: null as string | null };
    } catch {
      return { session: null, error: 'Saved recording could not be loaded. Import a valid export or clear it.' };
    }
  });
  const [storageMessage, setStorageMessage] = useState<string | null>(restored.error);
  const [replayState, setReplayState] = useState<ReplayState>({
    isRecording: false,
    isPlaying: false,
    currentIndex: 0,
    playbackSpeed: 1,
    session: restored.session
  });

  const [snapshotCount, setSnapshotCount] = useState(restored.session?.snapshots.length ?? 0);
  const capturedBytesRef = useRef(0);
  const isRecordingRef = useRef(false);
  isRecordingRef.current = replayState.isRecording;
  const snapshotsRef = useRef<TelemetrySnapshot[]>([]);
  const incidentsRef = useRef<RecordedIncident[]>([]);
  const recordedAnomalyIdsRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(0);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Respect recorded timestamps, including slower Settings cadences and pauses.
  useEffect(() => {
    const session = replayState.session;
    if (!replayState.isPlaying || !session) return;
    if (replayState.currentIndex >= session.snapshots.length - 1) {
      setReplayState(prev => ({ ...prev, isPlaying: false }));
      return;
    }
    const current = session.snapshots[replayState.currentIndex];
    const next = session.snapshots[replayState.currentIndex + 1];
    playbackIntervalRef.current = setTimeout(() => {
      setReplayState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }, Math.max(1, (next.timestamp - current.timestamp) / replayState.playbackSpeed));
    return () => { if (playbackIntervalRef.current) clearTimeout(playbackIntervalRef.current); };
  }, [replayState.isPlaying, replayState.currentIndex, replayState.playbackSpeed, replayState.session]);

  const startRecording = useCallback(() => {
    setStorageMessage(null);
    setSnapshotCount(0);
    capturedBytesRef.current = 0;
    snapshotsRef.current = [];
    incidentsRef.current = [];
    recordedAnomalyIdsRef.current = new Set();
    startTimeRef.current = Date.now();
    
    setReplayState(prev => ({
      ...prev,
      isRecording: true,
      isPlaying: false,
      session: null
    }));
  }, []);

  const stopRecording = useCallback(() => {
    if (snapshotsRef.current.length === 0) {
      setReplayState(prev => ({ ...prev, isRecording: false }));
      setStorageMessage('No frames captured. Resume telemetry before recording.');
      return;
    }
    const session: RecordingSession = {
      id: `session-${Date.now()}`,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      snapshots: [...snapshotsRef.current],
      incidents: [...incidentsRef.current],
      raceInfo
    };

    try {
      localStorage.setItem(RECORDING_KEY, serializeRecording(session));
      setStorageMessage(snapshotsRef.current.length >= MAX_RECORDING_FRAMES || capturedBytesRef.current >= 3 * 1024 * 1024 ? 'Recording reached its capture limit and was saved locally.' : 'Recording saved on this browser.');
    } catch {
      setStorageMessage('Recording is available in memory but could not be saved locally. Export it before leaving.');
    }
    setReplayState(prev => ({
      ...prev,
      isRecording: false,
      session,
      currentIndex: 0
    }));
  }, [raceInfo]);

  // Record new snapshots when recording is active
  useEffect(() => {
    if (replayState.isRecording && !isPaused && drivers.length > 0) {
      const snapshot: TelemetrySnapshot = {
        timestamp: Date.now(),
        drivers: JSON.parse(JSON.stringify(drivers)),
        systemHealth: { ...systemHealth },
        raceInfo: { ...raceInfo }
      };
      snapshotsRef.current.push(snapshot);
      capturedBytesRef.current += new Blob([JSON.stringify(snapshot)]).size;
      setSnapshotCount(snapshotsRef.current.length);

      // Record new incidents
      anomalies.forEach(anomaly => {
        if (!recordedAnomalyIdsRef.current.has(anomaly.id)) {
          recordedAnomalyIdsRef.current.add(anomaly.id);
          const driver = drivers.find(d => d.id === anomaly.driverId);
          if (driver) {
            const incident: RecordedIncident = {
              id: anomaly.id,
              anomaly,
              snapshotIndex: snapshotsRef.current.length - 1,
              telemetryContext: JSON.parse(JSON.stringify(driver)),
              summary: generateIncidentSummary(anomaly, driver)
            };
            incidentsRef.current.push(incident);
            capturedBytesRef.current += new Blob([JSON.stringify(incident)]).size;
          }
        }
      });
      if (snapshotsRef.current.length >= MAX_RECORDING_FRAMES || capturedBytesRef.current >= 3 * 1024 * 1024) stopRecording();
    }
  }, [stopRecording, replayState.isRecording, isPaused, drivers, anomalies, systemHealth, raceInfo]);

  const startPlayback = useCallback(() => {
    if (replayState.session && replayState.session.snapshots.length > 0) {
      setReplayState(prev => ({ ...prev, isPlaying: true, currentIndex: prev.currentIndex >= prev.session!.snapshots.length - 1 ? 0 : prev.currentIndex }));
    }
  }, [replayState.session]);

  const pausePlayback = useCallback(() => {
    setReplayState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const seekToIndex = useCallback((index: number) => {
    setReplayState(prev => {
      if (!prev.session) return prev;
      const clampedIndex = Math.max(0, Math.min(index, prev.session.snapshots.length - 1));
      return { ...prev, currentIndex: clampedIndex, isPlaying: false };
    });
  }, []);

  const seekToIncident = useCallback((incidentId: string) => {
    if (!replayState.session) return;
    const incident = replayState.session.incidents.find(i => i.id === incidentId);
    if (incident) {
      seekToIndex(incident.snapshotIndex);
    }
  }, [replayState.session, seekToIndex]);

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    setReplayState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const clearSession = useCallback(() => {
    let deleted = true;
    try { localStorage.removeItem(RECORDING_KEY); setStorageMessage(null); }
    catch { deleted = false; setStorageMessage('Saved recording could not be deleted. Your browser may restore it on reload.'); }
    setReplayState({
      isRecording: false,
      isPlaying: false,
      currentIndex: 0,
      playbackSpeed: 1,
      session: null
    });
    setSnapshotCount(0);
    capturedBytesRef.current = 0;
    snapshotsRef.current = [];
    incidentsRef.current = [];
    recordedAnomalyIdsRef.current = new Set();
    return deleted;
  }, []);

  // Get current playback data
  const currentSnapshot = replayState.session?.snapshots[replayState.currentIndex] || null;
  const progress = replayState.session 
    ? (replayState.currentIndex / Math.max(1, replayState.session.snapshots.length - 1)) * 100
    : 0;

  const importRecording = useCallback((json: string) => {
    if (isRecordingRef.current) throw new Error('Stop recording before importing a session.');
    // Parse before changing anything: invalid imports preserve the current session.
    const session = parseRecording(json);
    try { localStorage.setItem(RECORDING_KEY, serializeRecording(session)); setStorageMessage('Recording imported and saved on this browser.'); }
    catch { setStorageMessage('Imported for this session only. Export it before leaving; local storage is unavailable or full.'); }
    setSnapshotCount(session.snapshots.length);
    setReplayState({ session, isRecording: false, isPlaying: false, currentIndex: 0, playbackSpeed: 1 });
  }, []);

  return {
    replayState,
    storageMessage,
    importRecording,
    snapshotCount,
    getRecording: () => replayState.isRecording ? {
      id: `session-${startTimeRef.current}`, startTime: startTimeRef.current, endTime: Date.now(),
      snapshots: [...snapshotsRef.current], incidents: [...incidentsRef.current], raceInfo
    } : replayState.session,
    currentSnapshot,
    progress,
    startRecording,
    stopRecording,
    startPlayback,
    pausePlayback,
    seekToIndex,
    seekToIncident,
    setPlaybackSpeed,
    clearSession
  };
};
