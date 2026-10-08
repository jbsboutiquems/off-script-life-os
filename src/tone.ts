import type { DailyEntry } from './types';

/**
 * Client-side tone profiler. Reads the user's locally stored entries and
 * distills a compact voice profile so Mei (the AI buddy) can mirror the
 * user's own personality tone. Everything runs on-device; only the compact
 * profile object is attached to outgoing Mei requests as `buddy_voice`.
 */

/** Compact voice profile attached to Mei requests as `buddy_voice`. */
export interface VoiceProfile {
  /** Schema version so the server can evolve parsing safely. */
  v: 1;
  /** Entries analyzed. */
  entries: number;
  /** Total words analyzed. */
  words: number;
  /** Mean words per sentence. */
  avgSentenceLen: number;
  /** Emojis per 100 words. */
  emojiPer100: number;
  /** Exclamation marks per 100 words. */
  exclaimPer100: number;
  /** Question marks per 100 words. */
  questionPer100: number;
  /** Share of ALL-CAPS words (0–1). */
  capsRatio: number;
  /** 0–1: warm/affectionate language. */
  warmth: number;
  /** 0–1: blunt, imperative, boundary-setting language. */
  directness: number;
  /** 0–1: laughter, absurdity, playful markers. */
  playfulness: number;
  /** Overall cadence bucket. */
  verbosity: 'terse' | 'balanced' | 'expansive';
  /** Most-used emojis (max 5). */
  topEmojis: string[];
}

const EMOJI_RE = /(\p{Extended_Pictographic}|\u2764\uFE0F?|[\u2600-\u27BF])/gu;
const WARM_WORDS = /\b(love|loved|lovely|grateful|thank|thanks|cozy|gentle|kind|sweet|soft|tender|hug|proud|joy|beautiful|amazing)\b/i;
const DIRECT_WORDS = /\b(nope|no\.|stop|enough|done|never|won't|refuse|boundar|say no|hell no|absolutely not|do it|just do|go)\b/i;
const PLAYFUL_WORDS = /\b(lol|lmao|rofl|haha|hehe|oops|khaos|feral|unhinged|absurd|ridiculous|silly|goofy|😂|🤣|💀|✨|🔥)\b/i;

function countRe(re: RegExp, text: string): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

/** Pull entry text from every locally cached entry, any user namespace. */
function readLocalEntries(): string[] {
  const texts: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !/:entry_\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      try {
        const e = JSON.parse(localStorage.getItem(key) || 'null') as Partial<DailyEntry> | null;
        if (!e) continue;
        const parts = [
          e.morning_intention, e.today_i_am, e.anchor_question_answer,
          ...(Array.isArray(e.priorities) ? e.priorities : []),
          e.midday_checkin, e.micro_dare_notes, e.evening_notes,
        ].filter(Boolean) as string[];
        if (parts.length) texts.push(parts.join('\n'));
      } catch { /* skip bad rows */ }
    }
  } catch { /* storage unavailable */ }
  return texts;
}

/** Build the voice profile from the user's local entries. Pure function. */
export function buildVoiceProfile(entryTexts: string[]): VoiceProfile | null {
  const text = entryTexts.join('\n').trim();
  if (!text) return null;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 20) return null; // not enough signal yet

  const sentences = text.split(/[.!?…]+/).filter(s => s.trim().length > 0);
  const emojiMatches = text.match(EMOJI_RE) || [];
  const emojiCounts = new Map<string, number>();
  emojiMatches.forEach(e => emojiCounts.set(e, (emojiCounts.get(e) || 0) + 1));
  const topEmojis = [...emojiCounts.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e]) => e);

  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
  const warmHits = countRe(new RegExp(WARM_WORDS.source, 'gi'), text);
  const directHits = countRe(new RegExp(DIRECT_WORDS.source, 'gi'), text);
  const playfulHits = countRe(new RegExp(PLAYFUL_WORDS.source, 'gi'), text);

  const per100 = (n: number) => Math.round((n / wordCount) * 1000) / 10;
  const clamp01 = (n: number) => Math.max(0, Math.min(1, Math.round(n * 100) / 100));

  const avgSentenceLen = sentences.length ? wordCount / sentences.length : wordCount;
  const verbosity: VoiceProfile['verbosity'] =
    avgSentenceLen < 8 ? 'terse' : avgSentenceLen > 18 ? 'expansive' : 'balanced';

  return {
    v: 1,
    entries: entryTexts.length,
    words: wordCount,
    avgSentenceLen: Math.round(avgSentenceLen * 10) / 10,
    emojiPer100: per100(emojiMatches.length),
    exclaimPer100: per100(countRe(/!/g, text)),
    questionPer100: per100(countRe(/\?/g, text)),
    capsRatio: clamp01(capsWords / wordCount),
    warmth: clamp01(warmHits / (wordCount / 60)),
    directness: clamp01(directHits / (wordCount / 60)),
    playfulness: clamp01(playfulHits / (wordCount / 60)),
    verbosity,
    topEmojis,
  };
}

/** Refresh the profile from whatever entries are cached locally right now. */
export function getVoiceProfile(): VoiceProfile | null {
  try {
    return buildVoiceProfile(readLocalEntries());
  } catch {
    return null;
  }
}
