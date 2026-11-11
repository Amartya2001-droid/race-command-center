import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings, Download, Maximize2 } from 'lucide-react';

interface ControlPanelProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onExport: () => void;
  updateInterval: number;
  onUpdateInterval: (interval: number) => void;
  aiEnabled: boolean;
  onAIEnabled: (enabled: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPaused,
  onTogglePause,
  onReset,
  onExport,
  updateInterval, onUpdateInterval, aiEnabled, onAIEnabled,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
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

      <Button aria-label="Settings" onClick={() => setSettingsOpen(true)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Settings className="w-4 h-4" />
      </Button>

      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Maximize2 className="w-4 h-4" />
      </Button>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simulator settings</DialogTitle>
            <DialogDescription>Changes apply immediately to this session. Reset or reload restores defaults.</DialogDescription>
          </DialogHeader>
          <label className="flex items-center justify-between gap-4">
            Telemetry interval
            <select aria-label="Telemetry interval" className="bg-background border rounded p-2" value={updateInterval}
              onChange={event => onUpdateInterval(Number(event.target.value))}>
              <option value={150}>150 ms</option>
              <option value={500}>500 ms</option>
              <option value={1000}>1000 ms</option>
            </select>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={aiEnabled} onChange={event => onAIEnabled(event.target.checked)} />
            Enable AI risk polling
          </label>
          <p className="text-sm text-muted-foreground">AI requires a configured backend. Disabling polling stops new requests; a request already in progress may finish.</p>
          <Button onClick={() => setSettingsOpen(false)}>Done</Button>
        </DialogContent>
      </Dialog>
      {/* Live indicator */}
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/30">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-orbitron text-xs text-primary">LIVE</span>
      </div>
    </div>
  );
};
