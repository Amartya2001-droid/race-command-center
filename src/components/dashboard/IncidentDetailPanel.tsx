import React from 'react';
import { RecordedIncident } from '@/types/replay';
import { getSeverityColor, getAnomalyIcon } from '@/utils/anomalyDetection';
import { getIncidentTypeLabel } from '@/utils/incidentAnalysis';
import { 
  AlertTriangle, 
  Gauge, 
  Fuel, 
  Thermometer,
  Zap,
  X,
  FileText,
  Target,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IncidentDetailPanelProps {
  incident: RecordedIncident;
  onClose: () => void;
}

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  incident,
  onClose
}) => {
  const { anomaly, telemetryContext, summary } = incident;

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${
        anomaly.severity === 'critical' ? 'bg-critical/20' : 'bg-warning/20'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getAnomalyIcon(anomaly.type)}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-primary">
                #{anomaly.driverNumber}
              </span>
              <span className={`text-xs font-bold uppercase ${getSeverityColor(anomaly.severity)}`}>
                {anomaly.severity}
              </span>
            </div>
            <h3 className="font-orbitron text-sm font-semibold">
              {getIncidentTypeLabel(anomaly.type)}
            </h3>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono-tech">{formatTime(anomaly.timestamp)}</span>
            <span>•</span>
            <span>{telemetryContext.driverName}</span>
            <span>•</span>
            <span>{telemetryContext.teamName}</span>
          </div>

          {/* Triggering Values */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <h4 className="font-orbitron text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              TRIGGERING TELEMETRY
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {anomaly.value !== undefined && (
                <div className="bg-background/50 rounded p-2">
                  <div className="text-xs text-muted-foreground">Detected Value</div>
                  <div className={`font-mono-tech text-lg font-bold ${getSeverityColor(anomaly.severity)}`}>
                    {anomaly.value.toFixed(1)}
                  </div>
                </div>
              )}
              {anomaly.threshold !== undefined && (
                <div className="bg-background/50 rounded p-2">
                  <div className="text-xs text-muted-foreground">Threshold</div>
                  <div className="font-mono-tech text-lg font-bold text-foreground">
                    {anomaly.threshold}
                  </div>
                </div>
              )}
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> Speed
                </div>
                <div className="font-mono-tech text-lg font-bold">
                  {telemetryContext.speed} <span className="text-xs text-muted-foreground">km/h</span>
                </div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Fuel className="w-3 h-3" /> Fuel
                </div>
                <div className="font-mono-tech text-lg font-bold">
                  {telemetryContext.fuelLevel.toFixed(1)}%
                </div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> Max Tyre Temp
                </div>
                <div className="font-mono-tech text-lg font-bold">
                  {Math.max(
                    telemetryContext.tyreTemp.frontLeft,
                    telemetryContext.tyreTemp.frontRight,
                    telemetryContext.tyreTemp.rearLeft,
                    telemetryContext.tyreTemp.rearRight
                  ).toFixed(0)}°C
                </div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" /> ERS
                </div>
                <div className="font-mono-tech text-lg font-bold">
                  {telemetryContext.ersDeployment.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* What Happened */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              WHAT HAPPENED
            </h4>
            <p className="text-sm leading-relaxed">{summary.whatHappened}</p>
          </div>

          {/* Impact */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              IMPACT ASSESSMENT
            </h4>
            <p className={`text-sm leading-relaxed ${
              anomaly.severity === 'critical' ? 'text-critical' : 'text-warning'
            }`}>
              {summary.impact}
            </p>
          </div>

          {/* Suggested Action */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              SUGGESTED ACTION
            </h4>
            <div className="bg-success/10 border border-success/30 rounded-lg p-3">
              <p className="text-sm leading-relaxed text-success">
                {summary.suggestedAction}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
