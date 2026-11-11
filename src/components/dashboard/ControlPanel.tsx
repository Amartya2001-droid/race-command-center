import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings, Download, Maximize2 } from 'lucide-react';

interface ControlPanelProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onExport: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPaused,
  onTogglePause,
  onReset,
  onExport,
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onTogglePause}
        className={`gap-2 ${isPaused ? 'text-warning' : 'text-success'}`}
      >
        {isPaused ? (
          <>
            <Play className="w-4 h-4" />
            <span className="font-orbitron text-xs">RESUME</span>
          </>
        ) : (
          <>
            <Pause className="w-4 h-4" />
            <span className="font-orbitron text-xs">PAUSE</span>
          </>
        )}
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button onClick={onReset} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
        <RotateCcw className="w-4 h-4" />
        <span className="font-orbitron text-xs">RESET</span>
      </Button>

      <Button onClick={onExport} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
        <Download className="w-4 h-4" />
        <span className="font-orbitron text-xs">EXPORT</span>
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Settings className="w-4 h-4" />
      </Button>

      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Maximize2 className="w-4 h-4" />
      </Button>

      {/* Live indicator */}
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/30">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-orbitron text-xs text-primary">LIVE</span>
      </div>
    </div>
  );
};
