import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { smtpConfigured, baseUrl, sendMail, verificationEmail, resetEmail } from "./email";
import { computeDueReminders, type ReminderSettings } from "./src/lib/reminders";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ================= DATA MODEL (v2: multi-user) =================
// Every personal collection is namespaced per user inside `users[userId]`.
// `contentPacks` and `qrTokens` stay global (packs are shared, QR tokens are
// single-use across the whole prototype). Sessions are server-side records.

const DATA_FILE = path.join(process.cwd(), "chaos_os_data.json");

interface AccountUser {
  id: string;
  username: string;      // display form — required for EVERY account, every signup method
  usernameKey: string;   // lowercase, uniqueness-checked
  passwordHash: string;  // "scrypt$N$r$p$salt$hash" — empty means locked, can never log in
  /** scrypt hash of "recovery:<CODE>" — the plaintext code is NEVER stored. Empty = no recovery available. */
  recoveryHash: string;
  /** Email auth / OAuth linking. */
  email?: string;
  emailVerified?: boolean;
  googleId?: string;
  facebookId?: string;
  /** ISO timestamps of username changes — rate-limited (3 per 24h). */
  usernameHistory?: string[];
  created_at: string;
}

interface EmailTokenRecord {
  accountId: string;
  kind: "verify" | "reset";
  email: string;
  expires_at: string;
}

interface SessionRecord {
  userId: string;
  created_at: string;
  expires_at: string;
}

interface StudioMediaItem {
  id: string;
  type: "music" | "image" | "video" | "transcript";
  prompt: string;
  /** Data URL for audio/image; transcript text stored separately for transcripts. */
  resultUrl: string;
  transcript?: string;
  mimeType?: string;
  aspectRatio?: string;
  model?: string;
  /** Veo long-running operation name — used to resume polling / download. */
  operationName?: string;
  createdAt: string;
}

interface UserData {
  user: any;
  dailyEntries: Record<string, any>;
  personalitySnapshots: any[];
  goals: any[];
  antiGoals: any[];
  flightDebriefs: Record<string, any>;
  moneyMaps: Record<string, any>;
  chaosPoints: any[];
  flightCrew: any[];
  userEntitlements: string[];
  /** AI Studio (media studio, Gemini-backed) saved generations. */
  studioMedia: StudioMediaItem[];
}

interface WallPost {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
}

interface DmMessage {
  id: string;
  fromId: string;
  fromUsername: string;
  toId: string;
  toUsername: string;
  text: string;
  created_at: string;
}

interface DataStore {
  version: 2;
  accounts: AccountUser[];
  sessions: Record<string, SessionRecord>;
  users: Record<string, UserData>;
  contentPacks: Record<string, any>;
  qrTokens: Record<string, any>;
  /** Shared community wall — visible to every registered user on this instance. */
  wallPosts: WallPost[];
  /** One-to-one direct messages across all users. */
  dmMessages: DmMessage[];
  /** Read watermarks: userId -> partnerId -> ISO timestamp. */
  dmRead: Record<string, Record<string, string>>;
  /** Email verification / password-reset tokens, keyed by sha256(token). */
  emailTokens: Record<string, EmailTokenRecord>;
}

const defaultContentPacks: Record<string, any> = {
  planner_2027_core: {
    pack_id: "planner_2027_core",
    title: "Off*Script 2027 Core Planner",
    assets_url: "/packs/planner-2027-core"
  }
};

const defaultQrTokens: Record<string, any> = {
  "PACK-DEMO-2027": {
    token_id: "PACK-DEMO-2027",
    pack_id: "planner_2027_core",
    is_redeemed: false,
    redeemed_by_user_id: null,
    redeemed_at: null
  }
};

function freshUserData(userId: string, username: string): UserData {
  const now = new Date().toISOString();
  return {
    user: {
      id: userId,
      chaos_name: username,
      word_of_the_year: "UNTAMED",
      slogan: "Boredom=Death",
      chaos_mantra: "",
      what_done_pretending: "",
      what_ready_to_admit: "",
      relationship_with_chaos: "",
      permission_granted: "",
      birthday: "",
      birth_time: "",
      birthplace: "",
      horoscope_tone: "nice",
      onboarding_seen: false,
      reminder_daily_enabled: false,
      reminder_daily_time: "20:00",
      reminder_weekly_enabled: false,
      reminder_weekly_day: 0,
      reminder_weekly_time: "18:00",
      created_at: now,
      core_values: {
        autonomy: 5, honesty: 5, creativity: 5, presence: 5,
        resilience: 5, playfulness: 5, rest: 5, discipline: 5
      }
    },
    dailyEntries: {},
    personalitySnapshots: [],
    goals: [],
    antiGoals: [],
    flightDebriefs: {},
    moneyMaps: {},
    chaosPoints: [],
    flightCrew: [],
    userEntitlements: [],
    studioMedia: []
  };
}

// Make sure an imported/restored namespace has every collection present.
function normalizeUserData(input: any): UserData {
  const d = input && typeof input === "object" ? input : {};
  let entitlements: string[] = [];
  if (Array.isArray(d.userEntitlements)) {
    entitlements = d.userEntitlements.filter((x: any) => typeof x === "string");
  } else if (d.userEntitlements && typeof d.userEntitlements === "object") {
    // Tolerate the pre-accounts backup shape (map of userId -> packIds).
    entitlements = Object.values(d.userEntitlements).flat().filter((x: any) => typeof x === "string") as string[];
  }
  return {
    user: d.user && typeof d.user === "object" ? d.user : freshUserData("unknown", "operator").user,
    dailyEntries: d.dailyEntries && typeof d.dailyEntries === "object" ? d.dailyEntries : {},
    personalitySnapshots: Array.isArray(d.personalitySnapshots) ? d.personalitySnapshots : [],
    goals: Array.isArray(d.goals) ? d.goals : [],
    antiGoals: Array.isArray(d.antiGoals) ? d.antiGoals : [],
    flightDebriefs: d.flightDebriefs && typeof d.flightDebriefs === "object" ? d.flightDebriefs : {},
    moneyMaps: d.moneyMaps && typeof d.moneyMaps === "object" ? d.moneyMaps : {},
    chaosPoints: Array.isArray(d.chaosPoints) ? d.chaosPoints : [],
    flightCrew: Array.isArray(d.flightCrew) ? d.flightCrew : [],
    userEntitlements: entitlements,
    studioMedia: Array.isArray(d.studioMedia) ? d.studioMedia : []
  };
}

function freshStore(): DataStore {
  return {
    version: 2,
    accounts: [],
    sessions: {},
    users: {},
    contentPacks: JSON.parse(JSON.stringify(defaultContentPacks)),
    qrTokens: JSON.parse(JSON.stringify(defaultQrTokens)),
    wallPosts: [],
    dmMessages: [],
    dmRead: {},
    emailTokens: {}
  };
}

// Pre-accounts prototype data is archived — never destroyed, never handed to a
// new account. It lives under the locked "legacy" user, which has no password
// hash and can never log in.
function migrateLegacyFile(old: any): DataStore {
  const now = new Date().toISOString();
  const legacyUserData = normalizeUserData(old);
  if (old && old.userEntitlements && typeof old.userEntitlements === "object" && !Array.isArray(old.userEntitlements)) {
    const oldUserId = old.user?.id;
    const packs = (old.userEntitlements[oldUserId] || []) as string[];
    legacyUserData.userEntitlements = packs.filter((x) => typeof x === "string");
  }
  const store = freshStore();
  store.accounts.push({
    id: "legacy",
    username: "legacy",
    usernameKey: "legacy",
    passwordHash: "",
    recoveryHash: "",
    created_at: now
  });
  store.users["legacy"] = legacyUserData;
  if (old && typeof old === "object") {
    if (old.contentPacks && typeof old.contentPacks === "object") store.contentPacks = old.contentPacks;
    if (old.qrTokens && typeof old.qrTokens === "object") store.qrTokens = old.qrTokens;
  }
  return store;
}

function loadData(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (parsed && parsed.version === 2 && parsed.users && parsed.accounts) {
        const store = parsed as DataStore;
        if (!store.sessions) store.sessions = {};
        if (!store.contentPacks) store.contentPacks = JSON.parse(JSON.stringify(defaultContentPacks));
        if (!store.qrTokens) store.qrTokens = JSON.parse(JSON.stringify(defaultQrTokens));
        if (!Array.isArray(store.wallPosts)) store.wallPosts = [];
        if (!Array.isArray(store.dmMessages)) store.dmMessages = [];
        if (!store.dmRead || typeof store.dmRead !== "object") store.dmRead = {};
        if (!store.emailTokens || typeof store.emailTokens !== "object") store.emailTokens = {};
        for (const a of store.accounts) if (typeof a.recoveryHash !== "string") a.recoveryHash = "";
        return store;
      }
      if (parsed && typeof parsed === "object") {
        console.log("Migrating pre-accounts data file to per-user store (archived under locked 'legacy' user).");
        const migrated = migrateLegacyFile(parsed);
        saveData(migrated);
        return migrated;
      }
    }
  } catch (e) {
    console.error("Error reading data file, starting fresh", e);
  }
  return freshStore();
}

function saveData(data: DataStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving data file", e);
  }
}

let db = loadData();

// ================= AUTH =================

const SCRYPT_N = 16384, SCRYPT_R = 8, SCRYPT_P = 1;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 }).toString("hex");
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    if (!stored) return false;
    const parts = stored.split("$");
    if (parts[0] !== "scrypt" || parts.length !== 6) return false;
    const n = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
    const salt = parts[4], expected = parts[5];
    if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !expected) return false;
    const derived = crypto.scryptSync(password, salt, 64, { N: n, r: r, p: p, maxmem: 64 * 1024 * 1024 }).toString("hex");
    const a = Buffer.from(derived, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ---------- Password recovery via one-time-shown recovery codes ----------
// No email in this system, so: at registration the server mints a code
// (4 groups of 4 unambiguous chars), stores ONLY its scrypt hash, and shows
// the plaintext exactly once. Recovery rotates the code every time it is used.

const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L

function generateRecoveryCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let grp = "";
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) grp += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
    groups.push(grp);
  }
  return groups.join("-");
}

