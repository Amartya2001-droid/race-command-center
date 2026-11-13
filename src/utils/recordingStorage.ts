import { z } from 'zod';
import type { RecordingSession } from '@/types/replay';

export const RECORDING_KEY = 'race-command-center.recording.v1';
export const MAX_RECORDING_BYTES = 4 * 1024 * 1024;
export const MAX_RECORDING_FRAMES = 6000;
const number = z.number().finite();
const text = z.string().min(1).max(2000);
const date = z.union([z.string(), z.date()]).transform(value => new Date(value)).refine(value => Number.isFinite(value.getTime()), 'Invalid date');
const tyre = z.object({ frontLeft: number, frontRight: number, rearLeft: number, rearRight: number,
  compound: z.enum(['soft', 'medium', 'hard', 'intermediate', 'wet']), age: number });
const driver = z.object({
  id: text, driverNumber: number, driverName: text, teamName: text, teamColor: text,
  speed: number, gear: number, throttle: number, brake: number, rpm: number, fuelLevel: number, fuelRate: number,
  tyreTemp: tyre, tyreWear: tyre, ersDeployment: number, ersHarvest: number, drs: z.boolean(), lapNumber: number,
  currentLapTime: number, lastLapTime: number, bestLapTime: number, sector1: number, sector2: number, sector3: number,
  gapToLeader: number, position: number, pitStops: number, status: z.enum(['racing', 'pit', 'out', 'finished']),
});
const race = z.object({ name: text, circuit: text, currentLap: number, totalLaps: number,
  raceStatus: z.enum(['pre-race', 'racing', 'safety-car', 'red-flag', 'finished']),
  trackTemp: number, airTemp: number, humidity: number, windSpeed: number, sessionTime: number });
const health = z.object({ dataStreamLatency: number, packetsReceived: number, packetsDropped: number,
  connectionStatus: z.enum(['connected', 'degraded', 'disconnected']), lastUpdate: date, uptime: number });
const anomaly = z.object({ id: text, timestamp: date, driverId: text, driverNumber: number,
  type: z.enum(['tyre_overheat', 'fuel_critical', 'performance_drop', 'ers_failure', 'brake_temp', 'connection_lost']),
  severity: z.enum(['warning', 'critical']), message: text, value: number.optional(), threshold: number.optional() });
const session = z.object({
  id: text, startTime: number, endTime: number, raceInfo: race,
  snapshots: z.array(z.object({ timestamp: number, drivers: z.array(driver).min(1).max(30), systemHealth: health, raceInfo: race })).min(1).max(MAX_RECORDING_FRAMES),
  incidents: z.array(z.object({ id: text, anomaly, snapshotIndex: z.number().int().nonnegative(), telemetryContext: driver,
    summary: z.object({ whatHappened: text, impact: text, suggestedAction: text }) })).max(10000),
}).superRefine((value, ctx) => {
  if (value.endTime < value.startTime || value.snapshots.some((frame, i) =>
    frame.timestamp < value.startTime || frame.timestamp > value.endTime || (i > 0 && frame.timestamp < value.snapshots[i - 1].timestamp))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid recording timeline' });
  }
  if (value.incidents.some(incident => incident.snapshotIndex >= value.snapshots.length ||
      !value.snapshots[incident.snapshotIndex].drivers.some(driver => driver.id === incident.anomaly.driverId))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid incident frame reference' });
  }
});
const envelope = z.object({ schemaVersion: z.literal(1), simulated: z.literal(true), recording: session });

/** Accept the versioned JSON produced by Export; rebuild Date values for replay. */
export function parseRecording(json: string): RecordingSession {
  if (new Blob([json]).size > MAX_RECORDING_BYTES) throw new Error('Recording exceeds the 4 MiB limit.');
  let value: unknown;
  try { value = JSON.parse(json); } catch { throw new Error('Choose a valid JSON recording export.'); }
  const result = envelope.safeParse(value);
  if (!result.success) throw new Error('Invalid recording: use a version 1 simulated export with frames and valid incident references.');
  return result.data.recording as RecordingSession;
}

export function serializeRecording(recording: RecordingSession) {
  const json = JSON.stringify({ schemaVersion: 1, simulated: true, recording });
  // Validate on writes too; don't leave an unreadable recording in storage.
  parseRecording(json);
  return json;
}
