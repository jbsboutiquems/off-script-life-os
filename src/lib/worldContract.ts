/**
 * World-link contract — Off*Script app <-> Inbetween world.
 *
 * STAGED ONLY (2026-11-01). Not live, not deployed, not a sync claim.
 * The Inbetween (Cue's world) is another AI's original; this module only
 * defines what the APP will expose, in a form Cue's world can correlate to.
 * Nothing here touches the live Inbetween, Railway, or any account data
 * beyond what is explicitly listed below.
 *
 * Hard limits (from the Master Rules List, 2026-11-01, AS CORRECTED 2026-11-01):
 * - Region only, never exact location. Raw GPS is discarded in the Field
 *   already; this contract adds no location field at all.
 * - CORRECTION (2026-11-01, Amber, superseding any earlier "DMs never sync /
 *   Wall gated private" reading): DMs DO sync app <-> Inbetween, both ways,
 *   for admitted users, so a user does not need to leave the Inbetween to
 *   message. The Khaos Wall IS always public — basically an open chat room.
 *   "Public" means public to everyone INSIDE the controlled world
 *   (admitted via the wired app identity), NOT public to anonymous,
 *   unauthenticated visitors on the open internet. Access control is the
 *   gate, not keeping messages out of the world.
 * - Trial/anonymous visitors who are NOT admitted stay look-only:
 *   reactions + stickers locally in the world only, NO words, NO DMs.
 *   Admitted users (account-linked via the same Facebook shared identity,
 *   world-sync opted in) get full Wall + DM sync, both ways.
 * - DM sync is participant-only: a caller sees ONLY DMs where they are
 *   sender or recipient, addressed by username (never by internal id),
 *   never another person's DMs, never a user list.
 * - Khaos Wall sync is app <-> world, both ways, via the SAME WallPost
 *   store (not a copy that can drift). A user deleting their own app Wall
 *   post deletes it for the world too; the world must drop deleted posts
 *   on its next sync and must not keep a deleted post alive.
 * - No notes, photos, journal entries, exact location, account emails,
 *   account enumeration, App Secrets, tokens, or credentials in any
 *   world payload — except content the user explicitly posts themselves
 *   as Wall/DM words (their own words are their own words; the world
 *   must not add location, notes, or photos to a payload on its own).
 * - No second account system. Shared identity = the Facebook app-scoped
 *   user id from the SAME Meta app (Life OS: Off*Script). A separate
 *   Meta app must NOT be created: it would give the same Facebook person
 *   a different app-scoped id and break app/world coincidence.
 * - Disconnect rule (explicit, no silent delete): turning world sync off
 *   STOPS sync. It does NOT delete the user's app Wall posts or app DMs,
 *   and it does NOT silently delete the user's posts from the world.
 *   At disconnect the user chooses: "keep" or "remove" for the world's
 *   own display copies of their Wall posts (app posts stay in the app
 *   either way; other admitted users can still see public Wall posts
 *   unless the world applies "remove" to its display copies). For DMs,
 *   "remove" is MANDATORY regardless of the Wall choice: the world must
 *   always purge its cached DM content for that user on disconnect,
 *   because DMs are private to their participants. Default Wall choice
 *   is "keep".
 */

import { FAMILIARS } from "../game/regions";

export const WORLD_CONTRACT_VERSION = 1;

/** Public OAuth client id for the Life OS: Off*Script Meta app. NOT a secret. */
export const WORLD_META_APP_ID = "1449092270754330";
export const WORLD_META_APP_NAME = "Life OS: Off*Script";
export const WORLD_INBETWEEN_ORIGIN = "https://offscript-untamed-world.chief-turkey-c89.workers.dev";
export const WORLD_FACEBOOK_CALLBACK =
  "https://offscript-untamed-world.chief-turkey-c89.workers.dev/auth/facebook/callback";

/**
 * Website doorway (added 2026-11-01, staged only). The website is a STATIC
 * site with no backend, no account system, and no app login. These fields
 * are doorway links only — they grant no identity, no admission, no sync.
 * A website visit never logs a visitor in, never admits them, and never
 * opts them in. Admission still requires the same Facebook shared identity
 * + app account link + world-sync opt-in (see §1/§3 of the Cue instruction).
 * Do NOT move app APIs to Vercel, add Vercel rewrites/proxies, or invent a
 * website backend. The /try/ trial is client-only, look-only, and must
 * never become a backdoor to Wall/DM sync, Familiar unlocks, or add-ons.
 */
