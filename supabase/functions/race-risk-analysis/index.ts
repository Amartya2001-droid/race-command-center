import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createRiskHandler } from "./handler.ts";
import { createOpenAIProvider } from "./openai.ts";

serve(createRiskHandler(createOpenAIProvider(() => Deno.env.get('OPENAI_API_KEY'))));
