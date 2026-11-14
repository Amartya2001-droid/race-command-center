import React, { useEffect, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [driver, setDriver] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  // Retain acknowledgement across updates, but bound it to the current history.
  useEffect(() => {
    const current = new Set(anomalies.map(a => a.id));
    setAcknowledged(prev => {
      const next = new Set([...prev].filter(id => current.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [anomalies]);
  const drivers = [...new Set(anomalies.map(a => a.driverNumber))].sort((a, b) => a - b);
  const normalized = query.trim().toLowerCase();
  const visible = anomalies.filter(a =>
    (severity === 'all' || a.severity === severity) &&
    (driver === 'all' || String(a.driverNumber) === driver) &&
    (!activeOnly || !acknowledged.has(a.id)) &&
    (!normalized || `${a.driverNumber} ${a.type} ${a.message}`.toLowerCase().includes(normalized)));
  const toggleAcknowledged = (id: string) => setAcknowledged(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
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
    <section aria-label="Incident log" className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
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
            aria-label="Clear all incidents"
            onClick={() => { setAcknowledged(new Set()); onClear(); }}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="p-3 border-b border-border space-y-2">
        <input aria-label="Search incidents" placeholder="Search incidents…" value={query} onChange={event => setQuery(event.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm" />
        <div className="flex gap-2">
          <select aria-label="Incident severity" value={severity} onChange={event => setSeverity(event.target.value)} className="min-w-0 flex-1 rounded border bg-background p-1 text-xs">
            <option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option>
          </select>
          <select aria-label="Incident driver" value={driver} onChange={event => setDriver(event.target.value)} className="min-w-0 flex-1 rounded border bg-background p-1 text-xs">
            <option value="all">All drivers</option>
            {driver !== 'all' && !drivers.includes(Number(driver)) && <option value={driver}>#{driver} (no recent incidents)</option>}
            {drivers.map(number => <option key={number} value={number}>#{number}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={activeOnly} onChange={event => setActiveOnly(event.target.checked)} />Unacknowledged only</label>
        <div role="status" className="text-xs text-muted-foreground">{visible.length} of {anomalies.length} incidents · {acknowledged.size} acknowledged</div>
        <Button size="sm" variant="outline" disabled={!visible.some(a => !acknowledged.has(a.id))} onClick={() => setAcknowledged(prev => new Set([...prev, ...visible.map(a => a.id)]))}>
          Acknowledge shown
        </Button>
      </div>
      {/* Log entries */}
      <ScrollArea className="flex-1">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-sm">{anomalies.length === 0 ? 'No incidents detected' : 'No incidents match your filters'}</span>
            {anomalies.length > 0 && <Button size="sm" variant="ghost" onClick={() => { setQuery(''); setDriver('all'); setSeverity('all'); setActiveOnly(false); }}>Reset incident filters</Button>}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((anomaly) => (
              <div 
                key={anomaly.id}
                aria-label={`Incident ${anomaly.id}`}
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
                    <Button size="sm" variant="ghost" aria-pressed={acknowledged.has(anomaly.id)} onClick={() => toggleAcknowledged(anomaly.id)}>
                      {acknowledged.has(anomaly.id) ? 'Acknowledged — undo' : 'Acknowledge incident'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </section>
  );
};
