# Deployment identity and Lovable rollout — issue #13

## Declared target versus verified evidence

`config/deployment.json` declares the intended mapping:

- GitHub: `Amartya2001-droid/race-command-center`, branch `main`.
- Live URL: https://telemetry-racer-ace.lovable.app
- Lovable project: https://lovable.dev/projects/lovp_5b8a2zmhjm93pac5cjm5gwajyr

The project ID was observed in the live demo's public Lovable badge. Its private GitHub connection, selected branch and publication settings have **not** been verified. On November 15, 2026, the environment proxy returned 403 for the project URL and shared Chrome showed `ERR_TUNNEL_CONNECTION_FAILED`. The demo hostname is allowed; the `lovable.dev` management hostname is absent from the enforced allowlist. No management connector is available. Publishing is blocked until the project page is reachable and an authorized owner session is available.

## What the code now does

Every Vite build emits `build-identity.json`, a matching HTML commit marker and a visible source identity footer. The manifest contains only allowlisted public source metadata: full Git commit, source repository/branch, clean/dirty state, build time, declared target and SHA-256 hashes of the built HTML/JS/CSS. No environment dump or credentials are included.

Git is the primary evidence. Detached CI builds use the documented GitHub event branch with the actual checked-out Git SHA. Explicit `DEPLOY_COMMIT_SHA`, `DEPLOY_SOURCE_BRANCH` and `DEPLOY_SOURCE_REPOSITORY` cannot contradict available Git evidence. If a host removes Git, those public metadata variables are required to identify its build, but cleanliness remains unknown (`null`); rollout verification rejects that unverified provenance. Do not label such a build clean by inventing metadata. The host's source provenance/build integration needs to be reconciled before declaring it production-ready.

`npm run verify:build` verifies the local artifact against checked-out Git evidence, including byte-exact HTML and compiled assets. CI runs it, installs Chromium, runs the isolated browser smoke, and uploads the passing `dist/` artifact as a source-SHA-labelled reference build. Lovable publication still uses the project's publishing workflow.

`npm run verify:deployment` requires the expected **full deployed SHA** and, by default, the declared `main` branch and live URL. It rejects missing identities, wrong repo/branch/SHA/project declarations, dirty/unverified provenance, changed assets or an HTML page pointing at an old entrypoint. Requests are cache-busted. Live HTML may contain Lovable's injected badge; its commit marker and app entrypoint must match, and all compiled JS/CSS digests must match exactly. A visible badge pointing at a different project fails. `htmlBytesMatch` reports whether hosting changed the wrapper; `--strict-html` also requires exact HTML bytes. These are source/build consistency checks, not a signed host attestation or proof of the private project connection.

## Owner/project alignment and publishing

1. Allow `lovable.dev` in this environment's outbound host settings and provide a signed-in owner session for the observed project. Additional actual redirect/auth hosts may need approval when encountered. Never send credentials or keys in chat.
2. In that project's GitHub/source settings, confirm the connected repository is exactly the declared GitHub repository and the selected publishing source is `main`. Record the observed setting; do not infer it from the badge.
3. Merge the reviewed deployment-parity PR through GitHub. Confirm main's CI, artifact verification and browser smoke are green. Record the full resulting main SHA, rather than using a feature-branch or pre-merge SHA.
4. Confirm the project imports/builds that source revision. Its production build must have verifiable Git source identity. If the host strips Git or its source integration differs, resolve that platform-specific provenance mapping before treating the rollout as verified. Build command: `npm run build`; output directory: `dist`.
5. Publish/update the **existing** Lovable project and URL. Record the successful deployment/publication identity and timestamp from the platform. No separate site, domain or audience change is required by this fix.
6. From this repo, after fetching current main, run the gates using the exact intended deployed SHA:

   ```sh
   npm run verify:deployment -- --expected-sha FULL_DEPLOYED_SHA
   npm run smoke:deployment -- --expected-sha FULL_DEPLOYED_SHA
   ```

   Replace `FULL_DEPLOYED_SHA` with the actual 40-character SHA; it is not a credential. Install the runner's Chromium with `npx playwright install chromium` if needed. On this managed Cloud image, the existing Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.
7. Follow the issue #13 UI checklist at the live URL, including Settings/AI toggle, Pause/Resume, growing recording counter, native Fullscreen, Record→Stop/save→Export→reload/restore→replay→Reset→Import→replay→Clear/reload, invalid-import preservation, and incident combined filters/acknowledgement/undo/Clear. The smoke uses a fresh browser/storage context and intercepts backend requests; it does not validate real AI. Record the result and deployed SHA, update README, then close #13 only when all required rollout checks pass.

## Candidate previews and limits

For a local clean feature-branch candidate:

```sh
npm run build
npm run verify:build
npm run smoke:build
```

The smoke starts and stops a production Vite preview on port 4173. Browser testing needs the runner's Chromium or the explicit installed-browser path above. To inspect another candidate URL, pass `--url` and `--expected-branch` along with the exact SHA; the output identifies the checked URL. Preview success is not a production/main deployment result.

`verify:deployment` requires curl and uses its inherited proxy/CA settings with TLS verification enabled. It never reads credentials. The smoke fulfills frontend assets through the same certificate-verified HTTP path where needed and intercepts backend/XHR requests before network transmission. No OpenAI key is needed for build identity, control verification or this rollout.

Real AI remains separate: Amartya must enter a legitimate server-side `OPENAI_API_KEY` himself into the Deno/Supabase function environment. No stored key can be read back. Authentication, model/quota access, completion quality and the deployed AI integration remain unverified until that configuration and function deployment are available. Keep `.env` deleted.
