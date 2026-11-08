import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WordSearchGame, mulberry32, shuffle } from './WorldGames';
import { BestScoreLine, Scoreboard } from './Scoreboard';
import { recordRoundAndAward } from './gameCurrency';

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * On-demand single-player games (Amber, 2026-11-07) — separate from the
 * 5-minute community rotation. Playable solo, anytime, whenever the player
 * wants. No bots, no timer pressure (except where the game itself needs
 * one). All state is local; nothing is synced.
 *
 * Games: Word Search, Sudoku, Memory Match, Word Scramble.
 */

const SOLO_LIST = [
  { id: 'wordsearch', name: 'Word Search', blurb: 'Find the hidden words in the grid. No timer — take your time.', emoji: '🔍' },
  { id: 'sudoku', name: 'Sudoku', blurb: 'Fill the grid so every row, column, and 3×3 box has 1–9.', emoji: '🔢' },
  { id: 'memory', name: 'Memory Match', blurb: 'Flip the cards and match the pairs. Fewest moves wins.', emoji: '🃏' },
  { id: 'scramble', name: 'Word Scramble', blurb: 'Unscramble the world words, five rounds. Tap the letters in order.', emoji: '🔤' },
];

// ---------------------------------------------------------------------------
// Sudoku — two verified easy puzzles with solutions.
// ---------------------------------------------------------------------------

const SUDOKU_PUZZLES: { puzzle: number[][]; solution: number[][] }[] = [
  {
    puzzle: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  {
    puzzle: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9],
    ],
  },
];

const SudokuGame: React.FC = () => {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const { puzzle, solution } = SUDOKU_PUZZLES[puzzleIdx];
  const [cells, setCells] = useState<number[][]>(() => puzzle.map((r) => [...r]));
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  // Timer + scoreboard: the clock starts on the first entry and stops on
  // solve — fastest solve wins (lower is better).
  const [startAt, setStartAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recordedRef = useRef(false);
  useEffect(() => {
    if (startAt === null || solved) return;
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - startAt) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [startAt, solved]);
  useEffect(() => {
    if (solved && !recordedRef.current) {
      recordedRef.current = true;
      const seconds = startAt ? Math.floor((Date.now() - startAt) / 1000) : 0;
      recordRoundAndAward('Sudoku', [{ player: 'You', score: seconds, detail: `Puzzle ${puzzleIdx + 1} · ${fmtClock(seconds)}` }]);
    }
  }, [solved, startAt, puzzleIdx]);

  const newPuzzle = (idx: number) => {
    setPuzzleIdx(idx);
    setCells(SUDOKU_PUZZLES[idx].puzzle.map((r) => [...r]));
    setSel(null);
    setWrong(new Set());
    setSolved(false);
    setStartAt(null);
    setElapsed(0);
    recordedRef.current = false;
  };

  const setValue = (n: number) => {
    if (!sel || solved) return;
    if (startAt === null) setStartAt(Date.now());
    const { r, c } = sel;
    if (puzzle[r][c] !== 0) return;
    const next = cells.map((row) => [...row]);
    next[r][c] = n;
    setCells(next);
    const w = new Set(wrong);
    if (n === 0 || n === solution[r][c]) w.delete(`${r},${c}`);
    else w.add(`${r},${c}`);
    setWrong(w);
    if (next.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) setSolved(true);
  };

  const checkAll = () => {
    const w = new Set<string>();
    cells.forEach((row, r) => row.forEach((v, c) => {
      if (v !== 0 && v !== solution[r][c]) w.add(`${r},${c}`);
    }));
    setWrong(w);
  };

  return (
    <div>
      <p className="text-sm mt-2">⏱ {fmtClock(elapsed)}{solved ? ' — solved!' : ''}</p>
      <div className="grid grid-cols-9 gap-0 mt-2 border-2 border-stone-400 dark:border-white/30 rounded-lg overflow-hidden max-w-md mx-auto">
        {cells.map((row, r) => row.map((v, c) => {
          const given = puzzle[r][c] !== 0;
          const isSel = sel?.r === r && sel?.c === c;
          const isWrong = wrong.has(`${r},${c}`);
          return (
            <button
              key={`${r},${c}`}
              onClick={() => { if (!given && !solved) setSel({ r, c }); }}
              className={`aspect-square text-base sm:text-lg font-bold flex items-center justify-center border border-stone-300 dark:border-white/10 ${c % 3 === 2 && c < 8 ? 'border-r-2 border-r-stone-500 dark:border-r-white/40' : ''} ${r % 3 === 2 && r < 8 ? 'border-b-2 border-b-stone-500 dark:border-b-white/40' : ''} ${given ? 'text-stone-900 dark:text-white' : 'text-rose-600 dark:text-amber-400'} ${isSel ? 'bg-amber-300 dark:bg-amber-500/50' : ''} ${isWrong ? 'bg-rose-200 dark:bg-rose-900/50' : ''}`}
            >
              {v === 0 ? '' : v}
            </button>
          );
        }))}
      </div>
      <p className="text-xs text-stone-500 mt-2">Tap a blank square, then tap a number below. Red squares are wrong — tap Check to find them.</p>
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => setValue(n)} className="w-9 h-9 rounded-lg bg-stone-200 dark:bg-white/10 font-black">{n}</button>
        ))}
        <button onClick={() => setValue(0)} className="px-3 h-9 rounded-lg bg-stone-200 dark:bg-white/10 font-bold text-xs">⌫ Erase</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={checkAll} className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">Check</button>
        <button onClick={() => newPuzzle((puzzleIdx + 1) % SUDOKU_PUZZLES.length)} className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">New puzzle</button>
      </div>
      {solved && <p className="font-black text-emerald-600 mt-2">🎉 Solved in {fmtClock(elapsed)}! Nice and steady wins it.</p>}
      <Scoreboard game="Sudoku" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Memory Match — 12 cards, 6 pairs. Fewest moves wins.
