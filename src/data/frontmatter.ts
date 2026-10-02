/**
 * Front Matter static copy for the Off*Script 2027 Chaos Year Edition
 * (planner pages 01-14, ported into the app as interactive sections).
 *
 * Brand: "Off*Script" (always with asterisk), slogan "Boredom=Death".
 */

export type FrontMatterSectionId =
  | 'manifesto'
  | 'tour_guide'
  | 'manual'
  | 'word'
  | 'vision'
  | 'values'
  | 'audit'
  | 'permission'
  | 'people';

export const FRONT_MATTER_TABS: { id: FrontMatterSectionId; label: string }[] = [
  { id: 'manifesto', label: '01 Manifesto' },
  { id: 'tour_guide', label: 'Tour Guide' },
  { id: 'manual', label: '02 Manual' },
  { id: 'word', label: '03 One Word' },
  { id: 'vision', label: '04 Vision Dump' },
  { id: 'values', label: '05 Values' },
  { id: 'audit', label: '06 Life Audit' },
  { id: 'permission', label: '09 Permission' },
  { id: 'people', label: '10 My People' }
];

// ---------- One Word reflections ----------

export interface WordReflections {
  why: string;
  unlocks: string;
  protects: string;
  soundAt2am: string;
}

export const EMPTY_WORD_REFLECTIONS: WordReflections = {
  why: '',
  unlocks: '',
  protects: '',
  soundAt2am: ''
};

// ---------- Vision Dump ----------

export interface VisionDumpSection {
  id: string;
  title: string;
  prompt: string;
}

export const VISION_DUMP_AREAS: VisionDumpSection[] = [
  { id: 'career_income', title: 'Career + Income', prompt: 'Write what you WANT to feel, look, and earn without editing or filtering.' },
  { id: 'relationships', title: 'Relationships', prompt: 'Who do you want beside you? What does real intimacy look like?' },
  { id: 'health_body', title: 'Health + Body', prompt: 'How do you want your body to feel? Energy, sleep, movement.' },
  { id: 'home_space', title: 'Home + Space', prompt: 'Your environment, your sanctuary, what holds you at peace.' },
  { id: 'creativity', title: 'Creativity', prompt: 'What wild ideas want to come out when you stop optimizing?' },
  { id: 'finances', title: 'Finances', prompt: 'Numbers without shame. What does sovereignty look like?' },
  { id: 'learning', title: 'Learning', prompt: 'What curiosity rabbit holes are you claiming without asking permission?' },
  { id: 'fun_rest', title: 'Fun + Rest', prompt: 'What brings you alive purely for the sake of delight?' }
];

// ---------- Core values (bound to UserProfile.core_values) ----------

export interface CoreValueMeta {
  key: 'autonomy' | 'honesty' | 'creativity' | 'presence' | 'resilience' | 'playfulness' | 'rest' | 'discipline';
  label: string;
  description: string;
}

export const CORE_VALUE_META: CoreValueMeta[] = [
  { key: 'autonomy', label: 'Autonomy', description: 'My life, my calls. No committee votes on my choices.' },
  { key: 'honesty', label: 'Honesty', description: 'Uncurated truth, even when it stings a little.' },
  { key: 'creativity', label: 'Creativity', description: 'Making things that did not exist before I touched them.' },
  { key: 'presence', label: 'Presence', description: 'Actually here for the moments instead of narrating them.' },
  { key: 'resilience', label: 'Resilience', description: 'Bending without snapping, then getting back up loud.' },
  { key: 'playfulness', label: 'Playfulness', description: 'Useless, beautiful joy with no productivity goal attached.' },
  { key: 'rest', label: 'Rest', description: 'Recovery is not a reward — it is the operating system.' },
  { key: 'discipline', label: 'Discipline', description: 'Keeping promises to myself, especially the boring ones.' }
];

// ---------- Life Audit ----------

export interface LifeAuditArea {
  id: string;
  name: string;
  description: string;
}

export const LIFE_AUDIT_AREAS: LifeAuditArea[] = [
  { id: 'career', name: 'Career + Purpose', description: 'What you build and what moves the needle' },
  { id: 'money', name: 'Money + Finances', description: 'Information first, judgment never' },
  { id: 'health', name: 'Health + Energy', description: 'Fuel in the tank vs running on fumes' },
  { id: 'relationships', name: 'Relationships', description: 'The humans who actually matter' },
  { id: 'home', name: 'Home + Environment', description: 'Spaces that support your becoming' },
  { id: 'creativity', name: 'Creativity + Play', description: 'Useless, beautiful joy with no goal' },
  { id: 'growth', name: 'Personal Growth', description: 'Quiet, invisible roots taking hold' },
  { id: 'mental_health', name: 'Mental Health + Rest', description: 'Armor off, truth in, deep breath' }
];

export interface LifeAuditData {
  scores: Record<string, number>;
  lowestShift: string;
  highestProtection: string;
}

export function defaultAuditScores(): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const area of LIFE_AUDIT_AREAS) scores[area.id] = 5;
  return scores;
}

// ---------- Operating Manual ----------

export interface ManualStep {
  num: string;
  title: string;
  text: string;
}

export const MANUAL_STEPS: ManualStep[] = [
  { num: '01', title: 'START WITH FRONT MATTER', text: "These pages are your foundation. Don't skip them. Don't rush them. A half-answer is still an answer." },
  { num: '02', title: 'FILL IN YOUR BIG 6 GOALS', text: 'Six goals. That\'s it. Not 22 wishes on a vision board. Six things you are actually moving toward.' },
  { num: '03', title: 'MAP YOUR QUARTERS', text: 'Each quarter is its own chapter. Your Q3 might look nothing like Q1. That\'s not failure. That\'s data.' },
  { num: '04', title: 'USE THE DAILY SPREAD', text: 'Brain dump, prioritize, build your day. Structured chaos — use every section or none of them.' },
  { num: '05', title: 'REVIEW + RESET', text: 'Monthly and weekly debriefs are non-negotiable. Growth lives in the reflecting, not just the doing.' },
  { num: '06', title: 'BREAK THE FORMAT', text: 'Cross things out. Write sideways. Skip pages. This planner works because you make it YOURS.' }
];

// ---------- Permission Slip ----------

export const PERMISSION_STATEMENTS: string[] = [
  'You have permission to change your goals mid-year.',
  'You have permission to rest without earning it first.',
  'You have permission to skip a week and come back.',
  'You have permission to redefine what success means.',
  'You have permission to stop chasing things that don\'t fit.',
  'You have permission to be messy and still moving forward.'
];

export interface PermissionSlipData {
  sig: string;
  date: string;
  committed: boolean;
}

// ---------- My People / Address Book ----------

export type ContactCategory = 'Inner Circle' | 'Creative Ally' | 'Grounding Anchor' | 'Co-Conspirator';

export const CONTACT_CATEGORIES: ContactCategory[] = [
  'Inner Circle',
  'Creative Ally',
  'Grounding Anchor',
  'Co-Conspirator'
];

export interface AddressBookContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: ContactCategory;
  notes?: string;
}
