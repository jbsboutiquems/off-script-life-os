import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { LIFE_AUDIT_AREAS, defaultAuditScores, type LifeAuditData } from '../../data/frontmatter';
import { FM_KEYS, loadFrontMatter, saveFrontMatter } from './storage';
import { SectionCard } from './SectionCard';
import type { FrontMatterSectionProps } from './props';

/** 06 — Life Audit. Honest 1–10 ratings across eight life areas, persisted per-user. */
export const LifeAuditSection: React.FC<FrontMatterSectionProps> = ({ user, onToast }) => {
  const [scores, setScores] = useState<Record<string, number>>(defaultAuditScores);
  const [lowestShift, setLowestShift] = useState('');
  const [highestProtection, setHighestProtection] = useState('');
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    const saved = loadFrontMatter<LifeAuditData>(user.id, FM_KEYS.lifeAudit);
    if (saved) {
      if (saved.scores) setScores({ ...defaultAuditScores(), ...saved.scores });
      if (saved.lowestShift) setLowestShift(saved.lowestShift);
      if (saved.highestProtection) setHighestProtection(saved.highestProtection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const average = (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1);

  const lowest = LIFE_AUDIT_AREAS.reduce((a, b) => (scores[a.id] <= scores[b.id] ? a : b));
  const highest = LIFE_AUDIT_AREAS.reduce((a, b) => (scores[a.id] >= scores[b.id] ? a : b));

  const handleSave = () => {
    saveFrontMatter(user.id, FM_KEYS.lifeAudit, { scores, lowestShift, highestProtection });
    setSavedTick(true);
    window.setTimeout(() => setSavedTick(false), 2000);
    if (onToast) onToast('Life Audit ratings logged.');
  };

  return (
    <SectionCard
      badge="06 — LIFE AUDIT"
      badgeClass="bg-[#2da2ee]"
      kicker={`RADICAL HONESTY · SCORE: ${average}/10`}
    >
      <div className="border-b border-stone-200 dark:border-white/10 pb-3">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
          Where Are You Right Now?
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Rate each area 1–10. No judgment. Pure honesty. (1 = Running on fumes · 10 = Thriving, no notes).
        </p>
      </div>

      <div className="space-y-3">
        {LIFE_AUDIT_AREAS.map((area) => {
          const current = scores[area.id] ?? 5;
          return (
            <div
              key={area.id}
              className="p-3.5 rounded-xl border border-stone-200 dark:border-white/10 bg-[#fdfbf7] dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas block">
                  ✦ {area.name}
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">{area.description}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setScores({ ...scores, [area.id]: num })}
                    className={`w-7 h-7 rounded-lg text-xs font-mono-code font-bold transition-all cursor-pointer ${
                      current === num
                        ? 'bg-[#ea4798] text-white scale-110 shadow-xs'
                        : 'bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-[#ea4798]/10 border border-[#ea4798]/30 space-y-1.5">
          <label className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas block">
            ◆ Lowest ({lowest.name}) — one micro-shift you can make:
          </label>
          <textarea
            value={lowestShift}
            onChange={(e) => setLowestShift(e.target.value)}
            placeholder="What small, tiny habit can shift this needle?"
            className="w-full p-2.5 rounded-xl border border-[#ea4798]/40 text-xs bg-white dark:bg-white/5 dark:text-stone-200 focus:outline-hidden"
            rows={2}
          />
        </div>
        <div className="p-4 rounded-2xl bg-[#2da2ee]/10 border border-[#2da2ee]/30 space-y-1.5">
          <label className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas block">
            ✦ Highest ({highest.name}) — what are you protecting?
          </label>
          <textarea
            value={highestProtection}
            onChange={(e) => setHighestProtection(e.target.value)}
            placeholder="What boundaries maintain this high score?"
            className="w-full p-2.5 rounded-xl border border-[#2da2ee]/40 text-xs bg-white dark:bg-white/5 dark:text-stone-200 focus:outline-hidden"
            rows={2}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-[#2da2ee] dark:hover:bg-[#1f8fd6] text-white rounded-xl text-xs font-mono-code font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{savedTick ? '✓ Saved' : 'Save Life Audit'}</span>
      </button>
    </SectionCard>
  );
};
