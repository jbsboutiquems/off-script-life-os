import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { Inbox, Send, Plus, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';

interface ThreadSummary {
  partnerId: string;
  partnerUsername: string;
  lastText: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
}

interface Dm {
  id: string;
  fromId: string;
  fromUsername: string;
  text: string;
  created_at: string;
}

interface InboxViewProps {
  user: UserProfile;
  myUserId: string;
  /** Called with the current total unread count so the dashboard bell stays live. */
  onUnreadChange?: (count: number) => void;
}

/**
 * One-to-one inbox. Polls every 30s and on window focus — no WebSockets in
 * this prototype, which is honest and fine for a small crew.
 */
export const InboxView: React.FC<InboxViewProps> = ({ myUserId, onUnreadChange }) => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<Dm[]>([]);
  const [draft, setDraft] = useState('');
  const [directory, setDirectory] = useState<{ id: string; username: string }[]>([]);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshThreads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const t = await api.getInboxThreads();
      setThreads(t);
      const total = t.reduce((n, x) => n + x.unread, 0);
      onUnreadChange?.(total);
      setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Could not load the inbox.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const openThread = async (summary: ThreadSummary) => {
    setActive(summary);
    try {
      const res = await api.getThread(summary.partnerId);
      setMessages(res.messages);
      refreshThreads(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load that thread.');
    }
  };

  const startThread = async (userId: string, username: string) => {
    setStarting(false);
    const summary: ThreadSummary = { partnerId: userId, partnerUsername: username, lastText: '', lastAt: '', lastFromMe: true, unread: 0 };
    setActive(summary);
    try {
      const res = await api.getThread(userId);
      setMessages(res.messages);
    } catch {
      setMessages([]);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    try {
      const msg = await api.sendDm(active.partnerId, text);
      setMessages((m) => [...m, msg]);
      refreshThreads(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that.');
    }
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm('Delete this message? It disappears for both of you.')) return;
    try {
      await api.deleteDm(id);
      setMessages((m) => m.filter((x) => x.id !== id));
      refreshThreads(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  useEffect(() => {
    refreshThreads();
    api.getUserDirectory().then(setDirectory).catch(() => {});
    const id = setInterval(() => {
      refreshThreads(true);
      if (active) api.getThread(active.partnerId).then((r) => setMessages(r.messages)).catch(() => {});
    }, 30000);
    const onFocus = () => refreshThreads(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas flex items-center gap-2">
            <Inbox className="w-6 h-6 text-indigo-600" /> Inbox
            {totalUnread > 0 && (
              <span className="text-xs font-black font-mono-code bg-rose-600 text-white rounded-full px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => { refreshThreads(); api.getUserDirectory().then(setDirectory).catch(() => {}); }}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setStarting(!starting)}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10"
              title="Start a new conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 italic font-serif-display">
          Private threads with your people. Polls quietly in the background — no WebSockets here.
        </p>
        {error && (
          <div className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/60 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {starting && (
        <div className="bg-white dark:bg-[#02142e] border border-stone-200 dark:border-white/10 rounded-xl p-4">
          <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-2">
            Start a conversation
          </p>
          {directory.length === 0 && (
            <p className="text-xs text-stone-400 italic">Nobody else is on this instance yet. Lonely — but peaceful.</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {directory.map((u) => (
              <button
                key={u.id}
                onClick={() => startThread(u.id, u.username)}
                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              >
                @{u.username}
              </button>
            ))}
          </div>
        </div>
      )}

      {!active ? (
        <div className="space-y-2">
          {loading && threads.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-6">Checking for notes…</p>
          )}
          {!loading && threads.length === 0 && (
            <div className="text-xs text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-white/15 rounded-xl px-4 py-8 text-center italic font-serif-display">
              No threads yet. Hit + and slide into someone's DMs like a civilized gremlin.
            </div>
          )}
          {threads.map((t) => (
            <button
              key={t.partnerId}
              onClick={() => openThread(t)}
              className="w-full text-left bg-white dark:bg-[#02142e] border border-stone-200 dark:border-white/10 rounded-xl p-4 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-sm text-slate-900 dark:text-cream-canvas flex items-center gap-2">
                  @{t.partnerUsername}
                  {t.unread > 0 && (
                    <span className="text-[10px] font-black font-mono-code bg-rose-600 text-white rounded-full px-1.5 py-0.5">
                      {t.unread}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 font-mono-code">
                  {t.lastAt ? new Date(t.lastAt).toLocaleDateString() : ''}
                </span>
              </div>
              {t.lastText && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 truncate">
                  {t.lastFromMe ? 'You: ' : ''}{t.lastText}
                </p>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#02142e] border border-stone-200 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5">
            <button
              onClick={() => { setActive(null); setMessages([]); refreshThreads(true); }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10"
              title="Back to threads"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-slate-900 dark:text-cream-canvas">@{active.partnerUsername}</span>
          </div>
          <div className="px-4 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-stone-400 italic text-center py-4">Say hi. First message is always the hardest.</p>
            )}
            {messages.map((m) => {
              const mine = m.fromId === myUserId;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm group relative ${
                      mine
                        ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white rounded-br-md'
                        : 'bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-stone-100 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <span className={`text-[9px] font-mono-code ${mine ? 'text-white/70' : 'text-stone-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {mine && (
                        <button
                          onClick={() => removeMessage(m.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 p-3 border-t border-stone-200 dark:border-white/10">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message @${active.partnerUsername}…`}
              maxLength={2000}
              className="flex-1 px-3 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-stone-50/50 dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
