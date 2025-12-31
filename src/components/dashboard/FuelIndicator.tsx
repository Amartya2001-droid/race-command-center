import React from 'react';
import { Fuel } from 'lucide-react';

interface FuelIndicatorProps {
  level: number;
  rate: number;
}

export const FuelIndicator: React.FC<FuelIndicatorProps> = ({ level, rate }) => {
  const getColor = () => {
    if (level < 10) return 'text-critical';
    if (level < 20) return 'text-warning';
    return 'text-success';
  };

  const getBgColor = () => {
    if (level < 10) return 'bg-critical';
    if (level < 20) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="flex items-center gap-2">
      <Fuel className={`w-4 h-4 ${getColor()}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="telemetry-label">FUEL</span>
          <span className={`font-mono-tech text-xs ${getColor()}`}>
            {level.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full ${getBgColor()} transition-all duration-300`}
            style={{ width: `${level}%` }}
          />
        </div>
        <span className="telemetry-label block mt-1 text-right">
          {rate.toFixed(2)} kg/lap
        </span>
      </div>
    </div>
  );
};
