import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { Megaphone, Send, Trash2, RefreshCw, Clock } from 'lucide-react';

interface WallPost {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
}

interface ChaosWallViewProps {
  user: UserProfile;
  myUserId: string;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * The Chaos Wall: "scream into the void, together."
 * Shared across all registered users on this instance. Prototype-grade:
 * no moderation queue — suited to a private/friends deployment, not a public one.
 */
export const ChaosWallView: React.FC<ChaosWallViewProps> = ({ myUserId }) => {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setPosts(await api.getWallPosts());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the wall.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const post = await api.postToWall(draft.trim());
      setPosts((p) => [post, ...p]);
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post.');
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Unscream this? It disappears for everyone.')) return;
    try {
      await api.deleteWallPost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-rose-600" /> The Chaos Wall
          </h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 italic font-serif-display">
          Scream into the void, together. Everyone on this instance can see and post here.
        </p>

        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What does the void need to hear today?"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2.5 border-2 border-stone-300 dark:border-white/15 rounded-xl bg-stone-50/50 dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas focus:outline-none focus:ring-2 focus:ring-rose-500 resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code text-stone-400">{draft.length}/500</span>
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> {posting ? 'Screaming…' : 'Scream it'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/60 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading && posts.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-6">Listening to the void…</p>
        )}
        {!loading && posts.length === 0 && (
          <div className="text-xs text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-white/15 rounded-xl px-4 py-8 text-center italic font-serif-display">
            The wall is blank. Be the first scream. Make it weird.
          </div>
        )}
        {posts.map((p) => (
          <article
            key={p.id}
            className="bg-white dark:bg-[#02142e] border border-stone-200 dark:border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {p.username.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-cream-canvas truncate">
                    {p.username}
                    {p.userId === myUserId && (
                      <span className="ml-1.5 text-[9px] font-mono-code uppercase tracking-wider text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">you</span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {relativeTime(p.created_at)}
                  </div>
                </div>
              </div>
              {p.userId === myUserId && (
                <button
                  onClick={() => remove(p.id)}
                  className="p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Delete your post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-sm text-stone-700 dark:text-stone-200 mt-2 whitespace-pre-wrap">{p.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
