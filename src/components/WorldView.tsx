import React, { useState } from 'react';
import { Globe, ExternalLink, RefreshCw } from 'lucide-react';
import { WORLD_INBETWEEN_ORIGIN } from '../lib/worldContract';

/**
 * The Inbetween doorway — STAGED ONLY (2026-11-01).
 *
 * This is a DOORWAY, not a connection. The Inbetween is Cue's world
 * (a Cloudflare Worker, another AI's original); this view does not edit
 * it, does not sync with it, and does not claim to.
 *
 * Honesty label, kept verbatim until login + real data sync are live and
 * verified (they are not, as of this staging): "LIVE PLAYTEST · APP NOT
 * CONNECTED". In playtest the world is solo / local-only: no Wall/DM
 * sync, no Familiar sync, no Beast sync, no Intent, no add-on sync.
 * Admission and trial rules are unchanged: a visit here never logs a
 * user in, never admits them, and never opts them into world sync.
 *
 * Embedding: an iframe to the world origin first. The world sent no
 * X-Frame-Options and no Content-Security-Policy frame-ancestors header
 * on 2026-11-01, so framing is not header-blocked. If the frame still
 * fails to load (browser/webview policy, world-side change, offline),
 * the "Open the Inbetween" button opens it in a new tab / system
 * browser instead. There is NO proxy, NO framing-header workaround,
 * and NO copy of world content into the app. No token is passed to the
 * world, and the user is never asked to paste one.
 */
export const WorldView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [frameFailed, setFrameFailed] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  const openExternal = () => {
    window.open(WORLD_INBETWEEN_ORIGIN, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-600">
              LIVE PLAYTEST · APP NOT CONNECTED
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1">
              The Inbetween
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-2xl">
              A doorway into Cue&apos;s playtest world — the Flight Deck Commons,
              Missions, and your Innie. In playtest the world is solo and
              local-only: what you do there stays in that browser for now.
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
              Not live yet: app login from the world, Wall or DM sync, Familiar
              or Beast sync, Intent, or add-on sync. Visiting here does not
              log you in, admit you, or opt you into sync — those need a
              separate, approved step.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={openExternal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              Open the Inbetween
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </section>

      {frameFailed ? (
        <section className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/50 rounded-3xl p-6 text-center">
          <Globe className="w-8 h-8 mx-auto text-amber-600" />
          <h3 className="mt-2 font-bold text-slate-900 dark:text-cream-canvas">
            The world didn&apos;t load inside the app
          </h3>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            That happens when a browser or webview blocks the frame, or the
            world is unreachable. Nothing was changed in the app or the world
            to work around it — open it in a browser instead.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              onClick={openExternal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open the Inbetween in a browser
            </button>
            <button
              onClick={() => { setFrameFailed(false); setFrameKey((k) => k + 1); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try the frame again
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-stone-200 dark:border-white/10">
            <p className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Inbetween playtest · embedded doorway
            </p>
            <button
              onClick={() => setFrameFailed(true)}
              className="text-[11px] font-bold text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-300 underline underline-offset-2"
            >
              Frame not showing? Use the browser version →
            </button>
          </div>
          <iframe
            key={frameKey}
            title="The Inbetween — playtest world"
            src={WORLD_INBETWEEN_ORIGIN}
            className="w-full h-[70vh] min-h-[480px] border-0"
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            referrerPolicy="no-referrer"
          />
          <p className="px-4 py-2 text-[11px] text-stone-400 dark:text-stone-500">
            If the world looks blank, use “Open the Inbetween” above — the
            world itself is unchanged, and this frame adds no login or sync.
          </p>
        </section>
      )}
    </div>
  );
};
