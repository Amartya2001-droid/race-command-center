import React from 'react';
import { RecordedIncident, RecordingSession, PlaybackSpeed } from '@/types/replay';
import { getSeverityColor } from '@/utils/anomalyDetection';
import { getIncidentTypeLabel } from '@/utils/incidentAnalysis';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipBack, 
  Circle, 
  Square,
  Gauge
} from 'lucide-react';

interface ReplayTimelineProps {
  session: RecordingSession;
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onSeek: (index: number) => void;
  onSeekToIncident: (incidentId: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string | null) => void;
}

export const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  session,
  currentIndex,
  isPlaying,
  playbackSpeed,
  onSeek,
  onSeekToIncident,
  onPlay,
  onPause,
  onSetSpeed,
  selectedIncidentId,
  onSelectIncident
}) => {
  const totalSnapshots = session.snapshots.length;
  const progress = (currentIndex / Math.max(1, totalSnapshots - 1)) * 100;
  
  const formatTime = (index: number): string => {
    if (!session.snapshots[index]) return '00:00';
    const elapsed = session.snapshots[index].timestamp - session.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIncidentPosition = (incident: RecordedIncident): number => {
    return (incident.snapshotIndex / Math.max(1, totalSnapshots - 1)) * 100;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Playback Controls */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(0)}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Time Display */}
        <div className="font-mono-tech text-sm text-muted-foreground">
          <span className="text-foreground">{formatTime(currentIndex)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(totalSnapshots - 1)}</span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 ml-auto">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          {([1, 2] as PlaybackSpeed[]).map(speed => (
            <Button
              key={speed}
              variant={playbackSpeed === speed ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSetSpeed(speed)}
              className="h-7 px-2 font-mono-tech text-xs"
            >
              {speed}×
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline Slider with Incident Markers */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          {/* Incident Markers */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 pointer-events-none z-10">
            {session.incidents.map(incident => (
              <button
                key={incident.id}
                className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 cursor-pointer pointer-events-auto transition-transform hover:scale-150 ${
                  incident.anomaly.severity === 'critical' ? 'bg-critical' : 'bg-warning'
                } ${selectedIncidentId === incident.id ? 'ring-2 ring-foreground scale-150' : ''}`}
                style={{ left: `${getIncidentPosition(incident)}%` }}
                onClick={() => {
                  onSeekToIncident(incident.id);
                  onSelectIncident(incident.id);
                }}
                title={`${getIncidentTypeLabel(incident.anomaly.type)} - #${incident.anomaly.driverNumber}`}
              />
            ))}
          </div>
          
          <Slider
            value={[currentIndex]}
            min={0}
            max={totalSnapshots - 1}
            step={1}
            onValueChange={([value]) => onSeek(value)}
            className="relative z-0"
          />
        </div>

        {/* Incident Legend */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-critical text-critical" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-warning text-warning" />
            <span>Warning</span>
          </div>
          <span className="ml-auto font-mono-tech">
            {session.incidents.length} incidents recorded
          </span>
        </div>
      </div>

      {/* Incident List */}
      <ScrollArea className="h-48">
        <div className="divide-y divide-border">
          {session.incidents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No incidents recorded in this session
            </div>
          ) : (
            session.incidents.map(incident => (
              <button
                key={incident.id}
                onClick={() => {
                  onSeekToIncident(incident.id);
                  onSelectIncident(incident.id);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors ${
                  selectedIncidentId === incident.id ? 'bg-secondary/70 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${getSeverityColor(incident.anomaly.severity)}`}>
                    {incident.anomaly.severity.toUpperCase()}
                  </span>
                  <span className="font-orbitron text-xs text-primary">
                    #{incident.anomaly.driverNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getIncidentTypeLabel(incident.anomaly.type)}
                  </span>
                  <span className="ml-auto font-mono-tech text-xs text-muted-foreground">
                    {formatTime(incident.snapshotIndex)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
