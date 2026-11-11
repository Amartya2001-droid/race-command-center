# Race Command Center

React, TypeScript and Vite demonstration dashboard for **simulated** Formula 1 telemetry.

Demo URL supplied by the project owner: https://telemetry-racer-ace.lovable.app

The Lovable demo returned HTTP 200 and its frontend was inspected on November 11, 2026. It has simulated telemetry and replay, but lacks the repo’s AI panel and still has inactive Reset/Export/Settings/Fullscreen controls and the recording counter bug. The fixes in this branch are **not verified deployed**. See [Day 2 comparison](docs/day-2-triage.md) for the feature matrix, inspection method and limits. Opening or merging a PR does not establish a Lovable deployment.

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
npm run build
```

GitHub Actions runs these checks after `npm ci` on every push and pull request with Node.js 22. Tests cover dashboard rendering/navigation, missing backend configuration, and polling during telemetry updates. Mocked Node tests also exercise the edge handler, its telemetry prompts, success/error paths and missing server key. The Deno startup/deployment and real OpenAI integration are not validated by these tests.

## Session controls

- Fullscreen toggles the browser Fullscreen API, follows Escape/browser exits and reports unsupported or denied requests.
- Settings applies 150/500/1000 ms telemetry intervals and enables/disables new AI requests. Settings are session-only and restore defaults on Reset/reload; changing settings preserves pause state.
- Reset starts a fresh simulated session, clears incidents/recording/replay/AI state and resumes streaming.
- Export downloads JSON containing current simulated telemetry and any active or stopped recording (ISO date strings). There is no import feature.
- Recording displays its live frame count and pauses with telemetry. Sessions are memory-only and disappear on reload or Reset.

## Known limitations

- AI requires a reachable, configured Supabase function and server-side OpenAI credentials. End-to-end AI is unverified.
- The architecture tab's 100Hz/WebSocket/reconnect statements describe an intended architecture, not the simulator implementation.
- Legacy React refresh lint warnings and build bundle-size/browser-data warnings remain non-blocking.

See [Day 2 triage and comparison](docs/day-2-triage.md) and [Day 1 triage](docs/day-1-triage.md) for evidence, the completed Day 2 comparison and Day 1 access limitations. Follow [AGENTS.md](AGENTS.md) for branch, test, PR and daily-report rules.
