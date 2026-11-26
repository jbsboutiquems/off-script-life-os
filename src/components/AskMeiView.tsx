// Ask Mei — the chat screen for the home-grown local Mei engine.
//
// The chat lives on the Intent screen (the 'mei' folder tab), where Mei
// already lives. The engine itself is fully local: messages go to
// POST /api/mei/chat and the reply comes back from the app's own server —
// nothing is sent to an outside AI.
//
// Memory: the server keeps each user's recent turns (meiHistory) and
// passes the last 20 to the engine, so Mei can pick up threads. There is
// no GET endpoint for that history, so this screen shows the current
// session only — and says plainly that Mei remembers, with a pointer to
// Settings → Ask Mei history where the history can be cleared. Deletion
// lives ONLY there.
//
// Gates (existing flows, nothing invented):
//   - AI consent (X-AI-Consent) is required server-side, so without it
//     the chat shows the consent prompt instead of sending. The decision
//     is made in the mounted AiConsentGate modal via requestAiConsent() /
//     reaskAiConsent().
//   - Not signed in: the app shell only renders this view when authed;
//     a 401 mid-chat still surfaces as a plain "session ended" line.
//   - Trial demo: the demo visitor has no account, so the chat is
//     replaced with a sign-up note instead of failing sends.
import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send, Sparkles, Loader2 } from 'lucide-react';
import { api, AuthError } from '../services/api';
import {
  AI_CONSENT_CHANGED_EVENT,
  getAiConsent,
  reaskAiConsent,
  requestAiConsent,
  type AiConsentState,
} from '../services/aiConsent';
import { TRIAL_DEMO } from '../lib/trialDemo';

interface ChatMessage {
  role: 'user' | 'mei';
  text: string;
}

interface Props {
  userId: string | null;
}

const STARTERS = [
  'Help me plan today',
  "I'm stuck",
  'Give me a dare',
];

export const AskMeiView: React.FC<Props> = ({ userId }) => {
  const [consent, setConsent] = useState<AiConsentState>(() => getAiConsent(userId));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The AiConsentGate modal decides elsewhere (requestAiConsent opens it);
  // refresh this view's state when the decision lands.
  useEffect(() => {
    const refresh = () => setConsent(getAiConsent(userId));
    refresh();
    window.addEventListener(AI_CONSENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(AI_CONSENT_CHANGED_EVENT, refresh);
  }, [userId]);

  // Keep the latest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending]);

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || sending) return;
    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setSending(true);
    try {
      const out = await api.askMei(text);
      if (!out) {
        setError('Mei couldn\'t answer that one — check your connection and try again.');
        return;
      }
      setMessages((prev) => [...prev, { role: 'mei', text: out.reply }]);
    } catch (e) {
      if (e instanceof AuthError) {
        setError('Your session ended — sign in again to keep chatting.');
      } else {
        setError('Mei couldn\'t answer that one — check your connection and try again.');
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea4798] to-[#60d0f8] text-white">
          <MessageSquareText className="w-5 h-5" />
        </span>
        <div>
          <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-600">
            Ask Mei · Chat
          </div>
          <h3 className="text-lg font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
            Talk it out with Mei
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Your own local Mei — pattern-matching, not a mind reader, and your
            words never leave the app. Mei remembers your recent chats so it
            can pick up threads; clear that memory anytime in Settings → Ask
            Mei history.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {TRIAL_DEMO ? (
          <div className="rounded-2xl border border-stone-300 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-5 text-center">
            <p className="text-sm font-bold text-slate-900 dark:text-cream-canvas">
              Ask Mei needs a free account.
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              You&rsquo;re browsing the demo — chatting with Mei, and the memory
              that comes with it, lives on your own account. Sign up free and
              come back here.
            </p>
          </div>
        ) : consent !== 'granted' ? (
          <div className="rounded-2xl border border-stone-300 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-5 text-center">
            <p className="text-sm font-bold text-slate-900 dark:text-cream-canvas">
              {consent === 'declined' ? 'Ask Mei is off.' : 'One quick yes-or-no first.'}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {consent === 'declined'
                ? 'You said no to AI features, so Mei sits quietly. Change your mind anytime.'
                : 'Before you chat, the app asks once whether AI features are okay with you. Saying no is completely fine — the rest of the app works exactly the same.'}
            </p>
            <button
              type="button"
              onClick={() => (consent === 'declined' ? reaskAiConsent(userId) : requestAiConsent())}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#ea4798] to-[#60d0f8] hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {consent === 'declined' ? 'Turn Ask Mei on' : 'Decide'}
            </button>
          </div>
        ) : (
          <>
            {/* Message list — this session only. Stored history lives
                server-side and shapes Mei's replies; it is not fetched
                here (no GET endpoint by design). */}
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
              {messages.length === 0 && !sending && (
                <div className="rounded-2xl bg-stone-50 dark:bg-white/5 p-4">
                  <p className="text-sm text-stone-700 dark:text-stone-200">
                    Say hi — ask for a plan, a dare, or just talk it out.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="px-3 py-1.5 text-xs font-bold rounded-full border-2 border-[#60d0f8]/50 text-[#0b6b8a] dark:text-[#60d0f8] hover:bg-[#60d0f8]/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#ea4798] to-[#60d0f8] text-white text-sm shadow-sm whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ea4798] to-[#60d0f8] text-white mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-stone-100 dark:bg-white/5 text-stone-800 dark:text-stone-100 text-sm whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  </div>
                ),
              )}
              {sending && (
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ea4798] to-[#60d0f8] text-white mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-stone-100 dark:bg-white/5 text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mei is thinking…
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-rose-300 dark:border-rose-700/50 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-start justify-between gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss"
                  className="shrink-0 font-black hover:opacity-70"
                >
                  ×
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send(input);
                }}
                disabled={sending}
                placeholder="Type a message…"
                aria-label="Message Mei"
                maxLength={2000}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border-2 border-stone-300 dark:border-white/15 bg-white dark:bg-[#000a15] text-sm text-slate-900 dark:text-cream-canvas placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-[#60d0f8] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-[#ea4798] to-[#60d0f8] text-white shadow-sm transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
