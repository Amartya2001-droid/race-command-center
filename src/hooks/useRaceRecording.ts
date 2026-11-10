import { useState, useCallback, useRef, useEffect } from 'react';
import { DriverTelemetry, Anomaly, SystemHealth, RaceInfo } from '@/types/telemetry';
import { TelemetrySnapshot, RecordedIncident, RecordingSession, ReplayState, PlaybackSpeed } from '@/types/replay';
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
  const [replayState, setReplayState] = useState<ReplayState>({
    isRecording: false,
    isPlaying: false,
    currentIndex: 0,
    playbackSpeed: 1,
    session: null
  });

  const snapshotsRef = useRef<TelemetrySnapshot[]>([]);
  const incidentsRef = useRef<RecordedIncident[]>([]);
  const recordedAnomalyIdsRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(0);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          }
        }
      });
    }
  }, [replayState.isRecording, isPaused, drivers, anomalies, systemHealth, raceInfo]);

  // Playback logic
  useEffect(() => {
    if (replayState.isPlaying && replayState.session) {
      const interval = 150 / replayState.playbackSpeed;
      
      playbackIntervalRef.current = setInterval(() => {
        setReplayState(prev => {
          if (!prev.session) return prev;
          const nextIndex = prev.currentIndex + 1;
          if (nextIndex >= prev.session.snapshots.length) {
            return { ...prev, isPlaying: false };
          }
          return { ...prev, currentIndex: nextIndex };
        });
      }, interval);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [replayState.isPlaying, replayState.playbackSpeed, replayState.session]);

  const startRecording = useCallback(() => {
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
    const session: RecordingSession = {
      id: `session-${Date.now()}`,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      snapshots: [...snapshotsRef.current],
      incidents: [...incidentsRef.current],
      raceInfo
    };

    setReplayState(prev => ({
      ...prev,
      isRecording: false,
      session,
      currentIndex: 0
    }));
  }, [raceInfo]);

  const startPlayback = useCallback(() => {
    if (replayState.session && replayState.session.snapshots.length > 0) {
      setReplayState(prev => ({ ...prev, isPlaying: true }));
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
    setReplayState({
      isRecording: false,
      isPlaying: false,
      currentIndex: 0,
      playbackSpeed: 1,
      session: null
    });
    snapshotsRef.current = [];
    incidentsRef.current = [];
    recordedAnomalyIdsRef.current = new Set();
  }, []);

  // Get current playback data
  const currentSnapshot = replayState.session?.snapshots[replayState.currentIndex] || null;
  const progress = replayState.session 
    ? (replayState.currentIndex / Math.max(1, replayState.session.snapshots.length - 1)) * 100
    : 0;

  return {
    replayState,
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
