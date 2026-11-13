import { denoRuntime } from './runtime.ts';
import type { RiskCompletionProvider } from './provider.ts';

/** Credentials stay server-side and are resolved at request time. */
export function createOpenAIProvider(fetcher: typeof fetch = fetch): RiskCompletionProvider {
  return {
    async complete(body) {
      const key = denoRuntime().env.get('OPENAI_API_KEY');
      if (!key) throw new Error('OPENAI_API_KEY is not configured');
      try {
        return await fetcher('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new Error('AI provider request failed or timed out');
      }
    },
  };
}
