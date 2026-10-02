# Repair checkpoint — Off*Script Life OS

## User request
Fix the exported project based on the architecture review. Work in self-contained blocks so another AI can resume if credits run out.

## Project
- Working copy: `/home/ubuntu/work/off-script-life-os`
- Original ZIP: `/home/ubuntu/upload/off-script-life-os.zip`
- Review: `/home/ubuntu/work/off-script-life-os/off-script-life-os-architecture-review.md`

## Completed in this repair
1. `package.json`: added `react-is` and changed direct `esbuild` from `^0.25.0` to `^0.28.2` to align with Vite 8.
2. `vite.config.ts`: replaced `__dirname` with `import.meta.dirname`.
3. `src/components/SocialShareModal.tsx`: aligned obsolete fields with current types:
   - `user.unruly_core_values` -> `user.chaos_mantra`
   - `snapshot.sarcastic_mirror` -> `snapshot.ai_feedback`
   - `snapshot.big_five.*` -> top-level `snapshot.openness` and `snapshot.neuroticism`
4. `src/App.tsx`: added typed share modal state/handler; passed share handler to Header, DailyOSView, and Big6GoalsTracker; rendered SocialShareModal with current user, entry, snapshot, Anti-Goals, and goals.

## Next block
Run `npm install --no-audit --no-fund`, then `npm run lint` and `npm run build`. Fix any remaining errors. Do not assume the repair is complete until both pass.

## Known prior failures
- Normal npm install failed because Vite 8 expected esbuild 0.27/0.28 while package.json declared 0.25.
- TypeScript had 9 errors from the share callback and stale share fields.
- Build failed because `react-is` was missing from the Recharts peer dependencies.

## Not fixed yet / separate production scope
- No authentication or per-user database isolation. Firebase/Google/Facebook/email login, birthday capture, horoscope and natal chart were explicitly canceled by the user in AI Studio and are intentionally NOT implemented.
- JSON file persistence is not concurrency-safe.
- No runtime request validation.
- AI privacy/retention disclosure and diagnostic safety controls need product decisions.

## Repair pass — 2026-09-19 (feature completion)
Added: Chaos Points system (server dedupe, `ChaosPointsView`), Cream Canvas / Midnight Chaos theme toggle, Flight Crew contacts directory (server CRUD + `FlightCrewView`), Google Drive backup/restore view (requires deployer-supplied Google API key + OAuth client ID in Google Cloud Console), holiday "what even is this?" explainers (`meaning` field on all 14 curated holidays + procedural fallback), share-to-points wiring (one `share_fired` award per day via action/ref dedup on every real share action: native share, X, Threads, LinkedIn, WhatsApp, Reddit, Facebook, copy text/link, visual-card download).
- `npm run lint` (tsc --noEmit) passes; `npm run build` (Vite client + esbuild server bundle) passes.
- Smoke test 2026-09-19: `GET /api/health` 200, `GET /api/points` ok, `POST /api/points/award` awarded 10 pts and correctly deduped the second identical award (duplicate:true, total unchanged at 10), `GET /api/flight-crew` ok, `POST /api/flight-crew` created a contact.
- Removed the smoke-test JSON data file before packaging.
- No WebSocket layer exists anywhere in this codebase; the "fix web socket" request had nothing to repair and no socket code was added.
- Dark-mode visual QA has not been done: many components use hard-coded light color classes, so Midnight Chaos may have unreadable surfaces in places.
- Large client chunk warning (~850 kB minified) is non-blocking.

## Validation completed
- `npm install --no-audit --no-fund` passes with the corrected manifest.
- `npm run lint` passes with zero TypeScript errors.
- `npm run build` passes for both Vite client and bundled Express server.
- Production server started successfully on port 3000.
- Smoke tests passed for `/`, `/api/user`, and `/api/goals`.
- Build still reports a non-blocking large-client-chunk warning (~810 kB minified); code splitting is a future optimization.