function normalizeRecoveryCode(code: string): string {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

function hashRecoveryCode(code: string): string {
  return hashPassword(`recovery:${normalizeRecoveryCode(code)}`);
}

function verifyRecoveryCode(code: string, stored: string): boolean {
  if (!stored) return false;
  return verifyPassword(`recovery:${normalizeRecoveryCode(code)}`, stored);
}

// Blunt-force throttle: 10 recovery attempts per username per 15 minutes.
const recoveryAttempts = new Map<string, { count: number; windowStart: number }>();
function recoveryAllowed(usernameKey: string): boolean {
  const now = Date.now();
  const rec = recoveryAttempts.get(usernameKey);
  if (!rec || now - rec.windowStart > 15 * 60 * 1000) {
    recoveryAttempts.set(usernameKey, { count: 1, windowStart: now });
    return true;
  }
  if (rec.count >= 10) return false;
  rec.count += 1;
  return true;
}

// ---------- Usernames: required for every account, every signup method ----------
function usernameTaken(key: string, exceptId?: string): boolean {
  return db.accounts.some((a) => a.usernameKey === key && a.id !== exceptId);
}

/** Friendly alternatives when a name is taken — all guaranteed available. */
function suggestUsernames(base: string, exceptId?: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 18) || "chaos";
  const candidates = [
    `${clean}_${crypto.randomBytes(2).toString("hex")}`,
    `${clean}-2027`,
    `the_real_${clean}`.slice(0, 24),
    `${clean}_unhinged`.slice(0, 24),
  ];
  return candidates.filter((c) => validUsername(c) && !usernameTaken(c, exceptId)).slice(0, 3);
}

function usernameError(username: string, exceptId?: string): { error: string; suggestions?: string[] } | null {
  const name = username.trim();
  if (!validUsername(name)) {
    return { error: "Usernames are 3–24 characters: letters, numbers, _ or -. No spaces, no drama." };
  }
  if (usernameTaken(name.toLowerCase(), exceptId)) {
    return { error: `“${name}” is taken. Great minds, etc.`, suggestions: suggestUsernames(name, exceptId) };
  }
  return null;
}

function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex"); // 256-bit
  const now = Date.now();
  db.sessions[token] = {
    userId,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + SESSION_TTL_MS).toISOString()
  };
  saveData(db);
  return token;
}

function getSessionUserId(token: string): string | null {
  const s = db.sessions[token];
  if (!s) return null;
  if (Date.now() > Date.parse(s.expires_at)) {
    delete db.sessions[token];
    saveData(db);
    return null;
  }
  return s.userId;
}

type AuthedRequest = express.Request & { userId: string; ud: UserData };

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Login required.", code: "AUTH_REQUIRED" });
  }
  const userId = getSessionUserId(token);
  if (!userId || !db.users[userId]) {
    return res.status(401).json({ error: "Session expired. Please log in again.", code: "SESSION_EXPIRED" });
  }
  (req as AuthedRequest).userId = userId;
  (req as AuthedRequest).ud = db.users[userId];
  next();
}

function validUsername(u: string): boolean {
  return /^[A-Za-z0-9_-]{3,24}$/.test(u);
}

// ---------- Public auth routes ----------
app.post("/api/auth/register", (req, res) => {
  const username = String(req.body?.username || "");
  const password = String(req.body?.password || "");
  const uErr = usernameError(username);
  if (uErr) {
    const status = uErr.suggestions ? 409 : 400;
    return res.status(status).json(uErr);
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters. Pick a good one — this guards your chaos." });
  }
  const name = username.trim();
  const key = name.toLowerCase();
  const id = `user_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();
  const recoveryCode = generateRecoveryCode();
  db.accounts.push({ id, username: name, usernameKey: key, passwordHash: hashPassword(password), recoveryHash: hashRecoveryCode(recoveryCode), created_at: now });
  db.users[id] = freshUserData(id, name);
  const token = createSession(id);
  saveData(db);
  res.json({ token, user: db.users[id].user, recoveryCode });
});

app.post("/api/auth/login", (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const acct = db.accounts.find((a) => a.usernameKey === username);
  // One generic message: never reveal whether the username exists.
  if (!acct || !verifyPassword(password, acct.passwordHash)) {
    return res.status(401).json({ error: "Wrong username or password." });
  }
  if (!db.users[acct.id]) db.users[acct.id] = freshUserData(acct.id, acct.username);
  const token = createSession(acct.id);
  saveData(db);
  res.json({ token, user: db.users[acct.id].user });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    saveData(db);
  }
  res.json({ success: true });
});

// Password recovery: username + recovery code -> set a new password, rotate the code.
// Rate-limited per username; responses stay generic so usernames can't be probed.
app.post("/api/auth/recover", (req, res) => {
  const usernameKey = String(req.body?.username || "").trim().toLowerCase();
  const code = String(req.body?.recoveryCode || "");
  const newPassword = String(req.body?.newPassword || "");
  if (!recoveryAllowed(usernameKey || "blank")) {
    return res.status(429).json({ error: "Too many attempts. Cool off for a bit and try again." });
  }
  const acct = db.accounts.find((a) => a.usernameKey === usernameKey);
  if (!acct || !verifyRecoveryCode(code, acct.recoveryHash)) {
    return res.status(401).json({ error: "That didn't verify. Check the username and recovery code and try again." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters. Pick a good one." });
  }
  acct.passwordHash = hashPassword(newPassword);
  const newCode = generateRecoveryCode();
  acct.recoveryHash = hashRecoveryCode(newCode);
  // A password change kills every session — log in again everywhere.
  for (const [tok, s] of Object.entries(db.sessions)) {
    if (s.userId === acct.id) delete db.sessions[tok];
  }
  recoveryAttempts.delete(usernameKey);
  saveData(db);
  res.json({ success: true, recoveryCode: newCode });
});

// Logged-in rotation: mint a fresh recovery code, shown exactly once.
app.post("/api/auth/recovery-code/rotate", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const acct = db.accounts.find((a) => a.id === ar.userId);
  if (!acct) return res.status(404).json({ error: "Account not found." });
  const newCode = generateRecoveryCode();
  acct.recoveryHash = hashRecoveryCode(newCode);
  saveData(db);
  res.json({ recoveryCode: newCode });
});

// ================= OAUTH (Google / Facebook) + EMAIL AUTH =================
// Local username/password + recovery codes keep working regardless.
// Linking rule: an OAuth login whose verified email matches an existing
// email account links to that account; otherwise a new account is created
// (after the mandatory choose-your-username step).

interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function oauthConfig(provider: "google" | "facebook"): OAuthProviderConfig | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${baseUrl()}/api/auth/oauth/google/callback`,
    };
  }
  const clientId = process.env.FACEBOOK_APP_ID || "";
  const clientSecret = process.env.FACEBOOK_APP_SECRET || "";
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${baseUrl()}/api/auth/oauth/facebook/callback`,
  };
}

// Public capability flags so the UI hides what isn't configured.
app.get("/api/auth/config", (_req, res) => {
  res.json({
    google: !!oauthConfig("google"),
    facebook: !!oauthConfig("facebook"),
    email: true,
    smtp: smtpConfigured(),
  });
});

// Short-lived CSRF states and pending OAuth signups (single-process prototype).
const oauthStates = new Map<string, { provider: string; createdAt: number }>();
const oauthPending = new Map<string, {
  provider: string; providerId: string; email: string | null;
  emailVerified: boolean; displayName: string | null; createdAt: number;
}>();

app.get("/api/auth/oauth/:provider", (req, res) => {
  const provider = req.params.provider;
  if (provider !== "google" && provider !== "facebook") return res.status(404).send("Unknown provider.");
  const cfg = oauthConfig(provider);
  if (!cfg) return res.status(503).send(`${provider} login is not configured on this instance yet.`);
  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.set(state, { provider, createdAt: Date.now() });
  if (process.env.OAUTH_DEV_STUB === "1") {
    // Dev/test only: skip the real provider, bounce straight to the callback.
    return res.redirect(`${cfg.redirectUri}?code=devstub&state=${state}`);
  }
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: provider === "google" ? "openid email profile" : "email,public_profile",
    state,
  });
  const url = provider === "google"
    ? `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    : `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  res.redirect(url);
});

interface OAuthProfile {
  providerId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}

async function fetchOAuthProfile(provider: string, cfg: OAuthProviderConfig, code: string): Promise<OAuthProfile> {
  if (process.env.OAUTH_DEV_STUB === "1" && code === "devstub") {
    return {
      providerId: `devstub-${provider}-123`,
      email: `stub-${provider}@example.com`,
      emailVerified: true,
      displayName: `Stub ${provider}`,
    };
  }
  const tokenUrl = provider === "google"
    ? "https://oauth2.googleapis.com/token"
    : "https://graph.facebook.com/v18.0/oauth/access_token";
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("Token exchange failed.");
  const tok = (await tokenRes.json()) as any;
  const accessToken = tok.access_token;
  if (!accessToken) throw new Error("No access token returned.");
  if (provider === "google") {
    const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!me.ok) throw new Error("Could not fetch Google profile.");
    const p = (await me.json()) as any;
    return {
      providerId: String(p.sub),
      email: p.email || null,
      emailVerified: !!p.email_verified,
      displayName: p.name || null,
    };
  }
  const me = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!me.ok) throw new Error("Could not fetch Facebook profile.");
  const p = (await me.json()) as any;
  return {
    providerId: String(p.id),
    email: p.email || null,
    emailVerified: !!p.email,
    displayName: p.name || null,
  };
}

app.get("/api/auth/oauth/:provider/callback", async (req, res) => {
  const provider = req.params.provider;
  try {
    if (provider !== "google" && provider !== "facebook") return res.status(404).send("Unknown provider.");
    const cfg = oauthConfig(provider);
    if (!cfg) return res.status(503).send("OAuth is not configured on this instance.");
    const { code, state } = req.query as Record<string, string>;
    const st = state ? oauthStates.get(state) : undefined;
    if (state) oauthStates.delete(state);
    if (!st || st.provider !== provider || Date.now() - st.createdAt > 10 * 60 * 1000) {
      return res.status(400).send(authPage("That login expired.", "OAuth sessions last 10 minutes. Hit the button again."));
    }
    if (!code) return res.status(400).send(authPage("Login cancelled.", "The provider didn't send us back a code. Try again whenever."));
    const profile = await fetchOAuthProfile(provider, cfg, code);

    // 1) Provider id already linked -> straight in.
    let acct = db.accounts.find((a) =>
      provider === "google" ? a.googleId === profile.providerId : a.facebookId === profile.providerId
    );
    // 2) Verified email matches an existing email account -> link it, straight in.
    if (!acct && profile.email && profile.emailVerified) {
      const key = profile.email.toLowerCase();
      acct = db.accounts.find((a) => (a.email || "").toLowerCase() === key);
      if (acct) {
        if (provider === "google") acct.googleId = profile.providerId;
        else acct.facebookId = profile.providerId;
        acct.emailVerified = true;
      }
    }
    if (acct) {
      if (!db.users[acct.id]) db.users[acct.id] = freshUserData(acct.id, acct.username);
      const token = createSession(acct.id);
      saveData(db);
      return res.redirect(`${baseUrl()}/#oauth=${token}`);
    }
    // 3) Brand new human: park the verified profile. No account exists until
    // they choose a username — the app forces that step next.
    const pendingKey = crypto.randomBytes(24).toString("hex");
    oauthPending.set(pendingKey, {
      provider,
      providerId: profile.providerId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      displayName: profile.displayName,
      createdAt: Date.now(),
    });
    saveData(db);
    return res.redirect(`${baseUrl()}/#oauth_pending=${pendingKey}&provider=${provider}`);
  } catch (e: any) {
    return res.status(500).send(authPage("OAuth hiccup.", `Something broke talking to the provider: ${e?.message || e}`));
  }
});

