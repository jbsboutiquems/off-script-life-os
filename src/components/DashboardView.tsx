import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getYearScheme } from '../lib/yearScheme';
import { apiUrl } from '../services/api';
import {
  Compass, Star, Flame, Ban, Activity, BookOpen, DollarSign,
  Award, PartyPopper, Trophy, Image as ImageIcon,
  DoorOpen, HeartHandshake, Users,
  BookMarked, Clapperboard, Globe, ShieldAlert
} from 'lucide-react';

export type DashboardTab =
  | 'daily' | 'cosmic' | 'diagnostic' | 'goals' | 'antigoals' | 'trendline'
  | 'weekly' | 'money' | 'themes' | 'holidays' | 'points' | 'crew'
  | 'backup' | 'unlock' | 'cover' | 'identity' | 'tourguide'
  | 'wall' | 'inbox' | 'reminders' | 'search'
  | 'frontmatter' | 'studio' | 'field' | 'expansions' | 'faq' | 'admin'
  | 'torqueworld' | 'profile' | 'settings' | 'world';

interface DoorDef {
  id: DashboardTab;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // gradient classes for the icon tile
  badge?: string;
}

export interface TodayMissionSummary {
  morningIntention: string;
  middayCheckin: string;
  eveningNotes: string;
  khaosScore: number;
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
  /** Today's Launch / Orbit / Landing summary, if the caller has it. */
  todayMission?: TodayMissionSummary | null;
  /** Whether the server has the AI Studio configured. Defaults true so
      existing callers don't break; pass false to hide the AI Studio door
      (the studio view itself only renders when configured, so an
      unconditional door would open a blank page). */
  studioConfigured?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, pointsTotal, goalsCount, crewCount, streak, dueCount, unreadCount, onOpen, todayMission, studioConfigured = true }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const yearScheme = getYearScheme(new Date().getFullYear());

  // User count (2026-11-06, staged for Amber's review): registered accounts
  // from the public stats endpoint. Fails gracefully — if the endpoint is
  // unreachable the line simply doesn't render, and the dashboard never
  // breaks over it. Live count only: it can reset on restart until a
  // volume is attached, so it is not a permanent total.
  const [accountCount, setAccountCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/public/stats'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.accountCount === 'number') {
          setAccountCount(data.accountCount);
        }
      })
      .catch(() => { /* unreachable — leave the line hidden */ });
    return () => { cancelled = true; };
  }, []);

  // 2026-11-01 (Amber's red-X cleanup): Inbox, the Intent, Khaos Wall,
  // Reminders, Search, Flight Crew, Drive Backup and Unlock Packs are
  // removed from the doors grid. Daily Flight Log stays — its mark was
  // unclarified. The underlying tabs still exist (see App.tsx); removing
  // them from header/menu navigation is a separate, flagged decision.
  // 2026-11-13 (finding 11 fix): Identity Base is restored to the grid —
  // it had no navigation path anywhere after the cleanup, and the
  // IdentityProfileView tab still exists in App.tsx. Restored verbatim
  // from its pre-removal door (label, description, icon, accent).
  const doors: DoorDef[] = [
    { id: 'daily', name: 'Daily Flight Log', description: 'Launch, orbit, landing. Today\'s mess, documented.', icon: Compass, accent: 'from-teal-500 to-teal-700' },
    { id: 'cosmic', name: 'The Cosmic Corner', description: 'Your horoscope + a natal chart drawn by the app, not the ephemeris.', icon: Star, accent: 'from-indigo-500 to-purple-700' },
    { id: 'goals', name: 'Big 6 Goals', description: 'Six slots. No more. Choose like it matters.', icon: Flame, accent: 'from-amber-500 to-orange-700', badge: `${goalsCount}/6` },
    { id: 'antigoals', name: 'Anti-Goals', description: 'What you are officially done doing. Cross it out with feeling.', icon: Ban, accent: 'from-stone-500 to-stone-800' },
    { id: 'trendline', name: 'Khaos Trendline', description: 'Thirty days of dips and spikes. Find your sweet spot.', icon: Activity, accent: 'from-teal-500 to-emerald-700' },
    { id: 'weekly', name: 'Weekly Debrief', description: 'Eight questions. Zero performance-review energy.', icon: BookOpen, accent: 'from-teal-500 to-teal-700' },
    { id: 'money', name: 'Money Map', description: 'Where it went, minus the shame spiral.', icon: DollarSign, accent: 'from-emerald-500 to-green-700' },
    { id: 'themes', name: 'Annual Arc Themes', description: 'Twelve themes for the year\'s plot twists.', icon: Award, accent: 'from-pink-500 to-pink-700' },
    { id: 'holidays', name: 'Holiday Vault', description: 'Seventeen made-up holidays with real meaning.', icon: PartyPopper, accent: 'from-amber-400 to-rose-600' },
    { id: 'points', name: 'Khaos Points & Sharing', description: 'Proof you showed up — and a button to brag about it.', icon: Trophy, accent: 'from-yellow-500 to-amber-700', badge: `${pointsTotal}` },
    { id: 'cover', name: 'Cover Art', description: 'The jacket. Stop and admire it.', icon: ImageIcon, accent: 'from-pink-500 to-pink-700' },
    { id: 'identity', name: 'Identity Base', description: 'Who is flying this thing — plus your birthday, for the stars.', icon: ShieldAlert, accent: 'from-pink-500 to-pink-700' },
    { id: 'tourguide', name: 'Meet Your Tour Guide', description: 'The human behind the khaos. Come say hi to Amber.', icon: HeartHandshake, accent: 'from-rose-500 to-amber-600' },
    { id: 'frontmatter', name: 'Front Matter Codex', description: 'The planner\u2019s front matter, pages 01–06, 09–10 \u2014 manifesto, one word, audit, permission slip, and your people.', icon: BookMarked, accent: 'from-pink-500 to-teal-600' },
    // AI Studio door only when the server has it configured (finding: the
    // studio view renders only when studioConfigured, so an unconditional
    // door opened a blank page). App.tsx must pass studioConfigured.
    ...(studioConfigured ? [{ id: 'studio', name: 'AI Studio', description: 'Backstage media lab: hype tracks, cover art, video renders.', icon: Clapperboard, accent: 'from-fuchsia-500 to-teal-600' } as DoorDef] : []),
    // 2026-11-01 staged doorway: the Inbetween playtest world, embedded.
    // A doorway, NOT a connection — live playtest, app not connected.
    // No existing door was removed to make room for it.
    { id: 'world', name: 'The Inbetween', description: 'Step into the playtest world. Solo, local-only — not connected to the app yet.', icon: Globe, accent: 'from-teal-500 to-rose-600', badge: 'PLAYTEST' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Today's mission FIRST (Amber, 2026-10-29) — before the doors list.
          This is an entry point into the DAILY tab's Launch / Orbit / Landing
          pages, not a second editor: the daily pages themselves live in
          DailyOSView, and embedding a copy here would risk double-saves. */}
      <section className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-600">
              Today's mission · Daily pages
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1">
              {today}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Launch (morning) · Orbit (midday) · Landing (evening) — plus your khaos score.
              {todayMission ? (
                <>
                  {' '}Launch: {todayMission.morningIntention ? 'set' : 'not set yet'} · Orbit: {todayMission.middayCheckin ? 'checked in' : 'not yet'} · Landing: {todayMission.eveningNotes ? 'written' : 'not yet'} · Khaos {todayMission.khaosScore}/10.
                </>
              ) : (
                <> Open the daily pages to fill them in.</>
              )}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {yearScheme.label} scheme: {yearScheme.paletteLabel}
            </p>
          </div>
          <button
            onClick={() => onOpen('daily')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            Open today's pages →
          </button>
        </div>
      </section>

      {/* Hero */}
      <div className="bg-gradient-to-br from-stone-900 via-[#02142e] to-rose-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-stone-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 select-none pointer-events-none">✦</div>
        <div className="flex items-center gap-2 text-[10px] font-mono-code uppercase tracking-widest text-amber-300">
          <DoorOpen className="w-3.5 h-3.5" /> Mission control
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-serif-display mt-2">
          Pick a door, {user.khaos_name || 'operator'}. <span className="italic text-rose-300">Any door.</span>
        </h2>
        <p className="text-sm text-stone-300 mt-2 max-w-xl">
          {today} · Word of the year: <strong className="text-amber-300 uppercase">"{user.word_of_the_year || 'UNTAMED'}"</strong> ·
          {' '}<strong className="text-amber-300">{pointsTotal}</strong> khaos points in the vault.
        </p>
        <p className="text-xs text-stone-400 mt-1 italic">
          🔥 {streak === 1 ? '1 day of showing up. The streak is unhinged.' : `${streak} days of showing up. The streak is unhinged.`}
          {' '}No jumbled tabs. No decision fatigue. Just doors.
        </p>
        {accountCount !== null && (
          <p className="text-xs text-teal-300 mt-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {accountCount} {accountCount === 1 ? 'person' : 'people'} in the Khaos Krew — registered users and counting.
          </p>
        )}
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
