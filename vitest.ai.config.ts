import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    include: ['src/test/ai-*.test.{ts,tsx}', 'src/test/risk-polling.test.tsx', 'src/test/client.test.ts', 'src/test/ai-unconfigured.test.tsx'],
    coverage: { provider: 'v8', reporter: ['text', 'json-summary'], reportsDirectory: './coverage/ai',
      include: ['supabase/functions/race-risk-analysis/*.ts', 'src/hooks/useRiskPrediction.ts', 'src/components/dashboard/AIRiskPanel.tsx', 'src/integrations/supabase/client.ts'],
      thresholds: { lines: 100, statements: 100, functions: 100, branches: 100 },
    },
  },
});
