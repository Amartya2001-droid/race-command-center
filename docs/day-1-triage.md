# Day 1 — race-command-center

Program brief: November 11, 2026. Inspection executed November 10, 2026; this is the requested Day 1 triage, not an assertion that the host date is November 11.

## Starting state

Inspected base commit `e89e947`. GitHub searches returned no existing issues or open PRs. No workflow or tests existed. The README contained Lovable placeholders. Created the daily log at https://github.com/Amartya2001-droid/race-command-center/issues/1.

## Repo versus live demo

Target: https://telemetry-racer-ace.lovable.app

The live comparison is blocked. An HTTPS request returned proxy CONNECT 403; shared Chromium displayed “This site can’t be reached” with a DNS resolution error. This environment's applied host allowlist did not include the demo host. This evidence does not establish that the public demo is down.

| Direction | Result |
| --- | --- |
| Demo features missing from repo | Unknown until the demo is reachable; no claims inferred from its name. |
| Repo features missing from demo | Unknown until the demo is reachable. Repo includes telemetry, anomaly history, architecture view, recording/replay, and Supabase AI integration. |
| Deployment/source parity | No verified mapping from the Lovable deployment to a Git commit. Owner confirmation or deployment metadata needed. |

Amartya: allow the demo host in environment settings and confirm the Lovable project/deployed revision. Further backend/CDN hosts may be needed once its HTML loads.

## Local browser checks

Ran Vite on localhost:8083 (8080–8082 occupied), using Chromium through Playwright at 1440×1000. Verified ten-driver dashboard rendering, pause/resume, architecture navigation, record/stop/replay/exit, and the 404 route. No uncaught page errors occurred in those checks. Remote AI success was not established.

Broken or incomplete flows:

1. Reset leaves the recorded session intact. Source confirms Reset, Export, Settings and Fullscreen have no handlers. These are triage findings, not new features implemented on Day 1.
2. Active recording shows `REC • 0 frames` even while snapshots accumulate. Stop creates a replayable session; the counter reads the finalized session rather than the active buffer.
3. Automatic AI polling previously never reached its initial call while drivers updated every 150ms: changing callback dependencies reset the 2-second timer. Fixed with a stable callback reading the current frame; regression test exercises continuous updates.
4. Missing Supabase settings previously crashed the app during module initialization. Fixed so the simulator loads and AI reports its configuration requirement.
5. Architecture/health labels imply real streams and measured reliability, but the source generates telemetry and health locally. README now states that limitation explicitly.

## Changes and validation

Added standing rules, push/PR CI, dashboard smoke coverage and targeted regressions. Fixed three existing lint errors (empty interfaces and a CommonJS Tailwind plugin import), a replay effect dependency, and CSS font import ordering caught by build. Removed the previously tracked `.env` from the new tree while retaining the local ignored file. No credential values were copied into documentation or tests; removing a file does not remove it from Git history. Amartya should review the historical configuration and rotate any value that was actually secret.

CI installs with `npm ci`, checks app/Vite types, lints, runs tests, and builds. Frontend checks do not validate deployment or the Deno edge function. No new product features were added.