// Finalize an OAuth signup: the mandatory choose-your-username step.
app.post("/api/auth/oauth/complete", (req, res) => {
  const pendingKey = String(req.body?.pendingKey || "");
  const pend = oauthPending.get(pendingKey);
  if (!pend || Date.now() - pend.createdAt > 15 * 60 * 1000) {
    if (pend) oauthPending.delete(pendingKey);
    return res.status(400).json({ error: "That signup session expired. Hit the provider button again." });
  }
  const err = usernameError(String(req.body?.username || ""));
  if (err) return res.status(409).json(err); // keep the pending session so they can retry a suggestion
  oauthPending.delete(pendingKey);
  const username = String(req.body.username).trim();

  // Re-check email linking at completion time (it may have been registered meanwhile).
  let acct: AccountUser | undefined;
  if (pend.email && pend.emailVerified) {
    const key = pend.email.toLowerCase();
    acct = db.accounts.find((a) => (a.email || "").toLowerCase() === key);
  }
  if (acct) {
    // Linked to an existing account mid-flow — it already has a username.
    if (pend.provider === "google") acct.googleId = pend.providerId;
    else acct.facebookId = pend.providerId;
    if (!db.users[acct.id]) db.users[acct.id] = freshUserData(acct.id, acct.username);
    const token = createSession(acct.id);
    saveData(db);
    return res.json({ token, user: db.users[acct.id].user });
  }

  const id = `user_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();
  const recoveryCode = generateRecoveryCode();
  acct = {
    id,
    username,
    usernameKey: username.toLowerCase(),
    passwordHash: "", // OAuth-only until a password is set via recovery
    recoveryHash: hashRecoveryCode(recoveryCode),
    email: pend.email || undefined,
    emailVerified: pend.emailVerified || undefined,
    created_at: now,
  };
  if (pend.provider === "google") acct.googleId = pend.providerId;
  else acct.facebookId = pend.providerId;
  db.accounts.push(acct);
  db.users[id] = freshUserData(id, username);
  saveData(db);
  const token = createSession(id);
  res.json({ token, user: db.users[id].user, recoveryCode });
});

// ---------- Email auth ----------

function validEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
}

function issueEmailToken(accountId: string, kind: "verify" | "reset", email: string, ttlMs: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  const key = crypto.createHash("sha256").update(token).digest("hex");
  db.emailTokens[key] = { accountId, kind, email, expires_at: new Date(Date.now() + ttlMs).toISOString() };
  saveData(db);
  return token;
}

function consumeEmailToken(token: string, kind: "verify" | "reset"): EmailTokenRecord | null {
  const key = crypto.createHash("sha256").update(String(token || "")).digest("hex");
  const rec = db.emailTokens[key];
  if (!rec || rec.kind !== kind) return null;
  delete db.emailTokens[key];
  if (Date.now() > Date.parse(rec.expires_at)) {
    saveData(db);
    return null;
  }
  saveData(db);
  return rec;
}

function authPage(title: string, body: string, ok = false): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Off*Script</title></head>
<body style="font-family:Georgia,serif;background:#faf5eb;color:#1c1917;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px">
<div style="max-width:480px;background:#fffdfa;border:2px solid #1c1917;border-radius:16px;padding:32px;text-align:center">
<div style="font-size:32px">${ok ? "✅" : "⚠️"}</div>
<h1 style="font-size:20px">${title}</h1><p style="font-size:14px;line-height:1.6">${body}</p>
<p><a href="${baseUrl()}/" style="color:#e11d48;font-weight:bold">Back to the app →</a></p>
</div></body></html>`;
}

function resetFormPage(token: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Set a new password — Off*Script</title></head>
<body style="font-family:Georgia,serif;background:#faf5eb;color:#1c1917;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px">
<div style="max-width:440px;width:100%;background:#fffdfa;border:2px solid #1c1917;border-radius:16px;padding:32px">
<div style="font-size:32px;text-align:center">⚡</div>
<h1 style="font-size:20px;text-align:center">Set a new password</h1>
<form method="POST" action="/api/auth/email/reset">
<input type="hidden" name="token" value="${token}">
<label style="display:block;font-size:12px;font-weight:bold;margin:12px 0 4px">New password (8+ characters)</label>
<input type="password" name="newPassword" required minlength="8" style="width:100%;padding:10px;border:1px solid #d6d3d1;border-radius:10px;box-sizing:border-box">
<button type="submit" style="width:100%;margin-top:16px;background:#e11d48;color:#fff;border:none;padding:12px;border-radius:12px;font-weight:bold;cursor:pointer">Set new password</button>
</form></div></body></html>`;
}

app.post("/api/auth/email/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const username = String(req.body?.username || "");
  const password = String(req.body?.password || "");
  if (!validEmail(email)) return res.status(400).json({ error: "That doesn't look like an email address." });
  const uErr = usernameError(username);
  if (uErr) return res.status(uErr.suggestions ? 409 : 400).json(uErr);
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (db.accounts.some((a) => (a.email || "").toLowerCase() === email)) {
    return res.status(409).json({ error: "That email is already registered. Try logging in — or the forgot-password flow." });
  }
  const name = username.trim();
  const id = `user_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();
  const recoveryCode = generateRecoveryCode();
  const smtp = smtpConfigured();
  const acct: AccountUser = {
    id,
    username: name,
    usernameKey: name.toLowerCase(),
    passwordHash: hashPassword(password),
    recoveryHash: hashRecoveryCode(recoveryCode),
    email,
    emailVerified: smtp ? false : true,
    created_at: now,
  };
  db.accounts.push(acct);
  db.users[id] = freshUserData(id, name);
  let emailed = false;
  if (smtp) {
    try {
      const token = issueEmailToken(id, "verify", email, 24 * 3600 * 1000);
      await sendMail(verificationEmail(email, `${baseUrl()}/api/auth/email/verify?token=${token}`));
      emailed = true;
    } catch (e: any) {
      console.warn("Verification email failed to send:", e?.message);
    }
  } else {
    console.warn(`[auth] SMTP unconfigured — email verification skipped for ${email} (auto-verified).`);
  }
  const token = createSession(id);
  saveData(db);
  res.json({ token, user: db.users[id].user, recoveryCode, emailVerified: acct.emailVerified, verificationEmailed: emailed });
});

app.post("/api/auth/email/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const acct = db.accounts.find((a) => (a.email || "").toLowerCase() === email);
  if (!acct || !verifyPassword(password, acct.passwordHash)) {
    return res.status(401).json({ error: "Wrong email or password." });
  }
  if (!db.users[acct.id]) db.users[acct.id] = freshUserData(acct.id, acct.username);
  const token = createSession(acct.id);
  saveData(db);
  res.json({ token, user: db.users[acct.id].user });
});

app.get("/api/auth/email/verify", (req, res) => {
  const rec = consumeEmailToken(String(req.query.token || ""), "verify");
  if (!rec) {
    return res.status(400).send(authPage("Link's no good.", "That verification link is invalid or expired. Request a fresh one from inside the app."));
  }
  const acct = db.accounts.find((a) => a.id === rec.accountId);
  if (!acct) return res.status(400).send(authPage("Account's gone.", "The account for that link doesn't exist anymore."));
  acct.emailVerified = true;
  saveData(db);
  res.send(authPage("Email verified. You're official.", "Head back to the app and carry on being unhinged.", true));
});

app.post("/api/auth/email/resend-verification", requireAuth, async (req, res) => {
  const ar = req as AuthedRequest;
  const acct = db.accounts.find((a) => a.id === ar.userId);
  if (!acct?.email) return res.status(400).json({ error: "No email on this account." });
  if (acct.emailVerified) return res.json({ already: true });
  if (!smtpConfigured()) return res.status(503).json({ error: "Email sending isn't configured on this instance." });
  const token = issueEmailToken(acct.id, "verify", acct.email, 24 * 3600 * 1000);
  await sendMail(verificationEmail(acct.email, `${baseUrl()}/api/auth/email/verify?token=${token}`));
  res.json({ sent: true });
});

