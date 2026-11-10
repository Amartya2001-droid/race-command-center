# Race Command Center

React, TypeScript and Vite demonstration dashboard for **simulated** Formula 1 telemetry.

Demo URL supplied by the project owner: https://telemetry-racer-ace.lovable.app

The demo is hosted by Lovable. Availability and parity with this checkout could not be verified during Day 1: the execution environment denied the host and shared Chrome could not resolve it. Opening or merging this PR does not establish that Lovable deployed it.

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

Vite defaults to port 8080 and chooses another port when occupied. The simulator runs without credentials. To enable AI, configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a local, ignored `.env` file using the project's real Supabase settings. Do not put an OpenAI key in frontend variables. The edge function needs `OPENAI_API_KEY` configured as a server-side Supabase secret and must be deployed separately. No credentials are provided here.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

GitHub Actions runs these checks after `npm ci` on every push and pull request with Node.js 22. Tests cover dashboard rendering/navigation, missing backend configuration, and polling during telemetry updates. The Deno edge function is not covered by the frontend TypeScript check or the mocked AI tests.

## Known limitations

- Reset, Export, Settings and Fullscreen controls have no handlers.
- Recording displays `0 frames` while active; snapshots are available after Stop. Sessions are memory-only and disappear on reload.
- AI requires a reachable, configured Supabase function and server-side OpenAI credentials. End-to-end AI is unverified.
- The architecture tab's 100Hz/WebSocket/reconnect statements describe an intended architecture, not the simulator implementation.
- Legacy React refresh lint warnings and build bundle-size/browser-data warnings remain non-blocking.

See [Day 1 triage](docs/day-1-triage.md) for evidence and the blocked live comparison. Follow [AGENTS.md](AGENTS.md) for branch, test, PR and daily-report rules.
