import React from 'react';

/**
 * WORLD WALLED OFF 2026-11-24 per Amber — the world doors stay visible,
 * but while WORLD_ENABLED is false, tapping one lands here instead of
 * the world: animated Amber with power tools, "Woman at work please
 * be patient". Reversible with the WORLD_ENABLED flag.
 */
export const WorldWalledOff: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-xl mx-auto space-y-4 text-center">
      <video
        src="/woman-at-work.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full aspect-square object-cover rounded-3xl border-2 border-stone-800 dark:border-amber-400/40 shadow-md"
      />
      <h2 className="text-2xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
        Woman at work — please be patient.
      </h2>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        The world is under construction. It'll be back when it's ready.
      </p>
      <button
        onClick={onBack}
        className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
      >
        ← Back to dashboard
      </button>
    </div>
  );
};
