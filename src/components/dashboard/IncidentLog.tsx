import React from 'react';
import { Anomaly } from '@/types/telemetry';
import { getAnomalyIcon, getSeverityColor } from '@/utils/anomalyDetection';
import { AlertTriangle, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IncidentLogProps {
  anomalies: Anomaly[];
  onClear: () => void;
}

export const IncidentLog: React.FC<IncidentLogProps> = ({ anomalies, onClear }) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="font-orbitron font-semibold text-sm">INCIDENT LOG</h3>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-critical/20 rounded-full">
              <Bell className="w-3 h-3 text-critical animate-pulse" />
              <span className="font-mono-tech text-xs text-critical">{criticalCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-warning/20 rounded-full">
              <span className="font-mono-tech text-xs text-warning">{warningCount}</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea className="flex-1">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-sm">No incidents detected</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {anomalies.map((anomaly) => (
              <div 
                key={anomaly.id}
                className={`px-4 py-3 animate-slide-in ${
                  anomaly.severity === 'critical' 
                    ? 'bg-critical/5 border-l-2 border-l-critical' 
                    : 'bg-warning/5 border-l-2 border-l-warning'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getAnomalyIcon(anomaly.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-orbitron text-xs font-bold text-primary">
                        #{anomaly.driverNumber}
                      </span>
                      <span className={`font-orbitron text-xs uppercase ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                      <span className="font-mono-tech text-xs text-muted-foreground ml-auto">
                        {formatTime(anomaly.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{anomaly.message}</p>
                    {anomaly.value !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono-tech text-xs text-muted-foreground">
                          Value: {anomaly.value.toFixed(1)}
                        </span>
                        {anomaly.threshold !== undefined && (
                          <span className="font-mono-tech text-xs text-muted-foreground">
                            / Threshold: {anomaly.threshold}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
