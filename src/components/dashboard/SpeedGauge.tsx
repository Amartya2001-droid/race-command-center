import React from 'react';

interface SpeedGaugeProps {
  speed: number;
  maxSpeed?: number;
  size?: number;
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({ 
  speed, 
  maxSpeed = 370,
  size = 120 
}) => {
  const percentage = Math.min((speed / maxSpeed) * 100, 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;
  
  // Color based on speed
  const getSpeedColor = () => {
    if (speed > 300) return 'hsl(var(--primary))';
    if (speed > 200) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-135"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getSpeedColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="gauge-ring gauge-glow transition-all duration-100"
          style={{ filter: `drop-shadow(0 0 6px ${getSpeedColor()})` }}
        />
      </svg>
      
      {/* Center display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="font-orbitron text-2xl font-bold telemetry-value"
          style={{ color: getSpeedColor() }}
        >
          {speed}
        </span>
        <span className="telemetry-label">KM/H</span>
      </div>
    </div>
  );
};
