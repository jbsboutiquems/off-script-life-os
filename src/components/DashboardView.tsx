import React from 'react';
import { UserProfile } from '../types';
import {
  Compass, Star, Sparkles, Flame, Ban, Activity, BookOpen, DollarSign,
  Award, PartyPopper, Trophy, Users, HardDrive, KeyRound, Image as ImageIcon,
  ShieldAlert, DoorOpen, HeartHandshake, Megaphone, Inbox, Bell, Search,
  BookMarked, Clapperboard
} from 'lucide-react';

export type DashboardTab =
  | 'daily' | 'cosmic' | 'diagnostic' | 'goals' | 'antigoals' | 'trendline'
  | 'weekly' | 'money' | 'themes' | 'holidays' | 'points' | 'crew'
  | 'backup' | 'unlock' | 'cover' | 'identity' | 'tourguide'
  | 'wall' | 'inbox' | 'reminders' | 'search'
  | 'frontmatter' | 'studio';

interface DoorDef {
  id: DashboardTab;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // gradient classes for the icon tile
  badge?: string;
}

interface DashboardViewProps {
  user: UserProfile;
  pointsTotal: number;
  goalsCount: number;
  crewCount: number;
  streak: number;
  dueCount: number;
  unreadCount: number;
  onOpen: (tab: DashboardTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, pointsTotal, goalsCount, crewCount, streak, dueCount, unreadCount, onOpen }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const doors: DoorDef[] = [
    { id: 'daily', name: 'Daily Flight Log', description: 'Launch, orbit, landing. Today\'s mess, documented.', icon: Compass, accent: 'from-teal-500 to-teal-700' },
    { id: 'cosmic', name: 'The Cosmic Corner', description: 'Your horoscope + a natal chart drawn by the app, not the ephemeris.', icon: Star, accent: 'from-indigo-500 to-purple-700' },
    { id: 'diagnostic', name: 'Mei Diagnostic', description: 'The sassy mirror reads your field notes and tells the truth.', icon: Sparkles, accent: 'from-rose-500 to-pink-700' },
    { id: 'goals', name: 'Big 6 Goals', description: 'Six slots. No more. Choose like it matters.', icon: Flame, accent: 'from-amber-500 to-orange-700', badge: `${goalsCount}/6` },
    { id: 'antigoals', name: 'Anti-Goals', description: 'What you are officially done doing. Cross it out with feeling.', icon: Ban, accent: 'from-stone-500 to-stone-800' },
    { id: 'trendline', name: 'Chaos Trendline', description: 'Thirty days of dips and spikes. Find your sweet spot.', icon: Activity, accent: 'from-teal-500 to-emerald-700' },
    { id: 'weekly', name: 'Weekly Debrief', description: 'Eight questions. Zero performance-review energy.', icon: BookOpen, accent: 'from-teal-500 to-teal-700' },
    { id: 'money', name: 'Money Map', description: 'Where it went, minus the shame spiral.', icon: DollarSign, accent: 'from-emerald-500 to-green-700' },
    { id: 'themes', name: 'Annual Arc Themes', description: 'Twelve themes for the year\'s plot twists.', icon: Award, accent: 'from-pink-500 to-pink-700' },
    { id: 'holidays', name: 'Holiday Vault', description: 'Fourteen made-up holidays with real meaning.', icon: PartyPopper, accent: 'from-amber-400 to-rose-600' },
    { id: 'points', name: 'Chaos Points & Sharing', description: 'Proof you showed up — and a button to brag about it.', icon: Trophy, accent: 'from-yellow-500 to-amber-700', badge: `${pointsTotal}` },
    { id: 'wall', name: 'The Chaos Wall', description: 'Scream into the void, together.', icon: Megaphone, accent: 'from-pink-500 to-pink-700' },
    { id: 'inbox', name: 'Inbox', description: 'Private notes between you and your people.', icon: Inbox, accent: 'from-teal-500 to-teal-700', badge: unreadCount > 0 ? `${unreadCount}` : undefined },
    { id: 'reminders', name: 'Reminders', description: 'Gentle nudges for the flight log and the debrief.', icon: Bell, accent: 'from-amber-500 to-yellow-700', badge: dueCount > 0 ? `${dueCount}` : undefined },
    { id: 'search', name: 'Search', description: 'Find that brilliant 2am note wherever it hid.', icon: Search, accent: 'from-slate-500 to-stone-700' },
    { id: 'crew', name: 'Flight Crew', description: 'Your chosen co-conspirators. Vetted for loyalty, low drama, and good snacks.', icon: Users, accent: 'from-teal-500 to-teal-700', badge: `${crewCount}` },
    { id: 'backup', name: 'Drive Backup', description: 'Beam your chaos up to Google Drive. Future you says thanks.', icon: HardDrive, accent: 'from-slate-500 to-slate-800' },
    { id: 'unlock', name: 'Unlock Packs', description: 'Scan the secret QR. Unlock the goods. Feel like a spy.', icon: KeyRound, accent: 'from-lime-500 to-emerald-700' },
    { id: 'cover', name: 'Cover Art', description: 'The jacket. Stop and admire it.', icon: ImageIcon, accent: 'from-pink-500 to-pink-700' },
    { id: 'identity', name: 'Identity Base', description: 'Who is flying this thing — plus your birthday, for the stars.', icon: ShieldAlert, accent: 'from-pink-500 to-pink-700' },
    { id: 'tourguide', name: 'Meet Your Tour Guide', description: 'The human behind the chaos. Come say hi to Amber.', icon: HeartHandshake, accent: 'from-rose-500 to-amber-600' },
    { id: 'frontmatter', name: 'Front Matter Codex', description: 'The planner\u2019s first 14 pages \u2014 manifesto, one word, audit, permission slip, and your people.', icon: BookMarked, accent: 'from-pink-500 to-teal-600' },
    { id: 'studio', name: 'AI Studio', description: 'Backstage media lab: hype tracks, cover art, video renders.', icon: Clapperboard, accent: 'from-fuchsia-500 to-teal-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-stone-900 via-[#02142e] to-rose-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-stone-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 select-none pointer-events-none">✦</div>
        <div className="flex items-center gap-2 text-[10px] font-mono-code uppercase tracking-widest text-amber-300">
          <DoorOpen className="w-3.5 h-3.5" /> Mission control
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-serif-display mt-2">
          Pick a door, {user.chaos_name || 'operator'}. <span className="italic text-rose-300">Any door.</span>
        </h2>
        <p className="text-sm text-stone-300 mt-2 max-w-xl">
          {today} · Word of the year: <strong className="text-amber-300 uppercase">"{user.word_of_the_year || 'UNTAMED'}"</strong> ·
          {' '}<strong className="text-amber-300">{pointsTotal}</strong> chaos points in the vault.
        </p>
        <p className="text-xs text-stone-400 mt-1 italic">
          🔥 {streak === 1 ? '1 day of showing up. The streak is unhinged.' : `${streak} days of showing up. The streak is unhinged.`}
          {' '}No jumbled tabs. No decision fatigue. Just doors.
        </p>
      </div>

      {/* Doors grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {doors.map((door) => {
          const Icon = door.icon;
          return (
            <button
              key={door.id}
              onClick={() => onOpen(door.id)}
              className="group text-left bg-white dark:bg-[#02142e] border-2 border-stone-200 dark:border-white/10 hover:border-stone-800 dark:hover:border-amber-400/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${door.accent} text-white flex items-center justify-center shadow-sm border border-black/10`}>
                  <Icon className="w-5 h-5" />
                </div>
                {door.badge && (
                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                    {door.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-bold text-sm text-slate-900 dark:text-cream-canvas font-display-punch uppercase tracking-wide group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                {door.name}
              </h3>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {door.description}
              </p>
              <div className="mt-3 text-[11px] font-mono-code font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                Enter →
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 italic font-serif-display pb-2">
        "Ideas &gt; Rules. The system bends so you don't break."
      </p>
    </div>
  );
};
