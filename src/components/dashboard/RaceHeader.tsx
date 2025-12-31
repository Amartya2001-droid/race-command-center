import React from 'react';
import { RaceInfo, SystemHealth } from '@/types/telemetry';
import { Flag, Clock, Thermometer, Wind, Droplets, Activity } from 'lucide-react';

interface RaceHeaderProps {
  raceInfo: RaceInfo;
  systemHealth: SystemHealth;
}

export const RaceHeader: React.FC<RaceHeaderProps> = ({ raceInfo, systemHealth }) => {
  const formatUptime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <header className="relative overflow-hidden bg-card border-b border-border">
      {/* Racing stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1 racing-stripe" />
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      
      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Race Info */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
                <Flag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-orbitron text-xl font-bold text-foreground tracking-wide">
                  {raceInfo.name}
                </h1>
                <p className="text-sm text-muted-foreground font-rajdhani">
                  {raceInfo.circuit}
                </p>
              </div>
            </div>

            {/* Lap Counter */}
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg border border-border">
              <span className="telemetry-label">LAP</span>
              <span className="font-orbitron text-2xl font-bold text-primary">
                {raceInfo.currentLap}
              </span>
              <span className="text-muted-foreground font-rajdhani">/</span>
              <span className="font-orbitron text-lg text-muted-foreground">
                {raceInfo.totalLaps}
              </span>
            </div>

            {/* Race Status */}
            <div className="flex items-center gap-2">
              <div className={`status-dot ${raceInfo.raceStatus === 'racing' ? 'ok' : 'warning'}`} />
              <span className="font-orbitron text-sm uppercase tracking-wider">
                {raceInfo.raceStatus.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Weather & Track Conditions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-warning" />
                <div>
                  <span className="telemetry-label block">TRACK</span>
                  <span className="font-mono-tech text-sm">{raceInfo.trackTemp}°C</span>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-speed" />
                <div>
                  <span className="telemetry-label block">AIR</span>
                  <span className="font-mono-tech text-sm">{raceInfo.airTemp}°C</span>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-speed" />
                <div>
                  <span className="telemetry-label block">HUM</span>
                  <span className="font-mono-tech text-sm">{raceInfo.humidity}%</span>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="telemetry-label block">WIND</span>
                  <span className="font-mono-tech text-sm">{raceInfo.windSpeed} km/h</span>
                </div>
              </div>
            </div>

            {/* System Health Indicator */}
            <div className="flex items-center gap-3 px-4 py-2 bg-secondary/30 rounded-lg border border-border">
              <Activity className={`w-5 h-5 ${
                systemHealth.connectionStatus === 'connected' ? 'text-success' : 
                systemHealth.connectionStatus === 'degraded' ? 'text-warning' : 'text-critical'
              }`} />
              <div>
                <span className="telemetry-label block">STREAM</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-sm">
                    {systemHealth.dataStreamLatency.toFixed(1)}ms
                  </span>
                  <div className={`status-dot ${
                    systemHealth.connectionStatus === 'connected' ? 'ok' : 
                    systemHealth.connectionStatus === 'degraded' ? 'warning' : 'critical'
                  }`} />
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="telemetry-label block">UPTIME</span>
                <span className="font-mono-tech text-sm">{formatUptime(systemHealth.uptime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