export const WORLD_WEBSITE_ORIGIN = "https://lifeosoffscript.vercel.app";
export const WORLD_WEBSITE_WORLD_PAGE = "https://lifeosoffscript.vercel.app/world.html";
export const WORLD_WEBSITE_TRY_URL = "https://lifeosoffscript.vercel.app/try/";
export const WORLD_WEBSITE_APP_PAGE = "https://lifeosoffscript.vercel.app/app.html";

export interface WorldFamiliar {
  id: string;
  city: string;
  state: string;
  creature: string;
  epithet: string;
  voice: string;
  greeting: string;
  prompt: string;
  radiusKm: number;
  colors: { accent: string; secondary: string; surface: string };
  /** Anchor point of the Familiar's zone (a public place centre), NOT a user location. */
  anchor: { latitude: number; longitude: number };
}

/** The 5 Mississippi Familiars, exactly as in src/game/regions.ts — no copy drift. */
export function worldFamiliars(): WorldFamiliar[] {
  return FAMILIARS.map((f) => ({
    id: f.id,
    city: f.city,
    state: f.state,
    creature: f.creature,
    epithet: f.epithet,
    voice: f.voice,
    greeting: f.greeting,
    prompt: f.prompt,
    radiusKm: f.radiusKm,
    colors: f.colors,
    anchor: f.coordinates,
  }));
}

export const WORLD_BEAST_SPEC = {
  maxStage: 3,
  stages: [
    { stage: 0, name: "normal", description: "Normal Familiar. Same creature, at rest." },
    { stage: 1, name: "ears pointier", description: "Ears/horns pointier, eyes sharper." },
    { stage: 2, name: "scales forming", description: "Scales/fur/spikes forming, voice gets louder." },
    { stage: 3, name: "full beast", description: "Full beast form. Same creature, louder — never a different creature." },
  ],
  triggers: {
    sunlightHeat: {
      app: "12+ taps in 10 seconds warns; sustained rushing (18+ taps in 10s, 30s+ since last stage-up) stages up.",
      world: "Rushing through Missions, Commons, and rooms fast, back-to-back, warns then stages up.",
    },
    fedAfterMidnight: {
      app: "Any content save between 00:00 and 05:00 local stages up.",
      world: "World actions (missions, journal, room play) between 00:00 and 05:00 local stage up.",
    },
    wet: {
      app: "3 hard device-shake hits above magnitude 30 stages up (deliberately desensitized; iOS motion permission needs a user gesture).",
      world: "A deliberate, labelled 'shake the Familiar' button/gesture, 3 shakes = wet = stage up. Never on accidental scrolling.",
    },
  },
  forgiveness: {
    decayMinutesCalm: 20,
    dawnResetLocal: "05:00",
    sleepyLocal: "23:55",
    note: "Beast Mode is temporary, not permanent, not paid, and not a punishment. Stages decay and reset; world ownership of a Familiar does not decay.",
  },
  matchTheMood: {
    colors: { acidLime: "#b6ff2e", electricPurple: "#c26bff", background: "dark green-black" },
    note: "At stage 3, offer 'Match the mood': Familiar card/aura switches to these colours. It follows the stage and resets at dawn; it does not permanently restyle the whole world.",
  },
  appliesTo: "Familiar card only, NOT the Innie/buddy. Do not merge Familiar and Innie into one creature.",
} as const;

