import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DriverTelemetry, RaceInfo } from '@/types/telemetry';
import { RiskAnalysis, RiskPrediction } from '@/types/riskPrediction';

interface UseRiskPredictionProps {
  drivers: DriverTelemetry[];
  raceInfo: RaceInfo;
  enabled?: boolean;
  updateInterval?: number; // ms between AI calls
}

export const useRiskPrediction = ({
  drivers,
  raceInfo,
  enabled = true,
  updateInterval = 10000 // Default 10s between AI calls
}: UseRiskPredictionProps) => {
  const [analysis, setAnalysis] = useState<RiskAnalysis>({
    predictions: [],
    overallRaceStatus: 'green',
    topPriority: 'Monitoring telemetry...',
    lastUpdated: new Date(),
    isLoading: false,
    error: null
  });

  const lastCallRef = useRef<number>(0);
  const isCallingRef = useRef<boolean>(false);

  // Keep the polling schedule stable while telemetry changes every 150ms.
  const telemetryRef = useRef({ drivers, raceInfo });
  telemetryRef.current = { drivers, raceInfo };

  const fetchRiskAnalysis = useCallback(async () => {
    const { drivers, raceInfo } = telemetryRef.current;
    if (!enabled || drivers.length === 0 || isCallingRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastCallRef.current < updateInterval) {
      return; // Throttle calls
    }

    isCallingRef.current = true;
    lastCallRef.current = now;
    setAnalysis(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!supabase) {
        throw new Error('AI risk analysis is unavailable: configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
      }
      const payload = {
        drivers: drivers.map(d => ({
          id: d.id,
          driverNumber: d.driverNumber,
          driverName: d.driverName,
          teamName: d.teamName,
          speed: d.speed,
          fuel: d.fuelLevel,
          tyreTemp: d.tyreTemp,
          tyreWear: d.tyreWear,
          tyreCompound: d.tyreTemp.compound,
          tyreAge: d.tyreTemp.age,
          ersDeployment: d.ersDeployment,
          lapNumber: d.lapNumber,
          position: d.position
        })),
        raceInfo: {
          currentLap: raceInfo.currentLap,
          totalLaps: raceInfo.totalLaps,
          trackTemp: raceInfo.trackTemp
        }
      };

      const { data, error } = await supabase.functions.invoke('race-risk-analysis', {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis({
        predictions: data.predictions || [],
        overallRaceStatus: data.overallRaceStatus || 'green',
        topPriority: data.topPriority || 'All systems nominal',
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Risk prediction error:', err);
      setAnalysis(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch predictions'
      }));
    } finally {
      isCallingRef.current = false;
    }
  }, [enabled, updateInterval]);

  useEffect(() => {
    if (!enabled) return;

    // Initial call after a short delay
    const initialTimeout = setTimeout(() => {
      fetchRiskAnalysis();
    }, 2000);

    // Set up periodic updates
    const interval = setInterval(() => {
      fetchRiskAnalysis();
    }, updateInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, updateInterval, fetchRiskAnalysis]);

  const refreshNow = useCallback(() => {
    lastCallRef.current = 0; // Reset throttle
    fetchRiskAnalysis();
  }, [fetchRiskAnalysis]);

  return {
    ...analysis,
    refreshNow
  };
};