app.post("/api/auth/email/forgot", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!smtpConfigured()) {
    return res.json({
      fallback: "recovery-code",
      message: "Email sending isn't configured on this instance — use your recovery code instead (log in screen → Forgot password?).",
    });
  }
  // Same response either way so email addresses can't be probed.
  const acct = db.accounts.find((a) => (a.email || "").toLowerCase() === email);
  if (acct?.email) {
    const token = issueEmailToken(acct.id, "reset", acct.email, 3600 * 1000);
    try {
      await sendMail(resetEmail(acct.email, `${baseUrl()}/api/auth/email/reset?token=${token}`));
    } catch (e: any) {
      console.warn("Reset email failed:", e?.message);
    }
  }
  res.json({ sent: true, message: "If that email is registered, a reset link is on its way. Check your inbox (and the spam dungeon)." });
});

app.get("/api/auth/email/reset", (req, res) => {
  const token = String(req.query.token || "");
  const key = crypto.createHash("sha256").update(token).digest("hex");
  const rec = db.emailTokens[key];
  const valid = rec && rec.kind === "reset" && Date.now() <= Date.parse(rec.expires_at);
  if (!valid) return res.status(400).send(authPage("Link's no good.", "That reset link is invalid or expired. Request a fresh one."));
  res.send(resetFormPage(token));
});

app.post("/api/auth/email/reset", express.urlencoded({ extended: false }), (req, res) => {
  const rec = consumeEmailToken(String(req.body?.token || ""), "reset");
  const newPassword = String(req.body?.newPassword || "");
  if (!rec) return res.status(400).send(authPage("Link's no good.", "That reset link is invalid or already used."));
  if (newPassword.length < 8) {
    return res.status(400).send(authPage("Too short.", "Password must be at least 8 characters. Hit back and try again."));
  }
  const acct = db.accounts.find((a) => a.id === rec.accountId);
  if (!acct) return res.status(400).send(authPage("Account's gone.", "The account for that link doesn't exist anymore."));
  acct.passwordHash = hashPassword(newPassword);
  const newCode = generateRecoveryCode();
  acct.recoveryHash = hashRecoveryCode(newCode);
  for (const [tok, s] of Object.entries(db.sessions)) {
    if (s.userId === acct.id) delete db.sessions[tok];
  }
  saveData(db);
  res.send(authPage(
    "Password reset. Fresh start.",
    "Log in with the new password. Your recovery code was also rotated — grab a fresh one from Identity Base → Account Safety.",
    true
  ));
});

// ---------- Username changes (logged in) ----------
app.post("/api/auth/username", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const acct = db.accounts.find((a) => a.id === ar.userId);
  if (!acct) return res.status(404).json({ error: "Account not found." });
  const now = Date.now();
  const history = (acct.usernameHistory || []).filter((t) => now - Date.parse(t) < 24 * 3600 * 1000);
  if (history.length >= 3) {
    return res.status(429).json({ error: "Whoa — 3 username changes in 24 hours is the limit. Sit with one for a bit." });
  }
  const err = usernameError(String(req.body?.username || ""), acct.id);
  if (err) return res.status(err.suggestions ? 409 : 400).json(err);
  const username = String(req.body.username).trim();
  const oldUsername = acct.username;
  acct.username = username;
  acct.usernameKey = username.toLowerCase();
  acct.usernameHistory = [...history, new Date(now).toISOString()];
  // The username is what's displayed everywhere — update denormalized copies.
  for (const p of db.wallPosts || []) if (p.userId === acct.id) p.username = username;
  for (const m of db.dmMessages || []) {
    if (m.fromId === acct.id) m.fromUsername = username;
    if (m.toId === acct.id) m.toUsername = username;
  }
  // If the profile display name was still the old username (or blank), follow the rename
  // so the header/profile show the new name immediately. A custom display name is left alone.
  const profile = db.users[acct.id]?.user;
  if (profile && (!profile.chaos_name || profile.chaos_name === oldUsername)) {
    profile.chaos_name = username;
  }
  saveData(db);
  res.json({ username, chaosName: db.users[acct.id]?.user?.chaos_name || username });
});

// ---------- Health check (public) ----------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Strip protected fields so PATCH bodies can't overwrite record identity.
function sanitizePatch(body: any): Record<string, any> {
  const { id, created_at, awarded_at, ...rest } = body || {};
  return rest;
}

// ================= API ROUTES (all require auth unless noted) =================

app.get("/api/auth/me", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const acct = db.accounts.find((a) => a.id === ar.userId);
  res.json({ ...ar.ud.user, email: acct?.email || null, emailVerified: !!acct?.emailVerified });
});

// Content packs are shared and read-only.
app.get("/api/content-packs", requireAuth, (_req, res) => {
  res.json(Object.values(db.contentPacks || {}));
});

app.get("/api/entitlements", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const packIds = ar.ud.userEntitlements || [];
  const redeemedAt: Record<string, string> = {};
  for (const t of Object.values<any>(db.qrTokens || {})) {
    if (t.redeemed_by_user_id === ar.userId && t.pack_id) redeemedAt[t.pack_id] = t.redeemed_at || "";
  }
  const entitlements = packIds
    .map((packId: string) => db.contentPacks?.[packId])
    .filter(Boolean)
    .map((pack: any) => ({
      user_id: ar.userId,
      pack_id: pack.pack_id,
      unlocked_at: redeemedAt[pack.pack_id] || "",
      title: pack.title,
      assets_url: pack.assets_url
    }));
  res.json(entitlements);
});

app.post("/api/redeem-token", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const userId = ar.userId;
  const tokenId = String(req.body?.tokenId || "").trim().toUpperCase();
  if (!tokenId) {
    return res.status(400).json({ success: false, error: "A QR token is required." });
  }

  const token = db.qrTokens?.[tokenId];
  if (!token) {
    return res.status(404).json({ success: false, error: "Invalid QR code." });
  }
  if (token.is_redeemed) {
    return res.status(400).json({ success: false, error: "This QR code has already been claimed." });
  }

  const pack = db.contentPacks?.[token.pack_id];
  if (!pack) {
    return res.status(500).json({ success: false, error: "This QR code points to an unavailable content pack." });
  }

  // This synchronous check-and-write is atomic within the current single-process prototype.
  // Production must replace it with a database transaction / conditional UPDATE.
  token.is_redeemed = true;
  token.redeemed_by_user_id = userId;
  token.redeemed_at = new Date().toISOString();
  if (!ar.ud.userEntitlements.includes(pack.pack_id)) {
    ar.ud.userEntitlements.push(pack.pack_id);
  }
  saveData(db);

  return res.json({ success: true, packId: pack.pack_id, title: pack.title });
});

// User profile
app.get("/api/user", requireAuth, (req, res) => {
  res.json((req as AuthedRequest).ud.user);
});

app.post("/api/user", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id, created_at, ...safe } = req.body || {};
  ar.ud.user = { ...ar.ud.user, ...safe, updated_at: new Date().toISOString() };
  saveData(db);
  res.json(ar.ud.user);
});

// Goals
app.get("/api/goals", requireAuth, (req, res) => {
  res.json((req as AuthedRequest).ud.goals || []);
});

app.post("/api/goals", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  if ((ar.ud.goals || []).length >= 6) {
    return res.status(400).json({ error: "Strict maximum of 6 goals allowed in the Big 6 Os!" });
  }
  const newGoal = {
    id: `goal_${Date.now()}`,
    title: req.body.title || "Untitled Goal",
    quarter: req.body.quarter || "Q1",
    why_statement: req.body.why_statement || "",
    success_metric: req.body.success_metric || "",
    first_step: req.body.first_step || "",
    is_completed: false,
    created_at: new Date().toISOString()
  };
  ar.ud.goals.push(newGoal);
  saveData(db);
  res.json(newGoal);
});

app.patch("/api/goals/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id } = req.params;
  const index = ar.ud.goals.findIndex((g: any) => g.id === id);
  if (index === -1) return res.status(404).json({ error: "Goal not found" });
  ar.ud.goals[index] = { ...ar.ud.goals[index], ...sanitizePatch(req.body) };
  saveData(db);
  res.json(ar.ud.goals[index]);
});

app.delete("/api/goals/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id } = req.params;
  const before = (ar.ud.goals || []).length;
  ar.ud.goals = ar.ud.goals.filter((g: any) => g.id !== id);
  if (ar.ud.goals.length === before) return res.status(404).json({ error: "Goal not found" });
  saveData(db);
  res.json({ success: true });
});

// Anti-Goals
app.get("/api/anti-goals", requireAuth, (req, res) => {
  res.json((req as AuthedRequest).ud.antiGoals || []);
});

app.post("/api/anti-goals", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const newAntiGoal = {
    id: `antigoal_${Date.now()}`,
    title: req.body.title || "Untitled Anti-Goal",
    category: req.body.category || "Boundary",
    why_stopped: req.body.why_stopped || "",
    is_completed: Boolean(req.body.is_completed),
    created_at: new Date().toISOString()
  };
  ar.ud.antiGoals.push(newAntiGoal);
  saveData(db);
  res.json(newAntiGoal);
});

app.patch("/api/anti-goals/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id } = req.params;
  const index = ar.ud.antiGoals.findIndex((ag: any) => ag.id === id);
  if (index === -1) return res.status(404).json({ error: "Anti-goal not found" });
  ar.ud.antiGoals[index] = { ...ar.ud.antiGoals[index], ...sanitizePatch(req.body) };
  saveData(db);
  res.json(ar.ud.antiGoals[index]);
});

app.delete("/api/anti-goals/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id } = req.params;
  const before = ar.ud.antiGoals.length;
  ar.ud.antiGoals = ar.ud.antiGoals.filter((ag: any) => ag.id !== id);
  if (ar.ud.antiGoals.length === before) return res.status(404).json({ error: "Anti-goal not found" });
  saveData(db);
  res.json({ success: true });
});

// Chaos Points ledger
const CHAOS_POINT_VALUES: Record<string, number> = {
  daily_log: 10,
  micro_dare: 15,
  weekly_debrief: 25,
  antigoal_quashed: 30,
  goal_completed: 50,
  diagnostic_run: 5,
  share_fired: 5
};

app.get("/api/points", requireAuth, (req, res) => {
  res.json((req as AuthedRequest).ud.chaosPoints || []);
});

