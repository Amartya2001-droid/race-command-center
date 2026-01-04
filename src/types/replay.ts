import { DriverTelemetry, Anomaly, SystemHealth, RaceInfo } from './telemetry';

export interface TelemetrySnapshot {
  timestamp: number;
  drivers: DriverTelemetry[];
  systemHealth: SystemHealth;
  raceInfo: RaceInfo;
}

export interface RecordedIncident {
  id: string;
  anomaly: Anomaly;
  snapshotIndex: number;
  telemetryContext: DriverTelemetry;
  summary: IncidentSummary;
}

export interface IncidentSummary {
  whatHappened: string;
  impact: string;
  suggestedAction: string;
}

export interface RecordingSession {
  id: string;
  startTime: number;
  endTime: number;
  snapshots: TelemetrySnapshot[];
  incidents: RecordedIncident[];
  raceInfo: RaceInfo;
}

export type PlaybackSpeed = 1 | 2;

export interface ReplayState {
  isRecording: boolean;
  isPlaying: boolean;
  currentIndex: number;
  playbackSpeed: PlaybackSpeed;
  session: RecordingSession | null;
}
