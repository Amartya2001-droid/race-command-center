import { isPredictionResult, type RiskCompletionProvider } from './provider.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelemetryPayload {
  drivers: Array<{
    id: string;
    driverNumber: number;
    driverName: string;
    teamName: string;
    speed: number;
    fuel: number;
    tyreTemp: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    tyreWear: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    tyreCompound: string;
    tyreAge: number;
    ersDeployment: number;
    lapNumber: number;
    position: number;
  }>;
  raceInfo: {
    currentLap: number;
    totalLaps: number;
    trackTemp: number;
  };
}

export const createRiskHandler = (provider: RiskCompletionProvider) => async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TelemetryPayload = await req.json();
    console.log('Received telemetry for', payload.drivers.length, 'drivers');

    // Build a concise telemetry summary for the AI
    const telemetrySummary = payload.drivers.map(d => {
      const maxTyreTemp = Math.max(d.tyreTemp.frontLeft, d.tyreTemp.frontRight, d.tyreTemp.rearLeft, d.tyreTemp.rearRight);
      const avgTyreWear = (d.tyreWear.frontLeft + d.tyreWear.frontRight + d.tyreWear.rearLeft + d.tyreWear.rearRight) / 4;
      return `#${d.driverNumber} ${d.driverName}: Fuel ${d.fuel.toFixed(1)}%, TyreTemp ${maxTyreTemp.toFixed(0)}°C, Wear ${avgTyreWear.toFixed(0)}%, Age ${d.tyreAge} laps, Compound ${d.tyreCompound}, Speed ${d.speed} km/h, P${d.position}`;
    }).join('\n');

    const lapsRemaining = payload.raceInfo.totalLaps - payload.raceInfo.currentLap;

    const systemPrompt = `You are an F1 race strategist AI analyzing live telemetry data to predict risks and provide decision support.
Your role is to identify potential issues BEFORE they become critical.

Analyze the telemetry and return a JSON object with this exact structure:
{
  "predictions": [
    {
      "driverNumber": <number>,
      "driverName": "<string>",
      "riskType": "tyre_overheat" | "fuel_depletion" | "performance_drop" | "tyre_degradation",
      "riskScore": <0-100>,
      "confidence": <0-100>,
      "lapsUntilCritical": <number or null>,
      "recommendation": "<actionable recommendation>",
      "reasoning": "<brief explanation>"
    }
  ],
  "overallRaceStatus": "green" | "yellow" | "red",
  "topPriority": "<most urgent action needed>"
}

Risk thresholds to consider:
- Tyre temps above 100°C indicate stress, above 110°C is critical
- Fuel below 20% with many laps remaining is concerning
- Tyre wear above 70% suggests pit window
- Compound + track temp affects degradation rate

Only report significant risks (score > 40). Maximum 5 predictions.`;

    const userPrompt = `Current Race Status:
Lap ${payload.raceInfo.currentLap} of ${payload.raceInfo.totalLaps} (${lapsRemaining} remaining)
Track Temperature: ${payload.raceInfo.trackTemp}°C

Live Telemetry:
${telemetrySummary}

Analyze for predictive risks and provide decision support.`;

    const response = await provider.complete({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
    });

    if (!response.ok) {
      throw new Error(`AI provider HTTP error: ${response.status}`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }


    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseErr) {
      throw new Error('Invalid AI response format');
    }

    if (!isPredictionResult(analysis)) throw new Error('Invalid AI prediction schema');

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in race-risk-analysis:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      predictions: [],
      overallRaceStatus: 'yellow',
      topPriority: 'AI analysis temporarily unavailable'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
