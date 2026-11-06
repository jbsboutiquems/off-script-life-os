/**
 * Minimal admin panel: find users and delete accounts.
 * Mounted only when the signed-in user is an admin (server-gated).
 */
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface DirUser {
  id: string;
  username: string;
}

export const AdminView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DirUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Admin-only count (2026-11-01): a number only, never a user list.
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<string | null>(null);

  useEffect(() => {
    api.getAdminAccountCount()
      .then((n) => setAccountCount(n))
      .catch(() => setCountError('Count unavailable — admins only, and the server must be running the new endpoint.'));
  }, []);

  const search = async (q: string) => {
    setQuery(q);
    setMessage(null);
    setError(null);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await api.getUserDirectory(q.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const removeUser = async (username: string) => {
    if (!window.confirm(`Delete @${username} and ALL of their data? This can't be undone.`)) return;
    setError(null);
    setMessage(null);
    try {
      const token = api.getToken();
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Delete failed.');
      setMessage(`@${username} deleted.`);
      setResults((r) => r.filter((u) => u.username !== username));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white dark:bg-[#02142e] border-2 border-rose-300 dark:border-rose-800/50 rounded-2xl p-6">
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-cream-canvas">
          <ShieldAlert className="w-5 h-5 text-rose-600" /> Admin — users
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Search accounts, delete them with all their data. Deletion is permanent.
        </p>
        <div className="mt-4 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 px-4 py-3">
          <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            Registered accounts
          </div>
          {countError ? (
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1">{countError}</p>
          ) : accountCount === null ? (
            <p className="text-xs text-stone-400 mt-1 font-mono-code">Loading…</p>
          ) : (
            <p className="text-2xl font-black text-slate-900 dark:text-cream-canvas mt-0.5">
              {accountCount}
              <span className="ml-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
                account{accountCount === 1 ? '' : 's'} — count only, no names or emails shown here.
              </span>
            </p>
          )}
          <p className="text-[11px] text-stone-400 mt-1 italic">
            Live in-memory count only until the Railway volume fix lands — a container restart resets it.
          </p>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search usernames… (2+ characters)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 text-sm font-bold"
          />
        </div>
        {message && <p className="mt-3 text-xs font-bold text-emerald-600">{message}</p>}
        {error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
        <div className="mt-3 space-y-2">
          {searching && <p className="text-xs text-stone-400 italic">Searching…</p>}
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
              <span className="text-sm font-bold">@{u.username}</span>
              <button
                onClick={() => removeUser(u.username)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white bg-rose-600 hover:bg-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
