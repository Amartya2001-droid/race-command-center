import React from 'react';
import { SystemHealth } from '@/types/telemetry';
import { Activity, Wifi, Package, Clock, Server, Zap } from 'lucide-react';

interface SystemHealthPanelProps {
  health: SystemHealth;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ health }) => {
  const packetLossRate = health.packetsDropped / health.packetsReceived * 100;

  const getLatencyStatus = () => {
    if (health.dataStreamLatency < 5) return { status: 'ok', label: 'Excellent' };
    if (health.dataStreamLatency < 10) return { status: 'ok', label: 'Good' };
    if (health.dataStreamLatency < 20) return { status: 'warning', label: 'Moderate' };
    return { status: 'critical', label: 'High' };
  };

  const latencyInfo = getLatencyStatus();

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-speed" />
          <h3 className="font-orbitron font-semibold text-sm">SYSTEM HEALTH</h3>
        </div>
        <div className={`status-dot ${
          health.connectionStatus === 'connected' ? 'ok' : 
          health.connectionStatus === 'degraded' ? 'warning' : 'critical'
        }`} />
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${
              health.connectionStatus === 'connected' ? 'text-success' : 
              health.connectionStatus === 'degraded' ? 'text-warning' : 'text-critical'
            }`} />
            <span className="telemetry-label">CONNECTION</span>
          </div>
          <span className={`font-orbitron text-sm uppercase ${
            health.connectionStatus === 'connected' ? 'text-success' : 
            health.connectionStatus === 'degraded' ? 'text-warning' : 'text-critical'
          }`}>
            {health.connectionStatus}
          </span>
        </div>

        {/* Latency */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${
              latencyInfo.status === 'ok' ? 'text-success' : 
              latencyInfo.status === 'warning' ? 'text-warning' : 'text-critical'
            }`} />
            <span className="telemetry-label">LATENCY</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-orbitron text-xl font-bold text-foreground">
              {health.dataStreamLatency.toFixed(1)}
            </span>
            <span className="text-muted-foreground text-sm">ms</span>
          </div>
        </div>

        {/* Packets Received */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-speed" />
            <span className="telemetry-label">PACKETS</span>
          </div>
          <span className="font-mono-tech text-sm">
            {health.packetsReceived.toLocaleString()}
          </span>
        </div>

        {/* Packet Loss */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${
              packetLossRate < 0.1 ? 'text-success' : 
              packetLossRate < 0.5 ? 'text-warning' : 'text-critical'
            }`} />
            <span className="telemetry-label">LOSS RATE</span>
          </div>
          <span className={`font-mono-tech text-sm ${
            packetLossRate < 0.1 ? 'text-success' : 
            packetLossRate < 0.5 ? 'text-warning' : 'text-critical'
          }`}>
            {packetLossRate.toFixed(3)}%
          </span>
        </div>
      </div>

      {/* Data Stream Visualization */}
      <div className="px-4 pb-4">
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <div className="absolute inset-0 data-stream opacity-50" />
          <div 
            className={`absolute inset-y-0 left-0 rounded-full ${
              health.connectionStatus === 'connected' ? 'bg-success' : 
              health.connectionStatus === 'degraded' ? 'bg-warning' : 'bg-critical'
            }`}
            style={{ 
              width: health.connectionStatus === 'connected' ? '100%' : 
                     health.connectionStatus === 'degraded' ? '60%' : '20%',
              transition: 'width 0.5s ease'
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="telemetry-label">STREAM STATUS</span>
          <span className="telemetry-label animate-data-flow">● LIVE</span>
        </div>
      </div>
    </div>
  );
};
