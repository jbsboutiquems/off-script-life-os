import React, { useState } from 'react';
import { ChaosPointEntry, CHAOS_POINT_VALUES, ChaosPointAction } from '../types';
import { Trophy, Zap, Flame, BookOpen, Ban, Target, Sparkles, Share2, Compass, Check } from 'lucide-react';
import { computeStreak, streakCopy } from '../lib/streaks';
import { api } from '../services/api';

const ACTION_META: Record<ChaosPointAction, { label: string; blurb: string; icon: React.ReactNode }> = {
  daily_log: { label: 'Daily Flight Log', blurb: 'Showed up and logged the day.', icon: <Compass className="w-4 h-4" /> },
  micro_dare: { label: 'Micro-Dare Completed', blurb: 'Did the small unruly thing.', icon: <Zap className="w-4 h-4" /> },
  weekly_debrief: { label: 'Weekly Flight Debrief', blurb: 'Reviewed the wreckage honestly.', icon: <BookOpen className="w-4 h-4" /> },
  antigoal_quashed: { label: 'Anti-Goal Quashed', blurb: 'Stopped doing the thing. Elite.', icon: <Ban className="w-4 h-4" /> },
  goal_completed: { label: 'Goal Completed', blurb: 'Big 6 slot conquered.', icon: <Target className="w-4 h-4" /> },
  diagnostic_run: { label: 'Mei Diagnostic', blurb: 'Faced the honest mirror.', icon: <Sparkles className="w-4 h-4" /> },
  share_fired: { label: 'Shared the Chaos', blurb: 'Put it out into the world.', icon: <Share2 className="w-4 h-4" /> },
};

interface ChaosPointsViewProps {
  points: ChaosPointEntry[];
  entryDates?: string[];
  onRefresh?: () => void;
}

export const ChaosPointsView: React.FC<ChaosPointsViewProps> = ({ points, entryDates = [], onRefresh }) => {
  const total = points.reduce((s, p) => s + p.points, 0);
  const sorted = [...points].sort((a, b) => b.awarded_at.localeCompare(a.awarded_at));

  const rank = total >= 500 ? 'CHAOS ROYALTY' : total >= 250 ? 'CERTIFIED MENACE' : total >= 100 ? 'RISING UNRULY' : total >= 25 ? 'WARMING UP' : 'FRESH OFF THE SCRIPT';

  const streak = computeStreak(entryDates, new Date().toISOString().split('T')[0]);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const shareChaos = async () => {
    setShareError(null);
    const text = `I'm at ${total} Chaos Points (${rank}) on the Off*Script Life OS with a ${streak}-day streak. Structure without the cage. ⚡`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Chaos Points', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } else {
        throw new Error('No share sheet or clipboard available.');
      }
      try {
        await api.awardPoints('share_fired', `share_fired:${new Date().toISOString().split('T')[0]}`, 'Shared the Chaos');
      } catch { /* points are a bonus, not the point */ }
      onRefresh?.();
    } catch (e: any) {
      if (e?.name !== 'AbortError') setShareError(e?.message || 'Sharing failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Total banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 rounded-3xl p-6 text-white border-2 border-stone-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] font-mono-code uppercase tracking-widest text-amber-200">Chaos Points Balance</div>
              <div className="text-4xl font-black font-display-punch">{total}</div>
              <div className="text-xs font-mono-code uppercase tracking-wider text-white/80 mt-1">
                Rank: <span className="font-bold text-amber-300">{rank}</span>
              </div>
              <div className="text-xs text-white/90 mt-1 italic font-serif-display">
                🔥 {streakCopy(streak)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={shareChaos}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold rounded-xl transition-all"
            >
              {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {shared ? 'Copied — go brag' : 'Share the chaos'}
            </button>
            <p className="text-xs text-white/80 max-w-xs text-center italic font-serif-display">
              "Points for proof of life. Not for perfection — for showing up off-script."
            </p>
          </div>
        </div>
        {shareError && (
          <p className="mt-3 text-xs font-semibold text-white/90 bg-black/20 rounded-lg px-3 py-2">{shareError}</p>
        )}
      </div>

      {/* How points are earned */}
      <div className="bg-white border border-stone-300 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-mono-code font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-600" /> Earning Chart
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(Object.keys(CHAOS_POINT_VALUES) as ChaosPointAction[]).map((action) => {
            const meta = ACTION_META[action];
            return (
              <div key={action} className="border border-stone-200 rounded-xl p-3 bg-stone-50">
                <div className="flex items-center gap-2 text-slate-900">
                  <span className="text-rose-600">{meta.icon}</span>
                  <span className="text-xs font-bold">{meta.label}</span>
                </div>
                <div className="mt-1 text-lg font-black font-display-punch text-amber-600">+{CHAOS_POINT_VALUES[action]}</div>
                <div className="text-[11px] text-stone-500">{meta.blurb}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white border border-stone-300 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-mono-code font-bold uppercase tracking-widest text-stone-500 mb-3">
          Ledger · {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
        </h4>
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-stone-500">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-medium">No points yet. Go log a day, quash a habit, finish a thing.</p>
            <p className="text-xs mt-1 italic font-serif-display">The ledger is patient. It can wait. Barely.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {sorted.map((p) => {
              const meta = ACTION_META[p.action];
              return (
                <div key={p.id} className="flex items-center justify-between border border-stone-200 rounded-xl px-3 py-2.5 bg-stone-50/60 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      {meta?.icon || <Zap className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{p.label}</div>
                      <div className="text-[11px] text-stone-500 font-mono-code">
                        {new Date(p.awarded_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black font-display-punch text-emerald-700 flex-shrink-0">+{p.points}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
