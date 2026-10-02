import React from 'react';
import { SectionCard } from './SectionCard';

const PILLARS: { glyph: string; glyphClass: string; cardClass: string; borderClass: string; title: string; text: string }[] = [
  {
    glyph: '✦',
    glyphClass: 'text-[#ea4798]',
    cardClass: 'bg-[#ea4798]/10 dark:bg-[#ea4798]/15',
    borderClass: 'border-[#ea4798]/30',
    title: 'Build it for who you actually are.',
    text: 'A whole adult with a beautifully irregular brain, not a robotic assembly line.'
  },
  {
    glyph: '■',
    glyphClass: 'text-[#2da2ee]',
    cardClass: 'bg-[#2da2ee]/10 dark:bg-[#2da2ee]/15',
    borderClass: 'border-[#2da2ee]/30',
    title: 'Not who you planned to be in January.',
    text: 'You are allowed to evolve mid-month and discard what no longer fits.'
  },
  {
    glyph: '✧',
    glyphClass: 'text-[#ea4798]',
    cardClass: 'bg-[#ea4798]/10 dark:bg-[#ea4798]/15',
    borderClass: 'border-[#2da2ee]/30',
    title: 'Not who the algorithm wants you to be.',
    text: 'Zero gold stars for burnout. Zero sticker packs for feeling behind.'
  }
];

/** 01 — The Manifesto. Static: the founding argument of the planner. */
export const ManifestoSection: React.FC = () => (
  <SectionCard badge="01 — THE MANIFESTO" badgeClass="bg-stone-900" kicker="NOT A VIBE BOARD">
    <div className="space-y-4 border-l-4 border-[#ea4798] pl-4 sm:pl-6">
      <h1 className="text-3xl sm:text-5xl font-black font-serif-display text-slate-900 dark:text-cream-canvas tracking-tight leading-none">
        This Is Not That Kind of Planner.
      </h1>
      <p className="text-sm sm:text-base font-bold text-[#ea4798] font-mono-code">
        Stop performing productivity. Start designing your life.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {PILLARS.map((p) => (
        <div key={p.title} className={`p-4 rounded-2xl border ${p.cardClass} ${p.borderClass}`}>
          <span className={`text-base block mb-1 ${p.glyphClass}`}>{p.glyph}</span>
          <p className="font-bold font-serif-display text-slate-900 dark:text-cream-canvas text-sm">{p.title}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{p.text}</p>
        </div>
      ))}
    </div>

    <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-stone-300 dark:border-white/10 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-3 font-sans">
      <p>
        There are no sticker packs for being behind. No gold stars for burnout. No shame spirals
        built into the margins — we already have enough of those living rent-free in our heads.
      </p>
      <p className="font-semibold text-slate-900 dark:text-cream-canvas">
        This is the 2027 Life OS: Off*Script. A system, not a sentence. It bends. It resets. It survives the weeks you forget it.
      </p>
      <p className="italic text-stone-600 dark:text-stone-400">
        You don&apos;t have to optimize. You have to keep going. Different. Honest. Off*Script. Boredom=Death.
      </p>
    </div>
  </SectionCard>
);
