// Mount-once gate for the Snoopster / AI consent screen.
//
// Listens for requestAiConsent() events and shows the modal — but only while
// the user's decision is still unknown, so nobody gets nagged twice.
// Accept and Decline both persist per user; declining never blocks the app,
// it just leaves AI features in their friendly disabled state.
//
// Snoopster himself is fully local — nothing you type to him ever leaves
// the app. The only writing that ever leaves is the personality
// diagnostic's Google Gemini fallback, and only with the user's yes.
//
// Mount once near the top level of the authenticated app:
//   <AiConsentGate userId={user.id} />
import React, { useState, useEffect, useCallback } from 'react';
import {
  AI_CONSENT_REQUEST_EVENT,
  getAiConsent,
  setAiConsent,
  setAiConsentUser
} from '../services/aiConsent';

interface Props {
  userId?: string | null;
}

// Snoopster's face — same avatar as the chat screen.
const SNOOPSTER_AVATAR = `${import.meta.env.BASE_URL}snoopster-avatar.jpg`;

export const AiConsentGate: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setAiConsentUser(userId ?? null);
  }, [userId]);

  useEffect(() => {
    const onRequest = () => {
      if (getAiConsent(userId) === 'unknown') setOpen(true);
    };
    window.addEventListener(AI_CONSENT_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(AI_CONSENT_REQUEST_EVENT, onRequest);
  }, [userId]);

  const decide = useCallback(
    (state: 'granted' | 'declined') => {
      setAiConsent(userId, state);
      setOpen(false);
    },
    [userId]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-title"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-[#ea4798]/40 bg-[#faf7f0] dark:bg-[#000a15] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <img src={SNOOPSTER_AVATAR} alt="Snoopster" className="h-10 w-10 rounded-xl object-cover" />
          <h2 id="ai-consent-title" className="text-lg font-black text-slate-900 dark:text-stone-100">
            A quick yes-or-no about Snoopster
          </h2>
        </div>

        <div className="space-y-3 text-sm text-slate-600 dark:text-stone-300">
          <p>
            <strong className="text-slate-900 dark:text-stone-100">Snoopster</strong> is the app&rsquo;s
            own local helper — built in, no outside service. What you type to
            him never leaves this app.
          </p>
          <p>
            Saying yes also lets the personality diagnostic use <strong className="text-slate-900 dark:text-stone-100">Google&nbsp;Gemini</strong> as
            a fallback when the local engine can&rsquo;t answer — that&rsquo;s the only
            writing that ever leaves the app, and only with your yes.
          </p>
          <p>
            Saying no is completely fine — the rest of the app works exactly the same, and those
            features will simply sit quietly until you change your mind.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => decide('granted')}
            className="w-full rounded-xl bg-gradient-to-r from-[#ea4798] to-[#60d0f8] px-4 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110"
          >
            Yes, enable Snoopster
          </button>
          <button
            onClick={() => decide('declined')}
            className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-stone-300 transition hover:border-slate-400"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
};
