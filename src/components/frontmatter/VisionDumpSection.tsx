import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { VISION_DUMP_AREAS } from '../../data/frontmatter';
import { FM_KEYS, loadFrontMatter, saveFrontMatter } from './storage';
import { SectionCard } from './SectionCard';
import type { FrontMatterSectionProps } from './props';

/** 04 — The Vision Dump. Eight unfiltered areas + a one-sentence capture. */
export const VisionDumpSection: React.FC<FrontMatterSectionProps> = ({ user, onToast }) => {
  const [items, setItems] = useState<Record<string, string>>({});
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    const saved = loadFrontMatter<Record<string, string>>(user.id, FM_KEYS.visionDump);
    if (saved) setItems(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSave = () => {
    saveFrontMatter(user.id, FM_KEYS.visionDump, items);
    setSavedTick(true);
    window.setTimeout(() => setSavedTick(false), 2000);
    if (onToast) onToast('Vision Dump saved to Life OS.');
  };

  return (
    <SectionCard badge="04 — THE VISION DUMP" badgeClass="bg-[#2da2ee]" kicker="WHAT 2027 LOOKS LIKE FROM HERE">
      <div className="border-b border-stone-200 dark:border-white/10 pb-3">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
          Unfiltered Vision
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Don&apos;t edit. Don&apos;t filter. Don&apos;t ask if it&apos;s realistic. Write what you WANT to feel, look, and be.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VISION_DUMP_AREAS.map((area) => (
          <div key={area.id} className="p-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-[#fdfbf7] dark:bg-white/5 space-y-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-[#ea4798] text-xs">✦</span>
              <h4 className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas">{area.title}</h4>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">{area.prompt}</p>
            <textarea
              value={items[area.id] || ''}
              onChange={(e) => setItems({ ...items, [area.id]: e.target.value })}
              placeholder={`Write your raw ${area.title} vision...`}
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-white/10 text-xs focus:ring-2 focus:ring-[#2da2ee] focus:outline-hidden bg-white dark:bg-white/5 dark:text-stone-200"
              rows={3}
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-[#2da2ee]/10 border border-[#2da2ee]/30 space-y-2">
        <label className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas block">
          ◆ One sentence that captures 2027:
        </label>
        <input
          type="text"
          value={items.one_sentence || ''}
          onChange={(e) => setItems({ ...items, one_sentence: e.target.value })}
          placeholder="e.g. 2027 is the year I stopped performing and started living."
          className="w-full p-3 rounded-xl border border-[#2da2ee]/40 text-xs font-medium focus:ring-2 focus:ring-[#2da2ee] focus:outline-hidden bg-white dark:bg-white/5 dark:text-stone-200"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-[#2da2ee] dark:hover:bg-[#1f8fd6] text-white rounded-xl text-xs font-mono-code font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{savedTick ? '✓ Saved' : 'Save Vision Dump'}</span>
      </button>
    </SectionCard>
  );
};
