import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { AtSign, Zap } from 'lucide-react';
import { RecoveryCodeReveal } from './RecoveryCodeReveal';
import { BrandLockup } from './BrandLockup';
import { isAdult } from './AdultConsent';

interface OAuthUsernameStepProps {
  pendingKey: string;
  provider: 'google' | 'facebook';
  onAuthed: (user: UserProfile) => void;
}

/**
 * Mandatory choose-your-username step after an OAuth first-time signup.
 * No account is created until this completes — there is no usable account
 * without a username. Birthday is collected here too: the OAuth providers
 * do not supply one, and the 18+ gate (2026-11-03, Amber's call) applies
 * to OAuth signups exactly like email signups — the server re-validates
 * the birthday and stores it on the account (server.ts validAdultDob).
 */
export const OAuthUsernameStep: React.FC<OAuthUsernameStepProps> = ({ pendingKey, provider, onAuthed }) => {
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [adultConsent, setAdultConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);

  const providerName = provider === 'google' ? 'Google' : 'Facebook';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuggestions([]);
    setBusy(true);
    try {
      if (!birthday) throw new Error('Birthday is required at signup — this app is 18+ only.');
      if (!isAdult(birthday)) throw new Error('You must be 18 or older to create an account.');
      if (!adultConsent) throw new Error('Tick the 18+ explicit-content consent box to sign up.');
      const result = await api.completeOAuthSignup(pendingKey, username.trim(), birthday);
      setPendingUser(result.user);
      setFreshCode(result.recoveryCode || null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Something went sideways. Try again.');
      if (err?.suggestions?.length) setSuggestions(err.suggestions);
    } finally {
      setBusy(false);
    }
  };

  if (freshCode && pendingUser) {
    return (
      <main className="min-h-screen bg-cream-canvas text-stone-900 flex items-center justify-center px-4 py-10 font-sans">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-stone-800 shadow-md">
              ⚡
            </div>
            <BrandLockup />
          </div>
          <RecoveryCodeReveal
            code={freshCode}
            context="register"
            doneLabel="Saved it — enter the khaos"
            onDone={() => onAuthed(pendingUser)}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-canvas text-stone-900 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-stone-800 shadow-md">
            ⚡
          </div>
          <h1 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas">
            Almost in.
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {providerName} vouched for you. Now the important part: pick the name the void will know you by.
            This is what shows on the Khaos Wall and in inboxes — choose like it matters.
          </p>
        </div>

        <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="oauth-username" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Choose your username
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="oauth-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. feral_operator"
                  autoComplete="username"
                  aria-label="Choose your username"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-stone-50/50 dark:bg-white/5 text-slate-900 dark:text-cream-canvas font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-mono-code">
                3–24 characters: letters, numbers, _ or -. One per human, no take-backsies (well, 3 per day).
              </p>
            </div>

            <div>
              <label htmlFor="oauth-birthday" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Birthday <span className="font-normal text-stone-400">(required — 18+ only)</span>
              </label>
              <input
                id="oauth-birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                autoComplete="bday"
                aria-label="Birthday"
                required
                className="w-full px-3 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-stone-50/50 dark:bg-white/5 text-slate-900 dark:text-cream-canvas font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <label className="flex items-start gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
              <input type="checkbox" checked={adultConsent} onChange={(e) => setAdultConsent(e.target.checked)} required className="mt-0.5" />
              <span>I am 18 years or older and I consent to explicit music and language in Off*Script. Our music is explicit.</span>
            </label>

            {error && (
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/60 rounded-xl px-3 py-2.5">
                {error}
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setUsername(s); setError(null); setSuggestions([]); }}
                        className="px-2 py-1 bg-white dark:bg-white/10 border border-rose-300 dark:border-rose-700 rounded-lg font-mono-code text-[11px] hover:bg-rose-100 dark:hover:bg-white/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || username.trim().length < 3}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {busy ? 'Claiming…' : 'Claim it and enter'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