app.post("/api/points/award", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const action = String(req.body?.action || "").trim();
  const ref = String(req.body?.ref || "").trim();
  const label = String(req.body?.label || action).trim();
  if (!action || !CHAOS_POINT_VALUES[action]) {
    return res.status(400).json({ error: "Unknown point action." });
  }
  // Dedupe: one award per action+ref so refreshes and double-saves don't farm points.
  const dedupeRef = ref || `${action}:${new Date().toISOString().split("T")[0]}`;
  const existing = ar.ud.chaosPoints.find((p: any) => p.ref === dedupeRef && p.action === action);
  const total = () => ar.ud.chaosPoints.reduce((s: number, p: any) => s + p.points, 0);
  if (existing) {
    return res.json({ entry: existing, total: total(), duplicate: true });
  }
  const entry = {
    id: `pts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    points: CHAOS_POINT_VALUES[action],
    ref: dedupeRef,
    label,
    awarded_at: new Date().toISOString()
  };
  ar.ud.chaosPoints.push(entry);
  saveData(db);
  res.json({ entry, total: total(), duplicate: false });
});

// Flight Crew contacts
app.get("/api/flight-crew", requireAuth, (req, res) => {
  res.json((req as AuthedRequest).ud.flightCrew || []);
});

app.post("/api/flight-crew", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Contact name is required." });
  const contact = {
    id: `crew_${Date.now()}`,
    name,
    role: String(req.body?.role || "Co-conspirator"),
    notes: String(req.body?.notes || ""),
    created_at: new Date().toISOString()
  };
  ar.ud.flightCrew.push(contact);
  saveData(db);
  res.json(contact);
});

app.patch("/api/flight-crew/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id } = req.params;
  const index = ar.ud.flightCrew.findIndex((c: any) => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Contact not found" });
  const updates = sanitizePatch(req.body);
  if (updates.name !== undefined) {
    updates.name = String(updates.name).trim();
    if (!updates.name) return res.status(400).json({ error: "Contact name cannot be blank." });
  }
  if (updates.role !== undefined) updates.role = String(updates.role);
  if (updates.notes !== undefined) updates.notes = String(updates.notes);
  ar.ud.flightCrew[index] = { ...ar.ud.flightCrew[index], ...updates };
  saveData(db);
  res.json(ar.ud.flightCrew[index]);
});

app.delete("/api/flight-crew/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const { id } = req.params;
  const before = ar.ud.flightCrew.length;
  ar.ud.flightCrew = ar.ud.flightCrew.filter((c: any) => c.id !== id);
  if (ar.ud.flightCrew.length === before) return res.status(404).json({ error: "Contact not found" });
  saveData(db);
  res.json({ success: true });
});

// Full backup export / import (used by Google Drive backup).
// Backups are per-user: you export and restore your own namespace only.
app.get("/api/backup/export", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  res.json({
    exported_at: new Date().toISOString(),
    app: "off-script-life-os",
    user_id: ar.userId,
    data: ar.ud
  });
});

app.post("/api/backup/import", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const payload = req.body?.data || req.body;
  if (!payload || typeof payload !== "object" || !payload.user) {
    return res.status(400).json({ error: "That file doesn't look like an Off*Script backup." });
  }
  db.users[ar.userId] = normalizeUserData(payload);
  // An imported backup can never change who you are: force the profile's
  // internal id back to the authenticated account.
  db.users[ar.userId].user.id = ar.userId;
  saveData(db);
  res.json({ success: true, restored_at: new Date().toISOString() });
});

// ---------- Reminders: per-user settings, server-side due computation ----------
// Settings live on the profile (reminder_* fields). The server computes
// due-ness on its own clock — for a self-hosted prototype that clock is the
// deployer's machine. True push notifications need a deployer's push setup;
// this endpoint powers the in-app bell/door badge instead.
app.get("/api/reminders/due", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const u = ar.ud.user || {};
  const settings: ReminderSettings = {
    dailyEnabled: !!u.reminder_daily_enabled,
    dailyTime: typeof u.reminder_daily_time === "string" ? u.reminder_daily_time : "20:00",
    weeklyEnabled: !!u.reminder_weekly_enabled,
    weeklyDay: Number.isInteger(u.reminder_weekly_day) ? u.reminder_weekly_day : 0,
    weeklyTime: typeof u.reminder_weekly_time === "string" ? u.reminder_weekly_time : "18:00",
  };
  const entryDates = Object.keys(ar.ud.dailyEntries || {});
  const debriefWeeks = Object.values(ar.ud.flightDebriefs || {})
    .map((d: any) => Number(d.week_number))
    .filter(Number.isFinite);
  const due = computeDueReminders(settings, entryDates, debriefWeeks, new Date());
  res.json({ due, settings, server_time: new Date().toISOString() });
});

// ---------- The Chaos Wall: shared community board ----------
// Visible to every registered user on this instance. No moderation queue in
// this prototype — fine for a private/friends deployment, not for public.
const WALL_MAX = 500;

app.get("/api/wall", requireAuth, (_req, res) => {
  const posts = [...(db.wallPosts || [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 200);
  res.json(posts);
});

app.post("/api/wall", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Empty screams echo nowhere. Write something first." });
  if (text.length > WALL_MAX) {
    return res.status(400).json({ error: `Keep it under ${WALL_MAX} characters. Scream concisely.` });
  }
  const acct = db.accounts.find((a) => a.id === ar.userId);
  const post: WallPost = {
    id: `wall_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    userId: ar.userId,
    username: acct?.username || "anonymous",
    text,
    created_at: new Date().toISOString(),
  };
  db.wallPosts = db.wallPosts || [];
  db.wallPosts.push(post);
  saveData(db);
  res.json(post);
});

app.delete("/api/wall/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const idx = (db.wallPosts || []).findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "That post is gone. The void ate it." });
  if (db.wallPosts[idx].userId !== ar.userId) {
    return res.status(403).json({ error: "That's not your scream to unscream." });
  }
  db.wallPosts.splice(idx, 1);
  saveData(db);
  res.json({ success: true });
});

// ---------- Inbox: one-to-one DMs ----------
const DM_MAX = 2000;

function inboxThreads(userId: string) {
  const msgs = (db.dmMessages || []).filter((m) => m.fromId === userId || m.toId === userId);
  const byPartner = new Map<string, DmMessage[]>();
  for (const m of msgs) {
    const partnerId = m.fromId === userId ? m.toId : m.fromId;
    if (!byPartner.has(partnerId)) byPartner.set(partnerId, []);
    byPartner.get(partnerId)!.push(m);
  }
  const out = [];
  for (const [partnerId, list] of byPartner) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const last = list[list.length - 1];
    const watermark = (db.dmRead[userId] && db.dmRead[userId][partnerId]) || "";
    const unread = list.filter((m) => m.fromId === partnerId && m.created_at > watermark).length;
    const acct = db.accounts.find((a) => a.id === partnerId);
    const partnerUsername = acct?.username || (last.fromId === partnerId ? last.fromUsername : last.toUsername);
    out.push({
      partnerId,
      partnerUsername,
      lastText: last.text,
      lastAt: last.created_at,
      lastFromMe: last.fromId === userId,
      unread,
    });
  }
  out.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  return out;
}

// User directory: usernames only — no emails exist for local accounts, and we
// don't leak them for email accounts either.
app.get("/api/users/directory", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  res.json(
    db.accounts
      .filter((a) => {
        if (a.id === ar.userId || a.id === "legacy") return false;
        // Only real, usable accounts: password set, or OAuth/email linked.
        return a.passwordHash !== "" || !!a.googleId || !!a.facebookId || !!a.email;
      })
      .map((a) => ({ id: a.id, username: a.username }))
      .sort((x, y) => x.username.localeCompare(y.username))
  );
});

app.get("/api/inbox/threads", requireAuth, (req, res) => {
  res.json(inboxThreads((req as AuthedRequest).userId));
});

app.get("/api/inbox/threads/:partnerId", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const partnerId = req.params.partnerId;
  const messages = (db.dmMessages || [])
    .filter(
      (m) =>
        (m.fromId === ar.userId && m.toId === partnerId) ||
        (m.fromId === partnerId && m.toId === ar.userId)
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  // Reading marks the thread read.
  if (!db.dmRead[ar.userId]) db.dmRead[ar.userId] = {};
  db.dmRead[ar.userId][partnerId] = new Date().toISOString();
  saveData(db);
  const acct = db.accounts.find((a) => a.id === partnerId);
  res.json({
    partner: { id: partnerId, username: acct?.username || "unknown" },
    messages,
  });
});

