import { UserProfile, Goal, AntiGoal, DailyEntry, PersonalitySnapshot, WeeklyFlightDebrief, MonthlyMoneyMap, TokenRedemptionResult, UserEntitlement, ChaosPointEntry, ChaosPointAction, CHAOS_POINT_VALUES, FlightCrewContact, AuthResult } from '../types';
import { DueReminder } from '../lib/reminders';
import { aiConsentHeaders } from './aiConsent';

// ================= Auth + session =================

const TOKEN_KEY = 'lifeos:auth:token';
let cachedUserId: string | null = null;
let authFailureHandler: (() => void) | null = null;

export class AuthError extends Error {
  code = 'AUTH';
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
  cachedUserId = null;
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  cachedUserId = null;
}

// Per-user namespaced localStorage keys, so offline fallbacks never leak one
// account's data into another's on a shared browser.
function ns(key: string): string {
  return `lifeos:${cachedUserId || 'anon'}:${key}`;
}

function lsGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(ns(key));
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, val: unknown) {
  try {
    localStorage.setItem(ns(key), JSON.stringify(val));
  } catch {
    // ignore
  }
}

// Authenticated request helper. Throws AuthError on 401 (session gone) and a
// TypeError on network failure, matching the offline-fallback convention below.
async function req(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new TypeError('network unreachable');
  }
  if (res.status === 401) {
    clearToken();
    if (authFailureHandler) authFailureHandler();
    const body = await res.json().catch(() => ({} as any));
    throw new AuthError(body.error || 'Session expired. Please log in again.');
  }
  return res;
}

function blankProfile(id: string): UserProfile {
  return {
    id,
    chaos_name: '',
    word_of_the_year: '',
    chaos_mantra: '',
    what_done_pretending: '',
    what_ready_to_admit: '',
    relationship_with_chaos: '',
    permission_granted: '',
    birthday: '',
    birth_time: '',
    birthplace: '',
    created_at: new Date().toISOString(),
    core_values: {
      autonomy: 5,
      honesty: 5,
      creativity: 5,
      presence: 5,
      resilience: 5,
      playfulness: 5,
      rest: 5,
      discipline: 5
    }
  };
}

const defaultAntiGoals: AntiGoal[] = [
  {
    id: "antigoal_01",
    title: "Apologizing before asking a straightforward question in team chats",
    category: "People Pleasing",
    why_stopped: "Shrinking myself to make normal communication feel like an inconvenience.",
    is_completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: "antigoal_02",
    title: "Saying 'yes' on the spot to non-urgent commitments without sleeping on it",
    category: "Boundary",
    why_stopped: "Immediate compliance is fear masquerading as helpfulness.",
    is_completed: true,
    created_at: new Date().toISOString()
  },
  {
    id: "antigoal_03",
    title: "Checking work notifications and email before getting out of bed",
    category: "Time Theft",
    why_stopped: "Hands over the keys of my nervous system to strangers before sunrise.",
    is_completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: "antigoal_04",
    title: "Polishing drafts for hours when 80% clarity was reached 3 hours ago",
    category: "Perfectionism",
    why_stopped: "Procrastination dressed in bespoke calligraphy.",
    is_completed: false,
    created_at: new Date().toISOString()
  }
];

