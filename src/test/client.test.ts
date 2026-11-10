import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
test('missing Supabase settings do not crash dashboard imports', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
  const { supabase } = await import('@/integrations/supabase/client');
  expect(supabase).toBeNull();
});
