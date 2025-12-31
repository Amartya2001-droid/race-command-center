import React from 'react';
import { formatLapTime } from '@/utils/telemetrySimulator';

interface LapDeltaProps {
  current: number;
  last: number;
  best: number;
  sector1: number;
  sector2: number;
  sector3: number;
}

export const LapDelta: React.FC<LapDeltaProps> = ({
  current,
  last,
  best,
  sector1,
  sector2,
  sector3,
}) => {
  const deltaToLast = current - last;
  const deltaToBest = last - best;

  return (
    <div className="space-y-2">
      {/* Lap times */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="telemetry-label block">LAST</span>
          <span className="font-mono-tech text-sm">{formatLapTime(last)}</span>
        </div>
        <div>
          <span className="telemetry-label block">BEST</span>
          <span className="font-mono-tech text-sm text-purple-400">{formatLapTime(best)}</span>
        </div>
        <div>
          <span className="telemetry-label block">DELTA</span>
          <span className={`font-mono-tech text-sm ${deltaToBest > 0 ? 'text-delta-positive' : 'text-delta-negative'}`}>
            {deltaToBest > 0 ? '+' : ''}{deltaToBest.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Sectors */}
      <div className="grid grid-cols-3 gap-1">
        {[sector1, sector2, sector3].map((time, idx) => (
          <div 
            key={idx}
            className="text-center px-2 py-1 bg-secondary/50 rounded"
          >
            <span className="telemetry-label block">S{idx + 1}</span>
            <span className="font-mono-tech text-xs">{time.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
