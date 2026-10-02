import React from 'react';
import { SectionCard } from './SectionCard';

/**
 * Tour Guide — the planner-page version of the author intro.
 * The full bio lives in the "Meet Your Tour Guide" door; this is the
 * condensed front-matter spread with the same portrait.
 */
export const TourGuideSection: React.FC = () => (
  <SectionCard badge="THE HUMAN BEHIND THE CHAOS" badgeClass="bg-[#2da2ee]" kicker="AUTHOR INTRO">
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-full md:w-56 rounded-2xl border-2 border-stone-800 dark:border-amber-400/40 bg-gradient-to-br from-[#ea4798] via-[#b13a8e] to-[#2da2ee] p-1 flex-shrink-0 shadow-md">
        <div className="w-full h-full bg-slate-900/90 rounded-xl p-4 flex flex-col items-center justify-center space-y-2">
          <img
            src="/amber-tour-guide-photo.png"
            alt="Amber, creator of Life OS: Off*Script"
            className="w-24 h-24 rounded-full object-cover object-top border-2 border-white"
          />
          <h4 className="font-bold font-serif-display text-white text-base">Amber Wiggins</h4>
          <span className="text-[10px] font-mono-code text-[#ea4798]">Creator of Life OS: Off*Script</span>
          <span className="text-[10px] font-mono-code text-stone-400">Libra · Question Asker</span>
        </div>
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
          Meet Your Tour Guide
        </h3>
        <p>
          I&apos;m Amber — creator of Life OS: Off*Script, professional question-asker, and the reason this planner has zero gold stars for burnout.
        </p>
        <p>
          I built the planner I couldn&apos;t find: one that assumes you&apos;re a whole adult with a beautifully irregular brain, not a productivity robot. No shame spirals. No &quot;just try harder.&quot; Just structure without the cage.
        </p>
        <p>
          This isn&apos;t a planner that hands you habits. It asks the questions only your soul can answer, then gets out of your way. Let&apos;s make 2027 the year we stop performing and start actually living.
        </p>
        <div className="pt-2 border-t border-stone-200 dark:border-white/10">
          <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#ea4798] block">
            Your slightly rebellious, light-hearted tour guide
          </span>
          <span className="font-serif-display italic text-base text-slate-900 dark:text-cream-canvas font-bold">
            with love, Amber
          </span>
        </div>
      </div>
    </div>
  </SectionCard>
);
