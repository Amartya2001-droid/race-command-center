import type { RiskCompletionProvider } from './provider.ts';

/** Credentials stay server-side and are resolved at request time. */
export function createOpenAIProvider(getKey: () => string | undefined, fetcher: typeof fetch = fetch): RiskCompletionProvider {
  return {
    async complete(body) {
      const key = getKey();
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