app.post("/api/inbox/messages", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const toId = String(req.body?.toId || "");
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Can't send an empty message. The void has standards." });
  if (text.length > DM_MAX) {
    return res.status(400).json({ error: `Keep it under ${DM_MAX} characters. Write a letter, not a novel.` });
  }
  if (toId === ar.userId) return res.status(400).json({ error: "DMing yourself is just journaling. The flight log is that way." });
  const recipient = db.accounts.find((a) => a.id === toId && a.id !== "legacy");
  if (!recipient) return res.status(404).json({ error: "That user doesn't exist." });
  const sender = db.accounts.find((a) => a.id === ar.userId);
  const msg: DmMessage = {
    id: `dm_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    fromId: ar.userId,
    fromUsername: sender?.username || "anonymous",
    toId,
    toUsername: recipient.username,
    text,
    created_at: new Date().toISOString(),
  };
  db.dmMessages = db.dmMessages || [];
  db.dmMessages.push(msg);
  saveData(db);
  res.json(msg);
});

app.delete("/api/inbox/messages/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const idx = (db.dmMessages || []).findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Message not found." });
  if (db.dmMessages[idx].fromId !== ar.userId) {
    return res.status(403).json({ error: "You can only delete messages you sent." });
  }
  db.dmMessages.splice(idx, 1);
  saveData(db);
  res.json({ success: true });
});

// Daily entries
app.get("/api/entries", requireAuth, (req, res) => {
  res.json(Object.values((req as AuthedRequest).ud.dailyEntries));
});

app.get("/api/entries/:date", requireAuth, (req, res) => {
  const entry = (req as AuthedRequest).ud.dailyEntries[req.params.date];
  if (!entry) {
    return res.json(null);
  }
  res.json(entry);
});

app.post("/api/entries", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const date = req.body.entry_date || new Date().toISOString().split("T")[0];
  const existing = ar.ud.dailyEntries[date] || {};
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id || `entry_${date}`,
    entry_date: date,
    updated_at: new Date().toISOString()
  };
  ar.ud.dailyEntries[date] = updated;
  saveData(db);
  res.json(updated);
});

// Snapshots
app.get("/api/snapshots", requireAuth, (req, res) => {
  res.json((req as AuthedRequest).ud.personalitySnapshots || []);
});

// Weekly Flight Debriefs
app.get("/api/flight-debriefs", requireAuth, (req, res) => {
  res.json(Object.values((req as AuthedRequest).ud.flightDebriefs || {}));
});

app.post("/api/flight-debriefs", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const weekNum = String(req.body.week_number || 1);
  const debrief = {
    id: `debrief_w${weekNum}`,
    week_number: Number(weekNum),
    ...req.body,
    updated_at: new Date().toISOString()
  };
  ar.ud.flightDebriefs[weekNum] = debrief;
  saveData(db);
  res.json(debrief);
});

// Monthly Money Map
app.get("/api/money-maps/all", requireAuth, (req, res) => {
  res.json(Object.values((req as AuthedRequest).ud.moneyMaps || {}));
});

app.get("/api/money-maps/:yearMonth", requireAuth, (req, res) => {
  const key = req.params.yearMonth; // "2027-01"
  res.json((req as AuthedRequest).ud.moneyMaps[key] || null);
});

app.post("/api/money-maps", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const key = `${req.body.year || 2027}-${String(req.body.month || 1).padStart(2, '0')}`;
  const map = {
    id: `mm_${key}`,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  ar.ud.moneyMaps[key] = map;
  saveData(db);
  res.json(map);
});

// ================= MEI-STYLE NLP DIAGNOSTIC ENGINE =================
// Analyzes user's relationship with themselves from field notes, rants, and checkins

app.post("/api/diagnose", requireAuth, async (req, res) => {
  const ar = req as AuthedRequest;
  const { entry_date, evening_notes, morning_intention, midday_checkin, chaos_score, user_profile } = req.body;

  const textToAnalyze = `
EVENING FIELD NOTES / RANT BOX:
"${evening_notes || "No notes recorded today."}"

MORNING INTENTION:
"${morning_intention || "None"}"

MIDDAY CHECK-IN:
"${midday_checkin || "None"}"

SELF-REPORTED CHAOS SCORE (1-10): ${chaos_score || 5}

USER CHAOS MANTRA & IDENTITY:
Name: ${user_profile?.chaos_name || ar.ud.user.chaos_name}
Word of Year: ${user_profile?.word_of_the_year || ar.ud.user.word_of_the_year}
What I'm done pretending about: ${user_profile?.what_done_pretending || ar.ud.user.what_done_pretending}
`;

  // Try calling Gemini API via @google/genai SDK — ONLY with the user's
  // explicit Google Gemini consent (X-AI-Consent: granted). Otherwise fall
  // through to the local heuristic engine below; declining never blocks this.
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && aiConsentGranted(req)) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are the core intelligence of the "Mei-Style Relationship-with-Self Personality Diagnostic Engine" inside the planner companion app "2027 Life OS: Off*Script (Chaos Year Edition)".

THE PHILOSOPHY & CORE SLOGAN:
The foundational operational slogan of this planner is "Boredom=Death". Monotony, numbness, mechanical compliance, and playing dead in a pre-scripted existence is the ultimate hazard.
You are modeled after the "Mei" messaging analytics framework, but instead of analyzing external contacts, you analyze the USER'S relationship with THEMSELVES through their written daily field notes, rants, and check-ins.
You assess the Big 5 (OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) across their sub-traits from freeform text.
You detect burnout, stress spikes, self-sabotage, and cognitive contradictions without requiring boring surveys.
Your persona is: DIRECT, WITTY, SASSY, GROUNDED, and UNAPOLOGETICALLY HONEST.
CRITICAL RULE: STRICTLY ZERO TOXIC POSITIVITY. No inspirational slogans, no "You've got this superstar!", no gaslighting calm. You act as an honest mirror calling out self-contradictions (e.g., claiming they don't care while ranting for pages; preaching rest while scheming more work).
Give a witty, candid "Honest Mirror" assessment and prescribe a concrete, slightly provocative Micro-Dare to break monotony.

Analyze the user's input below and return a JSON object matching this exact structure:
{
  "openness": number (0-100),
  "conscientiousness": number (0-100),
  "extraversion": number (0-100),
  "agreeableness": number (0-100),
  "neuroticism": number (0-100),
  "detected_mood": string (e.g. "Vigilantly Exhausted", "Feisty & Defiant", "Simmering Overthinker", etc.),
  "burnout_risk": "Low" | "Moderate" | "High" | "Critical",
  "self_sabotage_alert": string (specific behavior noticed from the text),
  "contradiction_callout": string (exact contradiction between what they intend/say and what they feel/do),
  "ai_feedback": string (2-3 punchy, sassy, perceptive paragraphs calling out their habits with loving sharpness),
  "micro_dare": string (one specific, doable, rebellious micro-adventure for tomorrow to disrupt autopilot),
  "sub_traits": [
    {"name": "Imagination", "dimension": "Openness", "score": number 0-100, "trait_description": string},
    {"name": "Intellect / Curiosity", "dimension": "Openness", "score": number 0-100, "trait_description": string},
    {"name": "Emotionality", "dimension": "Openness", "score": number 0-100, "trait_description": string},
    {"name": "Orderliness", "dimension": "Conscientiousness", "score": number 0-100, "trait_description": string},
    {"name": "Self-Discipline", "dimension": "Conscientiousness", "score": number 0-100, "trait_description": string},
    {"name": "Assertiveness", "dimension": "Extraversion", "score": number 0-100, "trait_description": string},
    {"name": "Cheerfulness", "dimension": "Extraversion", "score": number 0-100, "trait_description": string},
    {"name": "Morality / Honesty", "dimension": "Agreeableness", "score": number 0-100, "trait_description": string},
    {"name": "Trust", "dimension": "Agreeableness", "score": number 0-100, "trait_description": string},
    {"name": "Anxiety", "dimension": "Neuroticism", "score": number 0-100, "trait_description": string},
    {"name": "Vulnerability", "dimension": "Neuroticism", "score": number 0-100, "trait_description": string},
    {"name": "Self-Consciousness", "dimension": "Neuroticism", "score": number 0-100, "trait_description": string}
  ]
}

USER ENTRY DATA:
${textToAnalyze}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      const snapshot = {
        id: `snap_${Date.now()}`,
        entry_id: `entry_${entry_date || new Date().toISOString().split("T")[0]}`,
        snapshot_date: entry_date || new Date().toISOString().split("T")[0],
        openness: parsed.openness ?? 75,
        conscientiousness: parsed.conscientiousness ?? 60,
        extraversion: parsed.extraversion ?? 45,
        agreeableness: parsed.agreeableness ?? 55,
        neuroticism: parsed.neuroticism ?? 65,
        detected_mood: parsed.detected_mood || "Restless & Reflective",
        burnout_risk: parsed.burnout_risk || "Moderate",
        self_sabotage_alert: parsed.self_sabotage_alert || "Trying to optimize everything before allowing peace of mind.",
        contradiction_callout: parsed.contradiction_callout || "Desiring spontaneous freedom while agonizing over unfinished checkboxes.",
        ai_feedback: parsed.ai_feedback || "You're doing that thing again where you intellectualize your exhaustion instead of going to bed.",
        micro_dare: parsed.micro_dare || "Leave one high-stakes task completely untouched tomorrow until after 2 PM.",
        sub_traits: parsed.sub_traits || []
      };

      // Store snapshot in history
      ar.ud.personalitySnapshots.unshift(snapshot);
      if (ar.ud.personalitySnapshots.length > 50) ar.ud.personalitySnapshots.pop();
      saveData(db);

      return res.json(snapshot);
    } catch (err: any) {
      console.error("Gemini API error, falling back to local diagnostic engine:", err.message);
    }
  }

  // Fallback intelligent heuristic diagnostic engine
  const notes = (evening_notes || "").toLowerCase();
  const wordCount = notes.split(/\s+/).filter(Boolean).length;
  const hasBurnoutWords = /tired|exhaust|drain|fumes|overwhelm|can't|heavy|collapse|numb|burnout|anxious/i.test(notes);
  const hasDefianceWords = /refuse|no|done|stop|script|quit|hell|fake|pretend|furious|sick of/i.test(notes);
  const hasControlWords = /plan|schedule|todo|must|should|ought|fix|list|control|perfect/i.test(notes);

  const opennessVal = Math.min(95, Math.max(40, 65 + (wordCount > 50 ? 15 : 5) + (hasDefianceWords ? 10 : 0)));
  const conscientiousnessVal = Math.min(90, Math.max(30, hasControlWords ? 78 : 55));
  const neuroticismVal = Math.min(92, Math.max(25, hasBurnoutWords ? 76 : 48));
  const extraversionVal = Math.min(85, Math.max(20, wordCount > 80 ? 60 : 42));
  const agreeablenessVal = Math.min(80, Math.max(35, hasDefianceWords ? 42 : 64));

  const burnoutRisk = hasBurnoutWords ? (neuroticismVal > 70 ? "High" : "Moderate") : "Low";

  const fallbackSnapshot = {
    id: `snap_${Date.now()}`,
    entry_id: `entry_${entry_date || new Date().toISOString().split("T")[0]}`,
    snapshot_date: entry_date || new Date().toISOString().split("T")[0],
    openness: opennessVal,
    conscientiousness: conscientiousnessVal,
    extraversion: extraversionVal,
    agreeableness: agreeablenessVal,
    neuroticism: neuroticismVal,
    detected_mood: hasBurnoutWords ? "Running on Cognitive Overdrive" : hasDefianceWords ? "Feral & Unfiltered" : "Grounded & Analytical",
    burnout_risk: burnoutRisk,
    self_sabotage_alert: hasControlWords ? "Defaulting to hyper-vigilant scheduling when feeling emotionally depleted." : "Postponing physical comfort until arbitrary productivity quotas are met.",
    contradiction_callout: "You wrote that you want 'peace and less noise', but you just turned an unread notification into a 4-act internal drama.",
    ai_feedback: `Here is the honest mirror: You showed up to the page today carrying enough unspoken tension to power a small electric vehicle. Notice how whenever you claim you're 'totally fine', your notes read like an underground interrogation transcript?\n\nYou don't have to optimize every emotional fluctuation into a tidy life lesson. Some days were just full, or wordless, or messy. That isn't inconsistency—that is data. Now close the tabs in your head and stop negotiating with your exhaustion.`,
    micro_dare: "Tomorrow on your midday walk, take the wrong turn on purpose and do not check Google Maps for a full ten minutes.",
    sub_traits: [
      { name: "Imagination", dimension: "Openness", score: Math.min(95, opennessVal + 4), trait_description: "Vivid metaphor generation and speculative thinking." },
      { name: "Intellect / Reframe", dimension: "Openness", score: opennessVal, trait_description: "Ability to deconstruct assumptions." },
      { name: "Orderliness", dimension: "Conscientiousness", score: conscientiousnessVal, trait_description: "Tendency to demand predictability." },
      { name: "Self-Discipline", dimension: "Conscientiousness", score: Math.max(35, conscientiousnessVal - 10), trait_description: "Friction with repetitive tasks." },
      { name: "Assertiveness", dimension: "Extraversion", score: extraversionVal, trait_description: "Directness in boundary defense." },
      { name: "Cheerfulness", dimension: "Extraversion", score: 32, trait_description: "Low tolerance for performative pep talks." },
      { name: "Morality / Honesty", dimension: "Agreeableness", score: 85, trait_description: "Relentless hunger for authenticity over pleasantries." },
      { name: "Trust", dimension: "Agreeableness", score: agreeablenessVal, trait_description: "Healthy skepticism toward conventional wisdom." },
      { name: "Anxiety", dimension: "Neuroticism", score: neuroticismVal, trait_description: "Spikes when plans slip out of rigid alignment." },
      { name: "Vulnerability", dimension: "Neuroticism", score: Math.min(90, neuroticismVal + 2), trait_description: "Depth of emotional exposure on the page." }
    ]
  };

  ar.ud.personalitySnapshots.unshift(fallbackSnapshot);
  if (ar.ud.personalitySnapshots.length > 50) ar.ud.personalitySnapshots.pop();
  saveData(db);

  res.json(fallbackSnapshot);
});

