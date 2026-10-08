import React, { useEffect, useState } from 'react';
import { ChevronDown, CircleHelp, MessageCircleQuestion, Send, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { FaqQuestion, UserProfile } from '../types';

interface FaqEntry {
  q: string;
  a: React.ReactNode;
}

const CURATED_ENTRIES: FaqEntry[] = [
  {
    q: 'Where can I print photos cheaply for my planner pages?',
    a: (
      <div className="space-y-3">
        <p>Standard 4x6 prints at store kiosks and instant pick-up — prices move around, so check the app before you go:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-stone-300 dark:border-white/20">
                <th className="py-2 pr-3 font-mono-code uppercase">Retailer</th>
                <th className="py-2 pr-3 font-mono-code uppercase">4x6 price</th>
                <th className="py-2 font-mono-code uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-white/10">
              <tr>
                <td className="py-2 pr-3 font-bold">Walmart Photo</td>
                <td className="py-2 pr-3">$0.18</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">Cheapest local instant option; 5x7 runs ~$1.28.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold">Walgreens Photo</td>
                <td className="py-2 pr-3">$0.29–$0.44</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">Promos frequently knock 40–50% off.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold">CVS Photo</td>
                <td className="py-2 pr-3">$0.42–$0.69</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">5x7 prints run ~$4.99.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold">Office Depot / Staples</td>
                <td className="py-2 pr-3">$0.68–$1.19</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">Color copies on standard paper; photo paper costs extra.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400">
          <li>Ordering through the store app for same-day pickup is usually cheaper than walking up to the kiosk with a USB drive.</li>
          <li>Walgreens and CVS almost always have a promo code on their site — check before you pay full price.</li>
          <li>Online services (Shutterfly, Snapfish, Amazon Photo) go as low as $0.09–$0.15 per print, but shipping makes a single print silly.</li>
        </ul>
        <p className="text-[11px] italic text-stone-500">Prices checked October 2026 — retailers change them whenever they feel like it.</p>
      </div>
    ),
  },
  {
    q: 'Is the app free?',
    a: (
      <p>
        Yes — the app is free. Optional expansions (monthly themes, holiday specials, zodiac, wedding) are paid extras.
        Community play stays free, always: pay for privacy and things, never for play.
      </p>
    ),
  },
  {
    q: 'The app says it is in test mode. What does that mean?',
    a: (
      <p>
        You're using a tester build. Things may break, look weird, or lose your data. That's the point —
        break it, then use the report-a-problem button to tell us what broke so we can fix it before launch.
      </p>
    ),
  },
];

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const FaqView: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [openCurated, setOpenCurated] = useState<number | null>(0);
  const [questions, setQuestions] = useState<FaqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = !!user?.is_admin;

  const refresh = async () => {
    try {
      setLoadError(null);
      setQuestions(await api.faqList());
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load the board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const ask = async () => {
    const q = draft.trim();
    if (!q || asking) return;
    setAsking(true);
    try {
      const created = await api.faqAsk(q);
      setQuestions((prev) => [created, ...prev]);
      setDraft('');
    } catch (e: any) {
      setLoadError(e?.message || 'Could not post your question.');
    } finally {
      setAsking(false);
    }
  };

  const answer = async (id: string) => {
    const text = (answers[id] || '').trim();
    if (!text || savingId) return;
    setSavingId(id);
    try {
      const updated = await api.faqAnswer(id, text);
      setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setAnswers((prev) => ({ ...prev, [id]: '' }));
    } catch (e: any) {
      setLoadError(e?.message || 'Could not save the answer.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.faqDelete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (e: any) {
      setLoadError(e?.message || 'Could not delete the question.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2da2ee] to-[#ea4798] text-white flex items-center justify-center border border-stone-800">
            <CircleHelp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold font-serif-display text-xl text-slate-900 dark:text-cream-canvas">FAQ</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Real questions, straight answers. No corporate fog.</p>
          </div>
        </div>
      </div>

      {/* Curated entries */}
      <div className="space-y-3">
        {CURATED_ENTRIES.map((entry, i) => {
          const isOpen = openCurated === i;
          return (
            <div key={i} className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCurated(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
              >
                <span className="font-bold text-sm text-slate-900 dark:text-cream-canvas">{entry.q}</span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{entry.a}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Community board */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center border border-stone-800">
            <MessageCircleQuestion className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold font-serif-display text-lg text-slate-900 dark:text-cream-canvas">Ask the crew</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Stuck on something? Ask here — the team answers.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
            placeholder="What's your question?"
            maxLength={500}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-white/20 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-cream-canvas placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={ask}
            disabled={asking || !draft.trim()}
            className="px-5 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" /> {asking ? 'Asking…' : 'Ask'}
          </button>
        </div>

        {loadError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{loadError}</p>
        )}

        <div className="space-y-3">
          {loading && <p className="text-xs text-stone-500 italic">Loading questions…</p>}
          {!loading && questions.length === 0 && (
            <p className="text-xs text-stone-500 italic">No questions yet — be the first.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-2 bg-[#faf8f4] dark:bg-white/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-cream-canvas">{q.question}</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {q.asker_name} · {timeAgo(q.created_at)}
                    {!q.answer && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">awaiting answer</span>}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(q.id)}
                    title="Delete question"
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {q.answer ? (
                <div className="pl-3 border-l-2 border-teal-500 text-sm text-stone-700 dark:text-stone-300">
                  <p>{q.answer}</p>
                  <p className="text-[11px] text-stone-500 mt-1">— {q.answered_by}{q.answered_at ? ` · ${timeAgo(q.answered_at)}` : ''}</p>
                </div>
              ) : isAdmin ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Write the answer…"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-white/20 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-cream-canvas placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => answer(q.id)}
                    disabled={savingId === q.id || !(answers[q.id] || '').trim()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {savingId === q.id ? 'Saving…' : 'Answer'}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