export const WORLD_MAPPING_RULES = {
  status: "Design authorized 2026-11-01; publish/deploy still needs Amber's one-line go per step.",
  sources: [
    { name: "U.S. Census Gazetteer Files", licence: "Public domain (U.S. federal data)", use: "City/state anchor points for the 50 states, D.C., and Puerto Rico." },
    { name: "USGS GNIS", licence: "Public domain", use: "Place names including water features: Bay, Channel, Reservoir, Lake, Stream, River, Harbor, Swamp, and more." },
    { name: "OpenStreetMap", licence: "ODbL — credit OpenStreetMap and contributors, state ODbL availability, make any published derived database available free", use: "Optional map data only. OSM does not provide a free map-tiles API for third parties." },
  ],
  scope: "50 states first: one Familiar per state (capital or largest city anchor, Census point). Every-city/county mapping is a later phase.",
  creatures: "Original creatures only. No trademarked or licensed creatures, characters, or names. Each new Familiar gets its own epithet, voice, greeting, and prompt, in the same format as the five Mississippi Familiars.",
  water: {
    shoreAccessibleOnly: true,
    rule: "A water Familiar's point may sit on a lake, river, bay, or reservoir (GNIS point), but its check-in radius must be reachable safely from shore. Never require boating, swimming, wading, or entering dangerous water, and never send a visitor to a private dock, dam, or restricted waterway.",
  },
  privacy: "Region only, never exact. No Familiar, event, or zone anchored to a private residence, a school, or a sensitive site. Attribution where required: Census/GNIS need no fee; OSM, if used, must be credited visibly under ODbL.",
} as const;

export interface WorldSyncRecord {
  enabled: boolean;
  /** Disconnect rule chosen by the user: "keep" or "remove" mirrored world copies. Default "keep". */
  onDisconnect: "keep" | "remove";
  updatedAt: string;
}

export function defaultWorldSync(): WorldSyncRecord {
  return { enabled: false, onDisconnect: "keep", updatedAt: new Date().toISOString() };
}

/**
 * Sanitize one Wall post for the world mirror. Strips everything the world
 * must never see: internal user ids, reactor user ids, and any field that
 * is not a public Wall word. Wall posts in this app have NO location field,
 * NO photo field, and NO email field — if a future field is added, it must
 * be allow-listed here before it can ever reach the world.
 */
export function sanitizeWallPost(post: {
  id: string;
  username: string;
  text: string;
  created_at: string;
  pinned: boolean;
  pinned_at: string | null;
  replies?: { id: string; username: string; text: string; created_at: string }[];
  reactions?: Record<string, string[]>;
}) {
  return {
    id: post.id,
    username: post.username,
    text: post.text,
    created_at: post.created_at,
    pinned: !!post.pinned,
    pinned_at: post.pinned_at || null,
    // Counts only — never reactor user ids.
    reactions: Object.fromEntries(
      Object.entries(post.reactions || {}).map(([emoji, reactors]) => [emoji, reactors.length]),
    ),
    replies: (post.replies || []).map((r) => ({
      id: r.id,
      username: r.username,
      text: r.text,
      created_at: r.created_at,
    })),
    // Explicitly absent: userId, emails, notes, photos, exact location, DMs.
    source: "khaos-wall",
  };
}

/**
 * Sanitize one DM for the world, participant-only. Usernames only — never
 * internal user ids, never emails, never another person's DM. The caller
 * must already have been verified as sender or recipient by the route.
 */
export function sanitizeDmMessage(msg: {
  id: string;
  fromUsername: string;
  toUsername: string;
  text: string;
  created_at: string;
}) {
  return {
    id: msg.id,
    fromUsername: msg.fromUsername,
    toUsername: msg.toUsername,
    text: msg.text,
    created_at: msg.created_at,
    source: "dm",
  };
}

