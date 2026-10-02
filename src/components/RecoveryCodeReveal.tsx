import React, { useState } from 'react';
import { KeyRound, Copy, Check, TriangleAlert } from 'lucide-react';

interface RecoveryCodeRevealProps {
  code: string;
  context: 'register' | 'recover' | 'rotate';
  onDone: () => void;
  doneLabel: string;
}

const HEADLINES: Record<RecoveryCodeRevealProps['context'], { title: string; sub: string }> = {
  register: {
    title: 'Your recovery code. Do not skip this.',
    sub: 'This is the ONLY way back into your account if you forget your password. There is no email reset — this code is the reset.',
  },
  recover: {
    title: 'Password changed. Here is your NEW recovery code.',
    sub: 'The old code is dead. This new one is now the only way back in. Same drill: write it down.',
  },
  rotate: {
    title: 'Fresh recovery code, hot off the press.',
    sub: 'Your old code just retired. This is the only one that works now — and you will never see it again after this screen.',
  },
};

/**
 * Shows a recovery code exactly once, with a loud "write this down" warning
 * and a copy button. The plaintext is never stored anywhere after this.
 */
export const RecoveryCodeReveal: React.FC<RecoveryCodeRevealProps> = ({ code, context, onDone, doneLabel }) => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const copy = HEADLINES[context];

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard API can be unavailable; select-and-copy fallback below.
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md space-y-5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center border-2 border-stone-800 shadow-sm">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-display-punch text-slate-900 dark:text-cream-canvas">{copy.title}</h2>
        <p className="text-sm text-stone-600 dark:text-stone-300">{copy.sub}</p>
      </div>

      <button
        onClick={copyCode}
        title="Copy to clipboard"
        className="w-full bg-slate-950 dark:bg-black border-2 border-dashed border-amber-400/70 rounded-2xl px-4 py-5 text-center group hover:border-amber-300 transition-colors"
      >
        <div className="font-mono-code text-xl sm:text-2xl font-black tracking-[0.18em] text-amber-300 select-all">{code}</div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold font-mono-code uppercase tracking-wider text-stone-400 group-hover:text-amber-300">
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Tap to copy</>}
        </div>
      </button>

      <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 rounded-xl px-3 py-2.5">
        <TriangleAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong>Write this down somewhere that is not this screen</strong> — a password manager, a notebook, a sticky note in a drawer.
          You will never see it again. Lose both your password <em>and</em> this code, and the account is unrecoverable. That is the deal.
        </p>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer text-sm text-stone-700 dark:text-stone-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 w-4 h-4 accent-rose-600"
        />
        <span>I have written it down somewhere safe. I understand it will never be shown again.</span>
      </label>

      <button
        onClick={onDone}
        disabled={!confirmed}
        className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {doneLabel}
      </button>
    </div>
  );
};
