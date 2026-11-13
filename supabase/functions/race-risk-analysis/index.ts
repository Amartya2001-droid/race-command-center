import { denoRuntime } from "./runtime.ts";
import { createRiskHandler } from "./handler.ts";
import { createOpenAIProvider } from "./openai.ts";

// Startup needs no key: preflight and missing-configuration responses still work.
denoRuntime().serve(createRiskHandler(createOpenAIProvider()));