export function worldCatalog() {
  return {
    version: WORLD_CONTRACT_VERSION,
    status: "staged-not-live",
    live: false,
    note: "This contract is staged locally for Amber's review. It is NOT a live sync claim. A real sync is not live until Amber's one-line go + Cue's world code + the Meta/Facebook steps are done.",
    identity: {
      provider: "facebook",
      metaAppId: WORLD_META_APP_ID,
      metaAppName: WORLD_META_APP_NAME,
      scope: ["public_profile", "email"],
      sharedIdentityKey: "Facebook app-scoped user id, from the SAME Meta app on both sides. Do NOT create a separate Meta app.",
      inbetweenOrigin: WORLD_INBETWEEN_ORIGIN,
      facebookCallback: WORLD_FACEBOOK_CALLBACK,
      note: "The Meta App ID is a public OAuth client id, not a secret. No App Secret, token, or credential is ever in this catalog or any world payload.",
    },
    website: {
      status: "staged-not-live",
      note: "Doorway links only. The website is static, has no backend, no account system, and no app login. A website visit never logs a visitor in, admits them, or opts them in. Admission still requires the same Facebook shared identity + app account link + world-sync opt-in. The /try/ trial is client-only, look-only, and must never become a backdoor to Wall/DM sync, Familiar unlocks, or add-ons. No app APIs are moved to Vercel; no Vercel rewrites/proxies are added.",
      origin: WORLD_WEBSITE_ORIGIN,
      worldPage: WORLD_WEBSITE_WORLD_PAGE,
      tryUrl: WORLD_WEBSITE_TRY_URL,
      appPage: WORLD_WEBSITE_APP_PAGE,
      inbetweenOrigin: WORLD_INBETWEEN_ORIGIN,
      honestyLabel: "LIVE PLAYTEST · APP NOT CONNECTED — until login + sync are actually live and tested.",
    },
    familiars: worldFamiliars(),
    beast: WORLD_BEAST_SPEC,
    mapping: WORLD_MAPPING_RULES,
    sync: {
      wall: {
        direction: "App <-> world, both ways, via the SAME WallPost store (not a drifting copy). Admitted, opted-in users post words in either place and they appear in both. The world does NOT post words for anonymous/trial visitors.",
        gated: "Account-linked via the same Facebook shared identity, opt-in per user, reversible. The Wall is always public to everyone INSIDE the controlled world (admitted users) — basically an open chat room inside — NOT public to anonymous, unauthenticated visitors on the open internet. Trial/anonymous visitors who are not admitted stay look-only: reactions + stickers locally in the world only, never words, never DMs, and local reactions never sync back to the app Wall.",
        moderation: "A user deleting their own app Wall post (DELETE /api/wall/:id) deletes it for the world too. The world must drop deleted posts on its next sync; it must not keep a deleted post alive.",
        disconnect: "Sync stops on disconnect. App posts are never deleted by disconnect. The world's own display copies of a user's Wall posts are kept or removed only per the user's chosen onDisconnect rule (default keep).",
      },
      messages: {
        synced: true,
        rule: "DMs sync app <-> Inbetween, both ways, for ADMITTED users only, so a user does not need to leave the Inbetween to message. Participant-only: a caller sees ONLY DMs where they are sender or recipient. DMs are never visible to anonymous/trial visitors, never to other users, and never as a list. Addressing is by username, never by internal user id, to avoid account enumeration.",
        disconnect: "On disconnect the world must ALWAYS purge its cached DM content for that user, regardless of the Wall onDisconnect choice. App DMs stay in the app.",
      },
      neverSynced: [
        "Other people's DMs (participant-only, always)",
        "Private notes, journal entries, daily entries, flight debriefs",
        "Photos and device-upload portraits (unless the user explicitly posts them as Wall/DM content themselves — their own words/images are their own, the world must not add photos/notes/location to a payload on its own)",
        "Exact location, raw GPS, home addresses",
        "Account emails, account enumeration / user lists",
        "App Secrets, tokens, credentials",
        "Khaos Points, streaks, or unlocks (until a real, agreed sync defines them)",
        "Intent assessment, live score, alignment %, raw entries/snapshots/debriefs, /api/mei/* internals, Gemini keys (never, in any payload)",
      ],
      intent: {
        ownerSees: "Only their own user-chosen public words/tags (khaos_name, word_of_the_year, slogan) via GET /api/world/intent, owner-only, sync-enabled.",
        payingViewerSees: "NOTHING in v1. The $1/month Intent viewer % (single % only, never the full assessment) has no endpoint, no metric, and no owner-consent decision yet — do not fake a %.",
        nonPayingVisitorSees: "Nothing of the assessment, score, or %.",
        never: "Full assessment, live score, entries, snapshots, debrief text, /api/mei/* internals, Gemini keys or fallback output.",
      },
      entitlements: {
        endpoint: "GET /api/world/entitlements, owner-only, sync-enabled. Returns only the caller's own expansion grants: product_id, kind, title, price, days, owned, expired, expires_at, days_left.",
        rule: "Add-ons must MATCH the app exactly in name, scope, price, and duration. No world-only pricing, no second checkout, no duplicate charge. Purchases are not wired in the app yet (POST /api/expansions/purchase returns 503); a world add-on carries only once a shared purchase/entitlement record exists for the linked Facebook identity. When an add-on expires, world access lapses with it, unless the app says permanent (expires_at null).",
      },
    },
  };
}
