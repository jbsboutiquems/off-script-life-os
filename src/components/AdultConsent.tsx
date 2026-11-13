// 18+ explicit-content consent (staged 2026-11-03, Amber's call).
// The world's music is explicit. Everywhere a user enters — signup, the
// World tab, the Broadcast panel — they must confirm 18+ and consent to
// explicit music/language. This is the FRONT-END gate; before any live
// deploy, the server must also store and verify birthday at signup —
// the API's emailRegister currently takes (email, username, password)
// only, so the birthday is validated in the UI and must be wired to the
// backend before this gate goes live.
import React, { useState } from 'react';

export function isAdult(birthday: string, today = new Date()): boolean {
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return false;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 18;
}

const KEY = 'offscript-18plus-consent';

export function hasAdultConsent(): boolean {
  try { return localStorage.getItem(KEY) === 'yes'; } catch { return false; }
}

export const ExplicitContentBanner: React.FC = () => (
  <p className="rounded-xl border-2 border-rose-600/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-800 dark:text-rose-200">
    18+ ONLY — This world and its broadcast contain explicit music and language.
    By entering, you confirm you are 18 or older and consent to explicit content.
  </p>
);

export const AdultConsentGate: React.FC<{ onConfirmed: () => void; onDeclined?: () => void }> = ({ onConfirmed, onDeclined }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/70 print:hidden" role="dialog" aria-modal="true" aria-labelledby="adult-consent-title">
      <div className="w-full max-w-md rounded-2xl border-2 border-rose-600/60 bg-[#faf7f0] dark:bg-[#000a15] p-6 shadow-2xl">
        <h2 id="adult-consent-title" className="text-lg font-black text-slate-900 dark:text-stone-100">18+ only — explicit content</h2>
        <p className="text-sm text-slate-600 dark:text-stone-300 mt-3">
          Off*Script's world broadcast plays regular, explicit music. There is no clean
          version, and songs are not auto-censored or auto-removed.
        </p>
        <label className="flex items-start gap-2 mt-4 text-sm font-bold text-slate-900 dark:text-stone-100">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1" />
          <span>I confirm I am 18 years or older, and I consent to explicit music and language in this app and world.</span>
        </label>
        <button
          disabled={!checked}
          onClick={() => { try { localStorage.setItem(KEY, 'yes'); } catch { /* gate */ } onConfirmed(); }}
          className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-amber-400 px-4 py-3 text-sm font-black text-white dark:text-stone-950 disabled:opacity-50"
        >
          I am 18+ — enter
        </button>
        {!checked && <p className="text-xs text-stone-500 mt-2">Tick the box to enter. Under 18s cannot enter this world.</p>}
        {/* Way out (finding 10): declining never records consent and never
            enters the world — it just hands the user back to wherever the
            caller sends them (e.g. the dashboard). The gate itself is
            unchanged: entry still needs the ticked confirmation. */}
        {onDeclined && (
          <button
            type="button"
            onClick={onDeclined}
            className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-2 transition-colors"
          >
            Not now — take me back
          </button>
        )}
      </div>
    </div>
  );
};