// ================= AI STUDIO HUB (media generation — Gemini ONLY here) =================
// Strict scope: GEMINI_API_KEY is used exclusively by these /api/studio/*
// endpoints. Every other AI route in this server stays on Mei by bot ID.
// The client NEVER calls Google directly and never sees the key.
// REST shape mirrors the third-party AI Studio Hub (music / image create+edit /
// video + status/download / transcription), persisted to the JSON data file
// per user instead of Firestore.
//
// GOOGLE GEMINI CONSENT: every Gemini-backed endpoint below (and the
// /api/mei/media-intent handoff, and the /api/diagnose Gemini fallback)
// requires the client to send `X-AI-Consent: granted`. That header is only
// sent after the user explicitly accepts the in-app Google Gemini consent
// screen. Without it the call is refused and the client falls back to its
// non-Gemini behavior. Declining never blocks the app.

const AI_CONSENT_HEADER = 'x-ai-consent';

function aiConsentGranted(req: express.Request): boolean {
  return String(req.headers[AI_CONSENT_HEADER] || '').toLowerCase() === 'granted';
}

function requireAiConsent(res: express.Response) {
  return res.status(403).json({
    error: "Google Gemini needs your OK first — enable it in the app's AI Studio to use generation features.",
    code: 'AI_CONSENT_REQUIRED'
  });
}

const GEMINI_REST = "https://generativelanguage.googleapis.com/v1beta";
const STUDIO_JSON_LIMIT = "50mb"; // base64 audio/images exceed express's default 100kb
const studioJson = express.json({ limit: STUDIO_JSON_LIMIT });
const STUDIO_MEDIA_CAP = 30; // mirrors the source's Firestore fetch limit
const STUDIO_ITEM_MAX_BYTES = 8 * 1024 * 1024; // don't bloat the data file with giant blobs

function getStudioKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  return key && key.trim() ? key.trim() : null;
}

function studioNotConfigured(res: express.Response) {
  return res.status(503).json({
    error: "AI Studio isn't configured on this server yet — no GEMINI_API_KEY. The media studio stays tucked away until it's set up.",
    code: "STUDIO_NOT_CONFIGURED"
  });
}

/** Extract the first inlineData part from a generateContent REST response. */
function firstInlineData(resp: any): { mimeType: string; data: string } | null {
  const candidates = resp?.candidates || [];
  for (const c of candidates) {
    for (const part of c?.content?.parts || []) {
      if (part?.inlineData?.data) {
        return { mimeType: part.inlineData.mimeType || "", data: part.inlineData.data };
      }
    }
  }
  return null;
}

function stripDataUrlPrefix(dataUrl: string): string {
  return String(dataUrl || "").replace(/^data:[^;]+;base64,/, "");
}

async function geminiGenerateContent(key: string, model: string, body: any): Promise<any> {
  const r = await fetch(`${GEMINI_REST}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body)
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = json?.error?.message || `Google API error ${r.status}`;
    const err: any = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return json;
}

function studioMediaOf(ud: UserData): StudioMediaItem[] {
  if (!Array.isArray((ud as any).studioMedia)) (ud as any).studioMedia = [];
  return (ud as any).studioMedia as StudioMediaItem[];
}

function saveStudioItem(userId: string, ud: UserData, item: Omit<StudioMediaItem, "id" | "createdAt">): StudioMediaItem | null {
  // Keep the data file lean: skip persisting giant blobs, but still return the record.
  if ((item.resultUrl || "").length > STUDIO_ITEM_MAX_BYTES) return null;
  const list = studioMediaOf(ud);
  const record: StudioMediaItem = {
    ...item,
    id: `studio_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    createdAt: new Date().toISOString()
  };
  list.unshift(record);
  while (list.length > STUDIO_MEDIA_CAP) list.pop();
  saveData(db);
  return record;
}

app.get("/api/studio/status", requireAuth, (_req, res) => {
  res.json({ configured: Boolean(getStudioKey()) });
});

// ================= STUDIO JOB RUNNERS (internal) =================
// Shared by the /api/studio/* route handlers below and the Mei media-intent
// endpoint. Gemini stays media-only and server-side; the client never sees
// the key. Behavior matches the original inline implementations exactly.

async function runStudioMusicJob(
  key: string, userId: string, ud: UserData,
  opts: { prompt?: string; model?: string; imageBase64?: string }
): Promise<{ audioUrl: string | null; modelUsed: string; prompt?: string; text?: string }> {
  const { prompt, model = "lyria-3-clip-preview", imageBase64 } = opts;
  const selectedModel = model === "lyria-3-pro-preview" ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
  const parts: any[] = [
    { text: prompt || "A resonant ambient lo-fi soundscape for unhurried morning journaling, subtle analog synth textures and warm vinyl warmth." }
  ];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: stripDataUrlPrefix(imageBase64) } });
  }
  const resp = await geminiGenerateContent(key, selectedModel, { contents: { parts } });
  const inline = firstInlineData(resp);
  if (inline) {
    const audioUrl = `data:${inline.mimeType || "audio/mp3"};base64,${inline.data}`;
    saveStudioItem(userId, ud, { type: "music", prompt: String(prompt || ""), resultUrl: audioUrl, mimeType: inline.mimeType, model: selectedModel });
    return { audioUrl, modelUsed: selectedModel, prompt };
  }
  return { text: (resp as any).text || "Music composition generated.", modelUsed: selectedModel, prompt, audioUrl: null };
}

async function runStudioImageJob(
  key: string, userId: string, ud: UserData,
  opts: { prompt?: string; aspectRatio?: string }
): Promise<{ imageUrl: string; prompt?: string; model: string }> {
  const { prompt, aspectRatio = "1:1" } = opts;
  const resp = await geminiGenerateContent(key, "gemini-3.1-flash-image-preview", {
    contents: { parts: [{ text: String(prompt || "") }] },
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio }
    }
  });
  const inline = firstInlineData(resp);
  if (!inline) {
    const err: any = new Error("No image generated");
    err.status = 400;
    throw err;
  }
  const imageUrl = `data:${inline.mimeType || "image/png"};base64,${inline.data}`;
  saveStudioItem(userId, ud, { type: "image", prompt: String(prompt || ""), resultUrl: imageUrl, mimeType: inline.mimeType, aspectRatio: String(aspectRatio), model: "gemini-3.1-flash-image-preview" });
  return { imageUrl, prompt, model: "gemini-3.1-flash-image-preview" };
}

async function runStudioVideoJob(
  key: string, userId: string, ud: UserData,
  opts: { prompt?: string; imageBase64?: string; mimeType?: string; aspectRatio?: string }
): Promise<{ operationName: string; prompt?: string; aspectRatio: string }> {
  const { prompt, imageBase64, mimeType = "image/png", aspectRatio = "16:9" } = opts;
  const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";
  const instance: any = {
    prompt: prompt || "A cinematic atmospheric motion sequence of morning sunlight breaking through city fog"
  };
  if (imageBase64) {
    instance.image = { bytesBase64Encoded: stripDataUrlPrefix(imageBase64), mimeType };
  }
  const r = await fetch(`${GEMINI_REST}/models/veo-3.1-fast-generate-preview:predictLongRunning`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      instances: [instance],
      parameters: { sampleCount: 1, aspectRatio: validAspectRatio, resolution: "720p" }
    })
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json?.error?.message || `Video request failed (${r.status})`);
  if (!json?.name) throw new Error("Video request returned no operation name.");
  saveStudioItem(userId, ud, {
    type: "video",
    prompt: String(prompt || ""),
    resultUrl: "",
    aspectRatio: validAspectRatio,
    model: "veo-3.1-fast-generate-preview",
    operationName: json.name
  });
  return { operationName: json.name, prompt, aspectRatio: validAspectRatio };
}

