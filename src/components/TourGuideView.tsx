import React from 'react';
import { Heart } from 'lucide-react';

export const TourGuideView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm text-center">
        <span className="inline-block bg-rose-600 text-white text-[10px] font-mono-code font-bold uppercase px-2.5 py-1 rounded tracking-widest">
          The human behind the chaos
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-2">
          Meet Your Tour Guide
        </h2>
      </div>

      {/* Photo + bio */}
      <div className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 items-start">
          {/* Framed photo */}
          <figure className="mx-auto w-full max-w-[300px]">
            <div className="rounded-2xl p-2 bg-gradient-to-br from-rose-500 via-amber-400 to-teal-400 shadow-md">
              <img
                src="/amber-tour-guide-photo.png"
                alt="Amber, creator of Life OS: Off*Script"
                className="rounded-xl w-full aspect-[3/4] object-cover object-top bg-stone-900"
              />
            </div>
            <figcaption className="text-center text-[11px] font-mono-code uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-2">
              Your guide, in the wild
            </figcaption>
          </figure>

          {/* Bio */}
          <div className="space-y-4 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 font-serif-display">
            <p>
              I'm Amber -- creator of Life OS: Off*Script, professional question-asker, and the reason this planner has zero gold stars for burnout.
            </p>
            <p>
              I built the planner I couldn't find: one that assumes you're a whole adult with a beautifully irregular brain, not a productivity robot. No shame spirals. No "just try harder." Just structure without the cage.
            </p>
            <p>
              By day I run Snoopy's Closet, write a book, and design systems for people who hate systems. Off-duty I'm deep-conditioning this pink-and-blue hair, pulling tarot, and reading natal charts. I'm a Libra -- I'll charm you, then absolutely call you out.
            </p>
            <p>
              This isn't a planner that hands you habits. It asks the questions only your soul can answer, then gets out of your way. Let's make 2027 the year we stop performing and start actually living.
            </p>
          </div>
        </div>

        {/* Highlight bar + sign-off */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-teal-500 p-[2px]">
          <div className="rounded-2xl bg-stone-950 px-6 py-5 text-center">
            <p className="text-sm sm:text-base font-bold font-mono-code uppercase tracking-widest text-amber-300">
              Your slightly rebellious, light-hearted tour guide
            </p>
            <p className="mt-2 text-lg font-serif-display italic text-rose-200 flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
              with love, Amber
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
