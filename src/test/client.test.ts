import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
test('missing Supabase settings do not crash dashboard imports', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
  const { supabase } = await import('@/integrations/supabase/client');
  expect(supabase).toBeNull();
});

test('configured frontend creates a Supabase client using a mocked SDK without a network call', async () => {
  const createClient = vi.fn().mockReturnValue({ functions: {} });
  vi.doMock('@supabase/supabase-js', () => ({ createClient }));
  vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.example.test');
  // Non-secret SDK argument marker; SDK is entirely mocked.
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'MOCK_ENVIRONMENT_VALUE_NOT_A_CREDENTIAL');
  await import('@/integrations/supabase/client');
  expect(createClient).toHaveBeenCalledTimes(1);
  vi.doUnmock('@supabase/supabase-js');
});