/** Poll a Veo long-running operation until done or the timeout elapses. */
async function pollStudioVideoDone(key: string, operationName: string, timeoutMs = 90000, intervalMs = 8000): Promise<{ done: boolean; error?: any }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`${GEMINI_REST}/${operationName}`, { headers: { "x-goog-api-key": key } });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json?.error?.message || `Status check failed (${r.status})`);
    if (json.done) return { done: true, error: json.error || null };
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { done: false };
}

// ---- Music (Lyria 3) ----
app.post("/api/studio/music", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const ar = req as AuthedRequest;
  const { prompt, model, imageBase64 } = req.body || {};
  try {
    return res.json(await runStudioMusicJob(key, ar.userId, ar.ud, { prompt, model, imageBase64 }));
  } catch (err: any) {
    console.error("Studio music error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate music" });
  }
});

// ---- Image create ----
app.post("/api/studio/image", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const ar = req as AuthedRequest;
  const { prompt, aspectRatio } = req.body || {};
  try {
    return res.json(await runStudioImageJob(key, ar.userId, ar.ud, { prompt, aspectRatio }));
  } catch (err: any) {
    console.error("Studio image error:", err.message);
    res.status(err.status || 500).json({ error: err.message || "Failed to create image" });
  }
});

// ---- Image edit ----
app.post("/api/studio/image/edit", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const ar = req as AuthedRequest;
  const { imageBase64, prompt, mimeType = "image/png" } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required." });
  try {
    const resp = await geminiGenerateContent(key, "gemini-3.1-flash-image-preview", {
      contents: {
        parts: [
          { inlineData: { data: stripDataUrlPrefix(imageBase64), mimeType } },
          { text: String(prompt || "") }
        ]
      },
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });
    const inline = firstInlineData(resp);
    if (!inline) return res.status(400).json({ error: "No edited image generated", text: (resp as any).text });
    const imageUrl = `data:${inline.mimeType || "image/png"};base64,${inline.data}`;
    saveStudioItem(ar.userId, ar.ud, { type: "image", prompt: String(prompt || ""), resultUrl: imageUrl, mimeType: inline.mimeType, model: "gemini-3.1-flash-image-preview" });
    return res.json({ imageUrl, prompt, model: "gemini-3.1-flash-image-preview" });
  } catch (err: any) {
    console.error("Studio image-edit error:", err.message);
    res.status(500).json({ error: err.message || "Failed to edit image" });
  }
});

// ---- Video generate (Veo 3.1 fast, long-running operation) ----
app.post("/api/studio/video", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const ar = req as AuthedRequest;
  const { prompt, imageBase64, mimeType, aspectRatio } = req.body || {};
  try {
    return res.json(await runStudioVideoJob(key, ar.userId, ar.ud, { prompt, imageBase64, mimeType, aspectRatio }));
  } catch (err: any) {
    console.error("Studio video error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate video" });
  }
});

// ---- Video status ----
app.post("/api/studio/video/status", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const { operationName } = req.body || {};
  if (!operationName) return res.status(400).json({ error: "operationName is required." });
  try {
    const r = await fetch(`${GEMINI_REST}/${operationName}`, {
      headers: { "x-goog-api-key": key }
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json?.error?.message || `Status check failed (${r.status})`);
    return res.json({ done: Boolean(json.done), error: json.error || null });
  } catch (err: any) {
    console.error("Studio video-status error:", err.message);
    res.status(500).json({ error: err.message || "Failed to check video status" });
  }
});

// ---- Video download (proxies the signed Google file URI; key never reaches the client) ----
app.post("/api/studio/video/download", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const { operationName } = req.body || {};
  if (!operationName) return res.status(400).json({ error: "operationName is required." });
  try {
    const r = await fetch(`${GEMINI_REST}/${operationName}`, {
      headers: { "x-goog-api-key": key }
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json?.error?.message || `Status check failed (${r.status})`);
    const uri = json?.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) return res.status(404).json({ error: "Video not ready yet — still rendering.", code: "VIDEO_NOT_READY" });
    const videoRes = await fetch(uri, { headers: { "x-goog-api-key": key } });
    if (!videoRes.ok) throw new Error(`Video fetch failed (${videoRes.status})`);
    res.setHeader("Content-Type", "video/mp4");
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    return res.send(buffer);
  } catch (err: any) {
    console.error("Studio video-download error:", err.message);
    res.status(500).json({ error: err.message || "Failed to download video" });
  }
});

// ---- Transcription ----
app.post("/api/studio/transcribe", requireAuth, studioJson, async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  if (!key) return studioNotConfigured(res);
  const ar = req as AuthedRequest;
  const { audioBase64, mimeType = "audio/webm" } = req.body || {};
  if (!audioBase64) return res.status(400).json({ error: "audioBase64 is required." });
  try {
    const resp = await geminiGenerateContent(key, "gemini-3.5-transcribe", {
      contents: {
        parts: [
          { inlineData: { mimeType, data: stripDataUrlPrefix(audioBase64) } },
          { text: "Transcribe this audio verbatim. Capture the exact spoken words without commentary or summarization." }
        ]
      }
    });
    const text = resp?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    saveStudioItem(ar.userId, ar.ud, { type: "transcript", prompt: "", resultUrl: "", transcript: text, mimeType });
    return res.json({ transcription: text, transcript: text });
  } catch (err: any) {
    console.error("Studio transcribe error:", err.message);
    res.status(500).json({ error: err.message || "Transcription failed" });
  }
});

// ---- Saved studio library ----
app.get("/api/studio/media", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  res.json(studioMediaOf(ar.ud));
});

app.delete("/api/studio/media/:id", requireAuth, (req, res) => {
  const ar = req as AuthedRequest;
  const list = studioMediaOf(ar.ud);
  const idx = list.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found." });
  list.splice(idx, 1);
  saveData(db);
  res.json({ ok: true });
});

// ================= MEI ↔ STUDIO ORCHESTRATION =================
// Lets Mei hand off generative-media jobs to Gemini mid-conversation,
// server-side. Mei remains the conversational front-end (bot ID, no keys);
// Gemini stays media-only with GEMINI_API_KEY server-side.
//
// Intent detection is a simple keyword/pattern router — deliberately NOT a
// second AI call. Supported trigger phrases (matched case-insensitively):
//   MUSIC: "make me a hype track", "create a hype track", "compose a theme
//          song", "write me an anthem", "generate a beat", "hype me up",
//          "make music for ..."
//   IMAGE: "design a cover image for my vision board", "create cover art",
//          "generate an image of ...", "make me a poster", "draw/paint ..."
//   VIDEO: "generate a video for ...", "create a video of ...", "make a video"
// There is currently no Mei chat UI in this codebase (Mei surfaces are the
// diagnostic card, mantra generator, and /api/diagnose), so this endpoint is
// the wiring point: a future chat UI POSTs the user's utterance here and,
// when intent is found, delivers the returned media inside the conversation.
//   Request:  POST /api/mei/media-intent  { text: string }
//   Response: { intent: null }                                            → not a media ask; Mei answers normally
//             { intent: "music"|"image", status: "complete", ...media }     → finished media, deliver it
//             { intent: "video", status: "complete", ... }                  → video finished within the poll window
//             { intent: "video", status: "rendering", operationName }      → still rendering; poll /api/studio/video/status
//             503 { code: "STUDIO_NOT_CONFIGURED" }                        → key absent; Mei says the studio is backstage

type MediaIntent = "music" | "image" | "video" | null;

const MEDIA_INTENT_RULES: { intent: Exclude<MediaIntent, null>; patterns: RegExp[] }[] = [
  {
    intent: "music",
    patterns: [
      /\b(make|create|generate|compose|write|produce)\b[\s\S]{0,50}?\b(hype track|theme song|anthem|jingle)\b/i,
      /\b(make|create|generate|compose|produce)\b[\s\S]{0,50}?\b(song|track|beat)\b/i,
      /\bhype me up\b/i,
      /\bmusic for\b/i,
    ],
  },
  {
    intent: "image",
    patterns: [
      /\b(design|create|generate|make)\b[\s\S]{0,50}?\bcover (image|art)\b/i,
      /\b(design|create|generate|make|draw|paint)\b[\s\S]{0,50}?\b(image|picture|artwork|poster)\b/i,
      /\bvision board\b/i,
    ],
  },
  {
    intent: "video",
    patterns: [
      /\b(generate|create|make)\b[\s\S]{0,50}?\bvideo\b/i,
      /\bvideo for\b/i,
    ],
  },
];

function detectMediaIntent(text: string): MediaIntent {
  const t = String(text || "");
  if (!t.trim()) return null;
  for (const rule of MEDIA_INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(t))) return rule.intent;
  }
  return null;
}

app.post("/api/mei/media-intent", requireAuth, express.json(), async (req, res) => {
  if (!aiConsentGranted(req)) return requireAiConsent(res);
  const key = getStudioKey();
  const ar = req as AuthedRequest;
  const text = String(req.body?.text || "");
  const intent = detectMediaIntent(text);
  if (!intent) return res.json({ intent: null });
  if (!key) return studioNotConfigured(res);
  try {
    if (intent === "music") {
      const result = await runStudioMusicJob(key, ar.userId, ar.ud, { prompt: text });
      return res.json({ intent, status: "complete", ...result });
    }
    if (intent === "image") {
      const result = await runStudioImageJob(key, ar.userId, ar.ud, { prompt: text });
      return res.json({ intent, status: "complete", ...result });
    }
    // Video is long-running: start it, poll briefly, hand back either the
    // finished job or a rendering handle the chat UI can keep polling.
    const started = await runStudioVideoJob(key, ar.userId, ar.ud, { prompt: text });
    const polled = await pollStudioVideoDone(key, started.operationName);
    if (polled.done && !polled.error) {
      return res.json({ intent, status: "complete", ...started });
    }
    if (polled.error) throw new Error(polled.error?.message || "Video render failed");
    return res.json({ intent, status: "rendering", ...started });
  } catch (err: any) {
    console.error("Mei media-intent error:", err.message);
    res.status(err.status || 500).json({ error: err.message || "Media job failed" });
  }
});

// Vite middleware in development & static serve in production
async function setupViteAndListen() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`2027 Life OS Server running on port ${PORT}`);
  });
}

setupViteAndListen();
