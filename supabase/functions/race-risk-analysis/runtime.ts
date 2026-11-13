/** Only the Deno runtime may supply server credentials. No process/Vite fallback. */
export function denoRuntime() {
  const runtime = (globalThis as typeof globalThis & { Deno?: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Promise<Response>): unknown;
  } }).Deno;
  if (!runtime) throw new Error('AI provider requires the Deno runtime');
  return runtime;
}
