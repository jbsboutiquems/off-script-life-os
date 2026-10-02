import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { DueReminder } from '../lib/reminders';
import { Bell, BellRing, CalendarDays, Sun, RefreshCw, Info } from 'lucide-react';

interface RemindersViewProps {
  user: UserProfile;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void> | void;
  onNavigate: (tab: 'dashboard') => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * In-app reminder settings. Honest caveat: the app can't tap your shoulder —
 * there's no push notification infrastructure in a self-hosted prototype.
 * Reminders fire as in-app nudges (dashboard bell + this room) when the app is open.
 */
export const RemindersView: React.FC<RemindersViewProps> = ({ user, onSaveProfile, onNavigate }) => {
  const [due, setDue] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dailyEnabled = !!user.reminder_daily_enabled;
  const dailyTime = user.reminder_daily_time || '20:00';
  const weeklyEnabled = !!user.reminder_weekly_enabled;
  const weeklyDay = typeof user.reminder_weekly_day === 'number' ? user.reminder_weekly_day : 0;
  const weeklyTime = user.reminder_weekly_time || '18:00';

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.getDueReminders();
      setDue(res.due || []);
    } catch {
      setDue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (patch: Partial<UserProfile>) => {
    setSaving(true);
    try {
      await onSaveProfile(patch);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const row = (key: string, label: string, sub: string) => (
    <div key={key} className="border-2 border-stone-800 dark:border-amber-400/30 rounded-xl p-3 bg-stone-50 dark:bg-white/5">
      <div className="flex items-center gap-2">
        {key.startsWith('daily') ? <Sun className="w-4 h-4 text-amber-500" /> : <CalendarDays className="w-4 h-4 text-indigo-500" />}
        <div className="font-bold text-sm text-slate-900 dark:text-cream-canvas">{label}</div>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas">
            Reminders
          </h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-50"
            title="Re-check what's due"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 italic font-serif-display">
          Gentle nudges, not alarms. They show up here and on the dashboard bell while the app is open.
        </p>

        {/* Due now */}
        <div className="mb-6">
          <h3 className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-2">
            Due right now
          </h3>
          {loading ? (
            <p className="text-xs text-stone-400">Checking…</p>
          ) : due.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-white/15 rounded-xl px-3 py-2.5">
              <Bell className="w-4 h-4" /> Nothing due. You're either on top of things or the reminders are off.
            </div>
          ) : (
            <div className="space-y-2">
              {due.map((d) =>
                row(d.id, d.title, d.detail)
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <h3 className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-3">
          Settings
        </h3>

        <div className="space-y-4">
          <div className="border-2 border-stone-800 dark:border-white/15 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-900 dark:text-cream-canvas">
              <input
                type="checkbox"
                checked={dailyEnabled}
                disabled={saving}
                onChange={(e) => save({ reminder_daily_enabled: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <Sun className="w-4 h-4 text-amber-500" /> Daily flight-log nudge
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-stone-400">at</span>
              <input
                type="time"
                value={dailyTime}
                disabled={!dailyEnabled || saving}
                onChange={(e) => save({ reminder_daily_time: e.target.value })}
                className="px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas disabled:opacity-50"
              />
              <span className="text-xs text-stone-400 dark:text-stone-500">if you haven't logged today</span>
            </div>
          </div>

          <div className="border-2 border-stone-800 dark:border-white/15 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-900 dark:text-cream-canvas">
              <input
                type="checkbox"
                checked={weeklyEnabled}
                disabled={saving}
                onChange={(e) => save({ reminder_weekly_enabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              <CalendarDays className="w-4 h-4 text-indigo-500" /> Weekly debrief nudge
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-stone-500 dark:text-stone-400">every</span>
              <select
                value={weeklyDay}
                disabled={!weeklyEnabled || saving}
                onChange={(e) => save({ reminder_weekly_day: Number(e.target.value) })}
                className="px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas disabled:opacity-50"
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
              <span className="text-xs text-stone-500 dark:text-stone-400">at</span>
              <input
                type="time"
                value={weeklyTime}
                disabled={!weeklyEnabled || saving}
                onChange={(e) => save({ reminder_weekly_time: e.target.value })}
                className="px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas disabled:opacity-50"
              />
              <span className="text-xs text-stone-400 dark:text-stone-500">if the debrief's missing</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 text-[11px] text-stone-400 dark:text-stone-500 italic">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            Honest caveat: this is a self-hosted prototype — it can't push notifications to your phone while closed.
            True push needs whoever runs the server to wire up push infrastructure. These nudges fire in-app while you're here.
          </p>
        </div>
      </div>

      {due.length > 0 && (
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <BellRing className="w-4 h-4" /> Back to the dashboard — go log something
        </button>
      )}
    </div>
  );
};
