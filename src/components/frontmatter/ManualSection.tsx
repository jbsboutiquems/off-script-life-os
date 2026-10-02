import React from 'react';
import { MANUAL_STEPS } from '../../data/frontmatter';
import { SectionCard } from './SectionCard';
import type { FrontMatterViewProps } from './props';

interface ManualSectionProps {
  onNavigateToGoals?: FrontMatterViewProps['onNavigateToGoals'];
  onNavigateToDaily?: FrontMatterViewProps['onNavigateToDaily'];
}

/** 02 — The Operating Manual. Static how-it-works steps with optional nav buttons. */
export const ManualSection: React.FC<ManualSectionProps> = ({ onNavigateToGoals, onNavigateToDaily }) => (
  <SectionCard
    badge="02 — THE OPERATING MANUAL"
    badgeClass="bg-[#2da2ee]"
    kicker="THE SYSTEM BENDS SO YOU DON'T BREAK"
  >
    <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
      How This Works
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
      {MANUAL_STEPS.map((rule) => (
        <div key={rule.num} className="p-4 rounded-2xl border border-stone-300 dark:border-white/10 bg-[#faf8f4] dark:bg-white/5 flex gap-3">
          <span className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-[#ea4798] text-white font-mono-code font-bold flex items-center justify-center flex-shrink-0 text-xs">
            {rule.num}
          </span>
          <div>
            <h4 className="font-mono-code font-bold text-slate-900 dark:text-cream-canvas text-xs uppercase">{rule.title}</h4>
            <p className="text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">{rule.text}</p>
          </div>
        </div>
      ))}
    </div>

    {(onNavigateToGoals || onNavigateToDaily) && (
      <div className="flex gap-3 pt-2 flex-wrap">
        {onNavigateToGoals && (
          <button
            type="button"
            onClick={onNavigateToGoals}
            className="px-4 py-2.5 bg-stone-900 hover:bg-black dark:bg-[#ea4798] dark:hover:bg-[#d63a85] text-white rounded-xl text-xs font-mono-code font-bold transition-all shadow-sm cursor-pointer"
          >
            Go to Big 6 Goals
          </button>
        )}
        {onNavigateToDaily && (
          <button
            type="button"
            onClick={onNavigateToDaily}
            className="px-4 py-2.5 bg-[#2da2ee] hover:bg-[#1f8fd6] text-white rounded-xl text-xs font-mono-code font-bold transition-all shadow-sm cursor-pointer"
          >
            Go to Today&apos;s Log
          </button>
        )}
      </div>
    )}
  </SectionCard>
);
