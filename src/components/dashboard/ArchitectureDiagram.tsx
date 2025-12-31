import React from 'react';
import { Database, Server, Monitor, Wifi, AlertTriangle, BarChart3, Cpu, Radio } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border-b border-border">
        <Cpu className="w-5 h-5 text-primary" />
        <h3 className="font-orbitron font-semibold text-sm">SYSTEM ARCHITECTURE</h3>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Data Flow Lines - SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Horizontal flow lines */}
            <line x1="18%" y1="50%" x2="35%" y2="50%" stroke="url(#flowGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-race-line" />
            <line x1="48%" y1="50%" x2="65%" y2="50%" stroke="url(#flowGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-race-line" style={{ animationDelay: '0.5s' }} />
            <line x1="78%" y1="50%" x2="95%" y2="50%" stroke="url(#flowGradient)" strokeWidth="2" strokeDasharray="8 4" className="animate-race-line" style={{ animationDelay: '1s' }} />
          </svg>

          {/* Architecture Nodes */}
          <div className="relative grid grid-cols-4 gap-4" style={{ zIndex: 1 }}>
            {/* Data Sources */}
            <div className="space-y-3">
              <h4 className="font-orbitron text-xs text-muted-foreground uppercase tracking-wider mb-4">Data Sources</h4>
              
              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-4 h-4 text-primary" />
                  <span className="font-rajdhani text-sm font-medium">Car Sensors</span>
                </div>
                <p className="text-xs text-muted-foreground">ECU telemetry, GPS, accelerometers</p>
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-speed" />
                  <span className="font-rajdhani text-sm font-medium">Timing System</span>
                </div>
                <p className="text-xs text-muted-foreground">Lap timing, sector splits, gaps</p>
              </div>
            </div>

            {/* Ingestion Layer */}
            <div className="space-y-3">
              <h4 className="font-orbitron text-xs text-muted-foreground uppercase tracking-wider mb-4">Ingestion</h4>
              
              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-warning" />
                  <span className="font-rajdhani text-sm font-medium">WebSocket Server</span>
                </div>
                <p className="text-xs text-muted-foreground">Real-time data streaming, &lt;10ms latency</p>
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-success" />
                  <span className="font-rajdhani text-sm font-medium">Message Queue</span>
                </div>
                <p className="text-xs text-muted-foreground">Kafka/Redis for event buffering</p>
              </div>
            </div>

            {/* Processing Layer */}
            <div className="space-y-3">
              <h4 className="font-orbitron text-xs text-muted-foreground uppercase tracking-wider mb-4">Processing</h4>
              
              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-critical" />
                  <span className="font-rajdhani text-sm font-medium">Anomaly Engine</span>
                </div>
                <p className="text-xs text-muted-foreground">Rule-based detection, thresholds</p>
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span className="font-rajdhani text-sm font-medium">Aggregator</span>
                </div>
                <p className="text-xs text-muted-foreground">Data normalization, metrics calc</p>
              </div>
            </div>

            {/* Visualization */}
            <div className="space-y-3">
              <h4 className="font-orbitron text-xs text-muted-foreground uppercase tracking-wider mb-4">Visualization</h4>
              
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 glow-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <span className="font-rajdhani text-sm font-medium">Ops Dashboard</span>
                </div>
                <p className="text-xs text-muted-foreground">React real-time UI</p>
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-tyre-optimal" />
                  <span className="font-rajdhani text-sm font-medium">Analytics</span>
                </div>
                <p className="text-xs text-muted-foreground">Historical data, trends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary" />
              <span>Data Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span>Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-critical" />
              <span>Alert</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
