import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { APK_DOWNLOAD_URL, TRIAL_DOWNLOAD_PROMPT_EVENT } from '../lib/trialDemo';

/**
 * The trial demo's one gate. Shown whenever a demo visitor tries
 * something that lives behind an account — posting, replying, DMing,
 * signing in. Looking around stays free; words take the app.
 *
 * Mounted only in trial builds (VITE_TRIAL_DEMO=1), driven by the
 * 'offscript:trial-download-prompt' window event (see lib/trialDemo).
 * This is a deliberate in-app modal, NOT an install popup: it appears
 * only when the visitor taps something gated, never on its own.
 */
export const TrialDownloadPrompt: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPrompt = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener(TRIAL_DOWNLOAD_PROMPT_EVENT, onPrompt);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(TRIAL_DOWNLOAD_PROMPT_EVENT, onPrompt);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-download-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl border-2 border-stone-800 dark:border-amber-400/50 bg-[#faf7f0] dark:bg-[#02142e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="trial-download-title"
            className="text-xl font-black font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas"
          >
            That part lives in the app.
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          You're in the free look-around demo — everything here browses.
          Posting, replying, and messaging happen in the app, where your
          account lives. The app is free. It's always been free.
        </p>
        <a
          href={APK_DOWNLOAD_URL}
          className="mt-5 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-sm font-black shadow-md transition-all"
        >
          <Download className="w-4 h-4" /> Download the free app
        </a>
        <button
          onClick={() => setOpen(false)}
          className="mt-2 w-full px-4 py-2.5 rounded-2xl text-sm font-bold text-stone-500 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-white/10 transition"
        >
          Keep looking around
        </button>
      </div>
    </div>
  );
};
