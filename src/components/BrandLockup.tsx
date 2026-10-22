import React from 'react';

/**
 * The current brand lockup (logo refresh 2026-10-15): "Life OS" on top,
 * "Off*Script" below as the hero in hot pink — gem colon, sparkle
 * asterisk, and shiny "Sparklets" twinkling around the wordmark
 * (styles in index.css). Deliberately year-free: editions change,
 * the name doesn't.
 */
export const BrandLockup: React.FC = () => (
  <h1 className="brand-lockup font-display-punch leading-none" aria-label="Life OS: Off*Script">
    <span className="block text-base font-black uppercase tracking-[0.35em] text-slate-900 dark:text-white">
      Life OS<span className="brand-gem" aria-hidden="true">:</span>
    </span>
    <span className="brand-lockup-hero block text-4xl font-black tracking-tight mt-1">
      Off<span className="brand-sparkle-star" aria-hidden="true">*</span>Script
    </span>
    <span className="sparklet sparklet-1" aria-hidden="true">✦</span>
    <span className="sparklet sparklet-2" aria-hidden="true">✦</span>
    <span className="sparklet sparklet-3" aria-hidden="true">✧</span>
  </h1>
);
