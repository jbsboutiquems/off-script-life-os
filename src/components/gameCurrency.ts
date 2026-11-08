import { recordGameResult, type GameResult } from './gameScores';

/**
 * In-game currency (Amber, 2026-11-07) — earning + balance only.
 * No shop, no spending yet: what currency buys is Amber's call and hasn't
 * been decided. The currency name ("coins") is a neutral placeholder.
 *
 * Earning loop: play a game → finish a round → earn coins → balance grows.
 * Every finished round pays a small participation amount (5 coins) plus a
 * performance bonus based on the player's score. Stored in localStorage
 * (solo playtest, no server sync yet), same as the scoreboards.
 */

export const CURRENCY_NAME = 'coins';
export const CURRENCY_ICON = '🪙';

const KEY = 'torque-world-coins-v1';
const COINS_UPDATED_EVENT = 'torque-world-coins-updated';
const PARTICIPATION_COINS = 5;

/** Per-point bonus for score-based games (score = the player's own score). */
const PER_POINT: Record<string, number> = {
  'Word Search Sprint': 10, // per word found (max 5 → 50)
  'Khaos Connections': 15, // per group found (max 4 → 60)
  'Familiar Trivia': 15, // per correct answer (max 3 → 45)
  'Commons Charades': 15, // per correct guess (max 3 → 45)
  'Word Search': 10, // per word found (max 5 → 50)
  'Word Scramble': 10, // per word unscrambled (max 5 → 50)
};

/** Flat finish bonus for games where the score is a time / move count. */
const FINISH_BONUS: Record<string, number> = {
  'Daily Dare Dash': 30, // + rank bonus below
  Sudoku: 40,
  'Memory Match': 30, // + 10 if solved in 12 moves or fewer
};

export function getCoinBalance(): number {
  try {
    return Number(localStorage.getItem(KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function setBalance(next: number): void {
  try {
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new Event(COINS_UPDATED_EVENT));
  } catch {
    /* solo playtest — a failed write just means no coins this round */
  }
}

/**
 * Coins earned for one finished round, from the player's result.
 * `results` is the full round (you + bots for community games).
 */
export function coinsForRound(game: string, results: GameResult[]): number {
  const you = results.find((r) => r.player === 'You');
  if (!you) return 0;
  let earned = PARTICIPATION_COINS;

  if (game === 'Daily Dare Dash') {
    // Fastest time wins: rank bonus on top of the finish bonus.
    earned += FINISH_BONUS[game] ?? 0;
    const ranked = [...results].sort((a, b) => a.score - b.score);
    const rank = ranked.findIndex((r) => r.player === 'You');
    if (rank === 0) earned += 20;
    else if (rank === 1) earned += 10;
  } else if (game === 'Memory Match') {
    earned += FINISH_BONUS[game] ?? 0;
    if (you.score <= 12) earned += 10; // few-moves bonus
  } else if (game in FINISH_BONUS) {
    earned += FINISH_BONUS[game];
  } else if (game in PER_POINT) {
    earned += PER_POINT[game] * you.score;
  }
  return earned;
}

/**
 * Record a finished round on the scoreboard AND award its coins.
 * Returns the coins earned, so the UI can show "+X coins".
 * Call exactly once per round (the games' onFinish callbacks are guarded).
 */
export function recordRoundAndAward(game: string, results: GameResult[]): number {
  recordGameResult(game, results);
  const earned = coinsForRound(game, results);
  if (earned > 0) setBalance(getCoinBalance() + earned);
  return earned;
}

export function onCoinsUpdated(listener: () => void): () => void {
  window.addEventListener(COINS_UPDATED_EVENT, listener);
  return () => window.removeEventListener(COINS_UPDATED_EVENT, listener);
}
