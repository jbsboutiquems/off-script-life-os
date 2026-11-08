import React, { useEffect, useState } from 'react';
import {
  bestPerPlayer, clearGameScores, formatScore, getGameScores, roundsOf,
  SCORES_UPDATED_EVENT, type ScoreEntry,
} from './gameScores';
import { CURRENCY_ICON, CURRENCY_NAME, coinsForRound, getCoinBalance, onCoinsUpdated } from './gameCurrency';

/**
 * Scoreboard (Amber, 2026-11-07) — one per game, community and solo.
 * Shows the latest round's standings, the best score per player, and
 * recent history. Scores live in localStorage (solo playtest, no server
 * sync yet) and refresh live when a round is recorded.
 */

export function useGameScores(game: string): ScoreEntry[] {
  const [entries, setEntries] = useState<ScoreEntry[]>(() => getGameScores(game));
  useEffect(() => {
    const refresh = () => setEntries(getGameScores(game));
    window.addEventListener(SCORES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SCORES_UPDATED_EVENT, refresh);
  }, [game]);
  return entries;
}

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
};

const MEDALS = ['🥇', '🥈', '🥉'];

export const Scoreboard: React.FC<{ game: string }> = ({ game }) => {
  const entries = useGameScores(game);
  const [cleared, setCleared] = useState(false);
  const [balance, setBalance] = useState(() => getCoinBalance());
  useEffect(() => onCoinsUpdated(() => setBalance(getCoinBalance())), []);

  if (entries.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-stone-200 dark:border-white/10 p-3">
        <p className="text-sm font-bold">🏆 {game} scoreboard</p>
        <p className="text-xs text-stone-500 mt-1">No scores yet — play a round and the scoreboard fills in here. Scores stay in this browser.</p>
      </div>
    );
  }

  const rounds = roundsOf(game, entries);
  const latest = rounds[0];
  const best = bestPerPlayer(game, entries);
  const isSolo = latest.length === 1;
  const earnedLastRound = coinsForRound(game, latest);

  return (
    <div className="mt-3 rounded-2xl border border-stone-200 dark:border-white/10 p-3">
      <p className="text-sm font-bold">🏆 {game} scoreboard</p>
      <p className="text-xs text-stone-500 mt-1">
        {CURRENCY_ICON} You earned {earnedLastRound} {CURRENCY_NAME} last round · Balance: {balance} {CURRENCY_NAME}
      </p>
      <div className="mt-2">
        <p className="text-xs font-black uppercase tracking-wider text-stone-500">
          {isSolo ? 'Last play' : 'Last round'} · {fmtDate(latest[0].date)}
        </p>
        <ul className="text-sm mt-1 space-y-1">
          {latest.map((e, i) => (
            <li key={`${e.roundId}-${e.player}`}>
              {!isSolo && <span>{MEDALS[i] ?? `${i + 1}. `} </span>}
              <strong>{e.player}</strong> — {formatScore(game, e.score, e.detail)}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <p className="text-xs font-black uppercase tracking-wider text-stone-500">Best ever</p>
        <ul className="text-sm mt-1 space-y-1">
          {best.map((e) => (
            <li key={e.player}>
              <strong>{e.player}</strong> — {formatScore(game, e.score, e.detail)}
              <span className="text-xs text-stone-500"> ({fmtDate(e.date)})</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500 mt-1">{rounds.length} round{rounds.length === 1 ? '' : 's'} played · saved in this browser</p>
      </div>
      {rounds.length > 1 && (
        <div className="mt-2">
          <p className="text-xs font-black uppercase tracking-wider text-stone-500">Recent rounds</p>
          <ul className="text-xs text-stone-500 mt-1 space-y-1">
            {rounds.slice(1, 5).map((round) => (
              <li key={round[0].roundId}>
                {fmtDate(round[0].date)} — {round.map((e) => `${e.player} ${formatScore(game, e.score, e.detail)}`).join(' · ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => { clearGameScores(game); setCleared(true); }}
        className="mt-2 text-xs font-bold underline text-stone-500"
      >
        {cleared ? 'Scores cleared' : 'Clear scores for this game'}
      </button>
    </div>
  );
};

/** One-line best score for the game picker cards. */
export const BestScoreLine: React.FC<{ game: string }> = ({ game }) => {
  const entries = useGameScores(game);
  if (entries.length === 0) return null;
  const best = bestPerPlayer(game, entries);
  const yours = best.find((e) => e.player === 'You') ?? best[0];
  return (
    <span className="block text-xs font-bold mt-2 text-emerald-700 dark:text-emerald-400">
      🏆 Best: {formatScore(game, yours.score, yours.detail)} · {roundsOf(game, entries).length} played
    </span>
  );
};
