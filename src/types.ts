/**
 * Core Data Types for 2027 Life OS: Off*Script (Khaos Year Edition)
 * & The Mei-Style Personality Diagnostic Engine
 */

export interface BuddyProfile {
  creatureId: string;
  name: string;
  color: string;
  /** Device-upload portrait as a dataURL. Only set when creatureId === 'custom'. */
  customImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  khaos_name: string;
  word_of_the_year: string;
  slogan?: string;
  /** True when the server lists this account in ADMIN_USERNAMES. */
  is_admin?: boolean;
  khaos_mantra: string;
  what_done_pretending: string;
  what_ready_to_admit: string;
  relationship_with_khaos: string;
  permission_granted: string;
  /** Birthday in YYYY-MM-DD form. Powers the Cosmic Corner horoscope + natal chart. */
  birthday?: string;
  /** Optional birth time in HH:MM form. Needed for the (for-fun) rising sign. */
  birth_time?: string;
  /** Optional free-text birthplace. Shown on the natal chart wheel. */
  birthplace?: string;
  /** Daily horoscope voice: 'nice' (warm) or 'rude' (spicy tough-love). Defaults to 'nice'. */
  horoscope_tone?: 'nice' | 'rude';
  /** Email from email/OAuth signup. Present on the /api/auth/me response. */
  email?: string | null;
  emailVerified?: boolean;
  /** First-run onboarding tour completed (or dismissed forever). */
  onboarding_seen?: boolean;
  /** Reminder: daily flight-log nudge. */
  reminder_daily_enabled?: boolean;
  /** Reminder: daily nudge time, "HH:MM" 24h. */
  reminder_daily_time?: string;
  /** Reminder: weekly debrief nudge. */
  reminder_weekly_enabled?: boolean;
  /** Reminder: weekly nudge day, 0 = Sunday … 6 = Saturday. */
  reminder_weekly_day?: number;
  /** Reminder: weekly nudge time, "HH:MM" 24h. */
  reminder_weekly_time?: string;
  created_at: string;
  /** The user's AI buddy animal — the visual face of Mei. */
  buddy?: BuddyProfile;
  core_values: {
    autonomy: number;
    honesty: number;
    creativity: number;
    presence: number;
    resilience: number;
    playfulness: number;
    rest: number;
    discipline: number;
  };
}

export interface ContentPack {
  pack_id: string;
  title: string;
  assets_url: string;
}

export interface UserEntitlement {
  user_id: string;
  pack_id: string;
  unlocked_at: string;
  expires_at: string | null;
  expired: boolean;
  days_left: number | null;
}

export interface ExpansionProduct {
  product_id: string;
  title: string;
  blurb: string;
  price: number;
  days: number;
  kind: "theme" | "holiday" | "zodiac" | "wedding";
  owned: boolean;
  expired: boolean;
  expires_at: string | null;
  days_left: number | null;
  link_url?: string;
  link_label?: string;
}

export interface TokenRedemptionResult {
  success: boolean;
  packId?: string;
  title?: string;
  error?: string;
}

export interface AuthResult {
  token: string;
  user: UserProfile;
  /** Plaintext recovery code — returned exactly once at registration and after each rotation. */
  recoveryCode?: string;
}

export interface Goal {
  id: string;
  title: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  why_statement: string;
  success_metric: string;
  first_step: string;
  is_completed: boolean;
  created_at: string;
}

export interface AntiGoal {
  id: string;
  title: string;
  category?: 'Boundary' | 'Time Theft' | 'Energy Drain' | 'People Pleasing' | 'Perfectionism';
  why_stopped?: string;
  is_completed: boolean; // Strikethrough effect when true
  created_at: string;
}

export interface DailyEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  morning_intention: string; // "Today I am choosing..."
  today_i_am: string; // Short stance/phrase
  anchor_question_answer: string;
  priorities: [string, string, string]; // Top 3 priorities strictly
  midday_checkin: string; // How it's actually going right now
  micro_dare_completed: boolean;
  micro_dare_notes?: string;
  evening_notes: string; // Field Notes & Rant Box (Inputs to Mei Engine)
  khaos_score: number; // 1-10
  holiday_title?: string;
  holiday_adventure?: string;
  updated_at: string;
}

