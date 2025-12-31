import React from 'react';
import { DriverTelemetry } from '@/types/telemetry';
import { SpeedGauge } from './SpeedGauge';
import { TyreStatus } from './TyreStatus';
import { FuelIndicator } from './FuelIndicator';
import { LapDelta } from './LapDelta';
import { formatGap } from '@/utils/telemetrySimulator';
import { Zap, Radio } from 'lucide-react';

interface DriverCardProps {
  driver: DriverTelemetry;
  hasAnomaly?: boolean;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver, hasAnomaly }) => {
  return (
    <div 
      className={`relative bg-card rounded-lg border overflow-hidden transition-all duration-300 ${
        hasAnomaly 
          ? 'border-critical glow-critical' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Team color accent */}
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: driver.teamColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-md flex items-center justify-center font-orbitron font-bold text-lg"
            style={{ backgroundColor: driver.teamColor + '30', color: driver.teamColor }}
          >
            {driver.driverNumber}
          </div>
          <div>
            <h3 className="font-orbitron font-semibold text-foreground">{driver.driverName}</h3>
            <p className="text-xs text-muted-foreground">{driver.teamName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="telemetry-label block">POS</span>
            <span className="font-orbitron text-2xl font-bold text-primary">
              P{driver.position}
            </span>
          </div>
          <div className="text-right">
            <span className="telemetry-label block">GAP</span>
            <span className="font-mono-tech text-sm">
              {formatGap(driver.gapToLeader)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Speed Gauge */}
          <div className="col-span-3 flex flex-col items-center">
            <SpeedGauge speed={driver.speed} />
            <div className="mt-2 flex items-center gap-4">
              <div className="text-center">
                <span className="telemetry-label block">GEAR</span>
                <span className="font-orbitron text-lg font-bold">{driver.gear}</span>
              </div>
              <div className="text-center">
                <span className="telemetry-label block">RPM</span>
                <span className="font-mono-tech text-sm">{driver.rpm.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Throttle/Brake */}
          <div className="col-span-2 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="telemetry-label">THROTTLE</span>
                <span className="font-mono-tech text-xs text-success">{driver.throttle.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all duration-100"
                  style={{ width: `${driver.throttle}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="telemetry-label">BRAKE</span>
                <span className="font-mono-tech text-xs text-critical">{driver.brake.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-critical transition-all duration-100"
                  style={{ width: `${driver.brake}%` }}
                />
              </div>
            </div>
            
            {/* DRS Indicator */}
            <div className={`flex items-center gap-2 px-2 py-1 rounded ${
              driver.drs ? 'bg-success/20 text-success' : 'bg-secondary/50 text-muted-foreground'
            }`}>
              <Radio className="w-3 h-3" />
              <span className="font-orbitron text-xs font-bold">DRS {driver.drs ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          {/* Tyres */}
          <div className="col-span-2 flex justify-center">
            <TyreStatus temps={driver.tyreTemp} wear={driver.tyreWear} />
          </div>

          {/* Fuel & ERS */}
          <div className="col-span-2 space-y-3">
            <FuelIndicator level={driver.fuelLevel} rate={driver.fuelRate} />
            
            {/* ERS */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-speed" />
                <span className="telemetry-label">ERS DEPLOY</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-speed transition-all duration-100"
                  style={{ width: `${driver.ersDeployment}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="telemetry-label">HARVEST</span>
                <span className="font-mono-tech text-xs">{driver.ersHarvest.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Lap Times */}
          <div className="col-span-3">
            <LapDelta 
              current={driver.currentLapTime}
              last={driver.lastLapTime}
              best={driver.bestLapTime}
              sector1={driver.sector1}
              sector2={driver.sector2}
              sector3={driver.sector3}
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="telemetry-label">LAP {driver.lapNumber}</span>
              <span className="text-muted-foreground">PIT {driver.pitStops}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {driver.status !== 'racing' && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-orbitron uppercase ${
          driver.status === 'pit' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {driver.status}
        </div>
      )}

      {/* Anomaly pulse effect */}
      {hasAnomaly && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-critical rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  );
};