## QR content-pack unlock block completed
- Added `ContentPack`, `UserEntitlement`, and `TokenRedemptionResult` types.
- Added persistent local-store fields for `contentPacks`, `qrTokens`, and `userEntitlements`.
- Added `GET /api/content-packs`, `GET /api/entitlements/:userId`, and `POST /api/redeem-token`.
- Added `UnlockScreen.tsx` with camera QR scanning through `BarcodeDetector` and a manual token fallback.
- Added a launch gate in `App.tsx`; users without entitlements cannot access the planner views.
- Seeded local test token: `PACK-DEMO-2027` for `planner_2027_core`.
- Smoke test: first redemption returned HTTP 200 and granted the pack; second redemption returned HTTP 400 with the already-claimed error.
- Removed the smoke-test JSON data file before packaging so the demo token remains unused.
- Production boundary: replace the JSON store with authenticated database transactions and make token issuance admin-only.

## Deep review pass — 2026-09-19 (Midnight Chaos design quality + corrections)

### Midnight Chaos: first-class dark brand surface
- Rebuilt the `.dark` system in `src/index.css` around the Off*Script palette: deep navy grounds (#0b1220 family), cream/off-white text scale, luminous rose/amber/emerald/sky/teal accent text, deep translucent status tints (amber/emerald/rose/sky/orange/purple), navy-aware borders, hover-state flips for every light `hover:` utility used, and form polish (select options, date-picker indicator, checkbox/radio accent).
- Deliberately did NOT flip `text-stone-950` (only used on gold badges) or `text-stone-300` (already light-on-dark everywhere).
- Added `src/hooks/useDarkMode.ts`; `ChaosTrendline` now renders grid/axis/reference-zone/threshold/dots in dark-aware colors via MutationObserver on the `<html>` class.
- Defined the previously-dead `text-cream-canvas` utility and `animate-fade-in` keyframes (toast now actually fades in, with a hot-pink glow).
- Print still always renders Cream Canvas — untouched.

### Corrections
- `DriveBackupView`: added an explicit **App ID · Google Cloud project number** field (digits-only, persisted with the other keys). The Picker uses the explicit numeric project number; the old client-ID-prefix inference remains only as a labeled compatibility fallback, and a non-numeric/empty App ID now shows a clear error instead of failing silently.
- `SocialShareModal`: points now fire only on real share actions — popups award only if `window.open()` isn't blocked (with a "popup blocked" toast otherwise), native share awards on success, clipboard copies no longer award, and the image-card generator is exception-safe with points only after successful render + download kickoff. Removed unused imports (`Send`, `ExternalLink`, `Eye`), dead `canvasRef`, and the unused `goals` prop; fixed handler indentation.
- `App.tsx`: toast is now timer-safe (new message replaces the old and restarts the clock — stale timers can't clear fresh toasts). `handleAddGoal` only falls back to a local goal when the server is unreachable; validation errors like the six-goal maximum now surface as toasts instead of creating an extra goal.
- `api.ts`: `createGoal`/`updateGoal` surface server validation errors directly and reserve the local fallback for network failures; token redemption no longer appends duplicate local entitlements.
- `server.ts`: added `GET /api/health`; PATCH routes strip protected fields (`id`, `created_at`, `awarded_at`); Flight Crew creation rejects blank names (400) and PATCH rejects blank names; DELETE routes return 404 when nothing was deleted; entitlements now include `unlocked_at` from the redemption timestamp.

### Validation completed (this pass)
- `npm run lint` passes with zero TypeScript errors.
- `npm run build` passes (Vite client + Express server bundle; large-chunk warning remains, non-blocking).
- Live server smoke tests: `/api/health` ok; points award + dedup (`duplicate: true` on repeat); Flight Crew create-blank → 400, PATCH id/`created_at` overwrite ignored, PATCH blank name → 400, delete → success then 404; backup export/import round-trip ok.
- Smoke-test data removed from `chaos_os_data.json`; `dist/` deleted before packaging.
- Not tested: Google Drive picker flow (needs deployer-supplied Google Cloud credentials); QR camera scanning (needs a device camera).

## Accounts + cosmic dashboard + tour guide pass — 2026-09-19

### What was built
- **Mandatory usernames** (`server.ts`): `AccountUser.username` + `usernameKey` (lowercased). Local and email
  registration require a username; shared validation (3–24 chars, letters/numbers/`_`/`-`, no spaces);
  case-insensitive uniqueness with friendly taken-name errors + clickable suggestions.
- **OAuth username gate**: first-time Google/Facebook callbacks create a short-lived pending signup and
  redirect to `/#oauth_pending=<key>&provider=...`; `POST /api/auth/oauth/complete` creates the account only
  after a valid username. Existing provider-linked or verified-email-linked accounts skip the step.
  Fixed during validation: the pending key is now consumed only on success, so a taken-name retry works.
- **Rename** (`POST /api/auth/username`, login required): uniqueness rechecked, 3 changes per 24h,
  denormalized wall posts + DM names updated, and the profile display name (`chaos_name`) follows the rename
  when it was still the old username (custom display names are left alone).
- **Email auth** (`email.ts`, Nodemailer): register/login, verification link, resend, forgot/reset links,
  single-use tokens, session invalidation on reset. Without SMTP configured: auto-verify + recovery-code fallback.
- **Social features**: Chaos Wall (`GET/POST/DELETE /api/wall`, 500-char cap, delete-own-only),
  inbox directory/usernames-only (`GET /api/users/directory`), DM threads with unread tracking
  (`/api/inbox/...`), all-money-maps endpoint.
- **Client**: `OnboardingTour`, `RemindersView`, `SearchView`, `ChaosWallView`, `InboxView`,
  `OAuthUsernameStep`; dashboard doors + header badges (unread, due reminders, streak); RUDE/NICE tone toggle
  persisted on the profile; direct JSON + daily-entry CSV downloads; streak display.
- Docs updated: `README.md` (features, env vars, setup checklist, production warnings, username rules),
  `.env.example` (server auth vars).

### Validation completed (this pass)
- `npm run lint` (tsc --noEmit) passes; `npm run build` (Vite client + esbuild server bundle) passes.
  Build still reports the non-blocking large-client-chunk warning (~970 kB minified, ~276 kB gzip).
- **Auth smoke test — 67/67 pass** (`/tmp/lifeos-test/smoke.js`, throwaway server + `OAUTH_DEV_STUB=1` +
  `SMTP_STUB_CAPTURE`): username rules (short/bad-chars/case-insensitive dup + valid suggestions),
  recovery (wrong code rejected, rotation, old code dead, sessions invalidated), rename (success, dup
  rejected w/ suggestions, 4th-in-24h rate-limited, wall posts + display name follow, custom display name
  survives), email (bad email/dup rejected, stub SMTP verify link single-use, login, forgot/reset, sessions
  killed on reset), OAuth (email-linking skips username step, first-time pending flow with bad-key/bad-name/
  taken-name/retry, returning user logs straight in), wall (auth required, post, cross-user visibility,
  delete-own-only, length cap), inbox (directory excludes self + leaks no emails, send/unread/read-clears/
  delete-own-only/unknown-recipient), reminders endpoint, rename display-name sync.
- **Pure-logic tests — 22/22 pass** (`/tmp/lifeos-test/logic-test.ts`): cosmic generator deterministic,
  24-day uniqueness across all 12 signs x nice/rude, tones differ; streaks (grace for unlogged today,
  missed day breaks, backfill restores); search (AND semantics, title outranks body, single-char ignored);
  reminders (daily due after nudge time, cleared by entry, weekly due by day/time, cleared by debrief).
- Two real bugs found and fixed by the tests: (1) OAuth pending key consumed before username validation
  (retry impossible); (2) `smtpConfigured()` ignored the dev stub capture, silently disabling email verification.
- Voice audit: dashboard doors and new copy reviewed against the brand voice; one stale line fixed
  ("there is no email reset" → email accounts can reset by email).

### Not done / not tested
- No live visual browser walkthrough (none performed in this context; arrange separately).
- Google Drive picker flow (needs deployer credentials); QR camera scanning (needs a device).
- Real (non-stub) Google/Facebook OAuth and real SMTP delivery were not exercised — flows tested via dev stubs.
- Dark-mode visual QA still outstanding from the earlier pass.
