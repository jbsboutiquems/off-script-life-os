import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { Megaphone, Send, Trash2, RefreshCw, Clock, MessageCircle, Pin, PinOff } from 'lucide-react';

interface WallReply {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
}

interface WallPost {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
  replies: WallReply[];
  reactions: Record<string, string[]>;
  pinned: boolean;
}

interface KhaosWallViewProps {
  user: UserProfile;
  myUserId: string;
}

const REACTION_MENU = ['❤️', '🔥', '😂', '😮', '👏', '💀'];

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

const PostCard: React.FC<{
  post: WallPost;
  myUserId: string;
  onUpdate: (post: WallPost) => void;
  onDelete: (id: string) => void;
}> = ({ post, myUserId, onUpdate, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const mine = post.userId === myUserId;

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyDraft.trim()) return;
    try {
      const reply = await api.replyToWallPost(post.id, replyDraft.trim());
      onUpdate({ ...post, replies: [...post.replies, reply] });
      setReplyDraft('');
      setShowReplies(true);
    } catch { /* ignore */ }
  };

  const removeReply = async (replyId: string) => {
    try {
      await api.deleteWallReply(post.id, replyId);
      onUpdate({ ...post, replies: post.replies.filter(r => r.id !== replyId) });
    } catch { /* ignore */ }
  };

  const react = async (emoji: string) => {
    try {
      const { reactions } = await api.toggleWallReaction(post.id, emoji);
      onUpdate({ ...post, reactions });
    } catch { /* ignore */ }
    setShowReactions(false);
  };

  const togglePin = async () => {
    try {
      const { pinned } = await api.toggleWallPin(post.id);
      onUpdate({ ...post, pinned });
    } catch { /* ignore */ }
  };

  return (
    <article className={`bg-white dark:bg-[#02142e] border rounded-xl p-4 ${post.pinned ? 'border-amber-400 dark:border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]' : 'border-stone-200 dark:border-white/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0">
            {post.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-cream-canvas truncate">
              {post.pinned && <Pin className="w-3 h-3 inline mr-1 -mt-0.5 text-amber-500" />}
              {post.username}
              {mine && (
                <span className="ml-1.5 text-[9px] font-mono-code uppercase tracking-wider text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">you</span>
              )}
            </div>
            <div className="text-[10px] text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {relativeTime(post.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {mine && (
            <button
              onClick={togglePin}
              className="p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title={post.pinned ? 'Unpin' : 'Pin to top'}
            >
              {post.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}
          {mine && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete your post"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-stone-700 dark:text-stone-200 mt-2 whitespace-pre-wrap">{post.text}</p>

      {/* Reactions */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowReactions(s => !s)}
            className="text-lg leading-none p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10"
            title="React"
          >😊</button>
          {showReactions && (
            <div className="absolute bottom-full mb-1 left-0 flex gap-1 p-1.5 rounded-xl bg-white dark:bg-[#0e1c30] border-2 border-stone-200 dark:border-white/10 shadow-xl z-20">
              {REACTION_MENU.map(e => (
                <button key={e} onClick={() => react(e)} className="text-xl hover:scale-125 transition">{e}</button>
              ))}
            </div>
          )}
        </div>
        {Object.entries(post.reactions).map(([emoji, userIds]) => (
          <button
            key={emoji}
            onClick={() => react(emoji)}
            className={`text-xs font-bold px-2 py-1 rounded-full border transition ${userIds.includes(myUserId) ? 'border-[#ea4798] bg-[#ea4798]/10 text-[#ea4798]' : 'border-stone-200 dark:border-white/10 text-stone-500'}`}
          >
            {emoji} {userIds.length}
          </button>
        ))}
        <button
          onClick={() => setShowReplies(s => !s)}
          className="ml-auto flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.replies.length > 0 ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
        </button>
      </div>

      {/* Thread */}
      {showReplies && (
        <div className="mt-3 pl-3 border-l-2 border-stone-200 dark:border-white/10 space-y-2.5">
          {post.replies.map(r => (
            <div key={r.id} className="text-sm">
              <span className="font-bold text-slate-900 dark:text-cream-canvas">{r.username}</span>
              {r.userId === myUserId && (
                <button onClick={() => removeReply(r.id)} className="ml-2 text-[10px] text-stone-400 hover:text-rose-500 underline">delete</button>
              )}
              <span className="text-[10px] text-stone-400 ml-2">{relativeTime(r.created_at)}</span>
              <p className="text-stone-700 dark:text-stone-200 whitespace-pre-wrap">{r.text}</p>
            </div>
          ))}
          <form onSubmit={submitReply} className="flex gap-2">
            <input
              value={replyDraft}
              onChange={e => setReplyDraft(e.target.value)}
              placeholder="Reply…"
              maxLength={500}
              className="flex-1 px-3 py-1.5 text-sm border border-stone-200 dark:border-white/10 rounded-xl bg-stone-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button type="submit" disabled={!replyDraft.trim()} className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

/**
 * The Khaos Wall: "scream into the void, together."
 * Threads, reactions, and pins included. Prototype-grade moderation:
 * suited to a private/friends deployment, not a public one.
 */
export const KhaosWallView: React.FC<KhaosWallViewProps> = ({ myUserId }) => {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const raw = await api.getWallPosts();
      setPosts(raw.map((p: any) => ({
        ...p,
        replies: Array.isArray(p.replies) ? p.replies : [],
        reactions: p.reactions && typeof p.reactions === 'object' ? p.reactions : {},
        pinned: !!p.pinned,
      })));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const post: any = await api.postToWall(draft.trim());
      setPosts((p) => [{ ...post, replies: [], reactions: {}, pinned: false }, ...p]);
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

  const updatePost = (updated: WallPost) => {
    setPosts(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      return next.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.created_at.localeCompare(a.created_at);
      });
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-rose-600" /> The Khaos Wall
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
          <PostCard key={p.id} post={p} myUserId={myUserId} onUpdate={updatePost} onDelete={remove} />
        ))}
      </div>
    </div>
  );
};
