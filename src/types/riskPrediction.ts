export type RiskType = 'tyre_overheat' | 'fuel_depletion' | 'performance_drop' | 'tyre_degradation';

export interface RiskPrediction {
  driverNumber: number;
  driverName: string;
  riskType: RiskType;
  riskScore: number; // 0-100
  confidence: number; // 0-100
  lapsUntilCritical: number | null;
  recommendation: string;
  reasoning: string;
}

export interface RiskAnalysis {
  predictions: RiskPrediction[];
  overallRaceStatus: 'green' | 'yellow' | 'red';
  topPriority: string;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}
