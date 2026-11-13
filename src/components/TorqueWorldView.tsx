import React, { useEffect, useMemo, useState } from 'react';
import { Globe, MapPin, Sparkles, Gamepad2, ScrollText, Users, MessageCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Youtube, HeartHandshake } from 'lucide-react';
import { AdultConsentGate, ExplicitContentBanner, hasAdultConsent } from './AdultConsent';
import { getEditionThemeForDate } from '../lib/editionSync';
import { getJanuary2027Day } from '../data/january2027Daily';
import { getHolidayForDate } from '../data/holidays';
import { localDateKey } from '../lib/dates';
import { SelfieAvatarCreator } from './SelfieAvatarCreator';
import { CommunityGamePlayer } from './WorldGames';
import { SoloGamesPanel } from './SoloGames';
import { CoinBalance } from './CoinBalance';
// Lazy: Three.js (~600KB) only downloads when she taps First-person 3D,
// never on normal Dashboard load — matters on a Moto G Play.
const FirstPersonWorld = React.lazy(() =>
  import('./FirstPersonWorld').then((m) => ({ default: m.FirstPersonWorld })),
);

/**
 * Torque World — the public-facing Off*Script virtual world, built by Torque.
 * STAGED ONLY (2026-11-03, Amber's call: Torque is the creator of the one
 * people see). This is a NEW world inside the app, separate from Cue's
 * Inbetween (which stays as its own doorway in the menu). Nothing here
 * edits, copies, or claims Cue's Inbetween or GPT's Innie World original.
 *
 * Inspiration, not copy: her GitHub repos — off-script-life-os (app canon:
 * Familiars, Beast Mode, Launch/Orbit/Landing), GPTREPO Innie World V1
 * (zodiac, geo-tied buddies, selfie avatar), Testerrepo (Familiar-zone
 * prototype), and the app's own Flight Deck Commons idea (one shared
 * place, play together) — rebuilt here as a walkable grid world.
 *
 * Honesty, kept verbatim until a real sync is live and verified:
 * "TORQUE WORLD · SOLO PLAYTEST · NOT SYNCED". Solo, local-only:
 * no login, no Wall/DM sync, no Familiar sync, no Intent, no add-ons,
 * no Khaos Points, no streaks. What you do here stays in this browser
 * (localStorage) for now. Visiting never logs you in or opts you in.
 *
 * Fairness rule (Amber, 2026-11-03): bot players in games have NO special
 * powers and NO code changing. Bots play by exactly the same rules, timer,
 * and moves as a human player — no hidden advantages, no rule edits, no
 * code access. Games are 3-player (you + 2 rotating bots), never all 5 at once.
 *
 * Walkable: arrow buttons, on-screen D-pad, click a tile, or keyboard
 * arrows. Places: Commons, Games, Missions, Familiar Grove, Guide Tower,
 * Daily Dock. Today's mission = today's daily holiday (January 2027 book
 * data when in January 2027, otherwise the app's holiday for the date),
 * with Launch / Orbit / Landing as the mission steps.
 */

type PlaceId = 'commons' | 'games' | 'missions' | 'grove' | 'tower' | 'dock' | 'wild';

interface Tile {
  x: number;
  y: number;
  place: PlaceId;
  label: string;
  emoji: string;
}

