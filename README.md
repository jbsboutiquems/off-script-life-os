<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Off*Script Life OS — accounts + cosmic dashboard + tour guide build (2026-09-19)

The 2027 Life OS web app with real multi-user accounts, a shared Chaos Wall, an inbox,
in-app reminders, global search, an onboarding tour, and the RUDE/NICE Cosmic Corner.

## What's in this build

- **Accounts with mandatory usernames.** Local (username + password), email (username + email + password),
  and Google/Facebook OAuth. Every account has a globally unique username (3–24 chars; letters, numbers,
  `_`, `-`; case-insensitive uniqueness). First-time OAuth signups land on a choose-your-username step
  before the account is created. Taken names return friendly clickable suggestions. Usernames can be
  changed in Identity Base (max 3 changes per 24 hours); the wall, inbox, and profile display name follow.
- **Email verification + password reset** via SMTP (Nodemailer). Without SMTP configured, email still works
  but accounts are auto-verified and reset falls back to the recovery code. Every account also gets a
  one-time recovery code (shown once at signup) that resets the password when email is unavailable.
- **The Chaos Wall** — a shared, per-deployment shout board. Post (500 chars max), see everyone's posts,
  delete only your own. No moderation queue: best for a private/friends deployment, not a public instance.
- **Inbox** — a user directory (usernames only) plus private 1:1 DMs with unread badges. Senders can delete
  their own messages. Polls; no WebSockets.
- **Reminders** — in-app due calculation for the daily flight log and weekly debrief (configurable time/day).
  These are in-app nudges with header badges, not push notifications.
- **Search** — ranked search across your own flight logs, goals, anti-goals, debriefs, money maps, crew,
  and holidays. Your data only; never anyone else's.
- **Onboarding tour** — a first-run guided tour of the dashboard doors.
- **Cosmic Corner** — daily horoscope generator with a persistent **NICE / RUDE** tone toggle. Deterministic
  per sign + date + tone; 24-day uniqueness per sign/tone. Written by the app, not the stars.
- **Chaos Points & Sharing** — earn points for daily saves, micro-dares, weekly debriefs, completed goals,
  quashed anti-goals, diagnostics, and sharing. One award per action per day (server-side dedup).
- **Streaks** — consecutive-day logging streak with yesterday-grace; back-filling a missed day restores it.
- **Cream Canvas / Midnight Chaos** theme switcher (header toggle; saved locally). Print always renders Cream Canvas.
- **Flight Crew** — an in-app contacts directory (manual entries, not device contacts).
- **Drive Backup** — export/import a JSON backup to Google Drive (deployer-supplied Google Cloud credentials,
  stored only in browser local storage). Also: direct JSON download and daily-entry CSV download.
- **Holiday explainers** — each curated holiday has a "what even is this?" panel.
- **QR content-pack unlocks** — scan or type a printed token to unlock a content pack. Tokens are single-use;
  `PACK-DEMO-2027` is the local test token. Do not ship the demo token.

## Run it

Node.js required. `npm install`, then:

- Dev client: `npm run dev`
- API server: `npm run build` then `node dist/server.cjs` (port 3000)

The server keeps everything in `chaos_os_data.json` in the working directory (created at runtime).

## Configuration

Copy `.env.example` to `.env` and fill in what you need. Everything is optional — the app runs
with zero config using local accounts + recovery codes.

| Variable | What it does |
|---|---|
| `GEMINI_API_KEY` | AI features (client-side, AI Studio template) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google login (OAuth 2.0 web client) |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook login |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Outgoing email for verification + password reset |
| `BASE_URL` | Public URL used in email links (defaults to the request host) |
| `OAUTH_DEV_STUB=1` | Dev/test only: skips real OAuth and returns a fake profile |
| `SMTP_STUB_CAPTURE=/path/file.jsonl` | Dev/test only: writes outgoing mail to a file instead of sending |

OAuth callback URLs to register with the providers: `<BASE_URL>/api/auth/oauth/google/callback`
and `<BASE_URL>/api/auth/oauth/facebook/callback`.

### External setup checklist

- **Google login:** Google Cloud Console → new project → OAuth consent screen → Credentials → OAuth client ID
  (Web application) → add the authorized redirect URI above → paste client ID + secret into `.env`.
  Note: these login credentials are separate from the Google Drive Picker credentials used in Drive Backup.
- **Facebook login:** Meta for Developers → create app → Facebook Login → add the valid OAuth redirect URI above →
  paste App ID + App Secret into `.env`.
- **SMTP:** any provider that speaks SMTP (e.g. your mail host). Without it, the app runs fine: email
  accounts are auto-verified and password recovery uses the recovery code shown at signup.

## Production warnings (read before deploying)

- **Prototype-grade auth.** File-backed JSON store (`chaos_os_data.json`), single-process sessions, no
  concurrency safety. OAuth CSRF/pending signup state is memory-resident (lost on restart). Move to a real
  database and transactional writes before any public deployment.
- OAuth links accounts by **verified email**; a matching email on an existing account gets linked, not duplicated.
- If a user loses both their password and their recovery code (and has no verified email), there is no recovery.
- The Chaos Wall has **no moderation queue** — suitable for a private/friends deployment, not a public instance.
- The inbox polls the server; there is no WebSocket layer anywhere in this codebase.
- Reminders are in-app nudges with badges, not push notifications. Due times use server time.
- QR camera scanning needs a device camera and a browser with `BarcodeDetector` support.
- Build reports a non-blocking large-client-chunk warning (~970 kB minified, ~276 kB gzip); code splitting
  is a future optimization.

## Username rules

- 3–24 characters; letters, numbers, `_`, `-`. No spaces.
- Globally unique, case-insensitively (`Feral_Op` and `feral_op` are the same name).
- Taken names get a friendly error plus clickable suggestions.
- Rename: Identity Base → Change username, max 3 changes per 24 hours. The wall, inbox, directory, and
  profile display name follow the rename immediately (a custom display name you set yourself is left alone).

## Original AI Studio instructions

View the app in AI Studio: https://ai.studio/apps/0423d7ed-5e62-4726-b76e-08f9bfa2657a

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app: `npm run dev`
