import React from 'react';
import { Brain, AlertTriangle, TrendingUp, Fuel, Thermometer, Activity, RefreshCw, Clock } from 'lucide-react';
import { RiskAnalysis, RiskPrediction, RiskType } from '@/types/riskPrediction';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIRiskPanelProps {
  analysis: RiskAnalysis;
  onRefresh: () => void;
}

const getRiskTypeIcon = (type: RiskType) => {
  switch (type) {
    case 'tyre_overheat': return <Thermometer className="w-4 h-4" />;
    case 'fuel_depletion': return <Fuel className="w-4 h-4" />;
    case 'performance_drop': return <TrendingUp className="w-4 h-4" />;
    case 'tyre_degradation': return <Activity className="w-4 h-4" />;
    default: return <AlertTriangle className="w-4 h-4" />;
  }
};

const getRiskTypeLabel = (type: RiskType) => {
  switch (type) {
    case 'tyre_overheat': return 'Tyre Overheat';
    case 'fuel_depletion': return 'Fuel Depletion';
    case 'performance_drop': return 'Performance Drop';
    case 'tyre_degradation': return 'Tyre Degradation';
    default: return type;
  }
};

const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
  switch (status) {
    case 'green': return 'text-success bg-success/20';
    case 'yellow': return 'text-warning bg-warning/20';
    case 'red': return 'text-critical bg-critical/20';
  }
};

const getRiskScoreColor = (score: number) => {
  if (score >= 70) return 'text-critical';
  if (score >= 50) return 'text-warning';
  return 'text-muted-foreground';
};

const PredictionCard = ({ prediction }: { prediction: RiskPrediction }) => {
  const scoreColor = getRiskScoreColor(prediction.riskScore);
  
  return (
    <div className="bg-secondary/30 rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("p-1.5 rounded", getRiskScoreColor(prediction.riskScore) === 'text-critical' ? 'bg-critical/20' : prediction.riskScore >= 50 ? 'bg-warning/20' : 'bg-muted/20')}>
            {getRiskTypeIcon(prediction.riskType)}
          </span>
          <div>
            <div className="font-medium text-sm text-foreground">
              #{prediction.driverNumber} {prediction.driverName}
            </div>
            <div className="text-xs text-muted-foreground">
              {getRiskTypeLabel(prediction.riskType)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-orbitron text-lg font-bold", scoreColor)}>
            {prediction.riskScore}%
          </div>
          <div className="text-xs text-muted-foreground">
            {prediction.confidence}% conf.
          </div>
        </div>
      </div>
      
      {prediction.lapsUntilCritical !== null && (
        <div className="flex items-center gap-1.5 text-xs text-warning">
          <Clock className="w-3 h-3" />
          <span>~{prediction.lapsUntilCritical} laps until critical</span>
        </div>
      )}
      
      <div className="bg-primary/10 rounded p-2 border-l-2 border-primary">
        <div className="text-xs font-medium text-primary mb-1">Recommendation</div>
        <div className="text-xs text-foreground">{prediction.recommendation}</div>
      </div>
      
      <div className="text-xs text-muted-foreground italic">
        {prediction.reasoning}
      </div>
    </div>
  );
};

export const AIRiskPanel = ({ analysis, onRefresh }: AIRiskPanelProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-card/50">
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/20 rounded">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-foreground">
                AI RISK PREDICTION
              </h3>
              <div className="text-xs text-muted-foreground">
                Powered by OpenAI
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Refresh AI analysis"
            onClick={onRefresh}
            disabled={analysis.isLoading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("w-4 h-4", analysis.isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Race Status */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">Race Status</span>
          <span className={cn("px-2 py-0.5 rounded text-xs font-semibold uppercase", analysis.lastUpdated ? getStatusColor(analysis.overallRaceStatus) : 'text-muted-foreground bg-muted')}>
            {analysis.lastUpdated ? analysis.overallRaceStatus : 'unavailable'}
          </span>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <div className="text-xs font-medium text-foreground">{analysis.topPriority}</div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Last updated: {analysis.lastUpdated ? formatTime(analysis.lastUpdated) : 'Never'}
          {analysis.error && analysis.lastUpdated && ' — previous analysis; refresh failed'}
        </div>
      </div>

      {/* Error State */}
      {analysis.error && (
        <div className="p-3 bg-critical/10 border-b border-critical/20">
          <div className="flex items-center gap-2 text-critical text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{analysis.error}</span>
          </div>
        </div>
      )}

      {/* Predictions */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {analysis.predictions.length === 0 && !analysis.isLoading && !analysis.error && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">{analysis.lastUpdated ? 'No significant risks detected' : 'Awaiting first analysis'}</div>
              <div className="text-xs mt-1">{analysis.lastUpdated ? 'Analysis completed for simulated telemetry' : 'Risk status requires a successful analysis'}</div>
            </div>
          )}
          
          {analysis.predictions.map((prediction, idx) => (
            <PredictionCard key={`${prediction.driverNumber}-${prediction.riskType}-${idx}`} prediction={prediction} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border text-center">
        <div className="text-xs text-muted-foreground">
          {analysis.predictions.length} active prediction{analysis.predictions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
