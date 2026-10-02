# Play Store Listing — Off*Script Life OS

> DRAFT for staging only. Three items must be in place before submission:
> (1) privacy policy hosted at a **public URL** (Data Safety requirement),
> (2) contact email filled in, (3) final icon + feature graphic + screenshots.
>
> App identity (must match `android/app/build.gradle` and `capacitor.config.ts`):
> - App name: **Off*Script**
> - Package / appId: **app.offscript.lifeos**
> - Version: 1.0 (versionCode 1)

## App title options (≤30 chars — verified)

1. `Life OS: Off*Script 2027` — 25 chars
2. `Off*Script Life OS 2027` — 23 chars
3. `Off*Script: Chaos Year 2027` — 27 chars

(Recommendation: option 1 — matches the brand name exactly.)

## Short description (≤80 chars — verified at 78)

`Chaos-friendly daily planner: prompts, check-ins, Ask Mei AI, DMs, ND games.`

## Full description (brand voice, Play-compliant)

> **The planner for people who never finished a planner.**
>
> Off*Script Life OS is the companion app for the Life OS: Off*Script 2027 Chaos Year
> planner — built for brains that run on chaos, not color-coded compliance. Structure
> without the cage. Zero gold stars for burnout. Boredom=Death.
>
> Every day you get a **chaos prompt** — a small, gloriously unserious dare to shake up
> your routine — plus **morning, midday, and evening check-ins** to actually land the
> day. All 365 days of 2027 are stamped with their real holiday, and every curated
> holiday comes with a "what even is this?" explainer, so your daily adventure comes
> with a built-in excuse to celebrate.
>
> **ASK MEI — YOUR UNHINGED CO-PILOT**
> Mei is an AI companion who reads your recent entries and gives it to you straight:
> the pattern you keep repeating, the thing you needed to hear. Runs through the
> Messages Improved bot — no API keys, nothing for you to configure. Voice notes
> welcome — she transcribes them for you.
>
> **PRIVATE DMS**
> Your people, inside the app. Sign in with a username + password or Google/Facebook,
> with a recovery code as backup. Block anyone, anytime; delete your own messages.
>
> **CHAOS WALL**
> A shared shout board where fellow chaos-goblins post wins, rants, and 2 a.m.
> revelations. Delete your own posts anytime.
>
> **THE NITTY-GRITTY**
> Big 6 goals, weekly debriefs, money maps, anti-goals, Cosmic Corner horoscopes
> (Nice or Rude — your call), chaos points and streaks, reminders, ranked search
> across your own entries, and Drive backup. Everything the planner side of your
> brain wants, none of the shame spiral.
>
> **AI MEDIA STUDIO (PRIVATE BACKSTAGE)**
> Compose tracks, conjure images, and render video from your own prompts — a private
> backstage for your chaos. Runs server-side; the app never asks you for API keys.
>
> No ads. No analytics trackers. Your journal is yours — we don't sell it, mine it,
> or advertise at it.
>
> Made by Amber Wiggins, independent creator of the Off*Script Life OS system.

## Content rating questionnaire answers (IARC-style, conservative + honest)

- **Violence:** None. The app contains no violence, weapons, or violent references.
- **Sexual content / nudity:** None.
- **Profanity:** Mild, infrequent. The brand voice is sassy and irreverent (e.g., "zero BS," occasional mild swearing in app copy). No slurs. No sexual expletives.
- **Drugs / alcohol / tobacco references:** None in app content.
- **Gambling:** None.
- **Horror / fear:** None.
- **User-generated content:** Yes. Private DMs between users and a shared Chaos Wall. Users can delete their own wall posts and DM messages in-app at any time, and can block other users. Admins can remove wall posts. Account deletion is available on request to the support email.
- **Does the app share user-provided personal info with other users?** Yes, limited: usernames/display names appear on wall posts and in DMs. No email, phone number, or location is collected or shown.
- **Location sharing:** None.
- **Unrestricted web access:** None (app talks only to its own server and the Messages Improved bot API for AI features).

## Data Safety section

**Privacy policy:** [PUBLIC URL REQUIRED]

**Data encrypted in transit:** Yes (HTTPS).

**Users can request data deletion:** Yes — delete own wall posts and DM messages in-app; block other users; request DM/account deletion via contact email.

| Data type (Play category) | Collected | Shared (with third party) | Purpose |
|---|---|---|---|
| Personal info → Name (username / display name) | ✓ | ✗ | App functionality |
| Personal info → User IDs (random account ID) | ✓ | ✗ | App functionality |
| Personal info → Email address (only if you register with email or Google/Facebook OAuth) | ✓ | ✗ | App functionality |
| Messages → In-app messages (DMs, wall posts) | ✓ (stored on app server) | ✗ | App functionality |
| Messages → Chat messages to Ask Mei | ✓ | ✓ — Messages Improved (bot API) | App functionality |
| Audio → Voice recordings | ✓ (sent for transcription only, not retained on server) | ✓ — Messages Improved (transcription API) | App functionality |
| App activity → AI Studio prompts / media | ✓ (only what you type or attach in the AI media studio) | ✓ — Google (Gemini API, server-side only; the client never sees the key) | App functionality |
| App activity → App interactions (journal entries, check-ins, chaos scores, debriefs) | ✓ (stored on app server) | ✓ — bounded summary sent to Messages Improved for Ask Mei context | App functionality |
| Files → Drive backup export | ✓ (only when you tap export; stored to YOUR Google Drive) | ✗ (goes to your own Drive, not a third party) | App functionality |
| Photos and videos | ✗ (app has no photo/camera upload) | ✗ | — |
| Health / fitness | ✗ (chaos scores are journal fields, not health data) | ✗ | — |
| Location | ✗ | ✗ | — |
| Contacts | ✗ (Flight Crew entries are manual, not device contacts) | ✗ | — |

**Notes for the Data Safety form:**
- "Shared" is marked yes only for the Messages Improved bot API (chat replies, voice transcription, and the bounded journal summary that powers Ask Mei context). DMs and wall posts are user-to-user within the app's own service, not a third-party share.
- No ads, no analytics SDKs, no third-party data sale of any kind.
- The Drive backup export goes to the user's own Google Drive (user-initiated, user-owned) — not a third-party share.
- Delete/account-removal requests go through the contact email (to be finalized before submission).
