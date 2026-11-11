/** Server-side seam: production uses OpenAI; tests supply credential-free stubs. */
export interface CompletionRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature: number;
  max_tokens: number;
  response_format: { type: 'json_object' };
}

export interface RiskCompletionProvider {
  complete(request: CompletionRequest): Promise<Response>;
}

export interface Prediction {
  driverNumber: number;
  driverName: string;
  riskType: 'tyre_overheat' | 'fuel_depletion' | 'performance_drop' | 'tyre_degradation';
  riskScore: number;
  confidence: number;
  lapsUntilCritical: number | null;
  recommendation: string;
  reasoning: string;
}

export interface PredictionResult {
  predictions: Prediction[];
  overallRaceStatus: 'green' | 'yellow' | 'red';
  topPriority: string;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const score = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/** Reject syntactically valid JSON that does not satisfy the dashboard contract. */
export function isPredictionResult(value: unknown): value is PredictionResult {
  if (!record(value) || !Array.isArray(value.predictions) || value.predictions.length > 5 ||
      !['green', 'yellow', 'red'].includes(String(value.overallRaceStatus)) || !text(value.topPriority)) return false;
  return value.predictions.every(p => record(p) && Number.isInteger(p.driverNumber) && Number(p.driverNumber) > 0 &&
    text(p.driverName) && ['tyre_overheat', 'fuel_depletion', 'performance_drop', 'tyre_degradation'].includes(String(p.riskType)) &&
    score(p.riskScore) && score(p.confidence) &&
    (p.lapsUntilCritical === null || (typeof p.lapsUntilCritical === 'number' && Number.isFinite(p.lapsUntilCritical) && p.lapsUntilCritical >= 0)) &&
    text(p.recommendation) && text(p.reasoning));
}
