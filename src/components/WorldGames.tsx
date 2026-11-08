import React, { useMemo, useState } from 'react';

/**
 * Playable Community Games for Torque World (Amber, 2026-11-07).
 *
 * The games were names + blurbs only; now they are actually playable.
 * Simple and working beats fancy. All state is local (solo playtest) and
 * resets every 5-minute rotation because the parent keys this component
 * by gameIndex. Bots are deterministic (seeded by gameIndex) — same rules,
 * no special powers, no code changing.
 */

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// Word Search — shared by the community Word Search Sprint and the solo
// on-demand word search. Tap a letter, then tap the last letter of a word
// (straight lines only: across, down, or diagonal).
// ---------------------------------------------------------------------------

export const WORD_SEARCH_POOL = [
  'KHAOS', 'SCRIPT', 'FAMILIAR', 'MISSION', 'COMMONS', 'GUIDE', 'DOCK',
  'GROVE', 'TOWER', 'ORBIT', 'LAUNCH', 'LANDING', 'DARE', 'WILD',
  'BEAST', 'TORQUE', 'BAXTER', 'CUE',
];

interface WordSearchProps {
  seed: number;
  wordCount?: number;
  size?: number;
  secondsLeft?: number;
  onWin?: () => void;
}

export const WordSearchGame: React.FC<WordSearchProps> = ({
  seed, wordCount = 5, size = 8, secondsLeft, onWin,
}) => {
  const { grid, words, placements } = useMemo(() => {
    const rand = mulberry32(seed);
    const picked = shuffle(WORD_SEARCH_POOL, rand).slice(0, wordCount);
    const g: string[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ''),
    );
    const placed: Record<string, { r: number; c: number }[]> = {};
    for (const w of picked) {
      let ok = false;
      for (let attempt = 0; attempt < 120 && !ok; attempt++) {
        const horiz = rand() < 0.5;
        const r = Math.floor(rand() * size);
        const c = Math.floor(rand() * size);
        const cells: { r: number; c: number }[] = [];
        let fits = true;
        for (let i = 0; i < w.length; i++) {
          const rr = horiz ? r : r + i;
          const cc = horiz ? c + i : c;
          if (rr >= size || cc >= size) { fits = false; break; }
          if (g[rr][cc] !== '' && g[rr][cc] !== w[i]) { fits = false; break; }
          cells.push({ r: rr, c: cc });
        }
        if (!fits) continue;
        cells.forEach((cell, i) => { g[cell.r][cell.c] = w[i]; });
        placed[w] = cells;
        ok = true;
      }
    }
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!g[r][c]) g[r][c] = letters[Math.floor(rand() * 26)];
      }
    }
    return { grid: g, words: Object.keys(placed), placements: placed };
  }, [seed, wordCount, size]);

  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<{ r: number; c: number } | null>(null);
  const [sel, setSel] = useState<{ r: number; c: number }[]>([]);
  const [won, setWon] = useState(false);

  const foundCells = useMemo(() => {
    const s = new Set<string>();
    found.forEach((w) => placements[w]?.forEach((cell) => s.add(`${cell.r},${cell.c}`)));
    return s;
  }, [found, placements]);

  const tapCell = (r: number, c: number) => {
    if (won) return;
    if (!start) {
      setStart({ r, c });
      setSel([{ r, c }]);
      return;
    }
    if (start.r === r && start.c === c) {
      setStart(null);
      setSel([]);
      return;
    }
    const dr = Math.sign(r - start.r);
    const dc = Math.sign(c - start.c);
    const steps = Math.max(Math.abs(r - start.r), Math.abs(c - start.c));
    if (dr !== 0 && dc !== 0 && Math.abs(r - start.r) !== Math.abs(c - start.c)) {
      setStart({ r, c });
      setSel([{ r, c }]);
      return;
    }
    const cells: { r: number; c: number }[] = [];
    for (let i = 0; i <= steps; i++) cells.push({ r: start.r + dr * i, c: start.c + dc * i });
    const fwd = cells.map((cell) => grid[cell.r][cell.c]).join('');
    const rev = [...fwd].reverse().join('');
    const hit = words.find((w) => !found.includes(w) && (w === fwd || w === rev));
    if (hit) {
      const next = [...found, hit];
      setFound(next);
      if (next.length === words.length) {
        setWon(true);
        onWin?.();
      }
    }
    setStart(null);
    setSel([]);
  };

  const selSet = new Set(sel.map((cell) => `${cell.r},${cell.c}`));

  return (
    <div>
      {secondsLeft !== undefined && (
        <p className="text-lg font-black">⏱ {fmtClock(secondsLeft)} left</p>
      )}
      <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {grid.map((row, r) => row.map((letter, c) => {
          const key = `${r},${c}`;
          const isFound = foundCells.has(key);
          const isSel = selSet.has(key);
          return (
            <button
              key={key}
              onClick={() => tapCell(r, c)}
              className={`aspect-square rounded-md text-sm sm:text-base font-black flex items-center justify-center ${isFound ? 'bg-emerald-400 text-white' : isSel ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 dark:bg-white/10'}`}
            >
              {letter}
            </button>
          );
        }))}
      </div>
      <p className="text-xs text-stone-500 mt-2">
        Tap a letter, then tap the last letter of the word — straight lines only (across, down, or diagonal).
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {words.map((w) => (
          <span key={w} className={`px-2 py-1 rounded-lg text-xs font-bold ${found.includes(w) ? 'bg-emerald-400 text-white line-through' : 'bg-stone-200 dark:bg-white/10'}`}>
            {w}
          </span>
        ))}
      </div>
      {won && <p className="font-black text-emerald-600 mt-2">🎉 You found all {words.length} words!</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Khaos Connections — group 16 words into 4 groups of 4. 4 mistakes and
// the round is over.
// ---------------------------------------------------------------------------

const CONNECTION_SETS: { label: string; words: string[] }[][] = [
  [
    { label: 'Mississippi Familiars', words: ['Rouxgarou', 'Sin Bin', 'Red Reb', 'The Admiral'] },
    { label: 'Khaos words', words: ['KHAOS', 'MESSY', 'WILD', 'FERAL'] },
    { label: 'App colours', words: ['PINK', 'TEAL', 'GOLD', 'NAVY'] },
    { label: 'Daily steps', words: ['LAUNCH', 'ORBIT', 'LANDING', 'MISSION'] },
  ],
  [
    { label: 'Mississippi cities', words: ['Kosciusko', 'Biloxi', 'Gulfport', 'Hattiesburg'] },
    { label: 'Companions', words: ['Torque', 'GPT', 'Cue', 'Baxter'] },
    { label: 'Book parts', words: ['COVER', 'DAILY', 'DEBRIEF', 'STICKERS'] },
    { label: 'Zodiac signs', words: ['ARIES', 'TAURUS', 'GEMINI', 'CANCER'] },
  ],
  [
    { label: 'Familiars', words: ['Golden Eagle', 'Rouxgarou', 'Sin Bin', 'Red Reb'] },
    { label: 'Months', words: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'] },
    { label: 'Feelings', words: ['BRAVE', 'TIRED', 'LOUD', 'QUIET'] },
    { label: 'Tools', words: ['PEN', 'PAPER', 'PHONE', 'TIMER'] },
  ],
];

const GROUP_COLORS = ['bg-emerald-400', 'bg-sky-400', 'bg-amber-400', 'bg-rose-400'];

const ConnectionsGame: React.FC<{ seed: number; secondsElapsed: number; botNames: string[]; onWin?: () => void }> = ({
  seed, secondsElapsed, botNames, onWin,
}) => {
  const groups = useMemo(() => CONNECTION_SETS[seed % CONNECTION_SETS.length], [seed]);
  const words = useMemo(
    () => shuffle(groups.flatMap((g) => g.words.map((w) => ({ word: w, group: g.label }))), mulberry32(seed + 7)),
    [groups, seed],
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [over, setOver] = useState(false);
  const won = locked.length === groups.length;
  // Bots find groups as the clock runs — same rules, just slower or faster.
  const botGroups = botNames.map((_, i) => Math.min(3, Math.floor(secondsElapsed / (55 + i * 25))));

  const submit = () => {
    if (selected.length !== 4 || over || won) return;
    const chosen = selected.map((i) => words[i]);
    const group = chosen[0].group;
    if (chosen.every((w) => w.group === group)) {
      const next = [...locked, group];
      setLocked(next);
      setSelected([]);
      if (next.length === groups.length) {
        setOver(true);
        onWin?.();
      }
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      setSelected([]);
      if (m >= 4) setOver(true);
    }
  };

  const remaining = words.filter((w) => !locked.includes(w.group));

  return (
    <div>
      {locked.map((label, i) => {
        const g = groups.find((x) => x.label === label);
        return (
          <div key={label} className={`rounded-xl px-3 py-2 mt-2 text-sm font-bold text-white ${GROUP_COLORS[i % GROUP_COLORS.length]}`}>
            {label}: {g?.words.join(' · ')}
          </div>
        );
      })}
      {!over && (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {remaining.map((w) => {
            const idx = words.indexOf(w);
            const isSel = selected.includes(idx);
            return (
              <button
                key={w.word}
                onClick={() => setSelected((s) => (s.includes(idx) ? s.filter((x) => x !== idx) : s.length < 4 ? [...s, idx] : s))}
                className={`rounded-lg px-1 py-3 text-xs sm:text-sm font-bold ${isSel ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950' : 'bg-stone-200 dark:bg-white/10'}`}
              >
                {w.word}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {!over && (
          <button
            onClick={submit}
            disabled={selected.length !== 4}
            className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold disabled:opacity-50"
          >
            Check group ({selected.length}/4)
          </button>
        )}
        <span className="text-xs font-bold">Mistakes: {'✕'.repeat(mistakes)}{'○'.repeat(Math.max(0, 4 - mistakes))}</span>
      </div>
      <p className="text-xs text-stone-500 mt-2">
        Bots: {botNames.map((n, i) => `${n} — ${botGroups[i]} group${botGroups[i] === 1 ? '' : 's'}`).join(' · ')}
      </p>
      {won && <p className="font-black text-emerald-600 mt-2">🎉 All four groups found — clean sweep!</p>}
      {over && !won && (
        <div className="mt-2">
          <p className="font-bold">Out of guesses — the groups were:</p>
          <ul className="text-sm mt-1 space-y-1">
            {groups.map((g) => (
              <li key={g.label}>· <strong>{g.label}:</strong> {g.words.join(', ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Daily Dare Dash — today's mission, as a dare. Start the stopwatch, do
// the dare, tap "I did it!". Bots have seeded finish times.
// ---------------------------------------------------------------------------

const DareDashGame: React.FC<{
  seed: number; missionTitle: string; missionTagline: string;
  secondsElapsed: number; botNames: string[]; now: number;
  onLog: (msg: string) => void;
}> = ({ seed, missionTitle, missionTagline, secondsElapsed, botNames, now, onLog }) => {
  const botTimes = useMemo(() => {
    const rand = mulberry32(seed + 13);
    return botNames.map(() => 25 + Math.floor(rand() * 30));
  }, [seed, botNames]);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [finishedIn, setFinishedIn] = useState<number | null>(null);
  const elapsed = startAt !== null ? Math.max(0, Math.floor((now - startAt) / 1000)) : 0;

  const finish = () => {
    if (startAt === null || finishedIn !== null) return;
    setFinishedIn(elapsed);
    onLog(`You did today's dare — ${missionTitle} — in ${fmtClock(elapsed)}!`);
  };

  const rank = finishedIn === null ? null : 1 + botTimes.filter((t) => t < finishedIn).length;

  return (
    <div>
      <p className="font-bold mt-2">Today&apos;s dare: {missionTitle}</p>
      <p className="text-sm text-stone-600 dark:text-stone-300">{missionTagline}</p>
      {startAt === null ? (
        <button
          onClick={() => setStartAt(Date.now())}
          className="mt-3 px-4 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold"
        >
          ▶ Start the dash
        </button>
      ) : finishedIn === null ? (
        <div className="mt-3">
          <p className="text-3xl font-black">⏱ {fmtClock(elapsed)}</p>
          <button
            onClick={finish}
            className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold"
          >
            ✓ I did it!
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="font-black text-emerald-600 text-lg">🎉 Dare done in {fmtClock(finishedIn)} — you came #{rank} of 3!</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>· You — {fmtClock(finishedIn)}</li>
            {botNames.map((n, i) => (
              <li key={n}>· {n} — {fmtClock(botTimes[i])}{secondsElapsed < botTimes[i] ? ' (still going)' : ''}</li>
            ))}
          </ul>
        </div>
      )}
      {startAt !== null && finishedIn === null && (
        <p className="text-xs text-stone-500 mt-2">
          Bots: {botNames.map((n, i) => `${n} ${secondsElapsed >= botTimes[i] ? `finished in ${fmtClock(botTimes[i])}` : 'still going'}`).join(' · ')}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Familiar Trivia — 3 multiple-choice questions about the Familiars.
// ---------------------------------------------------------------------------

const TRIVIA_POOL: { q: string; options: string[]; answer: number }[] = [
  { q: 'Which city is Rouxgarou from?', options: ['Kosciusko', 'Biloxi', 'Gulfport', 'Hattiesburg'], answer: 0 },
  { q: "What is Sin Bin's epithet?", options: ['The Penalty Box Instigator', 'Feral Swamp Gremlin King', 'The Extra-Innings Disruptor', 'Commander of the Almost-Sea'], answer: 0 },
  { q: 'Which Familiar lives in Hattiesburg?', options: ['Golden Eagle', 'Red Reb', 'The Admiral', 'Rouxgarou'], answer: 0 },
  { q: 'How many companions are in the Commons?', options: ['5', '3', '2', '7'], answer: 0 },
  { q: 'The Guide does not…', options: ['Grade you', 'Optimize you', 'Tell you what your day should mean', 'All of the above'], answer: 3 },
  { q: 'Red Reb lives in…?', options: ['Orange Grove', 'Biloxi', 'Kosciusko', 'Gulfport'], answer: 0 },
  { q: 'How often does a new community game start?', options: ['Every 5 minutes', 'Every hour', 'Daily', 'Every 15 minutes'], answer: 0 },
  { q: 'How many players are in each game?', options: ['3', '5', '2', '4'], answer: 0 },
  { q: "The Admiral's epithet?", options: ['Commander of the Almost-Sea', 'The Blitz Coordinator', 'Feral Swamp Gremlin King', 'The Penalty Box Instigator'], answer: 0 },
  { q: "Golden Eagle's epithet?", options: ['The Blitz Coordinator', 'Feral Swamp Gremlin King', 'The Extra-Innings Disruptor', 'Commander of the Almost-Sea'], answer: 0 },
];

const TriviaGame: React.FC<{ seed: number; botNames: string[]; onWin?: () => void }> = ({ seed, botNames, onWin }) => {
  const questions = useMemo(() => shuffle(TRIVIA_POOL, mulberry32(seed + 21)).slice(0, 3), [seed]);
  const botScores = useMemo(() => {
    const rand = mulberry32(seed + 23);
    return botNames.map(() => 1 + Math.floor(rand() * 3));
  }, [seed, botNames]);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[qIdx];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (qIdx + 1 >= questions.length) {
      setDone(true);
      if (score + (picked === q.answer ? 1 : 0) === questions.length) onWin?.();
    } else {
      setQIdx(qIdx + 1);
      setPicked(null);
    }
  };
  const finalScore = score;

  if (done) {
    return (
      <div className="mt-2">
        <p className="font-black text-lg">You scored {finalScore} / {questions.length}!</p>
        <p className="text-sm mt-1">Bots: {botNames.map((n, i) => `${n} — ${botScores[i]}/3`).join(' · ')}</p>
        {finalScore === questions.length && <p className="font-black text-emerald-600 mt-1">🎉 Perfect round!</p>}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-stone-500">Question {qIdx + 1} of {questions.length} · Score: {score}</p>
      <p className="font-bold mt-1">{q.q}</p>
      <div className="grid gap-2 mt-2">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const isPicked = picked === i;
          return (
            <button
              key={opt}
              onClick={() => pick(i)}
              className={`rounded-xl px-3 py-2 text-sm font-bold text-left ${picked === null ? 'bg-stone-200 dark:bg-white/10' : isAnswer ? 'bg-emerald-400 text-white' : isPicked ? 'bg-rose-400 text-white' : 'bg-stone-200 dark:bg-white/10 opacity-60'}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button onClick={next} className="mt-3 px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">
          {qIdx + 1 >= questions.length ? 'See my score' : 'Next question →'}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Commons Charades — a companion acts out a word with emoji clues; guess it.
// ---------------------------------------------------------------------------

const CHARADE_POOL: { clue: string; actor: string; answer: string; options: string[] }[] = [
  { clue: '🎲 🎯 🃏', actor: 'Torque', answer: 'Games Board', options: ['Games Board', 'Missions Board', 'Guide Tower', 'Daily Dock'] },
  { clue: '🐊 🌿 👑', actor: 'GPT', answer: 'Rouxgarou', options: ['Rouxgarou', 'Sin Bin', 'Golden Eagle', 'Red Reb'] },
  { clue: '🗼 💬 🧭', actor: 'Cue', answer: 'Guide Tower', options: ['Guide Tower', 'Daily Dock', 'The Commons', 'Familiar Grove'] },
  { clue: '⚓ 📜 🌅', actor: 'CreaO', answer: 'Daily Dock', options: ['Daily Dock', 'Games Board', 'Guide Tower', 'The Commons'] },
  { clue: '⛲ 🤝 🎉', actor: 'Baxter', answer: 'The Commons', options: ['The Commons', 'Familiar Grove', 'Missions Board', 'Daily Dock'] },
  { clue: '🐾 🌲 ✨', actor: 'Torque', answer: 'Familiar Grove', options: ['Familiar Grove', 'The Commons', 'Guide Tower', 'Games Board'] },
  { clue: '📖 ✏️ 🔥', actor: 'GPT', answer: 'Off*Script', options: ['Off*Script', 'Life OS', 'Khaos Krew', 'The OS'] },
  { clue: '🌙 📝 💭', actor: 'Cue', answer: 'Landing', options: ['Landing', 'Launch', 'Orbit', 'Dusk'] },
];

const CharadesGame: React.FC<{ seed: number; botNames: string[]; onWin?: () => void }> = ({ seed, botNames, onWin }) => {
  const rounds = useMemo(() => shuffle(CHARADE_POOL, mulberry32(seed + 29)).slice(0, 3), [seed]);
  const botScores = useMemo(() => {
    const rand = mulberry32(seed + 31);
    return botNames.map(() => 1 + Math.floor(rand() * 3));
  }, [seed, botNames]);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cur = rounds[round];
  const options = useMemo(() => shuffle(cur.options, mulberry32(seed + 37 + round)), [cur, seed, round]);

  const pick = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    if (opt === cur.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (round + 1 >= rounds.length) {
      setDone(true);
      if (score + (picked === cur.answer ? 1 : 0) === rounds.length) onWin?.();
    } else {
      setRound(round + 1);
      setPicked(null);
    }
  };

  if (done) {
    return (
      <div className="mt-2">
        <p className="font-black text-lg">You guessed {score} / {rounds.length}!</p>
        <p className="text-sm mt-1">Bots: {botNames.map((n, i) => `${n} — ${botScores[i]}/3`).join(' · ')}</p>
        {score === rounds.length && <p className="font-black text-emerald-600 mt-1">🎉 You never guess alone — and you guessed them all!</p>}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-stone-500">Round {round + 1} of {rounds.length} · Score: {score}</p>
      <p className="text-sm mt-1"><strong>{cur.actor}</strong> acts out…</p>
      <p className="text-4xl mt-2 text-center">{cur.clue}</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {options.map((opt) => {
          const isAnswer = opt === cur.answer;
          const isPicked = picked === opt;
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${picked === null ? 'bg-stone-200 dark:bg-white/10' : isAnswer ? 'bg-emerald-400 text-white' : isPicked ? 'bg-rose-400 text-white' : 'bg-stone-200 dark:bg-white/10 opacity-60'}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button onClick={next} className="mt-3 px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">
          {round + 1 >= rounds.length ? 'See my score' : 'Next round →'}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// The rotating player — one component per game, keyed by gameIndex upstream
// so state resets every 5-minute rotation.
// ---------------------------------------------------------------------------

export interface CommunityGamePlayerProps {
  gameName: string;
  gameIndex: number;
  missionTitle: string;
  missionTagline: string;
  botNames: string[];
  secondsElapsed: number;
  secondsLeft: number;
  now: number;
  onLog: (msg: string) => void;
}

export const CommunityGamePlayer: React.FC<CommunityGamePlayerProps> = (props) => {
  const { gameName, gameIndex } = props;
  const botLine = (
    <p className="text-xs text-stone-500 mt-2">
      3 players: you · {props.botNames.join(' · ')} — same rules, same timer, no bot advantages.
    </p>
  );

  if (gameName === 'Word Search Sprint') {
    const botTargets = [2, 3].map((base, i) => base + ((gameIndex + i) % 2));
    const botFound = botTargets.map((t) => Math.min(t, Math.floor(props.secondsElapsed / 45)));
    return (
      <div className="mt-3 border-t border-stone-200 dark:border-white/10 pt-3">
        <p className="font-bold">▶ Playing now: Word Search Sprint</p>
        <WordSearchGame
          seed={gameIndex * 31 + 7}
          secondsLeft={props.secondsLeft}
          onWin={() => props.onLog('You finished the Word Search Sprint — all words found!')}
        />
        <p className="text-xs text-stone-500 mt-2">
          Bots: {props.botNames.map((n, i) => `${n} — ${botFound[i]} words`).join(' · ')}
        </p>
        {botLine}
      </div>
    );
  }

  if (gameName === 'Khaos Connections') {
    return (
      <div className="mt-3 border-t border-stone-200 dark:border-white/10 pt-3">
        <p className="font-bold">▶ Playing now: Khaos Connections</p>
        <ConnectionsGame
          seed={gameIndex * 17 + 3}
          secondsElapsed={props.secondsElapsed}
          botNames={props.botNames}
          onWin={() => props.onLog('You solved Khaos Connections — all four groups found!')}
        />
        {botLine}
      </div>
    );
  }

  if (gameName === 'Daily Dare Dash') {
    return (
      <div className="mt-3 border-t border-stone-200 dark:border-white/10 pt-3">
        <p className="font-bold">▶ Playing now: Daily Dare Dash</p>
        <DareDashGame
          seed={gameIndex * 13 + 5}
          missionTitle={props.missionTitle}
          missionTagline={props.missionTagline}
          secondsElapsed={props.secondsElapsed}
          botNames={props.botNames}
          now={props.now}
          onLog={props.onLog}
        />
        {botLine}
      </div>
    );
  }

  if (gameName === 'Familiar Trivia') {
    return (
      <div className="mt-3 border-t border-stone-200 dark:border-white/10 pt-3">
        <p className="font-bold">▶ Playing now: Familiar Trivia</p>
        <TriviaGame
          seed={gameIndex * 19 + 11}
          botNames={props.botNames}
          onWin={() => props.onLog('Perfect round on Familiar Trivia — 3 out of 3!')}
        />
        {botLine}
      </div>
    );
  }

  if (gameName === 'Commons Charades') {
    return (
      <div className="mt-3 border-t border-stone-200 dark:border-white/10 pt-3">
        <p className="font-bold">▶ Playing now: Commons Charades</p>
        <CharadesGame
          seed={gameIndex * 23 + 9}
          botNames={props.botNames}
          onWin={() => props.onLog('You guessed every charade in Commons Charades!')}
        />
        {botLine}
      </div>
    );
  }

  return (
    <p className="text-sm text-stone-500 mt-3">This game is still being built — check back next round.</p>
  );
};
