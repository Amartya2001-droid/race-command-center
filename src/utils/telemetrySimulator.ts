import { DriverTelemetry, TyreData, RaceInfo, SystemHealth } from '@/types/telemetry';

const TEAMS = [
  { name: 'Red Bull Racing', color: '#3671C6' },
  { name: 'Ferrari', color: '#E8002D' },
  { name: 'Mercedes', color: '#27F4D2' },
  { name: 'McLaren', color: '#FF8000' },
  { name: 'Aston Martin', color: '#229971' },
  { name: 'Alpine', color: '#FF87BC' },
  { name: 'Williams', color: '#64C4FF' },
  { name: 'Haas', color: '#B6BABD' },
  { name: 'Sauber', color: '#52E252' },
  { name: 'RB', color: '#6692FF' },
];

const DRIVERS = [
  { number: 1, name: 'M. VERSTAPPEN', team: 0 },
  { number: 11, name: 'S. PEREZ', team: 0 },
  { number: 16, name: 'C. LECLERC', team: 1 },
  { number: 55, name: 'C. SAINZ', team: 1 },
  { number: 44, name: 'L. HAMILTON', team: 2 },
  { number: 63, name: 'G. RUSSELL', team: 2 },
  { number: 4, name: 'L. NORRIS', team: 3 },
  { number: 81, name: 'O. PIASTRI', team: 3 },
  { number: 14, name: 'F. ALONSO', team: 4 },
  { number: 18, name: 'L. STROLL', team: 4 },
];

const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const generateTyreData = (baseTemp: number, wear: number): TyreData => {
  const variance = 8;
  return {
    frontLeft: baseTemp + randomInRange(-variance, variance),
    frontRight: baseTemp + randomInRange(-variance, variance),
    rearLeft: baseTemp + randomInRange(-variance, variance) + 5,
    rearRight: baseTemp + randomInRange(-variance, variance) + 5,
    compound: ['soft', 'medium', 'hard'][Math.floor(Math.random() * 3)] as TyreData['compound'],
    age: Math.floor(randomInRange(1, 25)),
  };
};

const generateTyreWear = (): TyreData => {
  const baseWear = randomInRange(10, 60);
  return {
    frontLeft: Math.min(100, baseWear + randomInRange(-5, 10)),
    frontRight: Math.min(100, baseWear + randomInRange(-5, 10)),
    rearLeft: Math.min(100, baseWear + randomInRange(-3, 15)),
    rearRight: Math.min(100, baseWear + randomInRange(-3, 15)),
    compound: 'medium',
    age: 0,
  };
};

export const generateDriverTelemetry = (driverId: string, index: number): DriverTelemetry => {
  const driver = DRIVERS[index % DRIVERS.length];
  const team = TEAMS[driver.team];
  
  const baseSpeed = randomInRange(280, 340);
  const isCorner = Math.random() > 0.7;
  const speed = isCorner ? randomInRange(80, 180) : baseSpeed;
  
  const baseTyreTemp = randomInRange(85, 105);
  
  return {
    id: driverId,
    driverNumber: driver.number,
    driverName: driver.name,
    teamName: team.name,
    teamColor: team.color,
    speed: Math.round(speed),
    gear: Math.min(8, Math.max(1, Math.round(speed / 45))),
    throttle: isCorner ? randomInRange(0, 60) : randomInRange(85, 100),
    brake: isCorner ? randomInRange(20, 100) : 0,
    rpm: Math.round(randomInRange(8000, 15000)),
    fuelLevel: randomInRange(20, 100),
    fuelRate: randomInRange(1.8, 2.4),
    tyreTemp: generateTyreData(baseTyreTemp, 0),
    tyreWear: generateTyreWear(),
    ersDeployment: randomInRange(0, 100),
    ersHarvest: randomInRange(0, 50),
    drs: Math.random() > 0.7 && !isCorner,
    lapNumber: Math.floor(randomInRange(1, 45)),
    currentLapTime: randomInRange(70, 95),
    lastLapTime: randomInRange(88, 95),
    bestLapTime: randomInRange(86, 90),
    sector1: randomInRange(28, 32),
    sector2: randomInRange(30, 35),
    sector3: randomInRange(25, 30),
    gapToLeader: index === 0 ? 0 : randomInRange(0.5, 30),
    position: index + 1,
    pitStops: Math.floor(randomInRange(0, 3)),
    status: Math.random() > 0.05 ? 'racing' : 'pit',
  };
};

export const generateRaceInfo = (): RaceInfo => ({
  name: '2024 Monaco Grand Prix',
  circuit: 'Circuit de Monaco',
  currentLap: Math.floor(randomInRange(1, 78)),
  totalLaps: 78,
  raceStatus: 'racing',
  trackTemp: Math.round(randomInRange(35, 48)),
  airTemp: Math.round(randomInRange(22, 30)),
  humidity: Math.round(randomInRange(40, 70)),
  windSpeed: Math.round(randomInRange(5, 25)),
  sessionTime: Date.now(),
});

export const generateSystemHealth = (): SystemHealth => ({
  dataStreamLatency: randomInRange(2, 15),
  packetsReceived: Math.floor(randomInRange(10000, 50000)),
  packetsDropped: Math.floor(randomInRange(0, 50)),
  connectionStatus: Math.random() > 0.1 ? 'connected' : 'degraded',
  lastUpdate: new Date(),
  uptime: randomInRange(3600, 14400),
});

export const formatLapTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
};

export const formatGap = (gap: number): string => {
  if (gap === 0) return 'LEADER';
  if (gap < 1) return `+${gap.toFixed(3)}`;
  return `+${gap.toFixed(1)}`;
};
