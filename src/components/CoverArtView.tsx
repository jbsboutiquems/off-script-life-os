import React from 'react';
import { ArrowRight, BookOpen, Compass, Flame, Sparkles } from 'lucide-react';

interface CoverArtViewProps {
  onOpenDaily: () => void;
  wordOfTheYear?: string;
  chaosName?: string;
  slogan?: string;
}

export const CoverArtView: React.FC<CoverArtViewProps> = ({
  onOpenDaily,
  wordOfTheYear = 'FERAL',
  chaosName = 'Unruly Sovereign',
  slogan = 'Boredom=Death'
}) => {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-2 py-4 sm:px-4">
      <div className="ink-panel flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[var(--ink)] px-4 py-2 text-xs shadow-[5px_5px_0_var(--pink)]">
        <div className="flex items-center gap-2 font-mono-code font-bold uppercase tracking-wider">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--pink)]" />
          <span>2027 Life OS · Off*Script</span>
        </div>
        <span className="font-mono-code font-bold uppercase text-[var(--yellow)]">Ideas &gt; Rules</span>
      </div>

      <section className="cover-art-frame mx-auto max-w-3xl">
        <img
          src="/assets/off-script-2027-cover.jpg"
          alt="2027 Life OS Off*Script Planner cover with a UFO, heart, brain, stars, and colorful hand-drawn collage marks"
          className="cover-art-image"
        />
      </section>

      <section className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border-2 border-[var(--ink)] bg-[var(--paper-light)] p-6 shadow-[7px_8px_0_var(--yellow)] sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[var(--pink)] bg-white px-3 py-1 font-mono-code text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--pink)]">
            <Sparkles className="h-3.5 w-3.5" /> Official digital companion
          </div>
          <h1 className="font-display-punch text-4xl font-black uppercase leading-[0.92] tracking-tight text-[var(--ink)] sm:text-6xl">
            Make room for <span className="text-[var(--pink)]">the real</span> year.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
            A flexible operating system for daily launches, honest field notes, unruly goals, and the moments that refuse to fit the plan.
          </p>
          <button
            onClick={onOpenDaily}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink)] bg-[var(--pink)] px-6 py-3.5 font-display-punch text-sm font-black uppercase tracking-wide text-white shadow-[5px_5px_0_var(--ink)] transition hover:-translate-y-0.5 hover:bg-[var(--orange)] hover:shadow-[7px_7px_0_var(--ink)]"
          >
            <BookOpen className="h-5 w-5" /> Open Daily OS <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="ink-panel rounded-3xl border-2 border-[var(--ink)] p-6 shadow-[7px_8px_0_var(--teal)] sm:p-8">
          <p className="font-mono-code text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--yellow)]">Operator card</p>
          <h2 className="mt-2 font-serif-display text-3xl font-bold text-white">{chaosName}</h2>
          <div className="mt-5 space-y-3 border-t border-white/20 pt-5 font-mono-code text-xs text-stone-200">
            <p><span className="text-[var(--yellow)]">WORD:</span> “{wordOfTheYear}”</p>
            <p><span className="text-[var(--pink)]">SLOGAN:</span> “{slogan}”</p>
            <p><span className="text-[var(--teal)]">RULE:</span> Stop performing productivity.</p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wide">
            <div className="rounded-xl bg-[var(--orange)] px-2 py-3 text-white"><Flame className="mx-auto mb-1 h-4 w-4" />Rant</div>
            <div className="rounded-xl bg-[var(--teal)] px-2 py-3 text-white"><Compass className="mx-auto mb-1 h-4 w-4" />Orbit</div>
            <div className="rounded-xl bg-[var(--purple)] px-2 py-3 text-white"><Sparkles className="mx-auto mb-1 h-4 w-4" />Mirror</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
        {[
          ['01. Launch', 'One intention, one stance, three priorities, and a question worth carrying.', 'var(--pink)'],
          ['02. Orbit', 'A midday check-in and a small dare to break the autopilot loop.', 'var(--orange)'],
          ['03. Landing', 'The Rant Box becomes honest data for reflection, not a productivity scorecard.', 'var(--teal)']
        ].map(([title, body, accent]) => (
          <div key={title} className="rounded-2xl border-2 border-[var(--ink)] bg-[var(--paper-light)] p-4 shadow-[4px_4px_0_var(--ink)]">
            <div className="mb-1 font-display-punch text-sm font-black uppercase" style={{ color: accent }}>{title}</div>
            <p className="leading-6 text-[var(--ink-soft)]">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