// ---------------------------------------------------------------------------

const MEMORY_EMOJI = ['🌿', '🎲', '📜', '🐾', '🗼', '⚓'];

const MemoryGame: React.FC = () => {
  const [deckKey, setDeckKey] = useState(0);
  const deck = useMemo(() => shuffle([...MEMORY_EMOJI, ...MEMORY_EMOJI], mulberry32(Date.now() % 2147483647 + deckKey)), [deckKey]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const won = matched.size === deck.length;

  // Scoreboard + coins: fewest moves wins (lower is better).
  const recordedRef = useRef(false);
  useEffect(() => {
    if (won && !recordedRef.current) {
      recordedRef.current = true;
      recordRoundAndAward('Memory Match', [{ player: 'You', score: moves, detail: `${moves} moves` }]);
    }
  }, [won, moves]);

  const flip = (i: number) => {
    if (lock || won || flipped.includes(i) || matched.has(i)) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      if (deck[next[0]] === deck[next[1]]) {
        setMatched((m) => new Set([...m, next[0], next[1]]));
        setFlipped([]);
      } else {
        setLock(true);
        window.setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 700);
      }
    }
  };

  const restart = () => {
    setDeckKey((k) => k + 1);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
    recordedRef.current = false;
  };

  return (
    <div>
      <p className="text-sm mt-2">Moves: <strong>{moves}</strong> · Matched: <strong>{matched.size / 2} / 6</strong></p>
      <div className="grid grid-cols-4 gap-2 mt-2 max-w-md">
        {deck.map((emoji, i) => {
          const faceUp = flipped.includes(i) || matched.has(i);
          return (
            <button
              key={i}
              onClick={() => flip(i)}
              className={`aspect-square rounded-xl text-2xl sm:text-3xl flex items-center justify-center ${faceUp ? 'bg-white dark:bg-white/20 border-2 border-stone-300 dark:border-white/20' : 'bg-slate-900 dark:bg-amber-400 text-white dark:text-stone-950 font-black'}`}
            >
              {faceUp ? emoji : '?'}
            </button>
          );
        })}
      </div>
      {won && (
        <div className="mt-3">
          <p className="font-black text-emerald-600">🎉 All 6 pairs matched in {moves} moves!</p>
          <button onClick={restart} className="mt-2 px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">Shuffle & play again</button>
        </div>
      )}
      {!won && (
        <button onClick={restart} className="mt-3 px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">Shuffle & restart</button>
      )}
      <Scoreboard game="Memory Match" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Word Scramble — unscramble 5 world words. Tap the letters in order.
// ---------------------------------------------------------------------------

const SCRAMBLE_WORDS = ['KHAOS', 'SCRIPT', 'FAMILIAR', 'MISSION', 'COMMONS', 'GUIDE', 'TOWER', 'DOCK', 'GROVE', 'BEAST', 'ORBIT', 'LAUNCH', 'LANDING', 'DARE', 'WILD'];

const ScrambleGame: React.FC = () => {
  const [roundKey, setRoundKey] = useState(0);
  const words = useMemo(() => shuffle(SCRAMBLE_WORDS, mulberry32(Date.now() % 2147483647 + roundKey)).slice(0, 5), [roundKey]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const target = words[round];
  const scrambled = useMemo(() => {
    const letters = shuffle(target.split(''), mulberry32(Date.now() % 2147483647 + roundKey * 7 + round));
    // Make sure it is actually scrambled.
    if (letters.join('') === target) [letters[0], letters[1]] = [letters[1], letters[0]];
    return letters;
  }, [target, round, roundKey]);
  const [built, setBuilt] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Scoreboard + coins: +10 per word unscrambled.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (done && !recordedRef.current) {
      recordedRef.current = true;
      recordRoundAndAward('Word Scramble', [{ player: 'You', score, detail: `${score}/5 correct` }]);
    }
  }, [done, score]);

  const tapLetter = (i: number) => {
    if (feedback || built.includes(i)) return;
    setBuilt([...built, i]);
  };
  const check = () => {
    const guess = built.map((i) => scrambled[i]).join('');
    if (guess === target) {
      const s = score + 1;
      setScore(s);
      setFeedback('✓ Correct!');
      window.setTimeout(() => {
        setFeedback(null);
        setBuilt([]);
        if (round + 1 >= words.length) setDone(true);
        else setRound(round + 1);
      }, 900);
    } else {
      setFeedback('✕ Not quite — try again.');
      setBuilt([]);
    }
  };

  if (done) {
    return (
      <div className="mt-2">
        <p className="font-black text-lg">You unscrambled {score} / {words.length}!</p>
        {score === words.length && <p className="font-black text-emerald-600">🎉 Clean sweep — every word unscrambled!</p>}
        <button
          onClick={() => { setRoundKey((k) => k + 1); setRound(0); setScore(0); setDone(false); setBuilt([]); setFeedback(null); recordedRef.current = false; }}
          className="mt-2 px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold"
        >
          Play again
        </button>
        <Scoreboard game="Word Scramble" />
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-stone-500">Round {round + 1} of {words.length} · Score: {score}</p>
      <p className="text-sm mt-1">Unscramble this {target.length}-letter word:</p>
      <div className="flex flex-wrap gap-2 mt-2 min-h-12">
        {built.map((i, j) => (
          <button key={j} onClick={() => setBuilt(built.filter((_, k) => k !== j))} className="w-10 h-10 rounded-lg bg-amber-400 text-stone-950 font-black text-lg">
            {scrambled[i]}
          </button>
        ))}
        {built.length === 0 && <span className="text-sm text-stone-500 self-center">Tap the letters below to build the word.</span>}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {scrambled.map((letter, i) => (
          <button
            key={i}
            onClick={() => tapLetter(i)}
            disabled={built.includes(i)}
            className={`w-10 h-10 rounded-lg font-black text-lg ${built.includes(i) ? 'bg-stone-200 dark:bg-white/5 opacity-40' : 'bg-stone-200 dark:bg-white/10'}`}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={check} disabled={built.length !== target.length} className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold disabled:opacity-50">Check word</button>
        <button onClick={() => setBuilt([])} className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">Clear</button>
      </div>
      {feedback && <p className="font-bold mt-2">{feedback}</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// The picker + panel.
// ---------------------------------------------------------------------------

export const SoloGamesPanel: React.FC = () => {
  const [game, setGame] = useState<string | null>(null);
  const [wsSeed, setWsSeed] = useState(() => Date.now() % 2147483647);

  if (game === 'wordsearch') {
    return (
      <div>
        <button onClick={() => setGame(null)} className="text-xs font-bold underline">← All solo games</button>
        <p className="font-bold mt-2">🔍 Word Search</p>
        {/* key remounts on New puzzle — otherwise found/won state would leak into the next grid */}
        <WordSearchGame
          key={wsSeed}
          seed={wsSeed}
          onFinish={(found, total) => recordRoundAndAward('Word Search', [{ player: 'You', score: found, detail: `${found}/${total} words` }])}
        />
        <button onClick={() => setWsSeed(Date.now() % 2147483647)} className="mt-3 px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">New puzzle</button>
        <Scoreboard game="Word Search" />
      </div>
    );
  }
  if (game === 'sudoku') {
    return (
      <div>
        <button onClick={() => setGame(null)} className="text-xs font-bold underline">← All solo games</button>
        <p className="font-bold mt-2">🔢 Sudoku</p>
        <SudokuGame />
      </div>
    );
  }
  if (game === 'memory') {
    return (
      <div>
        <button onClick={() => setGame(null)} className="text-xs font-bold underline">← All solo games</button>
        <p className="font-bold mt-2">🃏 Memory Match</p>
        <MemoryGame />
      </div>
    );
  }
  if (game === 'scramble') {
    return (
      <div>
        <button onClick={() => setGame(null)} className="text-xs font-bold underline">← All solo games</button>
        <p className="font-bold mt-2">🔤 Word Scramble</p>
        <ScrambleGame />
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-2 mt-3">
      {SOLO_LIST.map((g) => (
        <button
          key={g.id}
          onClick={() => setGame(g.id)}
          className="rounded-2xl border border-stone-300 dark:border-white/10 p-3 text-left hover:border-stone-500"
        >
          <span className="text-2xl">{g.emoji}</span>
          <span className="block font-bold mt-1">{g.name}</span>
          <span className="block text-xs text-stone-500 mt-1">{g.blurb}</span>
          <BestScoreLine game={g.name} />
          <span className="block text-xs font-bold mt-2">Play →</span>
        </button>
      ))}
    </div>
  );
};
