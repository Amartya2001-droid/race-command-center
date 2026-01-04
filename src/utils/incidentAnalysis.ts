import { Anomaly, DriverTelemetry } from '@/types/telemetry';
import { IncidentSummary } from '@/types/replay';

export const generateIncidentSummary = (
  anomaly: Anomaly,
  telemetry: DriverTelemetry
): IncidentSummary => {
  switch (anomaly.type) {
    case 'tyre_overheat':
      return {
        whatHappened: `Tyre temperature exceeded safe operating limits (${anomaly.value?.toFixed(1)}°C vs ${anomaly.threshold}°C threshold). ${getAffectedTyre(telemetry)} showed critical heat buildup during high-speed cornering.`,
        impact: anomaly.severity === 'critical' 
          ? 'Risk of tyre failure and potential DNF. Performance degradation of 0.3-0.8s per lap expected.'
          : 'Accelerated tyre wear. Estimated 15-20% reduction in remaining stint length.',
        suggestedAction: anomaly.severity === 'critical'
          ? 'Immediate pit stop recommended. Consider switching to harder compound or adjusting driving style.'
          : 'Reduce corner speeds by 5%. Consider early pit window activation.'
      };

    case 'fuel_critical':
      return {
        whatHappened: `Fuel level dropped to ${anomaly.value?.toFixed(1)}%, below the ${anomaly.threshold}% safety threshold. Current consumption rate: ${telemetry.fuelRate.toFixed(2)} kg/lap.`,
        impact: anomaly.severity === 'critical'
          ? 'High risk of running out of fuel before race end. Engine mapping changes required.'
          : 'May not complete race on current strategy. Marginal fuel remaining.',
        suggestedAction: anomaly.severity === 'critical'
          ? 'Activate maximum fuel save mode immediately. Consider lift-and-coast in non-critical sectors.'
          : 'Enable fuel save mode. Reduce engine power by 10% in straights.'
      };

    case 'performance_drop':
      return {
        whatHappened: `Sudden performance degradation detected. Lap time ${anomaly.value?.toFixed(3)}s slower than optimal. Possible mechanical issue or setup problem.`,
        impact: 'Loss of track position likely. Gap to competitors increasing at 0.5s per lap.',
        suggestedAction: 'Check for damage, review telemetry for anomalies. Consider pit stop for inspection if persistent.'
      };

    case 'ers_failure':
      return {
        whatHappened: `ERS deployment/harvesting abnormal. Current level: ${anomaly.value?.toFixed(1)}%. Energy recovery system showing irregular behavior.`,
        impact: anomaly.severity === 'critical'
          ? 'Loss of approximately 160hp during deployment. Significant straight-line speed deficit.'
          : 'Reduced hybrid power availability. Lap time impact of 0.5-1.0s.',
        suggestedAction: anomaly.severity === 'critical'
          ? 'Switch to backup ERS mapping. Prepare for potential system reset on next straight.'
          : 'Monitor closely. Adjust harvesting strategy to maintain battery levels.'
      };

    case 'brake_temp':
      return {
        whatHappened: `Brake temperature anomaly detected. Temperatures outside optimal operating window affecting braking performance.`,
        impact: 'Increased braking distances and potential brake fade. Risk of lockups in heavy braking zones.',
        suggestedAction: 'Adjust brake bias. Increase brake cooling via duct settings. Modify braking points.'
      };

    case 'connection_lost':
      return {
        whatHappened: 'Telemetry connection interrupted. Data stream from car lost momentarily.',
        impact: 'Blind spot in race monitoring. Team unable to provide optimal strategy updates.',
        suggestedAction: 'Verify radio communication. Prepare backup telemetry systems. Alert driver via radio.'
      };

    default:
      return {
        whatHappened: `Anomaly detected: ${anomaly.message}`,
        impact: 'Impact assessment pending further analysis.',
        suggestedAction: 'Monitor situation closely. Gather additional data.'
      };
  }
};

const getAffectedTyre = (telemetry: DriverTelemetry): string => {
  const temps = telemetry.tyreTemp;
  const maxTemp = Math.max(temps.frontLeft, temps.frontRight, temps.rearLeft, temps.rearRight);
  
  if (maxTemp === temps.frontLeft) return 'Front-left tyre';
  if (maxTemp === temps.frontRight) return 'Front-right tyre';
  if (maxTemp === temps.rearLeft) return 'Rear-left tyre';
  return 'Rear-right tyre';
};

export const getIncidentTypeLabel = (type: Anomaly['type']): string => {
  const labels: Record<Anomaly['type'], string> = {
    tyre_overheat: 'Tyre Overheat',
    fuel_critical: 'Fuel Critical',
    performance_drop: 'Performance Drop',
    ers_failure: 'ERS Failure',
    brake_temp: 'Brake Temperature',
    connection_lost: 'Connection Lost'
  };
  return labels[type] || type;
};
