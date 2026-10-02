import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { CORE_VALUE_META } from '../../data/frontmatter';
import { SectionCard } from './SectionCard';
import type { FrontMatterSectionProps } from './props';
import type { UserProfile } from '../../types';

type CoreValues = UserProfile['core_values'];

function blankValues(): CoreValues {
  return { autonomy: 5, honesty: 5, creativity: 5, presence: 5, resilience: 5, playfulness: 5, rest: 5, discipline: 5 };
}

/**
 * 05 — Values. Rates the eight core values that live on the user profile
 * (shared with Identity Base). This section never existed as a built tab in
 * the source app — it was stubbed in the section type but had no UI — so it
 * is built here from the profile's `core_values` shape.
 */
export const ValuesSection: React.FC<FrontMatterSectionProps> = ({ user, onSaveProfile, onToast }) => {
  const [values, setValues] = useState<CoreValues>(() => ({ ...blankValues(), ...(user.core_values || {}) }));
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    setValues({ ...blankValues(), ...(user.core_values || {}) });
  }, [user.core_values]);

  const topThree = [...CORE_VALUE_META]
    .sort((a, b) => values[b.key] - values[a.key])
    .slice(0, 3);

  const handleSave = () => {
    onSaveProfile({ core_values: values });
    setSavedTick(true);
    window.setTimeout(() => setSavedTick(false), 2000);
    if (onToast) onToast('Core values locked in.');
  };

  return (
    <SectionCard badge="05 — CORE VALUES" kicker="VALUES BEFORE PERFORMANCE">
      <div className="border-b border-stone-200 dark:border-white/10 pb-3">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
          What Actually Runs the Show
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Rate how much each value drives your decisions right now, 1–10. No aspirational answers — score the truth.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#ea4798]/10 border border-[#ea4798]/30">
        <span className="text-[10px] font-mono-code uppercase font-bold text-[#ea4798] block mb-1">
          Your current top 3 drivers
        </span>
        <div className="flex flex-wrap gap-2">
          {topThree.map((v, i) => (
            <span key={v.key} className="text-xs font-mono-code font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#ea4798]/40 text-slate-900 dark:text-cream-canvas">
              {i + 1}. {v.label} <span className="text-[#ea4798]">{values[v.key]}/10</span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {CORE_VALUE_META.map((v) => (
          <div key={v.key} className="p-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-[#fdfbf7] dark:bg-white/5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas block">
                  ✦ {v.label}
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">{v.description}</span>
              </div>
              <span className="text-2xl font-black font-serif-display text-[#ea4798] w-12 text-right">
                {values[v.key]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={values[v.key]}
              onChange={(e) => setValues({ ...values, [v.key]: Number(e.target.value) })}
              className="w-full accent-[#ea4798] cursor-pointer"
              aria-label={`${v.label} rating`}
            />
            <div className="flex justify-between text-[10px] font-mono-code text-stone-400">
              <span>1 · background noise</span>
              <span>10 · non-negotiable</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-[#ea4798] dark:hover:bg-[#d63a85] text-white rounded-xl text-xs font-mono-code font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{savedTick ? '✓ Saved' : 'Save Core Values'}</span>
      </button>
    </SectionCard>
  );
};