// 7 wide x 5 tall walkable world. The Commons sits in the middle.
// Exported so FirstPersonWorld renders the SAME world in 3D — one map,
// two views. Do not fork the tile list.
export const TILES: Tile[] = [
  { x: 0, y: 0, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 1, y: 0, place: 'games', label: 'Games Board', emoji: '🎲' },
  { x: 2, y: 0, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 3, y: 0, place: 'tower', label: 'Guide Tower', emoji: '🗼' },
  { x: 4, y: 0, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 5, y: 0, place: 'missions', label: 'Missions Board', emoji: '📜' },
  { x: 6, y: 0, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 0, y: 1, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 1, y: 1, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 2, y: 1, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 3, y: 1, place: 'commons', label: 'The Commons', emoji: '⛲' },
  { x: 4, y: 1, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 5, y: 1, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 6, y: 1, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 0, y: 2, place: 'grove', label: 'Familiar Grove', emoji: '🐾' },
  { x: 1, y: 2, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 2, y: 2, place: 'commons', label: 'The Commons', emoji: '⛲' },
  { x: 3, y: 2, place: 'commons', label: 'The Commons', emoji: '⛲' },
  { x: 4, y: 2, place: 'commons', label: 'The Commons', emoji: '⛲' },
  { x: 5, y: 2, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 6, y: 2, place: 'dock', label: 'Daily Dock', emoji: '⚓' },
  { x: 0, y: 3, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 1, y: 3, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 2, y: 3, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 3, y: 3, place: 'commons', label: 'The Commons', emoji: '⛲' },
  { x: 4, y: 3, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 5, y: 3, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 6, y: 3, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 0, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 1, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 2, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 3, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 4, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 5, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
  { x: 6, y: 4, place: 'wild', label: 'Wild Edge', emoji: '🌿' },
];

export const PLACES: Record<PlaceId, { name: string; blurb: string; action: string }> = {
  commons: {
    name: 'The Commons',
    blurb: 'One shared place. Play together. This is the heart of the world — start here, meet here, come back here.',
    action: 'Rest in the Commons. Nothing to prove here.',
  },
  games: {
    name: 'Games Board',
    blurb: 'Play here. Word searches, Khaos Connections, and the puzzles from the book — as world games, not homework.',
    action: 'Pick a game: word search or Khaos Connections. Solo playtest for now.',
  },
  missions: {
    name: 'Missions Board',
    blurb: 'Pick an optional mission. Missions never block the Commons, and a missed mission stays missed — no chasing.',
    action: "Today's mission is at the Daily Dock. Missions here are optional, always.",
  },
  grove: {
    name: 'Familiar Grove',
    blurb: 'The five Mississippi Familiars live here, geo-anchored to their real places: Kosciusko, Biloxi, Orange Grove, Gulfport, Hattiesburg.',
    action: 'Meet a Familiar. Tap to greet it — shake it three times, deliberately, and watch Beast Mode stage up. It calms back down; it is never permanent.',
  },
  tower: {
    name: 'Guide Tower',
    blurb: 'Talk to the Guide. The Guide does not grade you, does not optimize you, and does not tell you what your day should mean.',
    action: 'Ask the Guide: "What is today?" The Guide answers with today\'s daily holiday and one honest question.',
  },
  dock: {
    name: 'Daily Dock',
    blurb: 'Today\'s mission docks here: Launch in the morning, Orbit at midday, Landing in the evening. Same reality as the book and the app.',
    action: 'Today\'s mission: see below. Launch, Orbit, Landing — in that order, or not at all. Your call.',
  },
  wild: {
    name: 'Wild Edge',
    blurb: 'The edge of the mapped world. Wild on purpose — not every tile needs a job.',
    action: 'Wander. Notice one tiny astonishment and write it down. That counts.',
  },
};

export const FAMILIARS = [
  { name: 'Rouxgarou', epithet: 'Feral Swamp Gremlin King', city: 'Kosciusko, Mississippi', greeting: 'The swamp has noticed you. Try not to make it weird. (You will.)' },
  { name: 'Sin Bin', epithet: 'The Penalty Box Instigator', city: 'Biloxi, Mississippi', greeting: 'All right, hotshot. The coast is your rink now.' },
  { name: 'Red Reb', epithet: 'The Extra-Innings Disruptor', city: 'Orange Grove, Mississippi', greeting: 'Extra innings. Nobody leaves early.' },
  { name: 'The Admiral', epithet: 'Commander of the Almost-Sea', city: 'Gulfport, Mississippi', greeting: 'Charted, mostly. The almost-sea keeps its secrets.' },
  { name: 'Golden Eagle', epithet: 'The Blitz Coordinator', city: 'Hattiesburg, Mississippi', greeting: 'Blitz on three. No, now. Go.' },
];

export const COMPANIONS = [
  { name: 'Torque', role: 'Your production partner', lines: ['I have got the build. You just make the call.', 'One missing item at a time. No big lists, no double work.', 'You are not behind. You are building. That counts.'] },
  { name: 'GPT', role: 'The world-builder', lines: ['Every world starts as a sentence. Yours started as a script.', 'Want to try the same idea three different ways? I will hold all three.', 'You do not have to finish it today for it to be real.'] },
  { name: 'Cue', role: 'The Inbetween keeper', lines: ['The Commons is open. Come as you are.', 'A doorway is not a test. Walk through it when you want to.', 'You are welcome here even if you only look around.'] },
  { name: 'CreaO', role: 'The reviewer', lines: ['Second pair of eyes, no judgment. Show me the draft.', 'A defect is not a verdict on you. It is a line to fix.', 'Your work deserves a careful read, not a rushed one.'] },
  { name: 'Baxter', role: 'The other hands', lines: ['Listings, storefronts, the boring bits — handled.', 'You shipped it yourself. I just made it shippable.', 'Rest is part of the work too. The store stays open.'] },
];

const COMMUNITY_GAMES = [
  { name: 'Word Search Sprint', blurb: 'Find the hidden words before the timer runs out. Fast fingers, no perfection required.' },
  { name: 'Khaos Connections', blurb: 'Group the khaos into fours. Wrong groups are just plot twists.' },
  { name: 'Daily Dare Dash', blurb: "Today's daily holiday, as a dare. Do it, log it, move on." },
  { name: 'Familiar Trivia', blurb: 'Five Familiars, five cities, one very confident quizmaster.' },
  { name: 'Commons Charades', blurb: 'Act it out, guess it out. Companions guess first, so you never guess alone.' },
];

const GUIDE_LINES = [
  'The Guide says: the world is not a productivity app with trees on it.',
  'The Guide says: boredom is death, but rushing is not living either.',
  'The Guide says: do different, think different, imagine different — be Off*Script.',
  'The Guide says: a mission you skip is not a failure. It is a choice you made.',
];

export const TorqueWorldView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const today = localDateKey();
  const theme = getEditionThemeForDate(today);
  const janDay = today.startsWith('2027-01-') ? getJanuary2027Day(today) : null;
  const holiday = getHolidayForDate(today);
  const missionTitle = janDay ? janDay.title : holiday?.title ?? "Today's mission";
  const missionTagline = janDay ? janDay.tagline : holiday?.tagline ?? 'Show up anyway — imperfectly, uncertainly, honestly.';

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('torque-world-pos');
      return saved ? JSON.parse(saved) : { x: 3, y: 2 };
    } catch {
      return { x: 3, y: 2 };
    }
  });
  const [familiarIdx, setFamiliarIdx] = useState(0);
  const [beastStage, setBeastStage] = useState(0);
  const [guideIdx, setGuideIdx] = useState(0);
  const [log, setLog] = useState<string[]>(['You arrive at the Commons.']);
  const [adultOk, setAdultOk] = useState(() => hasAdultConsent());
  const [companionIdx, setCompanionIdx] = useState(0);
  const [companionLineIdx, setCompanionLineIdx] = useState(0);
  // Default World Broadcast playlist: the Master Broadcast (Amber, 2026-11-03).
  // NOTE: this playlist is currently PRIVATE on YouTube, so the embed only
  // plays for its owner (Amber, signed in as jbsboutiquems@gmail.com).
  // Other visitors see YouTube's "video unavailable" error. Making it
  // Unlisted or Public is Amber's call — do not change its privacy here.
  const MASTER_BROADCAST_ID = 'PLZQ-daf7Q57E';
  const MASTER_BROADCAST_URL = 'https://www.youtube.com/playlist?list=PLZQ-daf7Q57E';
  const [playlistInput, setPlaylistInput] = useState(() => {
    try { return localStorage.getItem('torque-world-playlist') || MASTER_BROADCAST_URL; } catch { return MASTER_BROADCAST_URL; }
  });
  const [playlistId, setPlaylistId] = useState(() => {
    try {
      const saved = localStorage.getItem('torque-world-playlist') || '';
      if (!saved) return MASTER_BROADCAST_ID;
      const m = /[?&]list=([^&#]+)/.exec(saved);
      return m ? m[1] : saved;
    } catch { return MASTER_BROADCAST_ID; }
  });
  const [now, setNow] = useState(() => Date.now());
  const [joinedGame, setJoinedGame] = useState(false);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  // Commercial positions in the master playlist (filled in from the master
  // playlist report). Commercials CANNOT be skipped — Skip/Previous are
  // locked while a commercial is playing. Songs stay skippable.
  const [commercialIndices] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('torque-world-commercials') ?? '[]'); } catch { return []; }
  });
  const isCommercial = commercialIndices.includes(playlistIndex);
  const [songVotes, setSongVotes] = useState<Record<number, { up: number; down: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('torque-world-votes') ?? '{}'); } catch { return {}; }
  });
  const [requestOpen, setRequestOpen] = useState(false);
  const [requests, setRequests] = useState<{ song: string; artist: string; link: string; name: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('torque-world-requests') ?? '[]'); } catch { return []; }
  });
  const [reqSong, setReqSong] = useState('');
  const [reqArtist, setReqArtist] = useState('');
  const [reqLink, setReqLink] = useState('');
  const [reqName, setReqName] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  // World menu drawer (3D view only): the informational panels live here;
  // chat (Guide) and companions stay on screen by Amber's call.
  const [menuOpen, setMenuOpen] = useState(false);
  // First-person 3D walkthrough (STAGED 2026-11-06, Amber's call). The 2D
  // grid stays the default and stays intact — this only swaps the walk
  // panel, never the world data.
  const [viewMode, setViewMode] = useState<'2d' | '3d'>(() => {
    try {
      return (localStorage.getItem('torque-world-view-mode') as '2d' | '3d') || '2d';
    } catch {
      return '2d';
    }
  });
  const [avatar, setAvatar] = useState<{ name: string; image: string; glow: string } | null>(() => {
    try {
      const saved = localStorage.getItem('torque-world-avatar');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const tile = useMemo(
    () => TILES.find((t) => t.x === pos.x && t.y === pos.y) ?? TILES[10],
    [pos],
  );
  const place = PLACES[tile.place];
  const familiar = FAMILIARS[familiarIdx];

  const move = (dx: number, dy: number) => {
    const nx = Math.min(6, Math.max(0, pos.x + dx));
    const ny = Math.min(4, Math.max(0, pos.y + dy));
    if (nx === pos.x && ny === pos.y) return;
    const next = TILES.find((t) => t.x === nx && t.y === ny);
    setPos({ x: nx, y: ny });
    setLog((l) => [`You walk to ${next?.label ?? 'the wild'}.`, ...l].slice(0, 6));
  };

  useEffect(() => {
    try {
      localStorage.setItem('torque-world-pos', JSON.stringify(pos));
    } catch {
      // Solo playtest: storage failing must never block walking.
    }
  }, [pos]);

  // Community games: a new game starts every 5 minutes, on the clock
  // (:00, :05, :10 …). Solo playtest: the clock is real, the crowd is
  // you + the 5 companions — nobody ever waits alone for a game.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const FIVE_MIN = 5 * 60 * 1000;
  const gameIndex = Math.floor(now / FIVE_MIN);
  const nextGameAt = (gameIndex + 1) * FIVE_MIN;
  const msToNext = nextGameAt - now;
  const mm = Math.floor(msToNext / 60000);
  const ss = Math.floor((msToNext % 60000) / 1000);
  const currentGame = COMMUNITY_GAMES[gameIndex % COMMUNITY_GAMES.length];
  const nextGame = COMMUNITY_GAMES[(gameIndex + 1) % COMMUNITY_GAMES.length];
  // Games are 3-player, always: you + 2 bots, rotating — never all 5 bots at once.
  const gameBots = [COMPANIONS[(gameIndex * 2) % COMPANIONS.length], COMPANIONS[(gameIndex * 2 + 1) % COMPANIONS.length]];
  // Game clock banner: the 5-minute window counts DOWN to the next game, so
  // msToNext is also the time left in the game now playing. Sequence:
  // 1-minute warning → "starting now" announcement → countdown while it plays.
  const showWarning = msToNext <= 60000 && msToNext > 0;
  const justStarted = msToNext > 288000; // this game began under 12s ago

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); move(0, -1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(0, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1, 0); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  const shakeFamiliar = () => {
    if (beastStage < 3) {
      const next = beastStage + 1;
      setBeastStage(next);
      setLog((l) => [
        next === 3
          ? `${familiar.name} is in full Beast Mode. Same creature, louder — never a different creature. It calms back down.`
          : `${familiar.name} stages up to Beast ${next}. Warning given, no silent jump.`,
        ...l,
      ].slice(0, 6));
    } else {
      setBeastStage(0);
      setLog((l) => [`Dawn breaks. ${familiar.name} is sweet again.`, ...l].slice(0, 6));
    }
  };

  const vote = (kind: 'up' | 'down') => {
    setSongVotes((v) => {
      const cur = v[playlistIndex] ?? { up: 0, down: 0 };
      const next = { ...v, [playlistIndex]: { ...cur, [kind]: cur[kind] + 1 } };
      try { localStorage.setItem('torque-world-votes', JSON.stringify(next)); } catch { /* solo playtest */ }
      return next;
    });
  };
  const currentVotes = songVotes[playlistIndex] ?? { up: 0, down: 0 };

  // --- World panels (extracted so the 3D view can show chat + companions
  // on screen while the informational panels live in the World menu
  // drawer). The 2D view renders them in the same order as before. ---
  const missionPanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><ScrollText className="w-4 h-4" /><h3 className="font-bold">Today&apos;s mission</h3></div>
    <p className="font-bold mt-2">{missionTitle}</p>
    <p className="text-sm text-stone-600 dark:text-stone-300">{missionTagline}</p>
    <p className="text-xs text-stone-500 mt-2">Launch · Orbit · Landing — same reality as the book and the app. Skip it if you want. Missed stays missed.</p>
  </div>
  );

  const familiarPanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><Users className="w-4 h-4" /><h3 className="font-bold">Familiar Grove</h3></div>
    <p className="font-bold mt-2">{familiar.name} — {familiar.epithet}</p>
    <p className="text-sm text-stone-600 dark:text-stone-300">{familiar.city} · “{familiar.greeting}”</p>
    <p className="text-sm mt-2">Beast stage: <strong>{beastStage} / 3</strong> {beastStage === 3 ? '— full beast, same creature, louder.' : ''}</p>
    <div className="flex flex-wrap gap-2 mt-3">
      <button onClick={() => setFamiliarIdx((i) => (i + 1) % FAMILIARS.length)} className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">Next Familiar →</button>
      <button onClick={shakeFamiliar} className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">
        {beastStage === 3 ? 'Dawn reset' : 'Shake the Familiar (deliberate)'}
      </button>
    </div>
    <p className="text-xs text-stone-500 mt-2"><MapPin className="w-3 h-3 inline" /> Geo-anchored to a real place, region only. No exact location is stored, shown, or synced.</p>
  </div>
  );

  const guidePanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /><h3 className="font-bold">Talk to the Guide</h3></div>
    <p className="text-sm mt-2">{GUIDE_LINES[guideIdx]}</p>
    <button onClick={() => setGuideIdx((i) => (i + 1) % GUIDE_LINES.length)} className="mt-3 px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">Ask again</button>
  </div>
  );

  const gamesPanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><Gamepad2 className="w-4 h-4" /><h3 className="font-bold">Community Games — every 5 minutes</h3></div>
    <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
      A new community game starts every 5 minutes, on the clock — no waiting for
      a crowd, no sign-up queue. Every game is 3-player: you + 2 bots, rotating —
      never all 5 bots at once. All 5 companions are still in the Commons; only
      2 join any one game.
    </p>
    <p className="font-bold mt-3">Now playing: {currentGame.name}</p>
    <p className="text-sm text-stone-600 dark:text-stone-300">{currentGame.blurb}</p>
    <p className="text-sm mt-2">
      Next game: <strong>{nextGame.name}</strong> in{' '}
      <strong>{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</strong>
    </p>
    <p className="text-xs text-stone-500 mt-1">Playing now (3 players): you · {gameBots[0].name} · {gameBots[1].name}</p>
    <button
      onClick={() => setJoinedGame((j) => !j)}
      className="mt-3 px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold"
    >
      {joinedGame ? '✓ Joined — see you at the next game' : 'Join the next game'}
    </button>
    <p className="text-xs font-bold mt-2">Fair play: bots have no special powers and no code changing. Same rules, same timer, same moves as you — no hidden advantages.</p>
    <p className="text-xs text-stone-500 mt-1">Solo playtest: the 5-minute clock is real; the 2 bot players rotate each game, until live multiplayer sync exists.</p>

    <p className="text-2xl font-black mt-3">⏱ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')} left in this game</p>
    <CommunityGamePlayer
      key={gameIndex}
      gameName={currentGame.name}
      gameIndex={gameIndex}
      missionTitle={missionTitle}
      missionTagline={missionTagline}
      botNames={[gameBots[0].name, gameBots[1].name]}
      secondsElapsed={Math.floor((now % FIVE_MIN) / 1000)}
      secondsLeft={Math.floor(msToNext / 1000)}
      now={now}
      onLog={(msg) => setLog((l) => [msg, ...l].slice(0, 6))}
    />
  </div>
  );

  const broadcastPanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><Youtube className="w-4 h-4" /><h3 className="font-bold">World Broadcast</h3></div>
    <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
      A YouTube playlist playing in the world, so the Commons never feels empty.
      Solo playtest for now: this plays in <em>your</em> browser — it is not yet
      synced live to other visitors. Paste a playlist link below and it broadcasts here.
    </p>
    <p className="text-xs text-stone-500 mt-1">Default: the Master Broadcast — note it is private, so it only plays for its owner. Anyone can paste their own playlist link above to override it.</p>
    <div className="flex gap-2 mt-3">
      <input
        value={playlistInput}
        onChange={(e) => setPlaylistInput(e.target.value)}
        placeholder="Paste a YouTube playlist link…"
        className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-transparent text-sm font-bold"
      />
      <button
        onClick={() => {
          const m = /[?&]list=([^&#]+)/.exec(playlistInput);
          const id = m ? m[1] : playlistInput.trim();
          setPlaylistId(id);
          setPlaylistIndex(0);
          try { localStorage.setItem('torque-world-playlist', playlistInput); } catch { /* solo playtest */ }
        }}
        className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold"
      >
        Broadcast
      </button>
    </div>
    {playlistId !== MASTER_BROADCAST_ID && (
      <button
        onClick={() => {
          setPlaylistInput(MASTER_BROADCAST_URL);
          setPlaylistId(MASTER_BROADCAST_ID);
          setPlaylistIndex(0);
          try { localStorage.setItem('torque-world-playlist', MASTER_BROADCAST_URL); } catch { /* solo playtest */ }
        }}
        className="mt-2 text-xs font-bold underline"
      >
        ↩ Back to the Master Broadcast
      </button>
    )}
    {playlistId ? (
      <div className="mt-3 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10">
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setPlaylistIndex((i) => Math.max(0, i - 1))}
            disabled={isCommercial}
            className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold disabled:opacity-50"
          >
            ⏮ Previous song
          </button>
          <button
            onClick={() => setPlaylistIndex((i) => i + 1)}
            disabled={isCommercial}
            className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold disabled:opacity-50"
          >
            Skip song ⏭
          </button>
          {isCommercial && <span className="text-xs font-bold text-rose-600 self-center">Commercial — cannot be skipped. Music resumes after.</span>}
          <span className="text-xs text-stone-500 self-center">Song {playlistIndex + 1} in the playlist</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => vote('up')} aria-label="Thumbs up this song" className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">👍 {currentVotes.up}</button>
          <button onClick={() => vote('down')} aria-label="Thumbs down this song" className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">👎 {currentVotes.down}</button>
          <button onClick={() => setRequestOpen((o) => !o)} aria-label="Request a song" className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">＋ Request a song</button>
        </div>
        <p className="text-xs text-stone-500 mt-1">Monitor only: thumbs up/down are counted per song, saved locally. Nothing is auto-removed — votes never remove a song on their own. Only the owner editing the YouTube playlist itself removes a song.</p>
        {requestOpen && (
          <div className="mt-3 p-3 rounded-2xl border border-stone-200 dark:border-white/10 space-y-2">
            <p className="text-sm font-bold">Request a song</p>
            <input value={reqSong} onChange={(e) => setReqSong(e.target.value)} placeholder="Song title" className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-transparent text-sm font-bold" />
            <input value={reqArtist} onChange={(e) => setReqArtist(e.target.value)} placeholder="Artist (optional)" className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-transparent text-sm font-bold" />
            <input value={reqLink} onChange={(e) => setReqLink(e.target.value)} placeholder="YouTube link (optional)" className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-transparent text-sm font-bold" />
            <input value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Your name (optional)" className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-transparent text-sm font-bold" />
            <button
              onClick={() => {
                if (!reqSong.trim()) return;
                const next = [...requests, { song: reqSong.trim(), artist: reqArtist.trim(), link: reqLink.trim(), name: reqName.trim() }];
                setRequests(next);
                try { localStorage.setItem('torque-world-requests', JSON.stringify(next)); } catch { /* solo playtest */ }
                setReqSong(''); setReqArtist(''); setReqLink(''); setReqName('');
                setRequestOpen(false);
              }}
              className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold"
            >
              Send request
            </button>
          </div>
        )}
        {requests.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-black uppercase tracking-wider text-stone-500">Requested songs ({requests.length})</p>
            <ul className="text-sm mt-1 space-y-1">
              {requests.map((r, i) => (
                <li key={i}>· {r.song}{r.artist ? ` — ${r.artist}` : ''}{r.name ? ` (from ${r.name})` : ''}</li>
              ))}
            </ul>
          </div>
        )}
        <iframe
          key={`${playlistId}-${playlistIndex}`}
          title="World Broadcast — YouTube playlist"
          src={`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&index=${playlistIndex + 1}&autoplay=1}`}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    ) : (
      <p className="text-xs text-stone-500 mt-3">No playlist set yet — paste your playlist link above and tap Broadcast. (Ask Amber for the playlist link if you do not have one.)</p>
    )}
  </div>
  );

  const companionsPanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><HeartHandshake className="w-4 h-4" /><h3 className="font-bold">Never alone in here</h3></div>
    <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
      Five intelligence companions are always in the Commons with you — scripted
      bots in this playtest, not live AI sessions. They offer support as well as
      companionship: talk to one any time, even at 3am, even if you only want company.
    </p>
    <div className="flex flex-wrap gap-2 mt-3">
      {COMPANIONS.map((c, i) => (
        <button key={c.name} onClick={() => { setCompanionIdx(i); setCompanionLineIdx(0); }} className={`px-3 py-2 rounded-xl text-xs font-bold ${i === companionIdx ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950' : 'bg-stone-200 dark:bg-white/10'}`}>
          {c.name}
        </button>
      ))}
    </div>
    <p className="font-bold mt-3">{COMPANIONS[companionIdx].name} — <span className="font-normal text-stone-500">{COMPANIONS[companionIdx].role}</span></p>
    <p className="text-sm mt-1">“{COMPANIONS[companionIdx].lines[companionLineIdx]}”</p>
    <button onClick={() => setCompanionLineIdx((i) => (i + 1) % COMPANIONS[companionIdx].lines.length)} className="mt-3 px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">Talk more</button>
    <p className="text-xs text-stone-500 mt-2">Companions in the Commons right now: Torque · GPT · Cue · CreaO · Baxter — plus you. Nobody walks alone.</p>
  </div>
  );

  const walkLogPanel = (
  <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
    <div className="flex items-center gap-2"><Gamepad2 className="w-4 h-4" /><h3 className="font-bold">Your walk, so far</h3></div>
    <ul className="text-sm mt-2 space-y-1">
      {log.map((entry, i) => <li key={i}>· {entry}</li>)}
    </ul>
    <p className="text-xs text-stone-500 mt-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Solo playtest log — stays in this browser, not synced to the app.</p>
  </div>
  );
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!adultOk && <AdultConsentGate onConfirmed={() => setAdultOk(true)} />}
      <ExplicitContentBanner />
      <section className="rounded-3xl p-6 shadow-sm border-2 border-stone-800" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}22, ${theme.colors.secondary}22)` }}>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-600">
          TORQUE WORLD · SOLO PLAYTEST · NOT SYNCED
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mt-1">Off*Script World</h2>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-2xl">
          The world between worlds — somewhere between who you are and what&apos;s next.
          Walk it, meet a Familiar, take today&apos;s mission or skip it. Solo for now:
          what you do here stays in this browser. No login, no Wall/DM sync, no
          Familiar sync, no points, no streaks — yet.
        </p>
        <p className="text-xs text-stone-500 mt-2">
          {theme.editionLabel} · {theme.themeTitle} ({theme.keyword}) · {theme.colors.primary} / {theme.colors.secondary} / {theme.colors.accent}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={onBack} className="px-4 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">
            ← Back to Dashboard
          </button>
          <CoinBalance />
          <button onClick={() => setAvatarOpen(true)} className="px-4 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">
            {avatar ? 'Change my selfie avatar' : 'Create avatar from selfie'}
          </button>
          {avatar && (
            <span className="flex items-center gap-2 text-xs font-bold">
              <img src={avatar.image} alt={avatar.name} className="w-8 h-8 rounded-full object-cover border-2" style={{ borderColor: avatar.glow }} />
              {avatar.name}
            </span>
          )}
        </div>
        <SelfieAvatarCreator
          open={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          onSave={(a) => {
            setAvatar(a);
            try { localStorage.setItem('torque-world-avatar', JSON.stringify(a)); } catch { /* solo playtest: storage must never block */ }
            setLog((l) => [`${a.name} steps into the world.`, ...l].slice(0, 6));
          }}
        />
      </section>

      {/* Game clock banner — same in 2D and 3D: 1-minute warning, then a
          "starting now" announcement, then the countdown for the game now
          playing. Big and hard to miss on a phone. */}
      {justStarted ? (
        <div className="rounded-3xl border-2 border-amber-400 bg-amber-100 dark:bg-amber-900/40 p-4 text-center">
          <p className="text-lg font-black">🎮 {currentGame.name} is starting NOW!</p>
          <p className="text-sm">{currentGame.blurb}</p>
        </div>
      ) : showWarning ? (
        <div className="rounded-3xl border-2 border-rose-500 bg-rose-100 dark:bg-rose-900/40 p-4 text-center">
          <p className="text-lg font-black">⚠️ {nextGame.name} starts in {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')} — get ready!</p>
          <p className="text-sm">New game in 1 minute — join in time.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <span className="text-xl font-black">⏱ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</span>
          <span className="text-sm">left in <strong>{currentGame.name}</strong></span>
          <span className="text-xs text-stone-500">Next: {nextGame.name}</span>
        </div>
      )}

      {viewMode === '3d' ? (
        <section className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setMenuOpen(true)} className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold">
              ☰ World menu
            </button>
            <span className="text-xs text-stone-500">Mission, Familiars, Games &amp; Broadcast live in the menu — chat &amp; companions stay on screen.</span>
          </div>
          <React.Suspense fallback={<div className="rounded-3xl border border-stone-300 dark:border-white/10 p-6 text-sm font-bold">Loading the 3D walk…</div>}>
            <FirstPersonWorld
              pos={pos}
              onArrive={(x, y) => {
                if (x === pos.x && y === pos.y) return;
                const next = TILES.find((t) => t.x === x && t.y === y);
                setPos({ x, y });
                setLog((l) => [`You walk to ${next?.label ?? 'the wild'}.`, ...l].slice(0, 6));
              }}
              onExit={() => {
                setViewMode('2d');
                try { localStorage.setItem('torque-world-view-mode', '2d'); } catch { /* solo playtest */ }
              }}
            />
          </React.Suspense>
          <div className="grid md:grid-cols-2 gap-6">
            {guidePanel}
            {companionsPanel}
          </div>
          {menuOpen && (
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="World menu">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white dark:bg-[#0a0f1e] p-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">World menu</h3>
                  <button onClick={() => setMenuOpen(false)} className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">✕ Close</button>
                </div>
                {missionPanel}
                {familiarPanel}
                {gamesPanel}
                {broadcastPanel}
                {walkLogPanel}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4" />
            <h3 className="font-bold">Walk the world</h3>
            <span className="text-xs text-stone-500 ml-auto">Arrows, D-pad, or tap a tile</span>
          </div>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setViewMode('3d');
                try { localStorage.setItem('torque-world-view-mode', '3d'); } catch { /* solo playtest */ }
              }}
              className="px-3 py-2 bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 rounded-xl text-xs font-bold"
            >
              👁 First-person 3D — walk it yourself
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {TILES.map((t) => {
              const here = t.x === pos.x && t.y === pos.y;
              return (
                <button
                  key={`${t.x}-${t.y}`}
                  onClick={() => { setPos({ x: t.x, y: t.y }); setLog((l) => [`You walk to ${t.label}.`, ...l].slice(0, 6)); }}
                  title={t.label}
                  className={`aspect-square rounded-lg text-lg flex items-center justify-center border-2 transition-all ${here ? 'border-rose-500 bg-rose-100 dark:bg-rose-900/40 scale-110 z-10' : 'border-stone-200 dark:border-white/10 hover:border-stone-400'}`}
                >
                  {here ? '🧭' : t.emoji}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => move(-1, 0)} aria-label="Move left" className="p-3 rounded-xl bg-stone-200 dark:bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex flex-col gap-2">
              <button onClick={() => move(0, -1)} aria-label="Move up" className="p-3 rounded-xl bg-stone-200 dark:bg-white/10"><ArrowUp className="w-5 h-5" /></button>
              <button onClick={() => move(0, 1)} aria-label="Move down" className="p-3 rounded-xl bg-stone-200 dark:bg-white/10"><ArrowDown className="w-5 h-5" /></button>
            </div>
            <button onClick={() => move(1, 0)} aria-label="Move right" className="p-3 rounded-xl bg-stone-200 dark:bg-white/10"><ArrowRight className="w-5 h-5" /></button>
          </div>
          <p className="text-sm mt-4">
            <strong>You are at:</strong> {place.name} — {place.blurb}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{place.action}</p>
        </div>
        <div className="space-y-4">
          {missionPanel}
          {familiarPanel}
          {guidePanel}
          {gamesPanel}
          {broadcastPanel}
          {companionsPanel}
          {walkLogPanel}
        </div>
        </section>
      )}

      <section className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
        <h3 className="font-bold text-lg">🎮 Solo games — play anytime</h3>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">No waiting for the community clock, no bots, no pressure. Pick a game and start right now. Every game earns coins — your balance is up top.</p>
        <div className="mt-3">
          <SoloGamesPanel />
        </div>
      </section>
    </div>
  );
};