export interface SubTrait {
  name: string; // e.g., "Imagination", "Intellect", "Orderliness", "Assertiveness"
  dimension: 'Openness' | 'Conscientiousness' | 'Extraversion' | 'Agreeableness' | 'Neuroticism';
  score: number; // 0-100
  trait_description: string;
}

export interface PersonalitySnapshot {
  id: string;
  entry_id: string;
  snapshot_date: string;
  openness: number; // 0-100
  conscientiousness: number; // 0-100
  extraversion: number; // 0-100
  agreeableness: number; // 0-100
  neuroticism: number; // 0-100
  detected_mood: string;
  sub_traits: SubTrait[];
  burnout_risk: 'Low' | 'Moderate' | 'High' | 'Critical';
  self_sabotage_alert: string;
  contradiction_callout: string;
  ai_feedback: string; // The direct, witty, sassy "Honest Mirror" feedback
  micro_dare: string; // Recommended antidote dare for the next cycle
}

/** Per-contact relationship-with-others analysis (Mei's interpersonal half). */
export type RelationshipType = 'romantic' | 'friendly' | 'professional' | 'family';

export interface InterpersonalInsight {
  partnerId: string;
  partnerUsername: string;
  relationship_type: RelationshipType;
  confidence: 'low' | 'medium' | 'high';
  message_count: number;
  days_active: number;
  /** 0-100 — % of conversations initiated by the user (50 = balanced). */
  initiation_balance: number;
  /** 0-100 */
  warmth: number;
  /** 0-100 */
  tension: number;
  avg_reply_hours_you: number | null;
  avg_reply_hours_them: number | null;
  /** 1-2 punchy sentences of insight. */
  insight: string;
  analyzed_at: string;
}

export interface WeeklyFlightDebrief {
  id: string;
  week_number: number; // 1-52
  date_range: string;
  khaos_level: number; // 1-10
  q1_script_disapproval: string;
  q2_honest_moment: string;
  q3_useful_surprise: string;
  q4_refusal_to_perform: string;
  q5_one_word: string;
  q6_more_oxygen: string;
  q7_less_attention: string;
  q8_next_move: string;
  updated_at: string;
}

export interface MoneyExpense {
  id: string;
  name: string;
  amount: number;
  due_date?: string;
  paid: boolean;
}

export interface VariableSpendingItem {
  id: string;
  category: 'Food + Groceries' | 'Eating Out + Coffee' | 'Gas + Transport' | 'Health + Wellness' | 'Entertainment + Fun' | 'Khaos & Spontaneous';
  amount: number;
  note: string;
}

export interface MonthlyMoneyMap {
  id: string;
  month: number; // 1-12
  year: number; // 2027
  income_sources: { id: string; source: string; amount: number }[];
  fixed_expenses: MoneyExpense[];
  variable_logs: VariableSpendingItem[];
  one_surprise: string;
  one_pattern: string;
  financial_commitment: string;
  no_shame_recap: string;
  updated_at: string;
}

export interface KhaosHoliday {
  dateKey: string; // MM-DD
  month: number;
  day: number;
  title: string;
  tagline: string;
  /** Plain-language explainer: what this holiday is, what it means, and what it asks of you. */
  meaning: string;
  whoIsThisSoul: string[];
  adventures: string[];
  anchorQuestion: string;
}

export type KhaosPointAction =
  | 'daily_log'
  | 'micro_dare'
  | 'weekly_debrief'
  | 'antigoal_quashed'
  | 'goal_completed'
  | 'diagnostic_run'
  | 'share_fired';

export interface KhaosPointEntry {
  id: string;
  action: KhaosPointAction;
  points: number;
  /** Dedupe key, e.g. "daily_log:2027-03-14" or "antigoal_quashed:antigoal_123". */
  ref: string;
  label: string;
  awarded_at: string;
}

export const KHAOS_POINT_VALUES: Record<KhaosPointAction, number> = {
  daily_log: 10,
  micro_dare: 15,
  weekly_debrief: 25,
  antigoal_quashed: 30,
  goal_completed: 50,
  diagnostic_run: 5,
  share_fired: 5,
};

export interface FlightCrewContact {
  id: string;
  name: string;
  role: string; // e.g. "Co-conspirator", "Emergency contact", "Accountability gremlin"
  notes: string;
  created_at: string;
}

export interface FaqQuestion {
  id: string;
  question: string;
  asker_id: string;
  asker_name: string;
  answer: string | null;
  answered_by: string | null;
  created_at: string;
  answered_at: string | null;
}
