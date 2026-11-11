/** Server-only adapter. Tests inject completion stubs without any key. */
export function createOpenAICompletion(getKey: () => string | undefined, fetcher: typeof fetch = fetch) {
  return async (body: unknown) => {
    const key = getKey();
    if (!key) throw new Error('OPENAI_API_KEY is not configured');
    return fetcher('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };
}
