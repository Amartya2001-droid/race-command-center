import React, { useState } from 'react';
import { RecordingSession, TelemetrySnapshot, PlaybackSpeed } from '@/types/replay';
import { ReplayTimeline } from './ReplayTimeline';
import { IncidentDetailPanel } from './IncidentDetailPanel';
import { DriverCard } from './DriverCard';
import { RaceHeader } from './RaceHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Film } from 'lucide-react';

interface ReplayModeProps {
  session: RecordingSession;
  currentSnapshot: TelemetrySnapshot | null;
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onSeek: (index: number) => void;
  onSeekToIncident: (incidentId: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onExitReplay: () => void;
}

export const ReplayMode: React.FC<ReplayModeProps> = ({
  session,
  currentSnapshot,
  currentIndex,
  isPlaying,
  playbackSpeed,
  onSeek,
  onSeekToIncident,
  onPlay,
  onPause,
  onSetSpeed,
  onExitReplay
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  const selectedIncident = selectedIncidentId 
    ? session.incidents.find(i => i.id === selectedIncidentId) 
    : null;

  const drivers = currentSnapshot?.drivers || [];
  const systemHealth = currentSnapshot?.systemHealth || {
    dataStreamLatency: 0,
    packetsReceived: 0,
    packetsDropped: 0,
    connectionStatus: 'disconnected' as const,
    lastUpdate: new Date(),
    uptime: 0
  };
  const raceInfo = currentSnapshot?.raceInfo || session.raceInfo;

  // Find drivers with anomalies at current snapshot
  const currentTime = currentSnapshot?.timestamp || 0;
  const driversWithAnomalies = new Set(
    session.incidents
      .filter(incident => {
        const incidentTime = session.snapshots[incident.snapshotIndex]?.timestamp || 0;
        return Math.abs(currentTime - incidentTime) < 2000;
      })
      .map(i => i.anomaly.driverId)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Replay Header */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExitReplay}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-orbitron text-xs">EXIT REPLAY</span>
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded border border-primary/30">
            <Film className="w-4 h-4 text-primary" />
            <span className="font-orbitron text-xs text-primary">REPLAY MODE</span>
          </div>
        </div>
        <div className="font-mono-tech text-xs text-muted-foreground">
          Session: {new Date(session.startTime).toLocaleString()}
        </div>
      </div>

      {/* Race Header with replay data */}
      <RaceHeader raceInfo={raceInfo} systemHealth={systemHealth} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Telemetry */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <h2 className="font-orbitron text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                REPLAY TELEMETRY - FRAME {currentIndex + 1}/{session.snapshots.length}
              </h2>
              {drivers.slice(0, 5).map(driver => (
                <DriverCard 
                  key={driver.id} 
                  driver={driver}
                  hasAnomaly={driversWithAnomalies.has(driver.id)}
                />
              ))}
              {drivers.length > 5 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {drivers.slice(5).map(driver => (
                    <DriverCard 
                      key={driver.id} 
                      driver={driver}
                      hasAnomaly={driversWithAnomalies.has(driver.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right - Timeline & Incident Detail */}
        <div className="w-96 border-l border-border flex flex-col bg-card/30">
          {/* Timeline */}
          <div className="p-3 border-b border-border">
            <ReplayTimeline
              session={session}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onSeek={onSeek}
              onSeekToIncident={onSeekToIncident}
              onPlay={onPlay}
              onPause={onPause}
              onSetSpeed={onSetSpeed}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
            />
          </div>

          {/* Incident Detail */}
          <div className="flex-1 min-h-0 p-3">
            {selectedIncident ? (
              <IncidentDetailPanel
                incident={selectedIncident}
                onClose={() => setSelectedIncidentId(null)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-card rounded-lg border border-border p-4">
                <Film className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm text-center">
                  Click on an incident marker or list item to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