export const api = {
  // ---- Auth ----
  getToken,
  setToken,
  clearToken,

  onAuthFailure(handler: (() => void) | null) {
    authFailureHandler = handler;
  },

  async register(username: string, password: string): Promise<AuthResult> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const err = new Error(body.error || 'Registration failed.') as any;
      err.suggestions = body.suggestions;
      throw err;
    }
    setToken(body.token);
    cachedUserId = body.user?.id || null;
    return body as AuthResult;
  },

  async login(username: string, password: string): Promise<AuthResult> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Login failed.');
    setToken(body.token);
    cachedUserId = body.user?.id || null;
    return body as AuthResult;
  },

  async logout(): Promise<void> {
    // Raw fetch on purpose: the central req() helper fires the auth-failure
    // handler on 401, which would call logout() again — infinite recursion.
    try {
      const token = getToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch {
      // ignore — clearing the local token is what matters
    }
    clearToken();
  },

  async recoverAccount(username: string, recoveryCode: string, newPassword: string): Promise<{ success: boolean; recoveryCode: string }> {
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, recoveryCode, newPassword })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Recovery failed.');
    return body;
  },

  async rotateRecoveryCode(): Promise<{ recoveryCode: string }> {
    const res = await req('/api/auth/recovery-code/rotate', { method: 'POST' });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Could not mint a new code.');
    return body;
  },

  // ---- Expanded auth: OAuth / email / usernames ----

  async getAuthConfig(): Promise<{ google: boolean; facebook: boolean; email: boolean; smtp: boolean }> {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) return await res.json();
    } catch { /* ignore */ }
    return { google: false, facebook: false, email: true, smtp: false };
  },

  async emailRegister(email: string, username: string, password: string): Promise<AuthResult & { emailVerified: boolean; verificationEmailed: boolean }> {
    const res = await fetch('/api/auth/email/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const err = new Error(body.error || 'Email registration failed.') as any;
      err.suggestions = body.suggestions;
      throw err;
    }
    setToken(body.token);
    cachedUserId = body.user?.id || null;
    return body;
  },

  async emailLogin(email: string, password: string): Promise<AuthResult> {
    const res = await fetch('/api/auth/email/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Login failed.');
    setToken(body.token);
    cachedUserId = body.user?.id || null;
    return body;
  },

  async resendVerification(): Promise<void> {
    const res = await req('/api/auth/email/resend-verification', { method: 'POST' });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Could not resend the verification email.');
  },

  async forgotByEmail(email: string): Promise<{ fallback?: string; message?: string; sent?: boolean }> {
    const res = await fetch('/api/auth/email/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json().catch(() => ({} as any));
  },

  async completeOAuthSignup(pendingKey: string, username: string): Promise<AuthResult> {
    const res = await fetch('/api/auth/oauth/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingKey, username })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const err = new Error(body.error || 'Signup failed.') as any;
      err.suggestions = body.suggestions;
      throw err;
    }
    setToken(body.token);
    cachedUserId = body.user?.id || null;
    return body;
  },

  async changeUsername(username: string): Promise<{ username: string; chaosName: string }> {
    const res = await req('/api/auth/username', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const err = new Error(body.error || 'Could not change username.') as any;
      err.suggestions = body.suggestions;
      throw err;
    }
    return body;
  },

  // ---- Reminders ----

  async getDueReminders(): Promise<{ due: DueReminder[] }> {
    const res = await req('/api/reminders/due');
    if (!res.ok) throw new Error('Could not load reminders.');
    return res.json();
  },

  // ---- The Chaos Wall ----

  async getWallPosts(): Promise<{ id: string; userId: string; username: string; text: string; created_at: string }[]> {
    const res = await req('/api/wall');
    if (!res.ok) throw new Error('Could not load the wall.');
    return res.json();
  },

  async postToWall(text: string): Promise<{ id: string; userId: string; username: string; text: string; created_at: string }> {
    const res = await req('/api/wall', { method: 'POST', body: JSON.stringify({ text }) });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Could not post.');
    return body;
  },

  async deleteWallPost(id: string): Promise<void> {
    const res = await req(`/api/wall/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Could not delete that post.');
  },

  // ---- Inbox (DMs) ----

  async getUserDirectory(): Promise<{ id: string; username: string }[]> {
    const res = await req('/api/users/directory');
    if (!res.ok) throw new Error('Could not load the directory.');
    return res.json();
  },

  async getInboxThreads(): Promise<{ partnerId: string; partnerUsername: string; lastText: string; lastAt: string; lastFromMe: boolean; unread: number }[]> {
    const res = await req('/api/inbox/threads');
    if (!res.ok) throw new Error('Could not load threads.');
    return res.json();
  },

  async getThread(partnerId: string): Promise<{ partner: { id: string; username: string }; messages: { id: string; fromId: string; fromUsername: string; text: string; created_at: string }[] }> {
    const res = await req(`/api/inbox/threads/${partnerId}`);
    if (!res.ok) throw new Error('Could not load that thread.');
    return res.json();
  },

  async sendDm(toId: string, text: string): Promise<{ id: string; fromId: string; fromUsername: string; text: string; created_at: string }> {
    const res = await req('/api/inbox/messages', { method: 'POST', body: JSON.stringify({ toId, text }) });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Could not send that.');
    return body;
  },

  async deleteDm(id: string): Promise<void> {
    const res = await req(`/api/inbox/messages/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Could not delete that message.');
  },

  async getMe(): Promise<UserProfile> {
    const res = await req('/api/auth/me');
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body.error || 'Could not load your profile.');
    }
    const user = (await res.json()) as UserProfile;
    cachedUserId = user.id || cachedUserId;
    return user;
  },

  // ---- Content packs / entitlements ----
  async getEntitlements(): Promise<UserEntitlement[]> {
    try {
      const res = await req('/api/entitlements');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API unavailable, reading local entitlements', e);
    }
    return lsGet<UserEntitlement[]>('entitlements') || [];
  },

  async redeemToken(tokenId: string): Promise<TokenRedemptionResult> {
    const normalizedToken = tokenId.trim().toUpperCase();
    try {
      const res = await req('/api/redeem-token', {
        method: 'POST',
        body: JSON.stringify({ tokenId: normalizedToken })
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error || 'Unable to redeem this QR code.' };
      const current = await this.getEntitlements().catch(() => [] as UserEntitlement[]);
      // Don't stack a duplicate local entitlement if this pack is already unlocked.
      if (!current.some(e => e.pack_id === result.packId)) {
        const entitlement: UserEntitlement = {
          user_id: cachedUserId || '',
          pack_id: result.packId,
          unlocked_at: new Date().toISOString()
        };
        lsSet('entitlements', [...current, entitlement]);
      }
      return result;
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API unavailable, attempting local token redemption', e);
    }

    const redeemedTokens = lsGet<Record<string, string>>('redeemed_tokens') || {};
    if (redeemedTokens[normalizedToken]) {
      return { success: false, error: 'This QR code has already been claimed.' };
    }
    if (normalizedToken !== 'PACK-DEMO-2027') {
      return { success: false, error: 'Invalid QR code.' };
    }
    redeemedTokens[normalizedToken] = cachedUserId || '';
    lsSet('redeemed_tokens', redeemedTokens);
    const current = await this.getEntitlements().catch(() => [] as UserEntitlement[]);
    if (!current.some(e => e.pack_id === 'planner_2027_core')) {
      const entitlement: UserEntitlement = {
        user_id: cachedUserId || '',
        pack_id: 'planner_2027_core',
        unlocked_at: new Date().toISOString()
      };
      lsSet('entitlements', [...current, entitlement]);
    }
    return { success: true, packId: 'planner_2027_core', title: 'Off*Script 2027 Core Planner' };
  },

  // ---- Profile ----
  async getUser(): Promise<UserProfile> {
    try {
      const res = await req('/api/user');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API unavailable, reading local user', e);
    }
    return lsGet<UserProfile>('user') || blankProfile(cachedUserId || 'local');
  },

  async updateUser(user: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await req('/api/user', {
        method: 'POST',
        body: JSON.stringify(user)
      });
      if (res.ok) {
        const updated = await res.json();
        lsSet('user', updated);
        return updated;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, saving local user', e);
    }
    const current = await this.getUser().catch(() => blankProfile(cachedUserId || 'local'));
    const updated = { ...current, ...user, updated_at: new Date().toISOString() };
    lsSet('user', updated);
    return updated;
  },

  // ---- Goals ----
  async getGoals(): Promise<Goal[]> {
    try {
      const res = await req('/api/goals');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local goals', e);
    }
    return lsGet<Goal[]>('goals') || [];
  },

  async createGoal(goalData: Omit<Goal, 'id' | 'created_at' | 'is_completed'>): Promise<Goal> {
    try {
      const res = await req('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData)
      });
      if (res.ok) return await res.json();
      // Server validation errors (e.g. the six-goal maximum) surface directly —
      // they must not be masked by the offline local fallback below.
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body.error || `Server rejected goal (${res.status})`);
    } catch (e) {
      if (e instanceof AuthError) throw e;
      if (!(e instanceof TypeError)) throw e;
      console.warn('API unreachable, saving local goal', e);
      const goals = await this.getGoals().catch(() => [] as Goal[]);
      if (goals.length >= 6) {
        throw new Error("Strict maximum of 6 goals allowed in the Big 6 Os!");
      }
      const newGoal: Goal = {
        ...goalData,
        id: `goal_${Date.now()}`,
        is_completed: false,
        created_at: new Date().toISOString()
      };
      const updated = [...goals, newGoal];
      lsSet('goals', updated);
      return newGoal;
    }
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const res = await req(`/api/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body.error || `Server rejected goal update (${res.status})`);
    } catch (e) {
      if (e instanceof AuthError) throw e;
      if (!(e instanceof TypeError)) throw e;
      console.warn('API unreachable, updating local goal', e);
    }
    const goals = await this.getGoals();
    const found = goals.find(g => g.id === id);
    if (!found) throw new Error("Goal not found");
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    lsSet('goals', updated);
    return updated.find(g => g.id === id) as Goal;
  },

  async deleteGoal(id: string): Promise<void> {
    try {
      await req(`/api/goals/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, deleting local goal', e);
    }
    const goals = await this.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    lsSet('goals', filtered);
  },

  // ---- Anti-goals ----
  async getAntiGoals(): Promise<AntiGoal[]> {
    try {
      const res = await req('/api/anti-goals');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local anti-goals', e);
    }
    return lsGet<AntiGoal[]>('antigoals') || defaultAntiGoals;
  },

  async createAntiGoal(antiGoalData: Omit<AntiGoal, 'id' | 'created_at' | 'is_completed'> & { is_completed?: boolean }): Promise<AntiGoal> {
    try {
      const res = await req('/api/anti-goals', {
        method: 'POST',
        body: JSON.stringify(antiGoalData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, saving local anti-goal', e);
    }
    const antiGoals = await this.getAntiGoals();
    const newAntiGoal: AntiGoal = {
      ...antiGoalData,
      id: `antigoal_${Date.now()}`,
      is_completed: Boolean(antiGoalData.is_completed),
      created_at: new Date().toISOString()
    };
    const updated = [...antiGoals, newAntiGoal];
    lsSet('antigoals', updated);
    return newAntiGoal;
  },

  async updateAntiGoal(id: string, updates: Partial<AntiGoal>): Promise<AntiGoal> {
    try {
      const res = await req(`/api/anti-goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, updating local anti-goal', e);
    }
    const antiGoals = await this.getAntiGoals();
    const updated = antiGoals.map(ag => ag.id === id ? { ...ag, ...updates } : ag);
    lsSet('antigoals', updated);
    return updated.find(ag => ag.id === id)!;
  },

  async deleteAntiGoal(id: string): Promise<void> {
    try {
      await req(`/api/anti-goals/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, deleting local anti-goal', e);
    }
    const antiGoals = await this.getAntiGoals();
    const filtered = antiGoals.filter(ag => ag.id !== id);
    lsSet('antigoals', filtered);
  },

  // ---- Daily entries ----
  async getAllDailyEntries(): Promise<DailyEntry[]> {
    try {
      const res = await req('/api/entries');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading all entries', e);
    }
    return lsGet<DailyEntry[]>('entries_all') || [];
  },

  async getDailyEntry(dateStr: string): Promise<DailyEntry | null> {
    try {
      const res = await req(`/api/entries/${dateStr}`);
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local entry', e);
    }
    return lsGet<DailyEntry>(`entry_${dateStr}`);
  },

  async saveDailyEntry(entry: Partial<DailyEntry> & { entry_date: string }): Promise<DailyEntry> {
    try {
      const res = await req('/api/entries', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
      if (res.ok) {
        const saved = await res.json();
        lsSet(`entry_${entry.entry_date}`, saved);
        return saved;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, saving local entry', e);
    }
    const existing = (await this.getDailyEntry(entry.entry_date).catch(() => null)) || {
      id: `entry_${entry.entry_date}`,
      entry_date: entry.entry_date,
      morning_intention: '',
      today_i_am: '',
      anchor_question_answer: '',
      priorities: ['', '', ''],
      midday_checkin: '',
      micro_dare_completed: false,
      evening_notes: '',
      chaos_score: 5,
      updated_at: new Date().toISOString()
    };
    const saved = { ...existing, ...entry, updated_at: new Date().toISOString() };
    lsSet(`entry_${entry.entry_date}`, saved);
    return saved as DailyEntry;
  },

  // ---- Mei diagnostic ----
  async runMeiDiagnostic(params: {
    entry_date: string;
    evening_notes: string;
    morning_intention?: string;
    midday_checkin?: string;
    chaos_score?: number;
    user_profile?: UserProfile;
  }): Promise<PersonalitySnapshot> {
    try {
      // The server only runs its Gemini fallback when this header says the
      // user consented; without it, diagnose falls back to the local engine.
      const res = await req('/api/diagnose', {
        method: 'POST',
        headers: aiConsentHeaders(),
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const snapshot = await res.json();
        const existingSnapshots = await this.getSnapshots().catch(() => [] as PersonalitySnapshot[]);
        lsSet('snapshots', [snapshot, ...existingSnapshots.slice(0, 49)]);
        return snapshot;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error during diagnostic, using local engine fallback', e);
    }

    // Local client-side fallback
    const notes = (params.evening_notes || '').toLowerCase();
    const wordCount = notes.split(/\s+/).filter(Boolean).length;
    const hasBurnout = /tired|exhaust|drain|fumes|overwhelm|can't|heavy|collapse|numb|burnout|anxious/i.test(notes);
    const hasDefiance = /refuse|no|done|stop|script|quit|hell|fake|pretend|furious/i.test(notes);

    const snapshot: PersonalitySnapshot = {
      id: `snap_${Date.now()}`,
      entry_id: `entry_${params.entry_date}`,
      snapshot_date: params.entry_date,
      openness: Math.min(95, 65 + (wordCount > 30 ? 15 : 5) + (hasDefiance ? 10 : 0)),
      conscientiousness: 64,
      extraversion: 48,
      agreeableness: hasDefiance ? 45 : 62,
      neuroticism: hasBurnout ? 78 : 55,
      detected_mood: hasBurnout ? "Running on Low Battery & Defiance" : "Sharp, Observant & Grounded",
      burnout_risk: hasBurnout ? "High" : "Low",
      self_sabotage_alert: "Rationalizing overwork as 'necessary discipline' instead of acknowledging mental fatigue.",
      contradiction_callout: "You wrote that you're done pretending, yet you spent all afternoon editing your thoughts before letting them breathe.",
      ai_feedback: "Here is your honest mirror: You showed up with plenty of energy to criticize yourself, but zero willingness to just let the day be messy. You don't have to turn every mundane hour into a breakthrough. Take the armor off. It's safe.",
      micro_dare: "Tomorrow, write with your non-dominant hand for 3 minutes and refuse to apologize for being clumsy.",
      sub_traits: [
        { name: "Imagination", dimension: "Openness", score: 86, trait_description: "Rich internal narrative" },
        { name: "Intellect", dimension: "Openness", score: 80, trait_description: "Appetite for re-framing mental premises" },
        { name: "Self-Discipline", dimension: "Conscientiousness", score: 60, trait_description: "Grit amidst fatigue" },
        { name: "Assertiveness", dimension: "Extraversion", score: 55, trait_description: "Direct boundary awareness" },
        { name: "Honesty", dimension: "Agreeableness", score: 88, trait_description: "Uncurated truth-seeking" },
        { name: "Anxiety", dimension: "Neuroticism", score: hasBurnout ? 78 : 54, trait_description: "Tension between control and freedom" }
      ]
    };

    const existingSnapshots = await this.getSnapshots().catch(() => [] as PersonalitySnapshot[]);
    lsSet('snapshots', [snapshot, ...existingSnapshots.slice(0, 49)]);
    return snapshot;
  },

  async getSnapshots(): Promise<PersonalitySnapshot[]> {
    try {
      const res = await req('/api/snapshots');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local snapshots', e);
    }
    return lsGet<PersonalitySnapshot[]>('snapshots') || [];
  },

  // ---- Weekly debriefs ----
  async getWeeklyDebrief(weekNum: number): Promise<WeeklyFlightDebrief | null> {
    try {
      const res = await req('/api/flight-debriefs');
      if (res.ok) {
        const list = await res.json();
        const found = list.find((d: any) => d.week_number === weekNum);
        if (found) return found;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local debrief', e);
    }
    return lsGet<WeeklyFlightDebrief>(`debrief_${weekNum}`);
  },

  async saveWeeklyDebrief(debrief: WeeklyFlightDebrief): Promise<WeeklyFlightDebrief> {
    try {
      const res = await req('/api/flight-debriefs', {
        method: 'POST',
        body: JSON.stringify(debrief)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, saving local debrief', e);
    }
    lsSet(`debrief_${debrief.week_number}`, debrief);
    return debrief;
  },

  // ---- Money maps ----
  async getMoneyMap(year: number, month: number): Promise<MonthlyMoneyMap | null> {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    try {
      const res = await req(`/api/money-maps/${key}`);
      if (res.ok) {
        const data = await res.json();
        if (data) return data;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local money map', e);
    }
    return lsGet<MonthlyMoneyMap>(`moneymap_${key}`);
  },

  async getAllMoneyMaps(): Promise<MonthlyMoneyMap[]> {
    try {
      const res = await req('/api/money-maps/all');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading money maps', e);
    }
    return [];
  },

  async getAllDebriefs(): Promise<WeeklyFlightDebrief[]> {
    try {
      const res = await req('/api/flight-debriefs');
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading debriefs', e);
    }
    return [];
  },

  async saveMoneyMap(map: MonthlyMoneyMap): Promise<MonthlyMoneyMap> {
    const key = `${map.year}-${String(map.month).padStart(2, '0')}`;
    try {
      const res = await req('/api/money-maps', {
        method: 'POST',
        body: JSON.stringify(map)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, saving local money map', e);
    }
    lsSet(`moneymap_${key}`, map);
    return map;
  },

  // ---- Chaos Points ----
  async getPoints(): Promise<ChaosPointEntry[]> {
    try {
      const res = await req('/api/points');
      if (res.ok) {
        const list = await res.json();
        lsSet('points', list);
        return list;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local points', e);
    }
    return lsGet<ChaosPointEntry[]>('points') || [];
  },

  getPointsTotal(points: ChaosPointEntry[]): number {
    return points.reduce((s, p) => s + p.points, 0);
  },

  async awardPoints(action: ChaosPointAction, ref: string, label?: string): Promise<{ entry: ChaosPointEntry; total: number; duplicate: boolean }> {
    const points = CHAOS_POINT_VALUES[action];
    try {
      const res = await req('/api/points/award', {
        method: 'POST',
        body: JSON.stringify({ action, ref, label: label || action })
      });
      if (res.ok) {
        const result = await res.json();
        await this.getPoints().catch(() => []);
        return result;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, awarding local points', e);
    }
    // Local fallback with the same dedupe rule
    const list = await this.getPoints().catch(() => [] as ChaosPointEntry[]);
    const existing = list.find(p => p.ref === ref && p.action === action);
    if (existing) {
      return { entry: existing, total: this.getPointsTotal(list), duplicate: true };
    }
    const entry: ChaosPointEntry = {
      id: `pts_${Date.now()}`,
      action,
      points,
      ref,
      label: label || action,
      awarded_at: new Date().toISOString()
    };
    const updated = [entry, ...list];
    lsSet('points', updated);
    return { entry, total: this.getPointsTotal(updated), duplicate: false };
  },

  // ---- Flight Crew contacts ----
  async getFlightCrew(): Promise<FlightCrewContact[]> {
    try {
      const res = await req('/api/flight-crew');
      if (res.ok) {
        const list = await res.json();
        lsSet('flightcrew', list);
        return list;
      }
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, reading local flight crew', e);
    }
    return lsGet<FlightCrewContact[]>('flightcrew') || [];
  },

  async createFlightCrewContact(data: Omit<FlightCrewContact, 'id' | 'created_at'>): Promise<FlightCrewContact> {
    try {
      const res = await req('/api/flight-crew', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, saving local contact', e);
    }
    const list = await this.getFlightCrew().catch(() => [] as FlightCrewContact[]);
    const contact: FlightCrewContact = { ...data, id: `crew_${Date.now()}`, created_at: new Date().toISOString() };
    const updated = [...list, contact];
    lsSet('flightcrew', updated);
    return contact;
  },

  async updateFlightCrewContact(id: string, updates: Partial<FlightCrewContact>): Promise<FlightCrewContact> {
    try {
      const res = await req(`/api/flight-crew/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, updating local contact', e);
    }
    const list = await this.getFlightCrew().catch(() => [] as FlightCrewContact[]);
    const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
    lsSet('flightcrew', updated);
    return updated.find(c => c.id === id)!;
  },

  async deleteFlightCrewContact(id: string): Promise<void> {
    try {
      await req(`/api/flight-crew/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (e instanceof AuthError) throw e;
      console.warn('API error, deleting local contact', e);
    }
    const list = await this.getFlightCrew().catch(() => [] as FlightCrewContact[]);
    lsSet('flightcrew', list.filter(c => c.id !== id));
  }
};
