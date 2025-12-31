import { DriverTelemetry, Anomaly } from '@/types/telemetry';

const THRESHOLDS = {
  TYRE_TEMP_WARNING: 105,
  TYRE_TEMP_CRITICAL: 115,
  FUEL_WARNING: 15,
  FUEL_CRITICAL: 8,
  SPEED_DROP_THRESHOLD: 50,
  ERS_FAILURE_THRESHOLD: 10,
  BRAKE_TEMP_CRITICAL: 1000,
};

export const detectAnomalies = (driver: DriverTelemetry): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  const timestamp = new Date();

  // Tyre temperature checks
  const tyreTemps = [
    driver.tyreTemp.frontLeft,
    driver.tyreTemp.frontRight,
    driver.tyreTemp.rearLeft,
    driver.tyreTemp.rearRight,
  ];

  const maxTyreTemp = Math.max(...tyreTemps);

  if (maxTyreTemp > THRESHOLDS.TYRE_TEMP_CRITICAL) {
    anomalies.push({
      id: `${driver.id}-tyre-${timestamp.getTime()}`,
      timestamp,
      driverId: driver.id,
      driverNumber: driver.driverNumber,
      type: 'tyre_overheat',
      severity: 'critical',
      message: `CRITICAL: Tyre temperature exceeds safe limits`,
      value: maxTyreTemp,
      threshold: THRESHOLDS.TYRE_TEMP_CRITICAL,
    });
  } else if (maxTyreTemp > THRESHOLDS.TYRE_TEMP_WARNING) {
    anomalies.push({
      id: `${driver.id}-tyre-${timestamp.getTime()}`,
      timestamp,
      driverId: driver.id,
      driverNumber: driver.driverNumber,
      type: 'tyre_overheat',
      severity: 'warning',
      message: `WARNING: Elevated tyre temperature detected`,
      value: maxTyreTemp,
      threshold: THRESHOLDS.TYRE_TEMP_WARNING,
    });
  }

  // Fuel level checks
  if (driver.fuelLevel < THRESHOLDS.FUEL_CRITICAL) {
    anomalies.push({
      id: `${driver.id}-fuel-${timestamp.getTime()}`,
      timestamp,
      driverId: driver.id,
      driverNumber: driver.driverNumber,
      type: 'fuel_critical',
      severity: 'critical',
      message: `CRITICAL: Fuel level critically low`,
      value: driver.fuelLevel,
      threshold: THRESHOLDS.FUEL_CRITICAL,
    });
  } else if (driver.fuelLevel < THRESHOLDS.FUEL_WARNING) {
    anomalies.push({
      id: `${driver.id}-fuel-${timestamp.getTime()}`,
      timestamp,
      driverId: driver.id,
      driverNumber: driver.driverNumber,
      type: 'fuel_critical',
      severity: 'warning',
      message: `WARNING: Fuel level running low`,
      value: driver.fuelLevel,
      threshold: THRESHOLDS.FUEL_WARNING,
    });
  }

  // ERS system check
  if (driver.ersDeployment < THRESHOLDS.ERS_FAILURE_THRESHOLD && driver.ersHarvest < 5) {
    anomalies.push({
      id: `${driver.id}-ers-${timestamp.getTime()}`,
      timestamp,
      driverId: driver.id,
      driverNumber: driver.driverNumber,
      type: 'ers_failure',
      severity: 'warning',
      message: `WARNING: ERS system underperforming`,
      value: driver.ersDeployment,
      threshold: THRESHOLDS.ERS_FAILURE_THRESHOLD,
    });
  }

  return anomalies;
};

export const getSeverityColor = (severity: 'warning' | 'critical'): string => {
  return severity === 'critical' ? 'text-critical' : 'text-warning';
};

export const getAnomalyIcon = (type: Anomaly['type']): string => {
  switch (type) {
    case 'tyre_overheat':
      return '🔥';
    case 'fuel_critical':
      return '⛽';
    case 'performance_drop':
      return '📉';
    case 'ers_failure':
      return '⚡';
    case 'brake_temp':
      return '🛑';
    case 'connection_lost':
      return '📡';
    default:
      return '⚠️';
  }
};
