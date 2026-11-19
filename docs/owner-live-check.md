# Owner: check the published Race Command Center

This checks the existing published app. It does **not** publish, merge a PR, change Lovable settings, create a hosting site, or ask for an API key. Issue [#13](https://github.com/Amartya2001-droid/race-command-center/issues/13) stays open until an authorized owner publishes the intended build and live acceptance passes.

## Before running

1. Have a reviewer merge the intended source changes through the normal PR process. The agent never self-merges.
2. In the existing Lovable project, an authorized owner must confirm the GitHub repository and `main` source, then publish/update that build. Record the platform deployment/publication identity and the **exact full main commit SHA actually published**. Looking up a new main SHA is not the same as publishing it.
3. On an owner's machine with Node.js 22+ and curl, get this repository and install the test dependencies:

   ```sh
   git clone https://github.com/Amartya2001-droid/race-command-center.git
   cd race-command-center
   npm ci
   npx playwright install --with-deps chromium
   ```

   For an existing checkout, pull the reviewed main normally rather than cloning again. The managed Cloud image can instead select its existing browser with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Do not create `.env`; no OpenAI key or Lovable login is required by this public check.

## Run the owner command

Replace `FULL_PUBLISHED_MAIN_SHA` with the actual 40-character SHA from the publication record:

```sh
npm run accept:live -- \
  --url "https://telemetry-racer-ace.lovable.app" \
  --expected-sha "FULL_PUBLISHED_MAIN_SHA"
```

The URL is a required input. It must match the reviewed target in `config/deployment.json`; a different published URL needs a reviewed contract update, not silent acceptance of another host. Preview diagnostics remain available through `smoke:deployment`, but cannot count as this owner's live pass. The owner command fixes the expected repository/branch from the contract and offers no branch override, publish, merge or key flag.

Use `npm run accept:live -- --help` for usage. Optional `--report acceptance-reports/new-owner-check.json` selects a **new** JSON file; existing evidence is never overwritten. Without that option, a timestamped report is generated and its path printed.

## What it verifies

The command first verifies the live build manifest, exactly named HTML source marker, actual module entrypoints, expected repository/branch/SHA/project and compiled-asset digests. If identity fails, it saves a failed report and does not start browser acceptance.

When identity passes, it runs the existing acceptance gates in a fresh isolated browser: Settings, growing recording counter/Pause, JSON export, durable reload/replay, Reset, import/replay, invalid-import preservation, durable Clear, incident triage and native Fullscreen. Backend requests are intercepted. This proves frontend behavior only; real AI remains unverified.

## Read the result

| Exit | Meaning | Next action |
| --- | --- | --- |
| `0` | The supplied production target/source passed identity and the full frontend checklist; JSON has `liveAcceptancePassed: true` | Attach the report and the separate Lovable publication record to #13; review all checklist items before closing it |
| `1` | Identity, browser acceptance or report writing failed | Read the JSON failure/skip stage when a report was produced; preserve it and fix the indicated problem, then use a new report path |
| `2` | Arguments or setup are invalid | Correct the URL/full SHA/options, install prerequisites or choose a new report file; rerun |

No report means no recorded acceptance result. A stale site typically fails identity with `browser.status: "not-run"`. A missing browser may fail during initialization; install Chromium as above. A passing preview report is not a live pass. `publicationPerformed: false` means the checking command performed no publication, even if the owner published separately beforehand.

## Current handoff status

Publication is still blocked in the agent environment: `lovable.dev` is absent from the enforced allowlist and no Lovable management connector is available. On November 19, 2026 the owner command checked expected merged main `44cf13e` and saved a failed identity result with the browser stage not run. That expected revision is not claimed to be published. The live demo remains on the older build; no full live acceptance pass is claimed. No other hosting site was created.

Real AI validation separately requires Amartya to enter a legitimate server-side `OPENAI_API_KEY` himself into the Deno/Supabase function environment, plus deployment and legitimate frontend Supabase configuration. Stored keys cannot be read back. No key belongs in this command, a report, a PR or an issue comment. Keep #13 open until actual publication and a live acceptance pass.
