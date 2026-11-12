import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createRiskHandler } from "./handler.ts";
import { createOpenAICompletion } from "./openai.ts";

serve(createRiskHandler(createOpenAICompletion(() => Deno.env.get('OPENAI_API_KEY'))));
