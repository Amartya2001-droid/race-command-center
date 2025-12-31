export interface TyreData {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
  compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
  age: number;
}

export interface DriverTelemetry {
  id: string;
  driverNumber: number;
  driverName: string;
  teamName: string;
  teamColor: string;
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  rpm: number;
  fuelLevel: number;
  fuelRate: number;
  tyreTemp: TyreData;
  tyreWear: TyreData;
  ersDeployment: number;
  ersHarvest: number;
  drs: boolean;
  lapNumber: number;
  currentLapTime: number;
  lastLapTime: number;
  bestLapTime: number;
  sector1: number;
  sector2: number;
  sector3: number;
  gapToLeader: number;
  position: number;
  pitStops: number;
  status: 'racing' | 'pit' | 'out' | 'finished';
}

export interface Anomaly {
  id: string;
  timestamp: Date;
  driverId: string;
  driverNumber: number;
  type: 'tyre_overheat' | 'fuel_critical' | 'performance_drop' | 'ers_failure' | 'brake_temp' | 'connection_lost';
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
}

export interface SystemHealth {
  dataStreamLatency: number;
  packetsReceived: number;
  packetsDropped: number;
  connectionStatus: 'connected' | 'degraded' | 'disconnected';
  lastUpdate: Date;
  uptime: number;
}

export interface RaceInfo {
  name: string;
  circuit: string;
  currentLap: number;
  totalLaps: number;
  raceStatus: 'pre-race' | 'racing' | 'safety-car' | 'red-flag' | 'finished';
  trackTemp: number;
  airTemp: number;
  humidity: number;
  windSpeed: number;
  sessionTime: number;
}
