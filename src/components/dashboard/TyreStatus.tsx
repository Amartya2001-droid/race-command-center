import React from 'react';
import { TyreData } from '@/types/telemetry';

interface TyreStatusProps {
  temps: TyreData;
  wear: TyreData;
}

const getTyreColor = (temp: number): string => {
  if (temp > 110) return 'bg-critical';
  if (temp > 100) return 'bg-warning';
  if (temp > 85) return 'bg-tyre-optimal';
  return 'bg-tyre-cold';
};

const getWearColor = (wear: number): string => {
  if (wear > 70) return 'text-critical';
  if (wear > 50) return 'text-warning';
  return 'text-success';
};

const getCompoundColor = (compound: TyreData['compound']): string => {
  switch (compound) {
    case 'soft': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'hard': return 'bg-white';
    case 'intermediate': return 'bg-green-500';
    case 'wet': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export const TyreStatus: React.FC<TyreStatusProps> = ({ temps, wear }) => {
  const tyres = [
    { key: 'FL', temp: temps.frontLeft, wear: wear.frontLeft, pos: 'top-0 left-0' },
    { key: 'FR', temp: temps.frontRight, wear: wear.frontRight, pos: 'top-0 right-0' },
    { key: 'RL', temp: temps.rearLeft, wear: wear.rearLeft, pos: 'bottom-0 left-0' },
    { key: 'RR', temp: temps.rearRight, wear: wear.rearRight, pos: 'bottom-0 right-0' },
  ];

  return (
    <div className="relative w-24 h-32">
      {/* Car body silhouette */}
      <div className="absolute inset-x-4 inset-y-2 bg-secondary/30 rounded-lg border border-border/50" />
      
      {/* Tyres */}
      {tyres.map(tyre => (
        <div 
          key={tyre.key}
          className={`absolute ${tyre.pos} w-8 flex flex-col items-center`}
        >
          <div 
            className={`w-6 h-8 rounded-sm ${getTyreColor(tyre.temp)} transition-colors duration-300`}
            style={{
              boxShadow: tyre.temp > 105 
                ? '0 0 8px hsl(var(--warning))' 
                : tyre.temp > 110 
                  ? '0 0 12px hsl(var(--critical))' 
                  : 'none'
            }}
          />
          <span className="font-mono-tech text-[10px] mt-0.5">{Math.round(tyre.temp)}°</span>
        </div>
      ))}

      {/* Compound indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={`w-4 h-4 rounded-full ${getCompoundColor(temps.compound)}`} />
        <span className="telemetry-label block text-center mt-1">
          L{temps.age}
        </span>
      </div>
    </div>
  );
};
