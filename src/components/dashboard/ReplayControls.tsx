import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Circle, 
  Square, 
  Play, 
  RotateCcw,
  Film
} from 'lucide-react';

interface ReplayControlsProps {
  isRecording: boolean;
  hasSession: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEnterReplayMode: () => void;
  onClearSession: () => void;
  snapshotCount?: number;
  incidentCount?: number;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isRecording,
  hasSession,
  onStartRecording,
  onStopRecording,
  onEnterReplayMode,
  onClearSession,
  snapshotCount = 0,
  incidentCount = 0
}) => {
  return (
    <div className="flex items-center gap-2">
      {!isRecording && !hasSession && (
        <Button
          variant="outline"
          size="sm"
          onClick={onStartRecording}
          className="gap-2 border-critical/50 text-critical hover:bg-critical/10"
        >
          <Circle className="w-3 h-3 fill-current" />
          <span className="font-orbitron text-xs">RECORD</span>
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-critical/20 rounded border border-critical/50">
            <Circle className="w-2 h-2 fill-critical text-critical animate-pulse" />
            <span className="font-mono-tech text-xs text-critical">
              REC • {snapshotCount} frames
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onStopRecording}
            className="gap-2"
          >
            <Square className="w-3 h-3" />
            <span className="font-orbitron text-xs">STOP</span>
          </Button>
        </div>
      )}

      {hasSession && !isRecording && (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onEnterReplayMode}
            className="gap-2"
          >
            <Film className="w-3 h-3" />
            <span className="font-orbitron text-xs">REPLAY</span>
            <span className="font-mono-tech text-xs opacity-70">
              ({incidentCount} incidents)
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Clear saved recording"
            onClick={onClearSession}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
