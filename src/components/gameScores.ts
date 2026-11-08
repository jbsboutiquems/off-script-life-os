/**
 * Game scoreboards (Amber, 2026-11-07) — every game, community and solo,
 * tracks and displays scores. Stored in localStorage for now: the world is
 * a solo playtest with no server sync yet. One key, one entry per player
 * per round, grouped by roundId (all entries from one round share it).
 */

export interface GameResult {
  player: string;
  score: number;
  detail?: string;
}

export interface ScoreEntry extends GameResult {
  roundId: number;
  date: string; // ISO timestamp of the round
}

const KEY = 'torque-world-scores-v1';
const MAX_PER_GAME = 100;

export const SCORES_UPDATED_EVENT = 'torque-world-scores-updated';

export function getGameScores(game: string): ScoreEntry[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, ScoreEntry[]>;
    return Array.isArray(all[game]) ? all[game] : [];
  } catch {
    return [];
  }
}

/** Record one round: one entry per player, all sharing a roundId. */
export function recordGameResult(game: string, results: GameResult[]): void {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, ScoreEntry[]>;
    const roundId = Date.now();
    const date = new Date().toISOString();
    const entries: ScoreEntry[] = results.map((r) => ({ ...r, roundId, date }));
    all[game] = [...(all[game] ?? []), ...entries].slice(-MAX_PER_GAME);
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(SCORES_UPDATED_EVENT));
  } catch {
    /* solo playtest — a failed write just means no scoreboard this round */
  }
}

export function clearGameScores(game: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, ScoreEntry[]>;
    delete all[game];
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(SCORES_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

// Per-game scoring rules: lower is better for timed / fewest-moves games.
export const SCORE_CONFIG: Record<string, { lowerIsBetter: boolean; format: (score: number, detail?: string) => string }> = {
  'Word Search Sprint': { lowerIsBetter: false, format: (s, d) => d ?? `${s} words` },
  'Khaos Connections': { lowerIsBetter: false, format: (s, d) => d ?? `${s} groups` },
  'Daily Dare Dash': { lowerIsBetter: true, format: (s, d) => d ?? `${s}s` },
  'Familiar Trivia': { lowerIsBetter: false, format: (s, d) => d ?? `${s}/3` },
  'Commons Charades': { lowerIsBetter: false, format: (s, d) => d ?? `${s}/3` },
  'Word Search': { lowerIsBetter: false, format: (s, d) => d ?? `${s} words` },
  Sudoku: { lowerIsBetter: true, format: (s, d) => d ?? `${s}s` },
  'Memory Match': { lowerIsBetter: true, format: (s, d) => d ?? `${s} moves` },
  'Word Scramble': { lowerIsBetter: false, format: (s, d) => d ?? `${s}/5` },
};

export function formatScore(game: string, score: number, detail?: string): string {
  const cfg = SCORE_CONFIG[game];
  return cfg ? cfg.format(score, detail) : detail ?? String(score);
}

/** Best entry per player, best first (higher wins unless lowerIsBetter). */
export function bestPerPlayer(game: string, entries: ScoreEntry[]): ScoreEntry[] {
  const cfg = SCORE_CONFIG[game];
  const lower = cfg?.lowerIsBetter ?? false;
  const best = new Map<string, ScoreEntry>();
  for (const e of entries) {
    const cur = best.get(e.player);
    if (!cur || (lower ? e.score < cur.score : e.score > cur.score)) best.set(e.player, e);
  }
  return [...best.values()].sort((a, b) => (lower ? a.score - b.score : b.score - a.score));
}

/** Group entries into rounds (newest round first), each round ranked. */
export function roundsOf(game: string, entries: ScoreEntry[]): ScoreEntry[][] {
  const cfg = SCORE_CONFIG[game];
  const lower = cfg?.lowerIsBetter ?? false;
  const byId = new Map<number, ScoreEntry[]>();
  for (const e of entries) {
    const list = byId.get(e.roundId) ?? [];
    list.push(e);
    byId.set(e.roundId, list);
  }
  return [...byId.values()]
    .sort((a, b) => b[0].roundId - a[0].roundId)
    .map((round) => [...round].sort((a, b) => (lower ? a.score - b.score : b.score - a.score)));
}
