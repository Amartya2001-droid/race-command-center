# Race Command Center

React, TypeScript and Vite demonstration dashboard for **simulated** Formula 1 telemetry.

Demo URL supplied by the project owner: https://telemetry-racer-ace.lovable.app

The Lovable demo returned HTTP 200 and its frontend was rechecked on November 12, 2026. It has simulated telemetry and replay, but lacks the repo’s AI panel and still has inactive Reset/Export/Settings/Fullscreen controls and the recording counter bug. The fixes in this branch are **not verified deployed**. See [Day 3 features and validation](docs/day-3-features.md) and [Day 2 comparison](docs/day-2-triage.md) for the feature matrix, inspection method and limits. Opening or merging a PR does not establish a Lovable deployment.

## What works locally

- Ten simulated drivers, tyre/fuel/ERS anomaly detection and incident history.
- Pause/resume, telemetry/architecture tabs, in-memory recording and replay, and the unknown-route page.
- Optional AI risk analysis through the Supabase `race-risk-analysis` edge function. The polling schedule now survives telemetry updates. Successful remote predictions have not been verified.

Telemetry, connection health, latency, packet counts and race conditions are generated in the browser. Architecture diagrams describe a proposed system; there is no real race feed or WebSocket ingestion in this repository. Displayed simulation values are not production performance measurements.

## Run locally

Use Node.js 22 and npm:

```sh
npm ci
npm run dev
```

Vite defaults to port 8080 and chooses another port when occupied. The simulator runs without credentials. To enable AI, configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` through your shell or deployment environment using the project's real Supabase settings (keep `.env` deleted). Do not put an OpenAI key in frontend variables. The edge function needs `OPENAI_API_KEY` configured as a server-side Supabase secret and must be deployed separately. No credentials are provided here.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:ai
npm run build
```

GitHub Actions runs these checks after `npm ci` on every push and pull request with Node.js 22. Tests cover dashboard rendering/navigation, missing backend configuration, and polling during telemetry updates. Mocked Node tests also exercise the edge handler, its telemetry prompts, success/error paths and missing server key. The Deno startup/deployment and real OpenAI integration are not validated by these tests.

## Session controls

- Fullscreen toggles the browser Fullscreen API, follows Escape/browser exits and reports unsupported or denied requests.
- Settings applies 150/500/1000 ms telemetry intervals and enables/disables new AI requests. Settings are session-only and restore defaults on Reset/reload; changing settings preserves pause state.
- Reset starts a fresh simulated session, clears incidents/recording/replay/AI state and resumes streaming.
- Export downloads JSON containing current simulated telemetry and any active or stopped recording (ISO date strings). Import Recording accepts these version 1 simulated exports (up to 4 MiB), validates telemetry and incident references, and revives dates for replay. Exports without recorded frames cannot be imported.
- Recording displays its live frame count and pauses with telemetry. Stop automatically saves the latest recording in this browser; reload restores it. Import replaces that saved recording. Clear saved recording or Reset deletes it. Active recordings are not saved until Stop; Export can capture them before leaving. Storage failures keep the recording in memory with an explicit warning.

## Known limitations

- AI requires a reachable, configured Supabase function and server-side OpenAI credentials. End-to-end AI is unverified.
- Capture automatically stops at 6000 frames or roughly 3 MiB of captured data, whichever comes first. Files/storage use a 4 MiB validation limit; recordings are simulated and local to this browser, not synchronized to an account. Replay follows recorded timestamps and supports 1x/2x speed and replaying again after the end.
- The architecture tab's 100Hz/WebSocket/reconnect statements describe an intended architecture, not the simulator implementation.
- Legacy React refresh lint warnings and build bundle-size/browser-data warnings remain non-blocking.

See [Day 2 triage and comparison](docs/day-2-triage.md) and [Day 1 triage](docs/day-1-triage.md) for evidence, the completed Day 2 comparison and Day 1 access limitations. Follow [AGENTS.md](AGENTS.md) for branch, test, PR and daily-report rules.

## AI provider contract

The server-side `RiskCompletionProvider` interface separates risk analysis from the provider transport. The OpenAI implementation reads `OPENAI_API_KEY` directly and only from `Deno.env.get` at request time, without a caller-supplied key or Node/Vite fallback; no credential enters the frontend. Requests use `gpt-4o-mini` with JSON output and a 15-second timeout. The handler validates result fields, risk types, scores, status and the five-prediction limit before returning data. Invalid results fail explicitly rather than reaching the prediction cards. Provider HTTP response bodies are not sent to clients.

Before the first successful result, the panel shows unavailable status and no analysis timestamp. It preserves and labels an earlier result when a refresh fails. All AI verification uses stubs, including the rendered panel; no real key or provider request has been used.

A legitimate server-side `OPENAI_API_KEY` would enable real completion calls and validation of authentication, model/project access and quota, actual JSON responses and prediction quality. End-to-end use also requires deploying the Supabase function, supplying legitimate frontend Supabase configuration through deployment environment variables, and verifying authorization/CORS and the complete browser-to-provider path. The current Lovable demo has not been updated by these PRs; `.env` remains deleted.

## Day 4 AI verification

`npm run test:ai` runs credential-free mocks for native Deno startup, the Deno-only environment read, HTTP transport, request/response handling, prediction validation, Supabase configuration, polling and the rendered panel. V8 coverage is gated at 100% of statements, branches, functions and lines for the eight AI modules listed in `vitest.ai.config.ts`. CI enforces that gate. This measures the mocked code paths, not production OpenAI behavior or a deployed Deno runtime.

Late responses after polling is disabled are ignored, and malformed backend predictions are rejected before rendering. Amartya still needs to enter the legitimate key himself into the server environment; no stored key is read back, copied or committed by this work. Real provider authentication, quota/model access, response quality and deployed integration remain unverified until legitimate configuration and deployment are available.
