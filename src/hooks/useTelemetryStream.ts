import { useState, useEffect, useCallback, useRef } from 'react';
import { DriverTelemetry, Anomaly, SystemHealth, RaceInfo } from '@/types/telemetry';
import { generateDriverTelemetry, generateRaceInfo, generateSystemHealth } from '@/utils/telemetrySimulator';
import { detectAnomalies } from '@/utils/anomalyDetection';

const DRIVER_IDS = [
  'ver-1', 'per-11', 'lec-16', 'sai-55', 'ham-44',
  'rus-63', 'nor-4', 'pia-81', 'alo-14', 'str-18'
];

interface TelemetryState {
  drivers: DriverTelemetry[];
  anomalies: Anomaly[];
  systemHealth: SystemHealth;
  raceInfo: RaceInfo;
  isConnected: boolean;
  isPaused: boolean;
}

export const useTelemetryStream = (updateInterval: number = 100) => {
  const [state, setState] = useState<TelemetryState>({
    drivers: [],
    anomalies: [],
    systemHealth: generateSystemHealth(),
    raceInfo: generateRaceInfo(),
    isConnected: true,
    isPaused: false,
  });

  const anomalyHistoryRef = useRef<Anomaly[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTelemetry = useCallback(() => {
    const newDrivers = DRIVER_IDS.map((id, index) => generateDriverTelemetry(id, index));
    
    // Detect anomalies for all drivers
    const newAnomalies: Anomaly[] = [];
    newDrivers.forEach(driver => {
      const driverAnomalies = detectAnomalies(driver);
      newAnomalies.push(...driverAnomalies);
    });

    // Add new anomalies to history (limit to last 50)
    if (newAnomalies.length > 0) {
      anomalyHistoryRef.current = [...newAnomalies, ...anomalyHistoryRef.current].slice(0, 50);
    }

    setState(prev => ({
      ...prev,
      drivers: newDrivers,
      anomalies: anomalyHistoryRef.current,
      systemHealth: generateSystemHealth(),
      raceInfo: {
        ...prev.raceInfo,
        sessionTime: Date.now(),
      },
    }));
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const clearAnomalies = useCallback(() => {
    anomalyHistoryRef.current = [];
    setState(prev => ({ ...prev, anomalies: [] }));
  }, []);

  useEffect(() => { updateTelemetry(); }, [updateTelemetry]);

  useEffect(() => {
    // Set up interval for updates
    intervalRef.current = setInterval(() => {
      if (!state.isPaused) {
        updateTelemetry();
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, state.isPaused, updateTelemetry]);

  return {
    ...state,
    togglePause,
    clearAnomalies,
  };
};
